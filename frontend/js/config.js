/**
 * Configuración global de la API.
 * 
 * INSTRUCCIONES:
 * ─────────────
 * 1. Después del primer deploy del Worker, actualiza API_BASE con la URL 
 *    que devuelve `npx wrangler deploy` (ej. 'https://grupocameci.xxx.workers.dev')
 * 
 * 2. Cuando configures tu dominio grupocameci.com en Cloudflare DNS y actives
 *    la ruta del Worker (routes en wrangler.toml), cambia API_BASE a '' (vacío)
 *    para usar rutas relativas.
 */
window.API_BASE = '';
// ↑ Dejar vacío '' cuando el dominio esté configurado con Workers routing.
// ↑ Poner la URL completa del Worker (ej. 'https://grupocameci.xxx.workers.dev') 
//   mientras se use workers.dev sin dominio propio.
