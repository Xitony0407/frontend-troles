import { useEffect, useState } from "react";
import "./App.css";
import Login from "./Login";
import Register from "./Register";
import AdminDashboard from "./AdminDashboard";

//const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"; 
const API_URL = "http://localhost:3000";

//"http://localhost:3000";

const coloresSabores = {
  Limón: "#b7e85f",
  Mango: "#ffb347",
  Fresa: "#ff6f91",
};

function App() {
  const [token, setToken] = useState(localStorage.getItem("access_token"));
  const [paginaAuth, setPaginaAuth] = useState("login");
  const [usuario, setUsuario] = useState(JSON.parse(localStorage.getItem("user")));

  const [sabores, setSabores] = useState([]);
  const [toppings, setToppings] = useState([]);
  const [productos, setProductos] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [carrito, setCarrito] = useState({ items: [], total_temporal: 0 }); // Nuevo estado carrito
  const [pagina, setPagina] = useState("inicio");

  const [filtroNombre, setFiltroNombre] = useState("");

  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [saborSeleccionado, setSaborSeleccionado] = useState(null);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState(null);
  const [toppingsSeleccionados, setToppingsSeleccionados] = useState([]);

  const [mensajePedido, setMensajePedido] = useState("");

  useEffect(() => {
    if (token) {
      obtenerDatos();
    }
  }, [token]);

  const obtenerDatos = async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const [resSabores, resToppings, resProductos, resMetodosPago, resOrdenes, resCarrito] = await Promise.all([
        fetch(`${API_URL}/sabores`, { headers }),
        fetch(`${API_URL}/toppings`, { headers }),
        fetch(`${API_URL}/productos-base`, { headers }),
        fetch(`${API_URL}/metodos-pago`, { headers }),
        fetch(`${API_URL}/ordenes`, { headers }),
        fetch(`${API_URL}/carritos/${usuario.id_usuario}`, { headers }) // Carga del carrito
    ]);

    setSabores(await resSabores.json());
    setToppings(await resToppings.json());
    setProductos(await resProductos.json());
    setMetodosPago(await resMetodosPago.json());
    setCarrito(await resCarrito.json()); // Guardar estado del carrito

    const todasLasOrdenes = await resOrdenes.json();
    const ordenesUsuario = todasLasOrdenes.filter(orden => {
      return Number(orden.usuario?.id_usuario) === Number(usuario?.id_usuario);
    });
    setOrdenes(ordenesUsuario);
  };

  const handleLoginSuccess = (token) => {
    setToken(token);
    setUsuario(JSON.parse(localStorage.getItem("user")));
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setToken(null);
    setUsuario(null);
    window.location.reload();
  };

  const toggleTopping = (topping) => {
    const existe = toppingsSeleccionados.find((item) => item.id_topping === topping.id_topping);
    if (existe) {
      setToppingsSeleccionados(toppingsSeleccionados.filter((item) => item.id_topping !== topping.id_topping));
    } else {
      setToppingsSeleccionados([...toppingsSeleccionados, topping]);
    }
  };

  const calcularTotal = () => {
    const precioProducto = productoSeleccionado ? Number(productoSeleccionado.precio_base) : 0;
    const precioToppings = toppingsSeleccionados.reduce((total, topping) => total + Number(topping.precio_extra), 0);
    return precioProducto + precioToppings;
  };

  const agregarAlCarrito = async () => {
    if (!productoSeleccionado || !saborSeleccionado || !metodoSeleccionado) {
      setMensajePedido("Selecciona producto, sabor y método de pago");
      return;
    }

    const item = {
      id_producto: productoSeleccionado.id_producto,
      nombre: productoSeleccionado.nombre,
      precio: calcularTotal(),
      id_sabor: saborSeleccionado.id_sabor,
      toppings: toppingsSeleccionados.map((t) => t.id_topping),
    };

    const respuesta = await fetch(`${API_URL}/carritos/agregar`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id_usuario: usuario.id_usuario, item }),
    });

    if (respuesta.ok) {
      const carritoActualizado = await respuesta.json();
      setCarrito(carritoActualizado);
      setMensajePedido("Agregado al carrito");
      // Limpiar selección
      setProductoSeleccionado(null);
      setSaborSeleccionado(null);
      setToppingsSeleccionados([]);
      setMetodoSeleccionado(null);
    } else {
      setMensajePedido("Error al agregar al carrito");
    }
  };

  const finalizarCompra = async () => {
    const detallesPedido = carrito.items.map(item => ({
      id_producto: item.id_producto,
      id_sabor: item.id_sabor,
      toppings: item.toppings || []
    }));

    const pedido = {
      id_usuario: usuario?.id_usuario || 1,
      id_metodo: 1, 
      nombre_cliente: usuario?.nombre || "Usuario",
      detalles: detallesPedido,
    };

    const respuesta = await fetch(`${API_URL}/ordenes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(pedido),
    });

    if (respuesta.ok) {
      const ordenCreada = await respuesta.json();
      const nuevaOrdenHistorial = { 
        ...ordenCreada, 
        usuario, 
        total_pagar: carrito.total_temporal,
        nombre_cliente: usuario?.nombre || "Usuario",
        estado: ordenCreada.estado || { descripcion: "Pendiente" }
      };
      setOrdenes([nuevaOrdenHistorial, ...ordenes]);

      setCarrito({ items: [], total_temporal: 0 });
      setMensajePedido("Compra finalizada con éxito");
      setPagina("historial"); 
    } else {
      setMensajePedido("Error al finalizar compra");
    }
  };

  const ordenesFiltradas = ordenes.filter((orden) => {
    const nombre = orden.nombre_cliente || orden.usuario?.nombre || "";
    return nombre.toLowerCase().includes(filtroNombre.toLowerCase());
  });

  const colorTrol = saborSeleccionado ? coloresSabores[saborSeleccionado.nombre] || "#d6f0ff" : "#eeeeee";
  const isAdmin = usuario?.rol?.nombre === "Admin";

  if (!token) {
    if (paginaAuth === "register") return <Register onNavigateToLogin={() => setPaginaAuth("login")} />;
    return <Login onLogin={handleLoginSuccess} onNavigateToRegister={() => setPaginaAuth("register")} />;
  }

  return (
    <div className="app">
      <h1>Arma tu Trol</h1>
      <p>Selecciona tu tamaño, sabor y toppings favoritos</p>
      <div className="nav">
        <button onClick={() => setPagina("inicio")}>Armar pedido</button>
        <button onClick={() => setPagina("carrito")} style={{ background: "#f97316" }}>🛒 Carrito ({carrito.items.length})</button>
        <button onClick={() => setPagina("historial")}>Ver historial</button>
        {isAdmin && <button onClick={() => setPagina("admin")} style={{ background: "#5a3d2b" }}>Panel Admin</button>}
        <button onClick={handleLogout} style={{ background: "#ff4d6d", color: "white" }}>Cerrar sesión</button>
      </div>

      {pagina === "inicio" && (
        <div className="layout">
          <div className="panel">
            <section className="card"><h2>1. Elige tu trol</h2><div className="grid">{productos.map(p => <button key={p.id_producto} className={productoSeleccionado?.id_producto === p.id_producto ? "selected" : ""} onClick={() => setProductoSeleccionado(p)}><strong>{p.nombre}</strong><span>${p.precio_base}</span></button>)}</div></section>
            <section className="card"><h2>2. Elige el sabor</h2><div className="grid">{sabores.map(s => <button key={s.id_sabor} className={saborSeleccionado?.id_sabor === s.id_sabor ? "selected" : ""} onClick={() => setSaborSeleccionado(s)}>{s.nombre}</button>)}</div></section>
            <section className="card"><h2>3. Agrega toppings</h2><div className="grid">{toppings.map(t => <button key={t.id_topping} className={toppingsSeleccionados.some(i => i.id_topping === t.id_topping) ? "selected" : ""} onClick={() => toggleTopping(t)}><strong>{t.nombre}</strong><span>+ ${t.precio_extra}</span></button>)}</div></section>
            <section className="card"><h2>4. Método de pago</h2><div className="grid">{metodosPago.map(m => <button key={m.id_metodo} className={metodoSeleccionado?.id_metodo === m.id_metodo ? "selected" : ""} onClick={() => setMetodoSeleccionado(m)}>{m.nombre}</button>)}</div></section>
          </div>
          <div className="preview">
            <h2>Vista de tu trol</h2>
            <div className="trol"><div className="vaso"><div className="hielo" style={{ background: colorTrol }}>{toppingsSeleccionados.map((t, i) => <span key={t.id_topping} className={`topping topping-${i}`}>{t.nombre === "Panditas" ? "🐻" : t.nombre === "Chile En Polvo" ? "🌶️" : t.nombre === "Tiburones" ? "🦈" : "🍬"}</span>)}</div></div><div className="popote"></div></div>
            <div className="resumen">
              <p><strong>Cliente:</strong> {usuario?.nombre || "Usuario"}</p>
              <p><strong>Producto:</strong> {productoSeleccionado?.nombre || "No seleccionado"}</p>
              <p><strong>Sabor:</strong> {saborSeleccionado?.nombre || "No seleccionado"}</p>
              <p><strong>Toppings:</strong> {toppingsSeleccionados.length > 0 ? toppingsSeleccionados.map(t => t.nombre).join(", ") : "Ninguno"}</p>
              <p><strong>Método de pago:</strong> {metodoSeleccionado?.nombre || "No seleccionado"}</p>
              <h3>Total: ${calcularTotal().toFixed(2)}</h3>
              <button className="btn-confirmar" onClick={agregarAlCarrito} disabled={!productoSeleccionado || !saborSeleccionado || !metodoSeleccionado}>Agregar al carrito</button>
              {mensajePedido && <p className="mensaje">{mensajePedido}</p>}
            </div>
          </div>
        </div>
      )}
      {pagina === "carrito" && (
        <section className="card">
          <h2>🛒 Tu Carrito</h2>
          {carrito.items.length === 0 ? <p>El carrito está vacío.</p> : (
            <>
              {carrito.items.map((item, index) => (
                <div key={index} className="pedido" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{item.nombre} - ${item.precio}</span>
                </div>
              ))}
              <h3>Total: ${carrito.total_temporal.toFixed(2)}</h3>
              <button className="btn-confirmar" onClick={finalizarCompra}>Finalizar Compra</button>
            </>
          )}
        </section>
      )}
      {pagina === "historial" && (
        <section className="card historial-page"><h2>Historial de pedidos</h2><input className="input-nombre" type="text" placeholder="Filtrar por nombre" value={filtroNombre} onChange={(e) => setFiltroNombre(e.target.value)} />              {ordenesFiltradas.length === 0 ? <p>No hay pedidos.</p> : ordenesFiltradas.map(o => {
                return (
                  <div key={o.id_orden} className="pedido">
                    <p><strong>Cliente:</strong> {o.nombre_cliente || o.usuario?.nombre}</p>
                    <p><strong>Total:</strong> ${Number(o.total_pagar).toFixed(2)}</p>
                    <p><strong>Estado:</strong> {o.estado && o.estado.descripcion ? o.estado.descripcion : "Pendiente"}</p>
                  </div>
                );
              })}</section>
      )}
      {pagina === "admin" && isAdmin && <AdminDashboard token={token} />}
    </div>
  );
}

export default App;
