import { useState, useEffect } from "react";
import Input from "../components/common/Input";
import { API } from "../constants/api";
import { ASH, NAVY } from "../constants/theme";

export default function ResetPasswordPage({ setPage }) {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Get token from URL query params (e.g., /reset-password?token=xyz)
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get("token");
    if (!resetToken) {
      setError("Invalid reset link. Please request a new one.");
    } else {
      setToken(resetToken);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to reset password");
      
      setSuccess("Password reset successful! Redirecting to login...");
      setTimeout(() => setPage("Login"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={{ paddingTop: 70, background: ASH, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: 420, background: "white", borderRadius: 16, padding: 40, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <div style={{ color: "#c62828", padding: 12, borderRadius: 8 }}>{error}</div>
          <button onClick={() => setPage("Login")} style={{ marginTop: 16, background: NAVY, color: "white", border: "none", padding: "12px 32px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 70, background: ASH, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: 420, width: "100%", background: "white", borderRadius: 16, padding: 40, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", margin: "24px" }}>
        <h1 style={{ color: NAVY, fontSize: 28, fontWeight: 900, margin: "0 0 8px", fontFamily: "'Playfair Display', Georgia, serif" }}>Create New Password</h1>
        <p style={{ color: "#555", marginBottom: 32, fontSize: 14 }}>Enter your new password below.</p>

        {error && <div style={{ background: "#ffebee", color: "#c62828", padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 14 }}>{error}</div>}
        {success && <div style={{ background: "#e8f5e9", color: "#2e7d32", padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 14 }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <Input label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Input label="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          <button type="submit" disabled={loading} style={{ width: "100%", background: loading ? "#ccc" : NAVY, color: "white", border: "none", padding: "12px 0", borderRadius: 8, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", marginTop: 12 }}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
