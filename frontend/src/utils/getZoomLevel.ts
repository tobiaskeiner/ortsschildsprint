import bbox from "@turf/bbox";

export const getZoomLevel = (geoJson?: GeoJSON.FeatureCollection) => {
  if (!geoJson) return 9;
  const box = bbox(geoJson);
  if (box[3] && box[1]) {
    return Math.round(Math.log2(360 / (box[3] - box[1]))) - 1;
  }
  return 9;
};
