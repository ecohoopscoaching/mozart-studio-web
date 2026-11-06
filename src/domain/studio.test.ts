import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ARTISTS, ZEKE } from "@/canon/artists";
import { PRODUCERS, getProducer } from "@/canon/producers";
import { composeTrack, generateAllTracks } from "@/domain/compose";
import { importArtistJson } from "@/domain/customArtist";
import { copyPromptText, projectToMarkdown, trackToMarkdown } from "@/domain/export";
import { contentLines } from "@/domain/lyrics";
import { createProject, emptyTopic } from "@/domain/project";
import { applyRevision } from "@/domain/revisions";
import { mergeLocked, randomSituation, situationToTopic } from "@/domain/topics";
import { LYRICS_MAX, PROMPT_MAX, VOCAL_ENDING, type Artist, type Producer } from "@/domain/types";
import { mozartReady, validateLyrics, validatePrompt, validateTrack } from "@/domain/validate";

function compose(artist: Artist, producer: Producer, extra?: { instrumental?: boolean; testMode?: boolean; sentence?: string; answers?: Record<string, string> }) {
  const topic = emptyTopic(extra?.sentence ?? "A night-shift nurse locks the clinic and sits in the parking lot");
  return composeTrack({
    artist,
    producer,
    topic,
    instrumental: Boolean(extra?.instrumental),
    testMode: Boolean(extra?.testMode),
    seed: 7,
    trackNumber: 1,
    trackCount: 1,
    arc: "sets the scene",
    answers: extra?.answers ?? {},
    sources: [],
  });
}

const fable = ARTISTS.find((artist) => artist.id === "fable")!;
const maestro = getProducer("16-the-maestro")!;

describe("formats and recovery", () => {
  it("builds single, EP, LP, and mixtape counts", () => {
    expect(createProject({ sentence: "A father counts the rent twice at the kitchen table", format: "single" }).tracks).toHaveLength(1);
    expect(createProject({ sentence: "A father counts the rent twice at the kitchen table", format: "ep" }).tracks).toHaveLength(6);
    expect(createProject({ sentence: "A father counts the rent twice at the kitchen table", format: "lp" }).tracks).toHaveLength(10);
    expect(createProject({ sentence: "A father counts the rent twice at the kitchen table", format: "mixtape" }).tracks).toHaveLength(15);
  });

  it("keeps finished EP tracks when one track fails", () => {
    const project = createProject({ sentence: "Siblings split recipes on the porch after the funeral", format: "ep" });
    const result = generateAllTracks(project, { failOnNumber: 4 });
    expect(result.failedNumbers).toEqual([4]);
    expect(result.tracks).toHaveLength(6);
    expect(result.tracks[3]?.generation.status).toBe("failed");
    expect(result.tracks[3]?.lyrics).toBe("");
    for (const track of result.tracks.filter((item) => item.number !== 4)) {
      expect(track.generation.status).toBe("demo");
      expect(track.lyrics.length).toBeGreaterThan(80);
      expect(track.prompt.endsWith(VOCAL_ENDING)).toBe(true);
    }
    const conflicts = new Set(result.tracks.map((track) => track.topic.conflict));
    expect(conflicts.size).toBe(6);
  });
});

describe("vocal single and instrumental", () => {
  it("writes a vocal single with the exact ending and drum order", () => {
    const result = compose(fable, maestro);
    expect(result.lyrics).toContain("[Verse 1]");
    expect(result.lyrics).toContain("night-shift nurse");
    expect(result.lyrics).not.toContain("[Intro]");
    expect(result.prompt.startsWith("Kick ")).toBe(true);
    expect(result.prompt.indexOf("Snare ")).toBeGreaterThan(0);
    expect(result.prompt.indexOf("Hats ")).toBeGreaterThan(result.prompt.indexOf("Snare "));
    expect(result.prompt.indexOf("808 and bass ")).toBeGreaterThan(result.prompt.indexOf("Hats "));
    expect(result.prompt.indexOf("Melodic layers ")).toBeGreaterThan(result.prompt.indexOf("808 and bass "));
    expect(result.prompt.endsWith(VOCAL_ENDING)).toBe(true);
    expect(result.prompt.includes("\n")).toBe(false);
    expect(result.prompt).not.toMatch(/\b(cinematic|ominous|triumphant|spirited)\b/i);
    expect(result.prompt).not.toMatch(/\bFable\b/);
    expect(result.prompt).not.toMatch(/Maestro/i);
    expect(result.brief.purpose).toContain("sets the scene");
    expect(mozartReady(result.issues)).toBe(true);
  });

  it("leaves instrumental lyrics empty and omits the vocal block", () => {
    const result = compose(fable, maestro, { instrumental: true });
    expect(result.lyrics).toBe("");
    expect(result.prompt).not.toContain(VOCAL_ENDING);
    expect(result.prompt).not.toMatch(/\bvocal/i);
    expect(result.prompt.startsWith("Kick ")).toBe(true);
    expect(mozartReady(result.issues)).toBe(true);
  });
});

