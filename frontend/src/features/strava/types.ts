export interface StravaDashboard {
  athlete: {
    append_sign_summary: boolean;
    display_name: string;
    granted_scopes: string[];
    profile_image_url: string | null;
  } | null;
  generatedAt: string;
  stats: {
    collectedSigns: number;
    processedActivities: number;
    totalRides: number | null;
  };
  importState: {
    analyzed_ride_count: number;
    completed: boolean;
    full_history_requested: boolean;
    initial_import_complete: boolean;
    total_ride_count: number | null;
    updated_at: string;
  } | null;
  signs: {
    osm_id: number;
    tags: Record<string, string>;
    lat: number;
    long: number;
  }[];
  collection: {
    collected_at: string;
    first_activity_id: number;
    osm_id: number;
  }[];
}
