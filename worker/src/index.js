import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { propiedadesRouter } from './routes/propiedades.js';
import { mensajesRouter } from './routes/mensajes.js';

const app = new Hono();

// ── CORS ──
// Permite peticiones desde cualquier origen (Pages en *.pages.dev o dominio custom).
// Cuando el dominio esté configurado con routes, se puede restringir a 'grupocameci.com'.
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

// ── Montar rutas de la API ──
app.route('/api/propiedades', propiedadesRouter);
app.route('/api/mensajes', mensajesRouter);

// ── Health check ──
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 para rutas API no encontradas ──
app.all('/api/*', (c) => {
  return c.json({ message: 'Ruta no encontrada' }, 404);
});

export default app;
