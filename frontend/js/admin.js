const API_BASE = window.API_BASE || '';
const API = `${API_BASE}/api/propiedades`;

// ── Referencias al DOM ──────────────────────────────────────────────────────
const adminForm         = document.getElementById('adminForm');
const tipoSelect        = document.getElementById('tipo');
const transaccionSelect = document.getElementById('transaccion');
const camposVenta       = document.getElementById('camposVenta');
const monedaSelect      = document.getElementById('moneda');
const camposCasaDepto = document.getElementById('camposCasaDepto');
const groupTerrenoCasa = document.getElementById('groupTerrenoCasa');
const camposTerreno   = document.getElementById('camposTerreno');
const camposLocal     = document.getElementById('camposLocal');
const groupConstruccion = document.getElementById('groupConstruccion');
const groupTerreno      = document.getElementById('groupTerreno');
const mensajeResultado  = document.getElementById('mensajeResultado');
const precioInput       = document.getElementById('precio');
const precioRaw         = document.getElementById('precioRaw');
const editingId         = document.getElementById('editingId');
const formTitle         = document.getElementById('formTitle');
const submitBtn         = document.getElementById('submitBtn');
const cancelEditBtn     = document.getElementById('cancelEditBtn');
const editModeBadge     = document.getElementById('editModeBadge');
const fotosInput        = document.getElementById('fotos');
const fotosHelp         = document.getElementById('fotosHelp');
const propiedadesList   = document.getElementById('propiedadesList');
const modalEliminar     = document.getElementById('modalEliminar');
const confirmDeleteBtn  = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn   = document.getElementById('cancelDeleteBtn');
const imageManagerGroup = document.getElementById('imageManagerGroup');
const imageGrid         = document.getElementById('imageGrid');
const estadoSelect      = document.getElementById('estado');
const municipioSelect   = document.getElementById('municipio');

let deletingId = null;

// ── Estado local para gestor de fotos ───────────────────────────────────────
let existingImages    = [];
let newFiles          = [];
let selectedThumbnail = null;

// ── Formateo automático de precio ───────────────────────────────────────────
precioInput.addEventListener('input', formatearPrecio);

// ── Gestión interactiva de fotos y miniatura ─────────────────────────────────
fotosInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        newFiles = [...newFiles, ...files];
        fotosInput.value = ''; // Limpiar input para permitir más selecciones
        
        // Por defecto, si no hay miniatura seleccionada, seleccionar la primera nueva
        if (!selectedThumbnail) {
            selectedThumbnail = 'index_0';
        }
        
        renderImageManager();
    }
});

