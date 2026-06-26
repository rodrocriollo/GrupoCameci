const API = '/api/propiedades';

// Leer el ID del hash de la URL: propiedad.html#<id>
const propId = window.location.hash.slice(1);
const container = document.getElementById('detailContainer');

if (!propId) {
    showError('No se especificó ninguna propiedad. <a href="index.html">Volver al inicio</a>');
} else {
    loadProperty(propId);
}

async function loadProperty(id) {
    try {
        const res = await fetch(`${API}/${id}`);
        if (!res.ok) throw new Error('No encontrada');
        const p = await res.json();
        document.title = `${p.titulo} - Grupo CAMECI`;
        render(p);
    } catch {
        showError('No pudimos cargar esta propiedad. Intenta recargar la página o <a href="index.html">vuelve al inicio</a>.');
    }
}

function render(p) {
    const imagenes = (p.imagenes && p.imagenes.length > 0)
        ? p.imagenes
        : [p.imagen || 'https://via.placeholder.com/800x500?text=Sin+imagen'];

    let tipoLabel = p.tipo;
    if (p.tipo === 'casa') tipoLabel = 'Casa Habitacional';
    else if (p.tipo === 'depto') tipoLabel = 'Departamento';
    else if (p.tipo === 'terreno') tipoLabel = 'Terreno';
    else if (p.tipo === 'local') tipoLabel = 'Local Comercial';

    const transLabel = p.transaccion === 'venta' ? 'Venta' : 'Renta';
    const precioFmt  = '$' + parseFloat(p.precio).toLocaleString('es-MX');
    const tel        = (p.contacto || '').replace(/\D/g, '');

    // Miniaturas HTML
    const thumbsHTML = imagenes.map((src, i) => `
        <div class="gallery-thumb ${i === 0 ? 'active' : ''}" data-index="${i}">
            <img src="${src}" alt="Foto ${i + 1}" loading="lazy">
        </div>
    `).join('');

    // Especificaciones dinámicas
    const specs = [];
    if (p.habitaciones)       specs.push({ icon: 'fa-bed',            val: p.habitaciones,              lbl: p.habitaciones === 1 ? 'Habitación' : 'Habitaciones' });
    if (p.banos)              specs.push({ icon: 'fa-bath',           val: p.banos,                     lbl: p.banos === 1 ? 'Baño' : 'Baños' });
    if (p.metrosConstruccion) specs.push({ icon: 'fa-ruler-combined', val: `${p.metrosConstruccion} m²`, lbl: 'Construcción' });
    if (p.metrosTerreno || p.metrosTotales) specs.push({ icon: 'fa-map', val: `${p.metrosTerreno || p.metrosTotales} m²`, lbl: 'Terreno' });
    if (p.tipo === 'terreno') specs.push({ icon: 'fa-bolt',           val: p.servicios ? 'Sí' : 'No',   lbl: 'Servicios básicos' });
    if (p.tieneGarage)        specs.push({ icon: 'fa-car',            val: 'Sí',                        lbl: 'Garage' });
    if (p.tienePatio)         specs.push({ icon: 'fa-leaf',           val: 'Sí',                        lbl: 'Patio Indep.' });
    if (p.estacionamiento)    specs.push({ icon: 'fa-square-parking', val: p.estacionamiento,           lbl: 'Estacionamiento' });

    const specsHTML = specs.map(s => `
        <div class="spec-item">
            <i class="fa-solid ${s.icon}"></i>
            <div>
                <span class="spec-val">${s.val}</span>
                <span class="spec-lbl">${s.lbl}</span>
            </div>
        </div>
    `).join('');

    // Tira con botones nav laterales (estilo Steam)
    const multipleImages = imagenes.length > 1;
    const stripHTML = `
        <div class="gallery-strip-outer">
            <button type="button" class="strip-nav-btn" id="stripPrev" aria-label="Anterior">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
            <div class="gallery-strip-mask">
                <div class="gallery-strip" id="galleryStrip">${thumbsHTML}</div>
            </div>
            <button type="button" class="strip-nav-btn" id="stripNext" aria-label="Siguiente">
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    `;

    container.innerHTML = `
        <!-- Breadcrumb -->
        <nav class="breadcrumb">
            <a href="index.html"><i class="fa-solid fa-house"></i> Inicio</a>
            <i class="fa-solid fa-chevron-right" style="font-size:.7rem"></i>
            <span>Propiedades</span>
            <i class="fa-solid fa-chevron-right" style="font-size:.7rem"></i>
            <span>${tipoLabel}</span>
        </nav>

        <!-- Título y badges -->
        <h1 class="detail-title">${p.titulo}</h1>
        ${p.estado && p.municipio ? `<p style="font-size: 1.1rem; color: var(--text-secondary); margin-top: -0.2rem; margin-bottom: 1rem;"><i class="fa-solid fa-location-dot" style="color: var(--cameci-orange)"></i> ${p.municipio}, ${p.estado}</p>` : ''}
        <div class="detail-meta">
            <span class="detail-badge ${p.transaccion === 'venta' ? 'badge-venta' : 'badge-renta'}">${transLabel}</span>
            <span class="detail-badge badge-tipo"><i class="fa-solid ${p.tipo === 'casa' ? 'fa-house' : p.tipo === 'terreno' ? 'fa-map' : p.tipo === 'local' ? 'fa-shop' : 'fa-building'}"></i> ${tipoLabel}</span>
        </div>

        <!-- Grid: galería + panel info -->
        <div class="detail-grid">

            <!-- ── GALERÍA ── -->
            <div class="gallery-section">
                <div class="gallery-main" id="galleryMain">
                    <img id="mainImg" src="${imagenes[0]}" alt="${p.titulo}">
                    ${multipleImages ? `
                    <button type="button" class="gallery-arrow prev" id="prevBtn"><i class="fa-solid fa-chevron-left"></i></button>
                    <button type="button" class="gallery-arrow next" id="nextBtn"><i class="fa-solid fa-chevron-right"></i></button>
                    <span class="gallery-counter" id="counter">1 / ${imagenes.length}</span>
                    ` : ''}
                </div>
                ${multipleImages ? `
                <div class="gallery-strip-outer">
                    <button type="button" class="strip-nav-btn" id="stripPrev" aria-label="Anterior">
                        <i class="fa-solid fa-chevron-left"></i>
                    </button>
                    <div class="gallery-strip-mask">
                        <div class="gallery-strip" id="galleryStrip">${thumbsHTML}</div>
                    </div>
                    <button type="button" class="strip-nav-btn" id="stripNext" aria-label="Siguiente">
                        <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
                ` : ''}
            </div>

            <!-- ── PANEL INFO ── -->
            <div class="info-panel">
                <div class="info-price-header">
                    <div class="label">Precio de ${transLabel.toLowerCase()}</div>
                    <div class="price">${precioFmt}${p.transaccion === 'renta' ? ' <span class="per">/mes</span>' : ''}${p.transaccion === 'venta' && p.moneda ? ' <span class="per">' + p.moneda + '</span>' : ''}</div>
                </div>
                <div class="info-body">
                    ${specsHTML ? `<div class="specs-grid">${specsHTML}</div>` : ''}
                    <div class="info-location">
                        <i class="fa-solid fa-location-dot"></i>
                        <span>${p.ubicacion}</span>
                    </div>
                    ${p.detalles ? `
                    <div class="description-card" id="descriptionCard">
                        <div class="description-header">
                            <h3>Descripción de ${tipoLabel} ${transLabel === 'Venta' ? 'en venta' : ''}</h3>
                            <button class="desc-toggle" id="descToggleBtn" aria-expanded="false"><i class="fa-solid fa-chevron-up"></i></button>
                        </div>
                        <div class="description-content" id="descContent">${p.detalles}</div>
                        <a class="show-more" id="descToggleLink">Mostrar más</a>
                    </div>
                    ` : ''}
                    ${tel ? `
                    <a href="https://wa.me/52${tel}?text=Hola%2C%20vi%20la%20publicaci%C3%B3n%20de%20${encodeURIComponent(p.titulo)}%20y%20me%20interesa%20m%C3%A1s%20informaci%C3%B3n."
                       target="_blank" class="btn-whatsapp">
                        <i class="fa-brands fa-whatsapp" style="font-size:1.2rem;"></i>
                        Contactar por WhatsApp
                    </a>
                    <a href="tel:${tel}" class="btn-call">
                        <i class="fa-solid fa-phone"></i> Llamar: ${p.contacto}
                    </a>
                    ` : ''}
                </div>
            </div>

        </div>
    `;

    // ── Lógica de la galería ──────────────────────────────────────────────
    if (!multipleImages) {
        // Solo una imagen — no hay controles que inicializar
        initDescription();
        return;
    }

    const mainImg = document.getElementById('mainImg');
    const counter = document.getElementById('counter');
    const strip   = document.getElementById('galleryStrip');
    const thumbs  = document.querySelectorAll('.gallery-thumb');
    let current   = 0;

    // ── goTo: cambia imagen principal + resalta miniatura ──
    function goTo(index) {
        mainImg.classList.add('fade-out');
        setTimeout(() => {
            current = (index + imagenes.length) % imagenes.length;
            mainImg.src = imagenes[current];
            mainImg.classList.remove('fade-out');
            counter.textContent = `${current + 1} / ${imagenes.length}`;

            thumbs.forEach((t, i) => t.classList.toggle('active', i === current));

            // Scroll la tira para que la miniatura activa quede centrada
            const activeThumb = thumbs[current];
            const stripEl = strip;
            const thumbLeft   = activeThumb.offsetLeft;
            const thumbWidth  = activeThumb.offsetWidth;
            const stripWidth  = stripEl.clientWidth;
            const scrollTarget = thumbLeft - stripWidth / 2 + thumbWidth / 2;
            stripEl.scrollTo({ left: scrollTarget, behavior: 'smooth' });
        }, 180);
    }

    // ── Botones de imagen principal ──
    document.getElementById('prevBtn').addEventListener('click', () => goTo(current - 1));
    document.getElementById('nextBtn').addEventListener('click', () => goTo(current + 1));

    // ── Clicks en miniaturas ──
    thumbs.forEach(t => t.addEventListener('click', () => goTo(parseInt(t.dataset.index, 10))));

    // ── Botones de la tira (Steam) ──
    const stripPrev = document.getElementById('stripPrev');
    const stripNext = document.getElementById('stripNext');
    const STRIP_SCROLL_AMOUNT = 260; // píxeles por click

    stripPrev.addEventListener('click', () => {
        strip.scrollBy({ left: -STRIP_SCROLL_AMOUNT, behavior: 'smooth' });
    });
    stripNext.addEventListener('click', () => {
        strip.scrollBy({ left: STRIP_SCROLL_AMOUNT, behavior: 'smooth' });
    });

    // ── Rueda del mouse sobre la tira (scroll horizontal) ──
    strip.addEventListener('wheel', (e) => {
        // Si el scroll es principalmente vertical, convertirlo a horizontal
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            strip.scrollBy({ left: e.deltaY * 1.5, behavior: 'auto' });
        }
    }, { passive: false });

    // ── Touch swipe en la imagen principal ──
    let touchStartX = 0;
    let touchStartY = 0;

    document.getElementById('galleryMain').addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.getElementById('galleryMain').addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        // Solo activar si el swipe es más horizontal que vertical y supera 40px
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
            if (dx < 0) goTo(current + 1);   // swipe izquierda → siguiente
            else        goTo(current - 1);   // swipe derecha → anterior
        }
    }, { passive: true });

    // ── Teclado (flechas) ──
    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft')  goTo(current - 1);
        if (e.key === 'ArrowRight') goTo(current + 1);
    });

    // ── Descripción ──
    initDescription();
}

