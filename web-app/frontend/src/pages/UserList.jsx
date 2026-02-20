import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import ConfirmModal from "../components/ConfirmModal.jsx";

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  const token = localStorage.getItem("token");

  const fetchUsers = () => {
    setLoading(true);
    fetch("/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao buscar usuarios");
        return res.json();
      })
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = () => {
    if (!deleteId) return;
    fetch(`/api/users/${deleteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao excluir usuario");
        toast.success("Usuario excluido com sucesso!");
        setDeleteId(null);
        fetchUsers();
      })
      .catch((err) => {
        toast.error(err.message);
        setDeleteId(null);
      });
  };

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <h2 style={styles.title}>Usuarios</h2>
        <Link to="/users/new" style={styles.newBtn}>
          + Novo Usuario
        </Link>
      </div>

      {loading && <div style={styles.status}>Carregando...</div>}
      {!loading && users.length === 0 && (
        <div style={styles.status}>Nenhum usuario encontrado.</div>
      )}

      {!loading && users.length > 0 && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>Email</th>
                <th style={{ ...styles.th, width: 120, textAlign: "center" }}>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={styles.td}>{u.name}</td>
                  <td style={styles.td}>{u.email}</td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <Link to={`/users/${u.id}/edit`} style={styles.iconBtn} title="Editar">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </Link>
                    <button
                      style={styles.iconBtn}
                      onClick={() => setDeleteId(u.id)}
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
        message="Registro sera excluido. Confirma?"
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
    textDecoration: "none",
  },
};

export default UserList;
