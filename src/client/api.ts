import type { ComposeResult, Project, Track } from "@/domain/types";
import { hashSeed } from "@/domain/compose";

export interface GenerateResponse extends ComposeResult {
  ok: boolean;
  generationMode: "demo" | "live" | "live-error";
  label: string;
  verifiedLive: false;
  liveDeniedReason?: string;
  error?: string;
}

export async function generateTrack(project: Project, track: Track): Promise<GenerateResponse> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      artistId: track.artistId,
      producerId: track.producerId,
      topic: track.topic,
      instrumental: track.instrumental,
      testMode: track.testMode,
      seed: hashSeed(project.id, track.number),
      trackNumber: track.number,
      trackCount: project.tracks.length,
      arc: track.arc,
      answers: track.answers,
      sources: project.sources.filter((source) => source.selected),
      customArtists: project.customArtists,
      requestLive: false,
    }),
  });
  const body = (await response.json()) as GenerateResponse;
  if (!response.ok || body.ok === false) {
    throw new Error(body.error || "This song could not be written.");
  }
  return body;
}
