import { describe, expect, it } from "vitest";
import { CHARACTERS, DOCUMENTED_COLLISIONS } from "@/canon/character-bible";
import {
  DOCUMENTED_COLLISION_COUNT,
  IDEA_COUNTS,
  SCORE_LABEL,
  addProjectPreserving,
  generateIdeas,
  projectFromSelection,
  randomPair,
} from "@/domain/characterIdeas";
import { createProject } from "@/domain/project";
import { VOCAL_ENDING } from "@/domain/types";
import { validatePrompt } from "@/domain/validate";

const PDF_ROWS: Array<[string, string, string, string]> = [
  ["Tony Montana", "Ambition", "Fear of losing power", "The Cost of Winning"],
  ["Michael Corleone", "Power", "Family vs empire", "Leadership Is Lonely"],
  ["Darth Vader", "Control", "Fear of loss", "Holding Too Tight"],
  ["Batman", "Trauma", "Isolation", "Nobody Checks On The Strong One"],
  ["Joker", "Rejection", "Belonging", "Created By Rejection"],
  ["Neo", "Awakening", "Truth", "Who Lied To Us"],
  ["Rocky Balboa", "Perseverance", "Failure", "One More Round"],
  ["Maximus", "Honor", "Revenge", "Honor Never Dies"],
  ["Frank Lucas", "Empire", "Competition", "Quiet King"],
  ["Jordan Belfort", "Success", "Addiction", "Never Enough"],
  ["Daniel Plainview", "Obsession", "Human connection", "Built It Alone"],
  ["John Wick", "Consequences", "Peace", "The Sleeping Monster"],
  ["The Bride", "Vengeance", "Identity", "Take My Name Back"],
  ["William Wallace", "Freedom", "Oppression", "Unchained"],
  ["Achilles", "Legacy", "Being forgotten", "Immortal Names"],
  ["Leonidas", "Courage", "Defeat", "Last Stand"],
  ["Harvey Dent", "Duality", "Corruption", "Two Sides"],
  ["Tyler Durden", "Identity", "Conformity", "Burn The Mask"],
  ["Hannibal Lecter", "Intellect", "Boredom", "Mental Warfare"],
  ["V", "Revolution", "Tyranny", "Ideas Survive"],
  ["Alonzo Harris", "Authority", "Exposure", "Power Addict"],
  ["Andy Dufresne", "Hope", "Despair", "Long Game"],
  ["Chris Gardner", "Fatherhood", "Poverty", "Keep Going"],
  ["Travis Bickle", "Alienation", "Connection", "Invisible Crowd"],
  ["Wolverine", "Pain", "Loneliness", "Scars That Heal"],
  ["Patrick Bateman", "Status", "Emptiness", "Perfect Mask"],
  ["Henry Hill", "Temptation", "Consequences", "Fast Life Fast Fall"],
  ["Tommy DeVito", "Ego", "Disrespect", "Short Fuse"],
  ["Furiosa", "Liberation", "Captivity", "Road To Freedom"],
  ["Captain Miller", "Duty", "Sacrifice", "Carry The Weight"],
];

describe("character bible source", () => {
  it("keeps all 30 PDF rows exact", () => {
    expect(CHARACTERS).toHaveLength(30);
    expect(PDF_ROWS).toHaveLength(30);
    PDF_ROWS.forEach(([name, theme, conflict, flagship], index) => {
      expect(CHARACTERS[index]?.name).toBe(name);
      expect(CHARACTERS[index]?.coreTheme).toBe(theme);
      expect(CHARACTERS[index]?.primaryConflict).toBe(conflict);
      expect(CHARACTERS[index]?.flagshipRapTopic).toBe(flagship);
    });
  });
});

