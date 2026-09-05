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

## Open items
- Domain DNS is at SiteGround (user-controlled) — repoint to GitHub Pages at cutover
- Design direction: rebuilding with the Claude Design skill rather than the
  old Idea_1 mockup (deemed too plain, removed 2026-09-05)

## Decisions
- No contact form — the old one went unused. Contact page will just surface
  phone, email, and Facebook prominently instead.
