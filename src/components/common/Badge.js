import { NAVY } from "../../constants/theme";

export default function Badge({ children, color = NAVY, style = {} }) {
  return (
    <span
      style={{
        background: color,
        color: color === NAVY ? "white" : NAVY,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 1.5,
        padding: "4px 10px",
        borderRadius: 3,
        textTransform: "uppercase",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
