import type { Artist, ComposeInput, Decision, Producer } from "@/domain/types";
import { VOCAL_ENDING } from "@/domain/types";
import { findRealNames, stripPhrases } from "@/domain/names";

export interface Layers {
  kick: string;
  snare: string;
  hats: string;
  bass: string;
  melody: string;
}

const NEUTRAL: Layers = {
  kick: "a dry kick",
  snare: "a crisp snare on beats 2 and 4",
  hats: "steady closed eighth-note hats",
  bass: "even sub bass",
  melody: "a muted two-note electric-piano loop",
};

const PROTEGE: Layers = {
  kick: "a dry round drum-machine kick on beat 1 and the and of 2, 3, and 4, with a short knock, a clean sine sub tail, and occasional 16th pickups",
  snare: "one crisp fat dry snare once per bar on beat 3, with no clap stack",
  hats: "steady straight 8th closed hats at the full tempo, firm on the downbeats",
  bass: "a held pedal bass with a clean tuned sub under the root, half-step neighbor colors only, no glides and no 808 melody",
  melody: "dark minor chords held for a bar or two, a strong staccato played figure, rumbling low piano, and tape-warm mellotron strings, in minor mode at a real 128 to 140 BPM, driving and always moving",
};

const SOULSWITCH_FULL: Layers = {
  kick: "a punchy live boom-bap kick for the opening minute, then a hard kick after the late switch",
  snare: "a live backbeat snare before the switch, then a sharp snare after it",
  hats: "a live hat pattern before the switch, then rolling triplet hats",
  bass: "a walking bassline before the switch, then distorted 808 slides",
  melody: "pitched-up soul-sample or brass chops with vinyl crackle, Rhodes or organ, then the same sample pitched down with minor synth bells",
};

const SOULSWITCH_FAST: Layers = {
  kick: "a hard kick in the fast section only",
  snare: "a sharp snare in the fast section only",
  hats: "rolling triplet hats in the fast section only",
  bass: "distorted 808 slides in the fast section only",
  melody: "the sample pitched down dark, with minor synth bells, from 136 to 140 BPM and no early tempo",
};

export function producerTempo(producer: Producer): [number, number] | null {
  if (producer.id === "protege") return [128, 140];
  return null;
}

export function pendingDecisions(input: Pick<ComposeInput, "artist" | "producer" | "answers" | "testMode" | "instrumental">): Decision[] {
  if (input.instrumental || input.testMode) return [];
  if (input.artist.id === "ghost" && input.producer.id === "soulswitch" && !input.answers["ghost-soulswitch-tempo"]) {
    return [
      {
        id: "ghost-soulswitch-tempo",
        question:
          "Soulswitch changes tempo after the first minute. Ghost's documented pocket is 128 to 140. The prompt needs one tempo map before it can be Mozart-ready.",
        options: [
          { id: "fast-overlap", label: "Use only the late fast section, 136 to 140" },
          { id: "full-switch", label: "Keep the full switch and let the chant ride both tempos" },
        ],
      },
    ];
  }
  const artistRange = input.artist.tempoRange;
  const beatRange = producerTempo(input.producer);
  if (artistRange && beatRange && !rangesOverlap(artistRange, beatRange) && !input.answers["tempo-map"]) {
    return [
      {
        id: "tempo-map",
        question: `${input.artist.name} is documented at ${artistRange[0]} to ${artistRange[1]} BPM. This producer is documented at ${beatRange[0]} to ${beatRange[1]} BPM. Those ranges do not overlap.`,
        options: [
          { id: "artist", label: `Follow the artist pocket, ${artistRange[0]} to ${artistRange[1]}` },
          { id: "producer", label: `Follow the producer pocket, ${beatRange[0]} to ${beatRange[1]}` },
        ],
      },
    ];
  }
  return [];
}

function rangesOverlap(a: [number, number], b: [number, number]): boolean {
  return Math.min(a[1], b[1]) >= Math.max(a[0], b[0]);
}

