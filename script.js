// ==========================================================================
// CONFIGURACIÓN DE LA BASE DE DATOS EN VIVO (MERCADO EL PATIO)
// ==========================================================================
const CARGAR_DESDE_SHEET = true; 
const ID_MI_HOJA = "19X6Xr0LI0tWDmYph0Vzv2cmx9FWIsL7HXfjP-3JJTDo"; 
const URL_GOOGLE_SHEET_CSV = `https://docs.google.com/spreadsheets/d/${ID_MI_HOJA}/export?format=csv&gid=0`;

// ==========================================================================
// 1. MENÚ HAMBURGUESA PARA MÓVILES
// ==========================================================================
document.addEventListener('DOMContentLoaded', function() {
    const btnMenu = document.getElementById('btn-menu');
    const listaMenu = document.getElementById('lista-menu');

    if (btnMenu && listaMenu) {
        btnMenu.addEventListener('click', function() {
            listaMenu.classList.toggle('mostrar');
        });
    }

    // Cerrar modal al hacer clic fuera
    const modalCarrito = document.getElementById('modal-carrito');
    if (modalCarrito) {
        modalCarrito.addEventListener('click', function(e) {
            if (e.target === modalCarrito) {
                alternarModalCarrito();
            }
        });
    }
});

let listadoProductos = [];

// ==========================================================================
// 2. FUNCIÓN PARA DIBUJAR LAS TARJETAS EN EL HTML
// ==========================================================================
function renderizarCatalogo(productos) {
    const contenedor = document.getElementById('contenedor-productos-dinamicos');
    
    if (!contenedor) return;

    if (productos.length === 0) {
        contenedor.innerHTML = '<p style="text-align: center; color: #777; width: 100%; margin: 40px 0; font-family: sans-serif; grid-column: 1/-1;">No hay productos disponibles en esta categoría en este momento.</p>';
        return;
    }

    contenedor.innerHTML = ""; 
    
    productos.forEach(function(item) {
        const claseSinStock = item.disponible ? "" : "sin-stock";
        const textoBoton = item.disponible ? "Agregar al carrito" : "Sin Stock";
        const atributoDeshabilitado = item.disponible ? "" : "disabled";
        const indiceAbsoluto = listadoProductos.indexOf(item);

        const tarjeta = document.createElement('div');
        tarjeta.className = `tarjeta-item ${claseSinStock}`;
        tarjeta.innerHTML = `
            <div class="img-box">
                <img src="${item.imagen}" 
                     alt="${item.nombre}" 
                     loading="lazy"
                     onerror="this.src='https://placehold.co/150x160/f5f0eb/bc5a26?text=Sin+Foto'">
            </div>
            <div class="detalles-item">
                <h3>${item.nombre}</h3>
                <p>${item.descripcion}</p>
                <div class="compra-box">
                    <span class="costo">$${item.precio.toLocaleString('es-AR')}</span>
                    <button class="add-cart" ${atributoDeshabilitado} onclick="presionarAgregar(${indiceAbsoluto})">
                        ${textoBoton}
                    </button>
                </div>
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });
}

// ==========================================================================
// 3. CONEXIÓN CON GOOGLE SHEETS
// ==========================================================================
async function cargarDatosDesdeGoogle() {
    const contenedor = document.getElementById('contenedor-productos-dinamicos');
    
    try {
        const respuesta = await fetch(URL_GOOGLE_SHEET_CSV);
        if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}: Sin acceso a la hoja.`);
        
        const datosTexto = await respuesta.text();
        const filas = datosTexto.split('\n'); 
        
        // Detecta automáticamente si el CSV usa comas o puntos y comas
        const separador = filas[0].includes(';') ? ';' : ',';
        
        listadoProductos = filas.slice(1).map(function(linea) {
            if (!linea.trim()) return null; 
            
            let columnas = [];
            let valor = "";
            let comillas = false;
            
            for (let i = 0; i < linea.length; i++) {
                let char = linea[i];
                if (char === '"') {
                    comillas = !comillas;
                } else if (char === separador && !comillas) {
                    columnas.push(valor.trim());
                    valor = "";
                } else {
                    valor += char;
                }
            }
            columnas.push(valor.trim());
            
            if (columnas.length >= 2 && columnas[1] !== "") {
                const rawDisponible = columnas[4] ? columnas[4].toLowerCase().trim() : "si";
                
                return {
                    codigo: columnas[0] ? columnas[0].trim() : "",
                    nombre: columnas[1] ? columnas[1].trim() : "",
                    descripcion: columnas[2] ? columnas[2].trim() : "",
                    precio: parseFloat(columnas[3] ? columnas[3].replace(/[^\d.,]/g, '').replace(',', '.') : 0) || 0,
                    disponible: (rawDisponible.includes('si') || rawDisponible.includes('sí') || rawDisponible === '1' || rawDisponible === 'true'),
                    imagen: columnas[5] ? columnas[5].trim() : ""
                };
            }
            return null;
        }).filter(function(p) { return p !== null; });

        renderizarCatalogo(listadoProductos);
        
    } catch (error) {
        console.error("Error conectando a Google Sheets: ", error);
        if (contenedor) {
            contenedor.innerHTML = `
                <div style="text-align: center; color: #721c24; width: 100%; margin: 40px 0; padding: 25px; 
                            border: 1px solid #f5c6cb; border-radius: 8px; background: #f8d7da; grid-column: 1/-1;">
                    <b style="font-size: 16px;">⚠️ No se pudo cargar el catálogo</b><br><br>
                    Asegurate de ir a tu Google Sheet y publicarlo:<br>
                    <strong>Archivo → Compartir → Publicar en la web → Publicar</strong><br><br>
                    <small style="color: #856404;">Detalle técnico: ${error.message}</small>
                </div>`;
        }
    }
}

