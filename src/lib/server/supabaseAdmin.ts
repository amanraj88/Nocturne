import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase Administrative Client
 *
 * Uses the privileged SUPABASE_SERVICE_ROLE_KEY to bypass Row Level Security.
 * Strictly restricted to server-side execution (API routes, server components, scripts).
 *
 * NEVER import this file into client components, hooks, or browser-rendered code.
 */

if (typeof window !== 'undefined') {
  throw new Error(
    '[NOCTURNE Security Violation] supabaseAdmin cannot be imported or executed in browser bundles.'
  );
}

// In Node < 22 without experimental-websocket, satisfy the RealtimeClient constructor check
// for server-side REST/PostgreSQL operations while explicitly throwing if instantiation is attempted.
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class ServerDatabaseWebSocket {
    constructor() {
      throw new Error(
        '[NOCTURNE Realtime Notice] Realtime WebSocket connections are not available in server-side administrative client. Realtime channels must be subscribed from authenticated browser clients.'
      );
    }
  } as any;
}

declare global {
  // eslint-disable-next-line no-var
  var __nocturneSupabaseAdmin: SupabaseClient | undefined;
}

export function getServiceRoleClient(): SupabaseClient | null {
  if (typeof window !== 'undefined') {
    throw new Error('[NOCTURNE Security Violation] Service-role client requested in browser.');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    supabaseUrl.includes('placeholder') ||
    serviceRoleKey.includes('placeholder')
  ) {
    return null;
  }

  if (!global.__nocturneSupabaseAdmin) {
    global.__nocturneSupabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return global.__nocturneSupabaseAdmin;
}
