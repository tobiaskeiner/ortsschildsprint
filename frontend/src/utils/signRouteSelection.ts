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

/**
 * Route passes to export for a sign. An ambiguous sign nobody reviewed falls
 * back to its first pass, as the proceed warning tells the user.
 */
export const getExportSnapCandidates = (sign: Sign): SnapCandidate[] => {
  const selected = getSelectedSnapCandidates(sign);
  if (selected.length > 0) return selected;

  return sign.snapResult?.status === "ambiguous"
    ? sign.snapResult.candidates.slice(0, 1)
    : [];
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
