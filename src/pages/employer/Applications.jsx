import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";

const STATUSES = ["all", "new", "reviewed", "shortlisted", "rejected", "hired"];

export default function Applications() {
  const { user, employerProfile } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterJob, setFilterJob] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState(null);
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appSnap, jobSnap] = await Promise.all([
        getDocs(query(collection(db, "applications"), where("employerId", "==", user.uid))),
        getDocs(query(collection(db, "jobs"), where("employerId", "==", user.uid))),
      ]);
      setApplications(appSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setJobs(jobSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const updateStatus = async (appId, status) => {
    try {
      await updateDoc(doc(db, "applications", appId), { status, updatedAt: serverTimestamp() });
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
      if (selected?.id === appId) setSelected(prev => ({ ...prev, status }));
      setActionMsg(`Marked as ${status}.`);
    } catch (err) {
      setActionMsg("Update failed.");
    }
  };

  const saveNotes = async (appId, notes) => {
    try {
      await updateDoc(doc(db, "applications", appId), { notes, updatedAt: serverTimestamp() });
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, notes } : a));
      setSelected(prev => ({ ...prev, notes }));
      setActionMsg("Notes saved.");
    } catch (err) {
      setActionMsg("Save failed.");
    }
  };

  const filtered = applications.filter(a => {
    if (filterJob !== "all" && a.jobId !== filterJob) return false;
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    return true;
  });

  return (
    <div style={s.page}>
      <Sidebar profile={employerProfile} />

      <div style={s.main}>
        <div style={s.topbar}>
          <div>
            <h1 style={s.pageTitle}>Applications</h1>
            <p style={s.pageSub}>{applications.length} total applicant{applications.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {actionMsg && (
          <div style={s.actionMsg} onClick={() => setActionMsg("")}>{actionMsg} ✕</div>
        )}

        {/* Filters */}
        <div style={s.filters}>
          <select style={s.filterSelect} value={filterJob} onChange={e => setFilterJob(e.target.value)}>
            <option value="all">All Jobs</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
          <select style={s.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            {STATUSES.map(st => (
              <option key={st} value={st}>{st === "all" ? "All Statuses" : st.charAt(0).toUpperCase() + st.slice(1)}</option>
            ))}
          </select>
          <div style={s.filterCount}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</div>
        </div>

        <div style={s.layout}>
          {/* List */}
          <div style={s.listCol}>
            {loading ? (
              <div style={s.empty}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div style={s.empty}>No applications match your filters.</div>
            ) : (
              filtered.map(app => (
                <div
                  key={app.id}
                  style={{ ...s.appCard, ...(selected?.id === app.id ? s.appCardActive : {}) }}
                  onClick={() => setSelected(app)}
                >
                  <div style={s.appCardTop}>
                    <div style={s.appAvatar}>{app.firstName?.[0]}{app.lastName?.[0]}</div>
                    <div style={s.appInfo}>
                      <div style={s.appName}>{app.firstName} {app.lastName}</div>
                      <div style={s.appJob}>{app.jobTitle}</div>
                    </div>
                    <span style={{ ...s.pill, ...pillColor(app.status) }}>{app.status}</span>
                  </div>
                  <div style={s.appMeta}>
                    <span>📍 {app.city || "—"}</span>
                    <span>📅 {app.createdAt?.toDate?.().toLocaleDateString() || "—"}</span>
                    {app.salaryExpectation && <span>💰 {app.salaryExpectation}</span>}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer */}
          <div style={s.drawer}>
            {!selected ? (
              <div style={s.drawerEmpty}>
                <div style={s.drawerEmptyIcon}>👤</div>
                <p>Select an applicant to view their details</p>
              </div>
            ) : (
              <DrawerContent
                app={selected}
                onStatusChange={updateStatus}
                onSaveNotes={saveNotes}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Drawer Content ───────────────────────────────────────────────────
function DrawerContent({ app, onStatusChange, onSaveNotes }) {
  const [notes, setNotes] = useState(app.notes || "");

  useEffect(() => {
    setNotes(app.notes || "");
  }, [app.id]);

  return (
    <div style={s.drawerInner}>
      <div style={s.drawerHeader}>
        <div style={s.drawerAvatar}>{app.firstName?.[0]}{app.lastName?.[0]}</div>
        <div>
          <div style={s.drawerName}>{app.firstName} {app.lastName}</div>
          <div style={s.drawerJob}>{app.jobTitle}</div>
        </div>
        <span style={{ ...s.pill, ...pillColor(app.status), marginLeft: "auto" }}>{app.status}</span>
      </div>

      <div style={s.drawerSection}>
        <div style={s.drawerSectionTitle}>Update Status</div>
        <div style={s.statusBtns}>
          {["reviewed", "shortlisted", "rejected", "hired"].map(st => (
            <button
              key={st}
              style={{ ...s.statusBtn, ...(app.status === st ? s.statusBtnActive : {}), ...pillColor(st) }}
              onClick={() => onStatusChange(app.id, st)}
            >
              {st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={s.drawerSection}>
        <div style={s.drawerSectionTitle}>Personal Details</div>
        <InfoRow label="Email" value={app.email} />
        <InfoRow label="Phone" value={app.phone} />
        <InfoRow label="City" value={app.city} />
        <InfoRow label="Notice Period" value={app.notice} />
        <InfoRow label="Experience" value={app.experience} />
        <InfoRow label="Salary Expectation" value={app.salaryExpectation} />
      </div>

      {app.coverNote && (
        <div style={s.drawerSection}>
          <div style={s.drawerSectionTitle}>Cover Note</div>
          <div style={s.coverNote}>{app.coverNote}</div>
        </div>
      )}

      {app.cvPath && (
        <div style={s.drawerSection}>
            <div style={s.drawerSectionTitle}>Documents</div>
            <a href={app.cvPath} target="_blank" rel="noreferrer" style={s.cvLink}>
            📄 {app.cvFilename || "CV / Resume"}
            </a>
            {app.idPath && (
            <a href={app.idPath} target="_blank" rel="noreferrer" style={{ ...s.cvLink, marginTop: "8px" }}>
                📄 {app.idFilename || "ID Document"}
            </a>
            )}
            {app.optionalDocs && Object.entries(app.optionalDocs).map(([key, doc]) => (
            <a key={key} href={doc.url} target="_blank" rel="noreferrer" style={{ ...s.cvLink, marginTop: "8px" }}>
                📄 {doc.filename || key}
            </a>
            ))}
        </div>
        )}

      <div style={s.drawerSection}>
        <div style={s.drawerSectionTitle}>Internal Notes</div>
        <textarea
          style={s.notesInput}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add private notes about this applicant..."
          rows={4}
        />
        <button style={s.saveNotesBtn} onClick={() => onSaveNotes(app.id, notes)}>
          Save Notes
        </button>
      </div>

      <div style={s.appliedDate}>
        Applied {app.createdAt?.toDate?.().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" }) || "—"}
      </div>
    </div>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────
function Sidebar({ profile }) {
  const navigate = useNavigate();
  const path = window.location.pathname;
  const navItems = [
    { label: "Dashboard", to: "/employer/dashboard", icon: "⬡" },
    { label: "Post a Job", to: "/employer/post-job", icon: "+" },
    { label: "Applications", to: "/employer/applications", icon: "📋" },
    { label: "Company Profile", to: "/employer/profile", icon: "🏢" },
  ];
  return (
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
            <div style={s.profilePlan}>{profile?.plan || "No plan"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={s.infoRow}>
      <span style={s.infoLabel}>{label}</span>
      <span style={s.infoValue}>{value}</span>
    </div>
  );
}

function pillColor(status) {
  const map = {
    new: { background: "rgba(0,153,250,0.12)", color: "#0099fa" },
    reviewed: { background: "rgba(245,166,35,0.12)", color: "#f5a623" },
    shortlisted: { background: "rgba(0,229,160,0.12)", color: "#00e5a0" },
    rejected: { background: "rgba(255,79,106,0.12)", color: "#ff4f6a" },
    hired: { background: "rgba(0,229,160,0.2)", color: "#00e5a0" },
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
  sidebarBottom: { borderTop: "1px solid #1e2d52", paddingTop: "16px" },
  profileChip: { display: "flex", alignItems: "center", gap: "10px", padding: "8px" },
  profileAvatar: { width: "32px", height: "32px", borderRadius: "8px", background: "#0099fa", color: "#fff", fontWeight: "700", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  profileName: { color: "#e8edf8", fontSize: "13px", fontWeight: "500" },
  profilePlan: { color: "#6b7fa3", fontSize: "11px" },
  main: { flex: 1, padding: "40px", overflowX: "auto" },
  topbar: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", gap: "16px" },
  pageTitle: { color: "#e8edf8", fontSize: "24px", fontWeight: "700", margin: "0 0 4px" },
  pageSub: { color: "#6b7fa3", fontSize: "14px", margin: 0 },
  actionMsg: { background: "rgba(0,153,250,0.12)", border: "1px solid rgba(0,153,250,0.3)", color: "#0099fa", borderRadius: "8px", padding: "10px 16px", fontSize: "13px", cursor: "pointer", marginBottom: "20px" },
  filters: { display: "flex", gap: "12px", marginBottom: "24px", alignItems: "center", flexWrap: "wrap" },
  filterSelect: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "8px", padding: "9px 13px", color: "#e8edf8", fontSize: "13px", outline: "none", cursor: "pointer" },
  filterCount: { color: "#6b7fa3", fontSize: "13px", marginLeft: "auto" },
  layout: { display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px", alignItems: "start" },
  listCol: { display: "flex", flexDirection: "column", gap: "10px" },
  appCard: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "12px", padding: "16px", cursor: "pointer", transition: "border-color 0.15s" },
  appCardActive: { borderColor: "#0099fa", background: "rgba(0,153,250,0.05)" },
  appCardTop: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" },
  appAvatar: { width: "36px", height: "36px", borderRadius: "50%", background: "#131b33", border: "1px solid #1e2d52", color: "#6b7fa3", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  appInfo: { flex: 1 },
  appName: { color: "#e8edf8", fontSize: "14px", fontWeight: "600" },
  appJob: { color: "#6b7fa3", fontSize: "12px" },
  appMeta: { display: "flex", gap: "16px", fontSize: "12px", color: "#3d4f73" },
  pill: { padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "500", whiteSpace: "nowrap" },
  drawer: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "12px", position: "sticky", top: "40px", minHeight: "400px" },
  drawerEmpty: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "400px", color: "#3d4f73", fontSize: "14px", gap: "12px" },
  drawerEmptyIcon: { fontSize: "32px" },
  drawerInner: { padding: "24px", display: "flex", flexDirection: "column", gap: "0" },
  drawerHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid #1e2d52" },
  drawerAvatar: { width: "44px", height: "44px", borderRadius: "50%", background: "#131b33", border: "1px solid #1e2d52", color: "#6b7fa3", fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  drawerName: { color: "#e8edf8", fontSize: "16px", fontWeight: "700" },
  drawerJob: { color: "#6b7fa3", fontSize: "13px" },
  drawerSection: { paddingBottom: "20px", marginBottom: "20px", borderBottom: "1px solid #1e2d52" },
  drawerSectionTitle: { color: "#0099fa", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" },
  statusBtns: { display: "flex", gap: "8px", flexWrap: "wrap" },
  statusBtn: { border: "1px solid transparent", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: "pointer", fontWeight: "500" },
  statusBtnActive: { outline: "2px solid #0099fa" },
  infoRow: { display: "flex", justifyContent: "space-between", gap: "12px", padding: "7px 0", borderBottom: "1px solid #131b33", fontSize: "13px" },
  infoLabel: { color: "#6b7fa3" },
  infoValue: { color: "#e8edf8", textAlign: "right", maxWidth: "60%" },
  coverNote: { background: "#131b33", border: "1px solid #1e2d52", borderRadius: "8px", padding: "12px", color: "#6b7fa3", fontSize: "13px", lineHeight: "1.6" },
  cvLink: { display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(0,153,250,0.12)", border: "1px solid rgba(0,153,250,0.25)", color: "#0099fa", borderRadius: "8px", padding: "10px 16px", fontSize: "13px", textDecoration: "none" },
  notesInput: { width: "100%", background: "#131b33", border: "1px solid #1e2d52", borderRadius: "8px", padding: "10px 13px", color: "#e8edf8", fontSize: "13px", outline: "none", fontFamily: "sans-serif", resize: "vertical", boxSizing: "border-box" },
  saveNotesBtn: { marginTop: "10px", background: "none", border: "1px solid #1e2d52", color: "#6b7fa3", borderRadius: "8px", padding: "8px 16px", fontSize: "12px", cursor: "pointer" },
  appliedDate: { color: "#3d4f73", fontSize: "12px", textAlign: "center", paddingTop: "8px" },
  empty: { color: "#6b7fa3", padding: "40px", textAlign: "center" },
};