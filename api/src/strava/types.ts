import { z } from "zod";

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

export const stravaTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  expires_at: z.number().int().positive(),
});

export type StravaTokenResponse = z.infer<typeof stravaTokenResponseSchema>;

export const oAuthTokenResponseSchema = stravaTokenResponseSchema.extend({
  athlete: z.object({
    id: z.number().int().safe(),
    firstname: z.string().nullish(),
    lastname: z.string().nullish(),
    profile: z.string().nullish(),
  }),
  /** Space-separated scopes Strava actually granted for this token. */
  scope: z.string().nullish(),
});

export type OAuthTokenResponse = z.infer<typeof oAuthTokenResponseSchema>;

export const stravaWebhookEventSchema = z.object({
  aspect_type: z.enum(["create", "update", "delete"]),
  event_time: z.number().int().safe(),
  object_id: z.number().int().safe(),
  object_type: z.enum(["activity", "athlete"]),
  owner_id: z.number().int().safe(),
  updates: z.record(z.string(), z.unknown()).nullish(),
});

export type StravaWebhookEvent = z.infer<typeof stravaWebhookEventSchema>;
