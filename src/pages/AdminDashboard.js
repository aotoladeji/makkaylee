import { useState, useEffect } from "react";
import { API } from "../constants/api";
import { ASH, NAVY } from "../constants/theme";
import Input from "../components/common/Input";

export default function AdminDashboard({ user, setPage }) {
  const [registrations, setRegistrations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("registrations");
  const [error, setError] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    if (!user || !user.isAdmin) {
      setError("Access denied. Admin only.");
      return;
    }

    const fetchData = async () => {
      try {
        const [regsRes, usersRes] = await Promise.all([
          fetch(`${API}/admin/registrations`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          fetch(`${API}/admin/users`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
        ]);

        const regsData = await regsRes.json();
        const usersData = await usersRes.json();

        if (regsRes.ok) setRegistrations(regsData.data || []);
        if (usersRes.ok) setUsers(usersData.data || []);
      } catch (err) {
        setError("Failed to load admin data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError("All password fields are required.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    try {
      const response = await fetch(`${API}/admin/change-password`, {
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

      setPasswordSuccess("Password changed successfully.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (submitError) {
      setPasswordError(submitError.message);
    }
  };

  if (!user) return <div style={{ padding: 40, paddingTop: 110 }}>Please log in.</div>;
  if (error) return <div style={{ padding: 40, paddingTop: 110, color: "red" }}>{error}</div>;
  if (loading) return <div style={{ padding: 40, paddingTop: 110 }}>Loading admin dashboard...</div>;

  return (
    <div style={{ paddingTop: 70, background: ASH, minHeight: "100vh" }}>
      <div style={{ background: `linear-gradient(135deg, ${NAVY}, #1a3168)`, padding: "40px 24px", marginBottom: 32 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h1 style={{ color: "white", fontFamily: "'Playfair Display', Georgia, serif", fontSize: 40, fontWeight: 900, margin: 0 }}>Admin Dashboard</h1>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 40px" }}>
        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24, borderBottom: "2px solid #ddd" }}>
          <button
            onClick={() => setActiveTab("registrations")}
            style={{
              background: "none",
              border: "none",
              padding: "12px 0",
              borderBottom: activeTab === "registrations" ? `3px solid ${NAVY}` : "none",
              color: activeTab === "registrations" ? NAVY : "#999",
              fontWeight: activeTab === "registrations" ? 700 : 600,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            Registrations ({registrations.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            style={{
              background: "none",
              border: "none",
              padding: "12px 0",
              borderBottom: activeTab === "users" ? `3px solid ${NAVY}` : "none",
              color: activeTab === "users" ? NAVY : "#999",
              fontWeight: activeTab === "users" ? 700 : 600,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("security")}
            style={{
              background: "none",
              border: "none",
              padding: "12px 0",
              borderBottom: activeTab === "security" ? `3px solid ${NAVY}` : "none",
              color: activeTab === "security" ? NAVY : "#999",
              fontWeight: activeTab === "security" ? 700 : 600,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            Security
          </button>
        </div>

        {/* Registrations Tab */}
        {activeTab === "registrations" && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #eee" }}>
                  <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Player Name</th>
                  <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Age</th>
                  <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Program</th>
                  <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Status</th>
                  <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: 12, color: "#333" }}>{reg.playerName}</td>
                    <td style={{ padding: 12, color: "#333" }}>{reg.age}</td>
                    <td style={{ padding: 12, color: "#333" }}>{reg.program}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{ background: reg.status === "Paid" ? "#e8f5e9" : "#fff3e0", color: reg.status === "Paid" ? "#2e7d32" : "#e65100", padding: "4px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                        {reg.status}
                      </span>
                    </td>
                    <td style={{ padding: 12, color: "#666", fontSize: 12 }}>{new Date(reg.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #eee" }}>
                  <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Username</th>
                  <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Email</th>
                  <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Parent Name</th>
                  <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Phone</th>
                  <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: 12, color: "#333" }}>{u.username}</td>
                    <td style={{ padding: 12, color: "#333" }}>{u.email}</td>
                    <td style={{ padding: 12, color: "#333" }}>{u.parentName || "-"}</td>
                    <td style={{ padding: 12, color: "#333" }}>{u.phone || "-"}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{ background: u.isAdmin ? "#e3f2fd" : "#f5f5f5", color: u.isAdmin ? "#1565c0" : "#555", padding: "4px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                        {u.isAdmin ? "Admin" : "User"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "security" && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", maxWidth: 560 }}>
            <h3 style={{ color: NAVY, marginTop: 0, marginBottom: 16 }}>Change Admin Password</h3>
            <form onSubmit={handlePasswordSubmit}>
              <Input
                label="Current Password"
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                required
              />
              <Input
                label="New Password"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                required
              />
              <Input
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
              <button
                type="submit"
                style={{
                  background: NAVY,
                  color: "white",
                  border: "none",
                  padding: "12px 20px",
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Update Password
              </button>
              {passwordError && <div style={{ color: "red", marginTop: 12 }}>{passwordError}</div>}
              {passwordSuccess && <div style={{ color: "green", marginTop: 12 }}>{passwordSuccess}</div>}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
