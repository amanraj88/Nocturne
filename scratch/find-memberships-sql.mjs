import fs from 'fs';
const sql = fs.readFileSync('supabase/migrations/20261111_init.sql', 'utf8');
const lines = sql.split('\n');
lines.forEach((l, i) => {
  if (l.includes('room_memberships')) {
    console.log(`${i+1}: ${l}`);
  }
});
