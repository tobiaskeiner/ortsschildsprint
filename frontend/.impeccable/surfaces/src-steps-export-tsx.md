---
version: 1
slug: "src-steps-export-tsx"
primary_target: "src/steps/Export.tsx"
related_targets: ["src/routes/RouteWorkflowPage.tsx","src/translations.ts","e2e/route-workflow.spec.ts"]
---

# Route export

Mode: Operate (the rider takes the enriched route file to their bike computer)
Route: `/route/export` (third and last step of the route workflow, after Preview and Edit)

Job: the rider confirms what goes into the file (which signs, how many waypoints), picks a format and downloads it. User decisions (2026-11-28): FIT is preselected and listed first ("Recommended"); a small confirmation map with Edit's numbered markers stays; a summary of included signs, whose waypoint count follows the format (FIT writes every chosen pass, GPX/TCX only the first); a "Back to review" link to Edit; a designed zero-signs state instead of failing on download. The pulsing "Status: Ready" card goes.

## Direction contract

THESIS: The screen is the file the rider is about to take: its name with a live extension, a map thumbnail, and the numbered waypoint manifest, with a format switch that changes the file in place. It refuses the big-map-plus-config-card arrangement and the stat-card row.

OWN-WORLD: Ortsschildsprint's grayscale tonal stack, Space Grotesk for headings, labels and tabular km figures, Inter body, soft instrument radii (file card and panel 1.75rem, pill controls, segmented pill switch). Numbered ink-circle markers and discs match Edit's rail. Town-sign yellow appears once with sign meaning: a small Ortsschild mark inside the dark Download pill.

STORY: The rider sees "Route: <name>" and one line saying what the file holds. The file card shows "<name>.fit" with the extension as an ink chip, the waypoint, sign and distance counts, a route thumbnail with numbered markers, and the sign manifest in route order (two passes listed for a sign with both chosen). The format panel offers FIT / GPX / TCX as a segmented switch, says what the chosen format keeps and whether the original file is enriched or converted, and ends in "Download .<ext>". "Back to review" returns to Edit. With zero signs the file card says so, the extension chip goes quiet, and the primary action becomes Upload a route (Edit keeps no deleted signs, so re-uploading is the only way to get them back); Back to review stays in the heading row.

FIRST VIEWPORT (1440x900, light): heading row with "Route: name" and the summary line left, the "Back to review" outline pill right. Below it, a 3/5 file card (map thumbnail column left, file name, counts and manifest right, the manifest scrolling inside the card) beside a 2/5 format panel (title, segmented switch with a persistent Recommended mark under FIT, what-it-keeps copy, source note, fact rows for signs passed twice and which passes the format keeps, Download pill at the foot). Mobile: heading, file card (thumbnail as a wide strip above the name), format panel, Download pill sticky above the bottom nav.

FORM: The file as the object, dealt position 6 of 7 on the grounded list; seed:f249e1b7727ee375. Code-led; signature interaction: the format switch rewrites the file in place (extension chip, waypoint count, per-sign passes and Download label update together). Motion: 150-200ms state transitions only, none with reduced motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

FINISH RECORD (2026-11-28): code-led, no image generation. The finish review returned fix (4 items). The first verdict pass scored 3 resolved and 1 partial (empty-state panel) and found one regression (a doubled "Recommended"). The second verdict pass scored both resolved, verdict ship. Fix 1 (Back to review as the empty-state action) was resolved by correcting the contract: Edit deletes signs from memory, so re-uploading is the only way back, and the reviewer accepted that. Captures are in `.impeccable/review/export-*.png`, made with `.impeccable/capture-export.mjs`; the before captures are in `.impeccable/before/export/`. This is an ordinary extension of the established world, so `DESIGN.md` is unchanged. Ceiling notes not taken: a thumbnail marker for a sign's second pass, and the page ground showing below the short panel in the desktop empty state.
