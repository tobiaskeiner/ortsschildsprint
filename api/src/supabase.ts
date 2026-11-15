import { createClient } from "@supabase/supabase-js";
import { bindings } from "./config";

if (!bindings.SUPABASE_URL || !bindings.SUPABASE_KEY) {
  throw new Error("Supabase is not configured");
}

export const supabase = createClient(
  bindings.SUPABASE_URL,
  bindings.SUPABASE_KEY,
);
