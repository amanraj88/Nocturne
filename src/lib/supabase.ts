import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// In Node < 22 without experimental-websocket, satisfy the RealtimeClient constructor check
// for server-side REST/PostgreSQL operations while explicitly throwing if instantiation is attempted on the server.
if (typeof window === 'undefined' && typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class ServerDatabaseWebSocket {
    constructor() {
      throw new Error(
        '[NOCTURNE Realtime Notice] Realtime WebSocket connections are not available in serverless execution. Realtime channels must be subscribed from browser clients.'
      );
    }
  } as any;
}

/**
 * Checks whether legitimate Supabase credentials have been configured.
 * Uses direct static property access so Next.js Webpack DefinePlugin can inline values at build time.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  if (url.includes('placeholder') || key.includes('placeholder')) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return isSupabaseConfigured() && url ? url : 'https://placeholder.supabase.co';
}

export function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return isSupabaseConfigured() && key ? key : 'placeholder-anon-key';
}

declare global {
  // eslint-disable-next-line no-var
  var __nocturneSupabaseClient: SupabaseClient | undefined;
}

/**
 * Shared Supabase Client instance (Singleton)
 * Configured with auto-refreshing sessions and browser localStorage persistence.
 */
export const supabase: SupabaseClient =
  global.__nocturneSupabaseClient ||
  createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

if (typeof window !== 'undefined') {
  global.__nocturneSupabaseClient = supabase;
}

// In-flight initialization promise to prevent duplicate anonymous signups from concurrent React renders
let authInitInFlight: Promise<{ user: User | null; error: Error | null }> | null = null;

/**
 * Initializes or restores an anonymous authentication session.
 * Idempotent: returns the existing user if already authenticated.
 * Deduplicated: concurrent calls (e.g. React 18 StrictMode double-mounting) share the same in-flight promise.
 * Safe: gracefully falls back if Supabase is offline or unconfigured.
 */
export async function initAnonymousAuth(): Promise<{ user: User | null; error: Error | null }> {
  if (!isSupabaseConfigured() || typeof window === 'undefined') {
    return { user: null, error: null };
  }

  if (authInitInFlight) {
    return authInitInFlight;
  }

  authInitInFlight = (async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.warn('[NOCTURNE Auth] Session retrieval notice:', sessionError.message);
      }
      if (session?.user) {
        return { user: session.user, error: null };
      }

      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.warn('[NOCTURNE Auth] Anonymous sign-in notice:', error.message);
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (err: any) {
      console.warn('[NOCTURNE Auth] Exception during anonymous authentication:', err);
      return { user: null, error: err };
    } finally {
      authInitInFlight = null;
    }
  })();

  return authInitInFlight;
}
