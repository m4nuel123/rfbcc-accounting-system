import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const mod = require('./_bundle.cjs');
const app = mod.default || mod;

export default function handler(req, res) {
  try {
    return app(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Serverless function error',
      })
    );
  }
}
