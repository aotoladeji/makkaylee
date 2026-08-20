import { useEffect, useState } from "react";
import SectionTitle from "../components/common/SectionTitle";
import { API } from "../constants/api";
import { ASH, GOLD, NAVY } from "../constants/theme";
import { BRAND } from "../constants/brand";

const apiBase = API.replace("/api", "");

export default function PartnersPage({ setPage }) {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/sponsors?type=partner`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPartners(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: ASH, minHeight: "100vh", paddingTop: 70 }}>
      {/* Hero banner */}
      <div
        style={{
          position: "relative",
          background: "url('/hero.jpg') center/cover no-repeat",
          padding: "80px 24px 64px",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(13,27,62,0.9), rgba(26,49,104,0.78))" }} />
        <div style={{ maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤝</div>
          <h1
            style={{
              color: "white",
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(32px, 5vw, 56px)",
              fontWeight: 900,
              margin: "0 0 20px",
              lineHeight: 1.1,
            }}
          >
            Our Partners
          </h1>
          <p style={{ color: "rgba(255,255,255,0.78)", fontSize: 18, lineHeight: 1.7, margin: 0 }}>
            We collaborate with strategic partners who share our vision of building world-class Nigerian football talent from the grassroots.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px" }}>
        {/* Seek partnership CTA */}
        <div
          style={{
            background: "white",
            borderRadius: 20,
            padding: "48px 40px",
            marginBottom: 64,
            boxShadow: "0 4px 32px rgba(0,0,0,0.07)",
            display: "flex",
            gap: 40,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 320px" }}>
            <div
              style={{
                display: "inline-block",
                background: `${NAVY}15`,
                color: NAVY,
                fontWeight: 800,
                fontSize: 12,
                letterSpacing: 2,
                textTransform: "uppercase",
                padding: "6px 14px",
                borderRadius: 20,
                marginBottom: 16,
                border: `1px solid ${NAVY}33`,
              }}
            >
              Become a Partner
            </div>
            <h2
              style={{
                color: NAVY,
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "clamp(22px, 3vw, 34px)",
                fontWeight: 900,
                margin: "0 0 16px",
              }}
            >
              Partner With MakkayLee FA
            </h2>
            <p style={{ color: "#4a5568", lineHeight: 1.8, fontSize: 16, margin: "0 0 24px" }}>
              We welcome partnerships with schools, sports organisations, health and wellness brands, media houses, and community groups who share
              our commitment to nurturing young Nigerian football talent. A formal partnership creates a lasting relationship of mutual value.
            </p>
            <ul style={{ color: "#4a5568", lineHeight: 2, fontSize: 15, paddingLeft: 20, margin: "0 0 28px" }}>
              <li>Co-branded events and joint programmes</li>
              <li>Access to our growing community of parents and players</li>
              <li>Recognition across all academy communications</li>
              <li>Flexible partnership models to suit your organisation</li>
            </ul>
            <p style={{ color: NAVY, fontWeight: 700, fontSize: 15, margin: 0 }}>
              📧 Interested? Contact our admin team at{" "}
              <a href={`mailto:${BRAND.email}`} style={{ color: GOLD, textDecoration: "none" }}>
                {BRAND.email}
              </a>{" "}
              or call{" "}
              <a href={`tel:${BRAND.phone}`} style={{ color: GOLD, textDecoration: "none" }}>
                {BRAND.phone}
              </a>{" "}
              to explore partnership opportunities.
            </p>
          </div>
          <div
            style={{
              flex: "0 0 auto",
              background: `linear-gradient(135deg, ${NAVY} 0%, #1a3168 100%)`,
              borderRadius: 16,
              padding: "32px 28px",
              minWidth: 220,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌍</div>
            <div style={{ color: "white", fontWeight: 900, fontSize: 18, marginBottom: 8 }}>Let's collaborate!</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
              Reach out to our admin team today and let's build something great together.
            </div>
            <a
              href={`mailto:${BRAND.email}?subject=Partnership%20Inquiry`}
              style={{
                display: "inline-block",
                background: GOLD,
                color: NAVY,
                fontWeight: 800,
                fontSize: 14,
                padding: "12px 24px",
                borderRadius: 8,
                textDecoration: "none",
                letterSpacing: 0.5,
              }}
            >
              Contact Admin
            </a>
          </div>
        </div>

        {/* Partners list */}
        <SectionTitle>Current Partners</SectionTitle>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24, marginTop: 32 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ background: "white", borderRadius: 16, padding: 32, height: 200, animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ) : partners.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              background: "white",
              borderRadius: 16,
              padding: "56px 32px",
              marginTop: 32,
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🤝</div>
            <h3 style={{ color: NAVY, fontWeight: 800, fontSize: 20, marginBottom: 12 }}>Be Our First Partner!</h3>
            <p style={{ color: "#718096", fontSize: 15, lineHeight: 1.7 }}>
              We are actively seeking strategic partners to grow the academy together. Contact us today to explore opportunities.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24, marginTop: 32 }}>
            {partners.map((p) => (
              <PartnerCard key={p.id} partner={p} apiBase={apiBase} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

function PartnerCard({ partner, apiBase }) {
  const logoSrc = partner.logoUrl && partner.logoUrl.startsWith("http")
    ? partner.logoUrl
    : `${apiBase}${partner.logoUrl}`;

  return (
    <div
      style={{
        background: "white",
        borderRadius: 16,
        padding: 28,
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.12)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.06)"; }}
    >
      <div
        style={{
          width: "100%",
          height: 140,
          borderRadius: 10,
          overflow: "hidden",
          background: ASH,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={logoSrc}
          alt={partner.name}
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", padding: 8 }}
        />
      </div>
      <div>
        <div style={{ color: NAVY, fontWeight: 800, fontSize: 17, marginBottom: 6 }}>{partner.name}</div>
        {partner.description && (
          <p style={{ color: "#4a5568", fontSize: 14, lineHeight: 1.6, margin: "0 0 10px" }}>{partner.description}</p>
        )}
        {partner.websiteUrl && (
          <a
            href={partner.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: GOLD, fontWeight: 700, fontSize: 13, textDecoration: "none" }}
          >
            Visit Website →
          </a>
        )}
      </div>
    </div>
  );
}
