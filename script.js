// ==========================================
// CONFIGURACIÓN DE TU BASE DE DATOS EN VIVO
// ==========================================
const CARGAR_DESDE_SHEET = true; 

// ¡Tu ID real ya está colocado aquí adentro!
const ID_MI_HOJA = "19X6Xr0LI0tWDmYph0Vzv2cmx9FWIsL7HXfjP-3JJTDo"; 
const URL_GOOGLE_SHEET_CSV = `https://docs.google.com/spreadsheets/d/${ID_MI_HOJA}/gviz/tq?tqx=out:csv`;

// 1. CONTROL DE INTERACTIVIDAD PARA MÓVILES (BOTÓN HAMBURGUESA)
const btnMenu = document.getElementById('btn-menu');
const listaMenu = document.getElementById('lista-menu');

if (btnMenu && listaMenu) {
    btnMenu.addEventListener('click', () => {
        listaMenu.classList.toggle('mostrar');
    });
}

let listadoProductos = [];

// 2. FUNCIÓN PARA DIBUJAR LAS TARJETAS EN EL HTML
function renderizarCatalogo(productos) {
    const contenedor = document.getElementById('contenedor-productos-dinamicos');
    
    if (contenedor) {
        if (productos.length === 0) {
            contenedor.innerHTML = '<p style="text-align: center; color: #777; width: 100%;">No hay productos cargados en este momento.</p>';
            return;
        }

        contenedor.innerHTML = ""; 
        
        productos.forEach(item => {
            const claseSinStock = item.disponible ? "" : "sin-stock";
            const textoBoton = item.disponible ? "Agregar" : "Sin Stock";
            const atributoDeshabilitado = item.disponible ? "" : "disabled";

            contenedor.innerHTML += `
                <div class="tarjeta-item ${claseSinStock}">
                    <div class="img-box">
                        <img src="${item.imagen}" alt="${item.nombre}">
                    </div>
                    <div class="detalles-item">
                        <h3>${item.nombre}</h3>
                        <p>${item.descripcion}</p>
                        <div class="compra-box">
                            <span class="costo">$${item.precio.toLocaleString('es-AR')}</span>
                            <button class="add-cart" ${atributoDeshabilitado} onclick="agregarAlCarrito('${item.nombre.replace(/'/g, "\\'")}', ${item.precio})">
                                ${textoBoton}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
    }
}

// 3. CONEXIÓN ASÍNCRONA CON TU GOOGLE SHEET
async function cargarDatosDesdeGoogle() {
    try {
        const respuesta = await fetch(URL_GOOGLE_SHEET_CSV);
        const datosTexto = await respuesta.text();
        
        const filas = datosTexto.split('\n').slice(1); 
        
        listadoProductos = filas.map(linea => {
            const columnas = linea.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.replace(/^"|"$/g, '').trim());
            
            if(columnas.length >= 5) {
                return {
                    nombre: columnas[0],
                    descripcion: columnas[1],
                    precio: parseFloat(columnas[2]) || 0,
                    disponible: columnas[3].toLowerCase() === 'si',
                    imagen: columnas[4]
                };
            }
            return null;
        }).filter(p => p !== null && p.nombre !== "");

        renderizarCatalogo(listadoProductos);
    } catch (error) {
        console.error("Error conectando a Google Sheets: ", error);
        document.getElementById('contenedor-productos-dinamicos').innerHTML = 
            '<p style="text-align: center; color: red; width: 100%;">Error al sincronizar el stock. Por favor, verifique la configuración.</p>';
    }
}

// 4. FUNCIONALIDAD DEL CARRITO DE COMPRAS
let carrito = [];

function agregarAlCarrito(nombre, precio) {
    carrito.push({ nombre: nombre, precio: precio });
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
        carrito.forEach(item => {
            total += item.precio;
            contenedorItems.innerHTML += `
                <div class="item-pedido">
                    <span>${item.nombre}</span>
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

window.onload = cargarDatosDesdeGoogle;