export function inferLayers(desc: string): Layers {
  const d = desc.toLowerCase();
  const kick = d.includes("hard kick")
    ? "a hard dry kick at the front of the bar"
    : d.includes("punch")
      ? "a punchy kick with a short body"
      : "a clear kick on the downbeat, short and uncluttered";
  const snare = /marching snare|marching drum/.test(d)
    ? "marching-band-inspired snare rolls beside a cracking backbeat"
    : d.includes("crack")
      ? "a cracking dry snare on the backbeat"
      : d.includes("rim")
        ? "a dry snare with a rimshot edge on the backbeat"
        : "a dry snare on the backbeat, shorter than the kick";
  const hats = d.includes("triplet")
    ? "rolling triplet hats, tighter when the chorus lifts"
    : d.includes("16th") || d.includes("sixteenth")
      ? "steady sixteenth hats, quieter than the snare"
      : d.includes("hand percussion") || d.includes("found sound")
        ? "hand percussion, rimshots, and small hat ticks instead of a busy hat line"
        : "closed hats on a steady grid, leaving space around the snare";
  const bass =
    d.includes("808") && (d.includes("slid") || d.includes("slide"))
      ? "sliding 808s that move and then rest, mono and clean"
      : d.includes("808")
        ? "a thick 808 that follows the kick and does not play a busy melody"
        : d.includes("walking")
          ? "a walking bassline with space for the kick"
          : d.includes("sub")
            ? "soft sub bass with a short decay"
            : "a round bass locked to the kick, then a rest";
  const found: string[] = [];
  for (const name of ["Rhodes", "piano", "guitar", "organ", "brass", "strings", "bell", "synth", "horn", "flute", "keys", "sample"]) {
    if (d.includes(name.toLowerCase())) found.push(name.toLowerCase());
  }
  const melody = found.length
    ? `${found.slice(0, 4).join(", ")} carrying the harmony, with room between the notes`
    : "a short harmonic figure with room between the notes";
  return { kick, snare, hats, bass, melody };
}

export function layersFor(producer: Producer, testMode: boolean, answers: Record<string, string>): Layers {
  if (testMode) return NEUTRAL;
  if (producer.id === "protege") return PROTEGE;
  if (producer.id === "soulswitch") {
    return answers["ghost-soulswitch-tempo"] === "fast-overlap" ? SOULSWITCH_FAST : SOULSWITCH_FULL;
  }
  return inferLayers(producer.desc);
}

function sentence(text: string): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

export function sanitizeMusicalText(text: string, notes: string[], opts: { instrumental: boolean; banSlowGothic: boolean; extraStrips: string[] }): string {
  let next = text;
  const before = next;
  next = next.replace(/marching drums/gi, "marching-band-inspired snare rolls");
  next = next.replace(/marching snares?/gi, "marching-band-inspired snare rolls");
  const adjectiveHits = next.match(/\b(cinematic|ominous|triumphant|spirited)\b/gi);
  if (adjectiveHits?.length) {
    notes.push(
      `Producer wording used ${[...new Set(adjectiveHits.map((w) => w.toLowerCase()))].join(", ")}. Those adjectives were left out of the Mozart prompt so the paragraph stays concrete and does not lead with them. The studio sound note still shows the original wording.`,
    );
    next = next
      .replace(/\bcinematic\b/gi, "scored")
      .replace(/\bominous\b/gi, "dark")
      .replace(/\btriumphant\b/gi, "bright and large")
      .replace(/\bspirited\b/gi, "forward");
  }
  if (opts.banSlowGothic) {
    if (/\bgothic\w*/i.test(next) || /\bslow\w*/i.test(next)) {
      notes.push("The words gothic and slow are banned for this voice or producer. They were replaced before the prompt was written.");
      next = next.replace(/slow-burning/gi, "patient late-night");
      next = next.replace(/\bslow\w*/gi, "patient");
      next = next.replace(/\bgothic\w*/gi, "shadowed");
    }
  }
  if (opts.instrumental) {
    const vocalish = /\b(vocals?|vocalist|singer|rappers?|falsetto|choir)\b/i.test(next);
    next = next
      .replace(/pitched-up soul vocals?/gi, "pitched-up soul samples")
      .replace(/chopped vocals?/gi, "chopped pitched samples")
      .replace(/vocal samples?/gi, "pitched samples")
      .replace(/vocal fragments?/gi, "pitched fragments")
      .replace(/vocal harmon(?:y|ies)/gi, "pitched harmony")
      .replace(/vocal phrases?/gi, "pitched phrases")
      .replace(/vocal-like/gi, "tone-like")
      .replace(/soul-vocal/gi, "soul-sample")
      .replace(/lead vocals?/gi, "lead line")
      .replace(/lead rappers?/gi, "lead line")
      .replace(/\brappers?\b/gi, "lead line")
      .replace(/\bfalsetto\b/gi, "upper register")
      .replace(/\bsingers?\b/gi, "sample phrase")
      .replace(/\bvocals?\b/gi, "samples")
      .replace(/\bchoir\b/gi, "stacked samples");
    if (vocalish) {
      notes.push("Vocal instructions were removed from this instrumental prompt. Sample colors stay musical.");
    }
  }
  next = stripPhrases(next, [...opts.extraStrips, "Soul Glider", "SOULSWITCH"]);
  if (next !== before && next.length < before.length) {
    // Names and banned words were edited on purpose and reported above when relevant.
  }
  return next.replace(/\s{2,}/g, " ").replace(/\s+([,.;])/g, "$1").trim();
}

