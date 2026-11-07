import { getArtist } from "@/canon/artists";
import { getProducer } from "@/canon/producers";
import { DEMO_LABEL, composeTrack } from "@/domain/compose";
import type { Artist, ComposeResult, SourceDoc, Topic } from "@/domain/types";
import { geminiText } from "@/server/gemini";
import { liveGenerationAllowed } from "@/server/liveGate";

export interface GenerateBody {
  artistId?: string;
  producerId?: string;
  topic?: Topic;
  instrumental?: boolean;
  testMode?: boolean;
  seed?: number;
  trackNumber?: number;
  trackCount?: number;
  arc?: string;
  answers?: Record<string, string>;
  sources?: SourceDoc[];
  customArtists?: Artist[];
  requestLive?: boolean;
  simulateFailure?: boolean;
}

function liveInstruction(resultHint: string): string {
  return [
    "Write original song lyrics for a Mozart music studio.",
    "Do not copy reference verses, titles, or hooks from memory or from any source text.",
    "Use plain section headers only: [Verse 1], [Chorus], [Verse 2], [Bridge], [Final Chorus].",
    "No performance directions inside brackets. Parenthetical ad-libs are allowed.",
    "Cold-open raps on [Verse 1]. Meaning comes before rhyme.",
    "Return JSON with a lyrics string only. Keep lyrics under 3000 characters. Do not truncate mid-word if you are close; write shorter instead.",
    resultHint,
  ].join("\n");
}

export async function handleGenerate(request: Request, env: Record<string, string | undefined>, fetchImpl: typeof fetch = fetch): Promise<{ status: number; body: Record<string, unknown> }> {
  let body: GenerateBody;
  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    return { status: 400, body: { ok: false, error: "The request was not valid JSON." } };
  }
  if (body.simulateFailure === true) {
    if (env.ENABLE_GENERATION_TEST_HOOKS === "1") {
      return { status: 500, body: { ok: false, error: "Simulated track failure.", generationMode: "demo" } };
    }
    return { status: 400, body: { ok: false, error: "Failure simulation is not enabled." } };
  }
  const artist = getArtist(body.artistId ?? "", body.customArtists ?? []);
  const producer = getProducer(body.producerId ?? "");
  if (!artist || !producer || !body.topic) {
    return { status: 400, body: { ok: false, error: "Artist, producer, and topic are required." } };
  }
  const input = {
    artist,
    producer,
    topic: body.topic,
    instrumental: Boolean(body.instrumental),
    testMode: Boolean(body.testMode),
    seed: body.seed || 1,
    trackNumber: body.trackNumber || 1,
    trackCount: body.trackCount || 1,
    arc: body.arc || "sets the scene",
    answers: body.answers ?? {},
    sources: body.sources ?? [],
  };
  const gate = liveGenerationAllowed(request, env);
  if (body.requestLive && gate.allowed && env.GEMINI_API_KEY) {
    try {
      const modelText = await geminiText({
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_MODEL || "gemini-2.0-flash",
        prompt: liveInstruction(`${artist.name} writing devices: ${artist.writingDevices.join(" ")} Topic: ${body.topic.centralIdea}`),
        fetchImpl,
      });
      const composed = composeTrack(input);
      const lyrics = extractLyrics(modelText) ?? modelText;
      const withLiveLyrics: ComposeResult = { ...composed, lyrics: body.instrumental ? "" : lyrics };
      return {
        status: 200,
        body: {
          ok: true,
          generationMode: "live",
          label: "Live Gemini draft. Not verified in this deployment log.",
          verifiedLive: false,
          ...withLiveLyrics,
        },
      };
    } catch (error) {
      return {
        status: 502,
        body: {
          ok: false,
          generationMode: "live-error",
          error: error instanceof Error ? error.message : "Live generation failed.",
          verifiedLive: false,
        },
      };
    }
  }
  const composed = composeTrack(input);
  return {
    status: 200,
    body: {
      ok: true,
      generationMode: "demo",
      label: DEMO_LABEL,
      verifiedLive: false,
      liveDeniedReason: body.requestLive ? gate.reason : undefined,
      ...composed,
    },
  };
}

function extractLyrics(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as { lyrics?: unknown };
    return typeof parsed.lyrics === "string" ? parsed.lyrics : null;
  } catch {
    return null;
  }
}
