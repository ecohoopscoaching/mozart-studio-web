import { generateIdeas, type IdeaRequest } from "@/domain/characterIdeas";
import { liveGenerationAllowed } from "@/server/liveGate";

export async function handleIdeas(
  request: Request,
  env: Record<string, string | undefined>,
  fetchImpl: typeof fetch = fetch,
): Promise<{ status: number; body: Record<string, unknown> }> {
  let body: IdeaRequest & { requestLive?: boolean };
  try {
    body = (await request.json()) as IdeaRequest & { requestLive?: boolean };
  } catch {
    return { status: 400, body: { ok: false, error: "The request was not valid JSON." } };
  }
  const gate = liveGenerationAllowed(request, env);
  if (body.requestLive && gate.allowed) {
    void fetchImpl;
    return {
      status: 200,
      body: {
        ok: true,
        generationMode: "demo",
        verifiedLive: false,
        liveIdeaWriting: false,
        note: "The live gate would allow a provider call, but this idea tool stays on DEMO sample output. No provider request was made.",
        pack: safePack(body),
      },
    };
  }
  try {
    return {
      status: 200,
      body: {
        ok: true,
        generationMode: "demo",
        verifiedLive: false,
        liveDeniedReason: body.requestLive ? gate.reason : undefined,
        pack: generateIdeas({ mode: body.mode, characterIds: body.characterIds, seed: body.seed }),
      },
    };
  } catch (error) {
    return { status: 400, body: { ok: false, error: error instanceof Error ? error.message : "Those characters could not be used." } };
  }
}

function safePack(body: IdeaRequest) {
  return generateIdeas({ mode: body.mode, characterIds: body.characterIds, seed: body.seed });
}
