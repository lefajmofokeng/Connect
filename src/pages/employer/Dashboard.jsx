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
    if (!window.confirm("Delete this job listing? This cannot be undone.")) return;
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
        <div style={s.actionMsg} onClick={() => setActionMsg("")}>{actionMsg} ✕</div>
      )}

      {/* Stats */}
      <div style={s.statsGrid}>
        <StatCard label="Live Jobs" value={liveJobs.length} color="#0099fa" />
        <StatCard label="Draft Jobs" value={draftJobs.length} color="#f5a623" />
        <StatCard label="Total Applicants" value={applications.length} color="#00e5a0" />
        <StatCard label="New Applications" value={newApps.length} color="#ff4f6a" />
        <StatCard label="Top Location" value={topLocation} color="#0099fa" small />
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
            ⚠ Always use your email address as the payment reference so we can match your payment.
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
                      <td style={s.td}>{jobApps.length}</td>
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
          <QuickAction icon="✏️" label="Edit Company Profile" to="/employer/profile" />
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
              <span>{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div style={s.sidebarBottom}>
          <div style={s.profileChip}>
            <div style={s.profileAvatar}>{profile?.companyName?.[0] || "E"}</div>
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
    <div style={s.statCard}>
      <div style={{ ...s.statValue, color, fontSize: small ? "22px" : "36px" }}>{value}</div>
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
  const map = {
    live: { background: "rgba(0,229,160,0.12)", color: "#00e5a0" },
    draft: { background: "rgba(107,127,163,0.12)", color: "#6b7fa3" },
    paused: { background: "rgba(245,166,35,0.12)", color: "#f5a623" },
    expired: { background: "rgba(255,79,106,0.12)", color: "#ff4f6a" },
  };
  return map[status] || { background: "rgba(107,127,163,0.12)", color: "#6b7fa3" };
}

