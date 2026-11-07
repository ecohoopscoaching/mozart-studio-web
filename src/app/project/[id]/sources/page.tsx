"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { useStudio } from "@/components/studio-context";
import { newId } from "@/domain/project";
import type { SourceDoc } from "@/domain/types";

export default function SourcesPage() {
  const params = useParams<{ id: string }>();
  const studio = useStudio();
  const project = studio.projects.find((item) => item.id === params.id);
  const [message, setMessage] = useState("");
  if (!project) {
    return (
      <Shell>
        <h1>Not on this browser.</h1>
        <Link className="btn btn-primary" href="/">Back home</Link>
      </Shell>
    );
  }
  async function onFile(file: File) {
    setMessage("Reading the PDF.");
    const form = new FormData();
    form.set("file", file);
    const response = await fetch("/api/extract-pdf", { method: "POST", body: form });
    const body = (await response.json()) as {
      ok: boolean;
      status: SourceDoc["status"];
      text: string;
      pageCount?: number;
      failureReason?: string;
      limitations: string[];
      filename: string;
    };
    const doc: SourceDoc = {
      id: newId(),
      filename: body.filename || file.name,
      status: body.status,
      failureReason: body.failureReason,
      pageCount: body.pageCount,
      text: body.text || "",
      limitations: body.limitations || [],
      selected: body.ok,
    };
    studio.save({ ...project!, sources: [...project!.sources, doc] });
    setMessage(body.ok ? "Text extracted. It is selected for the next write." : body.limitations?.[0] || "The PDF could not be used.");
  }
  return (
    <Shell>
      <p className="eyebrow">Sources</p>
      <h1>Add a PDF.</h1>
      <p className="lede">Use it as research. The studio will not copy reference verses into the lyric.</p>
      <label htmlFor="pdf">PDF file</label>
      <input
        id="pdf"
        type="file"
        accept="application/pdf,.pdf"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void onFile(file);
        }}
      />
      {message ? <p className="banner">{message}</p> : null}
      <div className="stack" style={{ marginTop: 16 }}>
        {project.sources.map((source) => (
          <article key={source.id} className="card">
            <h2>{source.filename}</h2>
            <p>{source.status === "ready" ? `${source.pageCount ?? "?"} pages` : source.failureReason}</p>
            {source.limitations.map((line) => (
              <p key={line} className="muted">{line}</p>
            ))}
            {source.text ? <p className="lyric-view">{source.text.slice(0, 600)}</p> : null}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                studio.save({
                  ...project,
                  sources: project.sources.map((item) => (item.id === source.id ? { ...item, selected: !item.selected } : item)),
                })
              }
            >
              {source.selected ? "Selected" : "Use this source"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => studio.save({ ...project, sources: project.sources.filter((item) => item.id !== source.id) })}
            >
              Remove
            </button>
          </article>
        ))}
        <Link className="btn btn-primary" href={`/project/${project.id}`}>
          Back to songs
        </Link>
      </div>
    </Shell>
  );
}
