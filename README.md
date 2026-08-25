# Ackwonu Edwin Kwamena — Creative Developer Portfolio

A premium personal portfolio built around one idea: **Build. Capture. Design. Tell.**

Four connected disciplines — web development, photography, graphic design and videography — presented through a fast, accessible, SEO-first static site.

> All project content ships as clearly-marked **sample work**. Replace it with your own before going live.

## Features

- Editorial dark design system (Manrope + electric blue `#2563EB` accent)
- 12 sample projects across 4 categories, powered by Astro Content Collections
- Client-side search, category filters and tag filters on `/work`
- Masonry photography grids with a keyboard-accessible lightbox
- Lazy-loaded YouTube/Vimeo embeds + native video support for films
- Build-time GitHub repository fetching with graceful failure
- Contact form backed by Resend (serverless API route) with spam protection
- Full SEO: metadata, Open Graph, Twitter cards, JSON-LD, sitemap, robots.txt
- Vercel Analytics with a dev-safe tracking abstraction
- Optimized responsive images via the Astro/Sharp pipeline

## Tech Stack

| Layer      | Choice                                        |
| ---------- | --------------------------------------------- |
| Framework  | Astro 5 (static output + Vercel adapter)      |
| Language   | TypeScript (strict)                           |
| Styling    | Tailwind CSS v4                               |
| Islands    | React 18 (search/filter, lightbox, nav, form) |
| Content    | Content Collections + MDX                     |
| Animation  | Motion (lightbox only) + CSS reveals          |
| Icons      | Lucide                                        |
| Email      | Resend                                        |
| Analytics  | Vercel Web Analytics (opt-in, see below)      |
| Images     | Astro Image API + Sharp                       |

## Getting Started

```bash
npm install
npm run dev       # http://localhost:4321
```

Other scripts:

```bash
npm run check     # type-check the whole project (astro check)
npm run build     # production build → dist/
npm run preview   # serve the production build locally
npm start         # build output + working contact form via Node server
npm run images    # regenerate placeholder images + sample CV PDF
```

## Launching Without Vercel

The site is **pure static Astro** — no adapter required. Three ways to run it:

**1. Local development**

```bash
npm run dev
```

**2. Quick static preview**

```bash
npm run build
npm run preview
```

**3. Self-hosted production server (recommended — keeps the contact form working)**

```bash
npm run build
npm start        # serves dist on http://localhost:3000
```

`scripts/server.mjs` is a zero-dependency Node server that serves the static
build **and** implements `POST /api/contact` (validation, rate limiting,
honeypot, Resend email). Configure with:

```env
PORT=3000
RESEND_API_KEY=re_xxx
CONTACT_EMAIL=you@example.com
```

Run it behind nginx/Caddy or on any VPS/Docker host. If the form backend is
missing (e.g. plain static hosting), the form degrades gracefully and asks
visitors to email you directly.

**Static-only hosts** (GitHub Pages, S3, any CDN): upload `dist/`.
Everything works except the form backend.

## Deploying With an Adapter (optional)

The codebase deliberately ships without one. To deploy to Vercel/Netlify with
serverless functions instead of `npm start`, re-add an adapter:

```bash
npm install @astrojs/vercel    # or @astrojs/netlify
```

```ts
// astro.config.ts
import vercel from "@astrojs/vercel";
export default defineConfig({
  // …existing config…
  adapter: vercel(),
});
```

then restore `src/pages/api/contact.ts` from version control history (or move
the logic out of `scripts/server.mjs`) and set `prerender = false` on it.

## Project Structure

```text
src/
├── components/          Astro components (+ islands/ for React)
├── content.config.ts    Work collection schema (Zod)
├── content/work/        One MDX file per project, grouped by category
├── data/                site.ts (your identity), profile.ts (about/cv copy)
├── layouts/             BaseLayout.astro, ProjectLayout.astro
├── lib/                 github.ts, analytics.ts, projects.ts, utils.ts
├── pages/               Routes: /, /work, /work/[category], /work/[category]/[slug],
│                        /about, /contact, /cv, /api/contact, projects.json, robots.txt
└── styles/global.css    Tailwind v4 theme + editorial design system
```

