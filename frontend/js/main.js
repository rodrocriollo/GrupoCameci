import { Casa, Departamento, Terreno, LocalComercial } from './clases.js';

const API_BASE = window.API_BASE || '';

document.addEventListener('DOMContentLoaded', () => {
    const display = document.getElementById('display');
    const tabs = document.querySelectorAll('.tab');
    const radios = document.querySelectorAll('input[name="tipo"]');

    let currentTransaction = 'all'; // all, renta, venta
    let currentType = 'all'; // all, casa, terreno, depto

    // Elementos de búsqueda
    const searchInput = document.getElementById('globalSearch');
    const searchSuggestions = document.getElementById('searchSuggestions');
    let allFetchedProperties = [];

    async function fetchAndRender() {
        try {
            // Construir la URL con parámetros de búsqueda
            const base = API_BASE || window.location.origin;
            const url = new URL('/api/propiedades', base);
            if (currentTransaction !== 'all') {
                url.searchParams.append('transaccion', currentTransaction);
            }
            if (currentType !== 'all') {
                url.searchParams.append('tipo', currentType);
            }

            const response = await fetch(url);
            const data = await response.json();

            // Transformar JSON en instancias de clases
            const properties = data.map(prop => {
                const constr = prop.metrosConstruccion || prop.metros;
                const terr = prop.metrosTerreno || prop.metrosTotales;

                if (prop.tipo === 'casa') {
                    return new Casa(prop._id, prop.titulo, prop.precio, prop.ubicacion, prop.transaccion, prop.imagen, prop.estado, prop.municipio, prop.habitaciones, prop.banos, constr, terr, prop.moneda, prop.tieneGarage, prop.tienePatio);
                } else if (prop.tipo === 'depto') {
                    return new Departamento(prop._id, prop.titulo, prop.precio, prop.ubicacion, prop.transaccion, prop.imagen, prop.estado, prop.municipio, prop.habitaciones, prop.banos, constr, prop.moneda, prop.tieneGarage, prop.tienePatio);
                } else if (prop.tipo === 'terreno') {
                    return new Terreno(prop._id, prop.titulo, prop.precio, prop.ubicacion, prop.transaccion, prop.imagen, prop.estado, prop.municipio, terr, prop.servicios, prop.moneda);
                } else if (prop.tipo === 'local') {
                    return new LocalComercial(prop._id, prop.titulo, prop.precio, prop.ubicacion, prop.transaccion, prop.imagen, prop.estado, prop.municipio, constr, prop.banos, prop.estacionamiento, prop.moneda);
                }
                return null;
            }).filter(Boolean);

            allFetchedProperties = properties; // Guardar copia para búsqueda local
            render(properties);
        } catch (error) {
            console.error('Error fetching properties:', error);
            display.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1 / -1; font-size: 1.2rem; color: red;">Error al cargar las propiedades. Asegúrate de que el servidor esté corriendo.</p>';
        }
    }

    function render(filtered) {
        // Generar HTML
        if (filtered.length === 0) {
            display.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1 / -1; font-size: 1.2rem; color: #666;">No se encontraron propiedades con esos filtros.</p>';
            return;
        }

        display.innerHTML = filtered.map(prop => prop.renderCard()).join('');

        // Aplicar animación a las nuevas tarjetas para que se vean fluidas
        const cards = display.querySelectorAll('.property-card');
        cards.forEach((card, index) => {
            // card.style.opacity = '0'; // Ocultar inicialmente (ESTO ESTABA HACIENDO QUE NO SE VIERAN)
            card.style.animation = `fadeIn 0.5s ease forwards ${index * 0.1}s`; // Efecto en cascada
        });
    }

    // Lógica de Búsqueda (Estilo Salud Digna)
    const clearSearch = document.getElementById('clearSearch');

    function renderEmptyState() {
        searchSuggestions.innerHTML = `
            <div class="search-empty-state">
                <div class="suggestions-title" style="font-size: 1.1rem; color: #2d3748; margin-bottom: 1rem;">Empieza a escribir para buscar...</div>
                <div class="empty-state-illustration">
                    <i class="fa-solid fa-box-open" style="color: #63b3ed; font-size: 3.5rem;"></i>
                </div>
                <div class="suggestions-title" style="margin-top: 1rem;">Te sugerimos:</div>
                <ul>
                    <li>Asegurarte que tu búsqueda esté bien escrita.</li>
                    <li>Intenta con diferentes palabras clave.</li>
                </ul>
            </div>
        `;
        searchSuggestions.classList.add('active');
    }

    if (searchInput && searchSuggestions) {
        // Mostrar estado vacío al hacer focus si está vacío
        searchInput.addEventListener('focus', () => {
            const query = searchInput.value.trim().toLowerCase();
            if (query.length < 2) {
                renderEmptyState();
                if (clearSearch) clearSearch.style.display = 'none';
            } else {
                searchSuggestions.classList.add('active');
            }
        });

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            
            if (query.length > 0) {
                if (clearSearch) clearSearch.style.display = 'block';
            } else {
                if (clearSearch) clearSearch.style.display = 'none';
            }

            if (query.length < 2) {
                renderEmptyState();
                return;
            }

            currentHighlightIndex = -1; // Reset highlight on input change

            const matches = allFetchedProperties.filter(p => {
                return (p.titulo && p.titulo.toLowerCase().includes(query)) ||
                       (p.ubicacion && p.ubicacion.toLowerCase().includes(query)) ||
                       (p.estado && p.estado.toLowerCase().includes(query)) ||
                       (p.municipio && p.municipio.toLowerCase().includes(query));
            });

            renderSuggestions(matches);
        });

        // Botón limpiar
        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                searchInput.value = '';
                clearSearch.style.display = 'none';
                renderEmptyState();
                searchInput.focus();
                
                // Mostrar todos de nuevo en la vista si querían ver todo
                render(allFetchedProperties);
            });
        }

        document.addEventListener('click', (e) => {
            const container = document.getElementById('navSearchContainer');
            if (container && !container.contains(e.target)) {
                searchSuggestions.classList.remove('active');
            }
        });

        let currentHighlightIndex = -1;

        searchInput.addEventListener('keydown', (e) => {
            const items = searchSuggestions.querySelectorAll('.suggestion-item');
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentHighlightIndex = Math.min(currentHighlightIndex + 1, items.length - 1);
                updateHighlight(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentHighlightIndex = Math.max(currentHighlightIndex - 1, -1);
                updateHighlight(items);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (currentHighlightIndex >= 0 && currentHighlightIndex < items.length) {
                    items[currentHighlightIndex].click();
                } else if (items.length > 0) {
                    items[0].click(); // Si no hay selección, ir al primer resultado
                }
            }
        });

        function updateHighlight(items) {
            items.forEach((item, index) => {
                if (index === currentHighlightIndex) {
                    item.style.backgroundColor = '#f7fafc'; // Color de hover definido en CSS
                } else {
                    item.style.backgroundColor = '';
                }
            });
        }
    }

    function renderSuggestions(matches) {
        searchSuggestions.innerHTML = '';
        if (matches.length === 0) {
            searchSuggestions.innerHTML = '<div class="suggestion-no-results">No se encontraron resultados para tu búsqueda</div>';
        } else {
            matches.slice(0, 6).forEach(match => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                
                let iconClass = 'fa-building';
                let typeClass = 'casa';

                if(match.constructor.name === 'Casa') { iconClass = 'fa-house'; typeClass = 'casa'; }
                if(match.constructor.name === 'Terreno') { iconClass = 'fa-map'; typeClass = 'terreno'; }
                if(match.constructor.name === 'LocalComercial') { iconClass = 'fa-shop'; typeClass = 'local'; }
                if(match.constructor.name === 'Departamento') { iconClass = 'fa-building'; typeClass = 'casa'; }

                item.innerHTML = `
                    <div class="suggestion-icon-circle ${typeClass}">
                        <i class="fa-solid ${iconClass}"></i>
                    </div>
                    <div class="suggestion-details">
                        <span class="suggestion-title">${match.titulo}</span>
                        <span class="suggestion-subtitle">${match.municipio}, ${match.estado} - $${match.precio.toLocaleString()}</span>
                    </div>
                `;
                
                item.addEventListener('click', () => {
                    searchSuggestions.classList.remove('active');
                    if (clearSearch) clearSearch.style.display = 'block';
                    
                    // Navegación directa a la página de detalles
                    window.location.href = 'propiedad.html#' + match.id;
                });
                searchSuggestions.appendChild(item);
            });
        }
        searchSuggestions.classList.add('active');
    }

    // Listeners Tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTransaction = tab.getAttribute('data-filter');
            fetchAndRender();
        });
    });

    // Listeners Radios
    radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentType = e.target.value;
            fetchAndRender();
        });
    });

    // Detectar filtros iniciales
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) {
        currentTransaction = activeTab.getAttribute('data-filter');
    }

    const checkedRadio = document.querySelector('input[name="tipo"]:checked');
    if (checkedRadio) {
        currentType = checkedRadio.value;
    }

    // Navegación tipo SPA (Vistas Dinámicas)
    const navLinks = document.querySelectorAll('.nav-links a');
    const vistas = document.querySelectorAll('.vista');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Prevenir comportamiento de ancla predeterminado
            e.preventDefault();

            // Quitar clase active de todos los links
            navLinks.forEach(l => l.classList.remove('active'));
            // Agregar clase active al link clickeado
            link.classList.add('active');

            // Ocultar todas las vistas
            vistas.forEach(vista => vista.classList.remove('active'));

            // Mostrar la vista correspondiente al href
            const targetId = link.getAttribute('href').replace('#', 'vista-');
            const targetVista = document.getElementById(targetId);
            if (targetVista) {
                targetVista.classList.add('active');
                
                // Si la vista es la de propiedades, asegurarnos de que el render inicial funciona si no se había hecho
                if(targetId === 'vista-propiedades') {
                    fetchAndRender();
                }
            }
        });
    });

    // Render inicial
    fetchAndRender();

    // Lógica para el botón de Log in de Admin
    const btnLoginAdmin = document.getElementById('btnLoginAdmin');
    if (btnLoginAdmin) {
        btnLoginAdmin.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Solicitar usuario y contraseña
            const usuario = prompt("Ingresa el usuario administrador:");
            if (usuario === null) return; // Cancelado
            
            const password = prompt("Ingresa la contraseña:");
            if (password === null) return; // Cancelado

            // Validación simple (Frontend-only)
            if (usuario === 'admin' && password === 'cameci2026') {
                window.location.href = 'admin.html';
            } else {
                if (typeof showToast === 'function') {
                    showToast('Credenciales incorrectas.', 'error');
                } else {
                    alert('Credenciales incorrectas.');
                }
            }
        });
    }

    // Lógica para enviar mensajes de contacto
    const contactForm = document.getElementById('contactForm');
    const toastContainer = document.getElementById('toastContainer');

    if (contactForm && toastContainer) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            // Cambiar estado a enviando
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

            const formData = new FormData(contactForm);
            const payload = {
                nombre: formData.get('nombre'),
                telefono: formData.get('telefono'),
                correo: formData.get('correo'),
                servicio: formData.get('servicio') || '',
                ubicacion: formData.get('ubicacion'),
                mensaje: formData.get('mensaje')
            };

            try {
                const response = await fetch(`${API_BASE}/api/mensajes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    showToast('¡Mensaje enviado con éxito!', 'success');
                    contactForm.reset();
                } else {
                    showToast('No se pudo enviar el mensaje. Intenta de nuevo.', 'error');
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                showToast('Error de conexión con el servidor.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    function showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i>
            <span>${message}</span>
        `;
        toastContainer.appendChild(toast);

        // Disparar animación
        setTimeout(() => toast.classList.add('show'), 50);

        // Remover después de 4 segundos
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }
});

