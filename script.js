// ==========================================================================
// CONFIGURACIÓN DE TU BASE DE DATOS EN VIVO (MERCADO EL PATIO)
// ==========================================================================
const CARGAR_DESDE_SHEET = true; 
const ID_MI_HOJA = "19X6Xr0LI0tWDmYph0Vzv2cmx9FWIsL7HXfjP-3JJTDo"; 
// Cambiamos a la ruta oficial de exportación de Google (más estable y rápida)
const URL_GOOGLE_SHEET_CSV = `https://docs.google.com/spreadsheets/d/${ID_MI_HOJA}/export?format=csv&gid=0`;

// ==========================================================================
// 1. CONTROL DE INTERACTIVIDAD PARA MÓVILES (BOTÓN HAMBURGUESA)
// ==========================================================================
const btnMenu = document.getElementById('btn-menu');
const listaMenu = document.getElementById('lista-menu');

if (btnMenu && listaMenu) {
    btnMenu.addEventListener('click', () => {
        listaMenu.classList.toggle('mostrar');
    });
}

let listadoProductos = [];

// ==========================================================================
// 2. FUNCIÓN PARA DIBUJAR LAS TARJETAS EN EL HTML
// ==========================================================================
function renderizarCatalogo(productos) {
    const contenedor = document.getElementById('contenedor-productos-dinamicos');
    
    if (contenedor) {
        if (productos.length === 0) {
            contenedor.innerHTML = '<p style="text-align: center; color: #777; width: 100%; margin: 40px 0; font-family: sans-serif;">No hay productos disponibles en esta categoría en este momento.</p>';
            return;
        }

        contenedor.innerHTML = ""; 
        
        productos.forEach((item) => {
            const claseSinStock = item.disponible ? "" : "sin-stock";
            const textoBoton = item.disponible ? "Agregar" : "Sin Stock";
            const atributoDeshabilitado = item.disponible ? "" : "disabled";

            const indiceAbsoluto = listadoProductos.indexOf(item);

            contenedor.innerHTML += `
                <div class="tarjeta-item ${claseSinStock}">
                    <div class="img-box">
                        <img src="${item.imagen}" alt="${item.nombre}" onerror="this.src='https://placehold.co/150x160?text=Sin+Foto'">
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
                </div>
            `;
        });
    }
}

// ==========================================================================
// 3. CONEXIÓN CON GOOGLE SHEETS (LECTOR BLINDADO MULTI-FORMATO)
// ==========================================================================
async function cargarDatosDesdeGoogle() {
    try {
        const respuesta = await fetch(URL_GOOGLE_SHEET_CSV);
        if (!respuesta.ok) throw new Error("Error de permisos en el enlace de Google.");
        
        const datosTexto = await respuesta.text();
        const filas = datosTexto.split('\n'); 
        
        // Detecta automáticamente si tu Google Sheet exportó con comas o puntos y comas
        const separador = filas[0].includes(';') ? ';' : ',';
        
        // Quitamos el encabezado y procesamos los datos
        listadoProductos = filas.slice(1).map(linea => {
            if (!linea.trim()) return null; 
            
            let columnas = [];
            let valor = "";
            let comillas = false;
            
            // Lógica experta para cortar celdas sin romper textos descriptivos
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
            
            // Verificamos que tenga al menos el nombre y el código
            if(columnas.length >= 2 && columnas[1] !== "") {
                const rawDisponible = columnas[4] ? columnas[4].toLowerCase() : "si";
                
                return {
                    codigo: columnas[0] || "",
                    nombre: columnas[1] || "",
                    descripcion: columnas[2] || "",
                    precio: parseFloat(columnas[3] ? columnas[3].replace(',', '.') : 0) || 0,
                    disponible: (rawDisponible.includes('si') || rawDisponible.includes('sí')),
                    imagen: columnas[5] || ""
                };
            }
            return null;
        }).filter(p => p !== null);

        renderizarCatalogo(listadoProductos);
        
    } catch (error) {
        console.error("Error conectando a Google Sheets: ", error);
        document.getElementById('contenedor-productos-dinamicos').innerHTML = 
            `<div style="text-align: center; color: #dc3545; width: 100%; margin: 40px 0; padding: 20px; border: 1px solid #f5c6cb; border-radius: 8px; background: #f8d7da;">
                <b>No se pudo cargar el catálogo.</b><br><br>
                Asegurate de ir a tu Google Sheet, hacer clic en <b>Archivo > Compartir > Publicar en la web</b> y verificar que esté publicado.<br><br>
                <small style="color: #721c24;">Detalle técnico para soporte: ${error.message}</small>
            </div>`;
    }
}