describe("idea packs", () => {
  it("makes 20 concepts, 10 hooks, and 5 albums with honest demo scores", () => {
    const pack = generateIdeas({ mode: "single", characterIds: ["batman"] });
    expect(pack.concepts).toHaveLength(IDEA_COUNTS.concepts);
    expect(pack.hooks).toHaveLength(IDEA_COUNTS.hooks);
    expect(pack.albums).toHaveLength(IDEA_COUNTS.albums);
    expect(new Set(pack.concepts.map((item) => item.text)).size).toBe(20);
    expect(pack.concepts.every((item) => item.score.label === SCORE_LABEL)).toBe(true);
    expect(pack.concepts.every((item) => item.score.note.toLowerCase().includes("not live"))).toBe(true);
    expect(pack.label).toBe("DEMO sample output");
    expect(pack.psychologicalWound.inPdf).toBe(false);
    expect(pack.psychologicalWound.interpretation).toMatch(/not in the PDF/i);
    expect(pack.concepts.map((item) => item.text).join(" ")).not.toMatch(/\bBatman\b/);
    const scores = new Set(pack.concepts.map((item) => item.score.originality));
    expect(scores.size).toBeGreaterThan(1);
  });

  it("does not repeat one character's concepts on another character", () => {
    const batman = generateIdeas({ mode: "single", characterIds: ["batman"] }).concepts.map((item) => item.text);
    const rocky = generateIdeas({ mode: "single", characterIds: ["rocky-balboa"] }).concepts.map((item) => item.text);
    expect(batman.filter((line) => rocky.includes(line))).toHaveLength(0);
    expect(batman.join(" ")).not.toMatch(/in the modern world/i);
  });

  it("refuses a collision with the same character twice", () => {
    expect(() => generateIdeas({ mode: "collision", characterIds: ["neo", "neo"] })).toThrow(/two different/i);
  });

  it("keeps the six documented collisions and labels new pairs as generated", () => {
    expect(DOCUMENTED_COLLISION_COUNT).toBe(6);
    const expected = [
      ["michael-corleone", "batman", "Heavy Is The Crown"],
      ["darth-vader", "rocky-balboa", "Fighting Yourself"],
      ["joker", "neo", "Who Lied To Us"],
      ["achilles", "jordan-belfort", "Addicted To Greatness"],
      ["frank-lucas", "daniel-plainview", "Empire Builders"],
      ["batman", "wolverine", "Men Who Carry Pain"],
    ] as const;
    expect(DOCUMENTED_COLLISIONS).toHaveLength(6);
    for (const [a, b, topic] of expected) {
      const forward = generateIdeas({ mode: "collision", characterIds: [a, b] });
      const backward = generateIdeas({ mode: "collision", characterIds: [b, a] });
      expect(forward.collision?.topic).toBe(topic);
      expect(forward.collision?.source).toBe("documented-example");
      expect(backward.collision?.topic).toBe(topic);
      expect(backward.collision?.source).toBe("documented-example");
    }
    const fresh = generateIdeas({ mode: "collision", characterIds: ["neo", "rocky-balboa"] });
    expect(fresh.collision?.source).toBe("generated-combination");
    expect(fresh.collision?.topic).not.toBe("Fighting Yourself");
    const [first, second] = randomPair(4);
    expect(first).not.toBe(second);
  });

  it("turns a concept into a new project without touching saved songs or the vocal ending rule", () => {
    const saved = createProject({
      sentence: "A saved song that must stay put",
      format: "single",
      artistId: "ghost",
      producerId: "protege",
    });
    saved.tracks[0]!.locks.lyrics = true;
    const pack = generateIdeas({ mode: "single", characterIds: ["chris-gardner"] });
    const project = projectFromSelection(
      { pack, conceptIndex: 3, hook: pack.hooks[2] ?? "", albumIndex: 1 },
      { artistId: "fable", producerId: "16-the-maestro" },
    );
    const library = addProjectPreserving([saved], project);
    expect(library).toHaveLength(2);
    expect(library[1]?.id).toBe(saved.id);
    expect(library[1]?.sentence).toBe("A saved song that must stay put");
    expect(library[1]?.tracks[0]?.locks.lyrics).toBe(true);
    expect(library[1]?.artistId).toBe("ghost");
    expect(project.format).toBe("ep");
    expect(project.tracks).toHaveLength(6);
    expect(project.artistId).toBe("fable");
    expect(project.topic.inspiration?.sourceLabel).toBe("single-character");
    expect(project.sentence).not.toMatch(/\bChris Gardner\b/);
    expect(project.topic.facts).toMatch(/Documented in the PDF/);
    expect(project.topic.sourceNotes).toMatch(/not the vocal persona/i);
    const prompt = "Kick a dry kick. Snare a dry snare. Hats closed hats. 808 and bass a round bass. Melodic layers a piano figure. Natural human vocal with real breaths and small imperfections, never thin, never squeaky, never robotic pitch correction, never autotune sheen, never the same generic voice as every other song.";
    expect(prompt.endsWith(VOCAL_ENDING)).toBe(true);
    expect(validatePrompt(prompt, false, false).some((issue) => issue.code === "vocal-ending")).toBe(false);
  });
});
