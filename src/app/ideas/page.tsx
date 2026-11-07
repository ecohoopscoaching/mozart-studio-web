"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CHARACTERS, DOCUMENTED_COLLISIONS, getCharacter } from "@/canon/character-bible";
import { IDEA_DRAFT_KEY } from "@/client/storage";
import { Shell } from "@/components/shell";
import { generateIdeas, projectFromSelection, randomPair, type IdeaPack } from "@/domain/characterIdeas";
import { FORMATS, type FormatId } from "@/domain/types";

type Mode = "single" | "collision" | "random";

export default function IdeasPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  const [query, setQuery] = useState("");
  const [firstId, setFirstId] = useState<string | null>(null);
  const [secondId, setSecondId] = useState<string | null>(null);
  const [pack, setPack] = useState<IdeaPack | null>(null);
  const [hooks, setHooks] = useState<string[]>([]);
  const [chosen, setChosen] = useState(0);
  const [error, setError] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CHARACTERS.filter((card) => !q || `${card.name} ${card.coreTheme} ${card.flagshipRapTopic}`.toLowerCase().includes(q));
  }, [query]);

  function produce(nextMode: Mode, ids: string[], seed?: number) {
    setError("");
    try {
      const next = generateIdeas({ mode: nextMode, characterIds: ids, seed });
      setPack(next);
      setHooks(next.hooks);
      setChosen(0);
      setMode(nextMode);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Those characters could not be used.");
    }
  }

  function useSelection(albumIndex: number | null) {
    if (!pack) return;
    const project = projectFromSelection(
      { pack, conceptIndex: chosen, hook: hooks[Math.min(chosen, hooks.length - 1)] ?? hooks[0] ?? "", albumIndex },
      {},
    );
    const draft = {
      sentence: project.sentence,
      format: project.format,
      topic: project.topic,
      trackSeeds: project.tracks.map((track) => ({
        purpose: track.topic.purpose,
        conflict: track.topic.conflict,
        scenes: track.topic.scenes,
      })),
    };
    window.sessionStorage.setItem(IDEA_DRAFT_KEY, JSON.stringify(draft));
    router.push("/start");
  }

  return (
    <Shell>
      <p className="eyebrow">Optional</p>
      {!pack ? (
        <>
          <h1>Find a song idea.</h1>
          <p className="lede">Character inspiration only. It does not pick the voice, and it does not name the character in the song.</p>
          {error ? <p className="banner bad">{error}</p> : null}
          {!mode ? (
            <div className="stack">
              <button type="button" className="btn btn-primary" onClick={() => setMode("single")}>
                One character
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setMode("collision")}>
                Two characters
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => produce("random", [], Date.now() % 30)}
              >
                Surprise me
              </button>
              <Link className="btn btn-ghost" href="/">
                Back home
              </Link>
            </div>
          ) : null}
          {mode === "single" ? (
            <Picker
              query={query}
              setQuery={setQuery}
              cards={visible}
              selected={firstId}
              onSelect={(id) => {
                setFirstId(id);
              }}
              action="Make song ideas"
              onAction={() => firstId && produce("single", [firstId])}
              onBack={() => setMode(null)}
            />
          ) : null}
          {mode === "collision" && !firstId ? (
            <Picker
              query={query}
              setQuery={setQuery}
              cards={visible}
              selected={null}
              onSelect={setFirstId}
              onBack={() => setMode(null)}
              extra={
                <details>
                  <summary>Six examples from the PDF</summary>
                  <div className="stack">
                    {DOCUMENTED_COLLISIONS.map((item) => (
                      <button
                        key={item.topic}
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => produce("collision", [...item.characterIds])}
                      >
                        {item.topic}
                      </button>
                    ))}
                  </div>
                </details>
              }
            />
          ) : null}
          {mode === "collision" && firstId && !pack ? (
            <Picker
              query={query}
              setQuery={setQuery}
              cards={visible.filter((card) => card.id !== firstId)}
              selected={secondId}
              onSelect={setSecondId}
              action="Make song ideas"
              onAction={() => secondId && produce("collision", [firstId, secondId])}
              onBack={() => setFirstId(null)}
              heading={`With ${getCharacter(firstId)?.name}. Pick a different character.`}
            />
          ) : null}
        </>
      ) : (
        <Results pack={pack} hooks={hooks} setHooks={setHooks} chosen={chosen} setChosen={setChosen} onUse={useSelection} onBack={() => setPack(null)} />
      )}
    </Shell>
  );
}