// ── Lógica de mostrar más / menos para la descripción ─────────────────────
function initDescription() {
    const descContent = document.getElementById('descContent');
    const descLink    = document.getElementById('descToggleLink');
    const descBtn     = document.getElementById('descToggleBtn');

    if (!descContent || !descLink) return;

    const needsToggle =
        descContent.scrollHeight > descContent.clientHeight + 8 ||
        (descContent.textContent || '').length > 220;

    if (!needsToggle) {
        descLink.style.display = 'none';
        if (descBtn) descBtn.style.display = 'none';
        return;
    }

    let expanded = false;

    function setState(exp) {
        expanded = exp;
        if (exp) {
            descContent.classList.add('expanded');
            descLink.textContent = 'Mostrar menos';
            if (descBtn) {
                descBtn.setAttribute('aria-expanded', 'true');
                descBtn.querySelector('i').style.transform = 'rotate(180deg)';
            }
        } else {
            descContent.classList.remove('expanded');
            descLink.textContent = 'Mostrar más';
            if (descBtn) {
                descBtn.setAttribute('aria-expanded', 'false');
                descBtn.querySelector('i').style.transform = 'rotate(0deg)';
            }
        }
    }

    descLink.addEventListener('click', (e) => { e.preventDefault(); setState(!expanded); });
    if (descBtn) descBtn.addEventListener('click', () => setState(!expanded));

    // Inicialmente colapsado
    setState(false);
}

function showError(msg) {
    container.innerHTML = `
        <div class="error-box">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <p>${msg}</p>
        </div>
    `;
}
