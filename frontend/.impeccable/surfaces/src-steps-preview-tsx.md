---
version: 1
slug: "src-steps-preview-tsx"
primary_target: "src/steps/Preview.tsx"
related_targets:
  [
    "src/routes/RouteWorkflowPage.tsx",
    "src/components/RouteProfile.tsx",
    "src/utils/routeProfile.ts",
    "src/hooks/useParseFile.ts",
    "src/translations.ts",
  ]
---

# Route preview

Mode: Operate (the rider confirms the uploaded route is the right one and moves on to sign detection)
Route: `/route` (preview step of the route enrichment workflow; Edit and Export follow later)

Job: after upload, the rider checks in seconds that this is the ride they planned (shape, distance, climbing) and either continues to sign detection or replaces the file. Route facts only: signs are fetched in the background but stay off this step (user decision). The "Route: <name>" heading stays. Town-sign yellow must appear at least once (user request).

## Direction contract

THESIS: The preview is a route check, not a "next action" card: map and elevation-over-distance profile are two linked views of one route, and scrubbing the profile places a point on the map. It refuses the generic map-plus-sidebar-card arrangement and slogan copy.

OWN-WORLD: Ortsschildsprint's grayscale stack, Space Grotesk headings/labels with tabular figures for data, Inter body, soft instrument radii (panel 1.5rem, pill controls). The route line and profile stroke are primary ink on a surface-container fill. Town-sign yellow appears once, carrying sign meaning: a small Ortsschild-shaped mark inside the dark "Find signs" action, previewing what the next step finds; nothing else is yellow (focus ring excepted, pre-existing).

STORY: The rider sees the route name, its shape fitted on the map with start/finish marked, its distance, elevation gain and highest point, scrubs the profile to see where the climb is, then presses "Find signs" or replaces the file.

FIRST VIEWPORT (1440x900, light): heading row: "Route: <name>" display heading and file name left, dark pill "Find signs" with yellow sign mark right. Below, a 2/3 map fitted to the route bounds with start/finish markers, beside a 1/3 route-file panel (format, track points, loop or point-to-point, "Replace file" secondary pill). Full-width profile panel below: distance, gain, highest point in its header, an SVG elevation area with km ticks; hovering/touching shows a crosshair readout (km, m) and a marker on the map. Without elevation data the panel shows a distance bar and a one-line note. Mobile stacks: heading, map, profile, Find signs, file panel.

FORM: Elevation profile structure, dealt position 4 of 7 in the grounded list; seed:1173f67483bcb141. Code-led; signature interaction: profile scrub linked to a map marker. Motion: 150-200ms state transitions only.

LATER REVISION (user feedback, 2026-11-26): elevation matters less than route identity, so the profile panel is compact. On desktop the stats sit left of a 64px chart in one row; on mobile the chart is 56px. On desktop "Find signs" moved under a content-height route-file panel in the right column, and the map stretches to that column's height (areas: title / map+file / map+action / profile).

FINISH: ship. Finish review (code-led, no image generation) returned fix with 7 items: mobile stat baseline, readout riding the crosshair, distinct start/finish marker, crosshair stopping at the axis, themed map attribution, rimmed sign mark for the light dark-mode pill, flat-state copy. All 7 scored resolved, verdict ship. Captures are in `.impeccable/review/preview-*.png` (desktop/tablet/mobile, en/de, light/dark, hover with touch, no-elevation, sign API pending). Ordinary extension of the established world, so `DESIGN.md` stays authoritative and unchanged. Open and project-wide: the light positron basemap in dark mode.
