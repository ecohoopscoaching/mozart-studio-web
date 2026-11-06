import { extractPdf } from "@/server/pdfExtract";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, status: "failed", failureReason: "not-pdf", text: "", limitations: ["Choose a PDF file."] }, { status: 400 });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = await extractPdf(file.name || "upload.pdf", bytes);
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
