import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const mod = require('../.next/server/pages/api/rooms.js');
console.log('Exported keys:', Object.keys(mod));
console.log('mod type:', typeof mod, 'mod.default type:', typeof mod.default);
