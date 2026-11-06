import type { Artist, SourceDoc, Topic } from "@/domain/types";

const IMAGES = ["a cold coffee cup", "a cracked phone screen", "a bus two stops away", "a coat on the wrong chair", "a receipt folded twice", "a light left on in the kitchen"];

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickImage(seed: number): string {
  const roll = mulberry32(seed)();
  return IMAGES[Math.floor(roll * IMAGES.length)] ?? IMAGES[0];
}

export function contentLines(lyrics: string): string[] {
  return lyrics
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("["));
}

function idea(topic: Topic): string {
  return topic.centralIdea.replace(/\s+/g, " ").trim().replace(/[.]+$/, "");
}

function sourceNote(sources: SourceDoc[]): { line: string | null; note: string } {
  const selected = sources.filter((s) => s.selected && s.status === "ready" && s.text.trim());
  if (!selected.length) return { line: null, note: "" };
  const doc = selected[0];
  const first = doc.text
    .split(/\n+/)
    .map((s) => s.trim())
    .find(Boolean);
  if (!first) return { line: null, note: "" };
  if (first.length > 180 || first.includes("[")) {
    return {
      line: null,
      note: `${doc.filename} is selected and stored in full. The demo did not paste it into the lyric because the opening line is long or already formatted as a lyric. Use it for facts and technique, and write new words.`,
    };
  }
  return {
    line: `The page I kept says ${first.replace(/[.]+$/, "")}`,
    note: `Source-supported detail from ${doc.filename}. The lines around it are new.`,
  };
}

function join(header: string, lines: string[]): string {
  return [`[${header}]`, ...lines].join("\n");
}

function testVerse(artist: Artist, topic: Topic, arc: string, seed: number): string {
  const image = pickImage(seed);
  const subject = idea(topic);
  const lines = [
    subject,
    `This part ${arc}`,
    `I keep ${image} in the frame so the day stays real`,
    artist.lyricMarker,
    "The rhyme leans slant, glass to fast, and the sense comes first",
    "I say the stake in a plain sentence before I decorate it",
    "A door, a shift, a name I do not turn into a myth",
    "The next bar answers the one that just left",
    "I would rather be clear than clever and empty",
    "The room has a smell, a light, and a choice",
    "Nothing here is a quote from a record I studied",
    "The hook is the decision, not a slogan",
    "I leave one detail that could only be this day",
    "Then I stop while the picture is still sharp",
    "The last word belongs to the life, not the trick",
    "That is the whole sixteen, and it stays on the subject",
  ];
  if (artist.cleanLanguage) {
    return join("Verse 1", lines.map((line) => line.replace(/\b(damn|hell|shit)\b/gi, "trouble")));
  }
  return join("Verse 1", lines.slice(0, 16));
}

function rapSong(artist: Artist, topic: Topic, arc: string, seed: number, sourceLine: string | null): string {
  const subject = idea(topic);
  const image = pickImage(seed);
  const marker = artist.lyricMarker;
  const anchor = `The truth in the picture: ${arc}`;
  const verse1 = [
    subject,
    `This part ${arc}, with ${image} still in view`,
    marker,
    "I keep the claim tied to a thing I could pick up",
    sourceLine,
    "The bar has to mean something before it gets to rhyme",
  ].filter((line): line is string => Boolean(line));
  const chorus = [anchor, "Say it again where the drum can hear it", anchor];
  const verse2 = [
    "The second picture is not the first picture",
    `Now the cost shows up next to ${image}`,
    "I answer the line I just wrote instead of starting over",
    "Slant rhyme carries it, glass against fast, room against prove",
    anchor,
  ];
  const bridge = ["Here is the turn, smaller than a speech", "One choice, one consequence, no extra myth"];
  return [join("Verse 1", verse1), join("Chorus", chorus), join("Verse 2", verse2), join("Bridge", bridge), join("Final Chorus", chorus)].join("\n\n");
}

