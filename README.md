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

## Open items
- Confirm who controls DNS for jkbuildsolutions.com.au for the eventual cutover

## Decisions
- No contact form — the old one went unused. Contact page will just surface
  phone, email, and Facebook prominently instead.
