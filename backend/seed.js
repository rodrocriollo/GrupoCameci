require('dotenv').config();
const mongoose = require('mongoose');
const Propiedad = require('./models/Propiedad');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cameci';

const propiedades = [
    // Casas Venta
    {
        titulo: 'Villa del Sol',
        precio: '$3,200,000',
        ubicacion: 'Fraccionamiento Las Lomas',
        transaccion: 'venta',
        tipo: 'casa',
        imagen: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80',
        habitaciones: 4,
        banos: 3,
        metros: 250
    },
    {
        titulo: 'Residencia Moderna',
        precio: '$4,500,000',
        ubicacion: 'Zona Norte',
        transaccion: 'venta',
        tipo: 'casa',
        imagen: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80',
        habitaciones: 3,
        banos: 2,
        metros: 180
    },
    // Departamentos Venta
    {
        titulo: 'Estudio Panorámico',
        precio: '$2,500,000',
        ubicacion: 'Distrito Financiero',
        transaccion: 'venta',
        tipo: 'depto',
        imagen: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
        habitaciones: 2,
        banos: 2,
        metros: 85
    },
    {
        titulo: 'Penthouse Centro',
        precio: '$5,100,000',
        ubicacion: 'Centro Histórico',
        transaccion: 'venta',
        tipo: 'depto',
        imagen: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=600&q=80',
        habitaciones: 3,
        banos: 2,
        metros: 120
    },
    // Terrenos Venta
    {
        titulo: 'Lote Residencial El Sol',
        precio: '$850,000',
        ubicacion: 'Fraccionamiento Privado',
        transaccion: 'venta',
        tipo: 'terreno',
        imagen: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=600&q=80',
        metrosTotales: 200,
        servicios: true
    },
    {
        titulo: 'Terreno Comercial',
        precio: '$1,200,000',
        ubicacion: 'Avenida Principal',
        transaccion: 'venta',
        tipo: 'terreno',
        imagen: 'https://images.unsplash.com/photo-1524813686514-a57563d77965?auto=format&fit=crop&w=600&q=80',
        metrosTotales: 400,
        servicios: true
    },
    // Rentas
    {
        titulo: 'Casa Amueblada Céntrica',
        precio: '$15,000',
        ubicacion: 'Colonia Centro',
        transaccion: 'renta',
        tipo: 'casa',
        imagen: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=600&q=80',
        habitaciones: 2,
        banos: 1,
        metros: 100
    },
    {
        titulo: 'Residencia Familiar',
        precio: '$22,000',
        ubicacion: 'Privada Los Pinos',
        transaccion: 'renta',
        tipo: 'casa',
        imagen: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=600&q=80',
        habitaciones: 3,
        banos: 2,
        metros: 150
    },
    {
        titulo: 'Departamento Ejecutivo',
        precio: '$18,500',
        ubicacion: 'Torre Empresarial',
        transaccion: 'renta',
        tipo: 'depto',
        imagen: 'https://images.unsplash.com/photo-1502672260266-1c1de2d966ce?auto=format&fit=crop&w=600&q=80',
        habitaciones: 1,
        banos: 1,
        metros: 65
    },
    {
        titulo: 'Loft con Terraza',
        precio: '$12,000',
        ubicacion: 'Barrio Bohemio',
        transaccion: 'renta',
        tipo: 'depto',
        imagen: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=600&q=80',
        habitaciones: 2,
        banos: 1,
        metros: 80
    },
    {
        titulo: 'Lote Comercial',
        precio: '$8,000',
        ubicacion: 'Zona Industrial',
        transaccion: 'renta',
        tipo: 'terreno',
        imagen: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
        metrosTotales: 500,
        servicios: true
    },
    {
        titulo: 'Terreno para Bodega',
        precio: '$14,000',
        ubicacion: 'Parque Logístico',
        transaccion: 'renta',
        tipo: 'terreno',
        imagen: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
        metrosTotales: 1000,
        servicios: true
    }
];

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Conectado a MongoDB. Insertando datos...');
        await Propiedad.deleteMany({});
        await Propiedad.insertMany(propiedades);
        console.log('Datos insertados exitosamente.');
        mongoose.connection.close();
    })
    .catch(err => {
        console.error('Error al conectar a MongoDB:', err);
        process.exit(1);
    });
