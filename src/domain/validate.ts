import { ALLOWED_HEADERS, LYRICS_MAX, PROMPT_MAX, TEST_PROMPT_MAX, VOCAL_ENDING, type Artist, type Issue, type Track } from "@/domain/types";
import { findRealNames } from "@/domain/names";
import { contentLines } from "@/domain/lyrics";

const PROFANITY = /\b(damn|hell|shit|fuck|nigga|bitch|ass)\b/i;

function block(code: string, message: string, fix: string): Issue {
  return { code, severity: "block", message, fix };
}

function warn(code: string, message: string, fix: string): Issue {
  return { code, severity: "warn", message, fix };
}

export function validateLyrics(lyrics: string, instrumental: boolean): Issue[] {
  const issues: Issue[] = [];
  if (instrumental) {
    if (lyrics !== "") {
      issues.push(block("instrumental-lyrics", "An instrumental track must keep the lyrics field empty.", "Delete every character in the lyrics field, including spaces and headers."));
    }
    return issues;
  }
  if (lyrics.length >= LYRICS_MAX) {
    issues.push(
      block(
        "lyrics-length",
        `Lyrics are ${lyrics.length} characters. Mozart allows fewer than ${LYRICS_MAX}. Nothing was cut.`,
        "Shorten the lyrics yourself until the count is 2999 or less.",
      ),
    );
  }
  const headers = [...lyrics.matchAll(/\[([^\]]+)\]/g)].map((match) => match[1] ?? "");
  for (const header of headers) {
    if (!ALLOWED_HEADERS.includes(header as (typeof ALLOWED_HEADERS)[number])) {
      issues.push(
        block(
          "lyric-header",
          `The bracket [${header}] is not a plain section header.`,
          "Use only [Verse 1], [Verse 2], [Chorus], [Pre-Chorus], [Bridge], [Final Chorus], [Outro], or [Hook]. Put performance directions in the sound prompt.",
        ),
      );
    }
  }
  if (!headers.length) {
    issues.push(block("lyric-header", "Lyrics need at least one plain section header.", "Start the rap with [Verse 1]."));
  }
  if (/\[Intro\]/i.test(lyrics)) {
    issues.push(block("cold-open", "Rap lyrics should cold-open. [Intro] is present.", "Remove [Intro] unless you meant to override the cold open."));
  }
  return issues;
}

export function validatePrompt(prompt: string, instrumental: boolean, testMode: boolean): Issue[] {
  const issues: Issue[] = [];
  if (!prompt.trim()) {
    issues.push(block("prompt-missing", "The Mozart prompt is empty.", "Resolve any choice on screen, then write the prompt again."));
    return issues;
  }
  if (prompt.includes("\n")) {
    issues.push(block("prompt-paragraph", "The Mozart prompt must be one paragraph.", "Remove line breaks so the prompt is a single paragraph."));
  }
  if (prompt.length > PROMPT_MAX) {
    issues.push(
      block(
        "prompt-length",
        `The prompt is ${prompt.length} characters. The ceiling is ${PROMPT_MAX}. Nothing was cut.`,
        "Shorten the prompt yourself. Do not remove the required vocal sentence if this track has vocals.",
      ),
    );
  }
  if (testMode && prompt.length > TEST_PROMPT_MAX) {
    issues.push(
      block(
        "test-prompt-length",
        `Batch-test mode keeps prompts at or under ${TEST_PROMPT_MAX} characters. This one is ${prompt.length}. Nothing was cut.`,
        "Turn off batch-test mode or shorten the prompt. The normal studio ceiling is 10000.",
      ),
    );
  }
  if (!prompt.startsWith("Kick ")) {
    issues.push(block("drum-order", "The prompt must start with the kick, not with a mood adjective.", "Rewrite so the paragraph begins with Kick, then Snare, Hats, 808 and bass, then melodic layers."));
  }
  const kick = prompt.indexOf("Kick ");
  const snare = prompt.indexOf("Snare ");
  const hats = prompt.indexOf("Hats ");
  const bass = prompt.indexOf("808 and bass ");
  const melody = prompt.indexOf("Melodic layers ");
  if (!(kick === 0 && snare > kick && hats > snare && bass > hats && melody > bass)) {
    issues.push(block("drum-order", "Drum order is kick, then snare, then hats, then 808 and bass, then melodic layers.", "Put those five pieces in that order."));
  }
  if (/^(cinematic|ominous|triumphant|spirited)\b/i.test(prompt)) {
    issues.push(block("lead-adjective", "The prompt leads with a banned mood adjective.", "Start with the kick."));
  }
  if (/\b(cinematic|ominous|triumphant|spirited)\b/i.test(prompt)) {
    issues.push(block("mood-adjective", "The words cinematic, ominous, triumphant, and spirited stay out of the Mozart prompt.", "Describe the music with drums, pitch, and instruments instead."));
  }
  if (/marching drums/i.test(prompt)) {
    issues.push(block("marching-drums", "The prompt says marching drums.", "Use the phrase marching-band-inspired snare rolls."));
  }
  const leaks = findRealNames(prompt);
  if (leaks.length) {
    issues.push(block("real-name", `The prompt contains a real-person name: ${leaks.join(", ")}.`, "Describe the music without that name."));
  }
  if (instrumental) {
    if (prompt.includes(VOCAL_ENDING)) {
      issues.push(block("instrumental-ending", "An instrumental prompt must not include the vocal ending sentence.", "Remove the vocal sentence and any vocal instructions."));
    }
    if (/\bvocal/i.test(prompt)) {
      issues.push(block("instrumental-vocal", "An instrumental prompt still contains a vocal instruction.", "Remove vocal directions. Sample colors can stay if they are not a lead voice."));
    }
  } else {
    if (!prompt.endsWith(VOCAL_ENDING)) {
      issues.push(
        block(
          "vocal-ending",
          "The vocal prompt must end with the exact required sentence and nothing after it.",
          "Put the required natural-human-vocal sentence at the very end. Do not shorten it or add words after it.",
        ),
      );
    } else if (prompt.indexOf(VOCAL_ENDING) !== prompt.length - VOCAL_ENDING.length) {
      issues.push(block("vocal-ending", "The required vocal sentence appears more than once.", "Keep it once, as the final sentence."));
    }
  }
  return issues;
}

