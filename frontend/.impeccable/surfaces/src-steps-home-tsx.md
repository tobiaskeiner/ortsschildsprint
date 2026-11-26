---
version: 1
slug: "src-steps-home-tsx"
primary_target: "src/steps/Home.tsx"
related_targets:
  [
    "src/components/FileUpload.tsx",
    "src/components/PrivacyStatement.tsx",
    "src/translations.ts",
  ]
---

# Home

Mode: Persuade (tool landing page: the visitor decides to upload a route or connect Strava)
Route: `/`

The first-time rider's job is to start the route workflow in one glance: drop or select a GPX/TCX/FIT route, trust that the file stays local, and see the optional Strava collection as a clearly secondary path.

## Direction contract

THESIS: The home screen is a route-ready field instrument, not a hero-plus-card split: one dominant upload surface whose drop zone visualizes the product's mechanism (a route line with town-sign markers), with copy reduced to strings that each name an action, an outcome, or a trust fact. It refuses the empty-bottom two-column hero.

OWN-WORLD: Inherit Ortsschildsprint's close grayscale stack, Space Grotesk display/headline and Inter body, soft instrument geometry. Town-sign yellow appears only where it carries sign meaning: the sprinting-Ortsschild mascot (`/stravaClub.png`) sits in a fixed white badge in the drop zone so its dark frame reads in both themes (hand-drawn SVG sign marks were removed — they rendered broken). Strava orange stays exclusively on the home connect action, token-conform (`strava-connect-action`: control radius, label typography); per user request the warm orange glow shadow is removed — flat orange only.

STORY: A rider lands, reads "city-limit signs along your route", immediately sees what to do (drop or select a route file), what they get (signs found and exported for navigation), why to trust it (file stays in the browser), and that Strava is optional.

FIRST VIEWPORT (1440px, light): fixed blurred header; vertically centered content — left 2/5 of a five-column grid holds the display headline (leading 1.05 so Space Grotesk descenders never clip into the next line at text-7xl) and a one-sentence outcome line, with the flat orange Strava connect button + one-line caption pinned to the column bottom (`self-end`) so it aligns with the upload card's bottom edge; right 3/5 holds the upload shell stretched to the full row height (`lg:h-full` on shell and drop zone) with the white-badged sprinting-Ortsschild mascot left, "Upload a route" heading, GPX/TCX/FIT chips, and the pill select button with an "or drop a file here" hint on fine pointers; a slim full-width privacy strip (shield icon + one sentence) closes the viewport. Mobile stacks: headline, outcome line, upload, Strava, privacy.

FORM: Instrument-band hero inside the established visual world; code-led redesign (no concept-seed roll available in this runtime — seed: none (unavailable)); position 1 (centered task hero) in the grounded structure order. The user pinned: Strava connect button stays orange (glow removed on request); verify every change by screenshots, including zoomed crops; remove purposeless text strings; use the real `stravaClub.png` mascot instead of hand-drawn sign SVGs.

FINISH: ship — verified by batched screenshots (desktop 1440 + mobile 390 + tablet 834, de/en, light/dark) in `.impeccable/review/home-*.png`; detector run against the dev server (only the two DESIGN.md-pinned patterns remain: white-on-Strava-orange connect token, dashed drop zone inside the upload shell); ESLint, e2e (route workflow), build, and Prettier pass. No durable design-system change, so `DESIGN.md` remains authoritative.
