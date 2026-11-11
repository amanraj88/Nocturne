import fs from 'fs';
const design = fs.readFileSync('C:/Users/major/.gemini/antigravity/brain/f4b92a27-4f4d-489b-b69e-f37ac6572507/nocturne_supabase_migration_design.md', 'utf8');
const lines = design.split('\n');
lines.forEach((l, i) => {
  if (l.toLowerCase().includes('broadcast') || l.toLowerCase().includes('presence')) {
    console.log(`${i+1}: ${l}`);
  }
});
