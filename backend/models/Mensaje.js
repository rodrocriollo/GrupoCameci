const mongoose = require('mongoose');

const MensajeSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    telefono: { type: String, required: true },
    correo: { type: String, required: true },
    servicio: { type: String },
    ubicacion: { type: String, required: true },
    mensaje: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Mensaje', MensajeSchema);