const s = {
  page: { display: "flex", minHeight: "100vh", background: "#080d1b", fontFamily: "sans-serif" },
  sidebar: { width: "240px", flexShrink: 0, background: "#0d1428", borderRight: "1px solid #1e2d52", padding: "28px 16px", display: "flex", flexDirection: "column" },
  sidebarLogo: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "36px", paddingLeft: "8px" },
  logoMark: { width: "36px", height: "36px", borderRadius: "10px", background: "#0099fa", color: "#fff", fontWeight: "800", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" },
  logoText: { color: "#e8edf8", fontWeight: "700", fontSize: "15px" },
  logoSub: { color: "#6b7fa3", fontSize: "11px" },
  nav: { display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
  navBtn: { background: "none", border: "none", color: "#6b7fa3", fontSize: "13px", padding: "11px 12px", borderRadius: "8px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "10px" },
  navBtnActive: { background: "rgba(0,153,250,0.12)", color: "#0099fa" },
  sidebarBottom: { borderTop: "1px solid #1e2d52", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "10px" },
  profileChip: { display: "flex", alignItems: "center", gap: "10px", padding: "8px" },
  profileAvatar: { width: "32px", height: "32px", borderRadius: "8px", background: "#0099fa", color: "#fff", fontWeight: "700", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  profileName: { color: "#e8edf8", fontSize: "13px", fontWeight: "500" },
  profilePlan: { color: "#00e5a0", fontSize: "11px" },
  signOutBtn: { background: "none", border: "1px solid #1e2d52", color: "#6b7fa3", borderRadius: "8px", padding: "8px", fontSize: "12px", cursor: "pointer", textAlign: "center" },
  main: { flex: 1, padding: "40px", overflowX: "auto" },
  topbar: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", gap: "16px", flexWrap: "wrap" },
  pageTitle: { color: "#e8edf8", fontSize: "24px", fontWeight: "700", margin: "0 0 4px" },
  pageSub: { color: "#6b7fa3", fontSize: "14px", margin: 0 },
  actionMsg: { background: "rgba(0,153,250,0.12)", border: "1px solid rgba(0,153,250,0.3)", color: "#0099fa", borderRadius: "8px", padding: "10px 16px", fontSize: "13px", cursor: "pointer", marginBottom: "24px" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px", marginBottom: "24px" },
  statCard: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "12px", padding: "20px" },
  statValue: { fontWeight: "700", lineHeight: 1, marginBottom: "8px" },
  statLabel: { color: "#6b7fa3", fontSize: "12px" },
  // Invoice card
  invoiceCard: { background: "#0d1428", border: "1px solid rgba(0,153,250,0.3)", borderRadius: "14px", padding: "28px", marginBottom: "40px", display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "32px", alignItems: "start" },
  invoiceLeft: {},
  invoiceTag: { color: "#0099fa", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" },
  invoiceAmount: { color: "#e8edf8", fontSize: "48px", fontWeight: "800", lineHeight: 1, marginBottom: "8px", letterSpacing: "-0.02em" },
  invoiceBreakdown: { color: "#6b7fa3", fontSize: "13px", marginBottom: "16px" },
  invoiceDue: { display: "flex", alignItems: "center", gap: "8px", background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "8px", padding: "10px 14px" },
  invoiceDueLabel: { color: "#6b7fa3", fontSize: "12px" },
  invoiceDueDate: { color: "#f5a623", fontSize: "13px", fontWeight: "600" },
  invoiceZero: { color: "#00e5a0", fontSize: "13px", marginTop: "12px" },
  invoiceDivider: { width: "1px", background: "#1e2d52", alignSelf: "stretch" },
  invoiceRight: {},
  bankTitle: { color: "#e8edf8", fontSize: "14px", fontWeight: "600", marginBottom: "16px" },
  bankRow: { display: "flex", justifyContent: "space-between", gap: "12px", padding: "8px 0", borderBottom: "1px solid #131b33", fontSize: "13px" },
  bankLabel: { color: "#6b7fa3" },
  bankValue: { color: "#e8edf8", textAlign: "right", fontWeight: "500" },
  refRow: { display: "flex", justifyContent: "space-between", gap: "12px", padding: "10px 0", borderBottom: "1px solid #131b33", fontSize: "13px" },
  refValue: { color: "#0099fa", textAlign: "right", fontWeight: "600", fontFamily: "monospace" },
  refNote: { color: "#f5a623", fontSize: "12px", marginTop: "12px", lineHeight: "1.5" },
  // Section
  section: { marginBottom: "40px" },
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" },
  sectionTitle: { color: "#e8edf8", fontSize: "17px", fontWeight: "600", margin: 0 },
  tableWrap: { overflowX: "auto", border: "1px solid #1e2d52", borderRadius: "12px" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  th: { color: "#6b7fa3", fontWeight: "500", textAlign: "left", padding: "12px 16px", borderBottom: "1px solid #1e2d52", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #1e2d52" },
  td: { color: "#e8edf8", padding: "14px 16px", verticalAlign: "middle" },
  jobTitle: { fontWeight: "500", marginBottom: "2px" },
  jobSub: { color: "#6b7fa3", fontSize: "12px" },
  pill: { padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "500" },
  costLive: { color: "#00e5a0", fontWeight: "600", fontSize: "13px" },
  costInactive: { color: "#3d4f73", fontSize: "13px" },
  actions: { display: "flex", gap: "6px", flexWrap: "wrap" },
  btnAction: { background: "rgba(0,153,250,0.12)", color: "#0099fa", border: "1px solid rgba(0,153,250,0.25)", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", cursor: "pointer" },
  btnActionGreen: { background: "rgba(0,229,160,0.12)", color: "#00e5a0", border: "1px solid rgba(0,229,160,0.25)", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", cursor: "pointer" },
  btnActionAmber: { background: "rgba(245,166,35,0.12)", color: "#f5a623", border: "1px solid rgba(245,166,35,0.25)", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", cursor: "pointer" },
  btnActionRed: { background: "rgba(255,79,106,0.12)", color: "#ff4f6a", border: "1px solid rgba(255,79,106,0.25)", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", cursor: "pointer" },
  emptyCard: { background: "#0d1428", border: "1px dashed #1e2d52", borderRadius: "12px", padding: "48px", textAlign: "center" },
  emptyText: { color: "#6b7fa3", marginBottom: "16px" },
  empty: { color: "#6b7fa3", padding: "40px", textAlign: "center" },
  quickGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px" },
  quickCard: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", cursor: "pointer" },
  quickIcon: { fontSize: "24px" },
  quickLabel: { color: "#6b7fa3", fontSize: "13px", fontWeight: "500" },
  btnPrimary: { background: "#0099fa", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "13px", fontWeight: "600", cursor: "pointer", textDecoration: "none", display: "inline-block" },
  btnOutline: { background: "none", color: "#0099fa", border: "1px solid rgba(0,153,250,0.3)", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", cursor: "pointer", textDecoration: "none", display: "inline-block" },
};