import { useState } from "react";
import "./App.css";

const API_URL = "https://api-troles.onrender.com" || "http://localhost:3000";
//const API_URL = "http://localhost:3000";

function Register({ onRegister, onNavigateToLogin }) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (contrasena !== confirmarContrasena) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, correo, contrasena, rol: { id_role: 1 } }),
      });

      if (!response.ok) {
        throw new Error("Error al registrar el usuario");
      }

      onNavigateToLogin();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app">
      <div className="card" style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center" }}>
        <div style={{ fontSize: "60px", marginBottom: "10px" }}>🐻</div>
        <h1 style={{ marginBottom: "20px" }}>Registrarse</h1>
        <form onSubmit={handleRegister}>
          <input
            className="input-nombre"
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={{ marginBottom: "15px" }}
          />
          <input
            className="input-nombre"
            type="email"
            placeholder="Correo electrónico"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            style={{ marginBottom: "15px" }}
          />
          <input
            className="input-nombre"
            type="password"
            placeholder="Contraseña"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            style={{ marginBottom: "15px" }}
          />
          <input
            className="input-nombre"
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmarContrasena}
            onChange={(e) => setConfirmarContrasena(e.target.value)}
            style={{ marginBottom: "15px" }}
          />
          <button className="btn-confirmar" type="submit" style={{ width: "100%" }}>
            Registrarme
          </button>
          <button 
            type="button" 
            onClick={onNavigateToLogin}
            style={{ 
              background: "none", 
              border: "none", 
              color: "#ff7a00", 
              marginTop: "15px", 
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: "14px"
            }}
          >
            ¿Ya tienes cuenta? Inicia sesión
          </button>
          {error && <p className="mensaje" style={{ color: "red", marginTop: "10px" }}>{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default Register;
