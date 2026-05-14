import { useEffect, useState } from "react";
import Badge from "../components/common/Badge";
import SectionTitle from "../components/common/SectionTitle";
import { BRAND } from "../constants/brand";
import { API } from "../constants/api";
import { ASH, NAVY } from "../constants/theme";

function Hero({ setPage, eventNotification }) {
  return (
    <section
      style={{
        minHeight: "100vh",
        position: "relative",
        display: "flex",
        alignItems: "center",
        background: "url('/hero.jpg') center/cover no-repeat",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(13,27,62,0.85) 0%, rgba(26,49,104,0.7) 50%, rgba(10,21,48,0.85) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(238,240,244,0.08) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(238,240,244,0.05) 0%, transparent 50%)" }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "120px 24px 80px", position: "relative", zIndex: 2 }}>
        <div style={{ maxWidth: 700 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <Badge>Est. 2026</Badge>
            <Badge color={ASH} style={{ border: `1px solid ${NAVY}` }}>
              Reg. No: {BRAND.reg}
            </Badge>
          </div>

          <p style={{ color: ASH, fontWeight: 700, letterSpacing: 3, fontSize: 13, textTransform: "uppercase", marginBottom: 16 }}>A Dynamic Football Academy</p>
          <h1
            style={{
              color: "white",
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(40px, 7vw, 80px)",
              fontWeight: 900,
              lineHeight: 1.05,
              margin: "0 0 24px",
            }}
          >
            Where Champions
            <br />
            <span style={{ color: ASH, display: "inline-block" }}>Begin Their</span> Journey
          </h1>

          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 18, lineHeight: 1.7, marginBottom: 40, maxWidth: 560 }}>
            Elite football development programs for Nigerian children aged 4-15. Building discipline, teamwork, and world-class skills on and off the pitch.
          </p>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <button
              onClick={() => setPage("Register")}
              style={{ background: NAVY, color: "white", border: "none", padding: "16px 36px", borderRadius: 8, fontWeight: 900, fontSize: 16, cursor: "pointer", letterSpacing: 0.5, boxShadow: "0 8px 32px rgba(13,27,62,0.4)", transition: "transform 0.2s, box-shadow 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(13,27,62,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 32px rgba(13,27,62,0.4)"; }}
            >
              ⚽ Join the Academy
            </button>
            <button onClick={() => setPage("Programs")} style={{ background: "transparent", color: "white", border: "2px solid rgba(255,255,255,0.4)", padding: "16px 36px", borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
              View Programs →
            </button>
          </div>

          {/* Next session alert */}
          <div style={{ marginTop: 48, background: "rgba(238,240,244,0.1)", border: "1px solid rgba(238,240,244,0.3)", borderRadius: 10, padding: "16px 24px", display: "inline-flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 28 }}>📅</div>
            <div>
              <div style={{ color: ASH, fontWeight: 800, fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>{eventNotification.title}</div>
              <div style={{ color: "white", fontWeight: 700, fontSize: 16 }}>{eventNotification.dateLabel} · {eventNotification.venue}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat badges */}
      <div style={{ position: "absolute", right: "5%", top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: 16 }} className="hero-stats">
        {[
          { n: "4-15", l: "Age Groups" },
          { n: "3", l: "Elite Programs" },
          { n: "100%", l: "Professional Coaching" },
        ].map((stat) => (
          <div key={stat.n} style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)", border: "1px solid rgba(238,240,244,0.2)", borderRadius: 12, padding: "16px 24px", textAlign: "center", minWidth: 140 }}>
            <div style={{ color: ASH, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, fontWeight: 900 }}>{stat.n}</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>{stat.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section style={{ background: "white", padding: "100px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }} className="about-grid">
          {/* Image with floating badge */}
          <div style={{ position: "relative" }}>
            <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a3168 100%)`, borderRadius: 16, height: 480, overflow: "hidden" }}>
              <img src="/kid.png" alt="Children training" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ position: "absolute", bottom: -24, right: -24, background: ASH, borderRadius: 12, padding: "20px 24px", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
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

            {/* Feature grid */}
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

            {/* Reg badge */}
            <div style={{ background: `linear-gradient(135deg, ${NAVY}, #1a3168)`, borderRadius: 10, padding: "16px 24px", display: "inline-flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: ASH, fontSize: 20 }}>📋</span>
              <div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Company Registration</div>
                <div style={{ color: ASH, fontWeight: 900, fontSize: 18, letterSpacing: 1 }}>{BRAND.reg}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ScheduleSection({ setPage, eventNotification }) {
  return (
    <section style={{ background: ASH, padding: "100px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionTitle sup="Training Schedule" title="Upcoming Sessions & Timetable" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          {[
            { day: "Monday & Wednesday", time: "4:00 PM – 6:00 PM", group: "Junior Stars (4–8)", icon: "⭐", color: "#e8f4fd" },
            { day: "Tuesday & Thursday", time: "4:00 PM – 6:30 PM", group: "Intermediate (9–12)", icon: "🌟", color: "#fff8e1" },
            { day: "Saturday", time: "8:00 AM – 11:00 AM", group: "Elite (13–15)", icon: "🏆", color: "#f3e8ff" },
          ].map((session) => (
            <div key={session.group} style={{ background: "white", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", borderTop: `4px solid ${NAVY}` }}>
              <div style={{ background: session.color, borderRadius: 10, width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 20 }}>{session.icon}</div>
              <div style={{ fontWeight: 800, color: NAVY, fontSize: 18, marginBottom: 8 }}>{session.group}</div>
              <div style={{ color: "#555", fontWeight: 600, marginBottom: 4 }}>📅 {session.day}</div>
              <div style={{ color: NAVY, fontWeight: 700 }}>🕓 {session.time}</div>
              <div style={{ marginTop: 16, padding: "12px 16px", background: ASH, borderRadius: 8, fontSize: 13, color: "#666" }}>📍 {BRAND.venue}, Ibadan</div>
            </div>
          ))}
        </div>

        {/* Next session banner */}
        <div style={{ marginTop: 40, background: `linear-gradient(135deg, ${NAVY}, #1a3168)`, borderRadius: 16, padding: "32px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24, border: `2px solid ${ASH}` }}>
          <div>
            <p style={{ color: ASH, fontWeight: 700, letterSpacing: 2, fontSize: 12, textTransform: "uppercase", margin: 0 }}>🔥 Next Open Session</p>
            <h3 style={{ color: "white", fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, margin: "8px 0 4px" }}>{eventNotification.dateLabel}</h3>
            <p style={{ color: "rgba(255,255,255,0.7)", margin: 0 }}>📍 {eventNotification.venue} · {eventNotification.note || "Open to all new registrants"}</p>
          </div>
          <button onClick={() => setPage("Register")} style={{ background: NAVY, color: "white", border: `2px solid ${ASH}`, padding: "16px 32px", borderRadius: 10, fontWeight: 900, fontSize: 18, cursor: "pointer", textAlign: "center" }}>
            Limited Spots<br /><span style={{ fontSize: 13, fontWeight: 700 }}>Register Today</span>
          </button>
        </div>
      </div>
    </section>