function special(artist: Artist, topic: Topic, arc: string, seed: number, sourceLine: string | null): string | null {
  const subject = idea(topic);
  const image = pickImage(seed);
  if (artist.id === "fable") {
    const anchor = "It reads clear once the scene is done";
    const v1 = [
      `Right now, ${subject}`,
      `This part ${arc}`,
      `A jacket, a key, ${image}, all in the present tense`,
      "I state the fear like a chart left open on the desk",
      sourceLine,
      "The hallway light ticks like a pen that will not sign",
      anchor,
    ].filter((line): line is string => Boolean(line));
    const chorus = [anchor, "The scene already told on me", anchor];
    const v2 = [
      "The next room does not repeat the first room",
      "I watch the choice the way a camera would, close and quiet",
      "Somebody counts the cash like a verdict they already knew",
      anchor,
    ];
    return [join("Verse 1", v1), join("Chorus", chorus), join("Verse 2", v2), join("Final Chorus", chorus)].join("\n\n");
  }
  if (artist.id === "ink") {
    const v1 = [
      subject,
      `This part ${arc}, and every line has to move the story`,
      "The lock sticks, the clock ticks, the lot flicks the light back",
      `I see ${image} and the face that will not look up`,
      sourceLine,
      "Beginning at the door, middle in the quiet, end when I choose",
    ].filter((line): line is string => Boolean(line));
    const chorus = ["Tell it so a stranger could walk the block", "Density only if the picture gets clearer"];
    return [join("Verse 1", v1), join("Chorus", chorus), join("Verse 2", ["The second verse pays the first verse off", "Loyalty, danger, and the kitchen smell stay in the frame", "I do not add a bar just to finish a sound"]), join("Final Chorus", chorus)].join("\n\n");
  }
  if (artist.id === "spin") {
    const v1 = [
      `Look, ${subject}`,
      `This part ${arc}`,
      "I step back from the argument like the shot clock is the one talking",
      "Is the debt a number, or is the number a debt too?",
      sourceLine,
      "Check it, the pun only stays if the life still makes sense",
    ].filter((line): line is string => Boolean(line));
    const chorus = ["Rewind it once for the joke and once for the bill", "Both meanings have to pay rent"];
    return [join("Verse 1", v1), join("Chorus", chorus), join("Verse 2", ["Hold up, the second picture is the free-throw routine", "Same ball, different pressure, still a real choice"]), join("Final Chorus", chorus)].join("\n\n");
  }
  if (artist.id === "echo") {
    const long = `I keep ${subject} moving through the doorway and the quiet and the choice and I lay it to rest without a hard stop in the middle of the thought (the choice) (the choice)`;
    const v1 = [long, `This part ${arc}`, "Steel resolve, storm warning, final chapter, all of it clean", sourceLine, "We outclass the panic by staying on one breath"].filter((line): line is string => Boolean(line));
    const chorus = ["Come through if you want the truth in the open", "Come through if you want the truth in the open"];
    return [join("Verse 1", v1), join("Chorus", chorus), join("Verse 2", ["The run keeps rolling and the moral stays audible and the cadence does not wobble when the near-rhyme lands"]), join("Final Chorus", chorus)].join("\n\n");
  }
  if (artist.id === "pivot") {
    const v1 = [
      subject,
      `This part ${arc}`,
      "First pocket: glass, fast, last, the bill on the table",
      "The line after it has to follow, or it does not ship",
      "Next pocket: room, prove, through, the quiet in the hall",
      sourceLine,
      "What happened, what it built, why the last claim is earned",
    ].filter((line): line is string => Boolean(line));
    const chorus = ["Every bar connects", "Then the pocket changes"];
    return [join("Verse 1", v1), join("Chorus", chorus), join("Verse 2", ["A cracked phone, an empty fridge, a bus stop, none of it is decoration", "The belief at the end was already in the first room"]), join("Final Chorus", chorus)].join("\n\n");
  }
  if (artist.id === "slick") {
    const v1 = [
      `${subject}, and I give it a half-smile`,
      `This part ${arc}`,
      "The jacket still fits, which is not the same as being fine",
      "One stack, then I sit back down: glass, fast, last, and the laugh gets quiet",
      sourceLine,
    ].filter((line): line is string => Boolean(line));
    const chorus = ["Too smooth to say the quiet part first", "So the joke says it, then I do"];
    return [join("Verse 1", v1), join("Chorus", chorus), join("Verse 2", ["The second verse stops performing and names the bruise", "Still cool. Still honest."]), join("Final Chorus", chorus)].join("\n\n");
  }
  if (artist.id === "dre") {
    const v1 = [
      subject,
      `This part ${arc}, and the thought is still`,
      "moving when the point lands in the middle of the breath",
      "Slant before perfect, glass beside fast, not a locked couplet",
      sourceLine,
      `I set ${image} down and keep talking`,
    ].filter((line): line is string => Boolean(line));
    const chorus = ["Meaning first", "The rhyme can wait its turn"];
    return [join("Verse 1", v1), join("Chorus", chorus), join("Verse 2", ["A short line.", "Then a longer one that refuses the same cadence as the four before it"]), join("Final Chorus", chorus)].join("\n\n");
  }
  if (artist.id === "poet") {
    const v1 = [
      `Same mirror at the start, ${subject}`,
      `This part ${arc}`,
      "I brag, then I undercut it in the same breath",
      sourceLine,
      "The list of names is a joke until it tells on me",
    ].filter((line): line is string => Boolean(line));
    const chorus = ["One picture only", "If it leaves the mirror, cut it"];
    const last = "Same mirror at the end, and the verse comes home";
    return [join("Verse 1", v1), join("Chorus", chorus), join("Verse 2", [last, "Plain talk after the flex, absent but not really gone from the point"]), join("Final Chorus", [last])].join("\n\n");
  }
  if (artist.id === "dusk") {
    const v1 = [
      subject,
      `This part ${arc}`,
      "A person's day depends on what they can still pay for",
      "The coined word for that hush is billquiet",
      sourceLine,
      "We know the ending and we still count the drawer",
    ].filter((line): line is string => Boolean(line));
    const chorus = ["Clear, not hopeless", "Say the thesis and leave it"];
    return [join("Verse 1", v1), join("Chorus", chorus), join("Verse 2", ["Another proverb, still about the same bill", "Elegant only because it is exact"]), join("Final Chorus", chorus)].join("\n\n");
  }
  if (artist.id === "chain") {
    const v1 = [
      subject,
      `This part ${arc}`,
      "pressure present, I pressed it, I impress it, I will not depress it",
      "That was the sound. This line flips it: the pressure was the gift",
      sourceLine,
      "Internals sit inside the bar, the end rhyme can rest",
    ].filter((line): line is string => Boolean(line));
    const chorus = ["Ride the sound", "Then reverse the meaning"];
    return [join("Verse 1", v1), join("Chorus", chorus), join("Verse 2", ["Pressing the point again, a new meaning on the same consonant", "The couplet opens a door and the next line locks it"]), join("Final Chorus", chorus)].join("\n\n");
  }
  if (artist.id === "grit") {
    const v1 = [
      subject,
      `This part ${arc}`,
      "They wanted a speech. I paid off the debt",
      "They wanted a scene. I stayed on the step",
      `The telling picture is ${image}, not a general claim`,
      sourceLine,
      "Laugh first. The stab is the specific thing",
    ].filter((line): line is string => Boolean(line));
    const chorus = ["Payoff first", "Then the setup can find it"];
    return [join("Verse 1", v1), join("Chorus", chorus), join("Verse 2", ["Tough talk, normal object, two meanings", "The rhyme was aimed, not stumbled into"]), join("Final Chorus", chorus)].join("\n\n");
  }
  if (artist.id === "velvet") {
    const v1 = ["Baby, I should say this plain", subject, `This part ${arc}`, sourceLine, "I talk it before I sing it"].filter((line): line is string => Boolean(line));
    const pre = ["The feeling climbs", "I stop joking"];
    const chorus = ["Baby, the truth is simple", "I want you close and I know what it cost"];
    const rapid = "I keep thinking and sinking and meaning it in the same minute, one long confession with no place to hide the feeling";
    return [join("Verse 1", v1), join("Pre-Chorus", pre), join("Chorus", chorus), join("Verse 2", [rapid, "That was the overflow, still about the same person"]), join("Bridge", ["This is the high quiet part", "I can say stay without a speech"]), join("Final Chorus", chorus)].join("\n\n");
  }
  if (artist.id === "ghost") {
    const v1 = [
      subject,
      `This part ${arc}`,
      "Narrow chant, crisp words, a breath when the line has earned it (still here)",
      "The hook will open into a melody. This verse stays spoken and fast",
      sourceLine,
      "One feeling only, watchful, after midnight, still moving",
    ].filter((line): line is string => Boolean(line));
    const chorus = ["(still here) (still here)", "The chant opens, then a simple melody in the same voice"];
    return [join("Verse 1", v1), join("Chorus", chorus), join("Verse 2", ["I do not name the family. The weight is in the choice", "Proud and ashamed can sit in one bar without a costume"]), join("Final Chorus", chorus)].join("\n\n");
  }
  if (artist.id === "soul-glider") {
    const v1 = ["I stay in the middle of it", subject, `This part ${arc}`, "I sing the sentence. I do not rap it", sourceLine].filter((line): line is string => Boolean(line));
    const chorus = ["I stay", "High and close and clear", "I stay"];
    return [join("Verse 1", v1), join("Chorus", chorus), join("Verse 2", ["Joy gets a verse too", "The falsetto moves somewhere new, and the words stay plain"]), join("Bridge", ["Not finished", "Still becoming"]), join("Final Chorus", chorus)].join("\n\n");
  }
  return null;
}

export function writeLyrics(artist: Artist, topic: Topic, arc: string, seed: number, instrumental: boolean, testMode: boolean, sources: SourceDoc[]): { lyrics: string; note: string } {
  if (instrumental) return { lyrics: "", note: "Instrumental. The lyrics field is empty on purpose." };
  const source = sourceNote(sources);
  if (testMode) return { lyrics: testVerse(artist, topic, arc, seed), note: source.note };
  const lyrics = special(artist, topic, arc, seed, source.line) ?? rapSong(artist, topic, arc, seed, source.line);
  return { lyrics, note: source.note };
}
