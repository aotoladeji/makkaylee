import { useEffect, useState } from "react";
import { API } from "../constants/api";
import { BRAND } from "../constants/brand";
import { ASH, NAVY } from "../constants/theme";

export default function PaymentPage({ user, setPage }) {
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [billing, setBilling] = useState(null);

  useEffect(() => {
    if (!user?.token) return;

    fetch(`${API}/billing`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data?.error) setBilling(data);
      })
      .catch(() => {
        // Keep page usable even if billing lookup fails.
      });
  }, [user]);

  const registrationFee = billing?.registrationFee ?? 40000;
  const trainingSessionFee = billing?.trainingSessionFee ?? 30000;
  const bundleFee = billing?.bundleFee ?? 0;
  const hasBundleFee = bundleFee > 0;
  const amountDue = billing?.amountDue ?? registrationFee + trainingSessionFee + bundleFee;
  const dueDateLabel = billing?.dueDate ? new Date(billing.dueDate).toLocaleDateString() : "Not set";

  const handleUploadReceipt = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!user?.token) {
      setError("Please log in to upload your receipt.");
      return;
    }

    if (!receiptFile) {
      setError("Please choose a receipt file first.");
      return;
    }

    const formData = new FormData();
    formData.append("receipt", receiptFile);

    try {
      setUploading(true);
      const response = await fetch(`${API}/billing/receipt`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to upload receipt");

      setMessage("Receipt uploaded. Admin will confirm your payment shortly.");
      setReceiptFile(null);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  };

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

          <div style={{ marginTop: 18, padding: 16, background: ASH, borderRadius: 10 }}>
            <div style={{ color: "#666", fontSize: 12 }}>One-time registration fee</div>
            <div style={{ color: NAVY, fontWeight: 700, marginBottom: 6 }}>NGN {registrationFee.toLocaleString()}</div>
            <div style={{ color: "#666", fontSize: 12 }}>Training session fee</div>
            <div style={{ color: NAVY, fontWeight: 700, marginBottom: 6 }}>NGN {trainingSessionFee.toLocaleString()}</div>
            <div style={{ color: "#666", fontSize: 12 }}>Bundle fee (monthly combination, optional)</div>
            <div style={{ color: NAVY, fontWeight: 700, marginBottom: 10 }}>{hasBundleFee ? `NGN ${bundleFee.toLocaleString()}` : "Not applied"}</div>
            <div style={{ color: NAVY, fontWeight: 900 }}>Total amount due: NGN {amountDue.toLocaleString()}</div>
            <div style={{ color: "#555", fontWeight: 700, marginTop: 4 }}>Due date: {dueDateLabel}</div>
          </div>

          <p style={{ marginTop: 20, color: "#555" }}>Use your child&apos;s full name as payment reference. Contact admin after transfer for confirmation.</p>
          <a href={`tel:${BRAND.phone}`} style={{ display: "inline-block", background: NAVY, color: "white", textDecoration: "none", padding: "12px 20px", borderRadius: 8, fontWeight: 700 }}>
            Call Admin: {BRAND.phone}
          </a>

          <div style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid #eee" }}>
            <h3 style={{ color: NAVY, marginTop: 0 }}>Upload Payment Receipt</h3>
            <p style={{ color: "#666", fontSize: 14 }}>Accepted formats: image or PDF (max 10MB).</p>

            <form onSubmit={handleUploadReceipt}>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(event) => setReceiptFile(event.target.files?.[0] || null)}
                style={{ marginBottom: 14 }}
              />
              <div>
                <button
                  type="submit"
                  disabled={uploading}
                  style={{
                    background: NAVY,
                    color: "white",
                    border: "none",
                    padding: "12px 20px",
                    borderRadius: 8,
                    fontWeight: 700,
                    cursor: uploading ? "not-allowed" : "pointer",
                    opacity: uploading ? 0.75 : 1,
                  }}
                >
                  {uploading ? "Uploading..." : "Upload Receipt"}
                </button>
                {!!setPage && (
                  <button
                    type="button"
                    onClick={() => setPage("Dashboard")}
                    style={{
                      marginLeft: 10,
                      background: "transparent",
                      color: NAVY,
                      border: `1px solid ${NAVY}`,
                      padding: "12px 20px",
                      borderRadius: 8,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Back to Dashboard
                  </button>
                )}
              </div>
            </form>

            {error && <div style={{ color: "#c62828", marginTop: 12 }}>{error}</div>}
            {message && <div style={{ color: "#2e7d32", marginTop: 12 }}>{message}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
