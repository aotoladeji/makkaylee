import { useEffect, useState } from "react";
import { API } from "../constants/api";
import { ASH, NAVY } from "../constants/theme";

export default function StaffProfilePage({ user }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ parentName: "", phone: "", address: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    fetch(`${API}/staff/profile`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }

        setProfile(data.data);
        setForm({
          parentName: data.data.parentName || "",
          phone: data.data.phone || "",
          address: data.data.address || "",
        });
      })
      .catch(() => setError("Failed to load staff profile"));
  }, [user]);

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API}/staff/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update profile");

      setMessage("Profile updated successfully.");
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  const handlePasswordSave = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError("All password fields are required.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    try {
      const response = await fetch(`${API}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to change password");

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setMessage("Password changed successfully.");
    } catch (passwordError) {
      setError(passwordError.message);
    }
  };

  if (!user) return <div style={{ padding: 40 }}>Please log in.</div>;
  if (!profile && !error) return <div style={{ padding: 40 }}>Loading staff profile...</div>;

  return (
    <div style={{ paddingTop: 70, background: ASH, minHeight: "100vh" }}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ color: NAVY, marginTop: 0, marginBottom: 8 }}>Staff Profile</h1>
        <p style={{ color: "#666", marginTop: 0, marginBottom: 24 }}>Manage your staff account details and password.</p>

        <div style={{ display: "grid", gap: 24 }}>
          <form onSubmit={handleProfileSave} style={{ background: "white", borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", padding: 20, maxWidth: 640 }}>
            <h3 style={{ color: NAVY, marginTop: 0 }}>Account Details</h3>
            <label style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>Name</label>
            <input value={form.parentName} onChange={(event) => setForm((current) => ({ ...current, parentName: event.target.value }))} style={{ width: "100%", marginBottom: 14, padding: "10px 12px", border: "1px solid #ccc", borderRadius: 8 }} />
            <label style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>Phone</label>
            <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} style={{ width: "100%", marginBottom: 14, padding: "10px 12px", border: "1px solid #ccc", borderRadius: 8 }} />
            <label style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>Address</label>
            <input value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} style={{ width: "100%", marginBottom: 14, padding: "10px 12px", border: "1px solid #ccc", borderRadius: 8 }} />
            <button type="submit" style={{ background: NAVY, color: "white", border: "none", padding: "10px 14px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
              Save Profile
            </button>
          </form>

          <form onSubmit={handlePasswordSave} style={{ background: "white", borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", padding: 20, maxWidth: 640 }}>
            <h3 style={{ color: NAVY, marginTop: 0 }}>Change Password</h3>
            <p style={{ color: "#666", marginTop: 0, marginBottom: 16, fontSize: 13 }}>Security settings are kept last to prevent accidental edits.</p>
            <label style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>Current Password</label>
            <input type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} style={{ width: "100%", marginBottom: 14, padding: "10px 12px", border: "1px solid #ccc", borderRadius: 8 }} />
            <label style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>New Password</label>
            <input type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} style={{ width: "100%", marginBottom: 14, padding: "10px 12px", border: "1px solid #ccc", borderRadius: 8 }} />
            <label style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>Confirm New Password</label>
            <input type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))} style={{ width: "100%", marginBottom: 14, padding: "10px 12px", border: "1px solid #ccc", borderRadius: 8 }} />
            <button type="submit" style={{ background: NAVY, color: "white", border: "none", padding: "10px 14px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
              Change Password
            </button>
          </form>
        </div>

        {error && <div style={{ color: "red", marginTop: 14 }}>{error}</div>}
        {message && <div style={{ color: "green", marginTop: 14 }}>{message}</div>}
      </div>
    </div>
  );
}
