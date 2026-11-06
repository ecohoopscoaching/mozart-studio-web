"use client";

import Link from "next/link";
import { Shell } from "@/components/shell";

export default function HelpPage() {
  return (
    <Shell>
      <p className="eyebrow">Before you start</p>
      <h1>How this works.</h1>
      <div className="stack">
        <p>Songs are saved in this browser only. There are no accounts. Another phone or a cleared browser will not have them. Use Export if you want a file.</p>
        <p>The writing you see is labeled DEMO sample output. It is original draft text from the studio rules. It is not a live AI call, and it was not verified against Gemini.</p>
        <p>Nothing here makes audio or sends a job to Mozart. Copy the prompt paragraph into Mozart yourself.</p>
        <p>A server can be given a Gemini key later. Live calls stay off on the public site until that server also has an access token. Visitors cannot spend a key from this page.</p>
        <Link className="btn btn-primary" href="/">
          Back home
        </Link>
      </div>
    </Shell>
  );
}
