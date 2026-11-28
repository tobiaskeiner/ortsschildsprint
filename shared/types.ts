export type Sign = {
  id: number;
  osm_id: number;
  tags: Record<string, string>;
  lat: number;
  long: number;
  // which side of the sign is inside the town; absent when it is unknown
  direction?: SignDirection;
  snapResult?: SignSnapResult;
  // primary resolved route position used by single-placement exports
  positionOnRoute?: SnapCandidate;
  // selected route passes for ambiguous signs; FIT export can emit all of them
  selectedPositionsOnRoute?: SnapCandidate[];
  // left out of the export but still listed, e.g. a detected town exit
  skipped?: boolean;
};

export type SignDirection = {
  // compass bearing of the road direction leading into the town
  insideBearing: number;
  confidence: "high" | "low";
};

// how the route passes a sign; "unknown" leaves the decision to the rider
export type SignCrossing = "entry" | "exit" | "unknown";

export type SignsResponse = Sign[];

export type Formats = "gpx" | "tcx" | "fit";

export type SnapCandidate = {
  lat: number;
  long: number;
  distanceAlongRoute: number; // meters
  crossing?: SignCrossing;
};

export type SignSnapResult =
  | { status: "ok"; position: SnapCandidate }
  | { status: "ambiguous"; candidates: SnapCandidate[] }
  // this case should not happen because signs are already filtered
  | { status: "off_route" };
