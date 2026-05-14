import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────
   BRAND CONSTANTS
───────────────────────────────────────────── */
const BRAND = {
  name: "MakkayLee Football Academy",
  short: "MLFA",
  reg: "RC 9441728",
  nextSession: "April 4, 2026",
  venue: "International School Ibadan",
  bank: {
    name: "MakkayLee Football Academy",
    bank: "First Bank of Nigeria",
    account: "3141592653",
    sort: "011",
  },
  phone: "+234 801 234 5678",
  email: "info@makkayleeFA.ng",
  instagram: "@makkayleeFA",
};

const NAVY = "#0D1B3E";
const GOLD = "#F5A623";
const ASH = "#EEF0F4";

/* ─────────────────────────────────────────────
   LOGO SVG (recreation from uploaded image)
───────────────────────────────────────────── */
const Logo = ({ size = 52 }) => (
  <svg width={size} height={size * 1.1} viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Outer shield */}
    <path d="M10 10 L190 10 L190 140 L100 210 L10 140 Z" fill={NAVY} />
    {/* Gold stripe left */}
    <path d="M22 22 L32 22 L32 148 L100 200 L100 210 L10 140 L10 10 L22 10 Z" fill={GOLD} />
    {/* Gold stripe right */}
    <path d="M168 22 L178 22 L190 10 L190 140 L100 210 L100 200 L168 148 Z" fill={GOLD} />
    {/* Inner white shield */}
    <path d="M34 24 L166 24 L166 144 L100 198 L34 144 Z" fill="white" />
    {/* Football circle */}
    <circle cx="100" cy="105" r="42" fill={NAVY} />
    {/* Football pentagon pattern */}
    <path d="M100 68 L110 78 L106 90 L94 90 L90 78 Z" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
    <path d="M106 90 L118 88 L124 100 L116 110 L104 108 Z" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
    <path d="M94 90 L82 88 L76 100 L84 110 L96 108 Z" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
    <path d="M104 108 L116 110 L114 124 L100 130 L86 124 L84 110 L96 108 Z" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
    {/* Letters */}
    <text x="46" y="88" fontFamily="Georgia,serif" fontWeight="700" fontSize="28" fill={NAVY}>M</text>
    <text x="138" y="88" fontFamily="Georgia,serif" fontWeight="700" fontSize="28" fill={NAVY}>L</text>
    <text x="82" y="188" fontFamily="Georgia,serif" fontWeight="700" fontSize="24" fill={NAVY}>FA</text>
  </svg>
);

/* ─────────────────────────────────────────────
   REUSABLE COMPONENTS
───────────────────────────────────────────── */
const GoldLine = () => (
  <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, margin: "0 auto", width: "80%", borderRadius: 2 }} />
);

const Badge = ({ children, color = GOLD }) => (
  <span style={{ background: color, color: color === GOLD ? NAVY : "white", fontSize: 11, fontWeight: 800, letterSpacing: 1.5, padding: "4px 10px", borderRadius: 3, textTransform: "uppercase" }}>
    {children}
  </span>
);

const SectionTitle = ({ sup, title, center = true }) => (
  <div style={{ textAlign: center ? "center" : "left", marginBottom: 40 }}>
    {sup && <p style={{ color: GOLD, fontWeight: 700, letterSpacing: 3, fontSize: 12, textTransform: "uppercase", marginBottom: 8 }}>{sup}</p>}
    <h2 style={{ color: NAVY, fontSize: "clamp(28px, 4vw, 42px)", fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900, lineHeight: 1.2, margin: 0 }}>{title}</h2>
    <div style={{ height: 3, width: 60, background: GOLD, margin: center ? "16px auto 0" : "16px 0 0", borderRadius: 2 }} />
  </div>
);

const Input = ({ label, type = "text", value, onChange, required, placeholder, min, max, options, as }) => {
  const base = {
    width: "100%", padding: "12px 16px", border: `2px solid #D0D5E0`, borderRadius: 8,
    fontSize: 15, fontFamily: "inherit", background: "white", color: NAVY,
    outline: "none", transition: "border-color 0.2s", boxSizing: "border-box",
  };
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontWeight: 700, fontSize: 13, color: NAVY, marginBottom: 6, letterSpacing: 0.5 }}>
        {label}{required && <span style={{ color: GOLD }}> *</span>}
      </label>
      {as === "textarea" ? (
        <textarea value={value} onChange={onChange} placeholder={placeholder} rows={3}
          style={{ ...base, resize: "vertical" }} />
      ) : options ? (
        <select value={value} onChange={onChange} style={base}>
          <option value="">Select…</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={onChange} placeholder={placeholder}
          min={min} max={max} required={required} style={base} />
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   NAVIGATION
───────────────────────────────────────────── */
const Nav = ({ page, setPage, menuOpen, setMenuOpen }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const links = ["Home", "Programs", "Register", "Payment", "Dashboard"];

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
      background: scrolled ? `rgba(13,27,62,0.97)` : "transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      transition: "background 0.3s, box-shadow 0.3s",
      boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.3)" : "none",
      borderBottom: scrolled ? `1px solid rgba(245,166,35,0.2)` : "none",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 70 }}>
        <button onClick={() => setPage("Home")} style={{ display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer" }}>
          <Logo size={42} />
          <div style={{ textAlign: "left" }}>
            <div style={{ color: "white", fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900, fontSize: 16, lineHeight: 1 }}>MakkayLee</div>
            <div style={{ color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Football Academy</div>
          </div>
        </button>

        {/* Desktop links */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }} className="desktop-nav">
          {links.map(l => (
            <button key={l} onClick={() => setPage(l)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: page === l ? GOLD : "rgba(255,255,255,0.85)",
              fontWeight: page === l ? 700 : 500, fontSize: 14, padding: "8px 14px",
              borderBottom: page === l ? `2px solid ${GOLD}` : "2px solid transparent",
              transition: "all 0.2s", letterSpacing: 0.5,
            }}>{l}</button>
          ))}
          <button onClick={() => setPage("Register")} style={{
            marginLeft: 12, background: GOLD, color: NAVY, border: "none",
            padding: "9px 20px", borderRadius: 6, fontWeight: 800, fontSize: 13,
            cursor: "pointer", letterSpacing: 0.5,
          }}>Join Now</button>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: "none", background: "none", border: "none", cursor: "pointer", color: "white", fontSize: 24 }} className="mobile-menu-btn">
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{ background: NAVY, borderTop: `2px solid ${GOLD}`, padding: "16px 24px" }}>
          {links.map(l => (
            <button key={l} onClick={() => { setPage(l); setMenuOpen(false); }} style={{
              display: "block", width: "100%", textAlign: "left", background: "none",
              border: "none", color: page === l ? GOLD : "white", padding: "12px 0",
              fontSize: 16, fontWeight: page === l ? 700 : 400, cursor: "pointer",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}>{l}</button>
          ))}
        </div>
      )}
    </nav>
  );
};

