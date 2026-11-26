/**
 * Authored map illustration for the home stage: a route crossing a few towns,
 * with a city-limit sign plate wherever it enters one. Purely decorative.
 */

// Anchors of the route path below; each one is a point exactly on the line.
const SIGN_POINTS: [number, number][] = [
  [236, 656],
  [420, 590],
  [700, 560],
  [900, 360],
  [1150, 230],
];

const ROUTE =
  "M-20 724 C90 720 170 676 236 656 S350 590 420 590 S600 640 700 560 S780 384 900 360 S1080 320 1150 230 S1290 84 1420 60";

// Small building blocks around each town, offsets relative to the sign.
const TOWN_BLOCKS: [number, number, number, number][] = [
  [-46, -40, 26, 18],
  [-14, -52, 20, 24],
  [12, -38, 30, 16],
  [-40, 18, 22, 20],
  [-8, 22, 28, 16],
  [26, 14, 18, 24],
  [44, -20, 22, 18],
];

const HomeRouteMap: React.FC = () => (
  <svg
    aria-hidden="true"
    className="home-map"
    focusable="false"
    preserveAspectRatio="xMidYMid slice"
    viewBox="0 0 1400 800"
  >
    <rect className="home-map-ground" height="800" width="1400" />

    <g className="home-map-forest">
      <path d="M-40 120c120-60 260-40 330 30s40 170-60 210-260 10-300-70z" />
      <path d="M980 520c90-40 230-30 300 40s50 190-70 220-250-20-280-110z" />
      <path d="M560 40c70-30 170-20 210 30s10 110-70 120-170-20-170-80z" />
      <path d="M1200 360c60-30 160-10 200 40v120c-80 30-190 10-220-60z" />
    </g>

    <path
      className="home-map-river"
      d="M-20 300C160 330 260 420 380 400S600 300 760 330 960 470 1100 450 1320 330 1420 350"
    />

    <g className="home-map-road-casing">
      <path d="M-20 520C300 480 520 470 760 470S1180 520 1420 500" />
      <path d="M520 -20C540 180 600 330 640 470S700 700 690 820" />
      <path d="M1000 -20C980 140 1010 260 1080 360S1220 640 1240 820" />
    </g>
    <g className="home-map-road">
      <path d="M-20 520C300 480 520 470 760 470S1180 520 1420 500" />
      <path d="M520 -20C540 180 600 330 640 470S700 700 690 820" />
      <path d="M1000 -20C980 140 1010 260 1080 360S1220 640 1240 820" />
    </g>
    <g className="home-map-lane">
      <path d="M-20 600C120 560 180 520 240 420S330 220 300 -20" />
      <path d="M200 820C260 720 360 680 470 700S620 780 640 820" />
      <path d="M760 -20C820 90 880 160 960 190S1140 200 1240 120 1360 30 1420 20" />
      <path d="M820 820C860 700 940 640 1040 620S1240 640 1420 600" />
      <path d="M300 160C420 200 560 180 700 220S900 300 1000 260" />
    </g>

    <g className="home-map-town">
      {SIGN_POINTS.flatMap(([x, y], townIndex) =>
        TOWN_BLOCKS.map(([dx, dy, w, h]) => (
          <rect
            height={h}
            key={`${x}-${y}-${dx}-${dy}`}
            rx="4"
            width={w}
            x={x + dx + (townIndex % 2 ? 18 : 30)}
            y={y + dy + (townIndex % 2 ? -14 : 8)}
          />
        )),
      )}
    </g>

    <path className="home-map-route-casing" d={ROUTE} />
    <path className="home-map-route" d={ROUTE} pathLength={1} />

    {SIGN_POINTS.map(([x, y], index) => (
      <g
        className="home-map-sign"
        key={`${x}-${y}`}
        style={{ "--sign-index": index } as React.CSSProperties}
        transform={`translate(${x} ${y})`}
      >
        <g>
          <rect height="26" rx="5" width="38" x="-19" y="-13" />
          <rect
            className="home-map-sign-rim"
            height="18"
            rx="2.5"
            width="30"
            x="-15"
            y="-9"
          />
        </g>
      </g>
    ))}
  </svg>
);

export default HomeRouteMap;