// ==========================================================================
// 4. CARRITO DE COMPRAS
// ==========================================================================
let carrito = [];

function presionarAgregar(indiceCatalogo) {
    const productoSeleccionado = listadoProductos[indiceCatalogo];
    if (productoSeleccionado && productoSeleccionado.disponible) {
        carrito.push({ 
            nombre: productoSeleccionado.nombre, 
            precio: productoSeleccionado.precio 
        });
        actualizarInterfazCarrito();
        
        // Feedback visual al agregar
        const tarjetas = document.querySelectorAll('.tarjeta-item');
        const tarjeta = tarjetas[indiceCatalogo];
        if (tarjeta) {
            tarjeta.style.outline = '2px solid #bc5a26';
            setTimeout(function() { tarjeta.style.outline = ''; }, 600);
        }
    }
}

function eliminarDelCarrito(indiceCarrito) {
    carrito.splice(indiceCarrito, 1); 
    actualizarInterfazCarrito(); 
}

function actualizarInterfazCarrito() {
    const contador = document.getElementById('contador-carrito');
    if (contador) contador.innerText = carrito.length;

    const contenedorItems = document.getElementById('items-carrito');
    const contenedorTotal = document.getElementById('precio-total');
    
    if (!contenedorItems) return;

    if (carrito.length === 0) {
        contenedorItems.innerHTML = '<p style="color:#999; text-align:center; padding:20px 0; font-style:italic;">El carrito está vacío.</p>';
        if (contenedorTotal) contenedorTotal.innerText = "$0";
        return;
    }

    contenedorItems.innerHTML = "";
    let total = 0;
    
    carrito.forEach(function(item, index) {
        total += item.precio;
        const div = document.createElement('div');
        div.className = 'item-pedido';
        div.innerHTML = `
            <div class="info-izquierda-carrito">
                <button class="btn-eliminar-item" onclick="eliminarDelCarrito(${index})" title="Eliminar">✕</button>
                <span>${item.nombre}</span>
            </div>
            <strong>$${item.precio.toLocaleString('es-AR')}</strong>
        `;
        contenedorItems.appendChild(div);
    });

    if (contenedorTotal) contenedorTotal.innerText = `$${total.toLocaleString('es-AR')}`;
}

function alternarModalCarrito() {
    const modal = document.getElementById('modal-carrito');
    if (modal) {
        if (modal.style.display === "block") {
            modal.style.display = "none";
        } else {
            modal.style.display = "block";
            actualizarInterfazCarrito();
        }
    }
}

// ==========================================================================
// 5. ENVÍO POR WHATSAPP
// ==========================================================================
function enviarPedidoWhatsApp() {
    if (carrito.length === 0) {
        alert("Tu carrito está vacío. ¡Agregá productos antes de enviar!");
        return;
    }
    
    const numeroTelefono = "5492634378544"; 
    let mensaje = "¡Hola Mercado El Patio! Me gustaría encargar el siguiente pedido:\n\n";
    let total = 0;

    carrito.forEach(function(item) {
        mensaje += `• ${item.nombre} — $${item.precio.toLocaleString('es-AR')}\n`;
        total += item.precio;
    });
    
    mensaje += `\n*Total estimado: $${total.toLocaleString('es-AR')}*`;
    mensaje += "\n\n_Por favor, confirmame disponibilidad y forma de entrega. ¡Gracias!_";
    
    window.open(`https://api.whatsapp.com/send?phone=${numeroTelefono}&text=${encodeURIComponent(mensaje)}`, '_blank');
}

// ==========================================================================
// 6. FILTRADO POR CATEGORÍA
// ==========================================================================
function filtrarPorCodigo(codigoCategoria) {
    // Scroll suave al catálogo
    const catalogo = document.getElementById('catalogo');
    if (catalogo) {
        catalogo.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (codigoCategoria === 'todos') {
        renderizarCatalogo(listadoProductos);
    } else {
        const productosFiltrados = listadoProductos.filter(function(producto) {
            return String(producto.codigo).trim() === String(codigoCategoria).trim();
        });
        renderizarCatalogo(productosFiltrados);
    }

    // Cerrar menú en móvil
    const listaMenu = document.getElementById('lista-menu');
    if (listaMenu) listaMenu.classList.remove('mostrar');
}

// ==========================================================================
// INICIO
// ==========================================================================
window.addEventListener('load', cargarDatosDesdeGoogle);
