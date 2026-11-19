import { createClient } from "@supabase/supabase-js";
import { bindings } from "./config";
import { countedFetch } from "./subrequests";

if (!bindings.SUPABASE_URL || !bindings.SUPABASE_KEY) {
  throw new Error("Supabase is not configured");
}

// Routing supabase-js through countedFetch lets planned work — the scheduled
// Strava batches in particular — track its subrequest cost and stop cleanly
// before an invocation exceeds the Worker plan's per-invocation limit.
export const supabase = createClient(
  bindings.SUPABASE_URL,
  bindings.SUPABASE_KEY,
  {
    global: { fetch: countedFetch },
  },
);
