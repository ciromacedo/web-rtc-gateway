import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import UserList from "./pages/UserList.jsx";
import UserCreate from "./pages/UserCreate.jsx";
import UserEdit from "./pages/UserEdit.jsx";
import CameraView from "./pages/CameraView.jsx";
import GatewayList from "./pages/GatewayList.jsx";
import GatewayCreate from "./pages/GatewayCreate.jsx";
import OrganizationList from "./pages/OrganizationList.jsx";
import OrganizationCreate from "./pages/OrganizationCreate.jsx";
import OrganizationEdit from "./pages/OrganizationEdit.jsx";
import IotDeviceList from "./pages/IotDeviceList.jsx";
import IotDeviceEdit from "./pages/IotDeviceEdit.jsx";
import Layout from "./components/Layout.jsx";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid token");
        return res.json();
      })
      .then((data) => setUser(data))
      .catch(() => {
        localStorage.removeItem("token");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleLogin = async (email, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Erro ao fazer login");
    }

    localStorage.setItem("token", data.token);
    setUser({ email });
    navigate("/");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div style={{ color: "#a0a0a0", fontSize: "1.2rem" }}>Carregando...</div>
      </div>
    );
  }

  const ProtectedRoute = ({ children }) => {
    if (!user) return <Navigate to="/login" />;
    return (
      <Layout user={user} onLogout={handleLogout}>
        {children}
      </Layout>
    );
  };

  return (
    <>
    <ToastContainer
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnHover
      theme="dark"
    />
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <UserList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/new"
        element={
          <ProtectedRoute>
            <UserCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/:id/edit"
        element={
          <ProtectedRoute>
            <UserEdit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cameras/:path"
        element={
          user ? <CameraView /> : <Navigate to="/login" />
        }
      />
      <Route
        path="/gateways"
        element={
          <ProtectedRoute>
            <GatewayList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gateways/new"
        element={
          <ProtectedRoute>
            <GatewayCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizations"
        element={
          <ProtectedRoute>
            <OrganizationList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizations/new"
        element={
          <ProtectedRoute>
            <OrganizationCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizations/:id/edit"
        element={
          <ProtectedRoute>
            <OrganizationEdit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/iot-devices"
        element={
          <ProtectedRoute>
            <IotDeviceList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/iot-devices/:id/edit"
        element={
          <ProtectedRoute>
            <IotDeviceEdit />
          </ProtectedRoute>
        }
      />
    </Routes>
    </>
  );
}

export default App;
