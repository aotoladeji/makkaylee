import { useState } from "react";
import Input from "../components/common/Input";
import Logo from "../components/common/Logo";
import { API } from "../constants/api";
import { BRAND } from "../constants/brand";
import { ASH, NAVY } from "../constants/theme";

export default function RegisterPage({ user, setPage }) {
  const isAddingChild = !!user?.token && !user?.isAdmin;
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    parentName: "",
    phone: "",
    address: "",
    playerName: "",
    age: "",
    gender: "",
    program: "",
    medical: "",
    consent: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!isAddingChild) {
      if (!form.username.trim()) nextErrors.username = "Required";
      if (!form.email.trim()) nextErrors.email = "Required";
      if (!form.password.trim()) nextErrors.password = "Required";
      if (!form.parentName.trim()) nextErrors.parentName = "Required";
      if (!form.phone.trim()) nextErrors.phone = "Required";
    }
    if (!form.playerName.trim()) nextErrors.playerName = "Required";
    if (!form.age || form.age < 4 || form.age > 15) nextErrors.age = "Age must be 4-15";
    if (!form.gender) nextErrors.gender = "Required";
    if (!form.program) nextErrors.program = "Required";
    if (!form.consent) nextErrors.consent = "You must agree to the terms";
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setError("");
    try {
      const endpoint = isAddingChild ? `${API}/children` : `${API}/register`;
      const payload = isAddingChild
        ? {
          playerName: form.playerName,
          age: form.age,
          gender: form.gender,
          program: form.program,
          medical: form.medical,
          consent: form.consent,
        }
        : form;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(isAddingChild ? { Authorization: `Bearer ${user.token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const contentType = response.headers.get("content-type") || "";
      const rawBody = await response.text();
      let data = {};

      if (rawBody && contentType.includes("application/json")) {
        try {
          data = JSON.parse(rawBody);
        } catch {
          data = {};
        }
      }

      if (!contentType.includes("application/json")) {
        setError("Unexpected server response. Please ensure the backend API is running and try again.");
        return;
      }

      if (!response.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      setSuccess(true);
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  if (success) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2 style={{ color: NAVY }}>{isAddingChild ? "Child added successfully!" : "Registration successful!"}</h2>
        <p>{isAddingChild ? "Your new child profile has been created." : "You can now log in."}</p>
        <button onClick={() => setPage(isAddingChild ? "Dashboard" : "Login")} style={{ background: NAVY, color: ASH, border: "none", padding: "12px 28px", borderRadius: 8, fontWeight: 800, cursor: "pointer" }}>
          {isAddingChild ? "Go to Dashboard" : "Go to Login"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 70, background: ASH, minHeight: "100vh" }}>
      <div style={{ background: `linear-gradient(135deg, ${NAVY}, #1a3168)`, padding: "60px 24px", textAlign: "center" }}>
        <Logo size={52} />
        <h1 style={{ color: "white", fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, margin: "16px 0 8px" }}>
          {isAddingChild ? "Add Another Child" : "Join the Academy"}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 16 }}>
          {isAddingChild ? "Add a new child profile under your existing parent account" : "Complete the form below to begin your child&apos;s football journey"}
        </p>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 24px" }}>
        <form onSubmit={handleSubmit} style={{ background: "white", borderRadius: 20, padding: 48, boxShadow: "0 8px 48px rgba(0,0,0,0.08)" }}>
          {!isAddingChild && (
            <>
              <h3 style={{ color: NAVY, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, marginBottom: 4 }}>Parent / Guardian Details</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px", marginBottom: 36 }} className="form-grid">
                <Input label="Username (for login)" name="username" value={form.username} onChange={handleChange} required />
                <Input label="Email (for login)" name="email" value={form.email} onChange={handleChange} required type="email" />
                <Input label="Password" name="password" value={form.password} onChange={handleChange} required type="password" />
                <Input label="Parent/Guardian Full Name" name="parentName" value={form.parentName} onChange={handleChange} required />
                <Input label="Phone Number" name="phone" type="tel" value={form.phone} onChange={handleChange} required />
                <Input label="Home Address" name="address" value={form.address} onChange={handleChange} />
              </div>
            </>
          )}

          <h3 style={{ color: NAVY, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, marginBottom: 4 }}>Player Information</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px", marginBottom: 36 }} className="form-grid">
            <Input label="Player Full Name" name="playerName" value={form.playerName} onChange={handleChange} required />
            <Input label="Age" name="age" type="number" value={form.age} onChange={handleChange} required placeholder="4-15" min="4" max="15" />
            <Input label="Gender" name="gender" value={form.gender} onChange={handleChange} required options={["Male", "Female", "Other"]} />
            <Input label="Programme" name="program" value={form.program} onChange={handleChange} required options={["Junior Stars (4-8)", "Intermediate (9-12)", "Elite (13-15)"]} />
          </div>

          <h3 style={{ color: NAVY, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, marginBottom: 4 }}>Medical Information</h3>
          <Input label="Medical Conditions / Allergies" name="medical" as="textarea" value={form.medical} onChange={handleChange} placeholder="Write relevant conditions or None." />

          <div style={{ background: ASH, borderRadius: 12, padding: 24, marginBottom: 32 }}>
            <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}>
              <input type="checkbox" name="consent" checked={form.consent} onChange={handleChange} style={{ marginTop: 3, width: 18, height: 18, accentColor: NAVY }} />
              <span style={{ fontSize: 14, color: "#444", lineHeight: 1.6 }}>
                I confirm the information is accurate and I consent to participation at MakkayLee Football Academy (Reg. No: <strong>{BRAND.reg}</strong>).
              </span>
            </label>
            {errors.consent && <p style={{ color: "red", fontSize: 12, marginTop: 8, marginLeft: 30 }}>{errors.consent}</p>}
          </div>

          <button type="submit" style={{ width: "100%", background: `linear-gradient(135deg, ${NAVY}, #1a3168)`, color: "white", border: "none", padding: "18px 32px", borderRadius: 10, fontWeight: 900, fontSize: 18, cursor: "pointer" }}>
            Submit Registration Application
          </button>

          {error && <div style={{ color: "red", marginTop: 16 }}>{error}</div>}
          {Object.keys(errors).length > 0 && <div style={{ color: "red", marginTop: 16 }}>Please fix the errors above.</div>}
        </form>
      </div>
    </div>
  );
}