function renderImageManager() {
    if (existingImages.length === 0 && newFiles.length === 0) {
        imageManagerGroup.style.display = 'none';
        return;
    }
    imageManagerGroup.style.display = 'block';
    imageGrid.innerHTML = '';

    // 1. Renderizar fotos existentes (en el servidor)
    existingImages.forEach((url, i) => {
        const isCurrentThumb = (selectedThumbnail === url);
        const card = document.createElement('div');
        card.className = `image-thumb-card ${isCurrentThumb ? 'is-thumbnail' : ''}`;
        
        card.innerHTML = `
            <img src="${url}" alt="Foto existente ${i + 1}">
            ${isCurrentThumb ? `<span class="thumb-badge badge-primary-thumb">Principal</span>` : ''}
            <div class="overlay-actions">
                <button type="button" class="action-btn btn-star-thumb ${isCurrentThumb ? 'active' : ''}" title="Marcar como miniatura principal">
                    <i class="fa-solid fa-star"></i>
                </button>
                <button type="button" class="action-btn btn-delete-thumb" title="Eliminar foto">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;

        // Estrella (miniatura)
        card.querySelector('.btn-star-thumb').addEventListener('click', (e) => {
            e.stopPropagation();
            selectedThumbnail = url;
            renderImageManager();
        });

        // Eliminar
        card.querySelector('.btn-delete-thumb').addEventListener('click', (e) => {
            e.stopPropagation();
            existingImages.splice(i, 1);
            if (selectedThumbnail === url) {
                selectedThumbnail = existingImages[0] || (newFiles.length > 0 ? 'index_0' : null);
            }
            renderImageManager();
        });

        imageGrid.appendChild(card);
    });

    // 2. Renderizar nuevas fotos (seleccionadas localmente)
    newFiles.forEach((file, i) => {
        const localUrl = URL.createObjectURL(file);
        const isCurrentThumb = (selectedThumbnail === `index_${i}`);
        const card = document.createElement('div');
        card.className = `image-thumb-card ${isCurrentThumb ? 'is-thumbnail' : ''}`;

        card.innerHTML = `
            <img src="${localUrl}" alt="Nueva foto ${i + 1}">
            <span class="thumb-badge badge-new-thumb">Nuevo</span>
            ${isCurrentThumb ? `<span class="thumb-badge badge-primary-thumb" style="top:26px">Principal</span>` : ''}
            <div class="overlay-actions">
                <button type="button" class="action-btn btn-star-thumb ${isCurrentThumb ? 'active' : ''}" title="Marcar como miniatura principal">
                    <i class="fa-solid fa-star"></i>
                </button>
                <button type="button" class="action-btn btn-delete-thumb" title="Eliminar foto">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;

        // Estrella (miniatura)
        card.querySelector('.btn-star-thumb').addEventListener('click', (e) => {
            e.stopPropagation();
            selectedThumbnail = `index_${i}`;
            renderImageManager();
        });

        // Eliminar
        card.querySelector('.btn-delete-thumb').addEventListener('click', (e) => {
            e.stopPropagation();
            newFiles.splice(i, 1);
            if (selectedThumbnail && selectedThumbnail.startsWith('index_')) {
                const thumbIndex = parseInt(selectedThumbnail.split('_')[1], 10);
                if (thumbIndex === i) {
                    selectedThumbnail = existingImages[0] || (newFiles.length > 0 ? 'index_0' : null);
                } else if (thumbIndex > i) {
                    selectedThumbnail = `index_${thumbIndex - 1}`;
                }
            }
            renderImageManager();
        });

        imageGrid.appendChild(card);
    });
}

function formatearPrecio() {
    let raw = precioInput.value.replace(/[^0-9.]/g, '');
    const partes = raw.split('.');
    if (partes.length > 2) raw = partes[0] + '.' + partes.slice(1).join('');
    precioRaw.value = raw;
    if (raw === '') { precioInput.value = ''; return; }
    const [entero, decimal] = raw.split('.');
    const formateado = parseInt(entero || '0', 10).toLocaleString('es-MX');
    precioInput.value = '$' + formateado + (decimal !== undefined ? '.' + decimal : '');
}

function setPrecioDisplay(valor) {
    precioRaw.value = valor;
    precioInput.value = valor
        ? '$' + parseFloat(valor).toLocaleString('es-MX')
        : '';
}

// ── Campos dinámicos por tipo ───────────────────────────────────────────────
function aplicarCamposPorTipo(val) {
    // Esconder todos primero
    camposCasaDepto.style.display = 'none';
    camposTerreno.style.display   = 'none';
    camposLocal.style.display     = 'none';

    if (val === 'terreno') {
        camposTerreno.style.display   = 'block';
    } else if (val === 'casa') {
        camposCasaDepto.style.display = 'block';
        groupTerrenoCasa.style.display = 'block';
    } else if (val === 'depto') {
        camposCasaDepto.style.display = 'block';
        groupTerrenoCasa.style.display = 'none';
    } else if (val === 'local') {
        camposLocal.style.display     = 'block';
    }
}

function aplicarCamposPorTransaccion(val) {
    if (val === 'venta') {
        camposVenta.style.display = 'flex';
    } else {
        camposVenta.style.display = 'none';
        monedaSelect.value = 'MXN';
    }
}

tipoSelect.addEventListener('change', e => aplicarCamposPorTipo(e.target.value));
transaccionSelect.addEventListener('change', e => aplicarCamposPorTransaccion(e.target.value));

// ── Lógica de Estados y Municipios ──────────────────────────────────────────
function cargarEstados() {
    estadoSelect.innerHTML = '<option value="" disabled selected>Selecciona un estado</option>';
    const estados = Object.keys(ESTADOS_MUNICIPIOS).sort();
    estados.forEach(estado => {
        const option = document.createElement('option');
        option.value = estado;
        option.textContent = estado;
        estadoSelect.appendChild(option);
    });
}

