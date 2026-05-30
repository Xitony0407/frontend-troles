import { useState } from "react";
import "./App.css";

const API_URL = "https://api-troles.onrender.com"; 
//const API_URL = "http://localhost:3000";

function Login({ onLogin, onNavigateToRegister }) {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contrasena }),
      });

      if (!response.ok) {
        throw new Error("Correo o contraseña incorrectos");
      }

      const data = await response.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.usuario));
      onLogin(data.access_token);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app">
      <div className="card" style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center" }}>
        <div style={{ fontSize: "55px", marginBottom: "10px" }}>🐻</div>
        <h1 style={{ fontSize: "40px", marginBottom: "20px" }}>Iniciar Sesión</h1>
        <form onSubmit={handleLogin}>
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
          <button className="btn-confirmar" type="submit" style={{ width: "100%" }}>
            Entrar
          </button>
          <button 
            type="button" 
            onClick={onNavigateToRegister}
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
            ¿No tienes una cuenta? Regístrate
          </button>
          {error && <p className="mensaje" style={{ color: "red", marginTop: "10px" }}>{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default Login;
