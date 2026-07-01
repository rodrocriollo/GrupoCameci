import { Hono } from 'hono';
import { getCollection, ObjectId } from '../db.js';

export const propiedadesRouter = new Hono();

// ── Colección en MongoDB (creada por Mongoose como 'propiedads') ──
const COLLECTION = 'propiedads';

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
  if (val === undefined || val === null || val === '') return undefined;
  const n = parseInt(val, 10);
  return isNaN(n) ? undefined : n;
}

// ════════════════════════════════════════════════════════════════════════════
// GET /api/propiedades — Listar propiedades con filtros opcionales
// ════════════════════════════════════════════════════════════════════════════
propiedadesRouter.get('/', async (c) => {
  try {
    const { transaccion, tipo } = c.req.query();
    const query = {};

    if (transaccion && transaccion !== 'all') {
      query.transaccion = transaccion;
    }
    if (tipo && tipo !== 'all') {
      query.tipo = tipo;
    }

    const collection = await getCollection(c.env, COLLECTION);
    const propiedades = await collection.find(query).toArray();
    return c.json(propiedades);
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

    const now = new Date();
    const nuevaPropiedad = {
      titulo: body.titulo,
      precio: body.precio,
      ubicacion: body.ubicacion,
      estado: body.estado,
      municipio: body.municipio,
      transaccion: body.transaccion,
      tipo: body.tipo,
      contacto: body.contacto,
      detalles: body.detalles || undefined,
      imagen: selectedImagen,
      imagenes: imageUrls,
      habitaciones: parseOptionalInt(body.habitaciones),
      banos: parseOptionalInt(body.banos),
      metrosConstruccion: parseOptionalInt(body.metrosConstruccion),
      metrosTerreno: parseOptionalInt(body.metrosTerreno),
      servicios: parseBool(body.servicios),
      tieneGarage: parseBool(body.tieneGarage),
      tienePatio: parseBool(body.tienePatio),
      estacionamiento: body.estacionamiento || undefined,
      createdAt: now,
      updatedAt: now,
    };

    // Solo agregar moneda en ventas
    if (body.transaccion === 'venta') {
      nuevaPropiedad.moneda = body.moneda || 'MXN';
    }

    // Limpiar campos undefined para no almacenarlos
    Object.keys(nuevaPropiedad).forEach(key => {
      if (nuevaPropiedad[key] === undefined) delete nuevaPropiedad[key];
    });

    const collection = await getCollection(c.env, COLLECTION);
    const result = await collection.insertOne(nuevaPropiedad);

    return c.json({
      message: 'Propiedad creada exitosamente',
      propiedad: { ...nuevaPropiedad, _id: result.insertedId },
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
    const id = c.req.param('id');
    const collection = await getCollection(c.env, COLLECTION);
    const propiedad = await collection.findOne({ _id: new ObjectId(id) });

    if (!propiedad) {
      return c.json({ message: 'Propiedad no encontrada' }, 404);
    }

    return c.json(propiedad);
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
    const id = c.req.param('id');
    const body = await c.req.parseBody({ all: true });

    const updateData = {
      titulo: body.titulo,
      precio: body.precio,
      ubicacion: body.ubicacion,
      estado: body.estado,
      municipio: body.municipio,
      transaccion: body.transaccion,
      tipo: body.tipo,
      contacto: body.contacto,
      detalles: body.detalles || undefined,
      habitaciones: parseOptionalInt(body.habitaciones),
      banos: parseOptionalInt(body.banos),
      metrosConstruccion: parseOptionalInt(body.metrosConstruccion),
      metrosTerreno: parseOptionalInt(body.metrosTerreno),
      servicios: parseBool(body.servicios),
      tieneGarage: parseBool(body.tieneGarage),
      tienePatio: parseBool(body.tienePatio),
      estacionamiento: body.estacionamiento || undefined,
      updatedAt: new Date(),
    };

    // Solo agregar moneda en ventas
    if (body.transaccion === 'venta') {
      updateData.moneda = body.moneda || 'MXN';
    }

    // ── Gestión de fotos ──
    const fotos = extractFiles(body, 'fotos');
    let newImageUrls = [];
    if (fotos.length > 0) {
      newImageUrls = await Promise.all(fotos.map(f => uploadToR2(c.env, f)));
    }

    // Parsear imágenes existentes a conservar
    if (body.imagenes !== undefined || newImageUrls.length > 0) {
      let imagenesExistentes = [];
      if (body.imagenes) {
        try {
          imagenesExistentes = typeof body.imagenes === 'string'
            ? JSON.parse(body.imagenes)
            : body.imagenes;
        } catch (e) {
          // Fallback: separar por comas
          imagenesExistentes = body.imagenes.split(',').map(s => s.trim()).filter(Boolean);
        }
      }

      // Combinar existentes + nuevas
      const todasLasImagenes = [...imagenesExistentes, ...newImageUrls];
      updateData.imagenes = todasLasImagenes;

      // Determinar miniatura principal
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

    // Limpiar campos undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const collection = await getCollection(c.env, COLLECTION);
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return c.json({ message: 'Propiedad no encontrada' }, 404);
    }

    return c.json({ message: 'Propiedad actualizada exitosamente', propiedad: result });
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
    const id = c.req.param('id');
    const collection = await getCollection(c.env, COLLECTION);
    const result = await collection.findOneAndDelete({ _id: new ObjectId(id) });

    if (!result) {
      return c.json({ message: 'Propiedad no encontrada' }, 404);
    }

    return c.json({ message: 'Propiedad eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar propiedad:', error);
    return c.json({ message: 'Error al eliminar la propiedad', error: error.message }, 500);
  }
});
