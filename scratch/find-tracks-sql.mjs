import fs from 'fs';
const sql = fs.readFileSync('supabase/migrations/20261111_init.sql', 'utf8');
const lines = sql.split('\n');
lines.forEach((l, i) => {
  if (l.includes('CREATE TABLE IF NOT EXISTS public.tracks') || l.includes('public.tracks FOR INSERT') || l.includes('public.tracks FOR DELETE')) {
    console.log(`${i+1}: ${l}`);
  }
});
