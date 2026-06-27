require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const Propiedad = require('./models/Propiedad');
const Mensaje = require('./models/Mensaje');
const nodemailer = require('nodemailer');
const { uploadFileToR2 } = require('./services/r2Service');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'ejemplo.cameci@gmail.com',
        pass: process.env.EMAIL_PASS || 'tu_contraseña_de_aplicacion'
    }
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const PORT = process.env.PORT || 3000;

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://admin_cameci:5ZslKfgUHdLWJo9S@camecidb.7awxyeg.mongodb.net/cameci?retryWrites=true&w=majority&appName=CameciDB';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ ¡Conexión exitosa a MongoDB Atlas!');
        console.log('📂 Base de datos activa: cameci');
    })
    .catch(err => {
        console.error('❌ Error al conectar a MongoDB:', err.message);
        if (err.message.includes('auth')) {
            console.log('👉 Tip: El usuario o contraseña no coinciden. Revisa que no haya espacios en blanco.');
        }
    });


// Ruta principal para obtener propiedades con filtros
app.get('/api/propiedades', async (req, res) => {
    try {
        const { transaccion, tipo } = req.query;
        let query = {};

        if (transaccion && transaccion !== 'all') {
            query.transaccion = transaccion;
        }

        if (tipo && tipo !== 'all') {
            query.tipo = tipo;
        }

        const propiedades = await Propiedad.find(query);
        res.json(propiedades);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener propiedades', error });
    }
});

// Ruta para crear una nueva propiedad con imágenes
app.post('/api/propiedades', upload.array('fotos', 10), async (req, res) => {
    try {
        const { titulo, precio, ubicacion, estado, municipio, transaccion, tipo, contacto, habitaciones, banos, metrosConstruccion, metrosTerreno, servicios, detalles, moneda, tieneGarage, tienePatio, estacionamiento } = req.body;

        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file => uploadFileToR2(file.buffer, file.originalname));
            imageUrls = await Promise.all(uploadPromises);
        }

        // Determinar miniatura principal elegida
        let selectedImagen = 'https://via.placeholder.com/600';
        if (imageUrls.length > 0) {
            selectedImagen = imageUrls[0];
            if (req.body.imagen) {
                if (req.body.imagen.startsWith('index_')) {
                    const index = parseInt(req.body.imagen.split('_')[1], 10);
                    if (!isNaN(index) && index >= 0 && index < imageUrls.length) {
                        selectedImagen = imageUrls[index];
                    }
                } else if (imageUrls.includes(req.body.imagen)) {
                    selectedImagen = req.body.imagen;
                }
            }
        }

        const nuevaPropiedad = new Propiedad({
            titulo,
            precio,
            ubicacion,
            estado,
            municipio,
            transaccion,
            tipo,
            moneda: transaccion === 'venta' ? (moneda || 'MXN') : undefined,
            contacto,
            detalles,
            imagen: selectedImagen,
            imagenes: imageUrls,
            habitaciones: habitaciones ? parseInt(habitaciones) : undefined,
            banos: banos ? parseInt(banos) : undefined,
            metrosConstruccion: metrosConstruccion ? parseInt(metrosConstruccion) : undefined,
            metrosTerreno: metrosTerreno ? parseInt(metrosTerreno) : undefined,
            servicios: servicios === 'on' || servicios === true || servicios === 'true',
            tieneGarage: tieneGarage === 'on' || tieneGarage === true || tieneGarage === 'true',
            tienePatio: tienePatio === 'on' || tienePatio === true || tienePatio === 'true',
            estacionamiento
        });

        await nuevaPropiedad.save();
        res.status(201).json({ message: 'Propiedad creada exitosamente', propiedad: nuevaPropiedad });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear la propiedad', error });
    }
});

// Ruta para obtener una propiedad por ID
app.get('/api/propiedades/:id', async (req, res) => {
    try {
        const propiedad = await Propiedad.findById(req.params.id);
        if (!propiedad) return res.status(404).json({ message: 'Propiedad no encontrada' });
        res.json(propiedad);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la propiedad', error });
    }
});

