import fs from 'fs';
const content = fs.readFileSync('src/context/LoungeContext.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('/api/rooms')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
