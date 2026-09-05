# JK Build Solutions — Website

Rebuild of https://jkbuildsolutions.com.au/ for static hosting on GitHub (Pages).

The original site is WordPress + Elementor. This repo is a from-scratch static
rebuild (new design), not a lift-and-shift — GitHub Pages does not run
PHP/MySQL, so there's no way to port WordPress directly.

## content-inventory/

Snapshot of the live site's copy and images, captured 2026-09-05, kept for
reference while rebuilding:
- `home.md`, `contact.md` — page copy
- `images/` — logo and hero photo pulled from the live site

## photos/

Real project photos (shed builds) to use as the site's actual gallery/hero
content — a big upgrade over the one stock-ish hero image on the live site.
This folder is a live working set; more photos will be added over time.

## Logo/

New JK Build Solutions logo set: color/black/white variants (with and
without background) plus favicons for browser/iPhone/Android.

## companies/

Partner/supplier logos (Stratco, ACS Engineers, and others) — likely for a
"who we work with" section on the new site.

## Publishing a new project (photo + PDF sheet)

Either way below ends up in the same place: a GitHub Action
(`.github/workflows/new-project.yml`) resizes the photos, generates a PDF
project sheet, and commits everything plus an updated `projects.html`
straight to `main`. See `scripts/` for the automation itself.

**Webpage form (day-to-day way):** open `submit-project.html` on the live
site, enter the access passphrase, fill in the fields, and pick photo files.
The page resizes them in your browser, then a Cloudflare Worker
(`worker/new-project-worker.js`) stages them into the repo and opens the
underlying GitHub issue on your behalf — you never see GitHub's UI.

**GitHub issue (fallback way):** Issues → New issue → "New completed
project" template, fill in the fields, drag photos into the Project Photos
box. Only issues opened by the repo owner trigger the automation.

One-time setup required before either works:
- Repo Settings → Actions → General → Workflow permissions → "Read and write
  permissions" (needed so the workflow's token can push to `main` and
  comment/close the issue).
- For the webpage form specifically: a fine-grained GitHub PAT (scoped to
  just this repo, Contents + Issues read/write) and a deployed Cloudflare
  Worker using `worker/new-project-worker.js`, with `GITHUB_TOKEN` and
  `FORM_PASSPHRASE` set as Worker secrets, and the Worker's `*.workers.dev`
  URL pasted into `submit-project.html`'s `WORKER_URL` constant.

## Open items
- Domain DNS is at SiteGround (user-controlled) — repoint to GitHub Pages at cutover
- Design direction: rebuilding with the Claude Design skill rather than the
  old Idea_1 mockup (deemed too plain, removed 2026-09-05)

## Decisions
- No contact form — the old one went unused. Contact page will just surface
  phone, email, and Facebook prominently instead.
