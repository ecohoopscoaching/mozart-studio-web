"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { getArtist } from "@/canon/artists";
import { getProducer } from "@/canon/producers";
import { Shell } from "@/components/shell";
import { useStudio } from "@/components/studio-context";
import { generateTrack } from "@/client/api";
import { projectToMarkdown, trackToMarkdown, copyPromptText } from "@/domain/export";
import { applyRevision, restoreVersion } from "@/domain/revisions";
import { LYRICS_MAX, PROMPT_MAX, type RevisionVariable, type Track } from "@/domain/types";
import { mozartReady, validateTrack } from "@/domain/validate";

export default function TrackPage() {
  const params = useParams<{ id: string; trackId: string }>();
  const studio = useStudio();
  const project = studio.projects.find((item) => item.id === params.id);
  const track = project?.tracks.find((item) => item.id === params.trackId);
  const [note, setNote] = useState("");
  const [variable, setVariable] = useState<RevisionVariable>("lyrics");
  const [copied, setCopied] = useState("");
  if (!studio.ready) {
    return <Shell><p>Loading your songs.</p></Shell>;
  }
  if (!project || !track) {
    return (
      <Shell>
        <h1>Not on this browser.</h1>
        <Link className="btn btn-primary" href="/">Back home</Link>
      </Shell>
    );
  }
  return (
    <TrackEditor
      key={track.id + track.generation.status + track.prompt.length}
      projectId={project.id}
      track={track}
      note={note}
      setNote={setNote}
      variable={variable}
      setVariable={setVariable}
      copied={copied}
      setCopied={setCopied}
      saveTrack={(next) => {
        studio.save({ ...project, tracks: project.tracks.map((item) => (item.id === next.id ? next : item)) });
      }}
      saveProjectTracks={(tracks) => studio.save({ ...project, tracks })}
      allTracks={project.tracks}
      project={project}
    />
  );
}

