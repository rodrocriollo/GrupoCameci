import { Hono } from 'hono';
import { getCollection, ObjectId } from '../db.js';
import { sendNotificationEmail, sendAutoReplyEmail } from '../email.js';

export const mensajesRouter = new Hono();

// ── Colección en MongoDB (creada por Mongoose como 'mensajes') ──
const COLLECTION = 'mensajes';

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

    const now = new Date();
    const nuevoMensaje = {
      nombre,
      telefono,
      correo,
      servicio: servicio || '',
      ubicacion,
      mensaje,
      createdAt: now,
      updatedAt: now,
    };

    const collection = await getCollection(c.env, COLLECTION);
    const result = await collection.insertOne(nuevoMensaje);
    nuevoMensaje._id = result.insertedId;

    // Enviar emails de forma asíncrona (no bloquear la respuesta si fallan)
    try {
      await sendNotificationEmail(c.env, { nombre, telefono, correo, servicio, ubicacion, mensaje });
      await sendAutoReplyEmail(c.env, { nombre, correo, servicio });
    } catch (emailError) {
      console.error('Error al enviar correo:', emailError);
    }

    return c.json({ message: 'Mensaje enviado exitosamente', mensaje: nuevoMensaje }, 201);
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
    const collection = await getCollection(c.env, COLLECTION);
    const mensajes = await collection.find().sort({ createdAt: -1 }).toArray();
    return c.json(mensajes);
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
    const id = c.req.param('id');
    const collection = await getCollection(c.env, COLLECTION);
    const result = await collection.findOneAndDelete({ _id: new ObjectId(id) });

    if (!result) {
      return c.json({ message: 'Mensaje no encontrado' }, 404);
    }

    return c.json({ message: 'Mensaje eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar mensaje:', error);
    return c.json({ message: 'Error al eliminar el mensaje', error: error.message }, 500);
  }
});
