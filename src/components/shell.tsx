"use client";

import Link from "next/link";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip" href="#main">
        Skip to the song
      </a>
      <main id="main" className="shell">
        {children}
      </main>
    </>
  );
}

export function Footer() {
  return (
    <nav className="footer-links" aria-label="More">
      <Link href="/ideas">Find a song idea</Link>
      <Link href="/help">How saving and demo mode work</Link>
      <Link href="/personas">Voice and producer library</Link>
    </nav>
  );
}
