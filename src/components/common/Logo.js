export default function Logo({ size = 52 }) {
  return (
    <img
      src="/logo.png"
      alt="MakkayLee Football Academy logo"
      width={size}
      height={size * 1.1}
      style={{ display: "block", objectFit: "contain", background: "white", borderRadius: 6, padding: 4 }}
    />
  );
}
