/** Topic cards from The 30 Character Rap Topic Generator Bible (12 pages).
 * The PDF is not stored in this repo. Only the fields it actually prints are canon.
 * Psychological wound is a formula step the PDF does not fill in.
 */

export interface CharacterCard {
  id: string;
  name: string;
  coreTheme: string;
  primaryConflict: string;
  flagshipRapTopic: string;
  /** App safety flag. The PDF does not say who is a real person. */
  realPersonPortrayal: boolean;
}

export const BIBLE_PROVENANCE =
  "The 30 Character Rap Topic Generator Bible, 12 pages. Topic inspiration only. The PDF is not in this public repo.";

export const MASTER_FORMULA =
  "Character -> Psychological Wound -> Universal Theme -> Modern Life Application -> Rap Topic";

export const SHARED_TEMPLATE = {
  songAngles: ["Ambition", "loyalty", "identity", "pressure", "relationships", "status", "consequences", "growth"],
  hookIdeas:
    "Create an anthem, confession, cautionary tale, motivational record, or narrative story song from the character arc.",
  albumPotential: "Use the character as a metaphor rather than direct references. Extract the human truth underneath the story.",
  note: "Song angles, hook instructions, and album potential are the same paragraph on every card. They are template directions, not a unique fact about one character.",
};

