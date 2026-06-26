export class Propiedad {
    constructor(id, titulo, precio, ubicacion, transaccion, tipo, imagen, estado, municipio, moneda) {
        this.id = id;
        this.titulo = titulo;
        this.precio = precio;
        this.ubicacion = ubicacion;
        this.transaccion = transaccion; // 'renta' o 'venta'
        this.tipo = tipo; // 'casa', 'terreno', 'depto'
        this.imagen = imagen;
        this.estado = estado;
        this.municipio = municipio;
        this.moneda = moneda; // 'MXN' o 'USD' (solo ventas)
    }

    renderCard() {
        const locationStr = this.municipio && this.estado ? `<p class="location" style="margin-top:0; color: var(--cameci-orange);"><i class="fa-solid fa-map-location-dot"></i> ${this.municipio}, ${this.estado}</p>` : '';
        return `
            <article class="property-card" data-category="${this.transaccion}" data-tipo="${this.tipo}">
                <div class="card-image">
                    <img src="${this.imagen}" alt="${this.titulo}">
                    <span class="badge ${this.transaccion === 'venta' ? 'sell' : ''}">${this.transaccion === 'venta' ? 'Venta' : 'Renta'}</span>
                </div>
                <div class="card-details">
                    <div class="price">$${parseFloat(this.precio).toLocaleString('es-MX')} ${this.transaccion === 'renta' ? '<span>/mes</span>' : ''}${this.transaccion === 'venta' && this.moneda ? '<span>' + this.moneda + '</span>' : ''}</div>
                    <h3>${this.titulo}</h3>
                    <p class="location"><i class="fa-solid fa-location-dot"></i> ${this.ubicacion}</p>
                    ${locationStr}
                    <div class="features">
                        ${this.renderFeatures()}
                    </div>
                    <a href="propiedad.html#${this.id}" target="_blank" class="btn btn-outline" style="margin-top: 1.5rem; text-align:center;">
                        Ver más detalles <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.8rem;"></i>
                    </a>
                </div>
            </article>
        `;
    }

    renderFeatures() {
        return '';
    }
}

export class Casa extends Propiedad {
    constructor(id, titulo, precio, ubicacion, transaccion, imagen, estado, municipio, habitaciones, banos, metrosConstruccion, metrosTerreno, moneda, tieneGarage, tienePatio) {
        super(id, titulo, precio, ubicacion, transaccion, 'casa', imagen, estado, municipio, moneda);
        this.habitaciones = habitaciones;
        this.banos = banos;
        this.metrosConstruccion = metrosConstruccion;
        this.metrosTerreno = metrosTerreno;
        this.tieneGarage = tieneGarage;
        this.tienePatio = tienePatio;
    }

    renderFeatures() {
        let features = '';
        if (this.metrosConstruccion) features += `<span><i class="fa-solid fa-ruler-combined"></i> ${this.metrosConstruccion}m² Const.</span>`;
        if (this.metrosTerreno) features += `<span><i class="fa-solid fa-tree"></i> ${this.metrosTerreno}m² Terr.</span>`;
        return features;
    }
}

export class Departamento extends Propiedad {
    constructor(id, titulo, precio, ubicacion, transaccion, imagen, estado, municipio, habitaciones, banos, metrosConstruccion, moneda, tieneGarage, tienePatio) {
        super(id, titulo, precio, ubicacion, transaccion, 'depto', imagen, estado, municipio, moneda);
        this.habitaciones = habitaciones;
        this.banos = banos;
        this.metrosConstruccion = metrosConstruccion;
        this.tieneGarage = tieneGarage;
        this.tienePatio = tienePatio;
    }

    renderFeatures() {
        let features = '';
        if (this.habitaciones) features += `<span><i class="fa-solid fa-bed"></i> ${this.habitaciones} Hab</span>`;
        if (this.metrosConstruccion) features += `<span><i class="fa-solid fa-ruler-combined"></i> ${this.metrosConstruccion}m² Const.</span>`;
        return features;
    }
}

export class Terreno extends Propiedad {
    constructor(id, titulo, precio, ubicacion, transaccion, imagen, estado, municipio, metrosTerreno, servicios, moneda) {
        super(id, titulo, precio, ubicacion, transaccion, 'terreno', imagen, estado, municipio, moneda);
        this.metrosTerreno = metrosTerreno;
        this.servicios = servicios;
    }

    renderFeatures() {
        let features = '';
        if (this.metrosTerreno) features += `<span><i class="fa-solid fa-ruler-combined"></i> ${this.metrosTerreno}m² Terr.</span>`;
        features += `<span><i class="fa-solid fa-bolt"></i> ${this.servicios ? 'Serv. Básicos' : 'Sin Servicios'}</span>`;
        return features;
    }
}

export class LocalComercial extends Propiedad {
    constructor(id, titulo, precio, ubicacion, transaccion, imagen, estado, municipio, metrosConstruccion, banos, estacionamiento, moneda) {
        super(id, titulo, precio, ubicacion, transaccion, 'local', imagen, estado, municipio, moneda);
        this.metrosConstruccion = metrosConstruccion;
        this.banos = banos;
        this.estacionamiento = estacionamiento;
    }

    renderFeatures() {
        let features = '';
        if (this.metrosConstruccion) features += `<span><i class="fa-solid fa-ruler-combined"></i> ${this.metrosConstruccion}m² Const.</span>`;
        return features;
    }
}
