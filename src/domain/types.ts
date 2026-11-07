export const FORMATS = {
  single: { id: "single", label: "Single", tracks: 1, blurb: "One song" },
  ep: { id: "ep", label: "EP", tracks: 6, blurb: "Six songs" },
  lp: { id: "lp", label: "LP", tracks: 10, blurb: "Ten songs" },
  mixtape: { id: "mixtape", label: "Mixtape", tracks: 15, blurb: "Fifteen songs" },
} as const;

export type FormatId = keyof typeof FORMATS;

export const VOCAL_ENDING =
  "Natural human vocal with real breaths and small imperfections, never thin, never squeaky, never robotic pitch correction, never autotune sheen, never the same generic voice as every other song.";

export const LYRICS_MAX = 3000;
export const PROMPT_MAX = 10000;
export const TEST_PROMPT_MAX = 1000;

export const ALLOWED_HEADERS = [
  "Verse 1",
  "Verse 2",
  "Verse 3",
  "Pre-Chorus",
  "Chorus",
  "Hook",
  "Bridge",
  "Final Chorus",
  "Outro",
] as const;

export type LockKey = "lyrics" | "production" | "voice" | "story";
export type RevisionVariable = LockKey | "tempo" | "hook" | "mood" | "restore";

export interface Topic {
  workingTitle: string;
  centralIdea: string;
  purpose: string;
  listener: string;
  narrator: string;
  characters: string;
  placeTime: string;
  pressures: string;
  conflict: string;
  arc: string;
  scenes: string;
  emotion: string;
  images: string;
  facts: string;
  avoid: string;
  sourceNotes: string;
  /** Optional character-inspiration note. Absent on older saved songs. */
  inspiration?: TopicInspiration;
}

export interface TopicInspiration {
  mode: "single" | "collision" | "random";
  characterIds: string[];
  concept: string;
  hook?: string;
  sourceLabel: "documented-example" | "generated-combination" | "single-character" | "random-inspiration";
  documentedFlagship?: string;
}

export interface CreativeBrief {
  purpose: string;
  feel: string;
  sound: string;
  voice: string;
  movement: string;
  review: string;
}

export interface TrackVersion {
  id: string;
  createdAt: string;
  variable: RevisionVariable | "edit";
  summary: string;
  lyrics: string;
  prompt: string;
  brief: CreativeBrief;
  topic: Topic;
}

export interface DecisionOption {
  id: string;
  label: string;
}

export interface Decision {
  id: string;
  question: string;
  options: DecisionOption[];
}

export type IssueSeverity = "block" | "warn" | "decision";

export interface Issue {
  code: string;
  severity: IssueSeverity;
  message: string;
  fix: string;
}

export interface SourceDoc {
  id: string;
  filename: string;
  status: "ready" | "empty" | "failed";
  failureReason?: string;
  pageCount?: number;
  text: string;
  limitations: string[];
  selected: boolean;
}

export interface ArtistVocal {
  instrument: string;
  protectedCharacter: string;
  registerMap: string;
  emotionalFeel: string;
  extra: string;
  /** Documented outside the optional batch test. Null when the book does not state it. */
  genderWord: string | null;
}

export type ArtistRole =
  | "writing-identity"
  | "rnb-lane"
  | "executive"
  | "fictional-artist"
  | "batch-test";

export interface Artist {
  id: string;
  name: string;
  role: ArtistRole;
  /** Singers offered on the simple path. Batch-test identities stay behind More. */
  simpleChoice: boolean;
  oneLine: string;
  lane: string;
  regionPhrase: string | null;
  suggestedProducerId: string | null;
  pairingNote: string | null;
  cleanLanguage: boolean;
  neverRap: boolean;
  /** Do not force sung melodies or falsetto. */
  rapOnly: boolean;
  allowFalsetto: boolean;
  coldOpen: boolean;
  banWordPatterns: string[];
  tempoRange: [number, number] | null;
  writingDevices: string[];
  vocal: ArtistVocal;
  /** Original fragment the demo writer always includes so the pen is audible. */
  lyricMarker: string;
  incomplete: string[];
  conflicts: string[];
  provenance: string[];
  custom: boolean;
}

export interface Producer {
  id: string;
  num: number;
  name: string;
  tag: string;
  internal: boolean;
  foundation: string;
  desc: string;
}

export interface Locks {
  lyrics: boolean;
  production: boolean;
  voice: boolean;
  story: boolean;
}

export interface Track {
  id: string;
  number: number;
  title: string;
  instrumental: boolean;
  testMode: boolean;
  topic: Topic;
  artistId: string;
  producerId: string;
  brief: CreativeBrief | null;
  lyrics: string;
  prompt: string;
  locks: Locks;
  history: TrackVersion[];
  decisions: Decision[];
  answers: Record<string, string>;
  generation: {
    status: "empty" | "demo" | "live" | "failed";
    label: string;
    error?: string;
    liveDeniedReason?: string;
  };
  arc: string;
}

export interface Project {
  id: string;
  title: string;
  format: FormatId;
  sentence: string;
  instrumentalProject: boolean;
  artistId: string;
  producerId: string;
  topic: Topic;
  tracks: Track[];
  sources: SourceDoc[];
  customArtists: Artist[];
  createdAt: string;
  updatedAt: string;
}

export interface ComposeInput {
  artist: Artist;
  producer: Producer;
  topic: Topic;
  instrumental: boolean;
  testMode: boolean;
  seed: number;
  trackNumber: number;
  trackCount: number;
  arc: string;
  answers: Record<string, string>;
  sources: SourceDoc[];
}

export interface ComposeResult {
  lyrics: string;
  prompt: string;
  brief: CreativeBrief;
  issues: Issue[];
  decisions: Decision[];
  notes: string[];
}
