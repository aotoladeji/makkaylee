import { useEffect, useState } from "react";
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

export default function App() {
  const [page, setPage] = useState("Home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

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
    setPage("Home");
  };

  return (
    <>
      <GlobalStyles />
      <Nav page={page} setPage={setPage} menuOpen={menuOpen} setMenuOpen={setMenuOpen} user={user} onLogout={handleLogout} />

      <main>
        {page === "Home" && <HomePage setPage={setPage} />}
        {page === "Programs" && <ProgramsPage setPage={setPage} />}
        {page === "Gallery" && <GalleryPage setPage={setPage} />}
        {page === "Register" && <RegisterPage setPage={setPage} />}
        {page === "Login" && <LoginPage setUser={setUser} setPage={setPage} />}
        {page === "ForgotPassword" && <ForgotPasswordPage setPage={setPage} />}
        {page === "ResetPassword" && <ResetPasswordPage setPage={setPage} />}
        {page === "Dashboard" && <DashboardPage user={user} setPage={setPage} />}
        {page === "EditProfile" && <EditProfilePage user={user} setPage={setPage} />}
        {page === "Payment" && <PaymentPage user={user} setPage={setPage} />}
        {page === "Admin" && <AdminDashboard user={user} setPage={setPage} />}
        {!["Home", "Programs", "Gallery", "Register", "Login", "ForgotPassword", "ResetPassword", "Dashboard", "EditProfile", "Payment", "Admin"].includes(page) && <NotFoundPage setPage={setPage} />}
      </main>

      <Footer setPage={setPage} />
    </>
  );
}
