# NOCTURNE deployment checklist

## Supabase

1. Use the existing Sydney project (`ap-southeast-2`). Do not edit or rerun
   `supabase/migrations/20261111_init.sql`.
2. In SQL Editor, run the read-only checks in
   `docs/database-permissions-proposal.sql` and review the existing grants,
   especially `host_recovery_attempts`. If other systems rely on those grants,
   stop and review before resetting them.
3. Paste and run `supabase/migrations/20261112_security_hardening.sql` as one
   script. Then run the basic verification queries from the same guide.
4. In Authentication settings, enable Anonymous Sign-Ins. Set the Site URL to
   the final HTTPS domain and add the production URL to Redirect URLs.
5. Confirm `nocturne-audio` is private and has its existing 25 MiB limit.

## Vercel

1. Push the reviewed `main` branch to GitHub, then import `amanraj88/Nocturne`
   into Vercel. Hobby is for personal, non-commercial use.
2. Add these environment variables in Vercel (Production and Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; never prefix with `NEXT_PUBLIC_`)
   - `YOUTUBE_API_KEY` (optional; only for live YouTube search)
3. Deploy a Preview and check room listing, private-room access, playback, chat,
   and local audio upload. Then deploy Production and repeat a short smoke test.

`.env.local` is ignored by Git and `.env.example` contains placeholders. Do not
commit credentials or paste them into chat. Vercel runs Next.js Functions; do not
use the Docker/persistent-volume instructions for production. Supabase stores
the production room and audio data.

Future improvements: integrate CAPTCHA before a public launch; replace short-lived
signed audio URLs if strict immediate media revocation is required. These do not
block a personal Preview deployment. CAPTCHA is not wired into the app yet, so
do not enable Supabase CAPTCHA until the app can pass its token.
