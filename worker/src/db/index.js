import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema.js';

/**
 * Obtiene la instancia de Drizzle conectada al binding D1.
 * Cero overhead de sockets/TCP, 100% nativo en el Edge.
 * 
 * @param {D1Database} d1Binding - El binding env.DB provisto por Cloudflare Workers.
 */
export function getDb(d1Binding) {
  if (!d1Binding) {
    throw new Error('El binding D1 "DB" no está disponible en env. Verifica wrangler.toml.');
  }
  return drizzle(d1Binding, { schema });
}

export * from './schema.js';

