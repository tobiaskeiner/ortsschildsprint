import type { SVGProps } from "react";

export type LocalIconName =
  "dots" | "heatmap" | "history" | "note" | "noteOff" | "pin";

interface LocalIconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  name: LocalIconName;
  size?: number;
}

/**
 * Small dashboard icons kept in the application bundle. This avoids relying
 * on Material Symbol font ligatures being present in a user's browser.
 */
export const LocalIcon = ({ name, size = 20, ...props }: LocalIconProps) => (
  <svg
    aria-hidden="true"
    fill="none"
    height={size}
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.9"
    viewBox="0 0 24 24"
    width={size}
    {...props}
  >
    {name === "note" && (
      <>
        <path d="M5 3.75h10.25L19 7.5v12.75H5z" />
        <path d="M15 3.75V7.5h3.75M8.5 12h7M8.5 15.5h4.25" />
      </>
    )}
    {name === "noteOff" && (
      <>
        <path d="M5 3.75h10.25L19 7.5v12.75H5z" />
        <path d="M15 3.75V7.5h3.75M4 4l16 16" />
      </>
    )}
    {name === "history" && (
      <>
        <path d="M4.5 7.5V3.75m0 3.75h3.75" />
        <path d="M4.9 7.2A8 8 0 1 1 4 12" />
        <path d="M12 7.5V12l3 1.75" />
      </>
    )}
    {name === "pin" && (
      <>
        <path d="M19 10.25c0 5.25-7 10-7 10s-7-4.75-7-10a7 7 0 1 1 14 0Z" />
        <circle cx="12" cy="10.25" r="2.25" />
      </>
    )}
    {name === "heatmap" && (
      <>
        <path d="M12.5 2.75c.5 3.75-2.75 4.75-2.75 7.25 0 1.25.9 2.25 2.25 2.25 1.7 0 2.75-1.55 2.25-3.25 2.9 1.75 4.25 4.2 4.25 6.75a6.5 6.5 0 1 1-13 0c0-3.25 1.75-6.15 4.25-8.25.45 2.2 1.4 3 2.75 3.25" />
        <path d="M12 21.25c-1.8 0-3.25-1.4-3.25-3.15 0-1.25.75-2.4 1.85-3.1.15 1.15.8 1.85 1.8 1.85.85 0 1.5-.55 1.75-1.35.75.65 1.1 1.55 1.1 2.45 0 1.8-1.45 3.3-3.25 3.3Z" />
      </>
    )}
    {name === "dots" && (
      <>
        <circle cx="6" cy="7" r="1.5" fill="currentColor" />
        <circle cx="16.75" cy="5.25" r="1.5" fill="currentColor" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        <circle cx="18" cy="17" r="1.5" fill="currentColor" />
        <circle cx="5.5" cy="18.25" r="1.5" fill="currentColor" />
      </>
    )}
  </svg>
);
