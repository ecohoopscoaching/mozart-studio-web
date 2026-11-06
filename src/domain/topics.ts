import type { Topic } from "@/domain/types";
import { mulberry32 } from "@/domain/lyrics";
import { emptyTopic } from "@/domain/project";

export interface Situation {
  id: string;
  sentence: string;
  narrator: string;
  setting: string;
  conflict: string;
  stakes: string;
  scenes: string[];
  hook: string;
  subject: string;
  mood: string;
  settingType: string;
  perspective: string;
  intensity: "low" | "medium" | "high";
}

export const SITUATIONS: Situation[] = [
  {
    id: "clinic-lot",
    sentence: "A night-shift nurse locks the clinic and sits in the parking lot with the engine off.",
    narrator: "the nurse, first person",
    setting: "clinic parking lot just after close",
    conflict: "whether to go back in for one chart or drive home",
    stakes: "the chart is a neighbor, and morning will ask who left it",
    scenes: ["badge on the dash", "fluorescent lobby through the glass", "a cold coffee in the cup holder"],
    hook: "the lock already clicked",
    subject: "work",
    mood: "tired",
    settingType: "work",
    perspective: "first person",
    intensity: "medium",
  },
  {
    id: "rent-envelope",
    sentence: "A father counts the rent twice at the kitchen table while the kids finish cereal.",
    narrator: "the father",
    setting: "small kitchen before school",
    conflict: "the envelope is short and the landlord texts at 7 a.m.",
    stakes: "the kids can hear the phone",
    scenes: ["two piles of bills", "a spoon hitting a bowl", "the hallway light still on"],
    hook: "short by forty and loud by silence",
    subject: "money",
    mood: "anxious",
    settingType: "home",
    perspective: "first person",
    intensity: "high",
  },
  {
    id: "bus-stop",
    sentence: "Two old friends miss the same bus and finally talk about the wedding one of them skipped.",
    narrator: "the friend who stayed",
    setting: "a city bus stop in light rain",
    conflict: "whether the apology is late or just late enough",
    stakes: "the friendship is the last one from that block",
    scenes: ["shared umbrella", "a wet timetable", "a name neither of them says at first"],
    hook: "we both watched the bus leave",
    subject: "friendship",
    mood: "tender",
    settingType: "street",
    perspective: "first person",
    intensity: "medium",
  },
  {
    id: "graduation",
    sentence: "A mother irons a graduation gown in a laundromat because the apartment iron died.",
    narrator: "the graduate's mother",
    setting: "laundromat on a Saturday morning",
    conflict: "she wants the photo to look easy and the week was not",
    stakes: "this is the first finish line anybody in the family framed",
    scenes: ["steam on the window", "quarters in a fist", "the gown over a folding chair"],
    hook: "pressed flat, still warm",
    subject: "family",
    mood: "proud",
    settingType: "neighborhood",
    perspective: "first person",
    intensity: "low",
  },
  {
    id: "overtime",
    sentence: "A warehouse picker stays for overtime and misses the parent-teacher meeting he promised.",
    narrator: "the picker",
    setting: "warehouse break room at dusk",
    conflict: "the shift pays the light bill and costs the promise",
    stakes: "his kid saved him a seat",
    scenes: ["scanner on the table", "a text left on read", "orange vest over the chair"],
    hook: "time and a half, promise at zero",
    subject: "parenting",
    mood: "guilty",
    settingType: "work",
    perspective: "first person",
    intensity: "high",
  },
  {
    id: "porch",
    sentence: "Siblings split their mother's recipes on the porch after the funeral and argue about the pie.",
    narrator: "the younger sibling",
    setting: "front porch the evening after the service",
    conflict: "grief shows up as a fight over who keeps the card",
    stakes: "the recipe is the last handwriting",
    scenes: ["paper plates", "a tin that still smells like cinnamon", "cars pulling off"],
    hook: "we season it different and call it the same",
    subject: "grief",
    mood: "raw",
    settingType: "home",
    perspective: "first person",
    intensity: "high",
  },
  {
    id: "promotion",
    sentence: "A bartender gets the Friday-night lead shift and has to tell her cousin he is off the schedule.",
    narrator: "the bartender",
    setting: "bar after close, stools up",
    conflict: "loyalty to family against the job she just earned",
    stakes: "rent and the cousin's trust come due the same week",
    scenes: ["sticky mats", "a tip jar counted twice", "the schedule on a phone"],
    hook: "I got the night and lost the easy yes",
    subject: "loyalty",
    mood: "conflicted",
    settingType: "work",
    perspective: "first person",
    intensity: "medium",
  },
  {
    id: "soccer",
    sentence: "A coach lets a quiet kid take the last penalty and the whole sideline goes still.",
    narrator: "the coach",
    setting: "a public field at sunset",
    conflict: "winning the game versus keeping a promise to play everyone",
    stakes: "the kid has not touched the ball all season",
    scenes: ["orange cones", "a parent filming", "the ball on the spot"],
    hook: "everybody finally got quiet",
    subject: "community",
    mood: "hopeful",
    settingType: "field",
    perspective: "first person",
    intensity: "medium",
  },
  {
    id: "reunion",
    sentence: "An ex returns a house key in a diner booth and they split a plate of fries anyway.",
    narrator: "the person who moved out",
    setting: "a diner between shifts",
    conflict: "kindness without getting back together",
    stakes: "one of them still has mail at the old address",
    scenes: ["a key on a napkin", "coffee refills", "the jukebox nobody plays"],
    hook: "the key is lighter than the habit",
    subject: "relationships",
    mood: "bittersweet",
    settingType: "diner",
    perspective: "first person",
    intensity: "low",
  },
  {
    id: "citizenship",
    sentence: "A son practices interview questions with his mother in the car outside the federal building.",
    narrator: "the son",
    setting: "a parked car before an appointment",
    conflict: "he wants to joke and she wants every date exact",
    stakes: "a wrong year could send them home to wait again",
    scenes: ["a folder of copies", "the building's flag", "shared headphones off"],
    hook: "say the year like you mean it",
    subject: "family",
    mood: "nervous",
    settingType: "car",
    perspective: "first person",
    intensity: "high",
  },
  {
    id: "block-party",
    sentence: "The block party grill runs out of chicken and the neighbor who never comes outside brings a pan.",
    narrator: "the person who organized the tables",
    setting: "a closed-off street in the afternoon",
    conflict: "pride about who feeds the block",
    stakes: "the kids are already in line",
    scenes: ["folding tables", "a speaker on a milk crate", "foil over a pan"],
    hook: "we eat because somebody unclenched",
    subject: "community",
    mood: "joyful",
    settingType: "street",
    perspective: "first person",
    intensity: "low",
  },
  {
    id: "night-class",
    sentence: "A home aide leaves a double and still makes the first ten minutes of night class.",
    narrator: "the aide",
    setting: "a community-college hallway",
    conflict: "sleep versus the certificate",
    stakes: "the raise depends on finishing the term",
    scenes: ["scrubs under a coat", "a vending machine", "the quiz folded small"],
    hook: "I showed up late and I showed up",
    subject: "ambition",
    mood: "determined",
    settingType: "school",
    perspective: "first person",
    intensity: "medium",
  },
];