function cargarMunicipios(estadoSeleccionado, municipioInicial = null) {
    municipioSelect.innerHTML = '<option value="" disabled selected>Selecciona un municipio</option>';
    if (!estadoSeleccionado) {
        municipioSelect.disabled = true;
        return;
    }
    
    municipioSelect.disabled = false;
    const municipios = ESTADOS_MUNICIPIOS[estadoSeleccionado] || [];
    municipios.forEach(municipio => {
        const option = document.createElement('option');
        option.value = municipio;
        option.textContent = municipio;
        if (municipio === municipioInicial) {
            option.selected = true;
        }
        municipioSelect.appendChild(option);
    });
}

estadoSelect.addEventListener('change', (e) => {
    cargarMunicipios(e.target.value);
});

cargarEstados();

// ── Cargar y renderizar lista de publicaciones ──────────────────────────────
async function cargarPropiedades() {
    try {
        const res = await fetch(API);
        const data = await res.json();
        renderLista(data);
    } catch {
        propiedadesList.innerHTML = '<p class="list-empty" style="color:red">Error al cargar las publicaciones. Asegúrate de que el servidor esté corriendo.</p>';
    }
}

function renderLista(propiedades) {
    if (!propiedades.length) {
        propiedadesList.innerHTML = '<p class="list-empty"><i class="fa-solid fa-inbox"></i><br>No hay publicaciones aún. ¡Sube la primera!</p>';
        return;
    }
    propiedadesList.innerHTML = propiedades.map(p => `
        <div class="prop-item">
            <img class="prop-item-img" src="${p.imagen || 'https://via.placeholder.com/72x56'}" alt="${p.titulo}">
            <div class="prop-item-info">
                <strong>${p.titulo}</strong>
                <span>
                    <span class="prop-item-badge ${p.transaccion === 'venta' ? 'badge-venta' : 'badge-renta'}">
                        ${p.transaccion === 'venta' ? 'Venta' : 'Renta'}
                    </span>
                    · ${p.tipo} · $${parseFloat(p.precio).toLocaleString('es-MX')}${p.transaccion === 'venta' && p.moneda ? ' ' + p.moneda : ''}
                </span>
            </div>
            <div class="prop-item-actions">
                <button class="btn-icon btn-edit" title="Editar" onclick="iniciarEdicion('${p._id}')">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn-icon btn-delete" title="Eliminar" onclick="abrirModalEliminar('${p._id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// ── Iniciar modo Edición ────────────────────────────────────────────────────
async function iniciarEdicion(id) {
    mensajeResultado.textContent = '';
    try {
        const res = await fetch(`${API}/${id}`);
        const p = await res.json();

        // Rellenar campos
        editingId.value                             = p._id;
        document.getElementById('titulo').value     = p.titulo;
        document.getElementById('contacto').value   = p.contacto || '';
        document.getElementById('ubicacion').value  = p.ubicacion;
        estadoSelect.value                          = p.estado || '';
        cargarMunicipios(p.estado || '', p.municipio || '');
        setPrecioDisplay(p.precio);

        // Selects
        tipoSelect.value        = p.tipo;
        transaccionSelect.value = p.transaccion;
        monedaSelect.value      = p.moneda || 'MXN';
        aplicarCamposPorTipo(p.tipo);
        aplicarCamposPorTransaccion(p.transaccion);

        // Limpiar campos primero
        document.getElementById('habitaciones').value = '';
        document.getElementById('banos').value = '';
        document.getElementById('metrosConstruccion').value = '';
        document.getElementById('metrosTerrenoCasa').value = '';
        document.getElementById('metrosTerrenoSolo').value = '';
        document.getElementById('metrosConstruccionLocal').value = '';
        document.getElementById('banosLocal').value = '';
        document.getElementById('estacionamiento').value = '';
        document.getElementById('tieneGarage').value = 'false';
        document.getElementById('tienePatio').value = 'false';

        if (p.tipo === 'casa' || p.tipo === 'depto') {
            document.getElementById('habitaciones').value = p.habitaciones || '';
            document.getElementById('banos').value        = p.banos || '';
            document.getElementById('metrosConstruccion').value = p.metrosConstruccion || '';
            document.getElementById('tieneGarage').value = p.tieneGarage ? 'true' : 'false';
            document.getElementById('tienePatio').value = p.tienePatio ? 'true' : 'false';
            if (p.tipo === 'casa') {
                document.getElementById('metrosTerrenoCasa').value = p.metrosTerreno || '';
            }
        } else if (p.tipo === 'terreno') {
            document.getElementById('metrosTerrenoSolo').value = p.metrosTerreno || '';
            document.getElementById('servicios').value = p.servicios ? 'true' : 'false';
        } else if (p.tipo === 'local') {
            document.getElementById('metrosConstruccionLocal').value = p.metrosConstruccion || '';
            document.getElementById('banosLocal').value        = p.banos || '';
            document.getElementById('estacionamiento').value   = p.estacionamiento || '';
        }
        document.getElementById('detalles').value  = p.detalles || '';

        // Inicializar gestor de imágenes con las fotos de la propiedad
        existingImages = p.imagenes && p.imagenes.length > 0 ? [...p.imagenes] : (p.imagen ? [p.imagen] : []);
        newFiles = [];
        selectedThumbnail = p.imagen || (existingImages.length > 0 ? existingImages[0] : null);
        renderImageManager();

        // Cambiar UI a modo edición
        formTitle.textContent  = 'Editar Publicación';
        submitBtn.innerHTML    = '<i class="fa-solid fa-floppy-disk"></i> Guardar Cambios';
        cancelEditBtn.style.display = 'block';
        editModeBadge.style.display = 'block';
        fotosHelp.textContent = 'Opcional: agrega nuevas fotos a la propiedad.';

        // Scroll suave al formulario
        document.querySelector('.admin-form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
        mensajeResultado.textContent = 'No se pudo cargar la publicación.';
        mensajeResultado.style.color = 'red';
    }
}

// ── Cancelar edición ────────────────────────────────────────────────────────
function cancelarEdicion() {
    adminForm.reset();
    editingId.value = '';
    formTitle.textContent  = 'Subir Nueva Propiedad';
    submitBtn.innerHTML    = '<i class="fa-solid fa-cloud-arrow-up"></i> Subir Propiedad';
    cancelEditBtn.style.display = 'none';
    editModeBadge.style.display = 'none';
    fotosHelp.textContent = 'Puedes seleccionar múltiples imágenes a la vez.';
    precioInput.value = '';
    precioRaw.value = '';
    estadoSelect.value = '';
    municipioSelect.innerHTML = '<option value="" disabled selected>Primero selecciona un estado</option>';
    municipioSelect.disabled = true;
    mensajeResultado.textContent = '';
    camposCasaDepto.style.display = 'none';
    camposTerreno.style.display   = 'none';
    if (groupConstruccion) groupConstruccion.style.display = 'none';
    if (groupTerreno) groupTerreno.style.display = 'none';
    camposVenta.style.display = 'none';
    monedaSelect.value = 'MXN';

    // Limpiar gestor de imágenes
    existingImages = [];
    newFiles = [];
    selectedThumbnail = null;
    renderImageManager();
}

cancelEditBtn.addEventListener('click', cancelarEdicion);

// ── Modal de confirmación eliminar ──────────────────────────────────────────
function abrirModalEliminar(id) {
    deletingId = id;
    deletingType = 'propiedad';
    modalDeleteTitle.textContent = '¿Eliminar publicación?';
    modalDeleteText.textContent = 'Esta acción es permanente. La publicación desaparecerá del sitio.';
    modalEliminar.classList.add('open');
}

function abrirModalEliminarMsg(id) {
    deletingId = id;
    deletingType = 'mensaje';
    modalDeleteTitle.textContent = '¿Eliminar mensaje?';
    modalDeleteText.textContent = 'Esta acción es permanente. El mensaje se borrará de la base de datos.';
    modalEliminar.classList.add('open');
}

cancelDeleteBtn.addEventListener('click', () => {
    modalEliminar.classList.remove('open');
    deletingId = null;
    deletingType = null;
});

confirmDeleteBtn.addEventListener('click', async () => {
    if (!deletingId) return;
    modalEliminar.classList.remove('open');
    
    try {
        if (deletingType === 'mensaje') {
            await fetch(`${MSG_API}/${deletingId}`, { method: 'DELETE' });
            cargarMensajes();
        } else {
            await fetch(`${API}/${deletingId}`, { method: 'DELETE' });
            cargarPropiedades();
        }
        deletingId = null;
        deletingType = null;
    } catch {
        alert(deletingType === 'mensaje' ? 'No se pudo eliminar el mensaje.' : 'No se pudo eliminar la publicación.');
    }
});

// ── Referencias para la sección de Mensajes ──────────────────────────────
const MSG_API = `${API_BASE}/api/mensajes`;
const mensajesList = document.getElementById('mensajesList');
const mensajeCountBadge = document.getElementById('mensajeCountBadge');
const modalDeleteTitle = modalEliminar.querySelector('h3');
const modalDeleteText = modalEliminar.querySelector('p');

let deletingType = null; // 'propiedad' o 'mensaje'

// ── Lógica de Pestañas (Admin Panel Switcher) ──────────────────────────────
const tabButtons = document.querySelectorAll('.admin-tab-btn');
const adminPanels = document.querySelectorAll('.admin-panel');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetPanel = btn.getAttribute('data-panel');
        
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        adminPanels.forEach(panel => panel.classList.remove('active'));
        const activePanel = document.getElementById(`panel-${targetPanel}`);
        if (activePanel) {
            activePanel.classList.add('active');
        }

        if (targetPanel === 'mensajes') {
            cargarMensajes();
        } else {
            cargarPropiedades();
            actualizarContadorMensajes();
        }
    });
});

// ── Cargar y renderizar Mensajes de Contacto ──────────────────────────────
async function cargarMensajes() {
    try {
        const res = await fetch(MSG_API);
        const data = await res.json();
        
        // Actualizar contador
        if (data.length > 0) {
            mensajeCountBadge.textContent = data.length;
            mensajeCountBadge.style.display = 'inline-block';
        } else {
            mensajeCountBadge.style.display = 'none';
        }

        renderMensajes(data);
    } catch (err) {
        console.error(err);
        mensajesList.innerHTML = '<p class="list-empty" style="color:red">Error al cargar los mensajes. Asegúrate de que el servidor esté corriendo.</p>';
    }
}

async function actualizarContadorMensajes() {
    try {
        const res = await fetch(MSG_API);
        const data = await res.json();
        if (data.length > 0) {
            mensajeCountBadge.textContent = data.length;
            mensajeCountBadge.style.display = 'inline-block';
        } else {
            mensajeCountBadge.style.display = 'none';
        }
    } catch {
        mensajeCountBadge.style.display = 'none';
    }
}

function renderMensajes(mensajes) {
    if (!mensajes.length) {
        mensajesList.innerHTML = '<p class="list-empty"><i class="fa-solid fa-inbox"></i><br>Bandeja de entrada vacía. No hay mensajes nuevos.</p>';
        return;
    }

    mensajesList.innerHTML = mensajes.map(msg => {
        const dateFmt = new Date(msg.createdAt).toLocaleString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const telClean = msg.telefono.replace(/\D/g, '');
        const waUrl = `https://wa.me/52${telClean}?text=Hola%20${encodeURIComponent(msg.nombre)}%2C%20recibimos%20tu%20mensaje%20en%20Grupo%20CAMECI%20sobre%20el%20servicio%20de%20%22${encodeURIComponent(msg.servicio || 'Asesoría')}%22.%20Con%20gusto%20te%20atendemos.`;

        // Mapeo amigable del tipo de servicio
        let servicioFmt = 'Consulta General';
        if (msg.servicio === 'avaluo-credito') servicioFmt = 'Avalúo para crédito';
        else if (msg.servicio === 'avaluo-comercial') servicioFmt = 'Avalúo comercial';
        else if (msg.servicio === 'estudios') servicioFmt = 'Estudios especializados';
        else if (msg.servicio === 'otros') servicioFmt = 'Otros trámites';

        return `
            <div class="message-card">
                <div class="message-card-header">
                    <div class="message-client-info">
                        <h3>${msg.nombre}</h3>
                        <span><i class="fa-regular fa-clock"></i> ${dateFmt}</span>
                    </div>
                </div>
                <div class="message-card-body">
                    ${msg.mensaje}
                </div>
                <div class="message-card-footer">
                    <div class="message-meta-tags">
                        <span class="msg-badge msg-badge-service"><i class="fa-solid fa-briefcase"></i> ${servicioFmt}</span>
                        <span class="msg-badge msg-badge-location"><i class="fa-solid fa-location-dot"></i> ${msg.ubicacion}</span>
                    </div>
                    <div class="message-actions">
                        <a href="tel:${telClean}" class="btn-icon btn-msg-call" title="Llamar al cliente">
                            <i class="fa-solid fa-phone"></i>
                        </a>
                        <a href="${waUrl}" target="_blank" class="btn-icon btn-msg-wa" title="Enviar WhatsApp">
                            <i class="fa-brands fa-whatsapp"></i>
                        </a>
                        <button class="btn-icon btn-delete" title="Eliminar Mensaje" onclick="abrirModalEliminarMsg('${msg._id}')">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ── Envío del formulario (Crear o Editar) ───────────────────────────────────
adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const isEdit  = !!editingId.value;

    // Validación personalizada de imágenes
    if (!isEdit && newFiles.length === 0) {
        mensajeResultado.textContent = '❌ Por favor, selecciona al menos una foto para la propiedad.';
        mensajeResultado.style.color = 'red';
        return;
    }
    if (isEdit && existingImages.length === 0 && newFiles.length === 0) {
        mensajeResultado.textContent = '❌ La propiedad debe tener al menos una foto.';
        mensajeResultado.style.color = 'red';
        return;
    }

    mensajeResultado.textContent = isEdit ? 'Guardando cambios...' : 'Subiendo propiedad...';
    mensajeResultado.style.color = '#555';

    const formData = new FormData(adminForm);
    formData.set('precio', precioRaw.value || precioInput.value.replace(/[^0-9.]/g, ''));
    formData.set('estado', estadoSelect.value);
    formData.set('municipio', municipioSelect.value);

    // Ajustar campos según tipo para enviar solo lo correcto al backend
    const tipoVal = tipoSelect.value;
    if (tipoVal === 'casa' || tipoVal === 'depto') {
        formData.delete('metrosTerrenoSolo');
        formData.delete('metrosConstruccionLocal');
        formData.delete('banosLocal');
        formData.delete('estacionamiento');
        // Renombrar metrosTerrenoCasa a metrosTerreno para el backend
        if (tipoVal === 'casa') {
            formData.set('metrosTerreno', document.getElementById('metrosTerrenoCasa').value);
        }
    } else if (tipoVal === 'terreno') {
        formData.delete('habitaciones');
        formData.delete('banos');
        formData.delete('metrosConstruccion');
        formData.delete('metrosTerrenoCasa');
        formData.delete('tieneGarage');
        formData.delete('tienePatio');
        formData.delete('metrosConstruccionLocal');
        formData.delete('banosLocal');
        formData.delete('estacionamiento');
        formData.set('metrosTerreno', document.getElementById('metrosTerrenoSolo').value);
    } else if (tipoVal === 'local') {
        formData.delete('habitaciones');
        formData.delete('banos');
        formData.delete('metrosConstruccion');
        formData.delete('metrosTerrenoCasa');
        formData.delete('metrosTerrenoSolo');
        formData.delete('tieneGarage');
        formData.delete('tienePatio');
        formData.delete('servicios');
        formData.set('metrosConstruccion', document.getElementById('metrosConstruccionLocal').value);
        formData.set('banos', document.getElementById('banosLocal').value);
    }

    // Sobrescribir y gestionar fotos en FormData
    formData.delete('fotos');
    newFiles.forEach(file => {
        formData.append('fotos', file);
    });

    // Pasar lista de imágenes existentes a conservar
    formData.append('imagenes', JSON.stringify(existingImages));

    // Pasar miniatura seleccionada
    if (selectedThumbnail) {
        formData.append('imagen', selectedThumbnail);
    }

    const url     = isEdit ? `${API}/${editingId.value}` : API;
    const method  = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, { method, body: formData });

        if (response.ok) {
            mensajeResultado.textContent = isEdit
                ? '✅ ¡Publicación actualizada con éxito!'
                : '✅ ¡Propiedad subida exitosamente!';
            mensajeResultado.style.color = 'green';
            cancelarEdicion();
            cargarPropiedades();
        } else {
            const errData = await response.json();
            mensajeResultado.textContent = 'Error: ' + (errData.message || 'No se pudo completar la operación.');
            mensajeResultado.style.color = 'red';
        }
    } catch {
        mensajeResultado.textContent = 'Error de conexión con el servidor.';
        mensajeResultado.style.color = 'red';
    }
});

// ── Exposición de funciones al HTML ────────────────────────────────────────
window.iniciarEdicion       = iniciarEdicion;
window.abrirModalEliminar   = abrirModalEliminar;
window.abrirModalEliminarMsg = abrirModalEliminarMsg;

// ── Carga inicial ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    cargarPropiedades();
    actualizarContadorMensajes();
});

