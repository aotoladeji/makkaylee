import { useEffect, useMemo, useState } from "react";
import { API } from "../constants/api";
import { ASH, NAVY } from "../constants/theme";
import Input from "../components/common/Input";

export default function AdminDashboard({ user, setPage }) {
  const [registrations, setRegistrations] = useState([]);
  const [users, setUsers] = useState([]);
  const [galleryMedia, setGalleryMedia] = useState([]);
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

  const [eventForm, setEventForm] = useState({
    title: "Next Training Session",
    dateLabel: "",
    venue: "",
    note: "",
  });
  const [eventMessage, setEventMessage] = useState("");
  const [eventError, setEventError] = useState("");

  const [uploadForm, setUploadForm] = useState({
    title: "",
    caption: "",
    mediaFile: null,
  });
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [registrationActionError, setRegistrationActionError] = useState("");
  const [registrationActionMessage, setRegistrationActionMessage] = useState("");
  const [paymentConfigForm, setPaymentConfigForm] = useState({
    oneTimeRegistrationFee: 40000,
    trainingSessionFee: 30000,
    bundleMonths: 0,
    monthlyBundleFee: 0,
    dueDate: "",
  });
  const [paymentConfigMessage, setPaymentConfigMessage] = useState("");
  const [paymentConfigError, setPaymentConfigError] = useState("");
  const [selectedFamilyKey, setSelectedFamilyKey] = useState("");
  const [selectedFamilyChildId, setSelectedFamilyChildId] = useState("");

  const apiBase = useMemo(() => API.replace(/\/api$/, ""), []);
  const familyGroups = useMemo(() => {
    const grouped = new Map();

    registrations.forEach((registration) => {
      const parentName = registration.User?.parentName || "Unknown Parent";
      const parentEmail = registration.User?.email || "No email";
      const parentPhone = registration.User?.phone || "No phone";
      const key = `${parentEmail}::${parentName}::${parentPhone}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          parentName,
          parentEmail,
          parentPhone,
          children: [],
        });
      }

      grouped.get(key).children.push(registration);
    });

    const families = Array.from(grouped.values()).map((family) => ({
      ...family,
      children: family.children.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    }));

    return families.sort((a, b) => a.parentName.localeCompare(b.parentName));
  }, [registrations]);

  const selectedFamily = useMemo(
    () => familyGroups.find((family) => family.key === selectedFamilyKey) || null,
    [familyGroups, selectedFamilyKey],
  );

  const selectedFamilyChild = useMemo(
    () => selectedFamily?.children.find((child) => String(child.id) === selectedFamilyChildId) || null,
    [selectedFamily, selectedFamilyChildId],
  );

  const registrationsToShow = useMemo(() => {
    if (!selectedFamily) return registrations;
    if (!selectedFamilyChildId) return selectedFamily.children;
    return selectedFamilyChild ? [selectedFamilyChild] : selectedFamily.children;
  }, [registrations, selectedFamily, selectedFamilyChildId, selectedFamilyChild]);

  const toMediaUrl = (mediaUrl) => {
    if (!mediaUrl) return "";
    if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://")) return mediaUrl;
    return `${apiBase}${mediaUrl}`;
  };

  const toDateInputValue = (dateValue) => {
    if (!dateValue) return "";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  };

  useEffect(() => {
    if (!user || !user.isAdmin) {
      setError("Access denied. Admin only.");
      return;
    }

    const fetchData = async () => {
      try {
        const [regsRes, usersRes, eventRes, galleryRes, paymentConfigRes] = await Promise.all([
          fetch(`${API}/admin/registrations`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          fetch(`${API}/admin/users`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          fetch(`${API}/training-event`),
          fetch(`${API}/admin/gallery`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          fetch(`${API}/payment-config`),
        ]);

        const regsData = await regsRes.json();
        const usersData = await usersRes.json();
        const eventData = await eventRes.json();
        const galleryData = await galleryRes.json();
        const paymentConfigData = await paymentConfigRes.json();

        if (regsRes.ok) {
          setRegistrations(regsData.data || []);
        }
        if (usersRes.ok) setUsers(usersData.data || []);
        if (eventRes.ok && eventData.data) {
          setEventForm({
            title: eventData.data.title || "Next Training Session",
            dateLabel: eventData.data.dateLabel || "",
            venue: eventData.data.venue || "",
            note: eventData.data.note || "",
          });
        }
        if (galleryRes.ok) setGalleryMedia(galleryData.data || []);
        if (paymentConfigRes.ok && paymentConfigData.data) {
          setPaymentConfigForm({
            oneTimeRegistrationFee: paymentConfigData.data.oneTimeRegistrationFee ?? 40000,
            trainingSessionFee: paymentConfigData.data.trainingSessionFee ?? 30000,
            bundleMonths: paymentConfigData.data.bundleMonths ?? 0,
            monthlyBundleFee: paymentConfigData.data.monthlyBundleFee ?? 0,
            dueDate: toDateInputValue(paymentConfigData.data.dueDate),
          });
        }
      } catch (err) {
        setError("Failed to load admin data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    if (!familyGroups.length) {
      setSelectedFamilyKey("");
      setSelectedFamilyChildId("");
      return;
    }

    const currentFamilyExists = familyGroups.some((family) => family.key === selectedFamilyKey);
    if (!currentFamilyExists) {
      setSelectedFamilyKey(familyGroups[0].key);
      setSelectedFamilyChildId("");
      return;
    }

    if (selectedFamilyChildId) {
      const childExists = selectedFamily?.children.some((child) => String(child.id) === selectedFamilyChildId);
      if (!childExists) {
        setSelectedFamilyChildId("");
      }
    }
  }, [familyGroups, selectedFamilyKey, selectedFamilyChildId, selectedFamily]);

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

  const handleEventInput = (event) => {
    const { name, value } = event.target;
    setEventForm((current) => ({ ...current, [name]: value }));
  };

  const handleEventSubmit = async (event) => {
    event.preventDefault();
    setEventError("");
    setEventMessage("");

    if (!eventForm.title || !eventForm.dateLabel || !eventForm.venue) {
      setEventError("Title, date label, and venue are required.");
      return;
    }

    try {
      const response = await fetch(`${API}/admin/training-event`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(eventForm),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update event");
      setEventMessage("Hero event notification updated.");
    } catch (submitError) {
      setEventError(submitError.message);
    }
  };

  const handleUploadChange = (event) => {
    const { name, value, files } = event.target;

    if (name === "mediaFile") {
      setUploadForm((current) => ({ ...current, mediaFile: files?.[0] || null }));
      return;
    }

    setUploadForm((current) => ({ ...current, [name]: value }));
  };

  const handleUploadSubmit = async (event) => {
    event.preventDefault();
    setUploadError("");
    setUploadMessage("");

    if (!uploadForm.title || !uploadForm.mediaFile) {
      setUploadError("Title and media file are required.");
      return;
    }

    const body = new FormData();
    body.append("title", uploadForm.title);
    body.append("caption", uploadForm.caption);
    body.append("media", uploadForm.mediaFile);

    try {
      const response = await fetch(`${API}/admin/gallery/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to upload media");

      setGalleryMedia((current) => [data.data, ...current]);
      setUploadMessage("Gallery media uploaded.");
      setUploadForm({ title: "", caption: "", mediaFile: null });
    } catch (submitError) {
      setUploadError(submitError.message);
    }
  };

  const handleDeleteMedia = async (id) => {
    try {
      const response = await fetch(`${API}/admin/gallery/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete media");

      setGalleryMedia((current) => current.filter((item) => item.id !== id));
    } catch (deleteError) {
      setUploadError(deleteError.message);
    }
  };

  const handleConfirmPayment = async (registrationId) => {
    setRegistrationActionError("");
    setRegistrationActionMessage("");

    try {
      const response = await fetch(`${API}/admin/registrations/${registrationId}/confirm-payment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to confirm payment");

      setRegistrations((current) =>
        current.map((registration) => {
          if (registration.id !== registrationId) return registration;

          return {
            ...registration,
            status: "Paid",
            BillingInfo: {
              ...registration.BillingInfo,
              paid: true,
              registrationFeeSettled: true,
              paymentConfirmedAt: new Date().toISOString(),
            },
          };
        }),
      );
      setRegistrationActionMessage("Payment confirmed successfully.");
    } catch (submitError) {
      setRegistrationActionError(submitError.message);
    }
  };

  const handlePaymentConfigInput = (event) => {
    const { name, value } = event.target;
    setPaymentConfigForm((current) => ({ ...current, [name]: value }));
  };

  const handleSavePaymentConfig = async (event) => {
    event.preventDefault();
    setPaymentConfigError("");
    setPaymentConfigMessage("");

    if (
      paymentConfigForm.oneTimeRegistrationFee === ""
      || paymentConfigForm.trainingSessionFee === ""
      || !paymentConfigForm.dueDate
    ) {
      setPaymentConfigError("Registration fee, session fee, and due date are required.");
      return;
    }

    const registrationFee = Number(paymentConfigForm.oneTimeRegistrationFee);
    const sessionFee = Number(paymentConfigForm.trainingSessionFee);
    const months = paymentConfigForm.bundleMonths === "" ? 0 : Number(paymentConfigForm.bundleMonths);
    const bundleFee = paymentConfigForm.monthlyBundleFee === "" ? 0 : Number(paymentConfigForm.monthlyBundleFee);

    if (
      Number.isNaN(registrationFee)
      || registrationFee < 0
      || Number.isNaN(sessionFee)
      || sessionFee < 0
      || Number.isNaN(months)
      || months < 0
      || !Number.isInteger(months)
      || Number.isNaN(bundleFee)
      || bundleFee < 0
    ) {
      setPaymentConfigError("All fee values must be non-negative numbers, and bundle months must be a whole number.");
      return;
    }

    if ((months > 0 && bundleFee <= 0) || (months === 0 && bundleFee > 0)) {
      setPaymentConfigError("Bundle months and bundle amount must be set together.");
      return;
    }

    try {
      const response = await fetch(`${API}/admin/payment-config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          oneTimeRegistrationFee: registrationFee,
          trainingSessionFee: sessionFee,
          bundleMonths: months,
          monthlyBundleFee: bundleFee,
          dueDate: paymentConfigForm.dueDate,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update payment config");

      setRegistrations((current) =>
        current.map((registration) => {
          if (registration.BillingInfo?.paid) return registration;

          return {
            ...registration,
            BillingInfo: {
              ...registration.BillingInfo,
              amountDue: (registration.BillingInfo?.paymentMode || "one_time") === "bundle"
                ? (registration.BillingInfo?.registrationFeeSettled ? 0 : registrationFee) + bundleFee
                : (registration.BillingInfo?.registrationFeeSettled ? 0 : registrationFee) + sessionFee,
              registrationFee,
              trainingSessionFee: sessionFee,
              bundleMonths: months,
              bundleFee,
              dueDate: paymentConfigForm.dueDate,
            },
          };
        }),
      );

      setPaymentConfigMessage("Global payment settings updated for all unpaid records.");
    } catch (submitError) {
      setPaymentConfigError(submitError.message);
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
        <div style={{ display: "flex", gap: 16, marginBottom: 24, borderBottom: "2px solid #ddd", flexWrap: "wrap" }}>
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
            onClick={() => setActiveTab("paymentSettings")}
            style={{
              background: "none",
              border: "none",
              padding: "12px 0",
              borderBottom: activeTab === "paymentSettings" ? `3px solid ${NAVY}` : "none",
              color: activeTab === "paymentSettings" ? NAVY : "#999",
              fontWeight: activeTab === "paymentSettings" ? 700 : 600,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            Payment Settings
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
            onClick={() => setActiveTab("content")}
            style={{
              background: "none",
              border: "none",
              padding: "12px 0",
              borderBottom: activeTab === "content" ? `3px solid ${NAVY}` : "none",
              color: activeTab === "content" ? NAVY : "#999",
              fontWeight: activeTab === "content" ? 700 : 600,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            Content
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

        {activeTab === "registrations" && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", overflowX: "auto" }}>
            <div style={{ marginBottom: 20, padding: 16, border: "1px solid #e8e8e8", borderRadius: 10 }}>
              <h3 style={{ margin: "0 0 12px", color: NAVY }}>Family Overview</h3>
              <div style={{ display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 4 }}>Parent Account</label>
                  <select
                    value={selectedFamilyKey}
                    onChange={(event) => {
                      setSelectedFamilyKey(event.target.value);
                      setSelectedFamilyChildId("");
                    }}
                    style={{ minWidth: 280, padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc" }}
                  >
                    {familyGroups.map((family) => (
                      <option key={family.key} value={family.key}>
                        {family.parentName} ({family.parentEmail})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 4 }}>Child Registration</label>
                  <select
                    value={selectedFamilyChildId}
                    onChange={(event) => setSelectedFamilyChildId(event.target.value)}
                    style={{ minWidth: 220, padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc" }}
                    disabled={!selectedFamily}
                  >
                    <option value="">All children in family</option>
                    {(selectedFamily?.children || []).map((child) => (
                      <option key={child.id} value={String(child.id)}>
                        {child.playerName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedFamily && (
                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                  <div style={{ background: ASH, borderRadius: 8, padding: 10 }}>
                    <div style={{ color: "#666", fontSize: 12 }}>Parent</div>
                    <div style={{ color: NAVY, fontWeight: 800 }}>{selectedFamily.parentName}</div>
                    <div style={{ color: "#555", fontSize: 12 }}>{selectedFamily.parentEmail}</div>
                    <div style={{ color: "#555", fontSize: 12 }}>{selectedFamily.parentPhone}</div>
                  </div>
                  <div style={{ background: ASH, borderRadius: 8, padding: 10 }}>
                    <div style={{ color: "#666", fontSize: 12 }}>Children</div>
                    <div style={{ color: NAVY, fontWeight: 800 }}>{selectedFamily.children.length}</div>
                    <div style={{ color: "#555", fontSize: 12 }}>
                      Paid: {selectedFamily.children.filter((child) => child.BillingInfo?.paid).length} | Pending: {selectedFamily.children.filter((child) => !child.BillingInfo?.paid).length}
                    </div>
                  </div>
                  <div style={{ background: ASH, borderRadius: 8, padding: 10 }}>
                    <div style={{ color: "#666", fontSize: 12 }}>Receipts Submitted</div>
                    <div style={{ color: NAVY, fontWeight: 800 }}>
                      {selectedFamily.children.filter((child) => !!child.BillingInfo?.receiptUrl).length}
                    </div>
                    <div style={{ color: "#555", fontSize: 12 }}>Awaiting review: {selectedFamily.children.filter((child) => child.BillingInfo?.receiptUrl && !child.BillingInfo?.paid).length}</div>
                  </div>
                </div>
              )}

              {selectedFamily && (
                <div style={{ marginTop: 12, border: "1px solid #efefef", borderRadius: 8, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f9fafb" }}>
                        <th style={{ textAlign: "left", padding: 8, color: NAVY, fontSize: 12 }}>Child</th>
                        <th style={{ textAlign: "left", padding: 8, color: NAVY, fontSize: 12 }}>Payment Mode</th>
                        <th style={{ textAlign: "left", padding: 8, color: NAVY, fontSize: 12 }}>Amount</th>
                        <th style={{ textAlign: "left", padding: 8, color: NAVY, fontSize: 12 }}>Receipt Upload</th>
                        <th style={{ textAlign: "left", padding: 8, color: NAVY, fontSize: 12 }}>Confirmed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedFamilyChild ? [selectedFamilyChild] : selectedFamily.children).map((child) => (
                        <tr key={child.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                          <td style={{ padding: 8, fontSize: 13 }}>{child.playerName}</td>
                          <td style={{ padding: 8, fontSize: 13 }}>{child.BillingInfo?.paymentMode === "bundle" ? "Bundle" : "One-time"}</td>
                          <td style={{ padding: 8, fontSize: 13 }}>NGN {Number(child.BillingInfo?.selectedAmount ?? child.BillingInfo?.amountDue ?? 0).toLocaleString()}</td>
                          <td style={{ padding: 8, fontSize: 13 }}>{child.BillingInfo?.receiptUploadedAt ? new Date(child.BillingInfo.receiptUploadedAt).toLocaleDateString() : "-"}</td>
                          <td style={{ padding: 8, fontSize: 13 }}>{child.BillingInfo?.paymentConfirmedAt ? new Date(child.BillingInfo.paymentConfirmedAt).toLocaleDateString() : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #eee" }}>
                  <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Player Name</th>
                  <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Age</th>
                  <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Program</th>
                  <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Amount Due</th>
                  <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Due Date</th>
                  <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Status</th>
                  <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Receipt</th>
                  <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Date</th>
                  <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {registrationsToShow.map((reg) => (
                  <tr key={reg.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: 12, color: "#333" }}>{reg.playerName}</td>
                    <td style={{ padding: 12, color: "#333" }}>{reg.age}</td>
                    <td style={{ padding: 12, color: "#333" }}>{reg.program}</td>
                    <td style={{ padding: 12, color: "#333", fontWeight: 700 }}>NGN {(reg.BillingInfo?.amountDue ?? 0).toLocaleString()}</td>
                    <td style={{ padding: 12, color: "#333" }}>{reg.BillingInfo?.dueDate ? new Date(reg.BillingInfo.dueDate).toLocaleDateString() : "-"}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{ background: reg.status === "Paid" ? "#e8f5e9" : "#fff3e0", color: reg.status === "Paid" ? "#2e7d32" : "#e65100", padding: "4px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                        {reg.status}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      {reg.BillingInfo?.receiptUrl ? (
                        <a
                          href={toMediaUrl(reg.BillingInfo.receiptUrl)}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: NAVY, fontWeight: 700 }}
                        >
                          View Receipt
                        </a>
                      ) : (
                        <span style={{ color: "#999", fontSize: 13 }}>Not uploaded</span>
                      )}
                    </td>
                    <td style={{ padding: 12, color: "#666", fontSize: 12 }}>{new Date(reg.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: 12 }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          onClick={() => handleConfirmPayment(reg.id)}
                          disabled={!reg.BillingInfo?.receiptUrl || reg.BillingInfo?.paid}
                          style={{
                            background: reg.BillingInfo?.paid ? "#e0e0e0" : NAVY,
                            color: reg.BillingInfo?.paid ? "#666" : "white",
                            border: "none",
                            padding: "8px 12px",
                            borderRadius: 6,
                            fontWeight: 700,
                            cursor: !reg.BillingInfo?.receiptUrl || reg.BillingInfo?.paid ? "not-allowed" : "pointer",
                          }}
                        >
                          {reg.BillingInfo?.paid ? "Confirmed" : "Confirm Payment"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {registrationActionError && <div style={{ color: "red", marginTop: 12 }}>{registrationActionError}</div>}
            {registrationActionMessage && <div style={{ color: "green", marginTop: 12 }}>{registrationActionMessage}</div>}
          </div>
        )}

        {activeTab === "paymentSettings" && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <form onSubmit={handleSavePaymentConfig} style={{ padding: 16, border: "1px solid #e8e8e8", borderRadius: 10 }}>
              <h3 style={{ margin: "0 0 12px", color: NAVY }}>General Payment Settings</h3>
              <div style={{ display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 4 }}>One-time Registration Fee</label>
                  <input
                    name="oneTimeRegistrationFee"
                    type="number"
                    min="0"
                    value={paymentConfigForm.oneTimeRegistrationFee}
                    onChange={handlePaymentConfigInput}
                    style={{ width: 160, padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 4 }}>Training Session Fee</label>
                  <input
                    name="trainingSessionFee"
                    type="number"
                    min="0"
                    value={paymentConfigForm.trainingSessionFee}
                    onChange={handlePaymentConfigInput}
                    style={{ width: 160, padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 4 }}>Bundle Months (Optional)</label>
                  <input
                    name="bundleMonths"
                    type="number"
                    min="0"
                    step="1"
                    value={paymentConfigForm.bundleMonths}
                    onChange={handlePaymentConfigInput}
                    style={{ width: 160, padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 4 }}>Bundle Amount (Optional)</label>
                  <input
                    name="monthlyBundleFee"
                    type="number"
                    min="0"
                    value={paymentConfigForm.monthlyBundleFee}
                    onChange={handlePaymentConfigInput}
                    style={{ width: 160, padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 4 }}>Due Date</label>
                  <input
                    name="dueDate"
                    type="date"
                    value={paymentConfigForm.dueDate}
                    onChange={handlePaymentConfigInput}
                    style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc" }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    background: "#455a64",
                    color: "white",
                    border: "none",
                    padding: "10px 14px",
                    borderRadius: 6,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Save General Payment
                </button>
              </div>
              <div style={{ marginTop: 10, color: NAVY, fontWeight: 700 }}>
                One-time Total (Registration + Training): NGN {(
                  Number(paymentConfigForm.oneTimeRegistrationFee || 0)
                  + Number(paymentConfigForm.trainingSessionFee || 0)
                ).toLocaleString()}
              </div>
              <div style={{ marginTop: 4, color: NAVY, fontWeight: 700 }}>
                Bundle Total (Registration + Bundle): NGN {(
                  Number(paymentConfigForm.oneTimeRegistrationFee || 0)
                  + Number(paymentConfigForm.monthlyBundleFee || 0)
                ).toLocaleString()}
              </div>
              <div style={{ marginTop: 4, color: "#666", fontSize: 13 }}>
                Bundle format: {Number(paymentConfigForm.bundleMonths || 0) > 0 && Number(paymentConfigForm.monthlyBundleFee || 0) > 0
                  ? `${paymentConfigForm.bundleMonths} months = NGN ${Number(paymentConfigForm.monthlyBundleFee).toLocaleString()}`
                  : "Not configured"}
              </div>
              {paymentConfigError && <div style={{ color: "red", marginTop: 10 }}>{paymentConfigError}</div>}
              {paymentConfigMessage && <div style={{ color: "green", marginTop: 10 }}>{paymentConfigMessage}</div>}
            </form>
          </div>
        )}

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

        {activeTab === "content" && (
          <div style={{ display: "grid", gap: 24 }}>
            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
              <h3 style={{ color: NAVY, marginTop: 0, marginBottom: 16 }}>Hero Event Notification</h3>
              <form onSubmit={handleEventSubmit}>
                <Input label="Title" name="title" value={eventForm.title} onChange={handleEventInput} required />
                <Input label="Date Label" name="dateLabel" value={eventForm.dateLabel} onChange={handleEventInput} required />
                <Input label="Venue" name="venue" value={eventForm.venue} onChange={handleEventInput} required />
                <Input label="Note" name="note" value={eventForm.note} onChange={handleEventInput} />
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
                  Save Event Notification
                </button>
                {eventError && <div style={{ color: "red", marginTop: 12 }}>{eventError}</div>}
                {eventMessage && <div style={{ color: "green", marginTop: 12 }}>{eventMessage}</div>}
              </form>
            </div>

            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
              <h3 style={{ color: NAVY, marginTop: 0, marginBottom: 16 }}>Gallery Uploads</h3>
              <form onSubmit={handleUploadSubmit}>
                <Input label="Media Title" name="title" value={uploadForm.title} onChange={handleUploadChange} required />
                <Input label="Caption" name="caption" value={uploadForm.caption} onChange={handleUploadChange} />

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", fontWeight: 700, fontSize: 13, color: NAVY, marginBottom: 6, letterSpacing: 0.5 }}>
                    Media File <span style={{ color: NAVY }}> *</span>
                  </label>
                  <input
                    name="mediaFile"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleUploadChange}
                    required
                  />
                </div>

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
                  Upload to Gallery
                </button>
                {uploadError && <div style={{ color: "red", marginTop: 12 }}>{uploadError}</div>}
                {uploadMessage && <div style={{ color: "green", marginTop: 12 }}>{uploadMessage}</div>}
              </form>

              <div style={{ marginTop: 24, display: "grid", gap: 12 }}>
                {galleryMedia.map((item) => (
                  <div key={item.id} style={{ border: "1px solid #e8e8e8", borderRadius: 10, padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ width: 72, height: 52, background: "#f0f2f7", borderRadius: 8, overflow: "hidden" }}>
                        {item.mediaType === "video" ? (
                          <video src={toMediaUrl(item.mediaUrl)} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                        ) : (
                          <img src={toMediaUrl(item.mediaUrl)} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        )}
                      </div>
                      <div>
                        <div style={{ color: NAVY, fontWeight: 800 }}>{item.title}</div>
                        <div style={{ color: "#666", fontSize: 13 }}>{item.mediaType.toUpperCase()} · {item.caption || "No caption"}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteMedia(item.id)}
                      style={{ background: "#fbe9e7", color: "#bf360c", border: "none", padding: "8px 12px", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {galleryMedia.length === 0 && <div style={{ color: "#777" }}>No media uploaded yet.</div>}
              </div>
            </div>
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
