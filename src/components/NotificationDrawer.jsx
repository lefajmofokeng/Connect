import { useState, useEffect, useRef } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";

/**
 * NotificationDrawer
 *
 * Usage in any portal page sidebar:
 *   import NotificationDrawer from "../../components/NotificationDrawer";
 *   <NotificationDrawer userId={user?.uid} jobs={jobs} applications={applications} />
 *
 * Pass `jobs` and `applications` if you've already fetched them on that page.
 * If not, the component fetches them itself using `userId`.
 */
export default function NotificationDrawer({ userId, jobs = null, applications = null }) {
  const [open, setOpen]             = useState(false);
  const [notifications, setNotifs]  = useState([]);
  const [readIds, setReadIds]       = useState(() => {
    try { return JSON.parse(localStorage.getItem("vt_notif_read") || "[]"); }
    catch { return []; }
  });
  const drawerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Build notifications whenever data changes
  useEffect(() => {
    if (!userId) return;
    if (jobs !== null && applications !== null) {
      buildNotifications(jobs, applications);
    } else {
      fetchAndBuild();
    }
  }, [userId, jobs, applications]);

  const fetchAndBuild = async () => {
    try {
      const [jobSnap, appSnap] = await Promise.all([
        getDocs(query(collection(db, "jobs"), where("employerId", "==", userId))),
        getDocs(query(collection(db, "applications"), where("employerId", "==", userId))),
      ]);
      buildNotifications(
        jobSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        appSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      );
    } catch (err) { console.error("Notifications fetch error:", err); }
  };

  const buildNotifications = (jobList, appList) => {
    const notifs = [];
    const now = new Date();

    // ── 1. New applications (status === "new") ──────────────────────
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
      });
    }

    // ── 2. Application status changes — shortlisted ─────────────────
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
      });
    }

    // ── 3. Jobs closing within 3 days ───────────────────────────────
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
      });
    });

    // ── 4. Expired jobs ─────────────────────────────────────────────
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
      });
    }

    // ── 5. Payment due reminder ─────────────────────────────────────
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
        });
      }
    }

    // ── 6. New applicant viewed profile (placeholder — future feature) ─
    // This would require a views collection. For now we show a welcome tip
    // if employer has no applications yet.
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
      });
    }

    setNotifs(notifs);
  };

  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

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

  return (
    <div ref={drawerRef} style={{ position: "relative" }}>

      {/* ── Bell button ── */}
      <button
        style={s.bellBtn}
        onClick={() => { setOpen(o => !o); }}
        title="Notifications"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span style={s.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {/* ── Drawer ── */}
      {open && (
        <div style={s.drawer}>

          {/* Header */}
          <div style={s.drawerHead}>
            <div>
              <div style={s.drawerTitle}>Notifications</div>
              {unreadCount > 0 && (
                <div style={s.drawerSub}>{unreadCount} unread</div>
              )}
            </div>
            {unreadCount > 0 && (
              <button style={s.markAllBtn} onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={s.drawerList}>
            {notifications.length === 0 ? (
              <div style={s.emptyNotif}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dadce0" strokeWidth="1.5" style={{ marginBottom: 8 }}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <span>You're all caught up</span>
              </div>
            ) : (
              notifications.map(notif => {
                const isUnread = !readIds.includes(notif.id);
                return (
                  <div
                    key={notif.id}
                    style={{ ...s.notifRow, ...(isUnread ? s.notifRowUnread : {}) }}
                    onClick={() => markRead(notif.id)}
                  >
                    {/* Unread dot */}
                    {isUnread && <div style={s.unreadDot} />}

                    {/* Icon */}
                    <div style={{ ...s.notifIcon, background: notif.bg }}>
                      <span style={{ fontSize: "14px" }}>{notif.icon}</span>
                    </div>

                    {/* Content */}
                    <div style={s.notifContent}>
                      <div style={s.notifTitle}>{notif.title}</div>
                      <div style={s.notifBody}>{notif.body}</div>
                      <div style={s.notifFooter}>
                        {notif.time && (
                          <span style={s.notifTime}>{formatTime(notif.time)}</span>
                        )}
                        {notif.action && (
                          <a href={notif.action} style={{ ...s.notifAction, color: notif.color }}>
                            {notif.actionLabel} →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={s.drawerFoot}>
              <a href="/employer/notifications" style={s.viewAllBtn}>
                View all activity
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Utility functions ─────────────────────────────────────────────────

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
  if (diff < 60)        return "Just now";
  if (diff < 3600)      return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)     return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800)    return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

function parseSADate(str) {
  // Handles formats like "31/12/2024" or "2024-12-31"
  if (!str) return null;
  if (str.includes("/")) {
    const [d, m, y] = str.split("/");
    return new Date(y, m - 1, d);
  }
  return new Date(str);
}

// ── Styles ────────────────────────────────────────────────────────────
const s = {
  // ── Bell button ──
  bellBtn: {
    position: "relative",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "6px",
    color: "#5f6368",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s",
    width: "100%",
  },
  badge: {
    position: "absolute",
    top: "4px",
    right: "4px",
    background: "#d93025",
    color: "#ffffff",
    borderRadius: "10px",
    fontSize: "9px",
    fontWeight: "700",
    padding: "1px 5px",
    lineHeight: "14px",
    minWidth: "14px",
    textAlign: "center",
  },

  // ── Drawer ──
  drawer: {
    position: "absolute",
    left: "calc(100% + 12px)",
    bottom: "0",
    width: "340px",
    background: "#ffffff",
    border: "1px solid #e3e3e3",
    borderRadius: "8px",
    boxShadow: "0 8px 24px rgba(60,64,67,0.16)",
    zIndex: 200,
    display: "flex",
    flexDirection: "column",
    maxHeight: "520px",
    overflow: "hidden",
    fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  drawerHead: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: "16px 18px 12px",
    borderBottom: "1px solid #e3e3e3",
    flexShrink: 0,
  },
  drawerTitle: { color: "#202124", fontSize: "14px", fontWeight: "600" },
  drawerSub: { color: "#9aa0a6", fontSize: "12px", marginTop: "1px" },
  markAllBtn: {
    background: "none",
    border: "none",
    color: "#1a73e8",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "2px 0",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  },

  // ── Notification list ──
  drawerList: {
    overflowY: "auto",
    flex: 1,
  },
  emptyNotif: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 24px",
    color: "#9aa0a6",
    fontSize: "13px",
    gap: "0",
  },

  notifRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "14px 18px",
    borderBottom: "1px solid #f1f3f4",
    cursor: "pointer",
    transition: "background 0.12s",
    position: "relative",
  },
  notifRowUnread: {
    background: "#fafcff",
  },
  unreadDot: {
    position: "absolute",
    top: "18px",
    left: "6px",
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#1a73e8",
    flexShrink: 0,
  },
  notifIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  notifContent: { flex: 1, minWidth: 0 },
  notifTitle: { color: "#202124", fontSize: "13px", fontWeight: "600", marginBottom: "2px", lineHeight: "1.4" },
  notifBody: { color: "#5f6368", fontSize: "12px", lineHeight: "1.5", marginBottom: "6px" },
  notifFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" },
  notifTime: { color: "#9aa0a6", fontSize: "11px" },
  notifAction: { fontSize: "12px", fontWeight: "600", textDecoration: "none" },

  // ── Drawer footer ──
  drawerFoot: {
    padding: "10px 18px",
    borderTop: "1px solid #e3e3e3",
    flexShrink: 0,
  },
  viewAllBtn: {
    display: "block",
    textAlign: "center",
    color: "#5f6368",
    fontSize: "12px",
    fontWeight: "600",
    textDecoration: "none",
    padding: "4px 0",
  },
};