describe("personas change the writing", () => {
  it("uses different devices for Fable, Echo, Spin, Ghost, Velvet, and Soul Glider", () => {
    const producer = maestro;
    const byId = Object.fromEntries(ARTISTS.map((artist) => [artist.id, compose(artist, producer).lyrics]));
    expect(byId.fable.toLowerCase()).toContain("like a");
    expect(byId.echo.toLowerCase()).toContain("lay it to rest");
    expect(byId.echo).toContain("(the choice)");
    expect(byId.spin).toContain("shot clock");
    expect(byId.spin).toContain("?");
    expect(byId.ghost).toContain("(still here)");
    expect(byId.ghost).not.toMatch(/\b(slow|gothic)\w*/i);
    expect(byId.velvet).toContain("[Pre-Chorus]");
    expect(byId.velvet.toLowerCase()).toContain("baby");
    expect(byId["soul-glider"]).toContain("I stay");
    expect(byId["soul-glider"]).not.toContain("[Pre-Chorus]");
    const prompts = ["fable", "echo", "ghost", "velvet", "soul-glider"].map((id) => compose(ARTISTS.find((artist) => artist.id === id)!, producer).prompt);
    expect(new Set(prompts).size).toBe(prompts.length);
    expect(prompts[2]).toContain("narrow-chant");
    expect(prompts[2]).not.toMatch(/\bKrayzie\b|\bBone\b|\bU-Neek\b/i);
    expect(prompts[4]).toContain("falsetto");
    expect(prompts[4]).not.toContain("Soul Glider");
  });

  it("does not copy book sample lines", () => {
    const banned = ["Schweppervescent", "Little Italy", "it ain't hard to tell", "I'll be your groupie", "Carvel spoons"];
    for (const artist of ARTISTS) {
      const lyrics = compose(artist, maestro).lyrics;
      for (const line of banned) expect(lyrics).not.toContain(line);
    }
  });

  it("varies two seeds and keeps the marker", () => {
    const echo = ARTISTS.find((artist) => artist.id === "echo")!;
    const first = compose(echo, maestro);
    const second = composeTrack({
      artist: echo,
      producer: maestro,
      topic: emptyTopic("A night-shift nurse locks the clinic and sits in the parking lot"),
      instrumental: false,
      testMode: false,
      seed: 99,
      trackNumber: 2,
      trackCount: 2,
      arc: "turns the decision",
      answers: {},
      sources: [],
    });
    expect(first.lyrics).not.toBe(second.lyrics);
    expect(second.lyrics.toLowerCase()).toContain("lay it to rest");
  });
});

