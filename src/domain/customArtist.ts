import type { Artist } from "@/domain/types";
import { newId } from "@/domain/project";

export function duplicateArtist(artist: Artist): Artist {
  return {
    ...artist,
    id: `custom-${newId()}`,
    name: `${artist.name} copy`,
    custom: true,
    simpleChoice: false,
    provenance: [...artist.provenance, "Editable copy. The library original is unchanged."],
    incomplete: [...artist.incomplete, "This copy is app-created. It is not a new canon card."],
  };
}

export function importArtistJson(raw: unknown): { artist?: Artist; error?: string } {
  if (!raw || typeof raw !== "object") return { error: "Persona JSON must be an object." };
  const record = raw as Partial<Artist> & { sampleVerse?: unknown };
  if (typeof record.sampleVerse === "string") {
    return { error: "This file includes a sample verse. Reference lyrics are not imported. Remove sampleVerse and keep traits only." };
  }
  if (!record.name || typeof record.name !== "string") return { error: "A name is required." };
  if (!record.vocal || typeof record.vocal !== "object") return { error: "A vocal object is required." };
  const vocal = record.vocal;
  if (!vocal.instrument || !vocal.protectedCharacter) {
    return { error: "Vocal instrument and protected character are required. Missing canon was not invented." };
  }
  const artist: Artist = {
    id: `import-${newId()}`,
    name: record.name.slice(0, 80),
    role: "fictional-artist",
    simpleChoice: false,
    oneLine: String(record.oneLine ?? "Imported persona. Review incomplete fields before you rely on it."),
    lane: String(record.lane ?? "Imported"),
    regionPhrase: record.regionPhrase ? String(record.regionPhrase) : null,
    suggestedProducerId: null,
    pairingNote: "Imported persona. No preset pairing was assumed.",
    cleanLanguage: Boolean(record.cleanLanguage),
    neverRap: Boolean(record.neverRap),
    rapOnly: record.rapOnly !== false,
    allowFalsetto: Boolean(record.allowFalsetto),
    coldOpen: record.coldOpen !== false,
    banWordPatterns: Array.isArray(record.banWordPatterns) ? record.banWordPatterns.map(String) : [],
    tempoRange: null,
    writingDevices: Array.isArray(record.writingDevices) ? record.writingDevices.map(String).slice(0, 20) : [],
    vocal: {
      instrument: String(vocal.instrument),
      protectedCharacter: String(vocal.protectedCharacter),
      registerMap: String(vocal.registerMap ?? "Register map was not in the file."),
      emotionalFeel: String(vocal.emotionalFeel ?? "Emotional feel was not in the file."),
      extra: String(vocal.extra ?? ""),
      genderWord: vocal.genderWord ? String(vocal.genderWord) : null,
    },
    lyricMarker: String(record.lyricMarker ?? "imported voice"),
    incomplete: ["Imported from JSON. Anything not in the file is marked incomplete rather than filled in.", ...(Array.isArray(record.incomplete) ? record.incomplete.map(String) : [])],
    conflicts: [],
    provenance: ["User import. Original file is kept only as this copy."],
    custom: true,
  };
  return { artist };
}
