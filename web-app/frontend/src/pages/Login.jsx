import { useState } from "react";
import { toast } from "react-toastify";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!email.trim()) {
      toast.error("O campo Email e obrigatorio.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Informe um email valido.");
      return false;
    }
    if (!password) {
      toast.error("O campo Senha e obrigatorio.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.logoSection}>
          <img
            src="/images/MacedoSmartMeshLogo.png"
            alt="Macedo SmartMesh"
            style={styles.logoImage}
          />
          <p style={styles.subtitle}>IoT com IA</p>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Email</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            style={styles.input}
          />
        </div>

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #16213e 0%, #1a1a2e 100%)",
  },
  form: {
    background: "#16213e",
    padding: "2.5rem",
    borderRadius: "12px",
    border: "1px solid #0f3460",
    width: "100%",
    maxWidth: "400px",
    margin: "1rem",
  },
  logoSection: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  logoImage: {
    maxWidth: "220px",
    width: "100%",
    height: "auto",
  },
  subtitle: {
    color: "#a0a0a0",
    fontSize: "0.9rem",
    marginTop: "0.25rem",
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
  button: {
    width: "100%",
    padding: "0.75rem",
    background: "#e94560",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "0.5rem",
  },
};

export default Login;
