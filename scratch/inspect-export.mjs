import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const mod = require('../.next/server/pages/api/rooms.js');
console.log('mod keys:', Object.keys(mod));
console.log('mod values:', mod);
