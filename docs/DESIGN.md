# Design System Documentation: Velocity Precision

## 1. Overview & Creative North Star

The Creative North Star for this design system is **"The Kinetic Dashboard."**

This system rejects the static, boxy nature of traditional web apps in favor of a high-velocity, editorial aesthetic. It is inspired by the precision of premium cycling computers (Garmin, Wahoo) and the bold, authoritative visual language of European road racing. We achieve a "custom" feel by breaking the standard grid with intentional asymmetry, oversized data points, and layered depths that suggest a device interface rather than a webpage.

Every pixel must feel intentional, high-contrast, and engineered for performance. We move beyond "clean" into "precise," where white space is used as a structural tool to separate high-intensity data streams.

---

## 2. Colors & Surface Logic

The palette is built on the high-visibility heritage of the German _Ortsschild_ (city limit sign). It uses high-contrast blacks and yellows to command attention, balanced by a sophisticated hierarchy of neutral surfaces.

### Surface Hierarchy & Nesting

To move away from "flat" design, we utilize **Tonal Layering**.

- **Base Layer:** `surface` (#f8f9fa) is your canvas.
- **Sectioning:** Use `surface_container_low` or `surface_container` to define large content areas.
- **Floating Elements:** Use `surface_container_lowest` (#ffffff) for cards or interactive elements to create a natural "lift."
- **Deep Content:** Use `surface_container_highest` for inset elements like code blocks or secondary data feeds.

### The "No-Line" Rule

**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning. Structural boundaries must be defined solely through background color shifts. For example, a card (`surface_container_lowest`) sitting on a section (`surface_container_low`) provides enough contrast to define a boundary without the visual "noise" of a line.

### The "Glass & Gradient" Rule

To evoke a premium, "lens-like" feel, use **Glassmorphism** for floating navigation bars or data overlays.

- **Token:** `surface_bright` at 80% opacity with a `20px` backdrop-blur.
- **Signature Texture:** For main Call-to-Actions (CTAs) or high-performance stats, use a subtle linear gradient transitioning from `primary` (#705d00) to `primary_container` (#f0ca00). This adds a "soul" and depth that flat hex codes lack.

---

## 3. Typography

Typography is our primary brand vehicle. We pair the technical, wide apertures of **Space Grotesk** for data and headers with the functional clarity of **Inter** for long-form content.

- **Display & Headlines (Space Grotesk):** Use these for "Hero" moments—sprint times, speeds, and city names. These should feel loud and unapologetic.
  - _Example:_ Use `display-lg` for the "Top Speed" metric to mimic a professional racing broadcast.
- **Titles & Body (Inter):** These handle the heavy lifting. Inter’s tall x-height ensures readability even when a cyclist is glancing at a screen mid-ride.
- **The Typography Hierarchy:**
  - `display-lg`: The "Main Metric."
  - `headline-md`: The "Section Header."
  - `label-md`: The "Technical Meta-data" (e.g., "KILOMETERS," "WATTAGE"). Labels should always be uppercase with `0.05em` letter spacing to evoke a digital instrument feel.

---

## 4. Elevation & Depth

We eschew traditional drop shadows for **Ambient Tonal Depth**.

- **The Layering Principle:** Depth is achieved by stacking the surface-container tiers.
- **Ambient Shadows:** When an element must float (e.g., a modal or a primary FAB), use a shadow with a large blur (32px+) and low opacity (6% `on_surface`). The shadow should feel like a soft glow of environmental light, not a dark smudge.
- **The "Ghost Border" Fallback:** If a boundary is strictly required for accessibility, use a "Ghost Border." Use the `outline_variant` token at **15% opacity**. A 100% opaque border is a failure of the layout.
- **Perspective Layering:** Overlap elements intentionally. A map component might slightly bleed under a `surface_bright` glass card to create a sense of three-dimensional space.

---

## 5. Components

### Buttons

- **Primary:** Background: `primary_container` (#f0ca00), Text: `on_primary_container`. Shape: `full` (pill) for a sporty feel.
- **Secondary:** Background: `surface_container_highest`, Text: `on_surface`.
- **Interaction:** On hover, apply a subtle scale (1.02) rather than just a color change to simulate physical feedback.

### The Telemetry Card (Custom)

Forbid the use of divider lines within cards. Use `32px` of vertical white space to separate data groups.

- **Structure:** Headline on the top left, large `display-sm` metric in the center, and `label-sm` technical data at the bottom.
- **Background:** `surface_container_lowest`.

### Input Fields

- **Style:** Minimalist. No background color—only a "Ghost Border" on the bottom edge.
- **Focus State:** The bottom border transforms into a `2px` solid `primary` (#705d00) line.

### Chips & Tags

- **Selection Chips:** Use `secondary_container` with `on_secondary_container` text. Roundedness should be `md` (0.75rem) to contrast with the pill-shaped buttons.

### Lists

Lists must never use dividers. Instead, alternate backgrounds between `surface` and `surface_container_low`, or use generous `24px` padding between items to allow the eye to track the data naturally.

---

## 6. Do's and Don'ts

### Do:

- **Do** use `display-lg` for single, high-impact numbers.
- **Do** allow content to breathe. If you think there is enough white space, add 8px more.
- **Do** use the `primary` yellow as an accent for "success" states or peak performance indicators.

### Don't:

- **Don't** use 1px solid borders to separate sections.
- **Don't** use pure black (#000000) for text; use `on_surface` (#191c1d) for a more premium, "ink-like" feel.
- **Don't** use standard "drop shadows." If it looks like a 2010 Photoshop effect, it's wrong.
- **Don't** clutter the screen. If a piece of data isn't essential for a sprint, hide it in a secondary layer.

---

## 7. Spacing Scale

Consistency in spacing creates the "engineered" feel.

- **4px / 8px:** Atomic spacing (icon to text).
- **16px / 24px:** Component internal padding.
- **48px / 64px:** Section margins and vertical breathing room.

_Designers: Remember, this design system is a high-performance machine. Every element should feel like it belongs on a €10,000 carbon fiber bike._
