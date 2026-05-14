import { NAVY } from "../constants/theme";

export default function NotFoundPage({ setPage }) {
  return (
    <div style={{ paddingTop: 70, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" }}>
      <div style={{ textAlign: "center", padding: "40px 24px" }}>
        <div style={{ fontSize: 120, fontWeight: 900, color: NAVY, marginBottom: 16 }}>404</div>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 48, fontWeight: 900, color: NAVY, margin: "0 0 12px" }}>Page Not Found</h1>
        <p style={{ color: "#555", fontSize: 18, marginBottom: 32 }}>The page you're looking for doesn't exist.</p>
        <button onClick={() => setPage("Home")} style={{ background: NAVY, color: "white", border: "none", padding: "12px 32px", borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
          Return Home
        </button>
      </div>
    </div>
  );
}
