"use client";

import Link from "next/link";
import { Shell } from "@/components/shell";
import { useStudio } from "@/components/studio-context";

export default function LibraryPage() {
  const studio = useStudio();
  return (
    <Shell>
      <p className="eyebrow">On this browser</p>
      <h1>Saved songs.</h1>
      {!studio.ready ? <p>Loading your songs.</p> : null}
      {studio.ready && studio.projects.length === 0 ? (
        <div className="stack">
          <p>No saved songs yet.</p>
          <Link className="btn btn-primary" href="/start">
            Start a song
          </Link>
        </div>
      ) : null}
      <div className="stack">
        {studio.projects.map((project) => (
          <Link key={project.id} className="btn btn-secondary" href={`/project/${project.id}`}>
            {project.title} · {project.tracks.length}
          </Link>
        ))}
        <Link className="btn btn-ghost" href="/">
          Back
        </Link>
      </div>
    </Shell>
  );
}
