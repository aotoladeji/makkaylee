import { useState, useEffect } from "react";
import Logo from "../common/Logo";
import { ASH, NAVY } from "../../constants/theme";

export default function Nav({ page, setPage, menuOpen, setMenuOpen, user, onLogout }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Home", page: "Home" },
    { label: "Programs", page: "Programs" },
    { label: "Gallery", page: "Gallery" },
    ...(user
      ? [
          { label: "Profile", page: "Dashboard" },
          { label: "Payment", page: "Payment" },
          ...(user?.isAdmin ? [{ label: "Admin", page: "Admin" }] : []),
        ]
      : [{ label: "Login", page: "Login" }]),
  ];

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: NAVY,
        transition: "background 0.3s, box-shadow 0.3s",
        boxShadow: scrolled ? "0 4px 20px rgba(0,0,0,0.2)" : "none",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 76 }}>
        <button
          onClick={() => setPage("Home")}
          style={{ display: "flex", alignItems: "center", gap: 14, background: "none", border: "none", cursor: "pointer", padding: "6px 0" }}
        >
          <Logo size={50} />
          <div style={{ textAlign: "left" }}>
            <div style={{ color: "white", fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900, fontSize: 17, lineHeight: 1 }}>MakkayLee</div>
            <div style={{ color: ASH, fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Football Academy</div>
          </div>
        </button>

        <div style={{ display: "flex", gap: 4, alignItems: "center" }} className="desktop-nav">
          {links.map((link) => (
            <button
              key={link.label}
              onClick={() => setPage(link.page)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: page === link.page ? ASH : "rgba(255,255,255,0.85)",
                fontWeight: page === link.page ? 700 : 500,
                fontSize: 14,
                padding: "8px 14px",
                borderBottom: page === link.page ? `2px solid ${ASH}` : "2px solid transparent",
                transition: "all 0.2s",
                letterSpacing: 0.5,
              }}
            >
              {link.label}
            </button>
          ))}

          {!user && (
            <button
              onClick={() => setPage("Register")}
              style={{
                marginLeft: 12,
                background: ASH,
                color: NAVY,
                border: "none",
                padding: "9px 20px",
                borderRadius: 6,
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
                letterSpacing: 0.5,
              }}
            >
              Join Now
            </button>
          )}

          {user && (
            <button
              onClick={onLogout}
              style={{
                marginLeft: 12,
                background: NAVY,
                color: ASH,
                border: `1px solid ${ASH}`,
                padding: "9px 20px",
                borderRadius: 6,
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
                letterSpacing: 0.5,
              }}
            >
              Logout
            </button>
          )}
        </div>

        <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: "none", background: "none", border: "none", cursor: "pointer", color: "white", fontSize: 24, padding: "8px 12px" }} className="mobile-menu-btn">
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      <div className={`mobile-menu ${menuOpen ? "open" : ""}`} style={{ background: NAVY, borderTop: `1px solid rgba(255,255,255,0.1)` }}>
        <div style={{ padding: "16px 24px" }}>
          {links.map((link) => (
            <button
              key={link.label}
              onClick={() => {
                setPage(link.page);
                setMenuOpen(false);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                background: "none",
                border: "none",
                color: page === link.page ? ASH : "white",
                padding: "12px 0",
                fontSize: 14,
                fontWeight: page === link.page ? 700 : 500,
                cursor: "pointer",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {link.label}
            </button>
          ))}

          {!user && (
            <button
              onClick={() => {
                setPage("Register");
                setMenuOpen(false);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                marginTop: 12,
                background: ASH,
                color: NAVY,
                border: "none",
                padding: "10px 16px",
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Join Now
            </button>
          )}

          {user && (
            <button
              onClick={() => {
                onLogout();
                setMenuOpen(false);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                marginTop: 12,
                background: "transparent",
                color: ASH,
                border: `1px solid ${ASH}`,
                padding: "10px 16px",
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
