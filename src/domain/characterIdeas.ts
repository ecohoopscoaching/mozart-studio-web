import {
  BIBLE_PROVENANCE,
  CHARACTERS,
  DOCUMENTED_COLLISIONS,
  MASTER_FORMULA,
  SHARED_TEMPLATE,
  documentedCollision,
  getCharacter,
  type CharacterCard,
} from "@/canon/character-bible";
import { createProject, emptyTopic } from "@/domain/project";
import { FORMATS, type FormatId, type Project, type Topic, type TopicInspiration } from "@/domain/types";

export const IDEA_COUNTS = { concepts: 20, hooks: 10, albums: 5 } as const;

export const SCORE_LABEL = "DEMO heuristic score";
export const SCORE_NOTE =
  "A studio drafting estimate. Not a measured audience result, not a chart prediction, and not live analysis.";

const OPENINGS = [
  "A night nurse sits in the clinic parking lot with the engine off",
  "A father counts the rent twice while the kids finish cereal",
  "A mother irons a graduation gown in a laundromat",
  "A warehouse picker stays for overtime and misses pickup",
  "Two old friends miss the same bus in a light rain",
  "A bartender closes the bar and still has one text unsent",
  "A son quizzes his mother in the car before an appointment",
  "A home aide runs from a double into the first ten minutes of night class",
  "A coach puts a quiet kid on the last play",
  "Siblings split a handwritten recipe on the porch",
  "A supervisor covers every call and eats lunch at the desk",
  "A rideshare driver waits out the airport queue",
  "A cashier counts the drawer while the manager watches the door",
  "A new hire reads a layoff rumor on the break-room fridge",
  "A church basement host stacks chairs after the meeting",
  "A school custodian locks the gym and hears the team still laughing",
  "A line cook takes the last bus with sauce still on a sleeve",
  "A tenant tapes a rent receipt inside a kitchen cabinet",
  "A security guard walks the mall after the stores go dark",
  "A daycare closer buckles one last car seat in the lot",
];

const OBJECTS = [
  "a cold coffee",
  "a cracked phone",
  "a folded receipt",
  "an unopened text",
  "a spare key",
  "a name tag",
  "a bus pass",
  "an overtime slip",
  "a lunch bag",
  "a tip jar",
  "a scanner gun",
  "a foil pan",
  "an interview folder",
  "a parking ticket",
  "a church program",
  "a graduation cap",
  "an orange vest",
  "a tin of index cards",
  "a schedule screenshot",
  "a pair of work shoes",
];

export interface HeuristicScore {
  originality: number;
  emotion: number;
  commercialAppeal: number;
  storytelling: number;
  label: typeof SCORE_LABEL;
  note: typeof SCORE_NOTE;
}

export interface RapConcept {
  text: string;
  score: HeuristicScore;
}

export interface AlbumConcept {
  format: FormatId;
  title: string;
  summary: string;
  trackLines: string[];
}

export interface IdeaPack {
  mode: "single" | "collision" | "random";
  generationMode: "demo";
  label: "DEMO sample output";
  formula: string;
  characters: CharacterCard[];
  documented: {
    coreThemes: string[];
    primaryConflicts: string[];
    flagshipRapTopics: string[];
  };
  psychologicalWound: {
    inPdf: false;
    interpretation: string;
  };
  universalTheme: {
    documentedCoreThemes: string[];
    interpretation: string;
  };
  modernLifeApplication: string;
  collision: {
    topic: string;
    source: "documented-example" | "generated-combination";
  } | null;
  concepts: RapConcept[];
  hooks: string[];
  albums: AlbumConcept[];
  sharedTemplateNote: string;
  provenance: string;
  safetyNote: string;
}

export class IdeaSelectionError extends Error {}

