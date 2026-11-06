# Mozart studio

A fresh music-writing studio for original lyrics and a one-paragraph Mozart sound prompt. It does not generate audio and it does not submit jobs to Mozart.

This repository is a new implementation. It is not a copy of any earlier private app.

## What you can do

1. Start from one sentence.
2. Pick a single (1), EP (6), LP (10), or mixtape (15).
3. Choose a writing voice and a separate producer.
4. Read a six-part brief: purpose, feel, sound, voice, movement, review.
5. Edit lyrics and the prompt, copy them, or export Markdown.
6. Revise one variable at a time, with locks and history.
7. Attach a PDF as research. Bad, empty, and password-protected files are reported. There is no OCR.

Instrumental tracks keep the lyrics field empty and omit the vocal ending.

## Demo, not live AI

With no server key, every song is labeled **DEMO sample output**. That text is written by the studio rules in this repo. It is not a Gemini response, and live writing has not been verified.

`/api/health` reports the same thing.

Live Gemini calls stay off unless all of these are true on the server:

- `LIVE_GENERATION=enabled`
- `GEMINI_API_KEY` is set
- `GENERATION_ACCESS_TOKEN` is set
- the request sends `Authorization: Bearer <that token>` and `requestLive: true`

The website never sends that token. A public visitor cannot spend a key. An in-memory rate limit is not used, because it would not be real spending protection.

Copy `.env.example` to `.env.local`. Do not commit a real key.

## Saving

Projects live in this browser's `localStorage` under `mozart-studio-web.v1`. There are no accounts. Clearing the browser clears the songs. Export a Markdown file if you want a copy.

## Canon

Persona traits come from the November 6, 2026 Rap Personas complete book, the producer owner file, Ghost, The Protege, and Soul Glider's vocal rules. Reference verses, raw private PDFs, and private biography are not in this repo.

Part Two's 92 BPM beat, male tag, 16 lines, and short prompt ceiling are optional batch-test settings. They are off unless a track turns them on.

The book cover says twelve writing identities plus Velvet and Zeke. The cards in Part One are eleven rap identities, Velvet, and Zeke. The twelfth rap name is marked incomplete instead of invented.

## Hosting

One Next.js app. Vercel is first. Netlify Free uses the same repository and the same build. There is no second codebase.

Vercel Hobby team: `adrians-projects-8629d22c` (`team_uB52RGMtmCGvsQ3W7ybqpwCo`). Framework preset Next.js. Root directory `/`. Build command `npm run build`. Node 22. No paid add-on. Leave `LIVE_GENERATION` unset or `disabled`. Do not put `GEMINI_API_KEY` on a public project.

Netlify team: [ecohoopscoaching](https://app.netlify.com/teams/ecohoopscoaching/projects). Link this GitHub repository. Build command `npm run build`. Node 22, set in `netlify.toml`. Leave the publish directory to Netlify's automatic OpenNext adapter. Do not install or pin `@netlify/plugin-nextjs`. Do not buy a plan or AI credits. The public site stays in demo mode.

This cloud session could read the Vercel team. It could not find a Netlify login, so no Netlify site was created from here.

## Scripts

```bash
npm install
npm test
npm run build
npm run start
```

## Limits

- No audio.
- No Mozart account connection.
- Demo lyrics are rule-based samples, not a claimed live model.
- Scanned PDFs need OCR this app does not run.
- Songs do not sync between devices.
