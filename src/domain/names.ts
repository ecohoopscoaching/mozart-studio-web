import { PRODUCERS } from "@/canon/producers";

/** Real-person names that must never appear in a Mozart prompt. */
const EXTRA_REAL_NAMES = [
  "Jadakiss",
  "Big Pun",
  "Jay-Z",
  "Jay Z",
  "Ghostface Killah",
  "Ghostface",
  "Cam'ron",
  "Camron",
  "Kendrick Lamar",
  "Kendrick",
  "Snoop Dogg",
  "Snoop",
  "Ice Cube",
  "T.I.",
  "Lil Wayne",
  "Scarface",
  "Krayzie Bone",
  "Krayzie",
  "Bone Thugs-n-Harmony",
  "Bone Thugs",
  "DJ U-Neek",
  "U-Neek",
  "DJ Premier",
  "Dr. Dre",
  "Timbaland",
  "Pharrell",
  "Metro Boomin",
  "Mike Dean",
  "WondaGurl",
  "Hit-Boy",
  "Just Blaze",
  "Mike WiLL Made-It",
  "Mike Will Made-It",
  "9th Wonder",
  "Quincy Jones",
  "J Dilla",
  "DJ Mustard",
  "Raphael Saadiq",
  "Boi-1da",
  "Kaytranada",
  "Kanye West",
  "Kanye",
  "Fabolous",
  "Frank Dukes",
  "Noah “40” Shebib",
  "Noah \"40\" Shebib",
  "Carter Lang",
  "Jermaine Dupri",
  "London on da Track",
  "Bryan-Michael Cox",
  "Scott Storch",
  "The Alchemist",
  "Cool & Dre",
  "Scoop DeVille",
  "Dan Auerbach",
  "Drumma Boy",
  "Southside",
  "Stargate",
  "D'Mile",
  "D’Mile",
  "Nas",
];

export function realPersonNames(): string[] {
  const names = new Set<string>(EXTRA_REAL_NAMES);
  for (const producer of PRODUCERS) {
    if (producer.internal && producer.name.trim().length > 2) names.add(producer.name);
    if (producer.foundation) {
      for (const part of producer.foundation.split(/×/)) {
        const trimmed = part.trim();
        if (trimmed.length > 2) names.add(trimmed);
      }
    }
  }
  return [...names].sort((a, b) => b.length - a.length);
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function findRealNames(text: string): string[] {
  const hits: string[] = [];
  for (const name of realPersonNames()) {
    const pattern = new RegExp(`\\b${escapeRegExp(name)}\\b`, "i");
    if (pattern.test(text)) hits.push(name);
  }
  return hits;
}

export function stripPhrases(text: string, phrases: string[]): string {
  let next = text;
  const ordered = [...phrases].filter((p) => p.trim().length > 2).sort((a, b) => b.length - a.length);
  for (const phrase of ordered) {
    next = next.replace(new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "gi"), "");
  }
  return next.replace(/\s{2,}/g, " ").replace(/\s+([,.;])/g, "$1").trim();
}
