import { useState, useEffect } from "react";
import CameraGrid from "../components/CameraGrid.jsx";

function Dashboard() {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("/api/cameras", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao buscar cameras");
        return res.json();
      })
      .then((data) => setCameras(data.cameras || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 style={styles.title}>Cameras</h2>

      {loading && (
        <div style={styles.status}>Carregando cameras...</div>
      )}
      {error && <div style={styles.error}>{error}</div>}
      {!loading && !error && cameras.length === 0 && (
        <div style={styles.status}>
          Nenhuma camera encontrada. Verifique se o gateway esta ativo.
        </div>
      )}
      {!loading && cameras.length > 0 && (
        <CameraGrid cameras={cameras} />
      )}
    </div>
  );
}

const styles = {
  title: {
    color: "white",
    marginTop: 0,
    marginBottom: "1.5rem",
    fontSize: "1.4rem",
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
