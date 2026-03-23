import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

const FONT = '"Circular Std", "Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const NAV_ITEMS = [
  { label: "Project Overview",        to: "/employer/dashboard",    icon: "home" },
  { label: "Deploy Job",              to: "/employer/post-job",     icon: "plus" },
  { label: "Database (Applications)", to: "/employer/applications", icon: "list" },
  { label: "Analytics",               to: "/employer/analytics",    icon: "chart" },
  { label: "Billing",                 to: "/employer/billing",      icon: "card" },
  { label: "Settings",                to: "/employer/profile",      icon: "gear" },
];

const ICONS = {
  home: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  plus: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  list: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
  chart: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  card: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  gear: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  bell: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
};

export default function EmployerSidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { employerProfile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handler = () => {
      try {
        const count = parseInt(localStorage.getItem("vt_notif_unread_count") || "0", 10);
        setUnreadCount(isNaN(count) ? 0 : count);
      } catch { setUnreadCount(0); }
    };
    window.addEventListener("vt_notif_update", handler);
    handler();
    return () => window.removeEventListener("vt_notif_update", handler);
  }, []);

  const profile = employerProfile;

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/employer/login");
    } catch (err) { console.error("Sign out failed:", err); }
  };

  return (
    <div style={s.sidebar}>

      {/* Header — logo + plan */}
      <div style={s.sidebarHeader}>
        <div style={s.projectSelector}>
          <div style={s.logoMark}>V</div>
          <div style={s.projectInfo}>
            <div style={s.logoText}>Vetted</div>
            <div style={s.logoSub}>Spark Plan</div>
          </div>
          <div style={s.dropdownArrow}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={s.nav}>
        <div style={s.navSectionTitle}>Develop</div>
        {NAV_ITEMS.map(item => (
          <button
            key={item.to}
            onClick={() => navigate(item.to)}
            style={{ ...s.navBtn, ...(pathname === item.to ? s.navBtnActive : {}) }}
          >
            <span style={{ ...s.navIcon, ...(pathname === item.to ? s.navIconActive : {}) }}>
              {ICONS[item.icon]}
            </span>
            <span style={s.navLabel}>{item.label}</span>
          </button>
        ))}

        {/* Notifications — border-top separator */}
        <div style={s.navSeparator}>
          <button
            onClick={() => navigate("/employer/notifications")}
            style={{ ...s.navBtn, ...(pathname === "/employer/notifications" ? s.navBtnActive : {}) }}
          >
            <span style={{ ...s.navIcon, ...(pathname === "/employer/notifications" ? s.navIconActive : {}) }}>
              {ICONS.bell}
            </span>
            <span style={s.navLabel}>Notifications</span>
            {unreadCount > 0 && (
              <span style={s.navBadge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
            )}
          </button>
        </div>
      </nav>

      {/* Profile chip + Sign Out */}
      <div style={s.sidebarBottom}>
        <div style={s.profileChip}>
          <div style={s.profileAvatarWrap}>
            {profile?.logoUrl
              ? <img src={profile.logoUrl} alt={profile.companyName} style={s.profileLogoImg} />
              : <div style={s.profileAvatar}>{profile?.companyName?.[0] || "E"}</div>
            }
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={s.profileName}>{profile?.companyName || "Employer"}</div>
            <div style={s.profileEmail}>Admin Access</div>
          </div>
        </div>
        <button onClick={handleSignOut} style={s.signOutBtn}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign Out
        </button>
      </div>

    </div>
  );
}

const s = {
  sidebar:          { width: "256px", flexShrink: 0, height: "100%", background: "#ffffff", borderRight: "1px solid #e3e3e3", display: "flex", flexDirection: "column", zIndex: 10, fontFamily: FONT },
  sidebarHeader:    { padding: "16px 20px", borderBottom: "1px solid #e3e3e3" },
  projectSelector:  { display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", padding: "8px", borderRadius: "8px" },
  logoMark:         { width: "32px", height: "32px", borderRadius: "6px", background: "#ffca28", color: "#d84315", fontWeight: "700", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT },
  projectInfo:      { flex: 1, overflow: "hidden" },
  logoText:         { color: "#202124", fontWeight: "600", fontSize: "14px", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", fontFamily: FONT },
  logoSub:          { color: "#5f6368", fontSize: "12px", fontWeight: "500", fontFamily: FONT },
  dropdownArrow:    { color: "#5f6368" },
  nav:              { display: "flex", flexDirection: "column", gap: "2px", flex: 1, padding: "16px 12px", overflowY: "auto" },
  navSectionTitle:  { color: "#5f6368", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", padding: "0 12px", marginBottom: "8px", marginTop: "8px", fontFamily: FONT },
  navBtn:           { background: "none", border: "none", color: "#3c4043", fontSize: "13px", fontWeight: "500", padding: "10px 12px", borderRadius: "6px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "12px", transition: "all 0.15s", fontFamily: FONT, width: "100%" },
  navBtnActive:     { background: "#e3f2fd", color: "#1967d2", fontWeight: "600" },
  navIcon:          { color: "#5f6368", display: "flex", alignItems: "center", justifyContent: "center", width: "20px", flexShrink: 0 },
  navIconActive:    { color: "#1967d2" },
  navLabel:         { flex: 1, fontFamily: FONT },
  navBadge:         { background: "#1a73e8", color: "#ffffff", borderRadius: "10px", padding: "1px 7px", fontSize: "11px", fontWeight: "600", flexShrink: 0, fontFamily: FONT },
  navSeparator:     { borderTop: "1px solid #e3e3e3", marginTop: "8px", paddingTop: "8px" },
  sidebarBottom:    { borderTop: "1px solid #e3e3e3", padding: "16px", background: "#f8f9fa" },
  profileChip:      { display: "flex", alignItems: "center", gap: "10px" },
  profileAvatarWrap:{ width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "1px solid #dadce0" },
  profileAvatar:    { width: "100%", height: "100%", background: "#1a73e8", color: "#ffffff", fontWeight: "600", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT },
  profileLogoImg:   { width: "100%", height: "100%", objectFit: "cover" },
  profileName:      { color: "#202124", fontSize: "15px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: FONT },
  profileEmail:     { color: "#5f6368", fontSize: "14px", fontFamily: FONT },
  signOutBtn:       { marginTop: "10px", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", background: "#ffffff", border: "1px solid #dadce0", color: "#5f6368", borderRadius: "50px", padding: "9px", fontSize: "14px", fontWeight: "500", cursor: "pointer", fontFamily: FONT, transition: "all 0.15s" },
};