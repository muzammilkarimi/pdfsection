// Lets Node load app code that imports "@/lib/x" (the alias in jsconfig.json, which Next.js normally resolves).

import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      return nextResolve(pathToFileURL(resolve(`${specifier.slice(2)}.js`)).href, context);
    }
    try {
      return nextResolve(specifier, context);
    } catch (err) {
      // package subpaths written without ".js" (e.g. "regenerator-runtime/runtime") work in the bundler
      if (err?.code === 'ERR_MODULE_NOT_FOUND' && !specifier.endsWith('.js') && !specifier.startsWith('.')) {
        return nextResolve(`${specifier}.js`, context);
      }
      throw err;
    }
  },
});
