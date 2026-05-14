import { useEffect, useState } from "react";
import { API } from "../constants/api";
import { ASH, NAVY } from "../constants/theme";

const fallbackGalleryItems = [
  {
    id: "fallback-hero",
    mediaUrl: "/hero.jpg",
    mediaType: "image",
    title: "Weekend Training Session",
    caption: "High-energy drills and tactical play from our latest weekend camp.",
  },
  {
    id: "fallback-kid",
    mediaUrl: "/kid.png",
    mediaType: "image",
    title: "Player Development",
    caption: "Focused coaching to help every child build confidence and technique.",
  },
  {
    id: "fallback-logo",
    mediaUrl: "/logo.png",
    mediaType: "image",
    title: "MakkayLee Identity",
    caption: "Our academy culture is built on discipline, growth, and teamwork.",
  },
];

export default function GalleryPage({ setPage }) {
  const [galleryItems, setGalleryItems] = useState(fallbackGalleryItems);

  useEffect(() => {
    const loadGallery = async () => {
      try {
        const response = await fetch(`${API}/gallery`);
        const data = await response.json();

        if (!response.ok || !Array.isArray(data.data) || data.data.length === 0) return;
        setGalleryItems(data.data);
      } catch {
        // Keep fallback media when backend is not reachable.
      }
    };

    loadGallery();
  }, []);

  return (
    <div style={{ paddingTop: 70, background: ASH, minHeight: "100vh" }}>
      <div style={{ background: `linear-gradient(135deg, ${NAVY}, #1a3168)`, padding: "48px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ color: "rgba(255,255,255,0.72)", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 8px", fontSize: 12 }}>
            Match Moments and Training Highlights
          </p>
          <h1 style={{ color: "white", fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(28px, 4vw, 44px)", margin: 0 }}>
            Academy Gallery
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px 56px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          {galleryItems.map((item) => (
            <article key={item.id || item.mediaUrl || item.title} style={{ background: "white", borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
              <div style={{ height: 220, background: "#DDE2ED" }}>
                {item.mediaType === "video" ? (
                  <video src={item.mediaUrl} cont