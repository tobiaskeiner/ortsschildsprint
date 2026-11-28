import type { Sign, SnapCandidate } from "../../../shared/types";

const byRouteDistance = (a: SnapCandidate, b: SnapCandidate) =>
  a.distanceAlongRoute - b.distanceAlongRoute;

export const isSameSnapCandidate = (
  a: SnapCandidate | undefined,
  b: SnapCandidate,
) => a?.distanceAlongRoute === b.distanceAlongRoute;

export const getSelectedSnapCandidates = (sign: Sign): SnapCandidate[] => {
  if (sign.selectedPositionsOnRoute?.length) {
    return [...sign.selectedPositionsOnRoute].sort(byRouteDistance);
  }

  return sign.positionOnRoute ? [sign.positionOnRoute] : [];
};

/** Where the rider first meets the sign; fixes its place in route order. */
export const firstPassAlongRoute = (sign: Sign) => {
  const result = sign.snapResult;
  if (result?.status === "ok") return result.position.distanceAlongRoute;
  if (result?.status === "ambiguous") {
    return Math.min(...result.candidates.map((c) => c.distanceAlongRoute));
  }
  return sign.positionOnRoute?.distanceAlongRoute ?? Number.POSITIVE_INFINITY;
};

export const allPasses = (sign: Sign): SnapCandidate[] => {
  const result = sign.snapResult;
  if (result?.status === "ok") return [result.position];
  if (result?.status === "ambiguous") return result.candidates;
  return [];
};

/** Every pass is a detected town exit, so the sign starts out skipped. */
export const isDetectedExit = (sign: Sign) => {
  const passes = allPasses(sign);
  return passes.length > 0 && passes.every((pass) => pass.crossing === "exit");
};

/**
 * Route passes to export for a sign. A skipped sign exports nothing. An
 * ambiguous sign nobody reviewed falls back to its first pass that is not a
 * detected exit, as the proceed warning tells the user.
 */
export const getExportSnapCandidates = (sign: Sign): SnapCandidate[] => {
  if (sign.skipped) return [];
  const selected = getSelectedSnapCandidates(sign);
  if (selected.length > 0) return selected;

  if (sign.snapResult?.status !== "ambiguous") return [];
  const candidates = sign.snapResult.candidates;
  return [candidates.find((pass) => pass.crossing !== "exit") ?? candidates[0]];
};

/**
 * The starting selection for a freshly snapped sign: detected entries are
 * chosen, a sign that is only ever left is skipped, and anything unclear is
 * left for the rider exactly as before detection existed.
 */
export const withDetectedSelection = (sign: Sign): Sign => {
  const result = sign.snapResult;
  if (isDetectedExit(sign)) {
    return { ...sign, skipped: true, positionOnRoute: undefined };
  }
  if (result?.status === "ok") {
    return withSelectedSnapCandidates(sign, [result.position]);
  }
  if (result?.status === "ambiguous") {
    const entries = result.candidates.filter(
      (pass) => pass.crossing === "entry",
    );
    const undecided = result.candidates.some(
      (pass) => pass.crossing !== "entry" && pass.crossing !== "exit",
    );
    // with an unclear pass left, the rider still chooses; entries are a hint
    return undecided && entries.length === 0
      ? sign
      : withSelectedSnapCandidates(sign, entries);
  }
  return sign;
};

export const withSelectedSnapCandidates = (
  sign: Sign,
  positions: SnapCandidate[],
): Sign => {
  const sortedPositions = [...positions].sort(byRouteDistance);

  return {
    ...sign,
    positionOnRoute: sortedPositions[0],
    selectedPositionsOnRoute:
      sortedPositions.length > 0 ? sortedPositions : undefined,
  };
};

export const toggleSnapCandidateSelection = (
  sign: Sign,
  candidate: SnapCandidate,
): Sign => {
  const selectedPositions = getSelectedSnapCandidates(sign);
  const nextPositions = selectedPositions.some((position) =>
    isSameSnapCandidate(position, candidate),
  )
    ? selectedPositions.filter(
        (position) => !isSameSnapCandidate(position, candidate),
      )
    : [...selectedPositions, candidate];

  return withSelectedSnapCandidates(sign, nextPositions);
};