/* ─────────────────────────────────────────────
   HOME PAGE
───────────────────────────────────────────── */
const Hero = ({ setPage }) => (
  <section style={{
    minHeight: "100vh", position: "relative", display: "flex", alignItems: "center",
    background: `linear-gradient(135deg, ${NAVY} 0%, #1a3168 50%, #0a1530 100%)`,
    overflow: "hidden",
  }}>
    {/* Decorative elements */}
    <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle at 20% 50%, rgba(245,166,35,0.08) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(245,166,35,0.05) 0%, transparent 50%)` }} />
    <div style={{ position: "absolute", top: "10%", right: "-5%", width: 400, height: 400, borderRadius: "50%", border: `1px solid rgba(245,166,35,0.15)` }} />
    <div style={{ position: "absolute", top: "20%", right: "2%", width: 280, height: 280, borderRadius: "50%", border: `1px solid rgba(245,166,35,0.1)` }} />
    <div style={{ position: "absolute", bottom: "5%", left: "5%", width: 200, height: 200, borderRadius: "50%", border: `1px solid rgba(245,166,35,0.08)` }} />

    {/* Football field lines */}
    <div style={{ position: "absolute", inset: 0, opacity: 0.04 }}>
      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "white" }} />
      <div style={{ position: "absolute", top: "25%", bottom: "25%", left: "50%", width: 1, background: "white" }} />
      <div style={{ position: "absolute", top: "30%", bottom: "30%", left: "35%", right: "35%", border: "1px solid white", borderRadius: "50%" }} />
    </div>

    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "120px 24px 80px", position: "relative", zIndex: 2 }}>
      <div style={{ maxWidth: 700 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <Badge>Est. 2024</Badge>
          <Badge color={NAVY} style={{ border: `1px solid ${GOLD}` }}>Reg. No: {BRAND.reg}</Badge>
        </div>
        <p style={{ color: GOLD, fontWeight: 700, letterSpacing: 3, fontSize: 13, textTransform: "uppercase", marginBottom: 16 }}>
          Nigeria's Premier Youth Football Academy
        </p>
        <h1 style={{
          color: "white", fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "clamp(40px, 7vw, 80px)", fontWeight: 900, lineHeight: 1.05,
          margin: "0 0 24px",
        }}>
          Where Champions<br />
          <span style={{ color: GOLD, display: "inline-block" }}>Begin Their</span> Journey
        </h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 18, lineHeight: 1.7, marginBottom: 40, maxWidth: 560 }}>
          Elite football training for Nigerian children aged 4–15. Building discipline, teamwork, and world-class skills on and off the pitch in Ibadan.
        </p>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <button onClick={() => setPage("Register")} style={{
            background: GOLD, color: NAVY, border: "none",
            padding: "16px 36px", borderRadius: 8, fontWeight: 900, fontSize: 16,
            cursor: "pointer", letterSpacing: 0.5, boxShadow: `0 8px 32px rgba(245,166,35,0.4)`,
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
            onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = `0 12px 40px rgba(245,166,35,0.5)`; }}
            onMouseLeave={e => { e.target.style.transform = ""; e.target.style.boxShadow = `0 8px 32px rgba(245,166,35,0.4)`; }}>
            ⚽ Join the Academy
          </button>
          <button onClick={() => setPage("Programs")} style={{
            background: "transparent", color: "white", border: "2px solid rgba(255,255,255,0.4)",
            padding: "16px 36px", borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: "pointer",
          }}>View Programs →</button>
        </div>

        {/* Next session alert */}
        <div style={{
          marginTop: 48, background: "rgba(245,166,35,0.1)", border: `1px solid rgba(245,166,35,0.3)`,
          borderRadius: 10, padding: "16px 24px", display: "inline-flex", alignItems: "center", gap: 16,
        }}>
          <div style={{ fontSize: 28 }}>📅</div>
          <div>
            <div style={{ color: GOLD, fontWeight: 800, fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>Next Training Session</div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 16 }}>{BRAND.nextSession} · {BRAND.venue}</div>
          </div>
        </div>
      </div>
    </div>

    {/* Stat badges */}
    <div style={{
      position: "absolute", right: "5%", top: "50%", transform: "translateY(-50%)",
      display: "flex", flexDirection: "column", gap: 16,
    }} className="hero-stats">
      {[
        { n: "200+", l: "Players Enrolled" },
        { n: "4–15", l: "Age Groups" },
        { n: "3", l: "Elite Programs" },
        { n: "100%", l: "Professional Coaching" },
      ].map(s => (
        <div key={s.n} style={{
          background: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(245,166,35,0.2)", borderRadius: 12,
          padding: "16px 24px", textAlign: "center", minWidth: 140,
        }}>
          <div style={{ color: GOLD, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, fontWeight: 900 }}>{s.n}</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>{s.l}</div>
        </div>
      ))}
    </div>
  </section>
);

const AboutSection = () => (
  <section style={{ background: "white", padding: "100px 24px" }}>
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }} className="about-grid">
        {/* Image placeholder */}
        <div style={{ position: "relative" }}>
          <div style={{
            background: `linear-gradient(135deg, ${NAVY} 0%, #1a3168 100%)`,
            borderRadius: 16, height: 480, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative",
          }}>
            <div style={{ fontSize: 80, marginBottom: 16 }}>⚽</div>
            <p style={{ color: "rgba(255,255,255,0.6)", textAlign: "center", padding: "0 32px", fontSize: 14, lineHeight: 1.6 }}>
              [Nigerian children training on a well-maintained football pitch, wearing MLFA jerseys, with coaches guiding drills in Ibadan]
            </p>
          </div>
          {/* Floating badge */}
          <div style={{
            position: "absolute", bottom: -24, right: -24,
            background: GOLD, borderRadius: 12, padding: "20px 24px", boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          }}>
            <div style={{ color: NAVY, fontWeight: 900, fontSize: 36, lineHeight: 1 }}>10+</div>
            <div style={{ color: NAVY, fontWeight: 700, fontSize: 12 }}>Years Experience</div>
          </div>
        </div>

        <div>
          <SectionTitle sup="About Us" title="Raising the Next Generation of Football Stars" center={false} />
          <p style={{ color: "#555", fontSize: 16, lineHeight: 1.8, marginBottom: 20 }}>
            MakkayLee Football Academy is Nigeria's most dedicated youth football development programme, based in Ibadan. We believe every Nigerian child deserves access to world-class coaching, discipline, and the opportunity to shine on the global stage.
          </p>
          <p style={{ color: "#555", fontSize: 16, lineHeight: 1.8, marginBottom: 32 }}>
            Founded with a vision to discover and nurture raw talent across age groups 4–15, our certified coaches use UEFA-standard methodologies adapted for the Nigerian context — producing technically gifted, mentally resilient young players.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
            {[
              { icon: "🏆", t: "Championship Results", d: "Multiple regional titles" },
              { icon: "👨‍🏫", t: "Expert Coaches", d: "UEFA & CAF certified" },
              { icon: "🏟️", t: "Premium Facilities", d: "Int'l School Ibadan" },
              { icon: "🤝", t: "Community Focus", d: "Affordable & inclusive" },
            ].map(f => (
              <div key={f.t} style={{ background: ASH, borderRadius: 10, padding: "16px 20px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 24 }}>{f.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, color: NAVY, fontSize: 14 }}>{f.t}</div>
                  <div style={{ color: "#666", fontSize: 13 }}>{f.d}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: `linear-gradient(135deg, ${NAVY}, #1a3168)`, borderRadius: 10, padding: "16px 24px", display: "inline-flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: GOLD, fontSize: 20 }}>📋</span>
            <div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Company Registration</div>
              <div style={{ color: GOLD, fontWeight: 900, fontSize: 18, letterSpacing: 1 }}>{BRAND.reg}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const ScheduleSection = () => (
  <section style={{ background: ASH, padding: "100px 24px" }}>
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <SectionTitle sup="Training Schedule" title="Upcoming Sessions & Timetable" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
        {[
          { day: "Monday & Wednesday", time: "4:00 PM – 6:00 PM", group: "Junior Stars (4–8)", icon: "⭐", color: "#e8f4fd" },
          { day: "Tuesday & Thursday", time: "4:00 PM – 6:30 PM", group: "Intermediate (9–12)", icon: "🌟", color: "#fff8e1" },
          { day: "Saturday", time: "8:00 AM – 11:00 AM", group: "Elite (13–15)", icon: "🏆", color: "#f3e8ff" },
        ].map(s => (
          <div key={s.day} style={{ background: "white", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", borderTop: `4px solid ${GOLD}` }}>
            <div style={{ background: s.color, borderRadius: 10, width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 20 }}>{s.icon}</div>
            <div style={{ fontWeight: 800, color: NAVY, fontSize: 18, marginBottom: 8 }}>{s.group}</div>
            <div style={{ color: "#555", fontWeight: 600, marginBottom: 4 }}>📅 {s.day}</div>
            <div style={{ color: GOLD, fontWeight: 700 }}>🕓 {s.time}</div>
            <div style={{ marginTop: 16, padding: "12px 16px", background: ASH, borderRadius: 8, fontSize: 13, color: "#666" }}>
              📍 {BRAND.venue}, Ibadan
            </div>
          </div>
        ))}
      </div>

      {/* Next session highlight */}
      <div style={{
        marginTop: 40, background: `linear-gradient(135deg, ${NAVY}, #1a3168)`,
        borderRadius: 16, padding: "32px 40px", display: "flex",
        alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24,
        border: `2px solid ${GOLD}`,
      }}>
        <div>
          <p style={{ color: GOLD, fontWeight: 700, letterSpacing: 2, fontSize: 12, textTransform: "uppercase", margin: 0 }}>🔥 Next Open Session</p>
          <h3 style={{ color: "white", fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, margin: "8px 0 4px" }}>{BRAND.nextSession}</h3>
          <p style={{ color: "rgba(255,255,255,0.7)", margin: 0 }}>📍 {BRAND.venue} · Open to all new registrants</p>
        </div>
        <div style={{ background: GOLD, color: NAVY, padding: "16px 32px", borderRadius: 10, fontWeight: 900, fontSize: 18, textAlign: "center" }}>
          Limited Spots<br /><span style={{ fontSize: 13, fontWeight: 700 }}>Register Today</span>
        </div>
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────
   PROGRAMS PAGE
───────────────────────────────────────────── */
const ProgramsPage = ({ setPage }) => {
  const programs = [
    {
      icon: "⭐",
      title: "Junior Stars",
      ages: "Ages 4–8",
      desc: "The foundation of every great footballer begins here. Our Junior Stars programme focuses on fun, coordination, and developing a love for the beautiful game through play-based learning.",
      focus: ["Basic ball control", "Motor skills & coordination", "Team play introduction", "Fun & confidence building", "Mini-matches & festivals"],
      schedule: "Mon & Wed · 4:00–6:00 PM",
      fee: "₦8,000/month",
      color: "#FFF3CD",
      accent: "#F5A623",
      img: "[Young Nigerian children aged 4-8 dribbling footballs with joy on a green pitch]",
    },
    {
      icon: "🌟",
      title: "Intermediate",
      ages: "Ages 9–12",
      desc: "Players at this level begin to build technical mastery and tactical understanding. Intermediate sessions are structured, competitive, and designed to identify natural talent.",
      focus: ["Technical ball mastery", "Positional awareness", "Tactical formations", "Physical conditioning", "Match analysis"],
      schedule: "Tue & Thu · 4:00–6:30 PM",
      fee: "₦12,000/month",
      color: "#E8F4FD",
      accent: "#2196F3",
      img: "[Nigerian children aged 9-12 in football drills, coaches instructing in a professional environment]",
    },
    {
      icon: "🏆",
      title: "Elite",
      ages: "Ages 13–15",
      desc: "Our flagship programme for serious aspiring professionals. Elite training mirrors the intensity of professional academies, preparing players for regional and national competitions.",
      focus: ["Advanced technical training", "Sports psychology", "Nutrition & recovery", "Video analysis", "Competitive league play"],
      schedule: "Saturday · 8:00 AM–11:00 AM",
      fee: "₦18,000/month",
      color: "#F3E8FF",
      accent: "#7B2FBE",
      img: "[Teenage Nigerian footballers aged 13-15 in intense training sessions with professional coaching staff]",
    },
  ];

  return (
    <div style={{ paddingTop: 70 }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${NAVY}, #1a3168)`, padding: "80px 24px", textAlign: "center" }}>
        <p style={{ color: GOLD, fontWeight: 700, letterSpacing: 3, fontSize: 12, textTransform: "uppercase", marginBottom: 12 }}>Our Programmes</p>
        <h1 style={{ color: "white", fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(32px, 5vw, 60px)", fontWeight: 900, margin: "0 0 16px" }}>
          Training Programmes
        </h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 18, maxWidth: 560, margin: "0 auto" }}>
          Structured pathways for every age group — from first kick to elite performance
        </p>
      </div>

      {/* Programs */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px" }}>
        {programs.map((p, i) => (
          <div key={p.title} style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60,
            alignItems: "center", marginBottom: 80, direction: i % 2 === 1 ? "rtl" : "ltr",
          }} className="program-row">
            {/* Image */}
            <div style={{ direction: "ltr" }}>
              <div style={{
                background: p.color, borderRadius: 20, height: 380,
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", border: `3px solid ${p.accent}20`,
              }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>{p.icon}</div>
                <p style={{ color: "#666", textAlign: "center", padding: "0 24px", fontSize: 13, lineHeight: 1.6 }}>{p.img}</p>
              </div>
            </div>

            {/* Content */}
            <div style={{ direction: "ltr" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <span style={{ background: p.accent, color: "white", borderRadius: 20, padding: "4px 14px", fontSize: 13, fontWeight: 700 }}>{p.ages}</span>
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 38, fontWeight: 900, color: NAVY, margin: "0 0 16px" }}>{p.title}</h2>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: 24 }}>{p.desc}</p>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 700, color: NAVY, marginBottom: 12 }}>Programme Focus Areas:</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {p.focus.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#444" }}>
                      <span style={{ color: GOLD, fontWeight: 900 }}>✓</span> {f}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
                <div style={{ background: ASH, borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 600, color: NAVY }}>
                  📅 {p.schedule}
                </div>
                <div style={{ background: `${GOLD}20`, borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 700, color: NAVY }}>
                  💳 {p.fee}
                </div>
              </div>

              <button onClick={() => setPage("Register")} style={{
                background: NAVY, color: "white", border: "none",
                padding: "14px 32px", borderRadius: 8, fontWeight: 800, fontSize: 15, cursor: "pointer",
              }}>Enroll Now →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   REGISTRATION PAGE
───────────────────────────────────────────── */
const RegisterPage = ({ onRegister, setPage }) => {
  const [form, setForm] = useState({
    playerName: "", age: "", gender: "", program: "",
    parentName: "", phone: "", email: "", address: "",
    medical: "", consent: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.playerName.trim()) e.playerName = "Required";
    if (!form.age || form.age < 4 || form.age > 15) e.age = "Age must be 4–15";
    if (!form.gender) e.gender = "Required";
    if (!form.program) e.program = "Required";
    if (!form.parentName.trim()) e.parentName = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.consent) e.consent = "You must agree to the terms";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const reg = { ...form, id: `MLFA-${Date.now()}`, date: new Date().toLocaleDateString(), status: "Pending Payment" };
    onRegister(reg);
    setSubmitted(true);
  };

  if (submitted) return (
    <div style={{ paddingTop: 70, minHeight: "100vh", background: ASH, display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 24px" }}>
      <div style={{ background: "white", borderRadius: 20, padding: "60px 48px", maxWidth: 560, width: "100%", textAlign: "center", boxShadow: "0 20px 80px rgba(0,0,0,0.1)" }}>
        <div style={{ fontSize: 72, marginBottom: 24 }}>🎉</div>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 36, color: NAVY, margin: "0 0 16px" }}>Registration Received!</h2>
        <p style={{ color: "#666", lineHeight: 1.7, marginBottom: 32 }}>
          Welcome to MakkayLee Football Academy! Your application for <strong>{form.playerName}</strong> has been submitted. Please complete your registration by making payment.
        </p>
        <div style={{ background: ASH, borderRadius: 12, padding: 24, marginBottom: 32, textAlign: "left" }}>
          <div style={{ color: NAVY, fontWeight: 700, marginBottom: 12 }}>Application Summary</div>
          {[["Player", form.playerName], ["Age", form.age], ["Programme", form.program], ["Contact", form.phone]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e0e0e0", fontSize: 14 }}>
              <span style={{ color: "#666" }}>{k}</span><span style={{ fontWeight: 600, color: NAVY }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => setPage("Payment")} style={{ background: GOLD, color: NAVY, border: "none", padding: "14px 28px", borderRadius: 8, fontWeight: 800, cursor: "pointer" }}>
            Proceed to Payment →
          </button>
          <button onClick={() => setPage("Dashboard")} style={{ background: NAVY, color: "white", border: "none", padding: "14px 28px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
            View My Profile
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ paddingTop: 70, background: ASH, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${NAVY}, #1a3168)`, padding: "60px 24px", textAlign: "center" }}>
        <Logo size={52} />
        <h1 style={{ color: "white", fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, margin: "16px 0 8px" }}>
          Join the Academy
        </h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 16 }}>Complete the form below to begin your child's football journey</p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(245,166,35,0.15)", border: `1px solid ${GOLD}40`, borderRadius: 8, padding: "8px 20px", marginTop: 16 }}>
          <span style={{ color: GOLD, fontSize: 12, fontWeight: 700 }}>🏛️ CAC Registered Academy · {BRAND.reg}</span>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ background: "white", borderRadius: 20, padding: "48px", boxShadow: "0 8px 48px rgba(0,0,0,0.08)" }}>
          {/* Section: Player Info */}
          <div style={{ marginBottom: 36 }}>
            <h3 style={{ color: NAVY, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, marginBottom: 4 }}>Player Information</h3>
            <div style={{ height: 2, background: `${GOLD}40`, marginBottom: 28, borderRadius: 1 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }} className="form-grid">
              <div>
                <Input label="Player Full Name" value={form.playerName} onChange={f("playerName")} required placeholder="e.g. Emeka Okonkwo" />
                {errors.playerName && <p style={{ color: "red", fontSize: 12, marginTop: -14, marginBottom: 8 }}>{errors.playerName}</p>}
              </div>
              <div>
                <Input label="Age" type="number" value={form.age} onChange={f("age")} required placeholder="4–15" min="4" max="15" />
                {errors.age && <p style={{ color: "red", fontSize: 12, marginTop: -14, marginBottom: 8 }}>{errors.age}</p>}
              </div>
              <div>
                <Input label="Gender" value={form.gender} onChange={f("gender")} required options={["Male", "Female", "Other"]} />
                {errors.gender && <p style={{ color: "red", fontSize: 12, marginTop: -14, marginBottom: 8 }}>{errors.gender}</p>}
              </div>
              <div>
                <Input label="Programme" value={form.program} onChange={f("program")} required options={["Junior Stars (4–8)", "Intermediate (9–12)", "Elite (13–15)"]} />
                {errors.program && <p style={{ color: "red", fontSize: 12, marginTop: -14, marginBottom: 8 }}>{errors.program}</p>}
              </div>
            </div>
          </div>

          {/* Section: Parent/Guardian */}
          <div style={{ marginBottom: 36 }}>
            <h3 style={{ color: NAVY, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, marginBottom: 4 }}>Parent / Guardian Details</h3>
            <div style={{ height: 2, background: `${GOLD}40`, marginBottom: 28, borderRadius: 1 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }} className="form-grid">
              <div>
                <Input label="Parent/Guardian Full Name" value={form.parentName} onChange={f("parentName")} required placeholder="e.g. Chukwuemeka Okonkwo" />
                {errors.parentName && <p style={{ color: "red", fontSize: 12, marginTop: -14, marginBottom: 8 }}>{errors.parentName}</p>}
              </div>
              <div>
                <Input label="Phone Number" type="tel" value={form.phone} onChange={f("phone")} required placeholder="+234 800 000 0000" />
                {errors.phone && <p style={{ color: "red", fontSize: 12, marginTop: -14, marginBottom: 8 }}>{errors.phone}</p>}
              </div>
              <div>
                <Input label="Email Address (Optional)" type="email" value={form.email} onChange={f("email")} placeholder="parent@email.com" />
              </div>
              <div>
                <Input label="Home Address" value={form.address} onChange={f("address")} placeholder="Street, City, State" />
              </div>
            </div>
          </div>

          {/* Medical */}
          <div style={{ marginBottom: 36 }}>
            <h3 style={{ color: NAVY, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, marginBottom: 4 }}>Medical Information</h3>
            <div style={{ height: 2, background: `${GOLD}40`, marginBottom: 28, borderRadius: 1 }} />
            <div style={{ background: "#FFF8E1", border: "1px solid #FFE082", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 14, color: "#6D4C00" }}>
              ⚕️ For the safety of your child, please disclose any relevant medical conditions, allergies, or physical limitations.
            </div>
            <Input label="Medical Conditions / Allergies" as="textarea" value={form.medical} onChange={f("medical")} placeholder="e.g. Asthma — uses inhaler. No known allergies. OR write 'None' if not applicable." />
          </div>

          {/* Consent */}
          <div style={{ background: ASH, borderRadius: 12, padding: 24, marginBottom: 32 }}>
            <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}>
              <input type="checkbox" checked={form.consent} onChange={f("consent")} style={{ marginTop: 3, width: 18, height: 18, accentColor: NAVY }} />
              <span style={{ fontSize: 14, color: "#444", lineHeight: 1.6 }}>
                I confirm that the information provided is accurate and I consent to my child participating in training activities at MakkayLee Football Academy (Reg. No: <strong>{BRAND.reg}</strong>). I understand that payment must be completed to confirm enrolment.
              </span>
            </label>
            {errors.consent && <p style={{ color: "red", fontSize: 12, marginTop: 8, marginLeft: 30 }}>{errors.consent}</p>}
          </div>

          <button onClick={handleSubmit} style={{
            width: "100%", background: `linear-gradient(135deg, ${NAVY}, #1a3168)`,
            color: "white", border: "none", padding: "18px 32px",
            borderRadius: 10, fontWeight: 900, fontSize: 18, cursor: "pointer",
            boxShadow: `0 8px 32px rgba(13,27,62,0.3)`, letterSpacing: 0.5,
          }}>
            ⚽ Submit Registration Application
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   PAYMENT PAGE
───────────────────────────────────────────── */
const PaymentPage = ({ member }) => {
  const [uploaded, setUploaded] = useState(null);
  const [ref, setRef] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const fileRef = useRef();

  const fees = { "Junior Stars (4–8)": "₦8,000", "Intermediate (9–12)": "₦12,000", "Elite (13–15)": "₦18,000" };
  const fee = member ? fees[member.program] || "₦12,000" : "₦12,000";

  return (
    <div style={{ paddingTop: 70, background: ASH, minHeight: "100vh" }}>
      <div style={{ background: `linear-gradient(135deg, ${NAVY}, #1a3168)`, padding: "60px 24px", textAlign: "center" }}>
        <h1 style={{ color: "white", fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, margin: "0 0 8px" }}>Payment Information</h1>
        <p style={{ color: "rgba(255,255,255,0.7)" }}>Complete your payment to confirm your child's enrolment</p>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }} className="payment-grid">
          {/* Bank Transfer Details */}
          <div style={{ background: "white", borderRadius: 20, padding: 40, boxShadow: "0 8px 40px rgba(0,0,0,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ background: `${GOLD}20`, borderRadius: 10, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏦</div>
              <h2 style={{ margin: 0, color: NAVY, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22 }}>Bank Transfer</h2>
            </div>

            {[
              ["Account Name", BRAND.bank.name],
              ["Bank", BRAND.bank.bank],
              ["Account Number", BRAND.bank.account],
              ["Sort Code", BRAND.bank.sort],
            ].map(([k, v]) => (
              <div key={k} style={{ padding: "14px 0", borderBottom: "1px solid #eee" }}>
                <div style={{ color: "#888", fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>{k}</div>
                <div style={{ color: NAVY, fontWeight: 800, fontSize: k === "Account Number" ? 24 : 16, letterSpacing: k === "Account Number" ? 3 : 0 }}>{v}</div>
              </div>
            ))}

            <div style={{ background: `${GOLD}15`, border: `2px solid ${GOLD}`, borderRadius: 12, padding: "16px 20px", marginTop: 24 }}>
              <div style={{ color: "#888", fontSize: 12, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Monthly Fee ({member?.program || "selected programme"})</div>
              <div style={{ color: NAVY, fontWeight: 900, fontSize: 32 }}>{fee}</div>
            </div>

            <div style={{ background: "#EBF8FF", border: "1px solid #BEE3F8", borderRadius: 10, padding: 16, marginTop: 16, fontSize: 13, color: "#2C5282", lineHeight: 1.6 }}>
              💡 Use your child's full name as the payment reference/narration for easy identification.
            </div>
          </div>

          {/* Proof of Payment */}
          <div style={{ background: "white", borderRadius: 20, padding: 40, boxShadow: "0 8px 40px rgba(0,0,0,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ background: "#F0FFF4", borderRadius: 10, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📤</div>
              <h2 style={{ margin: 0, color: NAVY, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22 }}>Proof of Payment</h2>
            </div>
            <p style={{ color: "#666", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              After completing your bank transfer, upload your payment receipt or enter your transaction reference number below.
            </p>

            {/* Transaction Ref */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontWeight: 700, fontSize: 13, color: NAVY, marginBottom: 6 }}>Transaction Reference Number</label>
              <input value={ref} onChange={e => setRef(e.target.value)}
                placeholder="e.g. TRN20250404123456"
                style={{ width: "100%", padding: "12px 16px", border: "2px solid #D0D5E0", borderRadius: 8, fontSize: 15, fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>

            {/* File Upload */}
            <div
              onClick={() => fileRef.current.click()}
              style={{
                border: `2px dashed ${uploaded ? "#48BB78" : "#CBD5E0"}`,
                borderRadius: 12, padding: "32px 24px", textAlign: "center",
                cursor: "pointer", background: uploaded ? "#F0FFF4" : "#FAFBFC",
                transition: "all 0.2s", marginBottom: 24,
              }}>
              <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: "none" }}
                onChange={e => setUploaded(e.target.files[0]?.name)} />
              {uploaded ? (
                <>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
                  <div style={{ color: "#276749", fontWeight: 700 }}>{uploaded}</div>
                  <div style={{ color: "#48BB78", fontSize: 13 }}>File selected — click to change</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>📎</div>
                  <div style={{ color: NAVY, fontWeight: 700, marginBottom: 4 }}>Upload Receipt / Screenshot</div>
                  <div style={{ color: "#999", fontSize: 13 }}>Click to browse · PNG, JPG, PDF accepted</div>
                </>
              )}
            </div>

            {confirmed ? (
              <div style={{ background: "#F0FFF4", border: "2px solid #48BB78", borderRadius: 12, padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎊</div>
                <div style={{ color: "#276749", fontWeight: 800, fontSize: 16 }}>Payment Submitted!</div>
                <div style={{ color: "#48BB78", fontSize: 14 }}>Our team will verify and confirm within 24 hours.</div>
              </div>
            ) : (
              <button
                onClick={() => { if (ref || uploaded) setConfirmed(true); }}
                style={{
                  width: "100%", background: ref || uploaded ? NAVY : "#CBD5E0",
                  color: "white", border: "none", padding: "16px", borderRadius: 10,
                  fontWeight: 800, fontSize: 16, cursor: ref || uploaded ? "pointer" : "not-allowed",
                }}>
                ✅ Confirm Payment Submission
              </button>
            )}

            <div style={{ marginTop: 20, padding: 16, background: "#FFFBEB", borderRadius: 10, fontSize: 13, color: "#744210", lineHeight: 1.6 }}>
              ⏱️ Enrolment is confirmed only after payment verification. You'll receive a confirmation SMS within 24 hours.
            </div>
          </div>
        </div>

        {/* Contact */}
        <div style={{ marginTop: 32, background: `linear-gradient(135deg, ${NAVY}, #1a3168)`, borderRadius: 16, padding: "28px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Need help with payment?</div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 18 }}>Contact our admissions team</div>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <a href={`tel:${BRAND.phone}`} style={{ background: GOLD, color: NAVY, padding: "12px 24px", borderRadius: 8, fontWeight: 800, textDecoration: "none", fontSize: 14 }}>📞 {BRAND.phone}</a>
            <a href={`mailto:${BRAND.email}`} style={{ background: "rgba(255,255,255,0.1)", color: "white", padding: "12px 24px", borderRadius: 8, fontWeight: 600, textDecoration: "none", fontSize: 14 }}>✉️ Email Us</a>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MEMBER DASHBOARD
───────────────────────────────────────────── */
const DashboardPage = ({ member, setPage }) => {
  if (!member) return (
    <div style={{ paddingTop: 70, minHeight: "100vh", background: ASH, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px" }}>
      <div style={{ background: "white", borderRadius: 20, padding: "60px 48px", maxWidth: 500, width: "100%", textAlign: "center", boxShadow: "0 20px 80px rgba(0,0,0,0.1)" }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🏟️</div>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, color: NAVY, marginBottom: 16 }}>No Profile Yet</h2>
        <p style={{ color: "#666", lineHeight: 1.7, marginBottom: 32 }}>
          Register your child first to access their member profile and track their academy journey.
        </p>
        <button onClick={() => setPage("Register")} style={{
          background: NAVY, color: "white", border: "none", padding: "14px 32px",
          borderRadius: 8, fontWeight: 800, fontSize: 16, cursor: "pointer",
        }}>Register Now →</button>
      </div>
    </div>
  );

  const fees = { "Junior Stars (4–8)": "₦8,000", "Intermediate (9–12)": "₦12,000", "Elite (13–15)": "₦18,000" };

  return (
    <div style={{ paddingTop: 70, background: ASH, minHeight: "100vh" }}>
      {/* Profile Header */}
      <div style={{ background: `linear-gradient(135deg, ${NAVY}, #1a3168)`, padding: "60px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
          <div style={{
            width: 100, height: 100, borderRadius: "50%",
            background: GOLD, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 40, fontWeight: 900, color: NAVY, border: `4px solid rgba(255,255,255,0.3)`,
            flexShrink: 0,
          }}>
            {member.playerName?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p style={{ color: GOLD, fontWeight: 700, letterSpacing: 2, fontSize: 12, textTransform: "uppercase", margin: "0 0 4px" }}>Registered Member</p>
            <h1 style={{ color: "white", fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 900, margin: "0 0 8px" }}>{member.playerName}</h1>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Badge>{member.program}</Badge>
              <span style={{ background: member.status === "Pending Payment" ? "#FFA000" : "#43A047", color: "white", fontSize: 11, fontWeight: 800, letterSpacing: 1, padding: "4px 10px", borderRadius: 3, textTransform: "uppercase" }}>
                {member.status}
              </span>
            </div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>Member ID</div>
            <div style={{ color: GOLD, fontWeight: 900, fontSize: 18, letterSpacing: 1 }}>{member.id}</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="dashboard-grid">
          {/* Personal Info */}
          <div style={{ background: "white", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <h3 style={{ color: NAVY, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, marginBottom: 20 }}>👤 Player Profile</h3>
            {[
              ["Full Name", member.playerName],
              ["Age", `${member.age} years old`],
              ["Gender", member.gender],
              ["Programme", member.program],
              ["Registration Date", member.date],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F0F0F0", fontSize: 14 }}>
                <span style={{ color: "#888" }}>{k}</span>
                <span style={{ fontWeight: 700, color: NAVY }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Parent Info */}
          <div style={{ background: "white", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <h3 style={{ color: NAVY, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, marginBottom: 20 }}>👨‍👩‍👦 Guardian Details</h3>
            {[
              ["Guardian Name", member.parentName],
              ["Phone", member.phone],
              ["Email", member.email || "Not provided"],
              ["Address", member.address || "Not provided"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F0F0F0", fontSize: 14 }}>
                <span style={{ color: "#888" }}>{k}</span>
                <span style={{ fontWeight: 700, color: NAVY, textAlign: "right", maxWidth: 200 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Medical */}
          <div style={{ background: "white", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <h3 style={{ color: NAVY, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, marginBottom: 16 }}>⚕️ Medical Information</h3>
            <div style={{ background: "#FFF8E1", border: "1px solid #FFE082", borderRadius: 10, padding: 16, color: "#5D4037", fontSize: 14, lineHeight: 1.6 }}>
              {member.medical || "No medical conditions disclosed. 🟢 Cleared for full training."}
            </div>
          </div>

          {/* Payment Status */}
          <div style={{ background: "white", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <h3 style={{ color: NAVY, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, marginBottom: 20 }}>💳 Payment Status</h3>
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{member.status === "Pending Payment" ? "⏳" : "✅"}</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: member.status === "Pending Payment" ? "#E65100" : "#2E7D32" }}>{member.status}</div>
              <div style={{ color: "#888", fontSize: 14, marginTop: 4 }}>Monthly fee: <strong>{fees[member.program] || "—"}</strong></div>
            </div>
            {member.status === "Pending Payment" && (
              <button onClick={() => setPage("Payment")} style={{
                width: "100%", background: GOLD, color: NAVY, border: "none",
                padding: "14px", borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: "pointer", marginTop: 8,
              }}>
                Complete Payment →
              </button>
            )}
          </div>
        </div>

        {/* Academy Details */}
        <div style={{ marginTop: 24, background: `linear-gradient(135deg, ${NAVY}, #1a3168)`, borderRadius: 16, padding: "32px 40px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
            {[
              { icon: "📅", label: "Next Session", value: BRAND.nextSession },
              { icon: "📍", label: "Training Venue", value: BRAND.venue + ", Ibadan" },
              { icon: "🏛️", label: "Academy Reg.", value: BRAND.reg },
              { icon: "📞", label: "Admin Contact", value: BRAND.phone },
            ].map(s => (
              <div key={s.label}>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 4 }}>{s.icon} {s.label}</div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────── */
const Footer = ({ setPage }) => (
  <footer style={{ background: "#070F24", color: "rgba(255,255,255,0.7)", paddingTop: 64 }}>
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48 }} className="footer-grid">
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <Logo size={44} />
          <div>
            <div style={{ color: "white", fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900, fontSize: 16 }}>MakkayLee FA</div>
            <div style={{ color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>FOOTBALL ACADEMY</div>
          </div>
        </div>
        <p style={{ lineHeight: 1.8, fontSize: 14, maxWidth: 280 }}>Developing the next generation of Nigerian football talent through elite coaching, discipline, and passion for the beautiful game.</p>
        <div style={{ marginTop: 20, padding: "10px 16px", background: "rgba(245,166,35,0.1)", border: `1px solid ${GOLD}30`, borderRadius: 8, display: "inline-block" }}>
          <span style={{ color: GOLD, fontSize: 12, fontWeight: 700 }}>CAC Reg. No: {BRAND.reg}</span>
        </div>
      </div>

      {[
        { title: "Quick Links", links: [["Home", "Home"], ["Programs", "Programs"], ["Register", "Register"], ["Payment", "Payment"]] },
        { title: "Programmes", links: [["Junior Stars (4–8)", "Programs"], ["Intermediate (9–12)", "Programs"], ["Elite (13–15)", "Programs"]] },
      ].map(col => (
        <div key={col.title}>
          <h4 style={{ color: "white", fontWeight: 700, marginBottom: 20, fontSize: 15 }}>{col.title}</h4>
          {col.links.map(([l, p]) => (
            <button key={l} onClick={() => setPage(p)} style={{ display: "block", background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 14, padding: "4px 0", textAlign: "left" }}>{l}</button>
          ))}
        </div>
      ))}

      <div>
        <h4 style={{ color: "white", fontWeight: 700, marginBottom: 20, fontSize: 15 }}>Contact</h4>
        {[
          ["📞", BRAND.phone],
          ["✉️", BRAND.email],
          ["📸", BRAND.instagram],
          ["📍", "Ibadan, Oyo State, Nigeria"],
        ].map(([i, t]) => (
          <div key={t} style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 13 }}>
            <span>{i}</span><span style={{ color: "rgba(255,255,255,0.7)" }}>{t}</span>
          </div>
        ))}
      </div>
    </div>

    <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 48, padding: "24px", textAlign: "center", fontSize: 13 }}>
      <GoldLine />
      <p style={{ marginTop: 20 }}>© {new Date().getFullYear()} MakkayLee Football Academy · {BRAND.reg} · All rights reserved · Built with ❤️ for Nigerian Football</p>
    </div>
  </footer>
);

/* ─────────────────────────────────────────────
   RESPONSIVE STYLES
───────────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', -apple-system, sans-serif; }
    button { font-family: inherit; }
    input, select, textarea { font-family: inherit; }
    input:focus, select:focus, textarea:focus { border-color: #0D1B3E !important; box-shadow: 0 0 0 3px rgba(13,27,62,0.1); }

    @media (max-width: 768px) {
      .desktop-nav { display: none !important; }
      .mobile-menu-btn { display: block !important; }
      .hero-stats { display: none !important; }
      .about-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
      .program-row { grid-template-columns: 1fr !important; direction: ltr !important; }
      .form-grid { grid-template-columns: 1fr !important; }
      .payment-grid { grid-template-columns: 1fr !important; }
      .dashboard-grid { grid-template-columns: 1fr !important; }
      .footer-grid { grid-template-columns: 1fr 1fr !important; }
    }
    @media (max-width: 480px) {
      .footer-grid { grid-template-columns: 1fr !important; }
    }
  `}</style>
);

/* ─────────────────────────────────────────────
   ROOT APP
───────────────────────────────────────────── */
export default function App() {
  const [page, setPage] = useState("Home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [member, setMember] = useState(null);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [page]);

  const handleRegister = (data) => {
    setMember(data);
  };

  const navProps = { page, setPage, menuOpen, setMenuOpen };

  return (
    <>
      <GlobalStyles />
      <Nav {...navProps} />
      <main>
        {page === "Home" && (
          <>
            <Hero setPage={setPage} />
            <AboutSection />
            <ScheduleSection />
          </>
        )}
        {page === "Programs" && <ProgramsPage setPage={setPage} />}
        {page === "Register" && <RegisterPage onRegister={handleRegister} setPage={setPage} />}
        {page === "Payment" && <PaymentPage member={member} />}
        {page === "Dashboard" && <DashboardPage member={member} setPage={setPage} />}
      </main>
      <Footer setPage={setPage} />
    </>
  );
}
