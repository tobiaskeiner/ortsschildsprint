export interface ActivitySummary {
  id: number;
  manual?: boolean;
  private?: boolean;
  sport_type?: string;
  start_date: string;
  trainer?: boolean;
}

export interface Activity extends ActivitySummary {
  description?: string | null;
  map?: { summary_polyline?: string | null };
}

export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface OAuthTokenResponse extends StravaTokenResponse {
  athlete: {
    id: number;
    firstname?: string;
    lastname?: string;
    profile?: string;
  };
}

export interface StravaWebhookEvent {
  aspect_type?: string;
  event_time?: number;
  object_id?: number;
  object_type?: string;
  owner_id?: number;
  updates?: Record<string, unknown>;
}
