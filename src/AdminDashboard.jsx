import { useState, useEffect } from "react";
import "./App.css";

const API_URL = "https://api-troles.onrender.com"; 
//const API_URL = "http://localhost:3000";

function AdminDashboard({ token }) {
  const [ordenes, setOrdenes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [estados, setEstados] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const [resOrdenes, resLogs, resEstados] = await Promise.all([
      fetch(`${API_URL}/ordenes`, { headers }),
      fetch(`${API_URL}/logs`, { headers }),
      fetch(`${API_URL}/estados-orden`, { headers })
    ]);
    setOrdenes(await resOrdenes.json());
    setLogs(await resLogs.json());
    setEstados(await resEstados.json());
  };

  const cambiarEstado = async (id_orden, id_estado) => {
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    await fetch(`${API_URL}/ordenes/${id_orden}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ id_estado }),
    });
    fetchData(); // Recargar datos
  };

  return (
    <div className="app">
      <h1>Panel de Administración</h1>

      <section className="card">
        <h2>Gestión de Pedidos</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr>
                <th>ID</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map(orden => (
                <tr key={orden.id_orden} style={{borderBottom: "1px solid #eee"}}>
                  <td>{orden.id_orden.slice(0, 8)}...</td>
                  <td>{orden.usuario?.nombre || orden.nombre_cliente}</td>
                  <td>${Number(orden.total_pagar).toFixed(2)}</td>
                  <td>{orden.estado?.descripcion}</td>
                  <td>
                    <select onChange={(e) => cambiarEstado(orden.id_orden, e.target.value)} defaultValue={orden.estado?.id_estado}>
                      {estados.map(estado => (
                        <option key={estado.id_estado} value={estado.id_estado}>{estado.descripcion}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Logs del Sistema</h2>
        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
          {logs.map(log => (
            <div key={log._id} className="pedido" style={{ fontSize: "12px", marginBottom: "5px" }}>
              <strong>{log.accion}</strong> - {new Date(log.createdAt).toLocaleString()}
              <pre style={{ margin: "2px 0" }}>{JSON.stringify(log.detalles)}</pre>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AdminDashboard;
