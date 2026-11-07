import { handleIdeas } from "@/server/ideasHandler";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const result = await handleIdeas(request, process.env);
  return NextResponse.json(result.body, { status: result.status });
}