// Ruta para actualizar una propiedad (con opción de reemplazar imágenes)
app.put('/api/propiedades/:id', upload.array('fotos', 10), async (req, res) => {
    try {
        const { titulo, precio, ubicacion, estado, municipio, transaccion, tipo, contacto, habitaciones, banos, metrosConstruccion, metrosTerreno, servicios, detalles, moneda, tieneGarage, tienePatio, estacionamiento } = req.body;

        const updateData = {
            detalles,
            titulo,
            precio,
            ubicacion,
            estado,
            municipio,
            transaccion,
            tipo,
            moneda: transaccion === 'venta' ? (moneda || 'MXN') : undefined,
            contacto,
            habitaciones: habitaciones ? parseInt(habitaciones) : undefined,
            banos: banos ? parseInt(banos) : undefined,
            metrosConstruccion: metrosConstruccion ? parseInt(metrosConstruccion) : undefined,
            metrosTerreno: metrosTerreno ? parseInt(metrosTerreno) : undefined,
            servicios: servicios === 'on' || servicios === true || servicios === 'true',
            tieneGarage: tieneGarage === 'on' || tieneGarage === true || tieneGarage === 'true',
            tienePatio: tienePatio === 'on' || tienePatio === true || tienePatio === 'true',
            estacionamiento
        };

        // Obtener fotos nuevas subidas
        let newImageUrls = [];
        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file => uploadFileToR2(file.buffer, file.originalname));
            newImageUrls = await Promise.all(uploadPromises);
        }

        // Si se envió la lista de imagenes a mantener o se subieron nuevas fotos
        if (req.body.imagenes !== undefined || newImageUrls.length > 0) {
            let imagenesExistentes = [];
            if (req.body.imagenes) {
                try {
                    imagenesExistentes = typeof req.body.imagenes === 'string'
                        ? JSON.parse(req.body.imagenes)
                        : req.body.imagenes;
                } catch (e) {
                    imagenesExistentes = req.body.imagenes.split(',').map(s => s.trim()).filter(Boolean);
                }
            }

            // Combinar las imagenes existentes que se quedan + las nuevas subidas
            const todasLasImagenes = [...imagenesExistentes, ...newImageUrls];
            updateData.imagenes = todasLasImagenes;

            // Determinar miniatura principal
            let selectedImagen = todasLasImagenes[0] || 'https://via.placeholder.com/600';
            if (req.body.imagen) {
                if (req.body.imagen.startsWith('index_')) {
                    const index = parseInt(req.body.imagen.split('_')[1], 10);
                    if (!isNaN(index) && index >= 0 && index < newImageUrls.length) {
                        selectedImagen = newImageUrls[index];
                    }
                } else if (todasLasImagenes.includes(req.body.imagen)) {
                    selectedImagen = req.body.imagen;
                }
            }
            updateData.imagen = selectedImagen;
        }

        const propiedad = await Propiedad.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!propiedad) return res.status(404).json({ message: 'Propiedad no encontrada' });
        res.json({ message: 'Propiedad actualizada exitosamente', propiedad });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar la propiedad', error });
    }
});

// Ruta para eliminar una propiedad
app.delete('/api/propiedades/:id', async (req, res) => {
    try {
        const propiedad = await Propiedad.findByIdAndDelete(req.params.id);
        if (!propiedad) return res.status(404).json({ message: 'Propiedad no encontrada' });
        res.json({ message: 'Propiedad eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la propiedad', error });
    }
});

// ── RUTAS PARA MENSAJES DE CONTACTO ──

