import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import NotificationDrawer from "../../components/NotificationDrawer";

export default function Notifications() {
  const { user, employerProfile } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [readIds, setReadIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem("vt_notif_read") || "[]"); }
    catch { return []; }
  });

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobSnap, appSnap] = await Promise.all([
        getDocs(query(collection(db, "jobs"), where("employerId", "==", user.uid))),
        getDocs(query(collection(db, "applications"), where("employerId", "==", user.uid))),
      ]);
      const jobList = jobSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const appList = appSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setJobs(jobList);
      setApplications(appList);
      setNotifications(buildNotifications(jobList, appList));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // ── Same buildNotifications logic as the drawer ────────────────────
  const buildNotifications = (jobList, appList) => {
    const notifs = [];
    const now = new Date();

    const newApps = appList.filter(a => a.status === "new");
    if (newApps.length > 0) {
      notifs.push({
        id: "new-apps",
        type: "application",
        icon: "📥",
        color: "#1a73e8",
        bg: "#e3f2fd",
        title: `${newApps.length} unreviewed application${newApps.length !== 1 ? "s" : ""}`,
        body: `You have ${newApps.length} new application${newApps.length !== 1 ? "s" : ""} waiting for review.`,
        action: "/employer/applications",
        actionLabel: "Review now",
        time: getLatestDate(newApps),
        category: "application",
      });
    }

    const shortlisted = appList.filter(a => a.status === "shortlisted");
    if (shortlisted.length > 0) {
      notifs.push({
        id: "shortlisted",
        type: "status",
        icon: "⭐",
        color: "#0d652d",
        bg: "#e6f4ea",
        title: `${shortlisted.length} candidate${shortlisted.length !== 1 ? "s" : ""} shortlisted`,
        body: `${shortlisted.length} applicant${shortlisted.length !== 1 ? "s have" : " has"} been shortlisted across your listings.`,
        action: "/employer/applications",
        actionLabel: "View pipeline",
        time: getLatestDate(shortlisted),
        category: "application",
      });
    }

    const closingSoon = jobList.filter(job => {
      if (job.status !== "live" || !job.closes) return false;
      const closes = parseSADate(job.closes);
      if (!closes) return false;
      const diffDays = (closes - now) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 3;
    });
    closingSoon.forEach(job => {
      const closes = parseSADate(job.closes);
      const diffDays = Math.ceil((closes - now) / (1000 * 60 * 60 * 24));
      notifs.push({
        id: `closing-${job.id}`,
        type: "closing",
        icon: "⏰",
        color: "#ea8600",
        bg: "#fef7e0",
        title: `"${job.title}" closes ${diffDays === 0 ? "today" : `in ${diffDays} day${diffDays !== 1 ? "s" : ""}`}`,
        body: `This listing closes on ${job.closes}. Extend or close it from your dashboard.`,
        action: "/employer/dashboard",
        actionLabel: "Manage listing",
        time: null,
        category: "listing",
      });
    });

    const expired = jobList.filter(j => j.status === "expired");
    if (expired.length > 0) {
      notifs.push({
        id: "expired-jobs",
        type: "expired",
        icon: "🔴",
        color: "#c5221f",
        bg: "#fce8e6",
        title: `${expired.length} listing${expired.length !== 1 ? "s" : ""} expired`,
        body: `${expired.length} job${expired.length !== 1 ? "s have" : " has"} expired and are no longer visible to job seekers.`,
        action: "/employer/dashboard",
        actionLabel: "Review listings",
        time: null,
        category: "listing",
      });
    }

    const liveJobs = jobList.filter(j => j.status === "live");
    if (liveJobs.length > 0) {
      const dueDate = new Date(now.getFullYear(), now.getMonth(), 15);
      if (now.getDate() > 15) dueDate.setMonth(dueDate.getMonth() + 1);
      const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 7) {
        const amount = liveJobs.length * 450;
        notifs.push({
          id: "payment-due",
          type: "billing",
          icon: "💳",
          color: "#1967d2",
          bg: "#e3f2fd",
          title: `Payment of R${amount.toLocaleString("en-ZA")} due in ${daysUntilDue} day${daysUntilDue !== 1 ? "s" : ""}`,
          body: `${liveJobs.length} active listing${liveJobs.length !== 1 ? "s" : ""} × R450. Use your email as payment reference.`,
          action: "/employer/billing",
          actionLabel: "View invoice",
          time: null,
          category: "billing",
        });
      }
    }

    if (appList.length === 0 && jobList.length > 0) {
      notifs.push({
        id: "tip-profile",
        type: "tip",
        icon: "💡",
        color: "#5f6368",
        bg: "#f1f3f4",
        title: "Tip: Complete your company profile",
        body: "Employers with a complete profile and logo get more qualified applicants.",
        action: "/employer/profile",
        actionLabel: "Update profile",
        time: null,
        category: "tip",
      });
    }

    return notifs;
  };

  const markAllRead = () => {
    const allIds = notifications.map(n => n.id);
    localStorage.setItem("vt_notif_read", JSON.stringify(allIds));
    setReadIds(allIds);
  };

  const markRead = (id) => {
    const updated = [...new Set([...readIds, id])];
    localStorage.setItem("vt_notif_read", JSON.stringify(updated));
    setReadIds(updated);
  };

  // ── Filter tabs ────────────────────────────────────────────────────
  const TABS = [
    { key: "all",         label: "All" },
    { key: "application", label: "Applications" },
    { key: "listing",     label: "Listings" },
    { key: "billing",     label: "Billing" },
    { key: "tip",         label: "Tips" },
  ];

  const filtered = filter === "all"
    ? notifications
    : notifications.filter(n => n.category === filter);

  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

  if (loading) return (
    <div style={s.page}>
      <Sidebar profile={employerProfile} userId={user?.uid} jobs={jobs} applications={applications} />
      <div style={s.mainWrapper}>
        <div style={s.mainInner}>
          <div style={s.empty}>Loading notifications...</div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <Sidebar profile={employerProfile} userId={user?.uid} jobs={jobs} applications={applications} />

      <div style={s.mainWrapper}>
        <div style={s.mainInner}>

          {/* Topbar */}
          <div style={s.topbar}>
            <div>
              <h1 style={s.pageTitle}>Notifications</h1>
              <p style={s.pageSub}>
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                  : "You're all caught up"
                }
              </p>
            </div>
            {unreadCount > 0 && (
              <button style={s.markAllBtn} onClick={markAllRead}>
                Mark all as read
              </button>
            )}
          </div>

          {/* Tab bar */}
          <div style={s.tabBar}>
            {TABS.map(tab => {
              const count = tab.key === "all"
                ? notifications.length
                : notifications.filter(n => n.category === tab.key).length;
              const isActive = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  style={{ ...s.tabBtn, ...(isActive ? s.tabBtnActive : {}) }}
                  onClick={() => setFilter(tab.key)}
                >
                  {tab.label}
                  {count > 0 && (
                    <span style={{ ...s.tabCount, ...(isActive ? s.tabCountActive : {}) }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Notifications list */}
          {filtered.length === 0 ? (
            <div style={s.emptyCard}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#dadce0" strokeWidth="1.5" style={{ marginBottom: 12 }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <div style={s.emptyTitle}>No notifications here</div>
              <div style={s.emptySub}>
                {filter === "all" ? "Everything is running smoothly." : `No ${filter} notifications right now.`}
              </div>
            </div>
          ) : (
            <div style={s.notifList}>
              {filtered.map(notif => {
                const isUnread = !readIds.includes(notif.id);
                return (
                  <div
                    key={notif.id}
                    style={{ ...s.notifCard, ...(isUnread ? s.notifCardUnread : {}) }}
                    onClick={() => markRead(notif.id)}
                  >
                    {/* Unread indicator */}
                    {isUnread && <div style={s.unreadBar} />}

                    {/* Icon */}
                    <div style={{ ...s.notifIcon, background: notif.bg }}>
                      <span style={{ fontSize: "18px" }}>{notif.icon}</span>
                    </div>

                    {/* Content */}
                    <div style={s.notifContent}>
                      <div style={s.notifHeader}>
                        <div style={s.notifTitle}>{notif.title}</div>
                        {notif.time && (
                          <span style={s.notifTime}>{formatTime(notif.time)}</span>
                        )}
                      </div>
                      <div style={s.notifBody}>{notif.body}</div>
                      {notif.action && (
                        <a
                          href={notif.action}
                          style={{ ...s.notifAction, color: notif.color }}
                          onClick={e => { e.stopPropagation(); markRead(notif.id); }}
                        >
                          {notif.actionLabel} →
                        </a>
                      )}
                    </div>

                    {/* Unread dot on right */}
                    {isUnread && (
                      <div style={s.unreadDot} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────
function Sidebar({ profile, userId, jobs, applications }) {
  const navigate = useNavigate();
  const path = window.location.pathname;
  const navItems = [
    { label: "Project Overview",        to: "/employer/dashboard",    icon: "⌂" },
    { label: "Deploy Job",              to: "/employer/post-job",     icon: "+" },
    { label: "Database (Applications)", to: "/employer/applications", icon: "≡" },
    { label: "Analytics",               to: "/employer/analytics",    icon: "📊" },
    { label: "Billing",                 to: "/employer/billing",      icon: "💳" },
    { label: "Settings",                to: "/employer/profile",      icon: "⚙" },
  ];
  return (
    <div style={s.sidebar}>
      <div style={s.sidebarHeader}>
        <div style={s.projectSelector}>
          <div style={s.logoMark}>V</div>
          <div style={s.projectInfo}>
            <div style={s.logoText}>Vetted</div>
            <div style={s.logoSub}>Spark Plan</div>
          </div>
          <div style={s.dropdownArrow}>▾</div>
        </div>
      </div>
      <nav style={s.nav}>
        <div style={s.navSectionTitle}>Develop</div>
        {navItems.map(item => (
          <button
            key={item.to}
            onClick={() => navigate(item.to)}
            style={{ ...s.navBtn, ...(path === item.to ? s.navBtnActive : {}) }}
          >
            <span style={{ ...s.navIcon, ...(path === item.to ? s.navIconActive : {}) }}>
              {item.icon}
            </span>
            <span style={s.navLabel}>{item.label}</span>
          </button>
        ))}
      </nav>
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
        <div style={{ marginBottom: "8px" }}>
          <NotificationDrawer userId={userId} jobs={jobs} applications={applications} />
        </div>
      </div>
    </div>
  );
}

// ── Utilities ─────────────────────────────────────────────────────────
function getLatestDate(items) {
  const dates = items
    .map(i => i.createdAt?.toDate?.())
    .filter(Boolean)
    .sort((a, b) => b - a);
  return dates[0] || null;
}

function formatTime(date) {
  if (!date) return "";
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60)     return "Just now";
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

function parseSADate(str) {
  if (!str) return null;
  if (str.includes("/")) {
    const [d, m, y] = str.split("/");
    return new Date(y, m - 1, d);
  }
  return new Date(str);
}

// ── Styles ────────────────────────────────────────────────────────────
const s = {
  page: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    background: "#f4f5f7",
    fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  // ── Sidebar ──
  sidebar: { width: "256px", flexShrink: 0, height: "100%", background: "#ffffff", borderRight: "1px solid #e3e3e3", display: "flex", flexDirection: "column", zIndex: 10 },
  sidebarHeader: { padding: "16px 20px", borderBottom: "1px solid #e3e3e3" },
  projectSelector: { display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", padding: "8px", borderRadius: "8px", transition: "background 0.2s" },
  logoMark: { width: "32px", height: "32px", borderRadius: "6px", background: "#ffca28", color: "#d84315", fontWeight: "700", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" },
  projectInfo: { flex: 1, overflow: "hidden" },
  logoText: { color: "#202124", fontWeight: "600", fontSize: "14px", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" },
  logoSub: { color: "#5f6368", fontSize: "12px", fontWeight: "500" },
  dropdownArrow: { color: "#5f6368", fontSize: "12px" },
  nav: { display: "flex", flexDirection: "column", gap: "2px", flex: 1, padding: "16px 12px", overflowY: "auto" },
  navSectionTitle: { color: "#5f6368", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", padding: "0 12px", marginBottom: "8px", marginTop: "8px" },
  navBtn: { background: "none", border: "none", color: "#3c4043", fontSize: "13px", fontWeight: "500", padding: "10px 12px", borderRadius: "6px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "12px", transition: "all 0.15s" },
  navBtnActive: { background: "#e3f2fd", color: "#1967d2", fontWeight: "600" },
  navIcon: { fontSize: "18px", color: "#5f6368", display: "flex", alignItems: "center", justifyContent: "center", width: "24px" },
  navIconActive: { color: "#1967d2" },
  navLabel: { flex: 1 },
  sidebarBottom: { borderTop: "1px solid #e3e3e3", padding: "16px", background: "#f8f9fa" },
  profileChip: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" },
  profileAvatarWrap: { width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "1px solid #dadce0" },
  profileAvatar: { width: "100%", height: "100%", background: "#1a73e8", color: "#ffffff", fontWeight: "600", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" },
  profileLogoImg: { width: "100%", height: "100%", objectFit: "cover", background: "#ffffff" },
  profileName: { color: "#202124", fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  profileEmail: { color: "#5f6368", fontSize: "12px" },

  // ── Main ──
  mainWrapper: { flex: 1, height: "100%", overflowY: "auto", position: "relative" },
  mainInner: { padding: "32px 48px", maxWidth: "900px", margin: "0 auto" },
  topbar: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", gap: "16px" },
  pageTitle: { color: "#202124", fontSize: "24px", fontWeight: "600", margin: "0 0 4px", letterSpacing: "-0.5px" },
  pageSub: { color: "#5f6368", fontSize: "14px", margin: 0 },
  markAllBtn: { background: "#ffffff", border: "1px solid #dadce0", color: "#1a73e8", borderRadius: "4px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" },
  empty: { color: "#5f6368", padding: "48px", textAlign: "center", fontSize: "14px", fontWeight: "500" },

  // ── Tab bar ──
  tabBar: { display: "flex", alignItems: "center", borderBottom: "1px solid #e3e3e3", marginBottom: "24px", gap: "0", background: "#ffffff", borderRadius: "8px 8px 0 0", padding: "0 8px" },
  tabBtn: { display: "inline-flex", alignItems: "center", gap: "6px", background: "none", border: "none", borderBottom: "2px solid transparent", color: "#5f6368", fontSize: "13px", fontWeight: "500", padding: "12px 16px", cursor: "pointer", transition: "color 0.15s", marginBottom: "-1px", fontFamily: "inherit", whiteSpace: "nowrap" },
  tabBtnActive: { color: "#1967d2", borderBottom: "2px solid #1967d2", fontWeight: "600" },
  tabCount: { background: "#f1f3f4", color: "#5f6368", borderRadius: "10px", padding: "1px 7px", fontSize: "11px", fontWeight: "600" },
  tabCountActive: { background: "#e3f2fd", color: "#1967d2" },

  // ── Notification cards ──
  notifList: { display: "flex", flexDirection: "column", gap: "0", background: "#ffffff", borderRadius: "0 0 8px 8px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1), 0 1px 3px 1px rgba(60,64,67,0.05)", overflow: "hidden" },
  notifCard: { display: "flex", alignItems: "flex-start", gap: "16px", padding: "20px 24px", borderBottom: "1px solid #f1f3f4", cursor: "pointer", transition: "background 0.12s", position: "relative" },
  notifCardUnread: { background: "#fafcff" },
  unreadBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: "#1a73e8", borderRadius: "0" },
  notifIcon: { width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  notifContent: { flex: 1, minWidth: 0 },
  notifHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "4px" },
  notifTitle: { color: "#202124", fontSize: "14px", fontWeight: "600", lineHeight: "1.4" },
  notifTime: { color: "#9aa0a6", fontSize: "12px", whiteSpace: "nowrap", flexShrink: 0 },
  notifBody: { color: "#5f6368", fontSize: "13px", lineHeight: "1.6", marginBottom: "8px" },
  notifAction: { fontSize: "13px", fontWeight: "600", textDecoration: "none" },
  unreadDot: { width: "8px", height: "8px", borderRadius: "50%", background: "#1a73e8", flexShrink: 0, marginTop: "6px" },

  // ── Empty state ──
  emptyCard: { background: "#ffffff", borderRadius: "0 0 8px 8px", padding: "64px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1)" },
  emptyTitle: { color: "#202124", fontSize: "15px", fontWeight: "600", marginBottom: "6px" },
  emptySub: { color: "#5f6368", fontSize: "13px" },
};