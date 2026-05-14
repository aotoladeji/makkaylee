import { BRAND } from "../constants/brand";
import { ASH, NAVY } from "../constants/theme";

export default function PaymentPage() {
  return (
    <div style={{ paddingTop: 70, background: ASH, minHeight: "100vh" }}>
      <div style={{ background: `linear-gradient(135deg, ${NAVY}, #1a3168)`, padding: "60px 24px", textAlign: "center" }}>
        <h1 style={{ color: "white", fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, margin: 0 }}>Payment Information</h1>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ background: "white", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <h2 style={{ color: NAVY, marginTop: 0 }}>Bank Transfer Details</h2>
          {[ ["Account Name", BRAND.bank.name], ["Bank", BRAND.bank.bank], ["Account Number", BRAND.bank.account], ["Sort Code", BRAND.bank.sort] ].map(([label, value]) => (
            <div key={label} style={{ padding: "12px 0", borderBottom: "1px solid #eee" }}>
              <div style={{ color: "#777", fontSize: 12 }}>{label}</div>
              <div style={{ color: NAVY, fontWeight: 700 }}>{value}</div>
            </div>
          ))}
          <p style={{ marginTop: 20, color: "#555" }}>Use your child&apos;s full name as payment reference. Contact admin after transfer for confirmation.</p>
          <a href={`tel:${BRAND.phone}`} style={{ display: "inline-block", background: NAVY, color: "white", textDecoration: "none", padding: "12px 20px", borderRadius: 8, fontWeight: 700 }}>
            Call Admin: {BRAND.phone}
          </a>
        </div>
      </div>
    </div>
  );
}
