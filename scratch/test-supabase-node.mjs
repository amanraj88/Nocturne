import { createClient } from '@supabase/supabase-js';

// In Node 20, if WebSocket is not on globalThis, provide a fallback constructor if needed on server
if (typeof globalThis.WebSocket === 'undefined') {
  // Can we provide a dummy class or does it work?
  globalThis.WebSocket = class DummyWebSocket {};
}

try {
  const client = createClient('https://placeholder.supabase.co', 'placeholder-key', {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  console.log('Client created successfully with dummy WebSocket:', Boolean(client));
  console.log('Can call from():', typeof client.from);
} catch (e) {
  console.error('Failed with error:', e.message);
}
