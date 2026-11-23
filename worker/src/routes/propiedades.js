import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { getDb, propiedades } from '../db/index.js';

export const propiedadesRouter = new Hono();

// ── Helper: subir archivo a R2 ──
async function uploadToR2(env, file) {
  const ext = (file.name || 'image.jpg').split('.').pop() || 'jpg';
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const key = `${uniqueSuffix}.${ext}`;

  await env.R2_BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || 'image/jpeg' },
  });

  return `${env.R2_PUBLIC_URL}/${key}`;
}

// ── Helper: extraer archivos del body multipart ──
function extractFiles(body, fieldName) {
  let files = body[fieldName] || [];
  if (!Array.isArray(files)) files = [files];
  return files.filter(f => f instanceof File);
}

// ── Helper: parsear booleano desde string de formulario ──
function parseBool(val) {
  return val === 'on' || val === true || val === 'true';
}

// ── Helper: parsear entero opcional ──
function parseOptionalInt(val) {
  if (val === undefined || val === null || val === '') return null;
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

// ── Helper: formatear salida para garantizar retrocompatibilidad con frontend (_id) ──
function formatPropiedad(p) {
  if (!p) return null;
  let imgs = [];
  if (Array.isArray(p.imagenes)) {
    imgs = p.imagenes;
  } else if (typeof p.imagenes === 'string') {
    try {
      imgs = JSON.parse(p.imagenes);
    } catch {
      imgs = [];
    }
  }

  return {
    ...p,
    _id: p.id.toString(),
    imagenes: imgs,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// GET /api/propiedades — Listar propiedades con filtros opcionales
// ════════════════════════════════════════════════════════════════════════════
propiedadesRouter.get('/', async (c) => {
  try {
    const { transaccion, tipo } = c.req.query();
    const conditions = [];

    if (transaccion && transaccion !== 'all') {
      conditions.push(eq(propiedades.transaccion, transaccion));
    }
    if (tipo && tipo !== 'all') {
      conditions.push(eq(propiedades.tipo, tipo));
    }

    const db = getDb(c.env.DB);
    let query = db.select().from(propiedades).orderBy(desc(propiedades.createdAt));
    if (conditions.length > 0) {
      query = db.select().from(propiedades).where(and(...conditions)).orderBy(desc(propiedades.createdAt));
    }

    const rows = await query.all();
    return c.json(rows.map(formatPropiedad));
  } catch (error) {
    console.error('Error al obtener propiedades:', error);
    return c.json({ message: 'Error al obtener propiedades', error: error.message }, 500);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// POST /api/propiedades — Crear nueva propiedad con imágenes
// ════════════════════════════════════════════════════════════════════════════
propiedadesRouter.post('/', async (c) => {
  try {
    const body = await c.req.parseBody({ all: true });

    // Subir fotos a R2
    const fotos = extractFiles(body, 'fotos');
    let imageUrls = [];
    if (fotos.length > 0) {
      imageUrls = await Promise.all(fotos.map(f => uploadToR2(c.env, f)));
    }

    // Determinar miniatura principal
    let selectedImagen = 'https://via.placeholder.com/600';
    if (imageUrls.length > 0) {
      selectedImagen = imageUrls[0];
      if (body.imagen) {
        if (typeof body.imagen === 'string' && body.imagen.startsWith('index_')) {
          const index = parseInt(body.imagen.split('_')[1], 10);
          if (!isNaN(index) && index >= 0 && index < imageUrls.length) {
            selectedImagen = imageUrls[index];
          }
        } else if (imageUrls.includes(body.imagen)) {
          selectedImagen = body.imagen;
        }
      }
    }

    const nuevaPropiedadData = {
      titulo: body.titulo,
      precio: body.precio,
      ubicacion: body.ubicacion,
      estado: body.estado || null,
      municipio: body.municipio || null,
      transaccion: body.transaccion,
      tipo: body.tipo,
      contacto: body.contacto || null,
      detalles: body.detalles || null,
      imagen: selectedImagen,
      imagenes: imageUrls,
      moneda: body.transaccion === 'venta' ? (body.moneda || 'MXN') : 'MXN',
      habitaciones: parseOptionalInt(body.habitaciones),
      banos: parseOptionalInt(body.banos),
      metrosConstruccion: parseOptionalInt(body.metrosConstruccion),
      metrosTerreno: parseOptionalInt(body.metrosTerreno),
      servicios: parseBool(body.servicios),
      tieneGarage: parseBool(body.tieneGarage),
      tienePatio: parseBool(body.tienePatio),
      estacionamiento: body.estacionamiento || null,
    };

    const db = getDb(c.env.DB);
    const [nuevaPropiedad] = await db.insert(propiedades).values(nuevaPropiedadData).returning();

    return c.json({
      message: 'Propiedad creada exitosamente',
      propiedad: formatPropiedad(nuevaPropiedad),
    }, 201);
  } catch (error) {
    console.error('Error al crear propiedad:', error);
    return c.json({ message: 'Error al crear la propiedad', error: error.message }, 500);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// GET /api/propiedades/:id — Obtener propiedad por ID
// ════════════════════════════════════════════════════════════════════════════
propiedadesRouter.get('/:id', async (c) => {
  try {
    const idParam = c.req.param('id');
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return c.json({ message: 'ID de propiedad inválido' }, 400);
    }

    const db = getDb(c.env.DB);
    const [propiedad] = await db.select().from(propiedades).where(eq(propiedades.id, id)).limit(1);

    if (!propiedad) {
      return c.json({ message: 'Propiedad no encontrada' }, 404);
    }

    return c.json(formatPropiedad(propiedad));
  } catch (error) {
    console.error('Error al obtener propiedad:', error);
    return c.json({ message: 'Error al obtener la propiedad', error: error.message }, 500);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// PUT /api/propiedades/:id — Actualizar propiedad (con gestión de imágenes)
// ════════════════════════════════════════════════════════════════════════════
propiedadesRouter.put('/:id', async (c) => {
  try {
    const idParam = c.req.param('id');
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return c.json({ message: 'ID de propiedad inválido' }, 400);
    }

    const body = await c.req.parseBody({ all: true });

    const updateData = {
      titulo: body.titulo,
      precio: body.precio,
      ubicacion: body.ubicacion,
      estado: body.estado || null,
      municipio: body.municipio || null,
      transaccion: body.transaccion,
      tipo: body.tipo,
      contacto: body.contacto || null,
      detalles: body.detalles || null,
      habitaciones: parseOptionalInt(body.habitaciones),
      banos: parseOptionalInt(body.banos),
      metrosConstruccion: parseOptionalInt(body.metrosConstruccion),
      metrosTerreno: parseOptionalInt(body.metrosTerreno),
      servicios: parseBool(body.servicios),
      tieneGarage: parseBool(body.tieneGarage),
      tienePatio: parseBool(body.tienePatio),
      estacionamiento: body.estacionamiento || null,
      updatedAt: new Date().toISOString(),
    };

    if (body.transaccion === 'venta') {
      updateData.moneda = body.moneda || 'MXN';
    }

    // ── Gestión de fotos ──
    const fotos = extractFiles(body, 'fotos');
    let newImageUrls = [];
    if (fotos.length > 0) {
      newImageUrls = await Promise.all(fotos.map(f => uploadToR2(c.env, f)));
    }

    if (body.imagenes !== undefined || newImageUrls.length > 0) {
      let imagenesExistentes = [];
      if (body.imagenes) {
        try {
          imagenesExistentes = typeof body.imagenes === 'string'
            ? JSON.parse(body.imagenes)
            : body.imagenes;
        } catch {
          imagenesExistentes = body.imagenes.split(',').map(s => s.trim()).filter(Boolean);
        }
      }

      const todasLasImagenes = [...imagenesExistentes, ...newImageUrls];
      updateData.imagenes = todasLasImagenes;

      let selectedImagen = todasLasImagenes[0] || 'https://via.placeholder.com/600';
      if (body.imagen) {
        if (typeof body.imagen === 'string' && body.imagen.startsWith('index_')) {
          const index = parseInt(body.imagen.split('_')[1], 10);
          if (!isNaN(index) && index >= 0 && index < newImageUrls.length) {
            selectedImagen = newImageUrls[index];
          }
        } else if (todasLasImagenes.includes(body.imagen)) {
          selectedImagen = body.imagen;
        }
      }
      updateData.imagen = selectedImagen;
    }

    const db = getDb(c.env.DB);
    const [updated] = await db.update(propiedades)
      .set(updateData)
      .where(eq(propiedades.id, id))
      .returning();

    if (!updated) {
      return c.json({ message: 'Propiedad no encontrada' }, 404);
    }

    return c.json({ message: 'Propiedad actualizada exitosamente', propiedad: formatPropiedad(updated) });
  } catch (error) {
    console.error('Error al actualizar propiedad:', error);
    return c.json({ message: 'Error al actualizar la propiedad', error: error.message }, 500);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// DELETE /api/propiedades/:id — Eliminar propiedad
// ════════════════════════════════════════════════════════════════════════════
propiedadesRouter.delete('/:id', async (c) => {
  try {
    const idParam = c.req.param('id');
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return c.json({ message: 'ID de propiedad inválido' }, 400);
    }

    const db = getDb(c.env.DB);
    const [deleted] = await db.delete(propiedades).where(eq(propiedades.id, id)).returning();

    if (!deleted) {
      return c.json({ message: 'Propiedad no encontrada' }, 404);
    }

    return c.json({ message: 'Propiedad eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar propiedad:', error);
    return c.json({ message: 'Error al eliminar la propiedad', error: error.message }, 500);
  }
});
