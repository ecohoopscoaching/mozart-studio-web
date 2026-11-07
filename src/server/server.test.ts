import { describe, expect, it } from "vitest";
import { ARTISTS } from "@/canon/artists";
import { emptyTopic } from "@/domain/project";
import { handleGenerate } from "@/server/generateHandler";
import { handleIdeas } from "@/server/ideasHandler";
import { healthReport } from "@/server/health";
import { liveGenerationAllowed } from "@/server/liveGate";

describe("health and live gate", () => {
  it("reports demo mode and does not claim a verified live model", () => {
    const health = healthReport({});
    expect(health.generation.publicMode).toBe("demo");
    expect(health.generation.liveCallsEnabled).toBe(false);
    expect(health.generation.verifiedLive).toBe(false);
    expect(health.audioGeneration).toBe(false);
    expect(health.persistence).toBe("browser-local-only");
    expect(health.generation.reason).toMatch(/DEMO/);
  });

  it("refuses live calls unless the flag, key, and bearer token all match", () => {
    const request = new Request("http://studio.local/api/generate", {
      headers: { authorization: "Bearer secret-token" },
    });
    expect(liveGenerationAllowed(request, { LIVE_GENERATION: "enabled", GEMINI_API_KEY: "k" }).allowed).toBe(false);
    expect(liveGenerationAllowed(request, { LIVE_GENERATION: "disabled", GEMINI_API_KEY: "k", GENERATION_ACCESS_TOKEN: "secret-token" }).allowed).toBe(false);
    expect(liveGenerationAllowed(request, { LIVE_GENERATION: "enabled", GEMINI_API_KEY: "k", GENERATION_ACCESS_TOKEN: "other" }).allowed).toBe(false);
    expect(liveGenerationAllowed(request, { LIVE_GENERATION: "enabled", GEMINI_API_KEY: "k", GENERATION_ACCESS_TOKEN: "secret-token" }).allowed).toBe(true);
  });

  it("does not call Gemini for a normal demo request", async () => {
    const artist = ARTISTS[0]!;
    const response = await handleGenerate(
      new Request("http://studio.local/api/generate", {
        method: "POST",
        body: JSON.stringify({
          artistId: artist.id,
          producerId: "16-the-maestro",
          topic: emptyTopic("A son practices interview questions in the car"),
          trackNumber: 1,
          trackCount: 1,
          arc: "sets the scene",
        }),
      }),
      {},
      async () => {
        throw new Error("Gemini should not be called");
      },
    );
    expect(response.status).toBe(200);
    expect(response.body.generationMode).toBe("demo");
    expect(response.body.label).toBe("DEMO sample output");
    expect(response.body.verifiedLive).toBe(false);
  });

  it("does not call a provider for character ideas", async () => {
    const response = await handleIdeas(
      new Request("http://studio.local/api/ideas", {
        method: "POST",
        body: JSON.stringify({ mode: "single", characterIds: ["batman"], requestLive: true }),
      }),
      { LIVE_GENERATION: "enabled", GEMINI_API_KEY: "present-but-unused", GENERATION_ACCESS_TOKEN: "secret-token" },
      async () => {
        throw new Error("Ideas must not call Gemini");
      },
    );
    expect(response.status).toBe(200);
    expect(response.body.generationMode).toBe("demo");
    expect(response.body.verifiedLive).toBe(false);
  });

  it("returns a simulated failure only when the test hook is on", async () => {
    const off = await handleGenerate(new Request("http://studio.local/api/generate", { method: "POST", body: JSON.stringify({ simulateFailure: true }) }), {});
    expect(off.status).toBe(400);
    const on = await handleGenerate(
      new Request("http://studio.local/api/generate", { method: "POST", body: JSON.stringify({ simulateFailure: true }) }),
      { ENABLE_GENERATION_TEST_HOOKS: "1" },
    );
    expect(on.status).toBe(500);
  });
});
