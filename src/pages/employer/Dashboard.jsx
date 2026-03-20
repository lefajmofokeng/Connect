import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { db, auth } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";

const JOB_PRICE = 450;

function getDueDate() {
  const now = new Date();
  const due = new Date(now.getFullYear(), now.getMonth(), 15);
  if (now.getDate() > 15) {
    due.setMonth(due.getMonth() + 1);
  }
  return due.toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" });
}

export default function Dashboard() {
  const { user, employerProfile } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobSnap, appSnap] = await Promise.all([
        getDocs(query(collection(db, "jobs"), where("employerId", "==", user.uid))),
        getDocs(query(collection(db, "applications"), where("employerId", "==", user.uid))),
      ]);
      setJobs(jobSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setApplications(appSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const updateJobStatus = async (jobId, status) => {
    try {
      await updateDoc(doc(db, "jobs", jobId), { status, updatedAt: serverTimestamp() });
      setActionMsg(`Job ${status === "live" ? "published" : status}.`);
      fetchData();
    } catch (err) {
      setActionMsg("Action failed. Try again.");
    }
  };

  const deleteJob = async (jobId) => {
    if (!window.confirm("Delete this job listing? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "jobs", jobId));
      setActionMsg("Job deleted.");
      fetchData();
    } catch (err) {
      setActionMsg("Delete failed. Try again.");
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/employer/login");
  };

  const liveJobs = jobs.filter(j => j.status === "live");
  const draftJobs = jobs.filter(j => j.status === "draft");
  const newApps = applications.filter(a => a.status === "new");
  const amountPayable = liveJobs.length * JOB_PRICE;
  const dueDate = getDueDate();
  const paymentRef = user?.email || "";

  const provinceMap = {};
  applications.forEach(a => {
    if (a.city) provinceMap[a.city] = (provinceMap[a.city] || 0) + 1;
  });
  const topLocation = Object.entries(provinceMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  // Tab-filtered jobs
  const TAB_FILTERS = [
    { key: "all",     label: "All" },
    { key: "live",    label: "Live" },
    { key: "draft",   label: "Drafts" },
    { key: "paused",  label: "Paused" },
    { key: "expired", label: "Expired" },
  ];
  const filteredJobs = activeTab === "all" ? jobs : jobs.filter(j => j.status === activeTab);

  if (loading) return (
    <Layout profile={employerProfile} onSignOut={handleSignOut}>
      <div style={s.empty}>Loading data...</div>
    </Layout>
  );

  return (
    <Layout profile={employerProfile} onSignOut={handleSignOut}>

      {/* Header */}
      <div style={s.topbar}>
        <div>
          <h1 style={s.pageTitle}>Project Overview</h1>
          <p style={s.pageSub}>Welcome back, {employerProfile?.companyName || "Employer"}</p>
        </div>
        <Link to="/employer/post-job" style={s.btnPrimary}>+ Deploy Job</Link>
      </div>

      {actionMsg && (
        <div style={s.actionMsg} onClick={() => setActionMsg("")}>
          {actionMsg}
          <span style={{ cursor: "pointer", marginLeft: "8px", fontWeight: "bold" }}>✕</span>
        </div>
      )}

      {/* Stats */}
      <div style={s.statsGrid}>
        <StatCard label="Live Jobs"         value={liveJobs.length}       color="#1a73e8" />
        <StatCard label="Draft Jobs"        value={draftJobs.length}      color="#f29900" />
        <StatCard label="Total Applicants"  value={applications.length}   color="#0f9d58" />
        <StatCard label="New Applications"  value={newApps.length}        color="#d93025" />
        <StatCard label="Top Location"      value={topLocation}           color="#1a73e8" small />
      </div>

      {/* Usage & Billing */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Usage and billing</h2>
        <div style={s.invoiceCard}>
          <div style={s.invoiceLeft}>
            <div style={s.invoiceTag}>Estimated Monthly Cost</div>
            <div style={s.invoiceAmount}>R {amountPayable.toLocaleString("en-ZA")}</div>
            <div style={s.invoiceBreakdown}>
              {liveJobs.length} live job{liveJobs.length !== 1 ? "s" : ""} × R{JOB_PRICE} per listing
            </div>
            <div style={s.invoiceDue}>
              <span style={s.invoiceDueLabel}>Payment due:</span>
              <span style={s.invoiceDueDate}>{dueDate}</span>
            </div>
            {amountPayable === 0 && (
              <div style={s.invoiceZero}>No active listings this month — zero charges applied.</div>
            )}
          </div>

          <div style={s.invoiceDivider} />

          <div style={s.invoiceRight}>
            <div style={s.bankTitle}>Payment Instructions</div>
            <div style={s.bankDetailsCard}>
              <div style={s.bankRow}>
                <span style={s.bankLabel}>Bank</span>
                <span style={s.bankValue}>First National Bank (FNB)</span>
              </div>
              <div style={s.bankRow}>
                <span style={s.bankLabel}>Account Name</span>
                <span style={s.bankValue}>Vetted (Pty) Ltd</span>
              </div>
              <div style={s.bankRow}>
                <span style={s.bankLabel}>Account Number</span>
                <span style={s.bankValue}>62000000000</span>
              </div>
              <div style={s.bankRow}>
                <span style={s.bankLabel}>Branch Code</span>
                <span style={s.bankValue}>250655</span>
              </div>
              <div style={s.bankRow}>
                <span style={s.bankLabel}>Account Type</span>
                <span style={s.bankValue}>Cheque / Current</span>
              </div>
              <div style={s.refRow}>
                <span style={s.bankLabel}>Your Reference</span>
                <span style={s.refValue}>{paymentRef}</span>
              </div>
            </div>
            <div style={s.refNote}>
              <span style={{ fontSize: "16px", marginRight: "10px", marginTop: "2px" }}>ℹ️</span>
              <div>
                <strong>Important Payment Matching:</strong> Please use your registered email address as the payment reference. This allows us to accurately match your payment to your account. You will receive proof of payment within 24 hours of clearance.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Database — with tab-bar filters */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>Active Database</h2>
          <Link to="/employer/post-job" style={s.btnOutline}>+ New Listing</Link>
        </div>

        {/* ── Tab bar (Firebase-style horizontal filters) ── */}
        <div style={s.tabBar}>
          {TAB_FILTERS.map(tab => {
            const count = tab.key === "all" ? jobs.length : jobs.filter(j => j.status === tab.key).length;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                style={{ ...s.tabBtn, ...(isActive ? s.tabBtnActive : {}) }}
                onClick={() => setActiveTab(tab.key)}
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

        {filteredJobs.length === 0 ? (
          <div style={s.emptyCard}>
            <div style={s.emptyIcon}>📁</div>
            <p style={s.emptyText}>
              {activeTab === "all" ? "Your database is currently empty." : `No ${activeTab} listings found.`}
            </p>
            {activeTab === "all" && (
              <Link to="/employer/post-job" style={s.btnPrimary}>Post your first job</Link>
            )}
          </div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Identifier", "Department", "Type", "Region", "Status", "Applicants", "Cost", "Actions"].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map(job => {
                  const jobApps = applications.filter(a => a.jobId === job.id);
                  return (
                    <tr key={job.id} style={s.tr}>
                      <td style={s.td}>
                        <div style={s.jobTitle}>{job.title}</div>
                        <div style={s.jobSub}>{job.city}</div>
                      </td>
                      <td style={s.td}>{job.department || "—"}</td>
                      <td style={s.td}>{job.type || "—"}</td>
                      <td style={s.td}>{job.province || "—"}</td>
                      <td style={s.td}>
                        <span style={{ ...s.pill, ...pillColor(job.status) }}>{job.status}</span>
                      </td>
                      <td style={{ ...s.td, fontWeight: "600", color: "#3c4043" }}>
                        {jobApps.length}
                      </td>
                      <td style={s.td}>
                        {job.status === "live"
                          ? <span style={s.costLive}>R{JOB_PRICE}</span>
                          : <span style={s.costInactive}>—</span>
                        }
                      </td>
                      <td style={s.td}>
                        <div style={s.actions}>
                          <button style={s.btnAction} onClick={() => navigate(`/employer/post-job?edit=${job.id}`)}>Edit</button>
                          {job.status === "live" && (
                            <button style={s.btnActionAmber} onClick={() => updateJobStatus(job.id, "paused")}>Pause</button>
                          )}
                          {(job.status === "paused" || job.status === "draft") && (
                            <button style={s.btnActionGreen} onClick={() => updateJobStatus(job.id, "live")}>Publish</button>
                          )}
                          <button style={s.btnActionRed} onClick={() => deleteJob(job.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Console Actions */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Console Actions</h2>
        <div style={s.quickGrid}>
          <QuickAction icon="📋" label="View Applications"  to="/employer/applications" />
          <QuickAction icon="🏢" label="Project Settings"   to="/employer/profile" />
          <QuickAction icon="💼" label="Deploy New Job"     to="/employer/post-job" />
        </div>
      </div>

    </Layout>
  );
}

// ── Layout ────────────────────────────────────────────────────────────
function Layout({ children, profile, onSignOut }) {
  const navigate = useNavigate();
  const path = window.location.pathname;
  const navItems = [
    { label: "Project Overview",        to: "/employer/dashboard",    icon: "⌂" },
    { label: "Deploy Job",              to: "/employer/post-job",     icon: "+" },
    { label: "Database (Applications)", to: "/employer/applications", icon: "≡" },
    { label: "Settings",                to: "/employer/profile",      icon: "⚙" },
  ];
  return (
    <div style={s.page}>
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
          <button onClick={onSignOut} style={s.signOutBtn}>Sign Out</button>
        </div>
      </div>
      <div style={s.mainWrapper}>
        <div style={s.mainInner}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────
function StatCard({ label, value, color, small }) {
  return (
    <div style={s.statCard}>
      <div style={s.statHeader}>
        <div style={s.statLabel}>{label}</div>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: color }} />
      </div>
      <div style={{ ...s.statValue, fontSize: small ? "24px" : "32px" }}>{value}</div>
    </div>
  );
}

function QuickAction({ icon, label, to }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(to)} style={s.quickCard}>
      <div style={s.quickIconWrap}>
        <span style={s.quickIcon}>{icon}</span>
      </div>
      <span style={s.quickLabel}>{label}</span>
    </button>
  );
}

function pillColor(status) {
  const map = {
    live:    { background: "#e6f4ea", color: "#0d652d" },
    draft:   { background: "#f1f3f4", color: "#3c4043" },
    paused:  { background: "#fef7e0", color: "#ea8600" },
    expired: { background: "#fce8e6", color: "#c5221f" },
  };
  return map[status] || { background: "#f1f3f4", color: "#3c4043" };
}

// ── Styles ────────────────────────────────────────────────────────────
const s = {
  // ── Page Shell ──
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
  profileChip: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" },
  profileAvatarWrap: { width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "1px solid #dadce0" },
  profileAvatar: { width: "100%", height: "100%", background: "#1a73e8", color: "#ffffff", fontWeight: "600", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" },
  profileLogoImg: { width: "100%", height: "100%", objectFit: "cover", background: "#ffffff" },
  profileName: { color: "#202124", fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  profileEmail: { color: "#5f6368", fontSize: "12px" },
  signOutBtn: { width: "100%", background: "#ffffff", border: "1px solid #dadce0", color: "#3c4043", borderRadius: "4px", padding: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" },

  // ── Main Content ──
  mainWrapper: { flex: 1, height: "100%", overflowY: "auto", position: "relative" },
  mainInner: { padding: "32px 48px", maxWidth: "1200px", margin: "0 auto" },

  topbar: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", gap: "16px", flexWrap: "wrap" },
  pageTitle: { color: "#202124", fontSize: "24px", fontWeight: "600", margin: "0 0 4px", letterSpacing: "-0.5px" },
  pageSub: { color: "#5f6368", fontSize: "14px", margin: 0 },

  actionMsg: { background: "#323232", color: "#ffffff", borderRadius: "4px", padding: "12px 16px", fontSize: "13px", display: "inline-flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" },

  // ── Stats Grid ──
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "40px" },
  statCard: { background: "#ffffff", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1), 0 1px 3px 1px rgba(60,64,67,0.05)" },
  statHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  statValue: { color: "#202124", fontWeight: "600", lineHeight: 1, letterSpacing: "-0.5px" },
  statLabel: { color: "#5f6368", fontSize: "13px", fontWeight: "500" },

  // ── Sections ──
  section: { marginBottom: "40px" },
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0px" },
  sectionTitle: { color: "#202124", fontSize: "16px", fontWeight: "600", margin: "0 0 16px" },

  // ── Invoice / Billing ──
  invoiceCard: { background: "#ffffff", borderRadius: "8px", padding: "32px", display: "grid", gridTemplateColumns: "1fr auto 1.5fr", gap: "48px", alignItems: "start", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1), 0 1px 3px 1px rgba(60,64,67,0.05)" },
  invoiceLeft: { display: "flex", flexDirection: "column" },
  invoiceTag: { color: "#5f6368", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" },
  invoiceAmount: { color: "#202124", fontSize: "40px", fontWeight: "600", lineHeight: 1, marginBottom: "8px", letterSpacing: "-1px" },
  invoiceBreakdown: { color: "#5f6368", fontSize: "14px", marginBottom: "24px" },
  invoiceDue: { display: "inline-flex", alignItems: "center", gap: "8px", background: "#f8f9fa", borderRadius: "4px", padding: "8px 12px", alignSelf: "flex-start", border: "1px solid #dadce0" },
  invoiceDueLabel: { color: "#3c4043", fontSize: "13px", fontWeight: "500" },
  invoiceDueDate: { color: "#d93025", fontSize: "13px", fontWeight: "600" },
  invoiceZero: { color: "#0d652d", fontSize: "13px", marginTop: "16px", fontWeight: "500", background: "#e6f4ea", padding: "8px 12px", borderRadius: "4px", display: "inline-block", alignSelf: "flex-start" },
  invoiceDivider: { width: "1px", background: "#e3e3e3", alignSelf: "stretch" },
  invoiceRight: {},
  bankTitle: { color: "#202124", fontSize: "14px", fontWeight: "600", marginBottom: "16px" },
  bankDetailsCard: { background: "#f8f9fa", borderRadius: "6px", padding: "16px", border: "1px solid #e3e3e3", marginBottom: "16px" },
  bankRow: { display: "flex", justifyContent: "space-between", gap: "16px", padding: "6px 0", fontSize: "13px" },
  bankLabel: { color: "#5f6368" },
  bankValue: { color: "#202124", textAlign: "right", fontWeight: "500" },
  refRow: { display: "flex", justifyContent: "space-between", gap: "16px", paddingTop: "12px", marginTop: "6px", borderTop: "1px solid #dadce0", fontSize: "13px" },
  refValue: { color: "#1a73e8", textAlign: "right", fontWeight: "600", fontFamily: '"Roboto Mono", monospace' },
  refNote: { display: "flex", alignItems: "flex-start", background: "#e3f2fd", color: "#1967d2", fontSize: "13px", lineHeight: "1.5", padding: "16px", borderRadius: "6px", fontWeight: "400" },

  // ── Tab Bar (Firebase-style horizontal filters) ──
  tabBar: {
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid #e3e3e3",
    marginBottom: "0",
    gap: "0",
    background: "#ffffff",
    borderRadius: "8px 8px 0 0",
    padding: "0 8px",
  },
  tabBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    color: "#5f6368",
    fontSize: "13px",
    fontWeight: "500",
    padding: "12px 16px",
    cursor: "pointer",
    transition: "color 0.15s",
    marginBottom: "-1px",
    fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    whiteSpace: "nowrap",
  },
  tabBtnActive: {
    color: "#1967d2",
    borderBottom: "2px solid #1967d2",
    fontWeight: "600",
  },
  tabCount: {
    background: "#f1f3f4",
    color: "#5f6368",
    borderRadius: "10px",
    padding: "1px 7px",
    fontSize: "11px",
    fontWeight: "600",
  },
  tabCountActive: {
    background: "#e3f2fd",
    color: "#1967d2",
  },

  // ── Table ──
  tableWrap: { overflowX: "auto", background: "#ffffff", borderRadius: "0 0 8px 8px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1), 0 1px 3px 1px rgba(60,64,67,0.05)" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  th: { color: "#5f6368", fontWeight: "600", textAlign: "left", padding: "12px 24px", borderBottom: "1px solid #e3e3e3", whiteSpace: "nowrap", background: "#f8f9fa", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" },
  tr: { borderBottom: "1px solid #e3e3e3", transition: "background 0.2s" },
  td: { color: "#202124", padding: "16px 24px", verticalAlign: "middle" },
  jobTitle: { fontWeight: "600", marginBottom: "4px", fontSize: "14px", color: "#1a73e8" },
  jobSub: { color: "#5f6368", fontSize: "12px" },
  pill: { padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" },
  costLive: { color: "#0d652d", fontWeight: "600" },
  costInactive: { color: "#5f6368" },

  // ── Table Actions ──
  actions: { display: "flex", gap: "8px", flexWrap: "wrap" },
  btnAction:       { background: "transparent", color: "#1a73e8", border: "none", padding: "6px 8px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "background 0.2s", borderRadius: "4px" },
  btnActionGreen:  { background: "transparent", color: "#0d652d", border: "none", padding: "6px 8px", fontSize: "13px", fontWeight: "600", cursor: "pointer", borderRadius: "4px" },
  btnActionAmber:  { background: "transparent", color: "#ea8600", border: "none", padding: "6px 8px", fontSize: "13px", fontWeight: "600", cursor: "pointer", borderRadius: "4px" },
  btnActionRed:    { background: "transparent", color: "#d93025", border: "none", padding: "6px 8px", fontSize: "13px", fontWeight: "600", cursor: "pointer", borderRadius: "4px" },

  // ── Empty States ──
  emptyCard: { background: "#ffffff", borderRadius: "0 0 8px 8px", padding: "64px 32px", textAlign: "center", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1)" },
  emptyIcon: { fontSize: "48px", marginBottom: "16px", opacity: 0.5 },
  emptyText: { color: "#5f6368", marginBottom: "24px", fontSize: "14px" },
  empty: { color: "#5f6368", padding: "48px", textAlign: "center", fontSize: "14px", fontWeight: "500", marginTop: "64px" },

  // ── Quick Actions ──
  quickGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" },
  quickCard: { background: "#ffffff", borderRadius: "8px", padding: "24px", display: "flex", alignItems: "center", gap: "16px", cursor: "pointer", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1), 0 1px 3px 1px rgba(60,64,67,0.05)", border: "none", transition: "transform 0.2s", textAlign: "left" },
  quickIconWrap: { width: "40px", height: "40px", borderRadius: "8px", background: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center" },
  quickIcon: { fontSize: "20px" },
  quickLabel: { color: "#202124", fontSize: "14px", fontWeight: "600", flex: 1 },

  // ── Buttons ──
  btnPrimary: { background: "#1a73e8", color: "#ffffff", border: "none", borderRadius: "4px", padding: "8px 16px", fontSize: "14px", fontWeight: "600", cursor: "pointer", textDecoration: "none", display: "inline-block", transition: "background 0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" },
  btnOutline: { background: "#ffffff", color: "#1a73e8", border: "1px solid #dadce0", borderRadius: "4px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", textDecoration: "none", display: "inline-block", transition: "background 0.2s" },
};