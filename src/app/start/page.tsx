"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ARTISTS } from "@/canon/artists";
import { PRODUCERS } from "@/canon/producers";
import { generateTrack } from "@/client/api";
import { Shell } from "@/components/shell";
import { useStudio } from "@/components/studio-context";
import { createProject } from "@/domain/project";
import { mergeLocked, randomSituation, situationToTopic, type TopicFilters } from "@/domain/topics";
import { FORMATS, type FormatId, type Topic } from "@/domain/types";

const SIMPLE_ARTISTS = ARTISTS.filter((artist) => artist.simpleChoice);
const MORE_ARTISTS = ARTISTS.filter((artist) => !artist.simpleChoice);

export default function StartPage() {
  const router = useRouter();
  const studio = useStudio();
  const [step, setStep] = useState(1);
  const [sentence, setSentence] = useState("");
  const [format, setFormat] = useState<FormatId>("single");
  const [instrumental, setInstrumental] = useState(false);
  const [artistId, setArtistId] = useState("fable");
  const [producerId, setProducerId] = useState("16-the-maestro");
  const [topic, setTopic] = useState<Topic | null>(null);
  const [showArtists, setShowArtists] = useState(false);
  const [showProducers, setShowProducers] = useState(false);
  const [producerQuery, setProducerQuery] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<TopicFilters>({});
  const [lockedIdea, setLockedIdea] = useState(false);

  const artist = ARTISTS.find((item) => item.id === artistId) ?? SIMPLE_ARTISTS[0];
  const producer = PRODUCERS.find((item) => item.id === producerId) ?? PRODUCERS[0];
  const producers = useMemo(() => {
    const query = producerQuery.trim().toLowerCase();
    const pool = query
      ? PRODUCERS.filter((item) => `${item.name} ${item.tag} ${item.desc}`.toLowerCase().includes(query))
      : PRODUCERS.filter((item) => !item.internal).slice(0, 8);
    return pool.slice(0, 12);
  }, [producerQuery]);

  function fillRandom() {
    const situation = randomSituation(filters, Date.now());
    const next = situationToTopic(situation);
    const merged = topic && lockedIdea ? mergeLocked(topic, next, { centralIdea: true }) : next;
    setTopic(merged);
    if (!lockedIdea) setSentence(merged.centralIdea);
  }

  async function writeSong() {
    setError("");
    const idea = (topic?.centralIdea || sentence).trim();
    const project = createProject({ sentence: idea, format, instrumental, artistId, producerId });
    if (topic) {
      project.topic = { ...topic, centralIdea: idea };
      project.tracks = project.tracks.map((track) => ({
        ...track,
        topic: { ...track.topic, ...topic, centralIdea: idea, arc: track.arc, conflict: track.topic.conflict },
      }));
    }
    setBusy(`Writing song 1 of ${project.tracks.length}`);
    const tracks = [];
    for (const track of project.tracks) {
      setBusy(`Writing song ${track.number} of ${project.tracks.length}`);
      try {
        const result = await generateTrack(project, track);
        tracks.push({
          ...track,
          lyrics: result.lyrics,
          prompt: result.prompt,
          brief: result.brief,
          decisions: result.decisions,
          generation: { status: "demo" as const, label: result.label, liveDeniedReason: result.liveDeniedReason },
        });
      } catch (reason) {
        tracks.push({
          ...track,
          generation: {
            status: "failed" as const,
            label: "DEMO sample output",
            error: reason instanceof Error ? reason.message : "This song failed.",
          },
        });
      }
    }
    project.tracks = tracks;
    studio.save(project);
    setBusy("");
    router.push(`/project/${project.id}`);
  }

  return (
    <Shell>
      <p className="eyebrow">Step {step} of 3</p>
      {step === 1 ? (
        <>
          <h1>What is it about?</h1>
          <p className="lede">One sentence is enough.</p>
          <label htmlFor="idea">Your sentence</label>
          <textarea id="idea" value={sentence} onChange={(event) => setSentence(event.target.value)} placeholder="A night nurse locks the clinic and sits in the car." />
          <div className="stack" style={{ marginTop: 16 }}>
            <p className="muted">How many songs?</p>
            {(Object.keys(FORMATS) as FormatId[]).map((id) => (
              <button key={id} type="button" className="btn btn-secondary choice" aria-pressed={format === id} onClick={() => setFormat(id)}>
                {FORMATS[id].label} · {FORMATS[id].tracks}
              </button>
            ))}
            <button type="button" className="btn btn-secondary choice" aria-pressed={!instrumental} onClick={() => setInstrumental(false)}>
              With words
            </button>
            <button type="button" className="btn btn-secondary choice" aria-pressed={instrumental} onClick={() => setInstrumental(true)}>
              Instrumental only
            </button>
            <button type="button" className="btn btn-primary" disabled={sentence.trim().length < 8} onClick={() => setStep(2)}>
              Next
            </button>
            <details>
              <summary>More options</summary>
              <div className="stack">
                <p>Get a specific real-life situation. It is fiction, not a fact about you.</p>
                <label htmlFor="subject">Subject</label>
                <input id="subject" type="text" value={filters.subject ?? ""} onChange={(event) => setFilters({ ...filters, subject: event.target.value })} placeholder="work, family, money" />
                <button type="button" className="btn btn-secondary" onClick={fillRandom}>
                  Give me a situation
                </button>
                <button type="button" className="btn btn-ghost" aria-pressed={lockedIdea} onClick={() => setLockedIdea((value) => !value)}>
                  {lockedIdea ? "Sentence locked" : "Lock this sentence"}
                </button>
              </div>
            </details>
          </div>
        </>
      ) : null}
      {step === 2 ? (
        <>
          <h1>Who is on it?</h1>
          <p className="lede">The voice and the beat are separate. You can leave the suggestion.</p>
          <div className="card">
            <p className="eyebrow">Writing as</p>
            <h2>{artist.name}</h2>
            <p>{artist.oneLine}</p>
            {artist.incomplete.length ? <p className="muted">Incomplete: {artist.incomplete[0]}</p> : null}
          </div>
          <div className="card">
            <p className="eyebrow">Producing as</p>
            <h2>{producer.internal ? "Internal preset" : producer.name}</h2>
            <p>{producer.internal ? "The real-person name stays in the library and out of the prompt." : producer.tag || "Fictional producer label."}</p>
          </div>
          <div className="stack" style={{ marginTop: 16 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowArtists((value) => !value)}>
              {showArtists ? "Hide voices" : "Change voice"}
            </button>
            {showArtists
              ? SIMPLE_ARTISTS.map((item) => (
                  <button key={item.id} type="button" className="btn btn-secondary choice" aria-pressed={artistId === item.id} onClick={() => setArtistId(item.id)}>
                    {item.name}
                  </button>
                ))
              : null}
            {showArtists ? (
              <details>
                <summary>Batch-test voices</summary>
                {MORE_ARTISTS.map((item) => (
                  <button key={item.id} type="button" className="btn btn-secondary choice" aria-pressed={artistId === item.id} onClick={() => setArtistId(item.id)}>
                    {item.name} · pen incomplete
                  </button>
                ))}
              </details>
            ) : null}
            <button type="button" className="btn btn-secondary" onClick={() => setShowProducers((value) => !value)}>
              {showProducers ? "Hide producers" : "Change producer"}
            </button>
            {showProducers ? (
              <>
                <label htmlFor="producer-search">Search producers</label>
                <input id="producer-search" type="search" value={producerQuery} onChange={(event) => setProducerQuery(event.target.value)} placeholder="Type a producer" />
                {producers.map((item) => (
                  <button key={item.id} type="button" className="btn btn-secondary choice" aria-pressed={producerId === item.id} onClick={() => setProducerId(item.id)}>
                    {item.internal ? `${item.name} · internal` : item.name}
                  </button>
                ))}
              </>
            ) : null}
            <button type="button" className="btn btn-primary" onClick={() => setStep(3)}>
              Next
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
              Back
            </button>
          </div>
        </>
      ) : null}
      {step === 3 ? (
        <>
          <h1>Ready.</h1>
          <p className="lede">{sentence}</p>
          <p>
            {FORMATS[format].label} · {artist.name} · {producer.internal ? "Internal preset" : producer.name}
            {instrumental ? " · Instrumental" : ""}
          </p>
          <p className="banner">DEMO sample output. This is not live AI, and it does not make audio.</p>
          {error ? <p className="banner bad">{error}</p> : null}
          {busy ? <p className="banner">{busy} Finished songs stay if a later one fails.</p> : null}
          <div className="stack" style={{ marginTop: 16 }}>
            <button type="button" className="btn btn-primary" disabled={Boolean(busy)} onClick={() => void writeSong()}>
              {busy || "Write the song"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>
              Back
            </button>
          </div>
        </>
      ) : null}
    </Shell>
  );
}
