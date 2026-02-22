import { useState } from "react";
import { useNavigate } from "react-router-dom";
import WebRTCPlayer from "./WebRTCPlayer.jsx";

// ─── Configuração por tipo de dispositivo ─────────────────────────────────────

const TYPE_CONFIG = {
  CAMERA: {
    label: "Câmera",
    color: "#e94560",
    headerBg: "rgba(233, 69, 96, 0.12)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e94560" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  SENSOR_PRESENCA: {
    label: "Sensor de Presença",
    color: "#4caf50",
    headerBg: "rgba(76, 175, 80, 0.12)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  SONOFF_MINI: {
    label: "Sonoff Mini",
    color: "#f0a500",
    headerBg: "rgba(240, 165, 0, 0.12)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f0a500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="2" x2="12" y2="12" />
        <path d="M6.3 5.3a8 8 0 1 0 11.4 0" />
      </svg>
    ),
  },
  TUYA: {
    label: "Tuya",
    color: "#2196f3",
    headerBg: "rgba(33, 150, 243, 0.12)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2196f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
  },
};

const DEFAULT_CONFIG = {
  label: "Dispositivo IoT",
  color: "#a0c4ff",
  headerBg: "rgba(160, 196, 255, 0.1)",
  icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a0c4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="2" x2="9" y2="4" />
      <line x1="15" y1="2" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="22" />
      <line x1="15" y1="20" x2="15" y2="22" />
      <line x1="2" y1="9" x2="4" y2="9" />
      <line x1="2" y1="15" x2="4" y2="15" />
      <line x1="20" y1="9" x2="22" y2="9" />
      <line x1="20" y1="15" x2="22" y2="15" />
    </svg>
  ),
};

// ─── Controles PTZ ────────────────────────────────────────────────────────────

