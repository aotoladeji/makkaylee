import { useState } from "react";
import Input from "../components/common/Input";
import { API } from "../constants/api";
import { ASH, NAVY } from "../constants/theme";

export default function StaffLoginPage({ setUser, setPage }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API}/staff/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Staff login failed");

      const payload = JSON.parse(atob(data.token.split(".")[1]));
      const isAdmin = payload.isAdmin || false;
      const isStaff = payload.isStaff || false;

      localStorage.setItem("token", data.token);
      localStorage.setItem("username", form.username);
      localStorage.setItem("isAdmin", isAdmin ? "1" : "0");
      localStorage.setItem("isStaff", isStaff ? "1" : "0");

      setUser({ username: form.username, token: data.token, isAdmin, isStaff });
      setPage("StaffProfile");
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 420, margin: "80px auto", background: "white", borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
      <h2 style={{ color: NAVY, marginBottom: 8 }}>Staff Sign In</h2>
      <p style={{ color: "#666", marginTop: 0, marginBottom: 20, fontSize: 14 }}>
        For staff members only. Use your staff credentials to continue.
      </p>
      <form onSubmit={handleSubmit}>
        <Input label="Username" name="username" value={form.username} onChange={handleChange} required />
        <Input label="Password" name="password" value={form.password} onChange={handleChange} required type="password" />
        <button type="submit" style={{ background: NAVY, color: ASH, border: "none", padding: "12px 28px", borderRadius: 8, fontWeight: 800, cursor: "pointer", width: "100%", marginTop: 12 }}>
          Staff Login
        </button>
        {error && <div style={{ color: "red", marginTop: 16 }}>{error}</div>}
      </form>
      <p style={{ marginTop: 18, fontSize: 13, color: "#666" }}>
        Not staff? <button onClick={() => setPage("Login")} style={{ color: NAVY, background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>Go to parent/admin login</button>
      </p>
    </div>
  );
}
