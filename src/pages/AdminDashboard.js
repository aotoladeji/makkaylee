import { useEffect, useMemo, useState } from "react";
import { API } from "../constants/api";
import { ASH, NAVY } from "../constants/theme";
import { BADGE_LIST, BADGES } from "../constants/badges";
import Input from "../components/common/Input";
import CloudinaryUpload from "../components/common/CloudinaryUpload";

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
    uploadType: "file",
    mediaFile: null,
    mediaUrl: "", // Cloudinary URL
    youtubeUrl: "",
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

  const [badgeEditId, setBadgeEditId] = useState(null);
  const [badgeSelections, setBadgeSelections] = useState([]);
  const [badgeSaving, setBadgeSaving] = useState(false);
  const [badgeMessage, setBadgeMessage] = useState("");
  const [badgeToast, setBadgeToast] = useState("");
  const [playerEditId, setPlayerEditId] = useState(null);
  const [playerForm, setPlayerForm] = useState({ playerName: "", age: "", gender: "", program: "", medical: "" });
  const [playerSaving, setPlayerSaving] = useState(false);
  const [playerActionMessage, setPlayerActionMessage] = useState("");
  const [playerActionError, setPlayerActionError] = useState("");
  const [playerUploadId, setPlayerUploadId] = useState(null);
  const [passportUrl, setPassportUrl] = useState(null);
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [documentSaving, setDocumentSaving] = useState(false);

  const [staffForm, setStaffForm] = useState({
    username: "",
    email: "",
    parentName: "",
    phone: "",
    password: "",
  });
  const [staffMessage, setStaffMessage] = useState("");
  const [staffError, setStaffError] = useState("");
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffEditId, setStaffEditId] = useState(null);
  const [staffEditForm, setStaffEditForm] = useState({ username: "", email: "", parentName: "", phone: "", password: "" });
  const [staffEditSaving, setStaffEditSaving] = useState(false);

  const [sponsorList, setSponsorList] = useState([]);
  const [sponsorForm, setSponsorForm] = useState({ name: "", type: "sponsor", description: "", websiteUrl: "", logoUrl: "", logo: null });
  const [sponsorMessage, setSponsorMessage] = useState("");
  const [sponsorError, setSponsorError] = useState("");
  const [sponsorSaving, setSponsorSaving] = useState(false);

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

  const staffUsers = useMemo(
    () => users.filter((u) => !u.isAdmin && u.isStaff),
    [users],
  );

  const paidRegistrations = useMemo(
    () => registrations.filter((registration) => registration.BillingInfo?.paid),
    [registrations],
  );

  const totalPaidAmount = useMemo(
    () => paidRegistrations.reduce((sum, registration) => sum + Number(registration.BillingInfo?.selectedAmount ?? registration.BillingInfo?.amountDue ?? 0), 0),
    [paidRegistrations],
  );
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

      // Load sponsors separately so a failure doesn't break the rest of the dashboard
      try {
        const sponsorsRes = await fetch(`${API}/admin/sponsors`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (sponsorsRes.ok) {
          const ct = sponsorsRes.headers.get("content-type") || "";
          if (ct.includes("application/json")) {
            const sponsorsData = await sponsorsRes.json();
            if (Array.isArray(sponsorsData)) setSponsorList(sponsorsData);
          }
        }
      } catch (_) {
        // sponsors endpoint not yet available — ignore, rest of data already loaded
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

    if (name === "uploadType") {
      setUploadForm((current) => ({ ...current, uploadType: value, mediaFile: null, mediaUrl: "", youtubeUrl: "" }));
      return;
    }

    setUploadForm((current) => ({ ...current, [name]: value }));
  };

  // Handle successful Cloudinary upload
  const handleMediaUploadSuccess = (result) => {
    setUploadForm((current) => ({ ...current, mediaUrl: result.url, mediaFile: null }));
    setUploadError("");
  };

  const handleMediaUploadError = (error) => {
    setUploadError(error || "Upload failed");
  };

  const handleUploadSubmit = async (event) => {
    event.preventDefault();
    setUploadError("");
    setUploadMessage("");

    if (!uploadForm.title) {
      setUploadError("Title is required.");
      return;
    }

    if (uploadForm.uploadType === "youtube") {
      if (!uploadForm.youtubeUrl) { setUploadError("YouTube URL is required."); return; }
      if (!/youtube\.com\/watch|youtu\.be\//.test(uploadForm.youtubeUrl)) {
        setUploadError("Please enter a valid YouTube URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...).");
        return;
      }
    } else if (!uploadForm.mediaUrl) {
      setUploadError("Please upload a media file to Cloudinary first.");
      return;
    }

    try {
      const response = await fetch(`${API}/admin/gallery/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          title: uploadForm.title,
          caption: uploadForm.caption,
          youtubeUrl: uploadForm.uploadType === "youtube" ? uploadForm.youtubeUrl : undefined,
          mediaUrl: uploadForm.uploadType === "file" ? uploadForm.mediaUrl : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to upload media");

      setGalleryMedia((current) => [data.data, ...current]);
      setUploadMessage("Gallery media uploaded.");
      setUploadForm({ title: "", caption: "", uploadType: "file", mediaFile: null, mediaUrl: "", youtubeUrl: "" });
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

  const openPlayerEditor = (registration) => {
    setPlayerEditId(registration.id);
    setPlayerForm({ playerName: registration.playerName || "", age: String(registration.age || ""), gender: registration.gender || "", program: registration.program || "", medical: registration.medical || "" });
    setPlayerActionError("");
    setPlayerActionMessage("");
  };

  const handlePlayerSave = async (event) => {
    event.preventDefault();
    setPlayerActionError("");
    setPlayerActionMessage("");
    setPlayerSaving(true);
    try {
      const response = await fetch(`${API}/admin/registrations/${playerEditId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify(playerForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update player information");
      setRegistrations((current) => current.map((registration) => (registration.id === playerEditId ? { ...registration, ...data.data } : registration)));
      setPlayerActionMessage("Player information updated.");
      setPlayerEditId(null);
    } catch (submitError) {
      setPlayerActionError(submitError.message);
    } finally {
      setPlayerSaving(false);
    }
  };

  const handlePlayerDocumentUpload = async (registrationId, type) => {
    const url = type === "passport" ? passportUrl : receiptUrl;
    if (!url) {
      setPlayerActionError(`Upload a ${type === "passport" ? "passport image" : "receipt file"} to Cloudinary first.`);
      return;
    }
    setPlayerActionError("");
    setPlayerActionMessage("");
    setDocumentSaving(true);
    try {
      const response = await fetch(`${API}/admin/registrations/${registrationId}/${type}`, { 
        method: "POST", 
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}` 
        }, 
        body: JSON.stringify({ 
          [type === "passport" ? "passportUrl" : "receiptUrl"]: url 
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Failed to upload ${type}`);
      setRegistrations((current) => current.map((registration) => {
        if (registration.id !== registrationId) return registration;
        if (type === "passport") return { ...registration, passportUrl: data.data.passportUrl };
        return { ...registration, status: "Receipt Submitted", BillingInfo: { ...registration.BillingInfo, receiptUrl: data.data.receiptUrl, receiptMimeType: data.data.receiptMimeType, receiptUploadedAt: data.data.receiptUploadedAt, paid: false, paymentConfirmedAt: null } };
      }));
      if (type === "passport") setPassportUrl(null);
      else setReceiptUrl(null);
      setPlayerActionMessage(`${type === "passport" ? "Passport photo" : "Payment receipt"} uploaded.`);
    } catch (uploadError) {
      setPlayerActionError(uploadError.message);
    } finally {
      setDocumentSaving(false);
    }
  };

  const handlePassportUploadSuccess = (result) => {
    setPassportUrl(result.url);
    setPlayerActionError("");
  };

  const handlePassportUploadError = (error) => {
    setPlayerActionError(error || "Passport upload failed");
  };

  const handleReceiptUploadSuccess = (result) => {
    setReceiptUrl(result.url);
    setPlayerActionError("");
  };

  const handleReceiptUploadError = (error) => {
    setPlayerActionError(error || "Receipt upload failed");
  };

  const handleAssignBadges = async () => {
    if (!badgeEditId) {
      setBadgeMessage("No player selected for badge assignment.");
      return;
    }

    setBadgeSaving(true);
    setBadgeMessage("");

    try {
      const response = await fetch(`${API}/admin/registrations/${badgeEditId}/badges`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ badges: badgeSelections }),
      });

      const responseType = response.headers.get("content-type") || "";
      const isJson = responseType.includes("application/json");
      const payload = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        const serverMessage = isJson
          ? (payload?.error || payload?.message)
          : String(payload || "").slice(0, 180);
        throw new Error(serverMessage || `Failed to update badges (${response.status})`);
      }

      if (!isJson) {
        throw new Error("Badge update returned an unexpected response format from the server.");
      }

      const savedPlayerName = registrations.find((registration) => registration.id === badgeEditId)?.playerName || "player";

      // Optimistic UI update first, then sync with backend state.
      setRegistrations((current) =>
        current.map((registration) =>
          registration.id === badgeEditId
            ? { ...registration, badges: badgeSelections }
            : registration,
        ),
      );

      try {
        const refreshRes = await fetch(`${API}/admin/registrations`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        const refreshType = refreshRes.headers.get("content-type") || "";
        if (refreshRes.ok && refreshType.includes("application/json")) {
          const refreshData = await refreshRes.json();
          setRegistrations(refreshData.data || []);
        }
      } catch (refreshError) {
        // Keep optimistic state if refresh fails temporarily.
      }

      setBadgeMessage("Badges saved!");
      setBadgeToast(`Badges saved for ${savedPlayerName}.`);
      setTimeout(() => setBadgeToast(""), 3200);
      setTimeout(() => {
        setBadgeEditId(null);
        setBadgeMessage("");
      }, 1000);
    } catch (badgeError) {
      setBadgeMessage(badgeError.message);
    } finally {
      setBadgeSaving(false);
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

  const handleCreateStaff = async (event) => {
    event.preventDefault();
    setStaffError("");
    setStaffMessage("");

    if (!staffForm.username || !staffForm.email || !staffForm.parentName || !staffForm.password) {
      setStaffError("Username, email, full name, and password are required.");
      return;
    }

    if (staffForm.password.length < 6) {
      setStaffError("Password must be at least 6 characters.");
      return;
    }

    setStaffSaving(true);
    try {
      const response = await fetch(`${API}/admin/staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(staffForm),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create staff account");

      const usersRes = await fetch(`${API}/admin/users`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const usersData = await usersRes.json();
      if (usersRes.ok) setUsers(usersData.data || []);

      setStaffForm({ username: "", email: "", parentName: "", phone: "", password: "" });
      setStaffMessage("Staff account created successfully.");
    } catch (submitError) {
      setStaffError(submitError.message);
    } finally {
      setStaffSaving(false);
    }
  };

  const openStaffEditor = (staffUser) => {
    setStaffEditId(staffUser.id);
    setStaffEditForm({ username: staffUser.username || "", email: staffUser.email || "", parentName: staffUser.parentName || "", phone: staffUser.phone || "", password: "" });
    setStaffError("");
    setStaffMessage("");
  };

  const handleStaffEdit = async (event) => {
    event.preventDefault();
    setStaffError("");
    setStaffMessage("");
    setStaffEditSaving(true);
    try {
      const response = await fetch(`${API}/admin/staff/${staffEditId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify(staffEditForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update staff account");
      setUsers((current) => current.map((staffUser) => (staffUser.id === staffEditId ? { ...staffUser, ...data.data } : staffUser)));
      setStaffEditId(null);
      setStaffMessage("Staff account updated successfully.");
    } catch (submitError) {
      setStaffError(submitError.message);
    } finally {
      setStaffEditSaving(false);
    }
  };

  const handleSponsorChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "logo") {
      setSponsorForm((prev) => ({ ...prev, logo: files[0] || null }));
    } else {
      setSponsorForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSponsorLogoUploadSuccess = (result) => {
    setSponsorForm((prev) => ({ ...prev, logoUrl: result.url, logo: null }));
    setSponsorError("");
  };

  const handleSponsorLogoUploadError = (error) => {
    setSponsorError(error || "Logo upload failed");
  };

  const handleSponsorSubmit = async (e) => {
    e.preventDefault();
    setSponsorError("");
    setSponsorMessage("");
    if (!sponsorForm.name.trim()) { setSponsorError("Name is required."); return; }
    if (!sponsorForm.logoUrl) { setSponsorError("Please upload a logo to Cloudinary first."); return; }
    setSponsorSaving(true);
    try {
      const res = await fetch(`${API}/admin/sponsors`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}` 
        },
        body: JSON.stringify({
          name: sponsorForm.name,
          type: sponsorForm.type,
          description: sponsorForm.description,
          websiteUrl: sponsorForm.websiteUrl,
          logoUrl: sponsorForm.logoUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add entry");
      const listRes = await fetch(`${API}/admin/sponsors`, { headers: { Authorization: `Bearer ${user.token}` } });
      const listData = await listRes.json();
      if (listRes.ok && Array.isArray(listData)) setSponsorList(listData);
      setSponsorForm({ name: "", type: "sponsor", description: "", websiteUrl: "", logoUrl: "", logo: null });
      setSponsorMessage(`${sponsorForm.type === "sponsor" ? "Sponsor" : "Partner"} added successfully.`);
    } catch (submitErr) {
      setSponsorError(submitErr.message);
    } finally {
      setSponsorSaving(false);
    }
  };

  const handleSponsorDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    try {
      const res = await fetch(`${API}/admin/sponsors/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Delete failed"); }
      setSponsorList((prev) => prev.filter((s) => s.id !== id));
    } catch (deleteErr) {
      setSponsorError(deleteErr.message);
    }
  };

  if (!user) return <div style={{ padding: 40, paddingTop: 110 }}>Please log in.</div>;
  if (error) return <div style={{ padding: 40, paddingTop: 110, color: "red" }}>{error}</div>;

  return (
    <div style={{ paddingTop: 70, background: ASH, minHeight: "100vh" }}>
      {badgeToast && (
        <div style={{ position: "fixed", top: 86, right: 24, background: "#1b5e20", color: "white", padding: "10px 14px", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.18)", zIndex: 1200, fontWeight: 700, fontSize: 13 }}>
          {badgeToast}
        </div>
      )}

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
            onClick={() => setActiveTab("players")}
            style={{
              background: "none",
              border: "none",
              padding: "12px 0",
              borderBottom: activeTab === "players" ? `3px solid ${NAVY}` : "none",
              color: activeTab === "players" ? NAVY : "#999",
              fontWeight: activeTab === "players" ? 700 : 600,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            Players ({registrations.length})
          </button>
          <button
            onClick={() => setActiveTab("paidCandidates")}
            style={{
              background: "none",
              border: "none",
              padding: "12px 0",
              borderBottom: activeTab === "paidCandidates" ? `3px solid ${NAVY}` : "none",
              color: activeTab === "paidCandidates" ? NAVY : "#999",
              fontWeight: activeTab === "paidCandidates" ? 700 : 600,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            Paid Candidates ({paidRegistrations.length})
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
            onClick={() => setActiveTab("staff")}
            style={{
              background: "none",
              border: "none",
              padding: "12px 0",
              borderBottom: activeTab === "staff" ? `3px solid ${NAVY}` : "none",
              color: activeTab === "staff" ? NAVY : "#999",
              fontWeight: activeTab === "staff" ? 700 : 600,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            Staff ({staffUsers.length})
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
                          disabled={reg.BillingInfo?.paid}
                          style={{
                            background: reg.BillingInfo?.paid ? "#e0e0e0" : NAVY,
                            color: reg.BillingInfo?.paid ? "#666" : "white",
                            border: "none",
                            padding: "8px 12px",
                            borderRadius: 6,
                            fontWeight: 700,
                            cursor: reg.BillingInfo?.paid ? "not-allowed" : "pointer",
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

        {activeTab === "players" && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <h3 style={{ color: NAVY, marginTop: 0, marginBottom: 20 }}>Registered Players</h3>

            {loading ? (
              <div style={{ display: "grid", gap: 14 }}>
                {[1, 2, 3].map((skeletonItem) => (
                  <div key={skeletonItem} style={{ border: "1px solid #eceff1", borderRadius: 12, padding: 18, background: "#fafafa" }}>
                    <div style={{ height: 18, width: "35%", background: "#e8edf2", borderRadius: 6, marginBottom: 10 }} />
                    <div style={{ height: 12, width: "55%", background: "#eef2f6", borderRadius: 6, marginBottom: 12 }} />
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ height: 28, width: 120, background: "#eef2f6", borderRadius: 20 }} />
                      <div style={{ height: 28, width: 100, background: "#eef2f6", borderRadius: 20 }} />
                      <div style={{ height: 28, width: 140, background: "#eef2f6", borderRadius: 20 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                {registrations.map((reg) => (
                  <div key={reg.id} style={{ border: "1px solid #e8e8e8", borderRadius: 12, padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 800, color: NAVY, fontSize: 16 }}>{reg.playerName}</div>
                        <div style={{ color: "#888", fontSize: 13, marginTop: 2 }}>
                          {reg.age} yrs &bull; {reg.gender} &bull; {reg.program}
                        </div>
                        <div style={{ marginTop: 6 }}>
                          <span style={{ background: reg.status === "Paid" ? "#e8f5e9" : "#fff3e0", color: reg.status === "Paid" ? "#2e7d32" : "#e65100", padding: "3px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                            {reg.status}
                          </span>
                          {reg.User?.parentName && (
                            <span style={{ marginLeft: 8, color: "#999", fontSize: 12 }}>Parent: {reg.User.parentName}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button type="button" onClick={() => openPlayerEditor(reg)} style={{ background: NAVY, color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Edit Player</button>
                        <button type="button" onClick={() => { setBadgeEditId(badgeEditId === reg.id ? null : reg.id); setBadgeSelections(reg.badges || []); setBadgeMessage(""); }} style={{ background: badgeEditId === reg.id ? "#e0e0e0" : "#e3f2fd", color: badgeEditId === reg.id ? "#333" : "#1565c0", border: `1px solid ${badgeEditId === reg.id ? "#ccc" : "#90caf9"}`, borderRadius: 8, padding: "8px 16px", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>{badgeEditId === reg.id ? "Cancel" : "Assign Badges"}</button>
                      </div>
                    </div>

                    {reg.passportUrl && <a href={toMediaUrl(reg.passportUrl)} target="_blank" rel="noreferrer" style={{ display: "inline-flex", marginBottom: 12, color: NAVY, fontSize: 13, fontWeight: 700 }}>View passport photo</a>}

                    {playerEditId === reg.id && (
                      <form onSubmit={handlePlayerSave} style={{ marginBottom: 16, padding: 16, background: "#f9fafb", border: "1px solid #dce3ea", borderRadius: 10 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                          <input value={playerForm.playerName} onChange={(event) => setPlayerForm((current) => ({ ...current, playerName: event.target.value }))} placeholder="Player name" required style={{ padding: "9px 10px", border: "1px solid #ccc", borderRadius: 6 }} />
                          <input type="number" min="4" max="15" value={playerForm.age} onChange={(event) => setPlayerForm((current) => ({ ...current, age: event.target.value }))} placeholder="Age" required style={{ padding: "9px 10px", border: "1px solid #ccc", borderRadius: 6 }} />
                          <select value={playerForm.gender} onChange={(event) => setPlayerForm((current) => ({ ...current, gender: event.target.value }))} required style={{ padding: "9px 10px", border: "1px solid #ccc", borderRadius: 6 }}><option value="">Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select>
                          <select value={playerForm.program} onChange={(event) => setPlayerForm((current) => ({ ...current, program: event.target.value }))} required style={{ padding: "9px 10px", border: "1px solid #ccc", borderRadius: 6 }}><option value="">Programme</option><option value="Junior Stars (4-8)">Junior Stars (4-8)</option><option value="Intermediate (9-12)">Intermediate (9-12)</option><option value="Elite (13-15)">Elite (13-15)</option></select>
                        </div>
                        <textarea value={playerForm.medical} onChange={(event) => setPlayerForm((current) => ({ ...current, medical: event.target.value }))} placeholder="Medical information" style={{ width: "100%", minHeight: 72, boxSizing: "border-box", marginTop: 12, padding: "9px 10px", border: "1px solid #ccc", borderRadius: 6 }} />
                        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}><button type="submit" disabled={playerSaving} style={{ background: NAVY, color: "white", border: "none", padding: "9px 14px", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}>{playerSaving ? "Saving..." : "Save Player"}</button><button type="button" onClick={() => setPlayerEditId(null)} style={{ background: "#e0e0e0", color: "#333", border: "none", padding: "9px 14px", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}>Cancel</button></div>
                      </form>
                    )}

                    {playerUploadId === reg.id ? (
                      <div style={{ marginBottom: 16, padding: 16, background: "#f9fafb", border: "1px solid #dce3ea", borderRadius: 10 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                          <div>
                            <label style={{ color: NAVY, fontSize: 13, fontWeight: 700, display: "block", marginBottom: 8 }}>Passport Photo</label>
                            <CloudinaryUpload
                              onUploadSuccess={handlePassportUploadSuccess}
                              onUploadError={handlePassportUploadError}
                              accept="image/*"
                              resourceType="image"
                              maxSize={5 * 1024 * 1024}
                              label="Upload Passport Photo"
                              folder="makkaylee/passports"
                            />
                            {passportUrl && <p style={{ color: "green", fontSize: 12, marginTop: 4 }}>✓ Photo ready</p>}
                          </div>
                          <div>
                            <label style={{ color: NAVY, fontSize: 13, fontWeight: 700, display: "block", marginBottom: 8 }}>Payment Receipt</label>
                            <CloudinaryUpload
                              onUploadSuccess={handleReceiptUploadSuccess}
                              onUploadError={handleReceiptUploadError}
                              accept="image/*,.pdf"
                              resourceType="auto"
                              maxSize={10 * 1024 * 1024}
                              label="Upload Receipt"
                              folder="makkaylee/receipts"
                            />
                            {receiptUrl && <p style={{ color: "green", fontSize: 12, marginTop: 4 }}>✓ Receipt ready</p>}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}><button type="button" disabled={documentSaving || !passportUrl} onClick={() => handlePlayerDocumentUpload(reg.id, "passport")} style={{ background: NAVY, color: "white", border: "none", padding: "9px 14px", borderRadius: 6, fontWeight: 700, cursor: documentSaving || !passportUrl ? "not-allowed" : "pointer", opacity: documentSaving || !passportUrl ? 0.75 : 1 }}>{documentSaving ? "Uploading..." : "Submit Passport"}</button><button type="button" disabled={documentSaving || !receiptUrl} onClick={() => handlePlayerDocumentUpload(reg.id, "receipt")} style={{ background: "#455a64", color: "white", border: "none", padding: "9px 14px", borderRadius: 6, fontWeight: 700, cursor: documentSaving || !receiptUrl ? "not-allowed" : "pointer", opacity: documentSaving || !receiptUrl ? 0.75 : 1 }}>{documentSaving ? "Uploading..." : "Submit Receipt"}</button><button type="button" onClick={() => { setPlayerUploadId(null); setPassportUrl(null); setReceiptUrl(null); }} style={{ background: "#e0e0e0", color: "#333", border: "none", padding: "9px 14px", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}>Close</button></div>
                      </div>
                    ) : <button type="button" onClick={() => { setPlayerUploadId(reg.id); setPlayerActionError(""); setPlayerActionMessage(""); }} style={{ marginBottom: 16, background: "#e8f5e9", color: "#2e7d32", border: "1px solid #a5d6a7", borderRadius: 6, padding: "8px 12px", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Manage Documents</button>}

                    {playerActionError && <div style={{ color: "red", fontSize: 13, marginBottom: 12 }}>{playerActionError}</div>}
                    {playerActionMessage && <div style={{ color: "green", fontSize: 13, marginBottom: 12 }}>{playerActionMessage}</div>}

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {(reg.badges || []).length === 0 ? (
                        <span style={{ color: "#bbb", fontSize: 12, fontStyle: "italic" }}>No badges awarded yet</span>
                      ) : (
                        (reg.badges || []).map((key) => {
                          const badge = BADGES[key];
                          if (!badge) return null;
                          return (
                            <span
                              key={key}
                              title={badge.description}
                              style={{
                                background: badge.bg,
                                color: badge.color,
                                border: `1.5px solid ${badge.border}`,
                                borderRadius: 20,
                                padding: "4px 12px",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              {badge.emoji} {badge.label}
                            </span>
                          );
                        })
                      )}
                    </div>

                    {badgeEditId === reg.id && (
                      <div style={{ marginTop: 16, background: "#f9fafb", border: "1px solid #e0e0e0", borderRadius: 10, padding: 16 }}>
                        <div style={{ fontWeight: 700, color: NAVY, fontSize: 13, marginBottom: 10 }}>Toggle badges for {reg.playerName}:</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {BADGE_LIST.map((badge) => {
                            const selected = badgeSelections.includes(badge.key);
                            return (
                              <button
                                key={badge.key}
                                type="button"
                                onClick={() =>
                                  setBadgeSelections((current) =>
                                    selected
                                      ? current.filter((k) => k !== badge.key)
                                      : [...current, badge.key],
                                  )
                                }
                                style={{
                                  background: selected ? badge.bg : "#fff",
                                  color: selected ? badge.color : "#666",
                                  border: `1.5px solid ${selected ? badge.border : "#ddd"}`,
                                  borderRadius: 20,
                                  padding: "6px 14px",
                                  fontSize: 13,
                                  fontWeight: selected ? 700 : 400,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  transition: "all 0.15s",
                                }}
                              >
                                <span style={{ fontSize: 16 }}>{badge.emoji}</span> {badge.label}
                              </button>
                            );
                          })}
                        </div>
                        <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center" }}>
                          <button
                            type="button"
                            disabled={badgeSaving}
                            onClick={handleAssignBadges}
                            style={{ background: NAVY, color: "white", border: "none", padding: "10px 20px", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14 }}
                          >
                            {badgeSaving ? "Saving…" : "Save Badges"}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setBadgeEditId(null); setBadgeMessage(""); }}
                            style={{ background: "#e0e0e0", color: "#333", border: "none", padding: "10px 20px", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14 }}
                          >
                            Cancel
                          </button>
                          {badgeMessage && (
                            <span style={{ fontSize: 13, color: badgeMessage.startsWith("Badges saved") ? "green" : "red", fontWeight: 600 }}>
                              {badgeMessage}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {!registrations.length && (
                  <div style={{ padding: "18px 14px", border: "1px dashed #cfd8dc", borderRadius: 10, color: "#607d8b", fontSize: 14 }}>
                    No registered players found yet.
                  </div>
                )}
              </div>
            )}
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
                      <span style={{ background: u.isAdmin ? "#e3f2fd" : u.isStaff ? "#e8f5e9" : "#f5f5f5", color: u.isAdmin ? "#1565c0" : u.isStaff ? "#2e7d32" : "#555", padding: "4px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                        {u.isAdmin ? "Admin" : u.isStaff ? "Staff" : "User"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "staff" && (
          <div style={{ display: "grid", gap: 24 }}>
            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
              <h3 style={{ color: NAVY, marginTop: 0, marginBottom: 16 }}>Create Staff Account</h3>
              <form onSubmit={handleCreateStaff} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 4 }}>Username</label>
                  <input value={staffForm.username} onChange={(event) => setStaffForm((current) => ({ ...current, username: event.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 4 }}>Email</label>
                  <input type="email" value={staffForm.email} onChange={(event) => setStaffForm((current) => ({ ...current, email: event.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 4 }}>Full Name</label>
                  <input value={staffForm.parentName} onChange={(event) => setStaffForm((current) => ({ ...current, parentName: event.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 4 }}>Phone</label>
                  <input value={staffForm.phone} onChange={(event) => setStaffForm((current) => ({ ...current, phone: event.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 4 }}>Password</label>
                  <input type="password" value={staffForm.password} onChange={(event) => setStaffForm((current) => ({ ...current, password: event.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc" }} />
                </div>
                <div style={{ alignSelf: "end" }}>
                  <button type="submit" disabled={staffSaving} style={{ background: NAVY, color: "white", border: "none", padding: "10px 14px", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}>
                    {staffSaving ? "Creating..." : "Create Staff"}
                  </button>
                </div>
              </form>
              {staffError && <div style={{ color: "red", marginTop: 10 }}>{staffError}</div>}
              {staffMessage && <div style={{ color: "green", marginTop: 10 }}>{staffMessage}</div>}
            </div>

            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", overflowX: "auto" }}>
              <h3 style={{ color: NAVY, marginTop: 0, marginBottom: 16 }}>Staff List</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #eee" }}>
                    <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Name</th>
                    <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Username</th>
                    <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Email</th>
                    <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Phone</th>
                    <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {staffUsers.map((staffUser) => (
                    <tr key={staffUser.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: 12, color: "#333" }}>{staffUser.parentName || "-"}</td>
                      <td style={{ padding: 12, color: "#333" }}>{staffUser.username}</td>
                      <td style={{ padding: 12, color: "#333" }}>{staffUser.email}</td>
                      <td style={{ padding: 12, color: "#333" }}>{staffUser.phone || "-"}</td>
                      <td style={{ padding: 12 }}><button type="button" onClick={() => openStaffEditor(staffUser)} style={{ background: NAVY, color: "white", border: "none", borderRadius: 6, padding: "8px 12px", fontWeight: 700, cursor: "pointer" }}>Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!staffUsers.length && <div style={{ color: "#777", marginTop: 12 }}>No staff accounts found yet.</div>}
            </div>

            {staffEditId && (
              <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
                <h3 style={{ color: NAVY, marginTop: 0, marginBottom: 16 }}>Edit Staff Account</h3>
                <form onSubmit={handleStaffEdit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                  <input value={staffEditForm.username} onChange={(event) => setStaffEditForm((current) => ({ ...current, username: event.target.value }))} placeholder="Username" required style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc" }} />
                  <input type="email" value={staffEditForm.email} onChange={(event) => setStaffEditForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email" required style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc" }} />
                  <input value={staffEditForm.parentName} onChange={(event) => setStaffEditForm((current) => ({ ...current, parentName: event.target.value }))} placeholder="Full name" required style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc" }} />
                  <input value={staffEditForm.phone} onChange={(event) => setStaffEditForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone" style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc" }} />
                  <input type="password" value={staffEditForm.password} onChange={(event) => setStaffEditForm((current) => ({ ...current, password: event.target.value }))} placeholder="New password (optional)" style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc" }} />
                  <div style={{ display: "flex", gap: 8 }}><button type="submit" disabled={staffEditSaving} style={{ background: NAVY, color: "white", border: "none", padding: "10px 14px", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}>{staffEditSaving ? "Saving..." : "Save Staff"}</button><button type="button" onClick={() => setStaffEditId(null)} style={{ background: "#e0e0e0", color: "#333", border: "none", padding: "10px 14px", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}>Cancel</button></div>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === "paidCandidates" && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", overflowX: "auto" }}>
            <h3 style={{ color: NAVY, marginTop: 0, marginBottom: 10 }}>Paid Candidates</h3>
            <div style={{ marginBottom: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{ background: ASH, borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ color: "#666", fontSize: 12 }}>Total Paid Candidates</div>
                <div style={{ color: NAVY, fontWeight: 800, fontSize: 20 }}>{paidRegistrations.length}</div>
              </div>
              <div style={{ background: ASH, borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ color: "#666", fontSize: 12 }}>Total Amount Received</div>
                <div style={{ color: NAVY, fontWeight: 800, fontSize: 20 }}>NGN {totalPaidAmount.toLocaleString()}</div>
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #eee" }}>
                  <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Player</th>
                  <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Parent</th>
                  <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Program</th>
                  <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Amount</th>
                  <th style={{ textAlign: "left", padding: 12, color: NAVY, fontWeight: 700 }}>Confirmed At</th>
                </tr>
              </thead>
              <tbody>
                {paidRegistrations.map((registration) => (
                  <tr key={registration.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: 12, color: "#333" }}>{registration.playerName}</td>
                    <td style={{ padding: 12, color: "#333" }}>{registration.User?.parentName || "-"}</td>
                    <td style={{ padding: 12, color: "#333" }}>{registration.program}</td>
                    <td style={{ padding: 12, color: "#333", fontWeight: 700 }}>NGN {Number(registration.BillingInfo?.selectedAmount ?? registration.BillingInfo?.amountDue ?? 0).toLocaleString()}</td>
                    <td style={{ padding: 12, color: "#666", fontSize: 13 }}>{registration.BillingInfo?.paymentConfirmedAt ? new Date(registration.BillingInfo.paymentConfirmedAt).toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!paidRegistrations.length && <div style={{ color: "#777", marginTop: 12 }}>No paid candidates found yet.</div>}
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
                  <label style={{ display: "block", fontWeight: 700, fontSize: 13, color: NAVY, marginBottom: 8, letterSpacing: 0.5 }}>Upload Type</label>
                  <div style={{ display: "flex", gap: 28 }}>
                    {[{ value: "file", label: "File Upload" }, { value: "youtube", label: "YouTube Link" }].map((opt) => (
                      <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: uploadForm.uploadType === opt.value ? 800 : 500, color: uploadForm.uploadType === opt.value ? NAVY : "#555", fontSize: 14 }}>
                        <input type="radio" name="uploadType" value={opt.value} checked={uploadForm.uploadType === opt.value} onChange={handleUploadChange} />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                {uploadForm.uploadType === "youtube" ? (
                  <Input label="YouTube URL" name="youtubeUrl" value={uploadForm.youtubeUrl} onChange={handleUploadChange} required />
                ) : (
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: "block", fontWeight: 700, fontSize: 13, color: NAVY, marginBottom: 12, letterSpacing: 0.5 }}>
                      Media File (Image or Video) <span style={{ color: "red" }}>*</span>
                    </label>
                    <CloudinaryUpload
                      onUploadSuccess={handleMediaUploadSuccess}
                      onUploadError={handleMediaUploadError}
                      accept="image/*,video/*"
                      resourceType="auto"
                      maxSize={100 * 1024 * 1024}
                      label="Upload Media to Cloudinary"
                      folder="makkaylee/gallery"
                    />
                    {uploadForm.mediaUrl && (
                      <p style={{ color: "green", fontSize: 13, marginTop: 8 }}>✓ Media uploaded successfully</p>
                    )}
                  </div>
                )}

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
                      <div style={{ width: 72, height: 52, background: "#f0f2f7", borderRadius: 8, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {item.mimeType === "youtube" ? (
                          <div style={{ fontSize: 22 }}>▶️</div>
                        ) : item.mediaType === "video" ? (
                          <video src={toMediaUrl(item.mediaUrl)} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                        ) : (
                          <img src={toMediaUrl(item.mediaUrl)} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        )}
                      </div>
                      <div>
                        <div style={{ color: NAVY, fontWeight: 800 }}>{item.title}</div>
                        <div style={{ color: "#666", fontSize: 13 }}>{item.mimeType === "youtube" ? "YOUTUBE" : item.mediaType.toUpperCase()} · {item.caption || "No caption"}</div>
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

            {/* Sponsors & Partners Management */}
            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
              <h3 style={{ color: NAVY, marginTop: 0, marginBottom: 4 }}>Sponsors &amp; Partners</h3>
              <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>Add a sponsor or partner — their logo and info will appear on the respective public page.</p>
              <form onSubmit={handleSponsorSubmit}>
                <Input label="Name" name="name" value={sponsorForm.name} onChange={handleSponsorChange} required />
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", fontWeight: 700, fontSize: 13, color: NAVY, marginBottom: 8, letterSpacing: 0.5 }}>Type</label>
                  <div style={{ display: "flex", gap: 24 }}>
                    {["sponsor", "partner"].map((t) => (
                      <label key={t} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: sponsorForm.type === t ? 800 : 500, color: sponsorForm.type === t ? NAVY : "#555" }}>
                        <input type="radio" name="type" value={t} checked={sponsorForm.type === t} onChange={handleSponsorChange} />
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
                <Input label="Description" name="description" value={sponsorForm.description} onChange={handleSponsorChange} />
                <Input label="Website URL (optional)" name="websiteUrl" value={sponsorForm.websiteUrl} onChange={handleSponsorChange} />
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", fontWeight: 700, fontSize: 13, color: NAVY, marginBottom: 12, letterSpacing: 0.5 }}>
                    Logo Image <span style={{ color: "red" }}>*</span>
                  </label>
                  <CloudinaryUpload
                    onUploadSuccess={handleSponsorLogoUploadSuccess}
                    onUploadError={handleSponsorLogoUploadError}
                    accept="image/*"
                    resourceType="image"
                    maxSize={5 * 1024 * 1024}
                    label="Upload Logo to Cloudinary"
                    folder="makkaylee/sponsors"
                  />
                  {sponsorForm.logoUrl && (
                    <p style={{ color: "green", fontSize: 13, marginTop: 8 }}>✓ Logo uploaded successfully</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={sponsorSaving}
                  style={{ background: NAVY, color: "white", border: "none", padding: "12px 20px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
                >
                  {sponsorSaving ? "Saving..." : "Add Entry"}
                </button>
                {sponsorError && <div style={{ color: "red", marginTop: 12 }}>{sponsorError}</div>}
                {sponsorMessage && <div style={{ color: "green", marginTop: 12 }}>{sponsorMessage}</div>}
              </form>

              <div style={{ marginTop: 28, display: "grid", gap: 12 }}>
                {sponsorList.length === 0 && <div style={{ color: "#777" }}>No sponsors or partners added yet.</div>}
                {sponsorList.map((s) => (
                  <div key={s.id} style={{ border: "1px solid #e8e8e8", borderRadius: 10, padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ width: 64, height: 48, background: "#f0f2f7", borderRadius: 8, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img src={toMediaUrl(s.logoUrl)} alt={s.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                      </div>
                      <div>
                        <div style={{ color: NAVY, fontWeight: 800, fontSize: 14 }}>{s.name}</div>
                        <div style={{ color: "#666", fontSize: 12 }}>
                          <span style={{ background: s.type === "sponsor" ? "#fff3e0" : "#e8f5e9", color: s.type === "sponsor" ? "#e65100" : "#2e7d32", fontWeight: 700, padding: "2px 8px", borderRadius: 20, fontSize: 11 }}>
                            {s.type.toUpperCase()}
                          </span>
                          {s.description && <span style={{ marginLeft: 8 }}>{s.description.slice(0, 60)}{s.description.length > 60 ? "…" : ""}</span>}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSponsorDelete(s.id)}
                      style={{ background: "#fbe9e7", color: "#bf360c", border: "none", padding: "8px 12px", borderRadius: 6, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
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