export const CHARACTERS: CharacterCard[] = [
  { id: "tony-montana", name: "Tony Montana", coreTheme: "Ambition", primaryConflict: "Fear of losing power", flagshipRapTopic: "The Cost of Winning", realPersonPortrayal: false },
  { id: "michael-corleone", name: "Michael Corleone", coreTheme: "Power", primaryConflict: "Family vs empire", flagshipRapTopic: "Leadership Is Lonely", realPersonPortrayal: false },
  { id: "darth-vader", name: "Darth Vader", coreTheme: "Control", primaryConflict: "Fear of loss", flagshipRapTopic: "Holding Too Tight", realPersonPortrayal: false },
  { id: "batman", name: "Batman", coreTheme: "Trauma", primaryConflict: "Isolation", flagshipRapTopic: "Nobody Checks On The Strong One", realPersonPortrayal: false },
  { id: "joker", name: "Joker", coreTheme: "Rejection", primaryConflict: "Belonging", flagshipRapTopic: "Created By Rejection", realPersonPortrayal: false },
  { id: "neo", name: "Neo", coreTheme: "Awakening", primaryConflict: "Truth", flagshipRapTopic: "Who Lied To Us", realPersonPortrayal: false },
  { id: "rocky-balboa", name: "Rocky Balboa", coreTheme: "Perseverance", primaryConflict: "Failure", flagshipRapTopic: "One More Round", realPersonPortrayal: false },
  { id: "maximus", name: "Maximus", coreTheme: "Honor", primaryConflict: "Revenge", flagshipRapTopic: "Honor Never Dies", realPersonPortrayal: false },
  { id: "frank-lucas", name: "Frank Lucas", coreTheme: "Empire", primaryConflict: "Competition", flagshipRapTopic: "Quiet King", realPersonPortrayal: true },
  { id: "jordan-belfort", name: "Jordan Belfort", coreTheme: "Success", primaryConflict: "Addiction", flagshipRapTopic: "Never Enough", realPersonPortrayal: true },
  { id: "daniel-plainview", name: "Daniel Plainview", coreTheme: "Obsession", primaryConflict: "Human connection", flagshipRapTopic: "Built It Alone", realPersonPortrayal: false },
  { id: "john-wick", name: "John Wick", coreTheme: "Consequences", primaryConflict: "Peace", flagshipRapTopic: "The Sleeping Monster", realPersonPortrayal: false },
  { id: "the-bride", name: "The Bride", coreTheme: "Vengeance", primaryConflict: "Identity", flagshipRapTopic: "Take My Name Back", realPersonPortrayal: false },
  { id: "william-wallace", name: "William Wallace", coreTheme: "Freedom", primaryConflict: "Oppression", flagshipRapTopic: "Unchained", realPersonPortrayal: false },
  { id: "achilles", name: "Achilles", coreTheme: "Legacy", primaryConflict: "Being forgotten", flagshipRapTopic: "Immortal Names", realPersonPortrayal: false },
  { id: "leonidas", name: "Leonidas", coreTheme: "Courage", primaryConflict: "Defeat", flagshipRapTopic: "Last Stand", realPersonPortrayal: false },
  { id: "harvey-dent", name: "Harvey Dent", coreTheme: "Duality", primaryConflict: "Corruption", flagshipRapTopic: "Two Sides", realPersonPortrayal: false },
  { id: "tyler-durden", name: "Tyler Durden", coreTheme: "Identity", primaryConflict: "Conformity", flagshipRapTopic: "Burn The Mask", realPersonPortrayal: false },
  { id: "hannibal-lecter", name: "Hannibal Lecter", coreTheme: "Intellect", primaryConflict: "Boredom", flagshipRapTopic: "Mental Warfare", realPersonPortrayal: false },
  { id: "v", name: "V", coreTheme: "Revolution", primaryConflict: "Tyranny", flagshipRapTopic: "Ideas Survive", realPersonPortrayal: false },
  { id: "alonzo-harris", name: "Alonzo Harris", coreTheme: "Authority", primaryConflict: "Exposure", flagshipRapTopic: "Power Addict", realPersonPortrayal: false },
  { id: "andy-dufresne", name: "Andy Dufresne", coreTheme: "Hope", primaryConflict: "Despair", flagshipRapTopic: "Long Game", realPersonPortrayal: false },
  { id: "chris-gardner", name: "Chris Gardner", coreTheme: "Fatherhood", primaryConflict: "Poverty", flagshipRapTopic: "Keep Going", realPersonPortrayal: true },
  { id: "travis-bickle", name: "Travis Bickle", coreTheme: "Alienation", primaryConflict: "Connection", flagshipRapTopic: "Invisible Crowd", realPersonPortrayal: false },
  { id: "wolverine", name: "Wolverine", coreTheme: "Pain", primaryConflict: "Loneliness", flagshipRapTopic: "Scars That Heal", realPersonPortrayal: false },
  { id: "patrick-bateman", name: "Patrick Bateman", coreTheme: "Status", primaryConflict: "Emptiness", flagshipRapTopic: "Perfect Mask", realPersonPortrayal: false },
  { id: "henry-hill", name: "Henry Hill", coreTheme: "Temptation", primaryConflict: "Consequences", flagshipRapTopic: "Fast Life Fast Fall", realPersonPortrayal: true },
  { id: "tommy-devito", name: "Tommy DeVito", coreTheme: "Ego", primaryConflict: "Disrespect", flagshipRapTopic: "Short Fuse", realPersonPortrayal: false },
  { id: "furiosa", name: "Furiosa", coreTheme: "Liberation", primaryConflict: "Captivity", flagshipRapTopic: "Road To Freedom", realPersonPortrayal: false },
  { id: "captain-miller", name: "Captain Miller", coreTheme: "Duty", primaryConflict: "Sacrifice", flagshipRapTopic: "Carry The Weight", realPersonPortrayal: false },
];

export interface DocumentedCollision {
  characterIds: [string, string];
  topic: string;
  source: "documented-example";
}

export const DOCUMENTED_COLLISIONS: DocumentedCollision[] = [
  { characterIds: ["michael-corleone", "batman"], topic: "Heavy Is The Crown", source: "documented-example" },
  { characterIds: ["darth-vader", "rocky-balboa"], topic: "Fighting Yourself", source: "documented-example" },
  { characterIds: ["joker", "neo"], topic: "Who Lied To Us", source: "documented-example" },
  { characterIds: ["achilles", "jordan-belfort"], topic: "Addicted To Greatness", source: "documented-example" },
  { characterIds: ["frank-lucas", "daniel-plainview"], topic: "Empire Builders", source: "documented-example" },
  { characterIds: ["batman", "wolverine"], topic: "Men Who Carry Pain", source: "documented-example" },
];

export function getCharacter(id: string): CharacterCard | undefined {
  return CHARACTERS.find((card) => card.id === id);
}

export function pairKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

export function documentedCollision(a: string, b: string): DocumentedCollision | undefined {
  const key = pairKey(a, b);
  return DOCUMENTED_COLLISIONS.find((item) => pairKey(item.characterIds[0], item.characterIds[1]) === key);
}