function hash(text: string): number {
  let value = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function scoreFor(key: string): HeuristicScore {
  const n = hash(key);
  const band = (shift: number) => 4 + ((n >>> shift) % 6);
  return {
    originality: band(0),
    emotion: band(5),
    commercialAppeal: band(10),
    storytelling: band(15),
    label: SCORE_LABEL,
    note: SCORE_NOTE,
  };
}

function containsName(text: string, name: string): boolean {
  return new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text);
}

function turn(theme: string, conflict: string, object: string, index: number): string {
  const themeWord = theme.toLowerCase();
  const conflictWord = conflict.toLowerCase();
  const lines = [
    `and ${object} is still in reach while ${conflictWord} stays the part they will not say`,
    `trying to keep ${themeWord} from costing the person who packed ${object}`,
    `because ${conflictWord} showed up in an ordinary room, not a legend`,
    `and the win feels smaller once ${object} reminds them who is waiting`,
    `where ${themeWord} looks like duty until ${conflictWord} asks for a name`,
    `holding ${object} like proof that ${conflictWord} already has a bill`,
    `and nobody in the room calls ${themeWord} by a movie name`,
    `deciding if ${conflictWord} gets another hour or the bus ride home`,
  ];
  return lines[index % lines.length] ?? lines[0];
}

export function modernConcept(characters: CharacterCard[], index: number): string {
  const opening = OPENINGS[index % OPENINGS.length] ?? OPENINGS[0];
  const object = OBJECTS[(index * 3 + characters.length) % OBJECTS.length] ?? OBJECTS[0];
  const theme = characters.map((card) => card.coreTheme).join(" and ");
  const conflict = characters.map((card) => card.primaryConflict).join(" and ");
  const sentence = `${opening}, ${turn(theme, conflict, object, index + characters[0].name.length)}.`;
  for (const card of characters) {
    if (containsName(sentence, card.name)) {
      throw new IdeaSelectionError("A concept named the film character. Rewrite it as a life, not a costume.");
    }
  }
  return sentence;
}

function interpretationWound(characters: CharacterCard[]): string {
  const conflicts = characters.map((card) => card.primaryConflict.toLowerCase()).join(" and ");
  return `Studio reading, not in the PDF: the ache under ${conflicts}. The book prints theme, conflict, and flagship topic. It does not print a separate psychological wound.`;
}

function albumsFor(title: string, concepts: string[]): AlbumConcept[] {
  const take = (count: number, start: number) => concepts.slice(start, start + count);
  return [
    {
      format: "single",
      title,
      summary: `One song about ${concepts[0]}`,
      trackLines: take(1, 0),
    },
    {
      format: "ep",
      title: `${title} · six rooms`,
      summary: "Six different days. Same human truth. No repeated scene.",
      trackLines: take(6, 0),
    },
    {
      format: "lp",
      title: `${title} · ten chapters`,
      summary: "Ten songs that move from the first cost to a smaller promise.",
      trackLines: take(10, 0),
    },
    {
      format: "mixtape",
      title: `${title} · fifteen takes`,
      summary: "Fifteen specific situations. The voice stays a separate choice.",
      trackLines: take(15, 0),
    },
    {
      format: "ep",
      title: `${title} · the other six`,
      summary: "A second EP using the next six situations, not a copy of the first.",
      trackLines: take(6, 6),
    },
  ];
}

function hooksFor(concepts: string[]): string[] {
  const kinds = ["Anthem", "Confession", "Caution", "Push", "Story", "Anthem", "Confession", "Caution", "Push", "Story"];
  return concepts.slice(0, 10).map((concept, index) => {
    const piece = concept.split(",")[0] ?? concept;
    return `${kinds[index]}: ${piece}.`;
  });
}

