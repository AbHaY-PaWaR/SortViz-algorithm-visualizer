import { Link } from "react-router-dom";

export default function Navbar({
  theme,
  darkMode,
  onToggleTheme,
  showAction = false,
  actionLabel = "Launch App",
  onAction,
  hideActionOnMobile = false,
}) {
  return (
    <div
      className="sv-navbar"
      style={{
        background: theme.surface,
        borderBottom: `1px solid ${theme.border}`,
        padding: "0 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 56,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <style>{`
        .sv-navbar-logo { display: flex; align-items: center; gap: 10px; }
        .sv-navbar-icon { width: 30px; height: 30px; flex: 0 0 30px; }
        .sv-navbar-title { font-size: 17px; }
        .sv-navbar-actions { display: flex; align-items: center; gap: 8px; }
        .sv-navbar-action { padding: 7px 14px; font-size: 12px; }
        .sv-navbar-toggle { background: none; border-radius: 8px; padding: 6px 14px; cursor: pointer; font-size: 13px; font-family: inherit; }
        @media (max-width: 768px) {
          .sv-navbar {  height: auto; padding: 10px 14px; gap: 8px; }
          .sv-navbar-logo { width: 100%; }
          .sv-navbar-icon { width: 26px; height: 26px; flex: 0 0 26px; }
          .sv-navbar-title { font-size: 16px; }
          .sv-navbar-actions { width: 100%; justify-content: flex-end; }
          .sv-navbar-tagline { font-size: 5 ; }
          .sv-navbar-action.hide-on-mobile { display: none; }
        }
      `}</style>

      <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
        <div className="sv-navbar-logo">
          <div
            className="sv-navbar-icon"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 16 }}>{"\u2b06"}</span>
          </div>
          <span
            className="sv-navbar-title"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              cursor: "pointer",
            }}
          >
            SortViz
          </span>
          <span className="sv-navbar-tagline" style={{ color: theme.textMuted, fontSize: 12, marginLeft: 2 }}>
            -algorithm visualizer
          </span>
        </div>
      </Link>

      <div className="sv-navbar-actions">
        <button
          className="sv-navbar-toggle"
          onClick={onToggleTheme}
          style={{ border: `1px solid ${theme.border}`, color: theme.text }}
        >
          {darkMode ? `${"\u2600"} Light` : `${"\u263e"} Dark`}
        </button>
        {showAction && (
          <button
            className={`hp-cta sv-navbar-action${hideActionOnMobile ? " hide-on-mobile" : ""}`}
            onClick={onAction}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
