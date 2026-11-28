/** A miniature town sign: the one yellow mark a workflow step carries. */
const TownSignMark: React.FC = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-6 shrink-0"
    focusable="false"
    viewBox="0 0 24 16"
  >
    <rect
      className="fill-town-sign"
      height="15"
      rx="2.5"
      stroke="#1b1b1a"
      strokeWidth="1"
      width="23"
      x="0.5"
      y="0.5"
    />
    <rect
      fill="none"
      height="12"
      rx="1.25"
      stroke="#1b1b1a"
      strokeWidth="1.25"
      width="20"
      x="2"
      y="2"
    />
    <rect fill="#1b1b1a" height="2.25" rx="0.5" width="12" x="6" y="5.5" />
    <rect fill="#1b1b1a" height="1.25" rx="0.5" width="8" x="8" y="9.5" />
  </svg>
);

export default TownSignMark;
