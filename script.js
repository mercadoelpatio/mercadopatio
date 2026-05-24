// ==========================================================================
// CONFIGURACIÓN DE TU BASE DE DATOS EN VIVO (MERCADO EL PATIO)
// ==========================================================================
const CARGAR_DESDE_SHEET = true; 
const ID_MI_HOJA = "19X6Xr0LI0tWDmYph0Vzv2cmx9FWIsL7HXfjP-3JJTDo"; 
const NOMBRE_PESTANA = "Productos"; 
const URL_GOOGLE_SHEET_CSV = `https://docs.google.com/spreadsheets/d/${ID_MI_HOJA}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(NOMBRE_PESTANA)}`;

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

            // Buscamos el índice absoluto real dentro del listado original para no duplicar en el carrito
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
// 3. CONEXIÓN PRO BIENESTAR CON GOOGLE SHEETS (PARSER ULTRA SEGURO)
// ==========================================================================
async function cargarDatosDesdeGoogle() {
    try {
        const respuesta = await fetch(URL_GOOGLE_SHEET_CSV);
        if (!respuesta.ok) throw new Error("Error en la respuesta del servidor de Google");
        
        const datosTexto = await respuesta.text();
        const filas = datosTexto.split('\n').slice(1); 
        
        listadoProductos = filas.map(linea => {
            if (!linea.trim()) return null; // Ignora líneas vacías de estructura
            
            // Separador por comas respetando bloques entrecomillados largos
            const columnas = linea.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col ? col.replace(/^"|"$/g, '').trim() : "");
            
            // Control experto: Validamos que al menos exista la columna del Nombre (Índice 1)
            if(columnas.length > 1 && columnas[1] !== "") {
                const rawDisponible = columnas[4] ? columnas[4].replace(/["']/g, '').trim().toLowerCase() : "si";
                
                return {
                    codigo: columnas[0] || "",                               // Columna A (1)
                    nombre: columnas[1] || "",                               // Columna B (2)
                    descripcion: columnas[2] || "",                          // Columna C (3)
                    precio: parseFloat(columnas[3]) || 0,                    // Columna D (4)
                    disponible: (rawDisponible === 'si' || rawDisponible === 'sí'), // Columna E (5)
                    imagen: columnas[5] || ""                                // Columna F (6)
                };
            }
            return null;
        }).filter(p => p !== null);

        renderizarCatalogo(listadoProductos);
    } catch (error) {
        console.error("Error conectando a Google Sheets: ", error);
        document.getElementById('contenedor-productos-dinamicos').innerHTML = 
            '<p style="text-align: center; color: red; width: 100%; margin: 40px 0;">Error al sincronizar el catálogo vivo. Por favor, verifique el formato de su Google Sheet.</p>';
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
// 6. MOTOR DE FILTRADO INDEXADO POR CÓDIGO DE CATEGORÍA
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
