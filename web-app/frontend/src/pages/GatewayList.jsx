import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import ConfirmModal from "../components/ConfirmModal.jsx";

function GatewayList() {
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [toggleId, setToggleId] = useState(null);

  const token = localStorage.getItem("token");

  const fetchGateways = () => {
    setLoading(true);
    fetch("/api/gateways", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao buscar gateways");
        return res.json();
      })
      .then((data) => setGateways(Array.isArray(data.gateways) ? data.gateways : []))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGateways();
  }, []);

  const handleToggle = () => {
    if (!toggleId) return;
    const id = toggleId;
    fetch(`/api/gateways/${id}/toggle`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: "{}",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao alterar status");
        return res.json();
      })
      .then((data) => {
        const status = data.gateway.active ? "ativado" : "desativado";
        toast.success(`Gateway ${status} com sucesso!`);
        setToggleId(null);
        fetchGateways();
      })
      .catch((err) => {
        toast.error(err.message);
        setToggleId(null);
      });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    fetch(`/api/gateways/${deleteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao excluir gateway");
        toast.success("Gateway excluido com sucesso!");
        setDeleteId(null);
        fetchGateways();
      })
      .catch((err) => {
        toast.error(err.message);
        setDeleteId(null);
      });
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("pt-BR");
  };

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <h2 style={styles.title}>Gateways</h2>
        <Link to="/gateways/new" style={styles.newBtn}>
          + Novo Gateway
        </Link>
      </div>

      {loading && <div style={styles.status}>Carregando...</div>}
      {!loading && gateways.length === 0 && (
        <div style={styles.status}>Nenhum gateway cadastrado.</div>
      )}

      {!loading && gateways.length > 0 && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>Prefixo da Key</th>
                <th style={{ ...styles.th, textAlign: "center" }}>Status</th>
                <th style={styles.th}>Ultimo acesso</th>
                <th style={{ ...styles.th, textAlign: "center" }}>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {gateways.map((g) => (
                <tr key={g.id}>
                  <td style={styles.td}>{g.name}</td>
                  <td style={{ ...styles.td, fontFamily: "monospace", color: "#a0a0a0" }}>
                    {g.api_key_prefix}...
                  </td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <span style={g.active ? styles.badgeActive : styles.badgeInactive}>
                      {g.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td style={{ ...styles.td, color: "#a0a0a0", fontSize: "0.85rem" }}>
                    {formatDate(g.last_seen_at)}
                  </td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <button
                      style={styles.iconBtn}
                      onClick={() => setToggleId(g.id)}
                      title={g.active ? "Desativar" : "Ativar"}
                    >
                      {g.active ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f0a500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="9 11 12 14 22 4" />
                        </svg>
                      )}
                    </button>
                    <button
                      style={styles.iconBtn}
                      onClick={() => setDeleteId(g.id)}
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
        open={toggleId !== null}
        message="Deseja alterar o status do gateway? Isso encerrará o stream imediatamente se estiver ativo."
        onConfirm={handleToggle}
        onCancel={() => setToggleId(null)}
      />

      <ConfirmModal
        open={deleteId !== null}
        message="O gateway sera excluido permanentemente. Confirma?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

const styles = {
  page: {
    padding: "1rem 0",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  title: {
    color: "white",
    margin: 0,
    fontSize: "1.4rem",
  },
  newBtn: {
    display: "inline-block",
    padding: "0.5rem 1.2rem",
    background: "#e94560",
    color: "white",
    borderRadius: "6px",
    textDecoration: "none",
    fontSize: "0.9rem",
    fontWeight: "bold",
  },
  status: {
    textAlign: "center",
    color: "#a0a0a0",
    padding: "3rem",
    fontSize: "1.05rem",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
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
  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0.25rem 0.5rem",
    display: "inline-flex",
    alignItems: "center",
  },
  badgeActive: {
    display: "inline-block",
    padding: "0.2rem 0.6rem",
    background: "rgba(76,175,80,0.15)",
    color: "#4caf50",
    borderRadius: "12px",
    fontSize: "0.8rem",
    fontWeight: 600,
  },
  badgeInactive: {
    display: "inline-block",
    padding: "0.2rem 0.6rem",
    background: "rgba(160,160,160,0.15)",
    color: "#a0a0a0",
    borderRadius: "12px",
    fontSize: "0.8rem",
    fontWeight: 600,
  },
};

export default GatewayList;
