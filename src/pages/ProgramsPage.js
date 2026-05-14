import { ASH, NAVY } from "../constants/theme";

export default function ProgramsPage({ setPage }) {
  const programs = [
    {
      title: "Junior Stars",
      ages: "Ages 4-8",
      desc: "The foundation stage focused on fun, coordination, and love for the game.",
      focus: ["Ball control", "Coordination", "Team play", "Confidence"],
      schedule: "Saturdays · 8:00 AM-12:00 PM",
      fee: "NGN 30,000/month",
      color: "#FFF3CD",
    },
    {
      title: "Intermediate",
      ages: "Ages 9-12",
      desc: "Technical mastery and tactical understanding with structured sessions.",
      focus: ["Technique", "Positioning", "Tactics", "Conditioning"],
      schedule: "Saturdays · 8:00 AM-12:00 PM",
      fee: "NGN 30,000/month",
      color: "#E8F4FD",
    },
    {
      title: "Elite",
      ages: "Ages 13-15",
      desc: "High intensity preparation for serious players and competitions.",
      focus: ["Advanced training", "Sports psychology", "Recovery", "League play"],
      schedule: "Saturdays · 8:00 AM-12:00 PM",
      fee: "NGN 30,000/month",
      color: "#F3E8FF",
    },
  ];

  return (
    <div style={{ paddingTop: 70 }}>
      <div style={{ background: `linear-gradient(135deg, ${NAVY}, #1a3168)`, padding: "80px 24px", textAlign: "center" }}>
        <h1 style={{ color: "white", fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(32px, 5vw, 60px)", fontWeight: 900, margin: "0 0 16px" }}>Training Programmes</h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 18, maxWidth: 560, margin: "0 auto" }}>Structured pathways from first kick to elite performance.</p>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px" }}>
        {programs.map((program, index) => (
          <div key={program.title} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center", marginBottom: 80, direction: index % 2 === 1 ? "rtl" : "ltr" }} className="program-row">
            <div style={{ direction: "ltr" }}>
              <div style={{ background: program.color, borderRadius: 20, height: 320, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(13,27,62,0.08)" }}>
                <p style={{ color: "#555", fontWeight: 700 }}>{program.ages}</p>
              </div>
            </div>
            <div style={{ direction: "ltr" }}>
              <span style={{ background: ASH, color: NAVY, borderRadius: 20, padding: "4px 14px", fontSize: 13, fontWeight: 700 }}>{program.ages}</span>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 38, fontWeight: 900, color: NAVY, margin: "12px 0 16px" }}>{program.title}</h2>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: 24 }}>{program.desc}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
                {program.focus.map((item) => (
                  <div key={item} style={{ fontSize: 14, color: "#444" }}>- {item}</div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
                <div style={{ background: ASH, borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 600, color: NAVY }}>{program.schedule}</div>
                <div style={{ background: ASH, borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 700, color: NAVY }}>{program.fee}</div>
              </div>
              <button onClick={() => setPage("Register")} style={{ background: NAVY, color: "white", border: "none", padding: "14px 32px", borderRadius: 8, fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                Enroll Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
