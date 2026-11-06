"use client";

import Link from "next/link";
import { Footer, Shell } from "@/components/shell";

export default function HomePage() {
  return (
    <Shell>
      <p className="eyebrow">Mozart studio</p>
      <h1>Write a song.</h1>
      <p className="lede">One sentence becomes lyrics and a Mozart sound prompt. This studio does not make audio.</p>
      <div className="stack">
        <Link className="btn btn-primary" href="/start" data-testid="start-song">
          Start a song
        </Link>
        <Link className="btn btn-secondary" href="/library">
          Open a saved song
        </Link>
      </div>
      <Footer />
    </Shell>
  );
}
