export interface LiveDecision {
  allowed: boolean;
  reason: string;
}

export function liveGenerationAllowed(request: Request, env: Record<string, string | undefined>): LiveDecision {
  if (env.LIVE_GENERATION !== "enabled") {
    return { allowed: false, reason: "LIVE_GENERATION is not enabled. Demo sample output is used." };
  }
  if (!env.GEMINI_API_KEY) {
    return { allowed: false, reason: "No Gemini key is configured on the server." };
  }
  if (!env.GENERATION_ACCESS_TOKEN) {
    return {
      allowed: false,
      reason: "Live generation requires GENERATION_ACCESS_TOKEN. A public deployment without that token stays on demo output. In-memory limits are not spending protection.",
    };
  }
  const header = request.headers.get("authorization") ?? "";
  if (header !== `Bearer ${env.GENERATION_ACCESS_TOKEN}`) {
    return { allowed: false, reason: "This request is not authorized for live generation. Demo sample output is used." };
  }
  return { allowed: true, reason: "Authorized server-side Gemini call." };
}
