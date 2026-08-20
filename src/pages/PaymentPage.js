import { useEffect, useState } from "react";
import { API } from "../constants/api";
import { BRAND } from "../constants/brand";
import { ASH, NAVY } from "../constants/theme";

export default function PaymentPage({ user, setPage }) {
  const [receiptFile, setReceiptFile] = useState(null);
  const [paymentMode, setPaymentMode] = useState("one_time");
  const [selectedRegistrationId, setSelectedRegistrationId] = useState(() => localStorage.getItem("activeRegistrationId") || "");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [billing, setBilling] = useState(null);
  const [children, setChildren] = useState([]);

  useEffect(() => {
    if (!user?.token) return;

    const billingUrl = selectedRegistrationId
      ? `${API}/billing?registrationId=${selectedRegistrationId}`
      : `${API}/billing`;

    fetch(billingUrl, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data?.error) {
          setBilling(data);
          setChildren(data.children || []);
          // Sync the payment mode radio to this child's saved mode
          setPaymentMode(data.paymentMode || "one_time");
          setMessage("");
          setError("");
          setReceiptFile(null);
          if (data.registrationId) {
            const registrationIdValue = String(data.registrationId);
            setSelectedRegistrationId(registrationIdValue);
            localStorage.setItem("activeRegistrationId", registrationIdValue);
          }
        }
      })
      .catch(() => {
        // Keep page usable even if billing lookup fails.
      });
  }, [user, selectedRegistrationId]);

  const registrationFee = billing?.registrationFee ?? 40000;
  const registrationFeeSettled = !!billing?.registrationFeeSettled;
  const effectiveRegistrationFee = registrationFeeSettled ? 0 : registrationFee;
  const trainingSessionFee = billing?.trainingSessionFee ?? 30000;
  const bundleMonths = billing?.bundleMonths ?? 0;
  const bundleFee = billing?.bundleFee ?? 0;
  const hasBundleFee = bundleFee > 0;
  const oneTimeTotal = effectiveRegistrationFee + trainingSessionFee;
  const bundleTotal = effectiveRegistrationFee + bundleFee;
  const amountDue = paymentMode === "bundle" ? bundleTotal : oneTimeTotal;
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
    formData.append("paymentMode", paymentMode);
    if (selectedRegistrationId) {
      formData.append("registrationId", selectedRegistrationId);
    }

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
      <div style={{ position: "relative", background: "url('/hero.jpg') center/cover no-repeat", padding: "60px 24px", textAlign: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(13,27,62,0.9), rgba(26,49,104,0.78))" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ color: "white", fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, margin: 0 }}>Payment Information</h1>
          {billing?.playerName && (
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, marginTop: 10, fontWeight: 700 }}>
              Child: {billing.playerName}
            </p>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ background: "white", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <h2 style={{ color: NAVY, marginTop: 0 }}>Bank Transfer Details</h2>
          {children.length > 1 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: "#666", fontSize: 12, marginBottom: 6 }}>Select Child</div>
              <select
                value={selectedRegistrationId}
                onChange={(event) => {
                  setSelectedRegistrationId(event.target.value);
                  localStorage.setItem("activeRegistrationId", event.target.value);
                  setBilling(null);
                }}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd" }}
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id}>{child.playerName}</option>
                ))}
              </select>
            </div>
          )}
          {[ ["Account Name", BRAND.bank.name], ["Bank", BRAND.bank.bank], ["Account Number", BRAND.bank.account], ["Sort Code", BRAND.bank.sort] ].map(([label, value]) => (
            <div key={label} style={{ padding: "12px 0", borderBottom: "1px solid #eee" }}>
              <div style={{ color: "#777", fontSize: 12 }}>{label}</div>
              <div style={{ color: NAVY, fontWeight: 700 }}>{value}</div>
            </div>
          ))}

          <div style={{ marginTop: 18, padding: 16, background: ASH, borderRadius: 10 }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ color: NAVY, fontWeight: 700, marginBottom: 6 }}>Choose Payment Option</div>
              <label style={{ display: "block", marginBottom: 6, color: "#333" }}>
                <input
                  type="radio"
                  name="paymentMode"
                  value="one_time"
                  checked={paymentMode === "one_time"}
                  onChange={(event) => setPaymentMode(event.target.value)}
                />{" "}
                One-time payment (Registration + Training Session)
              </label>
              <label style={{ display: "block", color: hasBundleFee ? "#333" : "#999" }}>
                <input
                  type="radio"
                  name="paymentMode"
                  value="bundle"
                  checked={paymentMode === "bundle"}
                  onChange={(event) => setPaymentMode(event.target.value)}
                  disabled={!hasBundleFee}
                />{" "}
                Bundle payment ({bundleMonths > 0 ? `${bundleMonths} months` : "configured bundle"} + Registration)
              </label>
              {!hasBundleFee && <div style={{ color: "#999", fontSize: 12, marginTop: 4 }}>Bundle option is currently not available.</div>}
            </div>
            <div style={{ color: "#666", fontSize: 12 }}>One-time registration fee</div>
            <div style={{ color: NAVY, fontWeight: 700, marginBottom: 6 }}>
              {registrationFeeSettled ? "Already paid" : `NGN ${registrationFee.toLocaleString()}`}
            </div>
            <div style={{ color: "#666", fontSize: 12 }}>Training session fee</div>
            <div style={{ color: NAVY, fontWeight: 700, marginBottom: 6 }}>NGN {trainingSessionFee.toLocaleString()}</div>
            <div style={{ color: "#666", fontSize: 12 }}>Bundle payment format (months + amount)</div>
            <div style={{ color: NAVY, fontWeight: 700, marginBottom: 10 }}>{hasBundleFee ? `${bundleMonths} months = NGN ${bundleFee.toLocaleString()}` : "Not applied"}</div>
            <div style={{ color: NAVY, fontWeight: 900 }}>Selected amount due: NGN {amountDue.toLocaleString()}</div>
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
