import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClient } from "@supabase/supabase-js";
import * as z from "zod";
import { zValidator } from "@hono/zod-validator";
import { env } from "cloudflare:workers";

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_KEY;

if (!supabaseKey || !supabaseUrl) throw new Error();

const supabase = createClient(supabaseUrl, supabaseKey);

const app = new Hono();

// Enable CORS for all routes
app.use("/*", cors());

const schema = z.object({
  minLat: z.number().min(-90).max(90),
  minLong: z.number().min(-180).max(180),
  maxLat: z.number().min(-90).max(90),
  maxLong: z.number().min(-180).max(180),
});

app.post("/signs", zValidator("json", schema), async (c) => {
  const validated = c.req.valid("json");
  const { data, error } = await supabase.rpc("signs_in_box", {
    min_lat: validated.minLat,
    min_long: validated.minLong,
    max_lat: validated.maxLat,
    max_long: validated.maxLong,
  });
  return c.json(data);
});

export default app;
