import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const propiedades = sqliteTable('propiedades', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  titulo: text('titulo').notNull(),
  precio: text('precio').notNull(),
  ubicacion: text('ubicacion').notNull(),
  transaccion: text('transaccion').notNull(), // 'venta' | 'renta'
  tipo: text('tipo').notNull(), // 'casa' | 'terreno' | 'depto' | 'local'
  imagen: text('imagen').notNull(), // Miniatura principal
  detalles: text('detalles'),

  // Campos de administración y ubicación
  contacto: text('contacto'),
  imagenes: text('imagenes', { mode: 'json' }), // Almacena array JSON de URLs de R2
  moneda: text('moneda').default('MXN'), // 'MXN' | 'USD'
  estado: text('estado'),
  municipio: text('municipio'),

  // Características del inmueble
  habitaciones: integer('habitaciones'),
  banos: integer('banos'),
  metrosConstruccion: integer('metros_construccion'),
  metrosTerreno: integer('metros_terreno'),
  servicios: integer('servicios', { mode: 'boolean' }).default(false),
  tieneGarage: integer('tiene_garage', { mode: 'boolean' }).default(false),
  tienePatio: integer('tiene_patio', { mode: 'boolean' }).default(false),
  estacionamiento: text('estacionamiento'),

  // Marcas de tiempo
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`).notNull(),
});

export const mensajes = sqliteTable('mensajes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  telefono: text('telefono').notNull(),
  correo: text('correo').notNull(),
  servicio: text('servicio'),
  ubicacion: text('ubicacion').notNull(),
  mensaje: text('mensaje').notNull(),

  // Marcas de tiempo
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`).notNull(),
});

