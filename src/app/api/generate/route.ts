import { handleGenerate } from "@/server/generateHandler";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const result = await handleGenerate(request, process.env);
  return NextResponse.json(result.body, { status: result.status });
}