describe("limits", () => {
  it("accepts 2999 lyrics and blocks 3000 without cutting", () => {
    const header = "[Verse 1]\n";
    const under = header + "a".repeat(2999 - header.length);
    const over = header + "a".repeat(3000 - header.length);
    expect(under).toHaveLength(2999);
    expect(over).toHaveLength(3000);
    expect(validateLyrics(under, false).some((issue) => issue.code === "lyrics-length")).toBe(false);
    expect(validateLyrics(over, false).some((issue) => issue.code === "lyrics-length")).toBe(true);
    expect(validateLyrics(over, false)[0]?.message).toContain("Nothing was cut");
  });

  it("accepts a 10000 character prompt and blocks 10001", () => {
    const head = "Kick a dry kick. Snare a dry snare. Hats closed hats. 808 and bass a round bass. Melodic layers a short piano figure. ";
    const ofLength = (target: number) => `${head}${"x".repeat(target - head.length - VOCAL_ENDING.length)}${VOCAL_ENDING}`;
    const exact = ofLength(10000);
    const tooLong = ofLength(10001);
    expect(exact).toHaveLength(10000);
    expect(tooLong).toHaveLength(10001);
    expect(exact.endsWith(VOCAL_ENDING)).toBe(true);
    expect(tooLong.endsWith(VOCAL_ENDING)).toBe(true);
    expect(validatePrompt(exact, false, false).some((issue) => issue.code === "prompt-length")).toBe(false);
    const blocked = validatePrompt(tooLong, false, false);
    expect(blocked.some((issue) => issue.code === "prompt-length")).toBe(true);
    expect(blocked.find((issue) => issue.code === "prompt-length")?.message).toContain("Nothing was cut");
    expect(tooLong).toHaveLength(10001);
  });

  it("keeps an oversized topic intact", () => {
    const sentence = `A night-shift nurse locks the clinic and sits in the parking lot. ${"detail ".repeat(800)}`;
    const result = compose(fable, maestro, { sentence });
    expect(result.lyrics.length).toBeGreaterThanOrEqual(LYRICS_MAX);
    expect(result.lyrics).toContain(sentence.trim().slice(0, 200));
    expect(result.issues.some((issue) => issue.code === "lyrics-length")).toBe(true);
    expect(result.lyrics.includes(sentence.trim())).toBe(true);
  });
});

describe("producers", () => {
  it("builds a safe prompt for every producer, vocal and instrumental", () => {
    for (const producer of PRODUCERS) {
      for (const instrumental of [false, true]) {
        const result = compose(fable, producer, { instrumental });
        expect(result.prompt.startsWith("Kick "), producer.name).toBe(true);
        expect(result.prompt.includes("\n"), producer.name).toBe(false);
        expect(result.prompt.length).toBeLessThanOrEqual(PROMPT_MAX);
        expect(result.prompt).not.toMatch(/\b(cinematic|ominous|triumphant|spirited)\b/i);
        expect(result.prompt).not.toMatch(/marching drums/i);
        expect(result.prompt).not.toMatch(/\bDr\.?\s*Dre\b/i);
        expect(result.prompt).not.toMatch(/\bJust Blaze\b/i);
        expect(result.prompt).not.toMatch(/\bU-Neek\b/i);
        expect(result.prompt).not.toMatch(/\bSOULSWITCH\b/);
        if (instrumental) {
          expect(result.lyrics).toBe("");
          expect(result.prompt).not.toContain(VOCAL_ENDING);
          expect(result.prompt).not.toMatch(/\bvocal/i);
        } else {
          expect(result.prompt.endsWith(VOCAL_ENDING)).toBe(true);
        }
      }
    }
  });

  it("gives The Protege the documented grid and strips slow language for Ghost", () => {
    const ghost = ARTISTS.find((artist) => artist.id === "ghost")!;
    const protege = getProducer("protege")!;
    const blue = getProducer("11-blue-hour")!;
    const prompt = compose(ghost, protege).prompt;
    expect(prompt).toContain("beat 3");
    expect(prompt).toContain("128 to 140");
    expect(prompt).not.toMatch(/\bslow/i);
    const late = compose(ghost, blue);
    expect(late.prompt).not.toMatch(/\bslow/i);
    expect(late.notes.join(" ").toLowerCase()).toContain("slow");
  });
});

