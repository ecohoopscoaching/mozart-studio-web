import { getArtist } from "@/canon/artists";
import { getProducer } from "@/canon/producers";
import { composeTrack } from "@/domain/compose";
import { newId } from "@/domain/project";
import type { Issue, Project, RevisionVariable, Track, TrackVersion } from "@/domain/types";

const LOCK_FOR: Record<RevisionVariable, keyof Track["locks"] | null> = {
  lyrics: "lyrics",
  production: "production",
  voice: "voice",
  story: "story",
  tempo: "production",
  hook: "lyrics",
  mood: "story",
  restore: null,
};

export function applyRevision(project: Project, track: Track, variables: RevisionVariable[], note: string, now = new Date().toISOString()): { track: Track; issues: Issue[]; plan: string[] } {
  const unique = [...new Set(variables)];
  if (unique.length !== 1) {
    const plan = unique.map((variable, index) => `${index + 1}. Change only ${variable}. ${note || "Say what that one change is."}`);
    return {
      track,
      plan,
      issues: [
        {
          code: "one-variable",
          severity: "block",
          message: "A revision changes one thing at a time.",
          fix: plan.join(" "),
        },
      ],
    };
  }
  const variable = unique[0];
  const lock = LOCK_FOR[variable];
  if (lock && track.locks[lock]) {
    return {
      track,
      plan: [],
      issues: [
        {
          code: "locked",
          severity: "block",
          message: `${label(variable)} is locked.`,
          fix: "Unlock it before this revision, or revise a different variable.",
        },
      ],
    };
  }
  const artist = getArtist(track.artistId, project.customArtists);
  const producer = getProducer(track.producerId);
  if (!artist || !producer) {
    return {
      track,
      plan: [],
      issues: [{ code: "missing-persona", severity: "block", message: "Missing artist or producer.", fix: "Pick both, then revise." }],
    };
  }
  const snapshot: TrackVersion = {
    id: newId(),
    createdAt: now,
    variable,
    summary: `Before changing ${label(variable)}. ${note}`.trim(),
    lyrics: track.lyrics,
    prompt: track.prompt,
    brief: track.brief ?? { purpose: "", feel: "", sound: "", voice: "", movement: "", review: "" },
    topic: track.topic,
  };
  let next: Track = { ...track, history: [...track.history, snapshot] };
  const detail = note.trim() || `Adjusted ${label(variable)} only.`;
  if (variable === "lyrics" || variable === "hook") {
    const line = variable === "hook" ? `Hook revision: ${detail}` : `Lyric revision: ${detail}`;
    next = { ...next, lyrics: track.instrumental ? "" : `${track.lyrics}\n${line}`.trim() };
  } else if (variable === "story" || variable === "mood") {
    next = {
      ...next,
      topic: {
        ...track.topic,
        conflict: `${track.topic.conflict} ${detail}`.trim(),
        emotion: variable === "mood" ? detail : track.topic.emotion,
      },
      brief: track.brief
        ? { ...track.brief, purpose: `${track.brief.purpose} Story revision: ${detail}`, review: `${track.brief.review} Lyrics and the sound prompt were not rewritten.` }
        : track.brief,
    };
  } else if (variable === "voice") {
    next = retargetPrompt(project, next, `${detail} The vocal sits one step closer and drier than the previous pass.`, "voice");
  } else if (variable === "production" || variable === "tempo") {
    next = retargetPrompt(project, next, `${detail} Hat pattern is one step tighter than the previous pass.`, variable);
  }
  next.generation = { ...next.generation, label: next.generation.label || "DEMO sample output" };
  return { track: next, issues: [], plan: [] };
}

function retargetPrompt(project: Project, track: Track, sentence: string, variable: "voice" | "production" | "tempo"): Track {
  const artist = getArtist(track.artistId, project.customArtists);
  const producer = getProducer(track.producerId);
  if (!artist || !producer || !track.prompt) return track;
  const composed = composeTrack({
    artist,
    producer,
    topic: track.topic,
    instrumental: track.instrumental,
    testMode: track.testMode,
    seed: track.number,
    trackNumber: track.number,
    trackCount: project.tracks.length,
    arc: track.arc,
    answers: track.answers,
    sources: project.sources,
  });
  if (!composed.prompt) return { ...track, prompt: track.prompt, brief: composed.brief };
  const endingIndex = track.instrumental ? composed.prompt.length : composed.prompt.lastIndexOf("Natural human vocal");
  const head = composed.prompt.slice(0, endingIndex).trim();
  const tail = composed.prompt.slice(endingIndex).trim();
  const insert = variable === "voice" ? sentence : sentence;
  const prompt = [head, insert, tail].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  return {
    ...track,
    prompt,
    brief: composed.brief
      ? { ...composed.brief, review: `${composed.brief.review} One-variable ${variable} revision: ${sentence}` }
      : track.brief,
  };
}

export function restoreVersion(track: Track, versionId: string, now = new Date().toISOString()): Track {
  const version = track.history.find((item) => item.id === versionId);
  if (!version) return track;
  const snapshot: TrackVersion = {
    id: newId(),
    createdAt: now,
    variable: "restore",
    summary: "Before restoring an older version.",
    lyrics: track.lyrics,
    prompt: track.prompt,
    brief: track.brief ?? version.brief,
    topic: track.topic,
  };
  return {
    ...track,
    lyrics: version.lyrics,
    prompt: version.prompt,
    brief: version.brief,
    topic: version.topic,
    history: [...track.history, snapshot],
  };
}

function label(variable: RevisionVariable): string {
  if (variable === "tempo") return "tempo";
  if (variable === "hook") return "the hook";
  if (variable === "mood") return "mood";
  return variable;
}
