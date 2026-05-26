import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardPage from "./pages/DashboardPage";
import WelcomePage from "./pages/WelcomePage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";

function AppRoutes() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />

      <Route
        path="/login"
        element={token ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      <Route
        path="/register"
        element={token ? <Navigate to="/dashboard" replace /> : <Register />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}