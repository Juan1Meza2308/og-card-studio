import { z } from "zod";

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url("VITE_SUPABASE_URL must be a valid URL"),
  VITE_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(10, "VITE_SUPABASE_PUBLISHABLE_KEY looks too short"),
});

type ParsedEnv = z.infer<typeof envSchema>;

let cached: ParsedEnv | null = null;
let lastError: string | null = null;

/**
 * Validates the Supabase env vars once and caches the result.
 * Designed to run on the server or at module load on the client,
 * where import.meta.env has been replaced at build time.
 */
export function getValidatedEnv(): ParsedEnv {
  if (cached) return cached;

  const source = {
    VITE_SUPABASE_URL:
      import.meta.env["VITE_SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"] || "",
    VITE_SUPABASE_PUBLISHABLE_KEY:
      import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
      process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
      "",
  };

  const result = envSchema.safeParse(source);
  if (!result.success) {
    lastError = result.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(`Invalid environment: ${lastError}`);
  }

  cached = result.data;
  return cached;
}

export function getEnvValidationError(): string | null {
  return lastError;
}
