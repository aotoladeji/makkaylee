import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import GlobalStyles from "./components/common/GlobalStyles";
import Footer from "./components/layout/Footer";
import Nav from "./components/layout/Nav";
import AdminDashboard from "./pages/AdminDashboard";
import DashboardPage from "./pages/DashboardPage";
import EditProfilePage from "./pages/EditProfilePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import GalleryPage from "./pages/GalleryPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import PaymentPage from "./pages/PaymentPage";
import ProgramsPage from "./pages/ProgramsPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

function RequireAuth({ user, children }) {
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function RequireAdmin({ user, children }) {
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!user.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

const PAGE_TO_PATH = {
  Home: "/",
  Programs: "/programs",
  Gallery: "/gallery",
  Register: "/register",
  Login: "/login",
  ForgotPassword: "/forgot-password",
  ResetPassword: "/reset-password",
  Dashboard: "/dashboard",
  EditProfile: "/edit-profile",
  Payment: "/payment",
  Admin: "/admin",
};

const PATH_TO_PAGE = {
  "/": "Home",
  "/programs": "Programs",
  "/gallery": "Gallery",
  "/register": "Register",
  "/login": "Login",
  "/forgot-password": "ForgotPassword",
  "/reset-password": "ResetPassword",
  "/dashboard": "Dashboard",
  "/edit-profile": "EditProfile",
  "/payment": "Payment",
  "/admin": "Admin",
};

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  const page = useMemo(() => PATH_TO_PAGE[location.pathname] || "NotFound", [location.pathname]);

  const setPage = (targetPage) => {
    const targetPath = PAGE_TO_PATH[targetPage] || "/not-found";
    navigate(targetPath);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const isAdmin = localStorage.getItem("isAdmin") === "1";
    if (token && username) setUser({ username, token, isAdmin });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("isAdmin");
    setUser(null);
    navigate("/");
  };

  return (
    <>
      <GlobalStyles />
      <Nav page={page} setPage={setPage} menuOpen={menuOpen} setMenuOpen={setMenuOpen} user={user} onLogout={handleLogout} />

      <main>
        <Routes>
          <Route path="/" element={<HomePage setPage={setPage} />} />
          <Route path="/programs" element={<ProgramsPage setPage={setPage} />} />
          <Route path="/gallery" element={<GalleryPage setPage={setPage} />} />
          <Route path="/register" element={<RegisterPage user={user} setPage={setPage} />} />
          <Route path="/login" element={<LoginPage setUser={setUser} setPage={setPage} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage setPage={setPage} />} />
          <Route path="/reset-password" element={<ResetPasswordPage setPage={setPage} />} />
          <Route
            path="/dashboard"
            element={(
              <RequireAuth user={user}>
                <DashboardPage user={user} setPage={setPage} />
              </RequireAuth>
            )}
          />
          <Route
            path="/edit-profile"
            element={(
              <RequireAuth user={user}>
                <EditProfilePage user={user} setPage={setPage} />
              </RequireAuth>
            )}
          />
          <Route
            path="/payment"
            element={(
              <RequireAuth user={user}>
                <PaymentPage user={user} setPage={setPage} />
              </RequireAuth>
            )}
          />
          <Route
            path="/admin"
            element={(
              <RequireAdmin user={user}>
                <AdminDashboard user={user} setPage={setPage} />
              </RequireAdmin>
            )}
          />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage setPage={setPage} />} />
        </Routes>
      </main>

      <Footer setPage={setPage} />
    </>
  );
}
