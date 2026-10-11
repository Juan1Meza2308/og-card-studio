import {
  createClient,
  type AuthChangeEvent,
  type Session,
  type SupabaseClient,
} from "@supabase/supabase-js";
import type { Database } from "./types";
import { brokeredPreviewStorage } from "./previewAuthStorage";
import { getValidatedEnv } from "@/lib/env";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

const UNAVAILABLE_MESSAGE =
  "Supabase no está configurado en este entorno, así que la funcionalidad en la nube está deshabilitada.";

/**
 * Cliente degradado para entornos sin credenciales válidas de Supabase.
 *
 * Ninguno de sus métodos lanza excepciones: la autenticación resuelve con una
 * sesión vacía (el mismo resultado que un usuario sin iniciar sesión) y las
 * operaciones de escritura responden con un error legible. De esta forma una
 * configuración incorrecta nunca puede propagar una excepción dentro de React
 * ni derribar el resto de la aplicación.
 */
function createDisabledSupabaseClient(): SupabaseClient<Database> {
  const unavailable = {
    data: null,
    error: { message: UNAVAILABLE_MESSAGE, status: 503 },
  };

  const authDisabled = {
    // Emite la sesión inicial (vacía) igual que haría el cliente real.
    onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
      callback("INITIAL_SESSION", null);
      return { data: { subscription: { unsubscribe() {} } } };
    },
    async getUser() {
      return { data: { user: null }, error: null };
    },
    async getSession() {
      return { data: { session: null }, error: null };
    },
    async setSession() {
      return { data: { session: null }, error: null };
    },
    async signOut() {
      return { error: null };
    },
    async signInWithPassword() {
      return unavailable;
    },
    async signUp() {
      return unavailable;
    },
    async resetPasswordForEmail() {
      return unavailable;
    },
    async updateUser() {
      return unavailable;
    },
    async exchangeCodeForSession() {
      return unavailable;
    },
  };

  // Consultas sin backend: cualquier método encadena y al esperar el resultado
  // resuelve con un valor vacío sin hacer ninguna petición de red.
  const noopBuilder = new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === "then") {
          return (onFulfilled?: (value: { data: null; error: null }) => unknown) =>
            Promise.resolve({ data: null, error: null }).then(onFulfilled);
        }
        return () => noopBuilder;
      },
    },
  );

  // Solo se implementa la superficie que consume el frontend: auth, from,
  // channel y storage. La aserción de tipo es necesaria porque el stub es
  // deliberadamente parcial (el resto de métodos nunca se invocan aquí).
  return {
    auth: authDisabled,
    from: () => noopBuilder,
    channel: () => ({
      on() {
        return this;
      },
      subscribe() {
        return this;
      },
      send() {
        return Promise.resolve("ok");
      },
      unsubscribe() {},
    }),
    storage: {
      from: () => noopBuilder,
    },
  } as unknown as SupabaseClient<Database>;
}

function createSupabaseClient(): SupabaseClient<Database> {
  // Fail fast con un mensaje descriptivo cuando las variables de entorno son
  // inválidas, pero nunca lanzo dentro de React: se degrada con elegancia.
  let env;
  try {
    env = getValidatedEnv();
  } catch {
    console.warn("[Supabase] Credenciales ausentes o inválidas; la nube queda deshabilitada.");
    return createDisabledSupabaseClient();
  }
  const SUPABASE_URL = env.VITE_SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
    },
    auth: {
      storage: brokeredPreviewStorage(),
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
