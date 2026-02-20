function ConfirmModal({ open, message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.box}>
        <p style={styles.message}>{message}</p>
        <div style={styles.actions}>
          <button onClick={onConfirm} style={styles.confirmBtn}>
            SIM
          </button>
          <button onClick={onCancel} style={styles.cancelBtn}>
            NAO
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  box: {
    background: "#16213e",
    border: "1px solid #0f3460",
    borderRadius: "10px",
    padding: "2rem",
    maxWidth: 400,
    width: "90%",
    textAlign: "center",
  },
  message: {
    color: "white",
    fontSize: "1.05rem",
    marginBottom: "1.5rem",
    lineHeight: 1.5,
  },
  actions: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
  },
  confirmBtn: {
    padding: "0.5rem 1.5rem",
    background: "#e94560",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.95rem",
    fontWeight: "bold",
    cursor: "pointer",
  },
  cancelBtn: {
    padding: "0.5rem 1.5rem",
    background: "transparent",
    color: "#a0a0a0",
    border: "1px solid #a0a0a0",
    borderRadius: "6px",
    fontSize: "0.95rem",
    fontWeight: "bold",
    cursor: "pointer",
  },
};

export default ConfirmModal;
