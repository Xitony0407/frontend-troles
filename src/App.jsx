import { useEffect, useState } from "react";
import "./App.css";
import Login from "./Login";
import Register from "./Register";
import AdminDashboard from "./AdminDashboard";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
//const API_URL = "http://localhost:3000";

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
  const [pagina, setPagina] = useState("inicio");

  const [nombreCliente, setNombreCliente] = useState("");
  const [filtroNombre, setFiltroNombre] = useState("");

  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [saborSeleccionado, setSaborSeleccionado] = useState(null);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState(null);
  const [toppingsSeleccionados, setToppingsSeleccionados] = useState([]);

  const [mensajePedido, setMensajePedido] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (token) {
      obtenerDatos();
    }
  }, [token]);

  const obtenerDatos = async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const [resSabores, resToppings, resProductos, resMetodosPago, resOrdenes] = await Promise.all([
        fetch(`${API_URL}/sabores`, { headers }),
        fetch(`${API_URL}/toppings`, { headers }),
        fetch(`${API_URL}/productos-base`, { headers }),
        fetch(`${API_URL}/metodos-pago`, { headers }),
        fetch(`${API_URL}/ordenes`, { headers })
    ]);

    setSabores(await resSabores.json());
    setToppings(await resToppings.json());
    setProductos(await resProductos.json());
    setMetodosPago(await resMetodosPago.json());

    const todasLasOrdenes = await resOrdenes.json();
    const ordenesUsuario = todasLasOrdenes.filter(orden => Number(orden.usuario?.id_usuario) === Number(usuario?.id_usuario));
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

  const confirmarPedido = async () => {
    setMensajePedido(""); // Limpiar mensaje al intentar nuevo pedido
    if (!nombreCliente || !productoSeleccionado || !saborSeleccionado || !metodoSeleccionado) {
      setMensajePedido("Completa nombre, producto, sabor y método de pago");
      return;
    }

    setIsConfirming(true); // Bloquear botón

    const pedido = {
      id_usuario: usuario?.id_usuario || 1,
      id_metodo: metodoSeleccionado.id_metodo,
      nombre_cliente: nombreCliente,
      detalles: [{ id_producto: productoSeleccionado.id_producto, id_sabor: saborSeleccionado.id_sabor, toppings: toppingsSeleccionados.map((t) => t.id_topping) }],
    };

    const respuesta = await fetch(`${API_URL}/ordenes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(pedido),
    });

    if (respuesta.ok) {
      const ordenCreada = await respuesta.json();
      const nuevaOrdenHistorial = { ...ordenCreada, usuario, total_pagar: calcularTotal() };
      setOrdenes([nuevaOrdenHistorial, ...ordenes]);
      setMensajePedido("Pedido confirmado");
      setNombreCliente(""); 
      setProductoSeleccionado(null); 
      setSaborSeleccionado(null); 
      setMetodoSeleccionado(null); 
      setToppingsSeleccionados([]);
    } else {
      setMensajePedido("Error al confirmar pedido");
    }
    setIsConfirming(false); // Desbloquear botón
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
        <button onClick={() => setPagina("historial")}>Ver historial</button>
        {isAdmin && <button onClick={() => setPagina("admin")} style={{ background: "#5a3d2b" }}>Panel Admin</button>}
        <button onClick={handleLogout} style={{ background: "#ff4d6d", color: "white" }}>Cerrar sesión</button>
      </div>

      {pagina === "inicio" && (
        <div className="layout">
          <div className="panel">
            <section className="card"><h2>Nombre del cliente</h2><input className="input-nombre" type="text" placeholder="Ejemplo: Ximena" value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} /></section>
            <section className="card"><h2>1. Elige tu trol</h2><div className="grid">{productos.map(p => <button key={p.id_producto} className={productoSeleccionado?.id_producto === p.id_producto ? "selected" : ""} onClick={() => setProductoSeleccionado(p)}><strong>{p.nombre}</strong><span>${p.precio_base}</span></button>)}</div></section>
            <section className="card"><h2>2. Elige el sabor</h2><div className="grid">{sabores.map(s => <button key={s.id_sabor} className={saborSeleccionado?.id_sabor === s.id_sabor ? "selected" : ""} onClick={() => setSaborSeleccionado(s)}>{s.nombre}</button>)}</div></section>
            <section className="card"><h2>3. Agrega toppings</h2><div className="grid">{toppings.map(t => <button key={t.id_topping} className={toppingsSeleccionados.some(i => i.id_topping === t.id_topping) ? "selected" : ""} onClick={() => toggleTopping(t)}><strong>{t.nombre}</strong><span>+ ${t.precio_extra}</span></button>)}</div></section>
            <section className="card"><h2>4. Método de pago</h2><div className="grid">{metodosPago.map(m => <button key={m.id_metodo} className={metodoSeleccionado?.id_metodo === m.id_metodo ? "selected" : ""} onClick={() => setMetodoSeleccionado(m)}>{m.nombre}</button>)}</div></section>
          </div>
          <div className="preview">
            <h2>Vista de tu trol</h2>
            <div className="trol"><div className="vaso"><div className="hielo" style={{ background: colorTrol }}>{toppingsSeleccionados.map((t, i) => <span key={t.id_topping} style={{ position: 'absolute', fontSize: '28px', zIndex: 3, top: `${20 + (i * 30)}px`, left: `${10 + (i % 3 * 30)}px` }}>{t.nombre === "Panditas" ? "🐻" : t.nombre === "Chile En Polvo" ? "🌶️" : t.nombre === "Tiburones" ? "🦈" : "🍬"}</span>)}</div></div><div className="popote"></div></div>
            <div className="resumen">
              <p><strong>Cliente:</strong> {nombreCliente || "No capturado"}</p>
              <p><strong>Producto:</strong> {productoSeleccionado?.nombre || "No seleccionado"}</p>
              <p><strong>Sabor:</strong> {saborSeleccionado?.nombre || "No seleccionado"}</p>
              <p><strong>Toppings:</strong> {toppingsSeleccionados.length > 0 ? toppingsSeleccionados.map(t => t.nombre).join(", ") : "Ninguno"}</p>
              <p><strong>Método de pago:</strong> {metodoSeleccionado?.nombre || "No seleccionado"}</p>
              <h3>Total: ${calcularTotal().toFixed(2)}</h3>
              <button className="btn-confirmar" onClick={confirmarPedido} disabled={isConfirming || !nombreCliente || !productoSeleccionado || !saborSeleccionado || !metodoSeleccionado}>
                {isConfirming ? "Confirmando..." : "Confirmar pedido"}
              </button>
              {mensajePedido && <p className="mensaje">{mensajePedido}</p>}
            </div>
          </div>
        </div>
      )}
      {pagina === "historial" && (
        <section className="card historial-page"><h2>Historial de pedidos</h2><input className="input-nombre" type="text" placeholder="Filtrar por nombre" value={filtroNombre} onChange={(e) => setFiltroNombre(e.target.value)} />{ordenesFiltradas.length === 0 ? <p>No hay pedidos.</p> : ordenesFiltradas.map(o => <div key={o.id_orden} className="pedido"><p><strong>Cliente:</strong> {o.nombre_cliente || o.usuario?.nombre}</p><p><strong>Total:</strong> ${Number(o.total_pagar).toFixed(2)}</p><p><strong>Estado:</strong> {o.estado?.descripcion || "Pendiente"}</p></div>)}</section>
      )}
      {pagina === "admin" && isAdmin && <AdminDashboard token={token} />}
    </div>
  );
}

export default App;