describe("revisions, copy, and export", () => {
  it("changes one variable, honors locks, and keeps history", () => {
    const project = createProject({ sentence: "A bartender gets the Friday lead shift", format: "single" });
    const written = generateAllTracks(project).tracks[0]!;
    project.tracks = [written];
    const lyricPass = applyRevision(project, written, ["lyrics"], "Sharpen the last image");
    expect(lyricPass.issues).toHaveLength(0);
    expect(lyricPass.track.lyrics).not.toBe(written.lyrics);
    expect(lyricPass.track.prompt).toBe(written.prompt);
    expect(lyricPass.track.history).toHaveLength(1);

    const storyPass = applyRevision(project, written, ["story"], "The cousin finds out first");
    expect(storyPass.track.lyrics).toBe(written.lyrics);
    expect(storyPass.track.prompt).toBe(written.prompt);
    expect(storyPass.track.topic.conflict).toContain("cousin");

    const multi = applyRevision(project, written, ["lyrics", "production"], "both");
    expect(multi.track).toBe(written);
    expect(multi.plan).toHaveLength(2);

    const locked = { ...written, locks: { ...written.locks, lyrics: true } };
    const blocked = applyRevision(project, locked, ["hook"], "new hook");
    expect(blocked.track.lyrics).toBe(locked.lyrics);
    expect(blocked.issues[0]?.code).toBe("locked");
  });

  it("copies the paragraph and fences the markdown export", () => {
    const project = createProject({ sentence: "A coach lets a quiet kid take the penalty", format: "single", producerId: "18-dr-dre" });
    project.tracks = generateAllTracks(project).tracks;
    const track = project.tracks[0]!;
    const copied = copyPromptText(track.prompt);
    expect(copied.startsWith("```")).toBe(false);
    expect(copied).not.toContain("Dr. Dre");
    const markdown = trackToMarkdown(project, track);
    expect(markdown).toContain("```");
    expect(markdown).not.toMatch(/Dr\.?\s*Dre/i);
    expect(projectToMarkdown(project)).toContain("Mozart-ready");
    const blocked = trackToMarkdown(project, { ...track, lyrics: `${track.lyrics}\n[Whisper the hook]` });
    expect(blocked).toContain("DRAFT");
    const readyIssues = validateTrack(track, fable);
    expect(mozartReady(readyIssues)).toBe(true);
  });
});

describe("topics and import", () => {
  it("locks a field while regenerating a real-life situation", () => {
    const first = situationToTopic(randomSituation({}, 1));
    const current = { ...first, centralIdea: "Keep this exact sentence about the laundromat gown." };
    const incoming = situationToTopic(randomSituation({ subject: "money" }, 2, "graduation"));
    const merged = mergeLocked(current, incoming, { centralIdea: true });
    expect(merged.centralIdea).toBe(current.centralIdea);
    expect(merged.conflict).not.toBe(current.conflict);
  });

  it("rejects sample verses and keeps canon import incomplete", () => {
    expect(importArtistJson({ name: "Test", sampleVerse: "real bars", vocal: { instrument: "x", protectedCharacter: "y" } }).error).toMatch(/sample verse/i);
    const imported = importArtistJson({ name: "Lane", vocal: { instrument: "dry mid voice", protectedCharacter: "the witness" } });
    expect(imported.artist?.custom).toBe(true);
    expect(imported.artist?.incomplete.join(" ")).toMatch(/incomplete/i);
  });

  it("records the twelfth-card gap instead of inventing a persona", () => {
    expect(ZEKE.incomplete.join(" ")).toMatch(/twelfth/i);
    expect(ARTISTS.filter((artist) => artist.role === "writing-identity")).toHaveLength(11);
  });
});

describe("client bundle does not see the provider", () => {
  it("keeps Gemini and the key off the client", () => {
    const roots = [path.join(process.cwd(), "src/components"), path.join(process.cwd(), "src/app"), path.join(process.cwd(), "src/client"), path.join(process.cwd(), "src/domain")];
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) {
          if (full.includes(`${path.sep}api`)) continue;
          walk(full);
        } else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith(".test.ts")) files.push(full);
      }
    };
    roots.forEach(walk);
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      expect(text, file).not.toContain("GEMINI_API_KEY");
      expect(text, file).not.toContain("@/server/gemini");
    }
  });
});

describe("batch test mode stays optional", () => {
  it("uses 16 lines and a short prompt only when the track asks", () => {
    const glide = ARTISTS.find((artist) => artist.id === "glide")!;
    const normal = compose(glide, maestro);
    expect(contentLines(normal.lyrics).length).not.toBe(16);
    expect(normal.prompt).not.toContain("92 BPM");
    const test = compose(glide, maestro, { testMode: true });
    expect(contentLines(test.lyrics)).toHaveLength(16);
    expect(test.prompt).toContain("92 BPM");
    expect(test.prompt.startsWith("Male") || test.prompt.includes("Male")).toBe(true);
    expect(test.prompt.length).toBeLessThanOrEqual(1000);
    expect(test.brief.review).toMatch(/not the studio default/i);
  });
});
