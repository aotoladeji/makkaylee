import Logo from "../common/Logo";
import { BRAND } from "../../constants/brand";
import { ASH, NAVY } from "../../constants/theme";

export default function Footer({ setPage }) {
  return (
    <footer style={{ background: "#070F24", color: "rgba(255,255,255,0.7)", paddingTop: 64 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48 }} className="footer-grid">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <Logo size={44} />
            <div>
              <div style={{ color: "white", fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900, fontSize: 16 }}>MakkayLee FA</div>
              <div style={{ color: "white", fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>FOOTBALL ACADEMY</div>
            </div>
          </div>
          <p style={{ lineHeight: 1.8, fontSize: 14, maxWidth: 280 }}>Developing the next generation of Nigerian football talent through elite coaching, discipline, and passion for the beautiful game.</p>
          <div style={{ marginTop: 20, padding: "10px 16px", background: "rgba(96,112,128,0.1)", border: `1px solid ${ASH}30`, borderRadius: 8, display: "inline-block" }}>
            <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>CAC Reg. No: {BRAND.reg}</span>
          </div>
        </div>

        {[
          { title: "Quick Links", links: [["Home", "Home"], ["Programs", "Programs"], ["Sponsors", "Sponsors"], ["Partners", "Partners"], ["Register", "Register"], ["Payment", "Payment"]] },
          { title: "Programmes", links: [["Junior Stars (4-8)", "Programs"], ["Intermediate (9-12)", "Programs"], ["Elite (13-15)", "Programs"]] },
        ].map((column) => (
          <div key={column.title}>
            <h4 style={{ color: "white", fontWeight: 700, marginBottom: 20, fontSize: 15 }}>{column.title}</h4>
            {column.links.map(([label, targetPage]) => (
              <button key={label} onClick={() => setPage(targetPage)} style={{ display: "block", background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 14, padding: "4px 0", textAlign: "left" }}>
                {label}
              </button>
            ))}
          </div>
        ))}

        <div>
          <h4 style={{ color: "white", fontWeight: 700, marginBottom: 20, fontSize: 15 }}>Contact</h4>
          {[
            ["Phone", BRAND.phone],
            ["Email", BRAND.email],
            ["Instagram", BRAND.instagram],
            ["Address", "Ibadan, Oyo State, Nigeria"],
          ].map(([key, text]) => (
            <div key={key} style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 13 }}>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>{key}:</span>
              <span style={{ color: "rgba(255,255,255,0.7)" }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 48, padding: "24px", textAlign: "center", fontSize: 13 }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${NAVY}, transparent)`, margin: "0 auto", width: "80%", borderRadius: 2 }} />
        <p style={{ marginTop: 20 }}>© {new Date().getFullYear()} MakkayLee Football Academy · {BRAND.reg} · All rights reserved</p>
      </div>
    </footer>
  );
}
