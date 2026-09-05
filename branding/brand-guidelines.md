# JK Build Solutions — Brand Guidelines

Version 1.0 — September 2026. Derived from the live site's own copy and logo
(see `../content-inventory/`) and the real project photos (`../photos/`), not
invented from scratch. This is the reference for the site rebuild — colors,
type, and voice should trace back to this file.

A fully designed version of this document, with the logo, color swatches, and
a photography mood board, is published as an Artifact:
https://claude.ai/code/artifact/4b46c5cf-1e5e-4135-a350-0c12176595af

## Positioning

JK Build Solutions is a QBCC-licensed builder in Queensland's Scenic Rim,
Logan and South Brisbane corridor, run on decades of hands-on tradesmanship
rather than a sales floor. The pitch is the process: design, council
approval, engineering and construction handled end to end by the person
doing the work — done right the first time, with plain, honest advice along
the way.

- **What**: Custom builds & sheds — concept through council approval,
  engineering and completion
- **Where**: Scenic Rim, Logan & South Brisbane, QLD
- **Who**: Owner-operator James, QBCC 15475385 — one builder, one point of
  contact

## Voice & values

1. **Right the first time** — no callbacks to fix corners cut; every project
   meticulously managed start to finish.
2. **Honest, not salesy** — clear, practical advice; clients understand what
   they're getting and why.
3. **Function with form** — practical solutions that still look considered.
4. **One builder, full lifecycle** — design, council approval, engineering,
   construction as one relationship, not a handoff chain.

| Situation | Say it like this | Not like this |
|---|---|---|
| Describing the offer | Name the actual process: design → approval → engineering → build | "Full-service solutions" with no specifics |
| Making a claim | Back it with the trade detail (QBCC number, decades on tools, real project photos) | Superlatives with nothing behind them |
| Tone | Calm, direct, tradesperson-to-client | Exclamation marks, forced enthusiasm |
| Showing work | The finished shed or frame, in its actual paddock | Stock photography or renders |

**Use**: craftsmanship, clear & honest advice, council approval, engineering,
attention to detail, your investment.
**Skip**: industry-leading, turnkey solutions, world-class, synergy.

## Logo

Primary lockup: `../content-inventory/images/logo-full.png`. Black wordmark
("J K Build Solutions") with a single-line roofline mark above it.

- **Clearspace**: the width of the roofline mark, on every side, minimum.
- **Minimum size**: 120px / 30mm wide for the full lockup; drop to the
  roofline mark alone below that (favicon, social avatar).
- **Colors**: runs in Ink (`#1C1B19`) or reversed in Paper (`#F0F0EB`) only.
  No other recolor exists today — a true reversed (paper-on-monument) file
  should be produced before the mark is used on a dark background; do not
  fake it with a CSS filter in production.
- **Don't**: stretch or skew off native proportions; add a drop shadow,
  outline, or container shape; place directly on a busy photo without a
  solid card or scrim behind it.

## Color

One accent carries the brand; everything else is structure or a
photography tie-in — not a rack of equal-weight brand colors.

| Name | Hex | Role |
|---|---|---|
| Ink | `#1C1B19` | Logo, headings, body text |
| Paper | `#F0F0EB` | Page background, reversed logo |
| Monument | `#2B2C29` | Dark cladding tone — footers, dark sections |
| Steel | `#9B9D97` | Galvanised frame grey — rules, dividers, disabled states |
| Gum Leaf (accent) | `#4F5C3A` | The one accent — links, CTAs, active states |
| Sky Haze *(reference only)* | `#7C9FB8` | QLD sky in project photos |
| Clay *(reference only)* | `#B98A54` | Site dirt, brick edging, timber frame |

Dark-mode tokens (for the site rebuild): swap Ink/Paper roles — background
`#181715`, text `#F0F0EB`, accent lightened to `#9FB37E` for contrast.

## Typography

- **Display / headings**: Fraunces (500–600 weight), 40–68px for display,
  26–34px for section headings. Echoes the logo's serif.
- **Eyebrow / label**: Jost, uppercase, 11–13px, 0.14–0.18em tracking —
  echoes the "SOLUTIONS" treatment under the logo mark.
- **Body**: Inter, 400 weight, 16–17px / 1.65 line-height, ≤62 characters
  per line.
- **Caption / meta**: Inter, 500 weight, 12–13px, Ink Soft color.

Google Fonts: `Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700`,
`Jost:wght@400;500;600`, `Inter:wght@400;500;600`.

## Photography

- Real completed and in-progress projects only — never stock photography or
  renders.
- Natural daylight, un-staged — overcast, rain and sun all read as "this
  actually happened" (see `../photos/shed-exterior-black-windows.jpg`).
- Let Monument cladding hold its value in the frame — don't crush blacks or
  blow out the sky.
- Mix wide paddock/site establishing shots with close material and detail
  shots in the same gallery.

## Applications

Standard sign-off block — appears the same way everywhere the brand does
(site footer, quotes, invoices). Service area and licence number always
appear together, never the licence number alone:

```
Building and construction in the Scenic Rim, Logan and South Brisbane
QBCC: 15475385
James@JKBuildSolutions.com.au · All rights reserved © JKBuildSolutions
```

Update the copyright year on each annual review — the live site currently
carries a stale 2024 date that should move to the current year at rebuild.
