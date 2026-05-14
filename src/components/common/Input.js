import { NAVY } from "../../constants/theme";

export default function Input({
  label,
  name,
  type = "text",
  value,
  onChange,
  required,
  placeholder,
  min,
  max,
  options,
  as,
}) {
  const base = {
    width: "100%",
    padding: "12px 16px",
    border: "2px solid #D0D5E0",
    borderRadius: 8,
    fontSize: 15,
    fontFamily: "inherit",
    background: "white",
    color: NAVY,
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontWeight: 700, fontSize: 13, color: NAVY, marginBottom: 6, letterSpacing: 0.5 }}>
        {label}
        {required && <span style={{ color: NAVY }}> *</span>}
      </label>
      {as === "textarea" ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={3}
          style={{ ...base, resize: "vertical" }}
        />
      ) : options ? (
        <select name={name} value={value} onChange={onChange} style={base}>
          <option value="">Select...</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          min={min}
          max={max}
          required={required}
          style={base}
        />
      )}
    </div>
  );
}
