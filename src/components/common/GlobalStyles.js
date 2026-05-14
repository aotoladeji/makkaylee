export default function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Segoe UI', -apple-system, sans-serif; }
      button { font-family: inherit; }
      input, select, textarea { font-family: inherit; }
      input:focus, select:focus, textarea:focus { border-color: #0D1B3E !important; box-shadow: 0 0 0 3px rgba(13,27,62,0.1); }

      .mobile-menu { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
      .mobile-menu.open { max-height: 400px; }

      @media (max-width: 768px) {
        .desktop-nav { display: none !important; }
        .mobile-menu-btn { display: block !important; }
        .hero-stats { display: none !important; }
        .about-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        .program-row { grid-template-columns: 1fr !important; direction: ltr !important; }
        .form-grid { grid-template-columns: 1fr !important; }
        .dashboard-grid { grid-template-columns: 1fr !important; }
        .footer-grid { grid-template-columns: 1fr 1fr !important; }
        .mobile-menu.open { max-height: 500px !important; }
      }
      @media (max-width: 480px) {
        .footer-grid { grid-template-columns: 1fr !important; }
      }
    `}</style>
  );
}

