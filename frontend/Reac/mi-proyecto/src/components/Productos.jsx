import React, { useState, useEffect, useRef } from "react";
import { IconPlus } from "@tabler/icons-react";
import { COLORS, FONTS } from '../colors';
import CorteModal from './Cortes/CorteModal';
import CortesDrawer from './Cortes/CortesDrawer';

const DEFAULT_IMG = "https://via.placeholder.com/200x200?text=Sin+Imagen";

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [carouselCategorias, setCarouselCategorias] = useState([]); // [{categoria, IMG_P}]
  const [searchTerm, setSearchTerm] = useState("");
  const [currentImage, setCurrentImage] = useState(0);
  const [error, setError] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [agregarCantidadId, setAgregarCantidadId] = useState(null);
  const [cantidadAgregar, setCantidadAgregar] = useState(1);
  const [mostrarCorteModal, setMostrarCorteModal] = useState(false);
  const [mostrarCortesDrawer, setMostrarCortesDrawer] = useState(false);
  const [productoCorte, setProductoCorte] = useState(null);
  const [costoCorte, setCostoCorte] = useState(0);
    // Bloqueo por estado_cliente_id
    const [bloqueado, setBloqueado] = useState(false);
    const [mostrarAvisoEstado, setMostrarAvisoEstado] = useState(false);
    const [estadoClienteId, setEstadoClienteId] = useState(null);
  // Verificar si el cliente tiene estado_cliente_id para mostrar el aviso
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetch('http://localhost:5000/api/clientes/estado_cliente', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(j => {
          if (j.success && j.estado_cliente_id) {
            setMostrarAvisoEstado(true);
          } else {
            setMostrarAvisoEstado(false);
          }
        })
        .catch(() => setMostrarAvisoEstado(false));
    } else {
      setMostrarAvisoEstado(false);
    }
  }, []);
    // Al cargar, obtener el estado_cliente_id del cliente autenticado
    useEffect(() => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        fetch('http://localhost:5000/api/clientes/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            if (data && data.success && data.cliente) {
              setEstadoClienteId(data.cliente.estado_cliente_id);
              if (data.cliente.estado_cliente_id) {
                setBloqueado(true);
                setMostrarAvisoEstado(true);
              } else {
                setBloqueado(false);
                setMostrarAvisoEstado(false);
              }
            }
          })
          .catch(() => {
            setBloqueado(false);
            setMostrarAvisoEstado(false);
          });
      } else {
        setBloqueado(false);
        setMostrarAvisoEstado(false);
      }
    }, []);
  const [estadoPedido, setEstadoPedido] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const cantidadBoxRef = useRef(null);

  useEffect(() => {
  fetch("http://localhost:5000/api/productos")
      .then(async (res) => {
        if (!res.ok) {
          setError("Error de red o backend: " + res.status);
          return;
        }
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          console.log("JSON recibido:", data); // <-- LOG IMPORTANTE
          setProductos(data);
          // Extraer solo las primeras 3 categorías distintas con imagen válida
          const catMap = {};
          data.forEach((p) => {
            if (
              p.categoria &&
              p.IMG_P &&
              typeof p.IMG_P === "string" &&
              p.IMG_P.trim() !== ""
            ) {
              if (!catMap[p.categoria]) catMap[p.categoria] = p.IMG_P;
            }
          });
          // Tomar solo las primeras 3 categorías
          const cats = Object.entries(catMap)
            .slice(0, 3)
            .map(([categoria, IMG_P]) => ({ categoria, IMG_P }));
          setCarouselCategorias(cats);
        } catch (e) {
          setError("No se pudo cargar productos reales. Error de parseo JSON.");
          console.error("Error parseando JSON:", text, e);
        }
      })
      .catch((err) => {
        setError("No se pudo conectar con el servidor de productos.");
        console.error("Error de red:", err);
      });
  }, []);

  useEffect(() => {
    fetch('/api/cortes/config')
      .then((r) => r.json())
      .then((j) => {
        if (j?.success && typeof j.costo_corte === 'number') {
          setCostoCorte(j.costo_corte);
        }
      })
      .catch(() => {});
  }, []);

  // Chequear al cargar si existe algún pedido pendiente para mostrar el banner de inmediato
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const clienteId = localStorage.getItem('cliente_id');
        if (token && clienteId) {
          const pr = await fetch(`http://localhost:5000/api/pedidos/${clienteId}`, { headers: { 'Authorization': `Bearer ${token}` } });
          const pj = await pr.json().catch(() => null);
          if (pr.ok && pj?.success) {
            const pedidos = Array.isArray(pj.pedidos) ? pj.pedidos : [];
            const pendiente = pedidos.find(p => (p?.estado || '').toLowerCase() !== 'listo');
            setEstadoPedido(pendiente?.estado || null);
            setBloqueado(Boolean(pendiente));
          }
        }
      } catch {}
    })();
  }, []);

  // Si se activa el bloqueo, cerrar cualquier popover abierto
  useEffect(() => {
    if (bloqueado) {
      setAgregarCantidadId(null);
    }
  }, [bloqueado]);

  // Carrusel automático
  useEffect(() => {
    if (carouselCategorias.length > 0 && !categoriaSeleccionada) {
      const timer = setTimeout(() => {
        setCurrentImage((currentImage + 1) % carouselCategorias.length);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [currentImage, carouselCategorias.length, categoriaSeleccionada]);

  // Cuando selecciono una categoría, la pongo al frente del carrusel
  useEffect(() => {
    if (categoriaSeleccionada && carouselCategorias.length > 0) {
      const idx = carouselCategorias.findIndex(
        (cat) => cat.categoria === categoriaSeleccionada
      );
      if (idx !== -1) setCurrentImage(idx);
    }
  }, [categoriaSeleccionada, carouselCategorias]);
  // Filtrado de productos por nombre o categoría
  let productosFiltrados = productos;
  if (categoriaSeleccionada) {
    productosFiltrados = productos.filter(
      (p) => p.categoria === categoriaSeleccionada
    );
  } else {
    productosFiltrados = productos.filter(
      (p) =>
        (p.nombre && p.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.categoria &&
          p.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  const esCorteCategoria = (producto) => {
    const cat = (producto?.categoria || '').toUpperCase();
    return cat.includes('VIDRIO') || cat.includes('ALUMINIO');
  };

  const abrirCorteModal = (producto) => {
    setProductoCorte(producto);
    setMostrarCorteModal(true);
    setAgregarCantidadId(null);
  };

  const agregarPlanchaAlCarrito = (producto, cantidad) => {
    // Usar sessionStorage directamente (mismo patrón que Carrito.jsx)
    const carritoGuardado = sessionStorage.getItem('carritoLocal');
    let carritoLocal = [];
    if (carritoGuardado) {
      try {
        carritoLocal = JSON.parse(carritoGuardado) || [];
      } catch {
        carritoLocal = [];
      }
    }

    const producto_id = producto.id_producto || producto.id;
    const precio = Number(producto.precio_unitario || 0);
    const cant = Number(cantidad);

    // Verificar si ya existe el producto en el carrito
    const idx = carritoLocal.findIndex(
      (item) => (item.id_producto || item.id) === producto_id && item.tipo_venta === 'plancha'
    );

    if (idx !== -1) {
      // Actualizar cantidad
      carritoLocal[idx].cantidad += cant;
      carritoLocal[idx].subtotal = carritoLocal[idx].cantidad * precio;
    } else {
      // Agregar nuevo item
      const item = {
        ...producto,
        tipo_venta: 'plancha',
        cantidad: cant,
        precio_unitario: precio,
        subtotal: cant * precio
      };
      carritoLocal.push(item);
    }

    sessionStorage.setItem('carritoLocal', JSON.stringify(carritoLocal));
    alert('Producto agregado al carrito');
    setAgregarCantidadId(null);
  };

  const agregarCorteAlCarrito = ({ cortes, total }) => {
    if (!productoCorte) return;
    const carritoGuardado = sessionStorage.getItem('carritoLocal');
    let carritoLocal = [];
    if (carritoGuardado) {
      try {
        carritoLocal = JSON.parse(carritoGuardado) || [];
      } catch {
        carritoLocal = [];
      }
    }

    const item = {
      ...productoCorte,
      tipo_venta: 'corte',
      cortes: cortes || [],
      precio_unitario: Number(total || 0),
      subtotal: Number(total || 0),
      cantidad: 1,
      descripcion: 'Cortes personalizados'
    };

    const nuevoCarrito = [...carritoLocal, item];
    sessionStorage.setItem('carritoLocal', JSON.stringify(nuevoCarrito));
    setMensaje('Cortes agregados al carrito');
    setMostrarCortesDrawer(false);
    setProductoCorte(null);
  };

  if (productoSeleccionado) {
    return (
      <div className="container mx-auto p-4">
        <button
          onClick={() => setProductoSeleccionado(null)}
          className="mb-4 hover:underline"
          style={{ color: COLORS.info }}
        >
          &larr; Volver a Productos
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <img
              src={
                productoSeleccionado.IMG_P &&
                productoSeleccionado.IMG_P.startsWith("http")
                  ? productoSeleccionado.IMG_P
                  : DEFAULT_IMG
              }
              alt={productoSeleccionado.nombre}
              className="w-full h-auto object-cover rounded-lg shadow-lg"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="font-heading text-3xl font-bold mb-4">
              {productoSeleccionado.nombre}
            </h2>
            <p className="font-body text-gray-700 mb-2">
              {productoSeleccionado.descripcion}
            </p>
            <p className="font-body font-semibold mb-2 text-lg" style={{ color: COLORS.info }}>
              Precio unitario: ${productoSeleccionado.precio_unitario}
            </p>
            <p className="font-body mb-1" style={{ color: COLORS.textLight }}>
              Código: {productoSeleccionado.codigo}
            </p>
            <p className="font-body mb-1" style={{ color: COLORS.textLight }}>
              Cantidad: {productoSeleccionado.cantidad}
            </p>
            <p className="font-body mb-1" style={{ color: COLORS.textLight }}>
              Grosor: {productoSeleccionado.grosor}
            </p>
            <p className="font-body mb-1" style={{ color: COLORS.textLight }}>
              Almacén ID: {productoSeleccionado.almacen_id}
            </p>
            <p className="font-body mb-1" style={{ color: COLORS.textLight }}>
              Stock ID: {productoSeleccionado.stock_id}
            </p>
            <p className="font-body mb-1" style={{ color: COLORS.textLight }}>
              Categoría: {productoSeleccionado.categoria}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {mostrarCorteModal && (
        <CorteModal
          producto={productoCorte}
          onSelectPlancha={() => {
            setMostrarCorteModal(false);
            if (productoCorte) {
              agregarPlanchaAlCarrito(productoCorte, cantidadAgregar);
            }
          }}
          onSelectCorte={() => {
            setMostrarCorteModal(false);
            setMostrarCortesDrawer(true);
          }}
          onClose={() => {
            setMostrarCorteModal(false);
            setProductoCorte(null);
          }}
        />
      )}

      {mostrarCortesDrawer && (
        <CortesDrawer
          producto={productoCorte}
          costoCorte={costoCorte}
          onConfirm={agregarCorteAlCarrito}
          onClose={() => {
            setMostrarCortesDrawer(false);
            setProductoCorte(null);
          }}
        />
      )}
      {/* Carrusel y botón van primero */}
      {/* Carrusel tipo coverflow por categoría */}
      {/* Carrusel de categorías solo arriba */}
      {carouselCategorias.length === 0 && !error && (
        <div className="text-center mb-4" style={{ color: COLORS.warning }}>
          No hay categorías con imágenes para mostrar en el carrusel.
        </div>
      )}
      {carouselCategorias.length > 0 && (
        <div className="relative mb-8 mt-8 flex justify-center items-center h-72">
          <button
            onClick={() => {
              if (!categoriaSeleccionada)
                setCurrentImage(
                  currentImage === 0
                    ? carouselCategorias.length - 1
                    : currentImage - 1
                );
            }}
            className={`absolute left-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md z-10 ${
              categoriaSeleccionada ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={!!categoriaSeleccionada}
          >
            &#10094;
          </button>
          <div className="flex items-center justify-center w-full h-full">
            {carouselCategorias.map((cat, idx) => {
              // Coverflow: la imagen central es grande, las laterales pequeñas y desplazadas
              const isActive = idx === currentImage;
              const isPrev =
                idx === (currentImage === 0 ? carouselCategorias.length - 1 : currentImage - 1);
              const isNext =
                idx === (currentImage === carouselCategorias.length - 1 ? 0 : currentImage + 1);
              const isSelected = categoriaSeleccionada === cat.categoria;
              return (
                <div
                  key={cat.categoria}
                  className={`transition-all duration-500 cursor-pointer ${
                    isActive ? "z-20 scale-110 shadow-2xl" : "z-10 scale-90 opacity-60"
                  } ${isPrev || isNext ? "mx-[-40px]" : "hidden md:block mx-[-60px]"} ${
                    isActive || isPrev || isNext ? "block" : "hidden"
                  } ${isSelected ? "ring-4 ring-blue-400" : ""}`}
                  style={{ position: "relative" }}
                  onClick={() => setCategoriaSeleccionada(cat.categoria)}
                >
                  <img
                    src={
                      cat.IMG_P && cat.IMG_P.startsWith("http")
                        ? cat.IMG_P
                        : DEFAULT_IMG
                    }
                    alt={cat.categoria}
                    className="rounded-lg object-cover h-72 w-72 border-4 border-white shadow-lg"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_IMG;
                    }}
                  />
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white bg-opacity-80 px-3 py-1 rounded text-center text-sm font-bold font-heading">
                    {cat.categoria}
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => {
              if (!categoriaSeleccionada)
                setCurrentImage((currentImage + 1) % carouselCategorias.length);
            }}
            className={`absolute right-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md z-10 ${
              categoriaSeleccionada ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={!!categoriaSeleccionada}
          >
            &#10095;
          </button>
        </div>
      )}
      {categoriaSeleccionada && (
        <div className="mb-4 flex justify-center">
          <button
            onClick={() => setCategoriaSeleccionada(null)}
            className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600"
          >
            Ver todas las categorías
          </button>
        </div>
      )}

      {/* Buscador visual igual que Proyectos */}
      <div className="mb-8 relative max-w-md mx-auto">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Buscar productos o categoría..."
          className="w-full p-2 pl-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ borderColor: COLORS.border }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Mensaje de error o vacío */}
      {error && <div className="text-center mb-4" style={{ color: COLORS.error }}>{error}</div>}

      {/* Aviso de pedido pendiente global en productos */}
      {bloqueado && mostrarAvisoEstado && (
        <div className="text-center mb-4 rounded px-3 py-2 border" style={{ color: COLORS.warning, backgroundColor: COLORS.backgroundLight, borderColor: COLORS.warning }}>
          Termina tu pedido pendiente.
        </div>
      )}

      {/* Carrusel tipo coverflow por categoría (solo una vez, arriba) */}
      {/* Botón solo arriba, no debajo del buscador */}

      {/* Lista de productos filtrados */}
      {productosFiltrados.length === 0 && !error && (
        <div className="text-center text-gray-500">No hay productos para mostrar.</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {productosFiltrados.map((producto) => {
          // Usar un id único para cada producto
          const productoId = producto.id || producto.id_producto || producto.codigo;
          return (
            <div key={productoId} className="border rounded shadow p-4 flex flex-col items-center relative bg-white" style={{ borderColor: COLORS.border }}>
              <div className="relative w-full flex flex-col items-center">
                <img
                  src={producto.IMG_P && producto.IMG_P.startsWith('http') ? producto.IMG_P : DEFAULT_IMG}
                  alt={producto.nombre}
                  className="w-32 h-32 object-cover mb-2 rounded"
                  onError={e => { e.target.onerror = null; e.target.src = DEFAULT_IMG; }}
                />
                {/* Icono suma en esquina inferior izquierda sobre la imagen */}
                {/* Solo mostrar el botón + y el popover si NO está bloqueado por estado_cliente_id */}
                {!(bloqueado && mostrarAvisoEstado) && (
                  <>
                    <button
                      className="absolute left-2 bottom-2 bg-white border shadow rounded-full p-1 hover:bg-blue-100 z-10"
                      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderColor: COLORS.border }}
                      onClick={e => {
                        e.stopPropagation();
                        // Si es VIDRIO o ALUMINIO, abrir modal de cortes
                        if (esCorteCategoria(producto)) {
                          abrirCorteModal(producto);
                        } else {
                          // Si no, abrir popover normal
                          setAgregarCantidadId(productoId);
                          setCantidadAgregar(1);
                        }
                      }}
                    >
                      <IconPlus stroke={1.5} size={22} />
                    </button>
                    {/* Popover tipo globo solo en la tarjeta seleccionada */}
                    {agregarCantidadId === productoId && (
                      <div ref={cantidadBoxRef} className="absolute left-1/2 bottom-14 -translate-x-1/2 bg-white border shadow-lg rounded-lg z-30 p-3 flex flex-col items-center min-w-[170px]" style={{ minWidth:'170px', borderColor: COLORS.border }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-heading font-semibold text-sm">CANTIDAD:</span>
                          <input
                            type="number"
                            min={1}
                            value={cantidadAgregar}
                            onChange={e => setCantidadAgregar(e.target.value)}
                            className="p-1 border rounded w-14 text-center text-sm"
                            autoFocus
                          />
                        </div>
                        <span className="text-xs mb-2" style={{ color: COLORS.success }}>HAY SUFICIENTE STOCK</span>
                        <div className="flex gap-2">
                          <button
                            className="text-white px-3 py-1 rounded text-xs font-semibold"
                            style={{ backgroundColor: COLORS.success }}
                            onClick={() => {
                              agregarPlanchaAlCarrito(producto, cantidadAgregar);
                            }}
                          >Agregar al carrito</button>
                          <button
                            className="text-white px-2 py-1 rounded text-xs font-semibold"
                            style={{ backgroundColor: COLORS.gray[500] }}
                            onClick={() => setAgregarCantidadId(null)}
                          >Cancelar</button>
                        </div>
                        {/* Flecha tipo globo */}
                        <div className="absolute left-6 -bottom-3 w-4 h-4 overflow-hidden">
                          <div className="w-4 h-4 bg-white border-l border-b border-gray-300 rotate-45 transform origin-top-left shadow-lg"></div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              {/* Nombre y descripción debajo de la imagen */}
              <div className="w-full flex flex-col items-start mt-2">
                <div className="font-heading font-bold text-base text-left">{producto.nombre}</div>
                <div className="flex w-full items-end justify-between mt-1">
                  <div className="font-body text-sm mb-1 truncate max-w-[70%]" style={{ color: COLORS.textLight }}>{producto.descripcion}</div>
                  <span className="font-semibold text-base ml-2" style={{ color: COLORS.info }}>{producto.precio_unitario ? `$${producto.precio_unitario}` : ''}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal para elegir plancha o cortes */}
      {mostrarCorteModal && productoCorte && (
        <CorteModal
          producto={productoCorte}
          onClose={() => {
            setMostrarCorteModal(false);
            setProductoCorte(null);
          }}
          onSelectPlancha={(cantidad) => {
            agregarPlanchaAlCarrito(productoCorte, cantidad);
            setMostrarCorteModal(false);
            setProductoCorte(null);
          }}
          onSelectCorte={() => {
            setMostrarCorteModal(false);
            setMostrarCortesDrawer(true);
          }}
        />
      )}

      {/* Drawer para ingresar cortes */}
      {mostrarCortesDrawer && productoCorte && (
        <CortesDrawer
          producto={productoCorte}
          costoCorte={costoCorte}
          onClose={() => {
            setMostrarCortesDrawer(false);
            setProductoCorte(null);
          }}
          onConfirm={(data) => {
            agregarCorteAlCarrito(data);
          }}
        />
      )}
    </div>
  );
};

export default Productos;

