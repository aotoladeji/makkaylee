import { useEffect, useState } from "react";
import Badge from "../components/common/Badge";
import { API } from "../constants/api";
import { BRAND } from "../constants/brand";
import { BADGES } from "../constants/badges";
import { ASH, NAVY } from "../constants/theme";

export default function DashboardPage({ user, setPage }) {
  const [profile, setProfile] = useState(null);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState(() => localStorage.getItem("activeRegistrationId") || "");
  const [error, setError] = useState("");
  const [childActionError, setChildActionError] = useState("");
  const [childActionMessage, setChildActionMessage] = useState("");
  const [editingChildId, setEditingChildId] = useState(null);
  const [editingChildForm, setEditingChildForm] = useState({
    playerName: "",
    age: "",
    gender: "",
    program: "",
    medical: "",
  });
  const [busyChildId, setBusyChildId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const profileUrl = selectedRegistrationId
      ? `${API}/profile?registrationId=${selectedRegistrationId}`
      : `${API}/profile`;

    fetch(profileUrl, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setProfile(data);
          if (data.registration?.id) {
            const registrationIdValue = String(data.registration.id);
            setSelectedRegistrationId(registrationIdValue);
            localStorage.setItem("activeRegistrationId", registrationIdValue);
          }
        }
      })
      .catch(() => setError("Failed to load profile info"));
  }, [user, selectedRegistrationId, reloadKey]);

  const startEditChild = (child) => {
    setChildActionError("");
    setChildActionMessage("");
    setEditingChildId(child.id);
    setEditingChildForm({
      playerName: child.playerName || "",
      age: child.age || "",
      gender: child.gender || "",
      program: child.program || "",
      medical: child.medical || "",
    });
  };

  const saveChildEdit = async (childId) => {
    setChildActionError("");
    setChildActionMessage("");
    setBusyChildId(childId);

    try {
      const response = await fetch(`${API}/children/${childId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(editingChildForm),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update child");

      setEditingChildId(null);
      setChildActionMessage("Child profile updated successfully.");
      setReloadKey((current) => current + 1);
    } catch (editError) {
      setChildActionError(editError.message);
    } finally {
      setBusyChildId(null);
    }
  };

  const deleteChild = async (childId, childName) => {
    const confirmed = window.confirm(`Delete ${childName}? This will remove the child profile and billing record.`);
    if (!confirmed) return;

    setChildActionError("");
    setChildActionMessage("");
    setBusyChildId(childId);

    try {
      const response = await fetch(`${API}/children/${childId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete child");

      if (String(childId) === selectedRegistrationId) {
        localStorage.removeItem("activeRegistrationId");
        setSelectedRegistrationId("");
      }

      setChildActionMessage("Child profile deleted successfully.");
      setReloadKey((current) => current + 1);
    } catch (deleteError) {
      setChildActionError(deleteError.message);
    } finally {
      setBusyChildId(null);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

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

    setPasswordSaving(true);

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
      setPasswordMessage("Password changed successfully.");
    } catch (submitError) {
      setPasswordError(submitError.message);
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!user) return <div style={{ padding: 40 }}>Please log in.</div>;
  if (error) return <div style={{ color: "red", padding: 40 }}>{error}</div>;
  if (!profile) return <div style={{ padding: 40 }}>Loading profile...</div>;

  const { registration, user: parent, billing, children = [] } = profile;
  const registrationFee = billing?.registrationFee ?? 40000;
  const registrationFeeSettled = !!billing?.registrationFeeSettled;
  const effectiveRegistrationFee = registrationFeeSettled ? 0 : registrationFee;
  const trainingSessionFee = billing?.trainingSessionFee ?? 30000;
  const bundleMonths = billing?.bundleMonths ?? 0;
  const bundleFee = billing?.bundleFee ?? 0;
  const hasBundleFee = bundleMonths > 0 && bundleFee > 0;
  const paymentMode = billing?.paymentMode || "one_time";
  const paymentModeLabel = paymentMode === "bundle" ? "Bundle Payment" : "One-time Payment";
  const fallbackTotal = paymentMode === "bundle"
    ? effectiveRegistrationFee + bundleFee
    : effectiveRegistrationFee + trainingSessionFee;
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
              {children.length > 1 && (
                <select
                  value={selectedRegistrationId}
                  onChange={(event) => {
                    setSelectedRegistrationId(event.target.value);
                    localStorage.setItem("activeRegistrationId", event.target.value);
                    setProfile(null);
                  }}
                  style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.15)", color: "white", fontWeight: 700 }}
                >
                  {children.map((child) => (
                    <option key={child.id} value={child.id} style={{ color: "#111" }}>
                      {child.playerName}
                    </option>
                  ))}
                </select>
              )}
              <Badge>{registration?.program}</Badge>
              <span style={{ background: paymentStatusColor, color: "white", fontSize: 11, fontWeight: 800, letterSpacing: 1, padding: "4px 10px", borderRadius: 3, textTransform: "uppercase" }}>
                {paymentStatusLabel}
              </span>
              <button onClick={() => setPage("Register")} style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.5)", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Add Child
              </button>
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
                Registration fee: <strong>{registrationFeeSettled ? "Already paid" : `NGN ${registrationFee.toLocaleString()}`}</strong>
                <br />
                Training session fee: <strong>NGN {trainingSessionFee.toLocaleString()}</strong>
                <br />
                Bundle format: <strong>{hasBundleFee ? `${bundleMonths} months = NGN ${bundleFee.toLocaleString()}` : "Not applied"}</strong>
                <br />
                Payment option: <strong>{paymentModeLabel}</strong>
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

          <div style={{ background: "white", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <h3 style={{ color: NAVY, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, marginBottom: 20 }}>Security</h3>
            <form onSubmit={handleChangePassword}>
              <label style={{ display: "block", marginBottom: 6, color: "#666", fontSize: 13 }}>Current Password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                style={{ width: "100%", marginBottom: 12, padding: "10px 12px", border: "1px solid #ccc", borderRadius: 8 }}
              />
              <label style={{ display: "block", marginBottom: 6, color: "#666", fontSize: 13 }}>New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                style={{ width: "100%", marginBottom: 12, padding: "10px 12px", border: "1px solid #ccc", borderRadius: 8 }}
              />
              <label style={{ display: "block", marginBottom: 6, color: "#666", fontSize: 13 }}>Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                style={{ width: "100%", marginBottom: 12, padding: "10px 12px", border: "1px solid #ccc", borderRadius: 8 }}
              />
              <button type="submit" disabled={passwordSaving} style={{ background: NAVY, color: "white", border: "none", padding: "10px 14px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                {passwordSaving ? "Saving..." : "Change Password"}
              </button>
              {passwordError && <div style={{ color: "red", marginTop: 10, fontSize: 13 }}>{passwordError}</div>}
              {passwordMessage && <div style={{ color: "green", marginTop: 10, fontSize: 13 }}>{passwordMessage}</div>}
            </form>
          </div>
        </div>

        {(() => {
          const awardedBadges = (registration?.badges || []).map((key) => BADGES[key]).filter(Boolean);
          return (
            <div style={{ marginTop: 24, background: "white", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
              <h3 style={{ color: NAVY, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, marginTop: 0, marginBottom: 20 }}>Performance Badges</h3>
              {awardedBadges.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#aaa" }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>🏅</div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>No badges awarded yet</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>Keep training hard — your coach will award badges as you grow!</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  {awardedBadges.map((badge) => (
                    <div
                      key={badge.key}
                      title={badge.description}
                      style={{
                        background: badge.bg,
                        border: `2px solid ${badge.border}`,
                        borderRadius: 12,
                        padding: "12px 18px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        minWidth: 160,
                      }}
                    >
                      <span style={{ fontSize: 28 }}>{badge.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 800, color: badge.color, fontSize: 14 }}>{badge.label}</div>
                        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{badge.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        <div style={{ marginTop: 24, background: "white", borderRadius: 16, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <h3 style={{ color: NAVY, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, margin: 0 }}>My Children</h3>
            <button
              onClick={() => setPage("Register")}
              style={{ background: NAVY, color: "white", border: "none", padding: "10px 14px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
            >
              Add Another Child
            </button>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {children.map((child) => {
              const childPaymentLabel = child.billing?.paid
                ? "Paid"
                : child.billing?.receiptUploadedAt
                  ? "Receipt Submitted"
                  : "Pending Payment";

              return (
                <div key={child.id} style={{ border: "1px solid #e8e8e8", borderRadius: 10, padding: 14 }}>
                  {editingChildId === child.id ? (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                        <input
                          value={editingChildForm.playerName}
                          onChange={(event) => setEditingChildForm((current) => ({ ...current, playerName: event.target.value }))}
                          placeholder="Player full name"
                          style={{ padding: "9px 10px", borderRadius: 6, border: "1px solid #ccc" }}
                        />
                        <input
                          type="number"
                          value={editingChildForm.age}
                          onChange={(event) => setEditingChildForm((current) => ({ ...current, age: event.target.value }))}
                          placeholder="Age"
                          min="4"
                          max="15"
                          style={{ padding: "9px 10px", borderRadius: 6, border: "1px solid #ccc" }}
                        />
                        <select
                          value={editingChildForm.gender}
                          onChange={(event) => setEditingChildForm((current) => ({ ...current, gender: event.target.value }))}
                          style={{ padding: "9px 10px", borderRadius: 6, border: "1px solid #ccc" }}
                        >
                          <option value="">Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        <select
                          value={editingChildForm.program}
                          onChange={(event) => setEditingChildForm((current) => ({ ...current, program: event.target.value }))}
                          style={{ padding: "9px 10px", borderRadius: 6, border: "1px solid #ccc" }}
                        >
                          <option value="">Programme</option>
                          <option value="Junior Stars (4-8)">Junior Stars (4-8)</option>
                          <option value="Intermediate (9-12)">Intermediate (9-12)</option>
                          <option value="Elite (13-15)">Elite (13-15)</option>
                        </select>
                      </div>
                      <textarea
                        value={editingChildForm.medical}
                        onChange={(event) => setEditingChildForm((current) => ({ ...current, medical: event.target.value }))}
                        placeholder="Medical information"
                        rows={2}
                        style={{ marginTop: 10, width: "100%", padding: "9px 10px", borderRadius: 6, border: "1px solid #ccc" }}
                      />
                      <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                        <button
                          onClick={() => saveChildEdit(child.id)}
                          disabled={busyChildId === child.id}
                          style={{ background: NAVY, color: "white", border: "none", padding: "8px 12px", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}
                        >
                          {busyChildId === child.id ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingChildId(null)}
                          style={{ background: "#eee", color: "#333", border: "none", padding: "8px 12px", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ color: NAVY, fontWeight: 900 }}>{child.playerName}</div>
                          <div style={{ color: "#666", fontSize: 13 }}>{child.age} yrs • {child.gender} • {child.program}</div>
                          <div style={{ color: "#777", fontSize: 12, marginTop: 4 }}>
                            Payment: <strong>{childPaymentLabel}</strong>
                            {child.billing?.selectedAmount ? ` • NGN ${Number(child.billing.selectedAmount).toLocaleString()}` : ""}
                            {child.billing?.dueDate ? ` • Due ${new Date(child.billing.dueDate).toLocaleDateString()}` : ""}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            onClick={() => {
                              setSelectedRegistrationId(String(child.id));
                              localStorage.setItem("activeRegistrationId", String(child.id));
                            }}
                            style={{ background: "#edf4ff", color: NAVY, border: "none", padding: "8px 12px", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => startEditChild(child)}
                            style={{ background: "#f3f4f6", color: "#374151", border: "none", padding: "8px 12px", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteChild(child.id, child.playerName)}
                            disabled={busyChildId === child.id}
                            style={{ background: "#ffebee", color: "#b71c1c", border: "none", padding: "8px 12px", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}
                          >
                            {busyChildId === child.id ? "Deleting..." : "Remove"}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {childActionError && <div style={{ color: "#b71c1c", marginTop: 12 }}>{childActionError}</div>}
          {childActionMessage && <div style={{ color: "#2e7d32", marginTop: 12 }}>{childActionMessage}</div>}
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
