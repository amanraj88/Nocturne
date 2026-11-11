import fs from 'fs';
const mock = fs.readFileSync('src/lib/mockData.ts', 'utf8');
const lines = mock.split('\n');
lines.forEach((l, i) => {
  if (l.includes('mode:')) {
    console.log(`${i+1}: ${l}`);
  }
});