// ==========================================================================
// 4. FUNCIONALIDAD DEL CARRITO DE COMPRAS
// ==========================================================================
let carrito = [];

function presionarAgregar(indiceCatalogo) {
    const productoSeleccionado = listadoProductos[indiceCatalogo];
    if (productoSeleccionado) {
        carrito.push({ 
            nombre: productoSeleccionado.nombre, 
            precio: productoSeleccionado.precio 
        });
        actualizarInterfazCarrito();
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
    
    if (carrito.length === 0) {
        if (contenedorItems) contenedorItems.innerHTML = '<p style="color:#777; text-align:center; padding:15px;">El carrito está vacío.</p>';
        if (contenedorTotal) contenedorTotal.innerText = "$0";
        return;
    }

    if (contenedorItems) {
        contenedorItems.innerHTML = "";
        let total = 0;
        
        carrito.forEach((item, index) => {
            total += item.precio;
            contenedorItems.innerHTML += `
                <div class="item-pedido">
                    <div class="info-izquierda-carrito">
                        <button class="btn-eliminar-item" onclick="eliminarDelCarrito(${index})" title="Eliminar producto">✕</button>
                        <span>${item.nombre}</span>
                    </div>
                    <strong>$${item.precio.toLocaleString('es-AR')}</strong>
                </div>
            `;
        });
        if (contenedorTotal) contenedorTotal.innerText = `$${total.toLocaleString('es-AR')}`;
    }
}

function alternarModalCarrito() {
    const modal = document.getElementById('modal-carrito');
    if (modal) {
        modal.style.display = (modal.style.display === "block") ? "none" : "block";
    }
}

// ==========================================================================
// 5. ENVÍO DE PEDIDO CONFIGURADO PARA WHATSAPP
// ==========================================================================
function enviarPedidoWhatsApp() {
    if (carrito.length === 0) return;
    
    let numeroTelefono = "5492634378544"; 
    let mensaje = "¡Hola Mercado El Patio! Me gustaría encargar el siguiente pedido:\n\n";
    let total = 0;

    carrito.forEach(item => {
        mensaje += `- ${item.nombre} ($${item.precio.toLocaleString('es-AR')})\n`;
        total += item.precio;
    });
    mensaje += `\n*Total pedido: $${total.toLocaleString('es-AR')}*`;
    window.open(`https://api.whatsapp.com/send?phone=${numeroTelefono}&text=${encodeURIComponent(mensaje)}`, '_blank');
}

// ==========================================================================
// 6. MOTOR DE FILTRADO INDEXADO POR CÓDIGO
// ==========================================================================
function filtrarPorCodigo(codigoCategoria) {
    if (codigoCategoria === 'todos') {
        renderizarCatalogo(listadoProductos);
        return;
    }

    const productosFiltrados = listadoProductos.filter(producto => {
        return String(producto.codigo).trim() === String(codigoCategoria).trim();
    });

    renderizarCatalogo(productosFiltrados);

    const listaMenu = document.getElementById('lista-menu');
    if (listaMenu) {
        listaMenu.classList.remove('mostrar');
    }
}

window.onload = cargarDatosDesdeGoogle;
