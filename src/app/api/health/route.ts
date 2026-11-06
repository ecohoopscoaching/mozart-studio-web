import { healthReport } from "@/server/health";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(healthReport(process.env));
}