export function buildIdeaPack(characters: CharacterCard[], mode: IdeaPack["mode"]): IdeaPack {
  if (characters.length < 1 || characters.length > 2) {
    throw new IdeaSelectionError("Choose one character, or two different characters.");
  }
  if (characters.length === 2 && characters[0].id === characters[1].id) {
    throw new IdeaSelectionError("A collision needs two different characters.");
  }
  const concepts = Array.from({ length: IDEA_COUNTS.concepts }, (_, index) => {
    const text = modernConcept(characters, index);
    return { text, score: scoreFor(`${characters.map((card) => card.id).join("+")}:${index}:${text}`) };
  });
  const unique = new Set(concepts.map((item) => item.text));
  if (unique.size !== IDEA_COUNTS.concepts) {
    throw new IdeaSelectionError("Concept list repeated itself. Nothing was shipped.");
  }
  const collision =
    characters.length === 2
      ? documentedCollision(characters[0].id, characters[1].id) ?? {
          topic: `${characters[0].coreTheme} Beside ${characters[1].coreTheme}`,
          source: "generated-combination" as const,
        }
      : null;
  const flagship = collision?.topic ?? characters[0].flagshipRapTopic;
  const realPerson = characters.some((card) => card.realPersonPortrayal);
  return {
    mode,
    generationMode: "demo",
    label: "DEMO sample output",
    formula: MASTER_FORMULA,
    characters,
    documented: {
      coreThemes: characters.map((card) => card.coreTheme),
      primaryConflicts: characters.map((card) => card.primaryConflict),
      flagshipRapTopics: characters.map((card) => card.flagshipRapTopic),
    },
    psychologicalWound: { inPdf: false, interpretation: interpretationWound(characters) },
    universalTheme: {
      documentedCoreThemes: characters.map((card) => card.coreTheme),
      interpretation: `Plain-language reading of the documented theme, not a new canon line: ${characters.map((card) => card.coreTheme.toLowerCase()).join(" meeting ")} in an ordinary life.`,
    },
    modernLifeApplication: concepts[0]?.text ?? "",
    collision: collision ? { topic: collision.topic, source: collision.source } : null,
    concepts,
    hooks: hooksFor(concepts.map((item) => item.text)),
    albums: albumsFor(flagship, concepts.map((item) => item.text)),
    sharedTemplateNote: SHARED_TEMPLATE.note,
    provenance: BIBLE_PROVENANCE,
    safetyNote: realPerson
      ? "At least one name is a film portrayal of a real person. The PDF does not give a biography. Do not invent facts about that person or about the user. The song stays a metaphor."
      : "Film characters are topic inspiration only. They are not vocal personas, and the lyric should not name them or quote a script.",
  };
}

export interface IdeaRequest {
  mode: "single" | "collision" | "random";
  characterIds?: string[];
  seed?: number;
}

export function resolveCharacters(request: IdeaRequest): { characters: CharacterCard[]; mode: IdeaPack["mode"] } {
  if (request.mode === "random") {
    const seed = request.seed ?? 1;
    const card = CHARACTERS[seed % CHARACTERS.length];
    if (!card) throw new IdeaSelectionError("The character library is empty.");
    return { characters: [card], mode: "random" };
  }
  const ids = request.characterIds ?? [];
  if (request.mode === "single") {
    if (ids.length !== 1) throw new IdeaSelectionError("Pick one character.");
    const card = getCharacter(ids[0] ?? "");
    if (!card) throw new IdeaSelectionError("That character is not in the 30-card library.");
    return { characters: [card], mode: "single" };
  }
  if (ids.length !== 2) throw new IdeaSelectionError("Pick two different characters.");
  if (ids[0] === ids[1]) throw new IdeaSelectionError("A collision needs two different characters.");
  const cards = ids.map((id) => getCharacter(id));
  if (cards.some((card) => !card)) throw new IdeaSelectionError("That character is not in the 30-card library.");
  return { characters: cards as CharacterCard[], mode: "collision" };
}

export function generateIdeas(request: IdeaRequest): IdeaPack {
  const resolved = resolveCharacters(request);
  return buildIdeaPack(resolved.characters, resolved.mode);
}