function TrackEditor({
  projectId,
  track,
  note,
  setNote,
  variable,
  setVariable,
  copied,
  setCopied,
  saveTrack,
  allTracks,
  project,
}: {
  projectId: string;
  track: Track;
  note: string;
  setNote: (value: string) => void;
  variable: RevisionVariable;
  setVariable: (value: RevisionVariable) => void;
  copied: string;
  setCopied: (value: string) => void;
  saveTrack: (track: Track) => void;
  saveProjectTracks: (tracks: Track[]) => void;
  allTracks: Track[];
  project: ReturnType<typeof useStudio>["projects"][number];
}) {
  const artist = getArtist(track.artistId, project.customArtists);
  const producer = getProducer(track.producerId);
  const issues = useMemo(() => (artist && track.generation.status !== "empty" ? validateTrack(track, artist) : []), [artist, track]);
  const ready = artist ? mozartReady(issues) && track.generation.status !== "failed" : false;
  const next = allTracks.find((item) => item.number === track.number + 1);
  const blocks = issues.filter((issue) => issue.severity !== "warn");

  async function copy(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
  }

  function download(filename: string, contents: string) {
    const blob = new Blob([contents], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Shell>
      <p className="eyebrow">Song {track.number} of {allTracks.length}</p>
      <h1>{track.title}</h1>
      <p className="banner">{track.generation.label || "Not written yet."} {track.generation.label ? "Not live AI. No audio." : ""}</p>
      {track.generation.error ? <p className="banner bad">{track.generation.error}</p> : null}
      {copied ? <p className="banner ok" role="status">{copied}</p> : null}
      {blocks.length ? (
        <div className="banner bad" role="alert">
          {blocks.map((issue) => (
            <p key={issue.code + issue.message} className="issue"><strong>{issue.message}</strong> {issue.fix}</p>
          ))}
        </div>
      ) : track.prompt ? (
        <p className="banner ok">This draft passes the Mozart checks.</p>
      ) : null}
      {track.decisions.map((decision) => (
        <div key={decision.id} className="stack">
          <p>{decision.question}</p>
          {decision.options.map((option) => (
            <button
              key={option.id}
              type="button"
              className="btn btn-primary"
              onClick={() => {
                const answers = { ...track.answers, [decision.id]: option.id };
                const nextTrack = { ...track, answers, decisions: [] };
                void generateTrack(project, nextTrack).then((result) => {
                  saveTrack({ ...nextTrack, lyrics: result.lyrics, prompt: result.prompt, brief: result.brief, decisions: result.decisions, generation: { status: "demo", label: result.label } });
                });
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ))}
      {track.brief ? (
        <div className="stack">
          {(["purpose", "feel", "sound", "voice", "movement", "review"] as const).map((key) => (
            <section key={key} className="card">
              <p className="eyebrow">{key}</p>
              <p>{track.brief?.[key]}</p>
            </section>
          ))}
        </div>
      ) : null}
      <div className="stack" style={{ marginTop: 16 }}>
        {!track.instrumental ? (
          <>
            <label htmlFor="lyrics">Lyrics</label>
            <textarea id="lyrics" data-testid="lyrics" value={track.lyrics} onChange={(event) => saveTrack({ ...track, lyrics: event.target.value })} />
            <p className={track.lyrics.length >= LYRICS_MAX ? "count bad" : "count"}>{track.lyrics.length} / under {LYRICS_MAX}</p>
          </>
        ) : (
          <p data-testid="lyrics">Instrumental. Lyrics are empty on purpose.</p>
        )}
        <p className="eyebrow">Mozart prompt</p>
        <pre className="prompt" data-testid="prompt">{track.prompt || "The prompt appears after any required choice."}</pre>
        <p className={track.prompt.length > PROMPT_MAX ? "count bad" : "count"}>{track.prompt.length} / {PROMPT_MAX}</p>
        {ready && !track.instrumental ? (
          <button type="button" className="btn btn-primary" onClick={() => void copy(track.lyrics, "Lyrics copied.")}>Copy lyrics</button>
        ) : null}
        {ready ? (
          <button type="button" className="btn btn-primary" onClick={() => void copy(copyPromptText(track.prompt), "Prompt copied. Paste the paragraph into Mozart.")}>Copy sound prompt</button>
        ) : (
          <button type="button" className="btn btn-primary" disabled>Fix the draft before copy</button>
        )}
        {next ? (
          <Link className="btn btn-secondary" href={`/project/${projectId}/track/${next.id}`}>Next song</Link>
        ) : (
          <Link className="btn btn-secondary" href={`/project/${projectId}`}>Back to the songs</Link>
        )}
        <details>
          <summary>More options</summary>
          <div className="stack">
            <p>{artist?.name}. {producer?.internal ? "Internal producer preset." : producer?.name}. {artist?.pairingNote}</p>
            {issues.filter((issue) => issue.severity === "warn").map((issue) => (
              <p key={issue.message} className="muted">{issue.message}</p>
            ))}
            <label htmlFor="revision-note">One change</label>
            <textarea id="revision-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Say exactly what changes." />
            <label htmlFor="variable">What changes</label>
            <select id="variable" value={variable} onChange={(event) => setVariable(event.target.value as RevisionVariable)}>
              {["lyrics", "production", "voice", "story", "tempo", "hook", "mood"].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                const result = applyRevision(project, track, [variable], note);
                if (result.issues.length) {
                  setCopied(result.issues[0]?.fix || result.issues[0]?.message || "That revision was not applied.");
                  return;
                }
                saveTrack(result.track);
                setCopied(`Changed ${variable} only.`);
                setNote("");
              }}
            >
              Apply this one change
            </button>
            <button type="button" className="btn btn-ghost" aria-pressed={track.locks.lyrics} onClick={() => saveTrack({ ...track, locks: { ...track.locks, lyrics: !track.locks.lyrics } })}>
              {track.locks.lyrics ? "Lyrics locked" : "Lock lyrics"}
            </button>
            <button type="button" className="btn btn-ghost" aria-pressed={track.locks.production} onClick={() => saveTrack({ ...track, locks: { ...track.locks, production: !track.locks.production } })}>
              {track.locks.production ? "Production locked" : "Lock production"}
            </button>
            <button type="button" className="btn btn-ghost" aria-pressed={track.locks.voice} onClick={() => saveTrack({ ...track, locks: { ...track.locks, voice: !track.locks.voice } })}>
              {track.locks.voice ? "Voice locked" : "Lock voice"}
            </button>
            <button type="button" className="btn btn-ghost" aria-pressed={track.locks.story} onClick={() => saveTrack({ ...track, locks: { ...track.locks, story: !track.locks.story } })}>
              {track.locks.story ? "Story locked" : "Lock story"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => saveTrack({ ...track, instrumental: !track.instrumental, lyrics: !track.instrumental ? "" : track.lyrics })}>
              {track.instrumental ? "This track is instrumental" : "Make this track instrumental"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => saveTrack({ ...track, testMode: !track.testMode })}>
              {track.testMode ? "Batch-test settings are on" : "Batch-test settings are off"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                void generateTrack(project, track).then((result) => {
                  saveTrack({ ...track, lyrics: result.lyrics, prompt: result.prompt, brief: result.brief, decisions: result.decisions, generation: { status: "demo", label: result.label } });
                });
              }}
            >
              Write this song again
            </button>
            {track.history.map((version) => (
              <button key={version.id} type="button" className="btn btn-secondary" onClick={() => saveTrack(restoreVersion(track, version.id))}>
                Bring back: {version.summary}
              </button>
            ))}
            <button type="button" className="btn btn-secondary" disabled={!ready} onClick={() => download(`${track.title}.md`, trackToMarkdown(project, track))}>
              {ready ? "Export Mozart-ready Markdown" : "Export blocked until the draft passes"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => download(`${track.title}-draft.md`, `NOT MOZART-READY\n\n${projectToMarkdown(project)}`)}>
              Download a labeled draft anyway
            </button>
          </div>
        </details>
        <Link className="btn btn-ghost" href={`/project/${projectId}`}>Back</Link>
      </div>
    </Shell>
  );
}
