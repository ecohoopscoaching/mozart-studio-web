import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { extractPdf } from "@/server/pdfExtract";

async function pdfWithText(text: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([400, 400]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText(text, { x: 40, y: 200, size: 18, font, color: rgb(0, 0, 0) });
  return pdf.save();
}

describe("PDF extraction", () => {
  it("extracts a text PDF", async () => {
    const bytes = await pdfWithText("The clinic closed at dawn.");
    const result = await extractPdf("clinic.pdf", bytes);
    expect(result.ok).toBe(true);
    expect(result.text).toContain("The clinic closed at dawn.");
    expect(result.pageCount).toBe(1);
  });

  it("reports an empty text layer instead of inventing OCR", async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage();
    const result = await extractPdf("scan.pdf", await pdf.save());
    expect(result.status).toBe("empty");
    expect(result.failureReason).toBe("empty");
    expect(result.limitations.join(" ")).toMatch(/OCR/i);
    expect(result.text).toBe("");
  });

  it("rejects a file that is not a PDF", async () => {
    const result = await extractPdf("notes.pdf", new TextEncoder().encode("hello"));
    expect(result.failureReason).toBe("not-pdf");
  });

  it("reports a password-protected PDF", async () => {
    const bytes = new TextEncoder().encode("%PDF-1.6\ntrailer << /Encrypt 1 0 R /Size 1 >>\n%%EOF\n");
    const result = await extractPdf("locked.pdf", bytes);
    expect(result.ok).toBe(false);
    expect(result.failureReason).toBe("password");
    expect(result.text).toBe("");
    expect(result.limitations.join(" ")).toMatch(/password/i);
  });
});
