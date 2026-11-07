import { getArtist } from "@/canon/artists";
import { getProducer } from "@/canon/producers";
import type { Project, Track } from "@/domain/types";
import { mozartReady, validateTrack } from "@/domain/validate";

export function copyPromptText(prompt: string): string {
  return prompt.trim();
}

export function safeProducerLabel(producerId: string): string {
  const producer = getProducer(producerId);
  if (!producer) return "Unknown producer";
  if (producer.internal) return "Internal preset (real-person name withheld)";
  return producer.name;
}

export function trackToMarkdown(project: Project, track: Track): string {
  const artist = getArtist(track.artistId, project.customArtists);
  const issues = artist ? validateTrack(track, artist) : [];
  const ready = artist ? mozartReady(issues) : false;
  const status = ready ? "Mozart-ready" : "DRAFT — not Mozart-ready";
  const prompt = track.prompt.trim();
  return [
    `# ${track.title}`,
    "",
    status,
    "",
    "Do not paste this whole file into Mozart. Copy the prompt paragraph only.",
    "Studio notes may name fictional personas. Real-person names are withheld.",
    "",
    `Artist: ${artist?.name ?? track.artistId}`,
    `Producer: ${safeProducerLabel(track.producerId)}`,
    "",
    "## Purpose",
    track.brief?.purpose ?? "",
    "",
    "## Feel",
    track.brief?.feel ?? "",
    "",
    "## Sound",
    track.brief?.sound ?? "",
    "",
    "## Voice",
    track.brief?.voice ?? "",
    "",
    "## Movement",
    track.brief?.movement ?? "",
    "",
    "## Review",
    track.brief?.review ?? "",
    "",
    "## Lyrics",
    track.instrumental ? "(empty on purpose — instrumental)" : track.lyrics,
    "",
    "## Prompt",
    "",
    "```",
    prompt,
    "```",
    "",
    ready ? "" : issues.map((issue) => `- ${issue.message} Fix: ${issue.fix}`).join("\n"),
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}

export function projectToMarkdown(project: Project): string {
  const body = project.tracks.map((track) => trackToMarkdown(project, track)).join("\n\n---\n\n");
  return [`# ${project.title}`, "", `${project.format.toUpperCase()} · ${project.tracks.length} tracks`, "", "Saved locally in the browser that wrote this export.", "", body].join("\n");
}
