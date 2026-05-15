import { useState, useEffect } from "react";
import { API } from "../constants/api";
import { ASH, NAVY } from "../constants/theme";

export default function EditProfilePage({ user, setPage }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user) return;

    fetch(`${API}/profile`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setProfile(data);
          setForm({
            parentName: data.user?.parentName || "",
            phone: data.user?.phone || "",
            address: data.user?.address || "",
          });
        }
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update profile");

      setSuccess("Profile updated successfully!");
      setTimeout(() => setPage("Dashboard"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <div style={{ padding: 40, paddingTop: 110 }}>Please log in.</div>;
  if (loading) return <div style={{ padding: 40, paddingTop: 110 }}>Loading profile...</div>;
  if (!profile) return <div style={{ padding: 40, paddingTop: 110 }}>Error loading profile</div>;

  return (
    <div style={{ paddingTop: 70, background: ASH, minHeight: "100vh" }}>
      <div style={{ background: `linear-gradient(135deg, ${NAVY}, #1a3168)`, padding: "40px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h1 style={{ color: "white", fontFamily: "'Playfair Display', Georgia, serif", fontSize: 36, fontWeight: 900, margin: 0 }}>Edit Profile</h1>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ background: "white", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          {error && <div style={{ background: "#ffebee", color: "#c62828", padding: 12, borderRadius: 8, marginBottom: 20 }}>{error}</div>}
          {success && <div style={{ background: "#e8f5e9", color: "#2e7d32", padding: 12, borderRadius: 8, marginBottom: 20 }}>{success}</div>}

          <form onSubmit={handleSave}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontWeight: 700, fontSize: 13, color: NAVY, marginBottom: 6 }}>Parent/Guardian Name</label>
              <input type="text" name="parentName" value={form.parentName} onChange={handleChange} style={{ width: "100%", padding: "12px 16px", border: "2px solid #D0D5E0", borderRadius: 8, fontSize: 15, boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontWeight: 700, fontSize: 13, color: NAVY, marginBottom: 6 }}>Phone Number</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} style={{ width: "100%", padding: "12px 16px", border: "2px solid #D0D5E0", borderRadius: 8, fontSize: 15, boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontWeight: 700, fontSize: 13, color: NAVY, marginBottom: 6 }}>Address</label>
              <textarea name="address" value={form.address} onChange={handleChange} rows={4} style={{ width: "100%", padding: "12px 16px", border: "2px solid #D0D5E0", borderRadius: 8, fontSize: 15, boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" disabled={saving} style={{ background: NAVY, color: "white", border: "none", padding: "12px 32px", borderRadius: 8, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button type="button" onClick={() => setPage("Dashboard")} style={{ background: ASH, color: NAVY, border: "none", padding: "12px 32px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
