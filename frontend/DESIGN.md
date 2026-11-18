---
name: Ortsschildsprint
description: Calm route enrichment and ride collection for cyclists.
colors:
  primary: "#1b1b1a"
  primary-container: "#e7e7e4"
  on-primary-container: "#1c1c1b"
  surface: "#f8f8f6"
  surface-container-low: "#f2f2ef"
  surface-container: "#ecece9"
  surface-container-high: "#e4e4e1"
  surface-container-highest: "#dbdbd8"
  surface-container-lowest: "#ffffff"
  on-surface: "#171716"
  on-surface-variant: "#5e5e59"
  secondary: "#686863"
  outline-variant: "#d0d0cb"
  outline: "#7a7a75"
  town-sign: "#f0cf20"
  strava-orange: "#fc4c02"
typography:
  display:
    fontFamily: '"Space Grotesk Variable", sans-serif'
    fontSize: "3rem"
    fontWeight: 900
    lineHeight: "0.85"
    letterSpacing: "-0.05em"
  headline:
    fontFamily: '"Space Grotesk Variable", sans-serif'
    fontSize: "1.25rem"
    fontWeight: 900
    lineHeight: "1.1"
    letterSpacing: "-0.02em"
  body:
    fontFamily: '"Inter Variable", sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.5"
  label:
    fontFamily: '"Space Grotesk Variable", sans-serif'
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: "1.2"
    letterSpacing: "0.1em"
rounded:
  pill: "9999px"
  control: "1rem"
  compact-card: "1.25rem"
  panel: "1.5rem"
  feature-panel: "1.75rem"
  shell: "2rem"
spacing:
  page-mobile: "0.75rem"
  control: "1rem"
  card: "1.25rem"
  panel: "1.5rem"
  section: "2rem"
  feature: "3rem"
components:
  upload-action:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary-container}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.75rem 2rem"
  secondary-action:
    backgroundColor: "{colors.surface-container-highest}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.875rem 2rem"
  surface-card:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.panel}"
    padding: "{spacing.card}"
  menu-trigger:
    backgroundColor: "{colors.surface-container-low}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.pill}"
    height: "2.75rem"
    width: "2.75rem"
  workflow-step:
    backgroundColor: "{colors.surface-container-high}"
    textColor: "{colors.primary}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
  strava-connect-action:
    backgroundColor: "{colors.strava-orange}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0.875rem 1.25rem"
  strava-choice:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.compact-card}"
    padding: "{spacing.card}"
---

# Design System: Ortsschildsprint

## Overview

**Creative North Star: "Cyclist’s Field Instrument"**

Ortsschildsprint is a calm, precise companion for working with cycling-route information. It should feel like a capable tool carried on a ride: direct enough for a route workflow, quiet enough for maps and dense ride data, and friendly enough to make review decisions feel safe rather than technical.

The interface uses deliberately strong type and softened panels to make a practical workflow feel approachable. The neutral palette keeps attention on route content; city-sign yellow provides the memorable identity cue and appears only where it carries sign, progress, or selection meaning. The optional Strava flow keeps its own orange connection action so its external-service relationship remains legible.

**Key Characteristics:**

- Calm operational surfaces built from a close grayscale tonal stack.
- Bold, compact Space Grotesk headings paired with highly readable Inter body copy.
- Soft instrument-panel geometry: rounded, layered, and tactile without becoming decorative.
- A rare town-sign yellow identity signal; Strava orange is isolated to Strava connection actions.
- Responsive task layouts that make route review, maps, and export decisions feel organized on both mobile and desktop.

## Colors

Near-neutral layers do the structural work. The color system reads as road paper and ink, with a single yellow marker for Ortsschildsprint identity rather than a broad multicolor palette.

### Primary

- **Road Ink:** primary and on-surface establish the strongest text, icons, and high-contrast marks.
- **Soft Ink:** primary-container gives primary actions and selected workflow states a quieter tonal fill than hard black.
- **Muted Route Text:** on-surface-variant and secondary carry supporting copy, metadata, and inactive states.

### Neutral

- **Road Paper:** surface is the app canvas; the surface-container stack creates increasingly raised or pressed layers without changing hue families.
- **Clear Paper:** surface-container-lowest is reserved for floating cards, menus, upload shells, and readable task panels.
- **Soft Boundary:** outline-variant is the default edge; outline is used when an edge needs more definition.

