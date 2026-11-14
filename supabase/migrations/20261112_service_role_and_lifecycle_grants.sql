-- NOCTURNE: Grant permissions required for room lifecycle, host room closing, and scheduled cleanup.
-- Additive security patch: preserves all existing RLS policies and table schema.
BEGIN;

-- Allow server-side administrative client (service_role) to select and delete rooms during cleanup
GRANT SELECT, DELETE ON TABLE public.rooms TO service_role;

-- Allow authenticated users and anonymous visitors to read is_featured and updated_at metadata
-- Note: host_key_hash remains strictly private and ungranted to public/anon/authenticated.
GRANT SELECT (is_featured, updated_at) ON TABLE public.rooms TO anon, authenticated;

-- Allow authenticated room hosts to delete their own non-featured rooms (enforced by RLS)
GRANT DELETE ON TABLE public.rooms TO authenticated;

COMMIT;