export function semanticIssues(track: Pick<Track, "lyrics" | "prompt" | "instrumental" | "testMode">, artist: Artist): Issue[] {
  const issues: Issue[] = [];
  for (const pattern of artist.banWordPatterns) {
    const regex = new RegExp(pattern, "i");
    if (regex.test(track.lyrics) || regex.test(track.prompt)) {
      issues.push(block("banned-word", `${artist.name} cannot use a banned word that showed up in the lyric or prompt.`, "Replace the word. For Ghost and The Protege, gothic and slow are banned in every form."));
    }
  }
  if (artist.cleanLanguage && PROFANITY.test(track.lyrics)) {
    issues.push(block("clean-language", `${artist.name} is documented as clean language. A banned word is in the lyric.`, "Rewrite the line without the curse."));
  }
  if (artist.neverRap) {
    const tooLong = contentLines(track.lyrics).filter((line) => line.split(/\s+/).length > 22);
    if (tooLong.length) {
      issues.push(block("never-rap", `${artist.name} never raps. A line is long enough to read as an unpitched rap bar.`, "Keep the lines sung and shorter, fully pitched, with no chopper section."));
    }
  }
  if (!track.instrumental && artist.rapOnly && /\bfalsetto\b/i.test(track.prompt)) {
    issues.push(block("forced-falsetto", `${artist.name} is rap-only. The prompt asks for falsetto.`, "Remove falsetto and sung-lead directions."));
  }
  if (track.testMode && !track.instrumental && contentLines(track.lyrics).length !== 16) {
    issues.push(
      block(
        "test-line-count",
        `Batch-test mode expects 16 written lines. This draft has ${contentLines(track.lyrics).length}.`,
        "Edit to 16 lines or turn batch-test mode off. The normal studio does not use 16 lines as a default.",
      ),
    );
  }
  for (const note of artist.incomplete) {
    if (note.toLowerCase().includes("pen rules")) {
      issues.push(warn("incomplete-pen", note, "You can still draft. Treat the pen as incomplete canon."));
    }
  }
  for (const conflict of artist.conflicts) {
    issues.push(warn("canon-conflict", conflict, "The conflict is shown. It does not silently pick a side."));
  }
  if (track.instrumental && artist.neverRap) {
    issues.push(warn("instrumental-singer", "This singer usually has a lead vocal. The track is instrumental, so the vocal is omitted.", "Turn vocals back on if you wanted a sung lead."));
  }
  return issues;
}

export function validateTrack(track: Track, artist: Artist): Issue[] {
  return [...validateLyrics(track.lyrics, track.instrumental), ...validatePrompt(track.prompt, track.instrumental, track.testMode), ...semanticIssues(track, artist)];
}

export function mozartReady(issues: Issue[]): boolean {
  return !issues.some((issue) => issue.severity === "block" || issue.severity === "decision");
}
