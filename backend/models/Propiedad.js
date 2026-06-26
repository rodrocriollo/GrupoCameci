const mongoose = require('mongoose');

const PropiedadSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    precio: { type: String, required: true },
    ubicacion: { type: String, required: true },
    transaccion: { type: String, required: true, enum: ['venta', 'renta'] },
    tipo: { type: String, required: true, enum: ['casa', 'terreno', 'depto', 'local'] },
    imagen: { type: String, required: true },
    detalles: { type: String },
    
    // Campos nuevos para administrador
    contacto: { type: String },
    imagenes: [{ type: String }],
    moneda: { type: String, enum: ['MXN', 'USD'] },
    estado: { type: String },
    municipio: { type: String },
    tieneGarage: { type: Boolean },
    tienePatio: { type: Boolean },
    estacionamiento: { type: String },
    
    // Campos específicos (no requeridos en todos los tipos)
    habitaciones: { type: Number },
    banos: { type: Number },
    metros: { type: Number }, // Deprecado, usar metrosConstruccion
    metrosTotales: { type: Number }, // Deprecado, usar metrosTerreno
    metrosConstruccion: { type: Number },
    metrosTerreno: { type: Number },
    servicios: { type: Boolean }, // Usado para terreno
    tieneGarage: { type: Boolean, default: false },
    tienePatio: { type: Boolean, default: false },
    estacionamiento: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Propiedad', PropiedadSchema);
