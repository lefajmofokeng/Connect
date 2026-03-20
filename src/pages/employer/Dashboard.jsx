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

  if (loading) return (
    <Layout profile={employerProfile} onSignOut={handleSignOut}>
      <div style={s.empty}>Loading...</div>
    </Layout>
  );

  return (
    <Layout profile={employerProfile} onSignOut={handleSignOut}>
      {/* Header */}
      <div style={s.topbar}>
        <div>
          <h1 style={s.pageTitle}>Dashboard</h1>
          <p style={s.pageSub}>Welcome back, {employerProfile?.companyName || "Employer"}</p>
        </div>
        <Link to="/employer/post-job" style={s.btnPrimary}>+ Post a Job</Link>
      </div>

      {actionMsg && (
        <div style={s.actionMsg} onClick={() => setActionMsg("")}>
          {actionMsg} 
          <span style={{ cursor: "pointer", marginLeft: "8px", fontWeight: "bold" }}>✕</span>
        </div>
      )}

      {/* Stats */}
      <div style={s.statsGrid}>
        <StatCard label="Live Jobs" value={liveJobs.length} color="#1a73e8" />
        <StatCard label="Draft Jobs" value={draftJobs.length} color="#b06000" />
        <StatCard label="Total Applicants" value={applications.length} color="#137333" />
        <StatCard label="New Applications" value={newApps.length} color="#c5221f" />
        <StatCard label="Top Location" value={topLocation} color="#1a73e8" small />
      </div>

      {/* Invoice / Amount Payable Card */}
      <div style={s.invoiceCard}>
        <div style={s.invoiceLeft}>
          <div style={s.invoiceTag}>💳 Monthly Invoice</div>
          <div style={s.invoiceAmount}>R {amountPayable.toLocaleString("en-ZA")}</div>
          <div style={s.invoiceBreakdown}>
            {liveJobs.length} live job{liveJobs.length !== 1 ? "s" : ""} × R{JOB_PRICE} per listing
          </div>
          <div style={s.invoiceDue}>
            <span style={s.invoiceDueLabel}>Payment due:</span>
            <span style={s.invoiceDueDate}>{dueDate}</span>
          </div>
          {amountPayable === 0 && (
            <div style={s.invoiceZero}>No active listings this month — nothing to pay.</div>
          )}
        </div>

        <div style={s.invoiceDivider} />

        <div style={s.invoiceRight}>
          <div style={s.bankTitle}>Banking Details</div>
          <div style={s.bankRow}>
            <span style={s.bankLabel}>Bank</span>
            <span style={s.bankValue}>First National Bank (FNB)</span>
          </div>
          <div style={s.bankRow}>
            <span style={s.bankLabel}>Account Name</span>
            <span style={s.bankValue}>Cronos Jobs (Pty) Ltd</span>
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
          <div style={s.refNote}>
            <span style={{ fontSize: "14px", marginRight: "6px" }}>ℹ️</span>
            Always use your email address as the payment reference so we can match your payment.
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>Your Job Listings</h2>
          <Link to="/employer/post-job" style={s.btnOutline}>+ New Listing</Link>
        </div>

        {jobs.length === 0 ? (
          <div style={s.emptyCard}>
            <p style={s.emptyText}>No job listings yet.</p>
            <Link to="/employer/post-job" style={s.btnPrimary}>Post your first job</Link>
          </div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Job Title", "Department", "Type", "Province", "Status", "Applicants", "Cost", "Actions"].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => {
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

      {/* Quick Actions */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Quick Actions</h2>
        <div style={s.quickGrid}>
          <QuickAction icon="📋" label="View Applications" to="/employer/applications" />
          <QuickAction icon="🏢" label="Company Profile" to="/employer/profile" />
          <QuickAction icon="💼" label="Post a New Job" to="/employer/post-job" />
        </div>
      </div>
    </Layout>
  );
}

// ── Layout ───────────────────────────────────────────────────────────
function Layout({ children, profile, onSignOut }) {
  const navigate = useNavigate();
  const path = window.location.pathname;
  const navItems = [
    { label: "Dashboard", to: "/employer/dashboard", icon: "⬡" },
    { label: "Post a Job", to: "/employer/post-job", icon: "+" },
    { label: "Applications", to: "/employer/applications", icon: "📋" },
    { label: "Company Profile", to: "/employer/profile", icon: "🏢" },
  ];
  return (
    <div style={s.page}>
      <div style={s.sidebar}>
        <div style={s.sidebarLogo}>
          <div style={s.logoMark}>C</div>
          <div>
            <div style={s.logoText}>Cronos Jobs</div>
            <div style={s.logoSub}>Employer Portal</div>
          </div>
        </div>
        <nav style={s.nav}>
          {navItems.map(item => (
            <button key={item.to} onClick={() => navigate(item.to)}
              style={{ ...s.navBtn, ...(path === item.to ? s.navBtnActive : {}) }}>
              <span style={s.navIcon}>{item.icon}</span>
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
            <div>
                <div style={s.profileName}>{profile?.companyName || "Employer"}</div>
                <div style={s.profilePlan}>Verified Employer</div>
            </div>
          </div>
          <button onClick={onSignOut} style={s.signOutBtn}>Sign Out</button>
        </div>
      </div>
      <div style={s.main}>{children}</div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────
function StatCard({ label, value, color, small }) {
  return (
    <div style={{ ...s.statCard, borderBottom: `3px solid ${color}` }}>
      <div style={{ ...s.statValue, color: "#202124", fontSize: small ? "24px" : "36px" }}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

function QuickAction({ icon, label, to }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(to)} style={s.quickCard}>
      <span style={s.quickIcon}>{icon}</span>
      <span style={s.quickLabel}>{label}</span>
    </button>
  );
}

function pillColor(status) {
  // Google Material light theme status colors
  const map = {
    live:    { background: "#e6f4ea", color: "#137333" }, // Green
    draft:   { background: "#f1f3f4", color: "#5f6368" }, // Gray
    paused:  { background: "#fef7e0", color: "#b06000" }, // Yellow
    expired: { background: "#fce8e6", color: "#c5221f" }, // Red
  };
  return map[status] || { background: "#f1f3f4", color: "#5f6368" };
}

const s = {
  // Base Google/Material Light Theme
  page: { display: "flex", minHeight: "100vh", background: "#f8f9fa", fontFamily: '"Google Sans", Roboto, Arial, sans-serif' },

  // Sidebar (Identical to Applications.jsx)
  sidebar: { width: "260px", flexShrink: 0, background: "#ffffff", borderRight: "1px solid #dadce0", padding: "24px 0", display: "flex", flexDirection: "column" },
  sidebarLogo: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px", padding: "0 24px" },
  logoMark: { width: "40px", height: "40px", borderRadius: "8px", background: "#1a73e8", color: "#ffffff", fontWeight: "700", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(26,115,232,0.3)" },
  logoText: { color: "#202124", fontWeight: "600", fontSize: "16px", letterSpacing: "-0.2px" },
  logoSub: { color: "#5f6368", fontSize: "12px", fontWeight: "500" },
  nav: { display: "flex", flexDirection: "column", gap: "4px", flex: 1, paddingRight: "16px" },
  navBtn: { background: "none", border: "none", color: "#3c4043", fontSize: "14px", fontWeight: "500", padding: "12px 24px", borderRadius: "0 24px 24px 0", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "16px", transition: "background 0.2s" },
  navBtnActive: { background: "#e8f0fe", color: "#1a73e8", fontWeight: "600" },
  navIcon: { fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", width: "24px" },
  navLabel: { flex: 1 },
  sidebarBottom: { borderTop: "1px solid #dadce0", padding: "16px 24px 0", display: "flex", flexDirection: "column", gap: "16px" },
  profileChip: { display: "flex", alignItems: "center", gap: "12px" },
  profileAvatar: { width: "36px", height: "36px", borderRadius: "50%", background: "#e8f0fe", color: "#1a73e8", fontWeight: "600", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  profileName: { color: "#202124", fontSize: "14px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  profilePlan: { color: "#137333", fontSize: "12px", fontWeight: "500" },
  profileAvatarWrap: { width: "36px", height: "36px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "1px solid #dadce0" },
  profileLogoImg: { width: "100%", height: "100%", objectFit: "contain", background: "#ffffff" },
  signOutBtn: { background: "#ffffff", border: "1px solid #dadce0", color: "#5f6368", borderRadius: "8px", padding: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer", textAlign: "center", transition: "all 0.2s" },

  // Main Content
  main: { flex: 1, padding: "40px", overflowX: "auto" },
  topbar: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", gap: "16px", flexWrap: "wrap" },
  pageTitle: { color: "#202124", fontSize: "28px", fontWeight: "400", margin: "0 0 4px", letterSpacing: "-0.5px" },
  pageSub: { color: "#5f6368", fontSize: "14px", margin: 0, fontWeight: "500" },
  
  // Action Messages
  actionMsg: { background: "#e8f0fe", border: "1px solid #aecbfa", color: "#1a73e8", borderRadius: "8px", padding: "12px 16px", fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" },
  
  // Stats Grid
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "20px", marginBottom: "32px" },
  statCard: { background: "#ffffff", border: "1px solid #dadce0", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.05)", transition: "box-shadow 0.2s" },
  statValue: { fontWeight: "400", lineHeight: 1, marginBottom: "8px", letterSpacing: "-0.5px" },
  statLabel: { color: "#5f6368", fontSize: "13px", fontWeight: "500" },

  // Invoice / Billing Card (Styled like Google Cloud Billing)
  invoiceCard: { background: "#ffffff", border: "1px solid #dadce0", borderRadius: "16px", padding: "32px", marginBottom: "48px", display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "40px", alignItems: "start", boxShadow: "0 2px 6px rgba(60,64,67,0.05)" },
  invoiceLeft: { display: "flex", flexDirection: "column" },
  invoiceTag: { color: "#1a73e8", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" },
  invoiceAmount: { color: "#202124", fontSize: "48px", fontWeight: "400", lineHeight: 1, marginBottom: "12px", letterSpacing: "-1px" },
  invoiceBreakdown: { color: "#5f6368", fontSize: "14px", marginBottom: "24px", fontWeight: "500" },
  invoiceDue: { display: "inline-flex", alignItems: "center", gap: "8px", background: "#fff8e1", border: "1px solid #ffecb3", borderRadius: "8px", padding: "10px 16px", alignSelf: "flex-start" },
  invoiceDueLabel: { color: "#5f6368", fontSize: "13px", fontWeight: "500" },
  invoiceDueDate: { color: "#b06000", fontSize: "14px", fontWeight: "600" },
  invoiceZero: { color: "#137333", fontSize: "14px", marginTop: "16px", fontWeight: "500", background: "#e6f4ea", padding: "10px 16px", borderRadius: "8px", display: "inline-block", alignSelf: "flex-start" },
  invoiceDivider: { width: "1px", background: "#f1f3f4", alignSelf: "stretch" },
  invoiceRight: {},
  bankTitle: { color: "#202124", fontSize: "16px", fontWeight: "600", marginBottom: "20px" },
  bankRow: { display: "flex", justifyContent: "space-between", gap: "16px", padding: "10px 0", borderBottom: "1px solid #f8f9fa", fontSize: "14px" },
  bankLabel: { color: "#5f6368", fontWeight: "500" },
  bankValue: { color: "#202124", textAlign: "right", fontWeight: "500" },
  refRow: { display: "flex", justifyContent: "space-between", gap: "16px", padding: "12px 0", borderBottom: "1px solid #f8f9fa", fontSize: "14px" },
  refValue: { color: "#1a73e8", textAlign: "right", fontWeight: "600", fontFamily: '"Roboto Mono", monospace', letterSpacing: "0.5px" },
  refNote: { background: "#f8f9fa", color: "#5f6368", fontSize: "13px", marginTop: "16px", lineHeight: "1.5", padding: "12px", borderRadius: "8px", border: "1px solid #f1f3f4", fontWeight: "500" },

  // Sections
  section: { marginBottom: "48px" },
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" },
  sectionTitle: { color: "#202124", fontSize: "18px", fontWeight: "600", margin: 0 },
  
  // Table
  tableWrap: { overflowX: "auto", background: "#ffffff", border: "1px solid #dadce0", borderRadius: "12px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.05)" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
  th: { color: "#5f6368", fontWeight: "600", textAlign: "left", padding: "14px 20px", borderBottom: "1px solid #dadce0", whiteSpace: "nowrap", background: "#f8f9fa" },
  tr: { borderBottom: "1px solid #f1f3f4", transition: "background 0.2s" },
  td: { color: "#202124", padding: "16px 20px", verticalAlign: "middle" },
  jobTitle: { fontWeight: "600", marginBottom: "4px", fontSize: "15px", color: "#1a73e8" },
  jobSub: { color: "#5f6368", fontSize: "13px", fontWeight: "500" },
  pill: { padding: "4px 12px", borderRadius: "16px", fontSize: "12px", fontWeight: "600", textTransform: "capitalize" },
  costLive: { color: "#137333", fontWeight: "600", fontSize: "14px" },
  costInactive: { color: "#5f6368", fontSize: "14px" },
  
  // Table Actions
  actions: { display: "flex", gap: "8px", flexWrap: "wrap" },
  btnAction: { background: "#ffffff", color: "#1a73e8", border: "1px solid #dadce0", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" },
  btnActionGreen: { background: "#e6f4ea", color: "#137333", border: "1px solid #ceead6", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
  btnActionAmber: { background: "#fef7e0", color: "#b06000", border: "1px solid #fde293", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
  btnActionRed: { background: "#fce8e6", color: "#c5221f", border: "1px solid #fad2cf", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
  
  // Empty States
  emptyCard: { background: "#f8f9fa", border: "1px dashed #dadce0", borderRadius: "12px", padding: "48px", textAlign: "center" },
  emptyText: { color: "#5f6368", marginBottom: "16px", fontSize: "15px", fontWeight: "500" },
  empty: { color: "#5f6368", padding: "48px", textAlign: "center", fontSize: "15px", fontWeight: "500" },
  
  // Quick Actions
  quickGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" },
  quickCard: { background: "#ffffff", border: "1px solid #dadce0", borderRadius: "12px", padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", cursor: "pointer", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.05)", transition: "all 0.2s ease" },
  quickIcon: { fontSize: "32px" },
  quickLabel: { color: "#3c4043", fontSize: "14px", fontWeight: "600" },
  
  // Primary Buttons
  btnPrimary: { background: "#1a73e8", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 24px", fontSize: "14px", fontWeight: "600", cursor: "pointer", textDecoration: "none", display: "inline-block", transition: "background 0.2s", boxShadow: "0 1px 2px rgba(26,115,232,0.3)" },
  btnOutline: { background: "#ffffff", color: "#1a73e8", border: "1px solid #dadce0", borderRadius: "8px", padding: "8px 20px", fontSize: "14px", fontWeight: "600", cursor: "pointer", textDecoration: "none", display: "inline-block", transition: "all 0.2s" },
};