## Adding a Project

1. Create `src/content/work/<category>/<my-project>.mdx`
2. Add frontmatter:

```yaml
---
title: "My Project"
category: "webapps"
year: 2026
coverImage: "../../assets/work/webapps/my-project/cover.jpg"
gallery:
  - "../../assets/work/webapps/my-project/screen-01.jpg"
tags: ["TypeScript", "Astro"]
description: "One sentence that sells the project."
featured: true
technologies: ["Astro", "TypeScript"]
liveUrl: "https://example.com"        # optional
repoUrl: "https://github.com/…"       # optional
videoUrl: "https://youtube.com/…"     # videography only
---
```

3. Drop images into `src/assets/work/<category>/<my-project>/` (they get optimized automatically).
4. Write the case study in Markdown below the frontmatter.

No page edits required — routes, cards, search, sitemap and JSON-LD all update automatically.

Optional fields: `client`, `location`, `role`, `tools`, `technologies`, `process`, `deliverables`, `altText`.

## Personal Configuration

Almost everything personal lives in two files:

- **`src/data/site.ts`** — name, role, email, location, domain, social links, GitHub username, CV path
- **`src/data/profile.ts`** — about paragraphs, skill groups, tools list

Also replace:

- `public/cv/CV_Ackwonu_Edwin_Kwamena.pdf` — your real CV
- `src/assets/portrait.jpg` — your photo
- `public/favicon.svg` — your monogram
- `public/images/og-default.jpg` — your social share image

## Environment Variables

Copy `.env.example` to `.env`:

```env
SITE_URL=https://yourdomain.com
GITHUB_USERNAME=your-github-handle
GITHUB_TOKEN=ghp_xxx            # optional, avoids API rate limits
RESEND_API_KEY=re_xxx           # from resend.com
CONTACT_EMAIL=you@example.com
```

The site builds and runs fine with none of these set — features degrade gracefully:
no GitHub section, contact form returns a friendly "not configured" message.

## Contact Form

`POST /api/contact` (serverless on Vercel) validates input server-side,
rate-limits by IP (5 messages / 10 min), includes a honeypot field, and sends
email via Resend. The API key never reaches the browser.

## GitHub Integration

`src/lib/github.ts` fetches your public repositories **at build time** (never
client-side), sorts by stars, filters forks/archived repos and renders nothing
on failure or when no username is configured.

## Analytics

Vercel Web Analytics is enabled in production by default. To disable it
(non-Vercel hosting, self-hosted), add `PUBLIC_ANALYTICS=false` to your `.env`.
Events tracked via `src/lib/analytics.ts`: `cv_download`, `project_live_click`,
`project_github_click`, `contact_submit`. Nothing is sent during development.

## Deployment (Static)

1. Push this repository to GitHub.
2. Set the build command to `npm run build` and output directory to `dist`
   on any static host — Netlify, Cloudflare Pages, GitHub Pages, etc.
3. For the contact form on static hosts, either run the Node server (`npm start`)
   somewhere and proxy `/api/contact` to it, or use a host function of your own.
4. Set `SITE_URL` at build time so canonicals/sitemap point at your domain.

## Production Checklist

- [ ] Update `siteConfig` and `profile.ts`
- [ ] Replace sample projects/images with real work (or delete them)
- [ ] Upload a real CV PDF
- [ ] Set `SITE_URL` to the live domain
- [ ] Configure `RESEND_API_KEY`, `CONTACT_EMAIL` and verify your sender domain in Resend
- [ ] Set `GITHUB_USERNAME` (and optionally a token)
- [ ] Replace portrait, favicon and OG image
- [ ] Run `npm run check && npm run build` cleanly before shipping

## Known Notes

- Sample videography projects use an open CC0 clip as a stand-in video.
- The placeholder CV PDF is generated by `scripts/generate-placeholder-assets.mjs`.