### Tertiary

- **Town-Sign Yellow:** town-sign is the brand and route-sign marker. It appears in sign-focused icons, selection cues, progress, and small identity accents.
- **Strava Orange:** strava-orange is reserved for a direct action that connects to Strava; it does not become a second general-purpose brand color.

Dark theme keeps the same hierarchy by swapping the grayscale stack to charcoal surfaces and near-white ink. Town-sign yellow becomes slightly brighter for contrast while keeping its singular role.

### Named Rules

**The Yellow Marker Rule.** Town-sign yellow is scarce and meaningful. Use it for Ortsschildsprint identity, a city-sign-specific state, or progress that represents sign collection; never turn it into the default button color.

**The Strava Boundary Rule.** Strava orange identifies the external connection action only. The rest of the product remains in the Ortsschildsprint neutral-and-yellow system.

## Typography

**Display Font:** Space Grotesk Variable, with a sans-serif fallback.

**Body Font:** Inter Variable, with a sans-serif fallback.

**Character:** Space Grotesk makes headings, numeric route data, labels, and workflow controls feel engineered and directional. Inter keeps instructions, privacy language, and data descriptions calm and easy to scan.

### Hierarchy

- **Display:** The heavy Space Grotesk display role begins at the mobile display size in the frontmatter and scales through the home and route headers on larger screens. Use it for a route name, a decisive landing statement, or a primary dashboard number.
- **Headline:** Heavy Space Grotesk is used for panel titles, task names, and clear operational emphasis. Keep it compact and usually tight-tracked.
- **Body:** Inter carries explanatory copy, descriptions, and longer legal or privacy content. Prefer relaxed leading and muted ink for supporting text.
- **Label:** Space Grotesk labels are small, bold, and often uppercase with measured tracking. They identify a control, category, or system state; they are not decorative filler.

### Named Rules

**The Directional Type Rule.** Use the display and label roles to orient a cyclist through a task. Reserve oversized, black display type for the few moments that establish place, route, or outcome.

## Voice & UI Copy

Ortsschildsprint speaks in direct, task-led language. Every visible heading, label, description, and action must earn its place by naming the content, state, consequence, or next step. Headings describe the thing on screen or the decision at hand, rather than setting a mood. Supporting text adds information a rider can act on; if it only repeats the heading, omit it.

Use the same product terms consistently across German and English. Actions state their outcome, such as checking older rides or adding a sign summary to an activity description. Prefer specific, verifiable wording over inspirational framing, journey metaphors, buzzwords, or invented stories.

### Named Rule

**The Purpose Before Poetry Rule.** A rider should understand what a panel shows and what a control changes without interpreting a slogan. If a phrase cannot explain a concrete task, state, consequence, or action, rewrite or remove it.

## Layout

The app is a bounded operating canvas, centered at a 1440px maximum width beneath a fixed translucent header. Mobile starts with a single-column task flow and generous touch targets; larger layouts introduce deliberate grids rather than simply widening text.

The main content uses a 12px mobile page inset, then grows through 20px and 32px at the responsive breakpoints. Panels use a 16px or 20px internal rhythm, while feature sections open to 32px or 48px. The home screen moves from stacked copy and upload controls to a five-column composition at the extra-large breakpoint. Route review pairs maps with an adjacent or overlaid editor only when the viewport can hold both without compressing controls.

The workflow header centers a desktop stepper; the same route stages become a fixed rounded bottom bar on mobile. Maps are allowed to claim viewport height, while informational cards and dialogs retain readable maximum widths.

## Elevation & Depth

The system uses tonal layering first and quiet, ambient lift second. Surfaces become distinct by moving through the neutral container stack; soft shadows are reserved for an upload shell, a floating menu, a dialog, a map panel, or a focused Strava choice. Blur is used sparingly behind fixed navigation and modal overlays to keep temporary layers legible.

### Shadow Vocabulary

- **Ambient panel:** A broad, diffuse shadow supports a feature shell or floating map surface without creating a hard edge.
- **Lifted choice:** A restrained primary-tinted shadow confirms the currently selected Strava preference.
- **Connection action:** The Strava call to action carries a warm orange shadow that belongs only to that external-service action.

