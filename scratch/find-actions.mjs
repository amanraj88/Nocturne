import fs from 'fs';
const lines = fs.readFileSync('src/context/LoungeContext.tsx', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes('dispatchServerAction') || l.includes('broadcastTabSync') || l.includes('/action')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
