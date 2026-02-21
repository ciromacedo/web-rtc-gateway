import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import ConfirmModal from "../components/ConfirmModal.jsx";

const TYPE_LABELS = {
  CAMERA: "Câmera",
  SENSOR_PRESENCA: "Sensor de Presença",
  SONOFF_MINI: "Sonoff Mini",
  TUYA: "Tuya",
};

function IotDeviceList() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  const token = localStorage.getItem("token");

  const fetchDevices = () => {
    setLoading(true);
    fetch("/api/iot-devices", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao buscar dispositivos");
        return res.json();
      })
      .then((data) => setDevices(Array.isArray(data) ? data : []))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleDelete = () => {
    if (!deleteId) return;
    fetch(`/api/iot-devices/${deleteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao excluir dispositivo");
        toast.success("Dispositivo excluído com sucesso!");
        setDeleteId(null);
        fetchDevices();
      })
      .catch((err) => {
        toast.error(err.message);
        setDeleteId(null);
      });
  };

  const typeLabel = (type) => TYPE_LABELS[type] || type;

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <h2 style={styles.title}>Dispositivos IoT</h2>
      </div>

      <p style={styles.hint}>
        Dispositivos são registrados automaticamente pelo gateway ao iniciar. Apenas a descrição pode ser editada.
      </p>

      {loading && <div style={styles.status}>Carregando...</div>}
      {!loading && devices.length === 0 && (
        <div style={styles.status}>Nenhum dispositivo registrado.</div>
      )}

      {!loading && devices.length > 0 && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: 60 }}>ID</th>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Descrição</th>
                <th style={styles.th}>Gateway</th>
                <th style={{ ...styles.th, width: 100, textAlign: "center" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id}>
                  <td style={{ ...styles.td, color: "#a0a0a0" }}>{d.id}</td>
                  <td style={{ ...styles.td, fontFamily: "monospace", fontSize: "0.9rem" }}>{d.name}</td>
                  <td style={styles.td}>
                    <span style={styles.typeBadge}>{typeLabel(d.type)}</span>
                  </td>
                  <td style={styles.td}>{d.description}</td>
                  <td style={{ ...styles.td, color: "#a0a0a0", fontSize: "0.9rem" }}>{d.gateway_name}</td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <Link to={`/iot-devices/${d.id}/edit`} style={styles.iconBtn} title="Editar descrição">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </Link>
                    <button
                      style={styles.iconBtn}
                      onClick={() => setDeleteId(d.id)}
                      title="Excluir"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e94560" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={deleteId !== null}
        message="O dispositivo sera excluido. Confirma?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

const styles = {
  page: { padding: "1rem 0" },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  title: { color: "white", margin: 0, fontSize: "1.4rem" },
  hint: {
    color: "#a0a0a0",
    fontSize: "0.875rem",
    marginBottom: "1.5rem",
    marginTop: 0,
  },
  status: {
    textAlign: "center",
    color: "#a0a0a0",
    padding: "3rem",
    fontSize: "1.05rem",
  },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "0.75rem 1rem",
    color: "#a0a0a0",
    fontSize: "0.85rem",
    borderBottom: "1px solid #0f3460",
    fontWeight: 600,
  },
  td: {
    padding: "0.75rem 1rem",
    color: "white",
    fontSize: "0.95rem",
    borderBottom: "1px solid rgba(15,52,96,0.5)",
  },
  typeBadge: {
    display: "inline-block",
    padding: "0.2rem 0.6rem",
    background: "rgba(15,52,96,0.6)",
    color: "#a0c4ff",
    borderRadius: "12px",
    fontSize: "0.8rem",
    fontWeight: 600,
  },
  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0.25rem 0.5rem",
    display: "inline-flex",
    alignItems: "center",
    textDecoration: "none",
  },
};

export default IotDeviceList;
