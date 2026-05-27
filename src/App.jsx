import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "https://api-troles.onrender.com";

const coloresSabores = {
  Limón: "#b7e85f",
  Mango: "#ffb347",
  Fresa: "#ff6f91",
};

function App() {
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

  useEffect(() => {
    obtenerDatos();
  }, []);

  const obtenerDatos = async () => {
    const resSabores = await fetch(`${API_URL}/sabores`);
    const resToppings = await fetch(`${API_URL}/toppings`);
    const resProductos = await fetch(`${API_URL}/productos-base`);
    const resMetodosPago = await fetch(`${API_URL}/metodos-pago`);
    const resOrdenes = await fetch(`${API_URL}/ordenes`);

    setSabores(await resSabores.json());
    setToppings(await resToppings.json());
    setProductos(await resProductos.json());
    setMetodosPago(await resMetodosPago.json());
    setOrdenes(await resOrdenes.json());
  };

  const toggleTopping = (topping) => {
    const existe = toppingsSeleccionados.find(
      (item) => item.id_topping === topping.id_topping
    );

    if (existe) {
      setToppingsSeleccionados(
        toppingsSeleccionados.filter(
          (item) => item.id_topping !== topping.id_topping
        )
      );
    } else {
      setToppingsSeleccionados([...toppingsSeleccionados, topping]);
    }
  };

  const calcularTotal = () => {
    const precioProducto = productoSeleccionado
      ? Number(productoSeleccionado.precio_base)
      : 0;

    const precioToppings = toppingsSeleccionados.reduce(
      (total, topping) => total + Number(topping.precio_extra),
      0
    );

    return precioProducto + precioToppings;
  };

  const confirmarPedido = async () => {
    if (
      !nombreCliente ||
      !productoSeleccionado ||
      !saborSeleccionado ||
      !metodoSeleccionado
    ) {
      setMensajePedido("Completa nombre, producto, sabor y método de pago");
      return;
    }

    const pedido = {
      id_usuario: 1,
      id_metodo: metodoSeleccionado.id_metodo,
      nombre_cliente: nombreCliente,
      detalles: [
        {
          id_producto: productoSeleccionado.id_producto,
          id_sabor: saborSeleccionado.id_sabor,
          toppings: toppingsSeleccionados.map((topping) => topping.id_topping),
        },
      ],
    };

    const respuesta = await fetch(`${API_URL}/ordenes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pedido),
    });

    if (respuesta.ok) {
      const ordenCreada = await respuesta.json();

      const ordenParaHistorial = {
        ...ordenCreada,
        nombre_cliente: nombreCliente,
        producto_nombre: productoSeleccionado.nombre,
        sabor_nombre: saborSeleccionado.nombre,
        toppings_nombre:
          toppingsSeleccionados.length > 0
            ? toppingsSeleccionados.map((topping) => topping.nombre).join(", ")
            : "Ninguno",
        metodo_pago_nombre: metodoSeleccionado.nombre,
        total_pagar: calcularTotal(),
      };

      setOrdenes([ordenParaHistorial, ...ordenes]);
      setMensajePedido("Pedido confirmado correctamente");

      setNombreCliente("");
      setProductoSeleccionado(null);
      setSaborSeleccionado(null);
      setMetodoSeleccionado(null);
      setToppingsSeleccionados([]);
    } else {
      setMensajePedido("Error al confirmar pedido");
    }
  };

  const ordenesFiltradas = ordenes.filter((orden) => {
    const nombre = orden.nombre_cliente || orden.usuario?.nombre || "";

    if (!nombre || nombre === "Usuario Prueba") {
      return false;
    }

    return nombre.toLowerCase().includes(filtroNombre.toLowerCase());
  });

  const colorTrol = saborSeleccionado
    ? coloresSabores[saborSeleccionado.nombre] || "#d6f0ff"
    : "#eeeeee";

  return (
    <div className="app">
      <h1>Arma tu Trol</h1>
      <p>Selecciona tu tamaño, sabor y toppings favoritos</p>

      <div className="nav">
        <button onClick={() => setPagina("inicio")}>Armar pedido</button>
        <button onClick={() => setPagina("historial")}>Ver historial</button>
      </div>

      {pagina === "inicio" && (
        <div className="layout">
          <div className="panel">
            <section className="card">
              <h2>Nombre del cliente</h2>

              <input
                className="input-nombre"
                type="text"
                placeholder="Ejemplo: Ximena"
                value={nombreCliente}
                onChange={(e) => setNombreCliente(e.target.value)}
              />
            </section>

            <section className="card">
              <h2>1. Elige tu trol</h2>

              <div className="grid">
                {productos.map((producto) => (
                  <button
                    key={producto.id_producto}
                    className={
                      productoSeleccionado?.id_producto === producto.id_producto
                        ? "selected"
                        : ""
                    }
                    onClick={() => setProductoSeleccionado(producto)}
                  >
                    <strong>{producto.nombre}</strong>
                    <span>${producto.precio_base}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="card">
              <h2>2. Elige el sabor</h2>

              <div className="grid">
                {sabores.map((sabor) => (
                  <button
                    key={sabor.id_sabor}
                    className={
                      saborSeleccionado?.id_sabor === sabor.id_sabor
                        ? "selected"
                        : ""
                    }
                    onClick={() => setSaborSeleccionado(sabor)}
                  >
                    {sabor.nombre}
                  </button>
                ))}
              </div>
            </section>

            <section className="card">
              <h2>3. Agrega toppings</h2>

              <div className="grid">
                {toppings.map((topping) => (
                  <button
                    key={topping.id_topping}
                    className={
                      toppingsSeleccionados.some(
                        (item) => item.id_topping === topping.id_topping
                      )
                        ? "selected"
                        : ""
                    }
                    onClick={() => toggleTopping(topping)}
                  >
                    <strong>{topping.nombre}</strong>
                    <span>+ ${topping.precio_extra}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="card">
              <h2>4. Método de pago</h2>

              <div className="grid">
                {metodosPago.map((metodo) => (
                  <button
                    key={metodo.id_metodo}
                    className={
                      metodoSeleccionado?.id_metodo === metodo.id_metodo
                        ? "selected"
                        : ""
                    }
                    onClick={() => setMetodoSeleccionado(metodo)}
                  >
                    {metodo.nombre}
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="preview">
            <h2>Vista de tu trol</h2>

            <div className="trol">
              <div className="vaso">
                <div className="hielo" style={{ background: colorTrol }}>
                  {toppingsSeleccionados.map((topping, index) => (
                    <span
                      key={topping.id_topping}
                      className={`topping topping-${index}`}
                    >
                      {topping.nombre === "Panditas" ? "🐻" : "🌶️"}
                    </span>
                  ))}
                </div>
              </div>

              <div className="popote"></div>
            </div>

            <div className="resumen">
              <p>
                <strong>Cliente:</strong> {nombreCliente || "No capturado"}
              </p>

              <p>
                <strong>Producto:</strong>{" "}
                {productoSeleccionado
                  ? productoSeleccionado.nombre
                  : "No seleccionado"}
              </p>

              <p>
                <strong>Sabor:</strong>{" "}
                {saborSeleccionado
                  ? saborSeleccionado.nombre
                  : "No seleccionado"}
              </p>

              <p>
                <strong>Toppings:</strong>{" "}
                {toppingsSeleccionados.length > 0
                  ? toppingsSeleccionados.map((t) => t.nombre).join(", ")
                  : "Ninguno"}
              </p>

              <p>
                <strong>Método de pago:</strong>{" "}
                {metodoSeleccionado
                  ? metodoSeleccionado.nombre
                  : "No seleccionado"}
              </p>

              <h3>Total: ${calcularTotal().toFixed(2)}</h3>

              <button
                className="btn-confirmar"
                onClick={confirmarPedido}
                disabled={
                  !nombreCliente ||
                  !productoSeleccionado ||
                  !saborSeleccionado ||
                  !metodoSeleccionado
                }
              >
                Confirmar pedido
              </button>

              {mensajePedido && <p className="mensaje">{mensajePedido}</p>}
            </div>
          </div>
        </div>
      )}

      {pagina === "historial" && (
        <section className="card historial-page">
          <h2>Historial de pedidos</h2>

          <input
            className="input-nombre"
            type="text"
            placeholder="Filtrar por nombre"
            value={filtroNombre}
            onChange={(e) => setFiltroNombre(e.target.value)}
          />

          {ordenesFiltradas.length === 0 ? (
            <p>No hay pedidos con ese nombre.</p>
          ) : (
            ordenesFiltradas.map((orden) => {
              const nombre = orden.nombre_cliente || orden.usuario?.nombre || "";

              return (
                <div key={orden.id_orden} className="pedido">
                  <p>
                    <strong>Cliente:</strong> {nombre}
                  </p>
                  <p>
                    <strong>Total:</strong> $
                    {Number(orden.total_pagar).toFixed(2)}
                  </p>
                  <p>
                    <strong>Estado:</strong>{" "}
                    {orden.estado?.nombre || "Pendiente"}
                  </p>
                  <p>
                    <strong>Pago:</strong>{" "}
                    {orden.metodo_pago_nombre ||
                      orden.metodoPago?.nombre ||
                      "No registrado"}
                  </p>
                </div>
              );
            })
          )}
        </section>
      )}
    </div>
  );
}

export default App;