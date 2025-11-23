import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY");
}

// Validate URL format
if (!supabaseUrl.startsWith("https://") || !supabaseUrl.includes(".supabase.co")) {
  console.error("⚠️  Warning: Supabase URL format looks incorrect.");
  console.error(`   Current URL: ${supabaseUrl}`);
  console.error(`   Expected format: https://[project-ref].supabase.co`);
}

// Log the URL (without exposing the key) for debugging
console.log(`[Supabase] Connecting to: ${supabaseUrl.replace(/\/$/, "")}`);

export const supabase = createClient(supabaseUrl, supabaseKey);

