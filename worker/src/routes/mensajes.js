import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { getDb, mensajes } from '../db/index.js';
import { sendNotificationEmail, sendAutoReplyEmail } from '../email.js';

export const mensajesRouter = new Hono();

// ── Helper: formatear mensaje con retrocompatibilidad (_id) ──
function formatMensaje(m) {
  if (!m) return null;
  return {
    ...m,
    _id: m.id.toString(),
  };
}

// ════════════════════════════════════════════════════════════════════════════
// POST /api/mensajes — Crear mensaje de contacto + enviar emails
// ════════════════════════════════════════════════════════════════════════════
mensajesRouter.post('/', async (c) => {
  try {
    const { nombre, telefono, correo, servicio, ubicacion, mensaje } = await c.req.json();

    // Validación
    if (!nombre || !telefono || !correo || !ubicacion || !mensaje) {
      return c.json({ message: 'Todos los campos requeridos deben estar completos.' }, 400);
    }

    const db = getDb(c.env.DB);
    const [nuevoMensaje] = await db.insert(mensajes).values({
      nombre,
      telefono,
      correo,
      servicio: servicio || '',
      ubicacion,
      mensaje,
    }).returning();

    // Enviar emails de forma asíncrona (no bloquea si Resend falla)
    try {
      await sendNotificationEmail(c.env, { nombre, telefono, correo, servicio, ubicacion, mensaje });
      await sendAutoReplyEmail(c.env, { nombre, correo, servicio });
    } catch (emailError) {
      console.error('Error al enviar correo:', emailError);
    }

    return c.json({
      message: 'Mensaje enviado exitosamente',
      mensaje: formatMensaje(nuevoMensaje),
    }, 201);
  } catch (error) {
    console.error('Error al crear mensaje:', error);
    return c.json({ message: 'Error al enviar el mensaje', error: error.message }, 500);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// GET /api/mensajes — Listar todos los mensajes (más recientes primero)
// ════════════════════════════════════════════════════════════════════════════
mensajesRouter.get('/', async (c) => {
  try {
    const db = getDb(c.env.DB);
    const rows = await db.select().from(mensajes).orderBy(desc(mensajes.createdAt)).all();
    return c.json(rows.map(formatMensaje));
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    return c.json({ message: 'Error al obtener los mensajes', error: error.message }, 500);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// DELETE /api/mensajes/:id — Eliminar un mensaje
// ════════════════════════════════════════════════════════════════════════════
mensajesRouter.delete('/:id', async (c) => {
  try {
    const idParam = c.req.param('id');
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return c.json({ message: 'ID de mensaje inválido' }, 400);
    }

    const db = getDb(c.env.DB);
    const [deleted] = await db.delete(mensajes).where(eq(mensajes.id, id)).returning();

    if (!deleted) {
      return c.json({ message: 'Mensaje no encontrado' }, 404);
    }

    return c.json({ message: 'Mensaje eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar mensaje:', error);
    return c.json({ message: 'Error al eliminar el mensaje', error: error.message }, 500);
  }
});
