export type Sign = {
  id: number;
  osm_id: number;
  tags: Record<string, string>;
  lat: number;
  long: number;
  snapResult?: SignSnapResult;
  // primary resolved route position used by single-placement exports
  positionOnRoute?: SnapCandidate;
  // selected route passes for ambiguous signs; FIT export can emit all of them
  selectedPositionsOnRoute?: SnapCandidate[];
};

export type SignsResponse = Sign[];

export type Formats = "gpx" | "tcx" | "fit";

export type SnapCandidate = {
  lat: number;
  long: number;
  distanceAlongRoute: number; // meters
};

export type SignSnapResult =
  | { status: "ok"; position: SnapCandidate }
  | { status: "ambiguous"; candidates: SnapCandidate[] }
  // this case should not happen because signs are already filtered
  | { status: "off_route" };
