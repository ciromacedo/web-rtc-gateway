import { useState, useEffect } from "react";
import CameraGrid from "../components/CameraGrid.jsx";

function Dashboard({ user, onLogout }) {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("/api/cameras", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao buscar câmeras");
        return res.json();
      })
      .then((data) => setCameras(data.cameras || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>
          Vigi<span style={styles.logoAccent}>AI</span>
        </h1>
        <div style={styles.userSection}>
          <span style={styles.userName}>{user.name || user.email}</span>
          <button onClick={onLogout} style={styles.logoutBtn}>
            Sair
          </button>
        </div>
      </header>

      <main style={styles.main}>
        {loading && (
          <div style={styles.status}>Carregando câmeras...</div>
        )}
        {error && <div style={styles.error}>{error}</div>}
        {!loading && !error && cameras.length === 0 && (
          <div style={styles.status}>
            Nenhuma câmera encontrada. Verifique se o gateway está ativo.
          </div>
        )}
        {!loading && cameras.length > 0 && (
          <CameraGrid cameras={cameras} />
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#1a1a2e",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem 1.5rem",
    background: "#16213e",
    borderBottom: "1px solid #0f3460",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    margin: 0,
    color: "white",
  },
  logoAccent: {
    color: "#e94560",
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  userName: {
    color: "#a0a0a0",
    fontSize: "0.9rem",
  },
  logoutBtn: {
    padding: "0.4rem 1rem",
    background: "transparent",
    border: "1px solid #e94560",
    color: "#e94560",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "bold",
  },
  main: {
    padding: "1.5rem",
  },
  status: {
    textAlign: "center",
    color: "#a0a0a0",
    padding: "3rem",
    fontSize: "1.1rem",
  },
  error: {
    textAlign: "center",
    color: "#ff6b6b",
    padding: "3rem",
    fontSize: "1.1rem",
  },
};

export default Dashboard;
