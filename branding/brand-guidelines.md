# JK Build Solutions — Brand Guidelines

Version 1.1 — September 2026. Matched to the live site build (`index.html`,
`projects.html`, `submit-project.html` on `main`) — colors, fonts, and logo
assets below are the real values shipped in the code, not proposals.

A fully designed version of this document, with the logo, color swatches, and
a photography mood board, is published as an Artifact:
https://claude.ai/code/artifact/4b46c5cf-1e5e-4135-a350-0c12176595af

## Positioning

"**Honest building. Exceptional finish.**" — JK Build Solutions is a
QBCC-licensed builder across the Scenic Rim and Gold Coast, run on decades of
hands-on tradesmanship rather than a sales floor. Design, engineering,
council approval and construction are handled end to end by the person doing
the work — done right the first time, with plain, honest advice along the
way.

- **What**: Sheds & garages, Queenslander homes, granny flats, rock walls,
  decks
- **Where**: Scenic Rim & Gold Coast, QLD
- **Who**: Owner-operator James, QBCC 15475385 — one builder, one point of
  contact

## Voice & values

1. **Right the first time** — no callbacks to fix corners cut; every project
   meticulously managed start to finish.
2. **Honest, not salesy** — clear, practical advice; clients understand what
   they're getting and why.
3. **Function with form** — practical solutions that still look considered.
4. **One builder, full lifecycle** — design, engineering, council approval,
   construction as one relationship, not a handoff chain.

| Situation | Say it like this | Not like this |
|---|---|---|
| Describing the offer | Name the actual process: design → engineering → council approval → build | "Full-service solutions" with no specifics |
| Making a claim | Back it with the trade detail (QBCC number, decades on tools, real project photos) | Superlatives with nothing behind them |
| Tone | Calm, direct, tradesperson-to-client | Exclamation marks, forced enthusiasm |
| Showing work | The finished shed or frame, in its actual paddock | Stock photography or renders |
| Contact | "No forms, no waiting — phone or message us directly" | A contact form nobody fills in |

**Use**: craftsmanship, clear & honest advice, council approval, engineering,
attention to detail, done right the first time.
**Skip**: industry-leading, turnkey solutions, world-class, synergy.

## Logo

Real, shipped assets in `Logo/`:

| File | Role |
|---|---|
| `Logo/logo-black-no-bg.png` | Ink mark on transparent — light backgrounds |
| `Logo/logo-white-no-bg.png` | Reversed mark on transparent — dark backgrounds |
| `Logo/logo-color-with-bg.png` | Reversed mark baked onto an Ink card — one flat file for email signatures, partner decks |
| `Logo/favicon/favicon-browser.png`, `favicon-iphone.png`, `favicon-android.png` | Favicons, already exported |

- **Clearspace**: the width of the roofline mark, on every side, minimum.
- **Minimum size**: 120px / 30mm wide for the full lockup; drop to the
  roofline mark alone below that.
- **Don't**: stretch or skew off native proportions; add a drop shadow,
  outline, or container shape; fake a reversed version with a CSS filter
  when the real exported file exists.

## Color

The live site writes every color as `oklch()` directly in its CSS — these
are the actual values, not hex approximations. One accent (Rust) carries the
brand; everything else is structure.

| Name | oklch() | Hex | Role |
|---|---|---|---|
| Ink | `oklch(15% 0.008 75)` | `#0D0B08` | Nav, footer, dark surfaces, body text |
| Paper | `oklch(97% 0.006 80)` | `#F7F5F1` | Page background, reversed logo & text on Ink |
| Paper Alt | `oklch(94% 0.005 75)` | `#EDEBE7` | Section bands — About, alternating panels |
| Line | `oklch(88% 0.005 75)` | `#D9D7D4` | Card borders, hairlines |
| Ink Soft | `oklch(45% 0.005 75)` | `#575552` | Muted body copy, captions |
| Rust (accent) | `oklch(50% 0.14 40)` | `#A24019` | Links, icon strokes, step numbers |
| Rust Strong | `oklch(62% 0.15 40)` | `#CF6139` | Primary CTA fill, contact band background |
| Rust Hover *(state, not a swatch)* | `oklch(68% 0.15 40)` | `#E4744B` | Hover on Rust Strong |

Nothing else on the site carries color — sheds, sky and timber stay in the
photography, not the palette.

## Typography

- **Display / headings**: Newsreader, 500 weight, **always italic** —
  40–62px for display, 26–34px for section headings. Step numbers and stat
  figures also use italic Newsreader, set in Rust.
- **Nav / label / eyebrow**: Work Sans, 600 weight, uppercase, 0.04–0.12em
  tracking. No separate label typeface — tracking does the work.
- **Body**: Work Sans, 400 weight, 15–18px / 1.6–1.75 line-height, ≤62
  characters per line.
- **Caption / meta**: Work Sans, 500 weight, 12–13px, Ink Soft color.

Google Fonts: `Newsreader:ital,wght@0,400;0,500;0,600;1,400;1,500`,
`Work+Sans:wght@400;500;600;700`.

**Shape**: 2px radius on buttons/pills/tags, 3px on cards and panels, 10px
only on photographic gallery tiles — sharp and near-square, not softly
rounded.

## Photography

- Real completed and in-progress projects only — never stock photography or
  renders.
- Natural daylight, un-staged — overcast, rain and sun all read as "this
  actually happened."
- Let Ink cladding hold its value in the frame — don't crush blacks or blow
  out the sky.
- Gallery hover reveals a one-line caption over a dark gradient — keep
  captions short.

## Applications

Two components carry the brand everywhere it appears on the live site:

**Footer bar** (Ink background, reversed logo, muted copyright line):
```
[reversed logo]     © 2026 JK Build Solutions · QBCC 15475385 · Scenic Rim & Gold Coast
```

**Contact band** (Rust Strong background, dark text, Ink pill buttons):
```
Let's talk about your build.          [04 516 74 855] [Email] [Facebook]
```

No contact form on the site — phone, email and Facebook are the only paths
in, always shown together. Update the footer's copyright year on each
annual review.
