export interface HealthReport {
  ok: true;
  service: "mozart-studio-web";
  persistence: "browser-local-only";
  audioGeneration: false;
  mozartJobSubmit: false;
  generation: {
    publicMode: "demo";
    liveCallsEnabled: boolean;
    provider: "gemini";
    keyConfigured: boolean;
    accessControlConfigured: boolean;
    verifiedLive: false;
    reason: string;
  };
}

export function healthReport(env: Record<string, string | undefined>): HealthReport {
  const keyConfigured = Boolean(env.GEMINI_API_KEY);
  const accessControlConfigured = Boolean(env.GENERATION_ACCESS_TOKEN);
  const liveCallsEnabled = env.LIVE_GENERATION === "enabled" && keyConfigured && accessControlConfigured;
  const reason = liveCallsEnabled
    ? "A server key and access token are set, and LIVE_GENERATION=enabled. Public pages still receive DEMO sample output. A live call happens only when a request sends that token. This health check does not call Gemini and has not verified live writing."
    : "DEMO sample output. Live Gemini calls are off. Turn them on only with LIVE_GENERATION=enabled, GEMINI_API_KEY, and GENERATION_ACCESS_TOKEN on the server. The website never sends that token. Leaving the flag off is the spending protection. In-memory rate limits are not used and would not be enough.";
  return {
    ok: true,
    service: "mozart-studio-web",
    persistence: "browser-local-only",
    audioGeneration: false,
    mozartJobSubmit: false,
    generation: {
      publicMode: "demo",
      liveCallsEnabled,
      provider: "gemini",
      keyConfigured,
      accessControlConfigured,
      verifiedLive: false,
      reason,
    },
  };
}
