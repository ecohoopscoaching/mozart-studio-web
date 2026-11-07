import { DEFAULT_ARTIST_ID } from "@/canon/artists";
import { DEFAULT_PRODUCER_ID } from "@/canon/producers";
import { FORMATS, type FormatId, type Locks, type Project, type Topic, type Track } from "@/domain/types";

export const ARCS = [
  "sets the scene",
  "names the pressure",
  "shows the daily cost",
  "turns the decision",
  "faces the other person",
  "tells the truth out loud",
  "sits with the consequence",
  "finds one small win",
  "looks back without lying",
  "chooses what stays",
  "lets one detail prove the day",
  "changes the rhythm of the day",
  "asks for a smaller promise",
  "keeps the promise specific",
  "ends on a clear last picture",
];

const TURNS = [
  "whether to walk back in",
  "what gets said in the morning",
  "who is owed the last dollar",
  "which call goes unanswered",
  "what the child heard from the next room",
  "whether pride is worth the late fee",
  "who gets the apology first",
  "what stays in the group chat",
  "whether the old friend still has a key",
  "which shift gets dropped",
  "what the receipt actually proves",
  "who leaves the porch first",
  "whether the celebration can be simple",
  "what grief looks like on a weekday",
  "which promise is small enough to keep",
];

export function emptyTopic(sentence = ""): Topic {
  return {
    workingTitle: titleFrom(sentence),
    centralIdea: sentence.trim(),
    purpose: "",
    listener: "",
    narrator: "first person",
    characters: "",
    placeTime: "",
    pressures: "",
    conflict: "",
    arc: "",
    scenes: "",
    emotion: "",
    images: "",
    facts: "",
    avoid: "",
    sourceNotes: "",
  };
}

export function titleFrom(sentence: string): string {
  const words = sentence.replace(/\s+/g, " ").trim().split(" ").filter(Boolean).slice(0, 6);
  if (!words.length) return "Untitled song";
  return words.map((word) => word[0]?.toUpperCase() + word.slice(1)).join(" ");
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const EMPTY_LOCKS: Locks = { lyrics: false, production: false, voice: false, story: false };

export function createProject(input: {
  sentence: string;
  format: FormatId;
  instrumental?: boolean;
  artistId?: string;
  producerId?: string;
  now?: string;
  trackSeeds?: Array<{ purpose?: string; conflict?: string; scenes?: string }>;
}): Project {
  const now = input.now ?? new Date().toISOString();
  const count = FORMATS[input.format].tracks;
  const sentence = input.sentence.trim();
  const base = emptyTopic(sentence);
  const title = titleFrom(sentence);
  const tracks: Track[] = Array.from({ length: count }, (_, index) => {
    const topic: Topic = {
      ...base,
      arc: ARCS[index] ?? ARCS[0],
      purpose: input.trackSeeds?.[index]?.purpose || `This song ${ARCS[index] ?? "moves the story"}.`,
      conflict: input.trackSeeds?.[index]?.conflict || TURNS[index] || TURNS[0],
      scenes: input.trackSeeds?.[index]?.scenes || `Scene ${index + 1}: ${sentence}`,
    };
    return {
      id: newId(),
      number: index + 1,
      title: count === 1 ? title : `${title} · ${index + 1}`,
      instrumental: Boolean(input.instrumental),
      testMode: false,
      topic,
      artistId: input.artistId || DEFAULT_ARTIST_ID,
      producerId: input.producerId || DEFAULT_PRODUCER_ID,
      brief: null,
      lyrics: "",
      prompt: "",
      locks: { ...EMPTY_LOCKS },
      history: [],
      decisions: [],
      answers: {},
      generation: { status: "empty", label: "" },
      arc: ARCS[index] ?? ARCS[0],
    };
  });
  return {
    id: newId(),
    title,
    format: input.format,
    sentence,
    instrumentalProject: Boolean(input.instrumental),
    artistId: input.artistId || DEFAULT_ARTIST_ID,
    producerId: input.producerId || DEFAULT_PRODUCER_ID,
    topic: base,
    tracks,
    sources: [],
    customArtists: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function touch(project: Project, now = new Date().toISOString()): Project {
  return { ...project, updatedAt: now };
}
