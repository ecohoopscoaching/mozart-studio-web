import { getArtist } from "@/canon/artists";
import { getProducer } from "@/canon/producers";
import { writeLyrics } from "@/domain/lyrics";
import { buildSoundPrompt, pendingDecisions } from "@/domain/prompt";
import type { ComposeInput, ComposeResult, CreativeBrief, Issue, Project, Track } from "@/domain/types";
import { validateTrack } from "@/domain/validate";

export const DEMO_LABEL = "DEMO sample output";

export function buildBrief(input: ComposeInput, notes: string[]): CreativeBrief {
  const incomplete = input.artist.incomplete.length ? `Incomplete canon: ${input.artist.incomplete.join(" ")}` : "";
  const review = [
    input.testMode
      ? "Batch-test mode is on for this track only: 92 BPM neutral bed, male vocal tag, 16 lines, prompt ceiling 1000. This is not the studio default."
      : "Studio defaults are in effect. The batch-test beat is off.",
    ...notes,
    input.sources.some((s) => s.selected) ? "Selected sources are research. Reference verses are not copied into the lyric." : "",
    incomplete,
    input.artist.conflicts.join(" "),
    "House order: kick, snare, hats, 808 and bass, then melodic layers. One paragraph.",
  ]
    .filter(Boolean)
    .join(" ");
  return {
    purpose: `Song ${input.trackNumber} of ${input.trackCount} ${input.arc}. ${input.topic.centralIdea}`,
    feel: input.artist.vocal.emotionalFeel || "Feel is incomplete for this voice.",
    sound: input.producer.internal
      ? `Internal preset. The real-person name stays in the studio library and out of the prompt. Musical notes: ${input.producer.desc}`
      : `${input.producer.name} is a studio label and stays out of the copied prompt. Musical notes: ${input.producer.desc}`,
    voice: `${input.artist.vocal.instrument} Protected character: ${input.artist.vocal.protectedCharacter}. ${input.artist.vocal.registerMap} ${input.artist.vocal.extra}`.trim(),
    movement: `This track ${input.arc}. The drums stay in front. The section change is about this track's decision, not a copy of the previous song.`,
    review,
  };
}

export function composeTrack(input: ComposeInput): ComposeResult {
  const notes: string[] = [];
  const written = writeLyrics(input.artist, input.topic, input.arc, input.seed, input.instrumental, input.testMode, input.sources);
  if (written.note) notes.push(written.note);
  const decisions = pendingDecisions(input);
  const prompt = buildSoundPrompt(input, notes);
  const brief = buildBrief(input, notes);
  const draft: Track = {
    id: "draft",
    number: input.trackNumber,
    title: input.topic.workingTitle,
    instrumental: input.instrumental,
    testMode: input.testMode,
    topic: input.topic,
    artistId: input.artist.id,
    producerId: input.producer.id,
    brief,
    lyrics: written.lyrics,
    prompt,
    locks: { lyrics: false, production: false, voice: false, story: false },
    history: [],
    decisions,
    answers: input.answers,
    generation: { status: "demo", label: DEMO_LABEL },
    arc: input.arc,
  };
  const issues: Issue[] = [
    ...decisions.map((decision) => ({
      code: `decision:${decision.id}`,
      severity: "decision" as const,
      message: decision.question,
      fix: "Choose one option. The other choices stay as they are.",
    })),
    ...validateTrack(draft, input.artist),
  ];
  return { lyrics: written.lyrics, prompt, brief, issues, decisions, notes };
}

export function composeProjectTrack(project: Project, track: Track, seed: number): ComposeResult {
  const artist = getArtist(track.artistId, project.customArtists);
  const producer = getProducer(track.producerId);
  if (!artist || !producer) {
    return {
      lyrics: track.lyrics,
      prompt: track.prompt,
      brief: track.brief ?? {
        purpose: "",
        feel: "",
        sound: "",
        voice: "",
        movement: "",
        review: "Artist or producer is missing.",
      },
      issues: [
        {
          code: "missing-persona",
          severity: "block",
          message: "The artist or producer on this track is not in the library.",
          fix: "Pick a voice and a producer, then write the track again.",
        },
      ],
      decisions: [],
      notes: [],
    };
  }
  return composeTrack({
    artist,
    producer,
    topic: track.topic,
    instrumental: track.instrumental,
    testMode: track.testMode,
    seed,
    trackNumber: track.number,
    trackCount: project.tracks.length,
    arc: track.arc,
    answers: track.answers,
    sources: project.sources.filter((source) => source.selected),
  });
}

export interface BatchResult {
  tracks: Track[];
  failedNumbers: number[];
}

export function generateAllTracks(project: Project, options?: { failOnNumber?: number; now?: string }): BatchResult {
  const now = options?.now ?? new Date().toISOString();
  const failedNumbers: number[] = [];
  const tracks = project.tracks.map((track) => {
    if (options?.failOnNumber === track.number) {
      failedNumbers.push(track.number);
      return {
        ...track,
        generation: {
          status: "failed" as const,
          label: DEMO_LABEL,
          error: `Simulated failure on track ${track.number}. Completed tracks were kept.`,
        },
      };
    }
    try {
      const composed = composeProjectTrack(project, track, hashSeed(project.id, track.number));
      return {
        ...track,
        lyrics: composed.lyrics,
        prompt: composed.prompt,
        brief: composed.brief,
        decisions: composed.decisions,
        generation: { status: "demo" as const, label: DEMO_LABEL },
      };
    } catch (error) {
      failedNumbers.push(track.number);
      return {
        ...track,
        generation: {
          status: "failed" as const,
          label: DEMO_LABEL,
          error: error instanceof Error ? error.message : "This track failed.",
        },
      };
    }
  });
  void now;
  return { tracks, failedNumbers };
}

export function hashSeed(projectId: string, trackNumber: number): number {
  let hash = trackNumber * 997;
  for (let i = 0; i < projectId.length; i += 1) hash = (hash + projectId.charCodeAt(i) * (i + 1)) >>> 0;
  return hash || 1;
}