export interface TopicFilters {
  subject?: string;
  mood?: string;
  setting?: string;
  perspective?: string;
  intensity?: Situation["intensity"] | "";
}

export function situationToTopic(situation: Situation): Topic {
  const topic = emptyTopic(situation.sentence);
  return {
    ...topic,
    purpose: situation.hook,
    narrator: situation.narrator,
    placeTime: situation.setting,
    conflict: situation.conflict,
    pressures: situation.stakes,
    scenes: situation.scenes.join("; "),
    images: situation.hook,
    emotion: situation.mood,
  };
}

export function randomSituation(filters: TopicFilters, seed: number, avoidId?: string): Situation {
  const roll = mulberry32(seed);
  let pool = SITUATIONS.filter((item) => {
    if (filters.subject && item.subject !== filters.subject) return false;
    if (filters.mood && item.mood !== filters.mood) return false;
    if (filters.setting && item.settingType !== filters.setting) return false;
    if (filters.perspective && item.perspective !== filters.perspective) return false;
    if (filters.intensity && item.intensity !== filters.intensity) return false;
    return true;
  });
  if (!pool.length) pool = [...SITUATIONS];
  const fresh = pool.filter((item) => item.id !== avoidId);
  const usable = fresh.length ? fresh : pool;
  return usable[Math.floor(roll() * usable.length)] ?? usable[0];
}

export function mergeLocked(current: Topic, incoming: Topic, locked: Partial<Record<keyof Topic, boolean>>): Topic {
  const next = { ...incoming };
  (Object.keys(locked) as (keyof Topic)[]).forEach((key) => {
    if (locked[key]) next[key] = current[key];
  });
  return next;
}