// Ruta para crear un mensaje
app.post('/api/mensajes', async (req, res) => {
    try {
        const { nombre, telefono, correo, servicio, ubicacion, mensaje } = req.body;
        if (!nombre || !telefono || !correo || !ubicacion || !mensaje) {
            return res.status(400).json({ message: 'Todos los campos requeridos deben estar completos.' });
        }
        const nuevoMensaje = new Mensaje({ nombre, telefono, correo, servicio, ubicacion, mensaje });
        await nuevoMensaje.save();

        const mailOptions = {
            from: process.env.EMAIL_USER || 'ejemplo.cameci@gmail.com',
            to: 'contacto.grupocameci@gmail.com',
            subject: `🌐 Nueva Consulta Web: ${servicio || 'Sin especificar'} - ${nombre}`,
            text: `Ha recibido un nuevo mensaje desde el formulario de contacto del sitio web. A continuación, se detallan los datos del interesado:

Cliente: ${nombre}

Teléfono: ${telefono}

Correo: ${correo}

Ubicación de la propiedad: ${ubicacion}

SERVICIO SOLICITADO: > 📌 ${servicio || 'Sin especificar'}

Mensaje o comentarios:
"${mensaje}"

Este correo fue generado automáticamente desde el formulario de contacto de Grupo CAMECI.`,
            html: `
<p>Ha recibido un nuevo mensaje desde el formulario de contacto del sitio web. A continuación, se detallan los datos del interesado:</p>
<br>
<p><strong>Cliente:</strong> ${nombre}</p>
<p><strong>Teléfono:</strong> <a href="tel:${telefono}">${telefono}</a></p>
<p><strong>Correo:</strong> <a href="mailto:${correo}">${correo}</a></p>
<p><strong>Ubicación de la propiedad:</strong> ${ubicacion}</p>
<p><strong>SERVICIO SOLICITADO:</strong> &gt; 📌 ${servicio || 'Sin especificar'}</p>
<p><strong>Mensaje o comentarios:</strong><br>"${mensaje}"</p>
<br>
<p><small>Este correo fue generado automáticamente desde el formulario de contacto de Grupo CAMECI.</small></p>
            `
        };

        const autoReplyOptions = {
            from: process.env.EMAIL_USER || 'ejemplo.cameci@gmail.com',
            to: correo,
            subject: 'Hemos recibido tu solicitud - Grupo CAMECI',
            text: `¡Hola, ${nombre}! Hemos recibido tu solicitud sobre ${servicio || 'nuestros servicios'} en Grupo CAMECI. Uno de nuestros peritos certificados o asesores inmobiliarios se pondrá en contacto contigo en un lapso no mayor a 24 horas. Gracias por tu confianza.`,
            html: `
<p>¡Hola, <strong>${nombre}</strong>!</p>
<p>Hemos recibido tu solicitud sobre <strong>${servicio || 'nuestros servicios'}</strong> en Grupo CAMECI.</p>
<p>Uno de nuestros peritos certificados o asesores inmobiliarios se pondrá en contacto contigo en un lapso no mayor a 24 horas.</p>
<br>
<p>Gracias por tu confianza,</p>
<p><strong>Grupo CAMECI</strong></p>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            await transporter.sendMail(autoReplyOptions);
        } catch (emailError) {
            console.error('Error al enviar correo:', emailError);
        }

        res.status(201).json({ message: 'Mensaje enviado exitosamente', mensaje: nuevoMensaje });
    } catch (error) {
        res.status(500).json({ message: 'Error al enviar el mensaje', error });
    }
});

// Ruta para obtener todos los mensajes (más recientes primero)
app.get('/api/mensajes', async (req, res) => {
    try {
        const mensajes = await Mensaje.find().sort({ createdAt: -1 });
        res.json(mensajes);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los mensajes', error });
    }
});

// Ruta para eliminar un mensaje
app.delete('/api/mensajes/:id', async (req, res) => {
    try {
        const mensaje = await Mensaje.findByIdAndDelete(req.params.id);
        if (!mensaje) return res.status(404).json({ message: 'Mensaje no encontrado' });
        res.json({ message: 'Mensaje eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el mensaje', error });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
