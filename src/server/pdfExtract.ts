export interface PdfExtraction {
  ok: boolean;
  status: "ready" | "empty" | "failed";
  filename: string;
  text: string;
  pageCount: number;
  failureReason?: "not-pdf" | "password" | "empty" | "unreadable" | "too-large" | "text-too-large";
  limitations: string[];
}

const MAX_BYTES = 8_000_000;
const MAX_TEXT = 200_000;

export async function extractPdf(filename: string, bytes: Uint8Array): Promise<PdfExtraction> {
  const limitations = [
    "Text is extracted from the PDF's text layer.",
    "This studio does not run OCR. A scan or photo of a page comes back empty.",
    "The file itself is not stored on a server. Extracted text stays in this browser if you keep it on the project.",
  ];
  if (bytes.byteLength > MAX_BYTES) {
    return { ok: false, status: "failed", filename, text: "", pageCount: 0, failureReason: "too-large", limitations: ["Files over 8 MB are refused. Nothing was stored."] };
  }
  const header = new TextDecoder().decode(bytes.slice(0, 5));
  if (!header.startsWith("%PDF")) {
    return { ok: false, status: "failed", filename, text: "", pageCount: 0, failureReason: "not-pdf", limitations: ["The file does not start like a PDF."] };
  }
  const probe = new TextDecoder().decode(bytes.slice(0, Math.min(bytes.byteLength, 200_000)));
  if (probe.includes("/Encrypt")) {
    return {
      ok: false,
      status: "failed",
      filename,
      text: "",
      pageCount: 0,
      failureReason: "password",
      limitations: ["This PDF is password-protected. Remove the password and try again. Nothing was extracted."],
    };
  }
  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(bytes);
    const extracted = await extractText(pdf, { mergePages: false });
    const pages = Array.isArray(extracted.text) ? extracted.text : [String(extracted.text ?? "")];
    const text = pages
      .map((page, index) => {
        const body = String(page ?? "").trim();
        return body ? `Page ${index + 1}\n${body}` : "";
      })
      .filter(Boolean)
      .join("\n\n");
    if (text.length > MAX_TEXT) {
      return {
        ok: false,
        status: "failed",
        filename,
        text: "",
        pageCount: extracted.totalPages ?? pages.length,
        failureReason: "text-too-large",
        limitations: [`This PDF has ${text.length} characters of text. The browser store keeps at most ${MAX_TEXT}. Split the file. Nothing was cut and nothing was saved.`],
      };
    }
    if (!text.trim()) {
      return {
        ok: false,
        status: "empty",
        filename,
        text: "",
        pageCount: extracted.totalPages ?? pages.length,
        failureReason: "empty",
        limitations: [...limitations, "No text layer was found. If this is a scan, OCR is not available here."],
      };
    }
    return { ok: true, status: "ready", filename, text, pageCount: extracted.totalPages ?? pages.length, limitations };
  } catch (error) {
    const message = error instanceof Error ? `${error.name} ${error.message}` : "unreadable";
    const password = /password/i.test(message);
    return {
      ok: false,
      status: "failed",
      filename,
      text: "",
      pageCount: 0,
      failureReason: password ? "password" : "unreadable",
      limitations: [password ? "This PDF is password-protected. Remove the password and try again." : "The PDF could not be read. It may be damaged."],
    };
  }
}
