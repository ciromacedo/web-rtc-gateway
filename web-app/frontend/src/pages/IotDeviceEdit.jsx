import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

const TYPE_LABELS = {
  CAMERA: "Câmera",
  SENSOR_PRESENCA: "Sensor de Presença",
  SONOFF_MINI: "Sonoff Mini",
  TUYA: "Tuya",
};

function IotDeviceEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`/api/iot-devices/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Dispositivo não encontrado");
        return res.json();
      })
      .then((data) => {
        setDevice(data);
        setDescription(data.description || "");
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("O campo Descrição é obrigatório.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/iot-devices/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ description }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar dispositivo");
      toast.success("Descrição atualizada com sucesso!");
      navigate("/iot-devices");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={styles.status}>Carregando...</div>;
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Editar Dispositivo</h2>

      {device && (
        <div style={styles.infoBox}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Nome</span>
            <span style={styles.infoValue}>{device.name}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Tipo</span>
            <span style={styles.infoValue}>{TYPE_LABELS[device.type] || device.type}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Gateway</span>
            <span style={styles.infoValue}>{device.gateway_name}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>Descrição <span style={styles.required}>*</span></label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição amigável do dispositivo"
            style={styles.input}
            autoFocus
          />
        </div>

        <div style={styles.actions}>
          <button type="submit" disabled={saving} style={styles.submitBtn}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/iot-devices")}
            style={styles.cancelBtn}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  page: { padding: "1rem 0" },
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
    fontSize: "1.05rem",
  },
  infoBox: {
    background: "#16213e",
    border: "1px solid #0f3460",
    borderRadius: "10px",
    padding: "1rem 1.5rem",
    marginBottom: "1.5rem",
    display: "flex",
    flexWrap: "wrap",
    gap: "1.5rem",
  },
  infoRow: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  infoLabel: {
    color: "#a0a0a0",
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  infoValue: {
    color: "white",
    fontSize: "0.95rem",
    fontWeight: 500,
  },
  form: {
    background: "#16213e",
    padding: "2rem",
    borderRadius: "10px",
    border: "1px solid #0f3460",
  },
  field: { marginBottom: "1.25rem" },
  label: {
    display: "block",
    color: "#a0a0a0",
    fontSize: "0.875rem",
    marginBottom: "0.5rem",
  },
  required: { color: "#e94560", fontWeight: "bold" },
  input: {
    width: "100%",
    padding: "0.75rem",
    background: "#1a1a2e",
    border: "1px solid #0f3460",
    borderRadius: "6px",
    color: "white",
    fontSize: "1rem",
    outline: "none",
    boxSizing: "border-box",
  },
  actions: { display: "flex", gap: "1rem", marginTop: "1rem" },
  submitBtn: {
    padding: "0.65rem 1.5rem",
    background: "#e94560",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.95rem",
    fontWeight: "bold",
    cursor: "pointer",
  },
  cancelBtn: {
    padding: "0.65rem 1.5rem",
    background: "transparent",
    color: "#a0a0a0",
    border: "1px solid #a0a0a0",
    borderRadius: "6px",
    fontSize: "0.95rem",
    cursor: "pointer",
  },
};

export default IotDeviceEdit;
