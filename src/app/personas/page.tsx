"use client";

import Link from "next/link";
import { useState } from "react";
import { ARTISTS, CANON_NOTES, ZEKE } from "@/canon/artists";
import { PRODUCERS } from "@/canon/producers";
import { Shell } from "@/components/shell";
import { importArtistJson } from "@/domain/customArtist";

export default function PersonasPage() {
  const [message, setMessage] = useState(CANON_NOTES.book);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Shell>
      <p className="eyebrow">Library</p>
      <h1>Voices.</h1>
      <p className="lede">{CANON_NOTES.twelfth} {CANON_NOTES.partTwo}</p>
      <p className="muted">{CANON_NOTES.withheld}</p>
      <div className="stack">
        {ARTISTS.map((artist) => (
          <article key={artist.id} className="card">
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(open === artist.id ? null : artist.id)}>
              {artist.name} · {artist.lane}
            </button>
            {open === artist.id ? (
              <div>
                <p>{artist.oneLine}</p>
                <p>{artist.vocal.instrument}</p>
                <p>Protected character: {artist.vocal.protectedCharacter}</p>
                {artist.regionPhrase ? <p>Region phrase: {artist.regionPhrase}</p> : <p>Region phrase: incomplete.</p>}
                <ul>
                  {artist.writingDevices.map((device) => (
                    <li key={device}>{device}</li>
                  ))}
                </ul>
                {artist.incomplete.map((item) => (
                  <p key={item} className="muted">Incomplete: {item}</p>
                ))}
                {artist.conflicts.map((item) => (
                  <p key={item}>Conflict: {item}</p>
                ))}
                {artist.provenance.map((item) => (
                  <p key={item} className="muted">{item}</p>
                ))}
              </div>
            ) : null}
          </article>
        ))}
        <article className="card">
          <h2>{ZEKE.name}</h2>
          <p>{ZEKE.oneLine}</p>
          <p>{ZEKE.voice}</p>
          {ZEKE.incomplete.map((item) => (
            <p key={item} className="muted">{item}</p>
          ))}
        </article>
        <label htmlFor="persona-json">Import a persona JSON file</label>
        <input
          id="persona-json"
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            void file.text().then((text) => {
              try {
                const result = importArtistJson(JSON.parse(text));
                setMessage(result.error || `${result.artist?.name} can be copied into a project from a future editor. The canon cards stay unchanged.`);
              } catch {
                setMessage("That file is not JSON.");
              }
            });
          }}
        />
        <p>{message}</p>
        <details>
          <summary>Producer count</summary>
          <p>{PRODUCERS.length} producers are seeded. Internal real-person names stay out of prompts.</p>
        </details>
        <Link className="btn btn-primary" href="/">Back home</Link>
      </div>
    </Shell>
  );
}