export function randomPair(seed: number): [string, string] {
  const first = seed % CHARACTERS.length;
  let second = (seed * 7 + 3) % CHARACTERS.length;
  if (second === first) second = (second + 1) % CHARACTERS.length;
  return [CHARACTERS[first]!.id, CHARACTERS[second]!.id];
}

export interface IdeaSelection {
  pack: IdeaPack;
  conceptIndex: number;
  hook: string;
  albumIndex: number | null;
}

export function topicFromSelection(selection: IdeaSelection): Topic {
  const concept = selection.pack.concepts[selection.conceptIndex];
  if (!concept) throw new IdeaSelectionError("Pick one of the rap concepts.");
  const album = selection.albumIndex === null ? null : selection.pack.albums[selection.albumIndex];
  const topic = emptyTopic(concept.text);
  const names = selection.pack.characters.map((card) => card.name).join(" + ");
  const flagship = selection.pack.collision?.topic ?? selection.pack.documented.flagshipRapTopics[0];
  const inspiration: TopicInspiration = {
    mode: selection.pack.mode,
    characterIds: selection.pack.characters.map((card) => card.id),
    concept: concept.text,
    hook: selection.hook,
    sourceLabel: selection.pack.collision?.source ?? (selection.pack.mode === "random" ? "random-inspiration" : "single-character"),
    documentedFlagship: flagship,
  };
  return {
    ...topic,
    purpose: album ? `${album.title}. ${album.summary}` : flagship ?? "",
    emotion: selection.pack.documented.coreThemes.join(", "),
    conflict: selection.pack.documented.primaryConflicts.join(", "),
    images: selection.hook,
    pressures: selection.pack.universalTheme.interpretation,
    facts: `Documented in the PDF: theme ${selection.pack.documented.coreThemes.join(" / ")}; conflict ${selection.pack.documented.primaryConflicts.join(" / ")}; flagship ${selection.pack.documented.flagshipRapTopics.join(" / ")}.`,
    avoid: "Do not name the film character, quote a script, copy lyrics, or invent a biography.",
    sourceNotes: `${names} is topic inspiration, not the vocal persona. ${selection.pack.psychologicalWound.interpretation} ${selection.pack.safetyNote} ${selection.pack.provenance}`,
    inspiration,
  };
}

export function projectFromSelection(
  selection: IdeaSelection,
  prefs: { artistId?: string; producerId?: string; instrumental?: boolean },
): Project {
  const album = selection.albumIndex === null ? null : selection.pack.albums[selection.albumIndex];
  const format: FormatId = album?.format ?? "single";
  const topic = topicFromSelection(selection);
  const count = FORMATS[format].tracks;
  const lines = album?.trackLines ?? [];
  const trackSeeds = Array.from({ length: count }, (_, index) => ({
    purpose: lines[index] ? `Song ${index + 1}: ${lines[index]}` : undefined,
    scenes: lines[index] ?? topic.centralIdea,
    conflict: selection.pack.documented.primaryConflicts.join(", "),
  }));
  const project = createProject({
    sentence: topic.centralIdea,
    format,
    artistId: prefs.artistId,
    producerId: prefs.producerId,
    instrumental: prefs.instrumental,
    trackSeeds,
  });
  project.topic = topic;
  project.tracks = project.tracks.map((track) => ({
    ...track,
    topic: {
      ...track.topic,
      ...topic,
      centralIdea: topic.centralIdea,
      arc: track.arc,
      conflict: track.topic.conflict,
      scenes: track.topic.scenes,
      purpose: track.topic.purpose,
      inspiration: topic.inspiration,
    },
  }));
  return project;
}

export function addProjectPreserving(existing: Project[], project: Project): Project[] {
  return [project, ...existing.map((item) => ({ ...item }))];
}

export const DOCUMENTED_COLLISION_COUNT = DOCUMENTED_COLLISIONS.length;
