import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

function UserEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Usuario nao encontrado");
        return res.json();
      })
      .then((data) => {
        setName(data.name || "");
        setEmail(data.email || "");
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const validate = () => {
    if (!name.trim()) {
      toast.error("O campo Nome e obrigatorio.");
      return false;
    }
    if (!email.trim()) {
      toast.error("O campo Email e obrigatorio.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Informe um email valido.");
      return false;
    }
    if (password && password.length < 4) {
      toast.error("A senha deve ter pelo menos 4 caracteres.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const body = { name, email };
      if (password) body.password = password;

      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar usuario");
      toast.success("Usuario atualizado com sucesso!");
      navigate("/users");
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
      <h2 style={styles.title}>Editar Usuario</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>Nome <span style={styles.required}>*</span></label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome completo"
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Email <span style={styles.required}>*</span></label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Senha (deixe em branco para manter)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nova senha (opcional)"
            style={styles.input}
          />
        </div>

        <div style={styles.actions}>
          <button type="submit" disabled={saving} style={styles.submitBtn}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/users")}
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
  page: {
    padding: "1rem 0",
  },
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
  form: {
    background: "#16213e",
    padding: "2rem",
    borderRadius: "10px",
    border: "1px solid #0f3460",
  },
  field: {
    marginBottom: "1.25rem",
  },
  label: {
    display: "block",
    color: "#a0a0a0",
    fontSize: "0.875rem",
    marginBottom: "0.5rem",
  },
  required: {
    color: "#e94560",
    fontWeight: "bold",
  },
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
  actions: {
    display: "flex",
    gap: "1rem",
    marginTop: "1rem",
  },
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

export default UserEdit;
