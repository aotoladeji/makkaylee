import { useState } from "react";
import Input from "../components/common/Input";
import { API } from "../constants/api";
import { ASH, NAVY } from "../constants/theme";
import { signInWithFirebase } from "../services/firebaseAuth";

export default function LoginPage({ setUser, setPage }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [firebaseForm, setFirebaseForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [firebaseError, setFirebaseError] = useState("");
  const [firebaseLoading, setFirebaseLoading] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed");

      localStorage.setItem("token", data.token);
      localStorage.setItem("username", form.username);
      // Decode JWT payload to get role flags
      const payload = JSON.parse(atob(data.token.split(".")[1]));
      const isAdmin = payload.isAdmin || false;
      const isStaff = payload.isStaff || false;
      localStorage.setItem("isAdmin", isAdmin ? "1" : "0");
      localStorage.setItem("isStaff", isStaff ? "1" : "0");
      setUser({ username: form.username, token: data.token, isAdmin, isStaff });
      setPage(isAdmin ? "Admin" : isStaff ? "StaffProfile" : "Dashboard");
    } catch (submitError) {
      if (submitError instanceof TypeError) {
        setError("Cannot reach the server. Make sure the backend is running on http://localhost:5000.");
        return;
      }

      setError(submitError.message);
    }
  };

  const handleFirebaseChange = (event) => {
    setFirebaseForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleFirebaseSubmit = async (event) => {
    event.preventDefault();
    setFirebaseError("");
    setFirebaseLoading(true);

    try {
      const idToken = await signInWithFirebase(firebaseForm.email, firebaseForm.password);
      const response = await fetch(`${API}/login/firebase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Firebase login failed");

      const payload = JSON.parse(atob(data.token.split(".")[1]));
      const isAdmin = payload.isAdmin || false;
      const isStaff = payload.isStaff || false;

      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username || firebaseForm.email);
      localStorage.setItem("isAdmin", isAdmin ? "1" : "0");
      localStorage.setItem("isStaff", isStaff ? "1" : "0");

      setUser({
        username: data.username || firebaseForm.email,
        token: data.token,
        isAdmin,
        isStaff,
      });
      setPage(isAdmin ? "Admin" : isStaff ? "StaffProfile" : "Dashboard");
    } catch (submitError) {
      setFirebaseError(submitError.message);
    } finally {
      setFirebaseLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 400, margin: "80px auto", background: "white", borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
      <h2 style={{ color: NAVY, marginBottom: 24 }}>Login</h2>
      <form onSubmit={handleSubmit}>
        <Input label="Username" name="username" value={form.username} onChange={handleChange} required />
        <Input label="Password" name="password" value={form.password} onChange={handleChange} required type="password" />
        <button type="submit" style={{ background: NAVY, color: ASH, border: "none", padding: "12px 28px", borderRadius: 8, fontWeight: 800, cursor: "pointer", width: "100%", marginTop: 12 }}>
          Login
        </button>
        {error && <div style={{ color: "red", marginTop: 16 }}>{error}</div>}
        <p style={{ textAlign: "center", marginTop: 12 }}>
          <button onClick={() => setPage("ForgotPassword")} style={{ color: NAVY, background: "none", border: "none", cursor: "pointer", fontWeight: 700, textDecoration: "underline" }}>
            Forgot password?
          </button>
        </p>
      </form>
      <div style={{ marginTop: 24 }}>
        Do not have an account? <button onClick={() => setPage("Register")} style={{ color: NAVY, background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>Register</button>
      </div>
      <div style={{ marginTop: 8, fontSize: 13 }}>
        Staff member? <button onClick={() => setPage("StaffLogin")} style={{ color: NAVY, background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>Staff sign in</button>
      </div>

      <div style={{ marginTop: 28, borderTop: "1px solid #ececec", paddingTop: 20 }}>
        <h3 style={{ color: NAVY, margin: "0 0 12px", fontSize: 16 }}>Firebase Email Login</h3>
        <form onSubmit={handleFirebaseSubmit}>
          <Input label="Email" name="email" value={firebaseForm.email} onChange={handleFirebaseChange} required type="email" />
          <Input label="Password" name="password" value={firebaseForm.password} onChange={handleFirebaseChange} required type="password" />
          <button type="submit" disabled={firebaseLoading} style={{ background: NAVY, color: ASH, border: "none", padding: "12px 28px", borderRadius: 8, fontWeight: 800, cursor: firebaseLoading ? "not-allowed" : "pointer", width: "100%", marginTop: 12, opacity: firebaseLoading ? 0.7 : 1 }}>
            {firebaseLoading ? "Signing in..." : "Login with Firebase"}
          </button>
          {firebaseError && <div style={{ color: "red", marginTop: 12 }}>{firebaseError}</div>}
        </form>
      </div>
    </div>
  );
}