function vocalSentences(artist: Artist, testMode: boolean): string[] {
  const gender =
    testMode ? "Male" : artist.vocal.genderWord ? `${artist.vocal.genderWord[0].toUpperCase()}${artist.vocal.genderWord.slice(1)} vocal` : "";
  const instrument = [gender, artist.vocal.instrument].filter(Boolean).join(", ");
  const region = artist.regionPhrase ?? "";
  if (testMode) {
    return [[region, instrument, `Protected character: ${artist.vocal.protectedCharacter}`, artist.vocal.registerMap].filter(Boolean).join(". ")];
  }
  return [instrument, region, `Protected character: ${artist.vocal.protectedCharacter}`, artist.vocal.registerMap, artist.vocal.emotionalFeel, artist.vocal.extra].filter((part) => part.trim().length > 0);
}

export function buildSoundPrompt(input: ComposeInput, notes: string[]): string {
  const decisions = pendingDecisions(input);
  if (decisions.length) return "";
  const layers = layersFor(input.producer, input.testMode, input.answers);
  const parts = [
    sentence(`Kick ${layers.kick}`),
    sentence(`Snare ${layers.snare}`),
    sentence(`Hats ${layers.hats}`),
    sentence(`808 and bass ${layers.bass}`),
    sentence(`Melodic layers ${layers.melody}`),
  ];
  if (input.testMode) {
    parts.push(sentence("Straight 4/4 at 92 BPM, with no switches, no fills, no extra instruments, and no vocal samples. The bed stays restrained and identical throughout"));
  } else {
    const texture = sanitizeMusicalText(input.producer.desc, notes, {
      instrumental: input.instrumental,
      banSlowGothic: false,
      extraStrips: [input.producer.name, input.artist.name],
    });
    if (texture) parts.push(sentence(`Arrangement ${texture}`));
    if (input.answers["tempo-map"] === "artist" && input.artist.tempoRange) {
      parts.push(sentence(`Tempo stays in the artist pocket, ${input.artist.tempoRange[0]} to ${input.artist.tempoRange[1]} BPM`));
    }
    if (input.answers["tempo-map"] === "producer") {
      const range = producerTempo(input.producer);
      if (range) parts.push(sentence(`Tempo stays in the producer pocket, ${range[0]} to ${range[1]} BPM`));
    }
    if (input.answers["ghost-soulswitch-tempo"] === "full-switch") {
      parts.push(sentence("The late switch stays: warmth near 80 to 92 BPM for the first minute, a tape-stop or low-pass drop into a short silence, then the faster section"));
    }
    if (input.answers["ghost-soulswitch-tempo"] === "fast-overlap") {
      parts.push(sentence("The early tempo is left out. Only the fast section plays, inside 136 to 140 BPM"));
    }
    parts.push(sentence("The record develops in clear sections, with the drums staying in front and the harmony changing more than it clutters"));
  }
  if (!input.instrumental) {
    for (const line of vocalSentences(input.artist, input.testMode)) parts.push(sentence(line));
    parts.push(VOCAL_ENDING);
  }
  let prompt = parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  prompt = sanitizeMusicalText(prompt, notes, {
    instrumental: input.instrumental,
    banSlowGothic: input.artist.banWordPatterns.some((p) => p.includes("slow")) || input.producer.id === "protege" || input.artist.id === "ghost",
    extraStrips: [input.producer.name, input.artist.name, "SOULSWITCH", "Soul Glider"],
  });
  if (!input.instrumental && !prompt.endsWith(VOCAL_ENDING)) {
    const stripped = prompt.replace(new RegExp(`${VOCAL_ENDING.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g"), "").trim();
    prompt = `${stripped} ${VOCAL_ENDING}`.replace(/\s+/g, " ").trim();
  }
  const leaks = findRealNames(prompt);
  if (leaks.length) {
    notes.push(`Real-person names were removed from the prompt: ${leaks.join(", ")}.`);
    prompt = stripPhrases(prompt, leaks);
    if (!input.instrumental && !prompt.endsWith(VOCAL_ENDING)) {
      prompt = `${prompt} ${VOCAL_ENDING}`.replace(/\s+/g, " ").trim();
    }
  }
  return prompt;
}
