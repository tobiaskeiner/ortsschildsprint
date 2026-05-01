import type { Sign } from "../../../shared/types";

export const signsToGeoJSON = (
  signs: Sign[],
): GeoJSON.FeatureCollection<GeoJSON.Point> => {
  return {
    type: "FeatureCollection",
    features: signs.map((sign) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [sign.long, sign.lat], // GeoJSON is [lng, lat]
      },
      properties: {
        id: sign.id,
        osm_id: sign.osm_id,
        ...sign.tags,
      },
    })),
  };
};
