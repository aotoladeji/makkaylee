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
import StaffLoginPage from "./pages/StaffLoginPage";
import StaffProfilePage from "./pages/StaffProfilePage";
import SponsorsPage from "./pages/SponsorsPage";
import PartnersPage from "./pages/PartnersPage";

function RequireParent({ user, children }) {
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user.isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (user.isStaff) {
    return <Navigate to="/staff-profile" replace />;
  }

  return children;
}

function RequireAdmin({ user, children }) {
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!user.isAdmin) {
    return <Navigate to={user.isStaff ? "/staff-profile" : "/dashboard"} replace />;
  }

  return children;
}

function RequireStaff({ user, children }) {
  const location = useLocation();

  if (!user) {
    return <Navigate to="/staff-login" replace state={{ from: location.pathname }} />;
  }

  if (!user.isStaff) {
    return <Navigate to={user.isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  return children;
}

const PAGE_TO_PATH = {
  Home: "/",
  Programs: "/programs",
  Gallery: "/gallery",
  Register: "/register",
  Login: "/login",
  StaffLogin: "/staff-login",
  ForgotPassword: "/forgot-password",
  ResetPassword: "/reset-password",
  Dashboard: "/dashboard",
  EditProfile: "/edit-profile",
  Payment: "/payment",
  Admin: "/admin",
  StaffProfile: "/staff-profile",
  Sponsors: "/sponsors",
  Partners: "/partners",
};

const PATH_TO_PAGE = {
  "/": "Home",
  "/programs": "Programs",
  "/gallery": "Gallery",
  "/register": "Register",
  "/login": "Login",
  "/staff-login": "StaffLogin",
  "/forgot-password": "ForgotPassword",
  "/reset-password": "ResetPassword",
  "/dashboard": "Dashboard",
  "/edit-profile": "EditProfile",
  "/payment": "Payment",
  "/admin": "Admin",
  "/staff-profile": "StaffProfile",
  "/sponsors": "Sponsors",
  "/partners": "Partners",
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
    const isStaff = localStorage.getItem("isStaff") === "1";
    if (token && username) setUser({ username, token, isAdmin, isStaff });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("isStaff");
    setUser(null);
    navigate("/");
  };

  const restrictedRolePath = user?.isAdmin ? "/admin" : user?.isStaff ? "/staff-profile" : null;

  return (
    <>
      <GlobalStyles />
      <Nav page={page} setPage={setPage} menuOpen={menuOpen} setMenuOpen={setMenuOpen} user={user} onLogout={handleLogout} />

      <main>
        {restrictedRolePath && location.pathname !== restrictedRolePath ? (
          <Navigate to={restrictedRolePath} replace />
        ) : (
          <Routes>
          <Route path="/" element={<HomePage setPage={setPage} />} />
          <Route path="/programs" element={<ProgramsPage setPage={setPage} />} />
          <Route path="/gallery" element={<GalleryPage setPage={setPage} />} />
          <Route path="/sponsors" element={<SponsorsPage setPage={setPage} />} />
          <Route path="/partners" element={<PartnersPage setPage={setPage} />} />
          <Route path="/register" element={<RegisterPage user={user} setPage={setPage} />} />
          <Route path="/login" element={<LoginPage setUser={setUser} setPage={setPage} />} />
          <Route path="/staff-login" element={<StaffLoginPage setUser={setUser} setPage={setPage} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage setPage={setPage} />} />
          <Route path="/reset-password" element={<ResetPasswordPage setPage={setPage} />} />
          <Route
            path="/dashboard"
            element={(
              <RequireParent user={user}>
                <DashboardPage user={user} setPage={setPage} />
              </RequireParent>
            )}
          />
          <Route
            path="/edit-profile"
            element={(
              <RequireParent user={user}>
                <EditProfilePage user={user} setPage={setPage} />
              </RequireParent>
            )}
          />
          <Route
            path="/payment"
            element={(
              <RequireParent user={user}>
                <PaymentPage user={user} setPage={setPage} />
              </RequireParent>
            )}
          />
          <Route
            path="/staff-profile"
            element={(
              <RequireStaff user={user}>
                <StaffProfilePage user={user} setPage={setPage} />
              </RequireStaff>
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
        )}
      </main>

      {!restrictedRolePath && <Footer setPage={setPage} />}
    </>
  );
}
