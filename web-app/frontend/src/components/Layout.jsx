import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

function Layout({ user, onLogout, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const navItems = [
    {
      label: "Painel de Controle",
      path: "/",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      ),
    },
    {
      label: "Usuarios",
      path: "/users",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: "Gateways",
      path: "/gateways",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
      ),
    },
    {
      label: "Dispositivos IoT",
      path: "/iot-devices",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
    },
    {
      label: "Organizações",
      path: "/organizations",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
  ];

  return (
    <div style={styles.wrapper}>
      {/* Mobile header */}
      <header style={styles.mobileHeader}>
        <button
          style={styles.hamburger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 style={styles.mobileLogo}>
          Macedo <span style={styles.logoAccent}>SmartMesh</span>
        </h1>
      </header>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          style={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        ...styles.sidebar,
        ...(sidebarOpen ? styles.sidebarOpen : {}),
      }}>
        <div style={styles.sidebarLogo}>
          <h1 style={styles.logoText}>
            Macedo <span style={styles.logoAccent}>SmartMesh</span>
          </h1>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.navItem,
                ...(isActive(item.path) ? styles.navItemActive : {}),
              }}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <span style={styles.footerUser}>{user?.name || user?.email}</span>
          <button onClick={onLogout} style={styles.logoutBtn}>
            Sair
          </button>
        </div>
      </aside>

      {/* Content */}
      <main style={styles.content}>
        {children}
      </main>
    </div>
  );
}

const SIDEBAR_WIDTH = 220;

const styles = {
  wrapper: {
    display: "flex",
    minHeight: "100vh",
    background: "#1a1a2e",
  },
  mobileHeader: {
    display: "none",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    background: "#16213e",
    borderBottom: "1px solid #0f3460",
    alignItems: "center",
    padding: "0 1rem",
    gap: "0.75rem",
    zIndex: 200,
  },
  hamburger: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
  },
  mobileLogo: {
    fontSize: "1.2rem",
    fontWeight: "bold",
    color: "white",
    margin: 0,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 299,
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    minWidth: SIDEBAR_WIDTH,
    background: "#16213e",
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid #0f3460",
    position: "fixed",
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 300,
  },
  sidebarOpen: {},
  sidebarLogo: {
    padding: "1.25rem 1rem",
    borderBottom: "1px solid #0f3460",
  },
  logoText: {
    fontSize: "1.25rem",
    fontWeight: "bold",
    color: "white",
    margin: 0,
  },
  logoAccent: {
    color: "#e94560",
  },
  nav: {
    flex: 1,
    padding: "1rem 0",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.7rem 1rem",
    color: "#a0a0a0",
    textDecoration: "none",
    fontSize: "0.95rem",
    transition: "background 0.15s",
  },
  navItemActive: {
    color: "#e94560",
    background: "rgba(233, 69, 96, 0.1)",
    borderRight: "3px solid #e94560",
  },
  sidebarFooter: {
    padding: "1rem",
    borderTop: "1px solid #0f3460",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  footerUser: {
    color: "#a0a0a0",
    fontSize: "0.85rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  logoutBtn: {
    padding: "0.4rem 1rem",
    background: "transparent",
    border: "1px solid #e94560",
    color: "#e94560",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    marginLeft: SIDEBAR_WIDTH,
    padding: "1.5rem",
    minHeight: "100vh",
  },
};

// Inject responsive CSS via a style tag
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @media (max-width: 768px) {
    [data-layout-wrapper] > aside {
      transform: translateX(-100%);
      transition: transform 0.25s ease;
    }
    [data-layout-wrapper] > aside.open {
      transform: translateX(0);
    }
  }
`;

// We handle responsive via inline style overrides instead
if (typeof window !== "undefined") {
  const mq = window.matchMedia("(max-width: 768px)");
  const applyMobile = () => {
    styles.mobileHeader.display = mq.matches ? "flex" : "none";
    if (mq.matches) {
      styles.sidebar.transform = "translateX(-100%)";
      styles.sidebar.transition = "transform 0.25s ease";
      styles.sidebarOpen.transform = "translateX(0)";
      styles.content.marginLeft = 0;
      styles.content.paddingTop = 72;
    } else {
      styles.sidebar.transform = "none";
      styles.sidebar.transition = "none";
      styles.sidebarOpen.transform = undefined;
      styles.content.marginLeft = SIDEBAR_WIDTH;
      styles.content.paddingTop = undefined;
    }
  };
  applyMobile();
  mq.addEventListener("change", applyMobile);
}

export default Layout;
