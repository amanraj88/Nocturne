import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const rel = specifier.slice(2);
    const abs = path.resolve(process.cwd(), 'src', rel);
    const candidates = [abs + '.ts', abs + '.tsx', path.join(abs, 'index.ts'), abs];
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        return nextResolve(pathToFileURL(c).href, context);
      }
    }
  }
  return nextResolve(specifier, context);
}
