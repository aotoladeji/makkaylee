import { useEffect, useState } from "react";
import Badge from "../components/common/Badge";
import { API } from "../constants/api";
import { BRAND } from "../constants/brand";
import { ASH, NAVY } from "../constants/theme";

export default function DashboardPage({ user, setPage }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    fetch(`${API}/profile`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setProfile(data);
      })
      .catch(() => setError("Failed to load profile info"));
  }, [user]);

  if (!user) return <div style={{ padding: 40 }}>Please log in.</div>;
  if (error) return <div style={{ color: "red", padding: 40 }}>{error}</div>;
  if (!profile) return <div style={{ padding: 40 }}>Loading profile...</div>;

  const { registration, user: parent, billing } = profile;
  const registrationFee = billing?.registrationFee ?? 40000;
  const trainingSessionFee = billing?.trainingSessionFee ?? 30000;
  const bundleFee = billing?.bundleFee ?? 0;
  const hasBundleFee = bundleFee > 0;
  const fallbackTotal = registrationFee + trainingSessionFee + bundleFee;
  const amountDue = billing?.amountDue ?? fallbackTotal;
  const dueDateLabel = billing?.dueDate ? new Date(billing.dueDate).toLocaleDateString() : "Not set";
  const hasUploadedReceipt = !!billing?.receiptUrl;
  const paymentStatusLabel = billing?.paid
    ? "Paid"
    : hasUploadedReceipt
      ? "Receipt Uploaded - Awaiting Confirmation"
      : "Pending Payment";
  const paymentStatusColor = billing?.paid ? "#43A047" : hasUploadedReceipt ? "#1565c0" : "#FFA000";

  return (
    <div style={{ paddingTop: 70, background: ASH, minHeight: "100vh" }}>
      <div style={{ background: `linear-gradient(135deg, ${NAVY}, #1a3168)`, padding: "60px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
          <div style={{ width: 100, height: 100, borderRadius: "50%", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 900, color: ASH, border: "4px solid rgba(255,255,255,0.3)" }}>
            {registration?.playerName?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p style={{ color: ASH, fontWeight: 700, letterSpacing: 2, fontSize: 12, textTransform: "uppercase", margin: "0 0 4px" }}>Registered Member</p>
            <h1 style={{ color: "white", fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 900, margin: "0 0 8px" }}>{registration?.playerName}</h1>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <Badge>{registration?.program}</Badge>
              <span style={{ background: paymentStatusColor, color: "white", fontSize: 11, fontWeight: 800, letterSpacing: 1, padding: "4px 10px", borderRadius: 3, textTransform: "uppercase" }}>
                {paymentStatusLabel}
              </span>
              <button onClick={() => setPage("EditProfile")} style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.5)", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", marginLeft: "auto" }}>
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="dashboard-grid">
          <div style={{ background: "white", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <h3 style={{ color: NAVY, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, marginBottom: 20 }}>Player Profile</h3>
            {[["Full Name", registration?.playerName], ["Age", `${registration?.age} years old`], ["Gender", registration?.gender], ["Programme", registration?.program]].map(([key, value]) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F0F0F0", fontSize: 14 }}>
                <span style={{ color: "#888" }}>{key}</span>
                <span style={{ fontWeight: 700, color: NAVY }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "white", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <h3 style={{ color: NAVY, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, marginBottom: 20 }}>Guardian Details</h3>
            {[["Guardian Name", parent?.parentName], ["Phone", parent?.phone], ["Email", parent?.email || "Not provided"], ["Address", parent?.address || "Not provided"]].map(([key, value]) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F0F0F0", fontSize: 14 }}>
                <span style={{ color: "#888" }}>{key}</span>
                <span style={{ fontWeight: 700, color: NAVY, textAlign: "right", maxWidth: 220 }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "white", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <h3 style={{ color: NAVY, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, marginBottom: 16 }}>Medical Information</h3>
            <div style={{ background: "#FFF8E1", border: "1px solid #FFE082", borderRadius: 10, padding: 16, color: "#5D4037", fontSize: 14, lineHeight: 1.6 }}>
              {registration?.medical || "No medical conditions disclosed."}
            </div>
          </div>

          <div style={{ background: "white", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <h3 style={{ color: NAVY, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, marginBottom: 20 }}>Payment Status</h3>
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: billing?.paid ? "#2E7D32" : hasUploadedReceipt ? "#1565c0" : "#E65100" }}>{paymentStatusLabel}</div>
              <div style={{ color: "#888", fontSize: 14, marginTop: 4 }}>
                Registration fee: <strong>NGN {registrationFee.toLocaleString()}</strong>
                <br />
                Training session fee: <strong>NGN {trainingSessionFee.toLocaleString()}</strong>
                <br />
                Bundle fee (optional): <strong>{hasBundleFee ? `NGN ${bundleFee.toLocaleString()}` : "Not applied"}</strong>
                <br />
                <span style={{ color: NAVY, fontWeight: 900 }}>Amount Due: NGN {amountDue.toLocaleString()}</span>
                <br />
                <span style={{ color: "#555", fontWeight: 700 }}>Due Date: {dueDateLabel}</span>
              </div>
              {hasUploadedReceipt && !billing?.paid && (
                <div style={{ marginTop: 10, color: "#1565c0", fontSize: 13, fontWeight: 700 }}>
                  Receipt submitted. Admin confirmation pending.
                </div>
              )}
            </div>
            {!billing?.paid && (
              <button onClick={() => setPage("Payment")} style={{ width: "100%", background: NAVY, color: "white", border: "none", padding: "14px", borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: "pointer", marginTop: 8 }}>
                Go to Payment
              </button>
            )}
          </div>
        </div>

        <div style={{ marginTop: 24, background: `linear-gradient(135deg, ${NAVY}, #1a3168)`, borderRadius: 16, padding: "32px 40px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
            {[{ label: "Next Session", value: BRAND.nextSession }, { label: "Training Venue", value: `${BRAND.venue}, Ibadan` }, { label: "Academy Reg.", value: BRAND.reg }, { label: "Admin Contact", value: BRAND.phone }].map((item) => (
              <div key={item.label}>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 4 }}>{item.label}</div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