### Named Rules

**The Quiet Lift Rule.** Shadows separate tools from the route canvas; they must not make every card look raised or turn the app into a glossy dashboard.

## Shapes

The form language is soft, practical, and touch-friendly. Fully rounded pills belong to actions, chips, icon controls, and compact workflow states. Rectangular task panels use a 1.5rem radius; feature panels, overlays, and upload shells grow through 1.75rem to 2rem. Choice cards sit slightly tighter at 1.25rem so repeated options remain organized.

Borders are low-contrast and functional. A dashed edge signals a file drop target; subtle solid edges describe a contained menu, preference choice, or card boundary. Avoid sharp rectangles unless a map, data image, or external artifact requires one.

### Named Rules

**The Soft Instrument Rule.** Controls should feel ready for a gloved thumb or a quick roadside decision: generously rounded, clearly bounded, and never fussy.

## Components

### Buttons

- **Route-file action:** A full pill in primary-container with strong dark text. It is the familiar browse/select action inside the upload workflow and scales slightly on hover.
- **Secondary action:** A full pill in the darkest available neutral container. Use it for a safe continuation or an adjacent action, never to compete with a route-file decision.
- **Strava connection action:** A compact rounded rectangle in Strava orange with white heavy label text. It is exclusive to the authorization handoff.
- **Focus:** All interactive controls retain a visible two-pixel focus treatment with separation from the control edge.

### Cards / Containers

- **Surface card:** A surface-container-lowest panel with a soft shadow and a 1.5rem radius. It holds upload tasks, menu content, and concise route information.
- **Feature shell:** A 1.75rem or 2rem rounded container may use a restrained border, subtle gradient, or grid texture when a connected-service task needs more context.
- **Selection card:** A 1.25rem rounded choice with a low-contrast border. Its selected state gains a tonal primary fill and quiet ambient lift rather than a loud color swap.

### Navigation

- **Header:** Fixed, translucent, blurred, and contained inside the centered app width. The product wordmark is a heavy italic uppercase text mark rather than a conventional logo lockup.
- **Menu trigger:** A small circular neutral control opens a rounded floating menu with grouped language, theme, legal, and external links.
- **Workflow navigation:** A numbered desktop stepper becomes a three-item fixed bottom bar on mobile. Active states rely on tonal fill, strong ink, and an underline or selected icon treatment.

### File Upload

- **Drop zone:** A padded, dashed panel inside a white upload shell. The central icon sits in a large neutral circle; accepted file formats are shown as compact rounded chips.
- **State:** Processing retains the panel and replaces the central message with a quiet spinner and status text. Errors surface as a compact floating alert rather than changing the whole page.

### Strava Connection

- **Connect shell:** A generous feature panel uses faint grid and radial texture, but preserves the neutral system as its base.
- **Preference choices:** Two pressable cards expose whether activity descriptions receive a sign summary. Selected state is shown with an icon tile, tonal field, check indicator, and quiet lift.

## Do's and Don'ts

### Do:

- **Do** keep the grayscale surface stack responsible for most hierarchy and depth.
- **Do** use town-sign yellow as the scarce Ortsschildsprint identity and city-sign signal.
- **Do** pair strong Space Grotesk operational labels with calm Inter explanations.
- **Do** use rounded, generously padded controls for route selection, review, export, and connected-service preferences.
- **Do** use ambient shadows only when a panel needs to separate from a map, route canvas, or temporary overlay.
- **Do** keep Strava orange constrained to the Strava authorization action.

### Don't:

- **Don't** make yellow the default action color or spread it across unrelated cards and controls.
- **Don't** introduce a second general-purpose accent color that competes with the town-sign identity.
- **Don't** replace the tonal hierarchy with heavy borders, harsh shadows, or glossy elevation everywhere.
- **Don't** use sharp-cornered controls for core cyclist workflows when the existing soft instrument language fits.
- **Don't** make maps, dense route data, or connected-service panels visually louder than the decision a cyclist needs to make.
- **Don't** use vague, aspirational, or narrative copy where a direct task, state, or consequence can be named.

## Review Artifacts

Screenshots in `.impeccable/review/` are local validation evidence. Do not commit or attach them to a pull request unless the requester explicitly asks for them.
