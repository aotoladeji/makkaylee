import { NAVY } from "../../constants/theme";

export default function SectionTitle({ sup, title, center = true }) {
  return (
    <div style={{ textAlign: center ? "center" : "left", marginBottom: 40 }}>
      {sup && (
        <p
          style={{
            color: NAVY,
            fontWeight: 700,
            letterSpacing: 3,
            fontSize: 12,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          {sup}
        </p>
      )}
      <h2
        style={{
          color: NAVY,
          fontSize: "clamp(28px, 4vw, 42px)",
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: 900,
          lineHeight: 1.2,
          margin: 0,
        }}
      >
        {title}
      </h2>
      <div
        style={{
          height: 3,
          width: 60,
          background: NAVY,
          margin: center ? "16px auto 0" : "16px 0 0",
          borderRadius: 2,
        }}
      />
    </div>
  );
}
