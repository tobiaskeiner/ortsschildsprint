---
version: 1
slug: "src-steps-home-tsx"
primary_target: "src/steps/Home.tsx"
related_targets:
  [
    "src/components/useRouteFileDrop.ts",
    "src/components/HomeRouteMap.tsx",
    "src/translations.ts",
  ]
---

# Home

Mode: Persuade (tool landing page: the visitor uploads a route, or takes the secondary Strava path)
Route: `/`

A first-time rider must see in one glance that Ortsschildsprint finds the city-limit signs on a GPX/TCX/FIT route and exports them for navigation, with the file staying local. Route upload is the primary path; Strava is reduced to the orange Connect Strava button on the map (user decision, 2026-11-26). The look follows the Strava dashboard (user decision): grayscale stack, town-sign yellow markers, rounded instrument panels.

## Direction contract

THESIS: The home screen is a map stage, the same object the dashboard's collection map is: one rounded map canvas with a route and town-sign plates along it, carrying the route panel and the Connect Strava button. It refuses the headline-left/upload-card-right split and the empty dashed upload box; the whole map is the drop target.

OWN-WORLD: Dashboard world: close grayscale stack, light map ground drawn as authored SVG (roads, river, town blocks), route in road ink, small yellow Ortsschild plates with dark rims as the only yellow; route panel in surface-container-lowest (surface-container-high in dark) with an outline-variant edge; Space Grotesk headings, Inter body; flat Strava-orange connect button (strava-connect-action token, neutral shadow, no orange glow).

STORY: The rider sees signs sitting on a route, reads the route heading and its local-file fact, and acts: Select route (or drop on the map), or Connect Strava as the secondary path.

FIRST VIEWPORT: Below the fixed header a rounded map stage fills the viewport. Top-left: white route panel with display h1, one outcome line, dark Select route pill, GPX/TCX/FIT chips, drop hint on fine pointers, local-file fact. Bottom-right: the orange Connect Strava button alone on the map. The route runs bottom-left to top-right. Phones/tablets: route panel, a map window filling the remaining height, then the button; both actions inside a 390x844 first viewport.

FORM: Map-led stage, position 2 in the grounded structure order (dealt hand 6, 1, 2; user chose the map-led stage on the decision page). seed:b08a5807a9c9d366. Signature interaction: the route draws in and the sign plates drop onto it once (off under prefers-reduced-motion); dragging a file over the stage turns the whole map into the drop target with the prompt placed on open map. User pins: Strava button stays orange; verify via screenshots; every text string must have a purpose.

FINISH: Finish review (code-led, no comp) returned `fix`; fixes applied, then the Strava panel was reduced to the button on user request. Remaining detector findings are pinned: white on Strava orange (user pin + DESIGN.md token) and the route panel floating on the map stage (mirrors the dashboard map toolbar). No durable system change; DESIGN.md stays authoritative.
