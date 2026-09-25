import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getValidatedEnv } from "@/lib/env";

/**
 * Server-only Supabase client with the service role key.
 *
 * This client bypasses RLS and is used for operations that must run without
 * a user session — specifically, validating API keys and fetching user templates
 * from the image endpoint. It is only created when SUPABASE_SERVICE_ROLE_KEY
 * is present in the environment.
 *
 * The client is lazily initialized to avoid throwing at module load time when
 * the key is not configured (e.g. in local development without the key).
 */
let _serviceClient: ReturnType<typeof createClient<Database>> | null = null;

function createServiceClient(): ReturnType<typeof createClient<Database>> | null {
  try {
    const env = getValidatedEnv();
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
      return null;
    }
    return createClient<Database>(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch {
    return null;
  }
}

export function getServiceClient(): ReturnType<typeof createClient<Database>> | null {
  if (_serviceClient) return _serviceClient;
  _serviceClient = createServiceClient();
  return _serviceClient;
}

/**
 * Validates an API key and returns the associated user ID.
 *
 * The key is expected to be the full opaque string (e.g. "og_live_abc123...").
 * It is hashed with SHA-256 and looked up in the `api_keys` table.
 *
 * Returns the user_id on success, null if the key is invalid/revoked/not found,
 * or throws if the service client is not configured.
 */
export async function validateApiKey(key: string): Promise<string | null> {
  const client = getServiceClient();
  if (!client) {
    throw new Error("Service role key not configured");
  }

  // Hash the key with SHA-256 (same as the trigger in the migration)
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const keyHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  const { data: keyData, error: keyError } = await client
    .from("api_keys")
    .select("user_id")
    .eq("key_hash", keyHash)
    .eq("status", "active")
    .maybeSingle();

  if (keyError) {
    console.error("[og] api key lookup failed", keyError);
    return null;
  }
  return keyData?.user_id ?? null;
}

/**
 * Fetches a user's custom template by ID.
 *
 * Returns the template row on success, null if not found or not owned by the user.
 */
export async function fetchUserTemplate(
  userId: string,
  templateId: string,
): Promise<Database["public"]["Tables"]["templates"]["Row"] | null> {
  const client = getServiceClient();
  if (!client) {
    throw new Error("Service role key not configured");
  }

  const { data: templateData, error: templateError } = await client
    .from("templates")
    .select("*")
    .eq("id", templateId)
    .eq("user_id", userId)
    .maybeSingle();

  if (templateError) {
    console.error("[og] template fetch failed", templateError);
    return null;
  }
  return templateData ?? null;
}