function Picker({
  query,
  setQuery,
  cards,
  selected,
  onSelect,
  action,
  onAction,
  onBack,
  heading,
  extra,
}: {
  query: string;
  setQuery: (value: string) => void;
  cards: typeof CHARACTERS;
  selected: string | null;
  onSelect: (id: string) => void;
  action?: string;
  onAction?: () => void;
  onBack: () => void;
  heading?: string;
  extra?: ReactNode;
}) {
  return (
    <div className="stack">
      {heading ? <h2>{heading}</h2> : null}
      <label htmlFor="character-search">Search characters</label>
      <input id="character-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Type a name" />
      {action && onAction ? (
        <button type="button" className="btn btn-primary" disabled={!selected} onClick={onAction}>
          {action}
        </button>
      ) : null}
      {extra}
      {cards.map((card) => (
        <button key={card.id} type="button" className="btn btn-secondary choice" aria-pressed={selected === card.id} onClick={() => onSelect(card.id)}>
          {card.name} · {card.flagshipRapTopic}
        </button>
      ))}
      <button type="button" className="btn btn-ghost" onClick={onBack}>
        Back
      </button>
    </div>
  );
}

function Results({
  pack,
  hooks,
  setHooks,
  chosen,
  setChosen,
  onUse,
  onBack,
}: {
  pack: IdeaPack;
  hooks: string[];
  setHooks: (hooks: string[]) => void;
  chosen: number;
  setChosen: (index: number) => void;
  onUse: (albumIndex: number | null) => void;
  onBack: () => void;
}) {
  const concept = pack.concepts[chosen];
  return (
    <>
      <h1>{pack.collision?.topic ?? pack.documented.flagshipRapTopics[0]}</h1>
      <p className="banner">{pack.label}. Scores are {pack.concepts[0]?.score.label}. Not live analysis.</p>
      <p>{pack.collision ? (pack.collision.source === "documented-example" ? "This pairing is one of the six examples in the PDF." : "This pairing is a new combination. It is not one of the six PDF examples.") : "One character. The wound line below is a studio reading, not a PDF fact."}</p>
      <section className="card">
        <p className="eyebrow">Documented</p>
        <p>Theme: {pack.documented.coreThemes.join(" / ")}</p>
        <p>Conflict: {pack.documented.primaryConflicts.join(" / ")}</p>
        <p>Flagship: {pack.documented.flagshipRapTopics.join(" / ")}</p>
      </section>
      <section className="card">
        <p className="eyebrow">Not in the PDF</p>
        <p>{pack.psychologicalWound.interpretation}</p>
      </section>
      <p className="lede">{concept?.text}</p>
      <div className="stack">
        <button type="button" className="btn btn-primary" onClick={() => onUse(null)}>
          Use this idea
        </button>
        <details>
          <summary>All 20 rap concepts</summary>
          <div className="stack">
            {pack.concepts.map((item, index) => (
              <button key={item.text} type="button" className="btn btn-secondary" aria-pressed={chosen === index} onClick={() => setChosen(index)}>
                {index + 1}. {item.text}
              </button>
            ))}
          </div>
        </details>
        <details>
          <summary>10 hooks you can edit</summary>
          <div className="stack">
            {hooks.map((hook, index) => (
              <textarea
                key={`hook-${index}`}
                aria-label={`Hook ${index + 1}`}
                value={hook}
                onChange={(event) => setHooks(hooks.map((line, lineIndex) => (lineIndex === index ? event.target.value : line)))}
              />
            ))}
          </div>
        </details>
        <details>
          <summary>5 album plans</summary>
          <div className="stack">
            {pack.albums.map((album, index) => (
              <button key={`${album.title}-${index}`} type="button" className="btn btn-secondary" onClick={() => onUse(index)}>
                Start as {FORMATS[album.format as FormatId].label} · {album.trackLines.length}
              </button>
            ))}
          </div>
        </details>
        <details>
          <summary>Score details</summary>
          {concept ? (
            <p>
              {concept.score.label}. Originality {concept.score.originality}. Emotion {concept.score.emotion}. Commercial appeal {concept.score.commercialAppeal}. Storytelling {concept.score.storytelling}. {concept.score.note}
            </p>
          ) : null}
        </details>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Back
        </button>
      </div>
    </>
  );
}