function PtzControls({ device, visible }) {
  const sendPtz = (direction) => {
    fetch(`${device.gateway_local_api_url}/ptz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ camera_name: device.name, direction }),
    }).catch(() => {});
  };

  return (
    <div style={{ ...styles.ptzOverlay, opacity: visible ? 1 : 0 }}>
      <div style={styles.ptzGrid}>
        <div />
        <button style={styles.ptzBtn} onClick={() => sendPtz("up")} title="Cima">▲</button>
        <div />
        <button style={styles.ptzBtn} onClick={() => sendPtz("left")} title="Esquerda">◀</button>
        <button style={styles.ptzBtn} onClick={() => sendPtz("home")} title="Home">⌂</button>
        <button style={styles.ptzBtn} onClick={() => sendPtz("right")} title="Direita">▶</button>
        <div />
        <button style={styles.ptzBtn} onClick={() => sendPtz("down")} title="Baixo">▼</button>
        <div />
      </div>
    </div>
  );
}

// ─── Card: Câmera ─────────────────────────────────────────────────────────────

function CameraCard({ device, cfg, navigate }) {
  const [hovered, setHovered] = useState(false);
  const hasPtz = !!device.gateway_local_api_url;

  return (
    <div
      style={{ ...styles.card, borderColor: cfg.color, position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ ...styles.cardHeader, background: cfg.headerBg }}>
        <div style={styles.headerLeft}>
          {cfg.icon}
          <div>
            <div style={styles.description}>{device.description}</div>
            <span style={{ ...styles.typeBadge, color: cfg.color, borderColor: cfg.color }}>
              {cfg.label}
            </span>
          </div>
        </div>
        <span
          style={{
            ...styles.statusDot,
            background: device.ready ? "#4ade80" : "#555",
            boxShadow: device.ready ? "0 0 6px #4ade80" : "none",
          }}
          title={device.ready ? "Online" : "Offline"}
        />
      </div>

      {device.ready ? (
        <WebRTCPlayer path={device.path} />
      ) : (
        <div style={styles.offlinePlaceholder}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            <line x1="2" y1="2" x2="22" y2="22" stroke="#e94560" strokeWidth="2" />
          </svg>
          <span style={styles.offlineText}>Offline</span>
        </div>
      )}

      {hasPtz && <PtzControls device={device} visible={hovered} />}

      <div style={styles.cardFooter}>
        <span style={styles.gatewayLabel}>{device.gateway_name}</span>
        <button
          style={{ ...styles.expandBtn, ...(device.ready ? {} : styles.expandBtnDisabled) }}
          onClick={() => device.ready && navigate(`/cameras/${device.path}`)}
          disabled={!device.ready}
          title="Expandir"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Card: Outros dispositivos ────────────────────────────────────────────────

function GenericCard({ device, cfg }) {
  return (
    <div style={{ ...styles.card, borderColor: cfg.color }}>
      <div style={{ ...styles.cardHeader, background: cfg.headerBg }}>
        <div style={styles.headerLeft}>
          {cfg.icon}
          <div>
            <div style={styles.description}>{device.description}</div>
            <span style={{ ...styles.typeBadge, color: cfg.color, borderColor: cfg.color }}>
              {cfg.label}
            </span>
          </div>
        </div>
      </div>

      <div style={styles.genericBody}>
        <div style={styles.infoRow}>
          <span style={styles.infoKey}>Identificador</span>
          <span style={{ ...styles.infoVal, fontFamily: "monospace", fontSize: "0.85rem" }}>
            {device.name}
          </span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.infoKey}>Status</span>
          <span style={{ ...styles.statusLabel, color: cfg.color }}>
            <span style={{ ...styles.statusDotSmall, background: cfg.color }} />
            Registrado
          </span>
        </div>
      </div>

      <div style={styles.cardFooter}>
        <span style={styles.gatewayLabel}>{device.gateway_name}</span>
      </div>
    </div>
  );
}

// ─── Grid principal ───────────────────────────────────────────────────────────

if (typeof document !== "undefined") {
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    .device-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }
    @media (max-width: 1200px) { .device-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 900px)  { .device-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 480px)  { .device-grid { grid-template-columns: 1fr; } }
  `;
  document.head.appendChild(styleEl);
}

function DeviceGrid({ devices }) {
  const navigate = useNavigate();

  return (
    <div className="device-grid">
      {devices.map((device) => {
        const cfg = TYPE_CONFIG[device.type] || DEFAULT_CONFIG;
        return device.type === "CAMERA" ? (
          <CameraCard key={device.id} device={device} cfg={cfg} navigate={navigate} />
        ) : (
          <GenericCard key={device.id} device={device} cfg={cfg} />
        );
      })}
    </div>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = {
  card: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "10px",
    overflow: "hidden",
    background: "#16213e",
    display: "flex",
    flexDirection: "column",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.65rem 0.85rem",
    gap: "0.5rem",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    minWidth: 0,
  },
  description: {
    color: "white",
    fontSize: "0.875rem",
    fontWeight: 600,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "160px",
  },
  typeBadge: {
    display: "inline-block",
    fontSize: "0.7rem",
    fontWeight: 600,
    border: "1px solid",
    borderRadius: "10px",
    padding: "0.05rem 0.45rem",
    marginTop: "0.2rem",
    opacity: 0.85,
  },
  statusDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    flexShrink: 0,
    transition: "box-shadow 0.3s",
  },
  offlinePlaceholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2.5rem 1rem",
    background: "#1a1a2e",
    gap: "0.6rem",
    flex: 1,
  },
  offlineText: {
    color: "#555",
    fontSize: "0.8rem",
    fontWeight: 600,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  genericBody: {
    padding: "1rem 1rem",
    background: "#1a1a2e",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  infoRow: {
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
  },
  infoKey: {
    color: "#555",
    fontSize: "0.7rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  infoVal: {
    color: "#a0a0a0",
    fontSize: "0.9rem",
  },
  statusLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  statusDotSmall: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  cardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.4rem 0.85rem",
    background: "#0f1f3d",
    borderTop: "1px solid rgba(255,255,255,0.05)",
  },
  gatewayLabel: {
    color: "#555",
    fontSize: "0.75rem",
    fontWeight: 500,
    fontStyle: "italic",
  },
  expandBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "none",
    border: "none",
    color: "#a0a0a0",
    cursor: "pointer",
    padding: "0.3rem",
    borderRadius: "4px",
  },
  expandBtnDisabled: {
    opacity: 0.2,
    cursor: "default",
  },
  ptzOverlay: {
    position: "absolute",
    bottom: "36px", // acima do cardFooter
    right: "8px",
    transition: "opacity 0.2s ease",
    pointerEvents: "auto",
  },
  ptzGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 28px)",
    gridTemplateRows: "repeat(3, 28px)",
    gap: "2px",
  },
  ptzBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    background: "rgba(0,0,0,0.55)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "4px",
    color: "white",
    fontSize: "12px",
    cursor: "pointer",
    padding: 0,
    lineHeight: 1,
  },
};

export default DeviceGrid;
