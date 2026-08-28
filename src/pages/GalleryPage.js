import { useEffect, useState } from "react";
import { API } from "../constants/api";
import { ASH, NAVY } from "../constants/theme";

const apiBase = API.replace("/api", "");

function getYouTubeEmbedUrl(url) {
  const watchMatch = url.match(/youtube\.com\/watch\?(?:.*&)?v=([^&]+)/);
  if (watchMatch) return "https://www.youtube.com/embed/" + watchMatch[1];
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return "https://www.youtube.com/embed/" + shortMatch[1];
  if (url.includes("youtube.com/embed/")) return url;
  return url;
}

function toMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return apiBase + url;
}

const fallbackGalleryItems = [
  { id: "fallback-hero", mediaUrl: "/hero.jpg", mediaType: "image", title: "Weekend Training Session", caption: "High-energy drills and tactical play from our latest weekend camp." },
  { id: "fallback-kid", mediaUrl: "/kid.png", mediaType: "image", title: "Player Development", caption: "Focused coaching to help every child build confidence and technique." },
  { id: "fallback-logo", mediaUrl: "/logo.png", mediaType: "image", title: "MakkayLee Identity", caption: "Our academy culture is built on discipline, growth, and teamwork." },
];

export default function GalleryPage({ setPage }) {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadGallery = async () => {
    setLoading(true);
    try {
      const response = await fetch(API + "/gallery");
      const data = await response.json();
      if (!response.ok) {
        console.error('Gallery fetch error:', data);
        setGalleryItems(fallbackGalleryItems);
        setLoading(false);
        return;
      }
      
      // Use API data if available and non-empty, otherwise use fallback
      if (Array.isArray(data.data) && data.data.length > 0) {
        setGalleryItems(data.data);
      } else {
        setGalleryItems(fallbackGalleryItems);
      }
    } catch (err) {
      console.error('Gallery load error:', err);
      setGalleryItems(fallbackGalleryItems);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
    
    // Refetch gallery every 5 seconds to catch admin uploads
    const interval = setInterval(loadGallery, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ paddingTop: 70, background: ASH, minHeight: "100vh" }}>
      <div style={{ position: "relative", background: "url('/hero.jpg') center/cover no-repeat", padding: "48px 24px", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(13,27,62,0.9), rgba(26,49,104,0.78))" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <p style={{ color: "rgba(255,255,255,0.72)", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 8px", fontSize: 12 }}>
            Match Moments and Training Highlights
          </p>
          <h1 style={{ color: "white", fontFamily: "Playfair Display, Georgia, serif", fontSize: "clamp(28px, 4vw, 44px)", margin: 0 }}>
            Academy Gallery
          </h1>
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px 56px" }}>
        {loading && galleryItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>
            <p>Loading gallery...</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
            {galleryItems.map((item) => (
            <article key={item.id || item.mediaUrl || item.title} style={{ background: "white", borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
              <div style={{ height: 220, background: "#DDE2ED" }}>
                {item.mimeType === "youtube" ? (
                  <iframe
                    src={getYouTubeEmbedUrl(item.mediaUrl)}
                    title={item.title}
                    style={{ width: "100%", height: "100%", border: "none" }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : item.mediaType === "video" ? (
                  <video src={toMediaUrl(item.mediaUrl)} controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <img src={toMediaUrl(item.mediaUrl)} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </div>
              <div style={{ padding: 18 }}>
                <h3 style={{ color: NAVY, margin: "0 0 8px", fontSize: 18, fontWeight: 800 }}>{item.title}</h3>
                <p style={{ margin: 0, color: "#4A4A4A", lineHeight: 1.6, fontSize: 14 }}>{item.caption}</p>
              </div>
            </article>
          ))}
          </div>
        )}
        <div style={{ marginTop: 30, display: "flex", justifyContent: "center" }}>
          <button onClick={() => setPage("Programs")} style={{ background: NAVY, color: "white", border: "none", padding: "12px 24px", borderRadius: 8, fontWeight: 800, cursor: "pointer" }}>
            View Programs
          </button>
        </div>
      </div>
    </div>
  );
}