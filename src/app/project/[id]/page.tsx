"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Shell } from "@/components/shell";
import { useStudio } from "@/components/studio-context";
import { generateTrack } from "@/client/api";

export default function ProjectPage() {
  const params = useParams<{ id: string }>();
  const studio = useStudio();
  const project = studio.projects.find((item) => item.id === params.id);
  if (!studio.ready) {
    return (
      <Shell>
        <p>Loading your songs.</p>
      </Shell>
    );
  }
  if (!project) {
    return (
      <Shell>
        <h1>Not on this browser.</h1>
        <Link className="btn btn-primary" href="/">
          Back home
        </Link>
      </Shell>
    );
  }
  const failed = project.tracks.filter((track) => track.generation.status === "failed");
  const first = project.tracks.find((track) => track.generation.status !== "failed") ?? project.tracks[0];
  return (
    <Shell>
      <p className="eyebrow">{project.format.toUpperCase()} · {project.tracks.length} songs</p>
      <h1>{project.title}</h1>
      <p className="lede">{project.sentence}</p>
      {failed.length ? <p className="banner bad">{failed.length} song{failed.length === 1 ? "" : "s"} failed. The finished ones are still here.</p> : null}
      <div className="stack">
        {first ? (
          <Link className="btn btn-primary" href={`/project/${project.id}/track/${first.id}`}>
            Open song {first.number}
          </Link>
        ) : null}
        {project.tracks.map((track) => (
          <Link key={track.id} className="btn btn-secondary" href={`/project/${project.id}/track/${track.id}`}>
            Song {track.number}: {track.title}
            {track.generation.status === "failed" ? " · failed" : track.instrumental ? " · instrumental" : ""}
          </Link>
        ))}
        {failed.map((track) => (
          <button
            key={`retry-${track.id}`}
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              void generateTrack(project, track)
                .then((result) => {
                  studio.save({
                    ...project,
                    tracks: project.tracks.map((item) =>
                      item.id === track.id
                        ? { ...item, lyrics: result.lyrics, prompt: result.prompt, brief: result.brief, decisions: result.decisions, generation: { status: "demo", label: result.label } }
                        : item,
                    ),
                  });
                })
                .catch((reason: unknown) => {
                  studio.save({
                    ...project,
                    tracks: project.tracks.map((item) =>
                      item.id === track.id
                        ? { ...item, generation: { status: "failed", label: "DEMO sample output", error: reason instanceof Error ? reason.message : "Still failed." } }
                        : item,
                    ),
                  });
                });
            }}
          >
            Try song {track.number} again
          </button>
        ))}
        <Link className="btn btn-secondary" href={`/project/${project.id}/sources`}>
          Add a source PDF
        </Link>
        <Link className="btn btn-ghost" href="/library">
          Back to saved songs
        </Link>
      </div>
    </Shell>
  );
}
