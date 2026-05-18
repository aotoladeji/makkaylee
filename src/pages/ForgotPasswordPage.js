import { useState } from "react";
import Input from "../components/common/Input";
import { API } from "../constants/api";
import { ASH, NAVY } from "../constants/theme";

export default function ForgotPasswordPage({ setPage }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to send reset link");
      
      setSuccess("Reset link sent to your email. Check your inbox.");
      setEmail("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: 70, background: ASH, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: 420, width: "100%", background: "white", borderRadius: 16, padding: 40, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", margin: "24px" }}>
        <h1 style={{ color: NAVY, fontSize: 28, fontWeight: 900, margin: "0 0 8px", fontFamily: "'Playfair Display', Georgia, serif" }}>Reset Password</h1>
        <p style={{ color: "#555", marginBottom: 32, fontSize: 14 }}>Enter your email address and we'll send you a link to reset your password.</p>

        {error && <div style={{ background: "#ffebee", color: "#c62828", padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 14 }}>{error}</div>}
        {success && <div style={{ background: "#e8f5e9", color: "#2e7d32", padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 14 }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button type="submit" disabled={loading} style={{ width: "100%", background: loading ? "#ccc" : NAVY, color: "white", border: "none", padding: "12px 0", borderRadius: 8, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", marginTop: 12 }}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, color: "#555" }}>
          Remember your password?{" "}
          <button onClick={() => setPage("Login")} style={{ background: "none", border: "none", color: NAVY, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
            Back to Login
          </button>
        </p>
      </div>
    </div>
  );
}
