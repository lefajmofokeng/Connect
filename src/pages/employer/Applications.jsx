import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
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
  const [actionMsgType, setActionMsgType] = useState("info");
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appSnap, jobSnap] = await Promise.all([
        getDocs(query(collection(db, "applications"), where("employerId", "==", user.uid))),
        getDocs(query(collection(db, "jobs"), where("employerId", "==", user.uid))),
      ]);
      setApplications(appSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setJobs(jobSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const notify = (msg, type = "info") => {
    setActionMsg(msg); setActionMsgType(type);
    setTimeout(() => setActionMsg(""), 3000);
  };

  const updateStatus = async (appId, status) => {
    try {
      await updateDoc(doc(db, "applications", appId), { status, updatedAt: serverTimestamp() });
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
      if (selected?.id === appId) setSelected(prev => ({ ...prev, status }));
      notify(`Status updated to ${status}.`, "success");
    } catch (err) { notify("Update failed. Please try again.", "error"); }
  };

  const saveNotes = async (appId, notes) => {
    try {
      await updateDoc(doc(db, "applications", appId), { notes, updatedAt: serverTimestamp() });
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, notes } : a));
      setSelected(prev => ({ ...prev, notes }));
      notify("Internal notes synchronized.", "success");
    } catch (err) { notify("Sync failed. Check connection.", "error"); }
  };

  const deleteApplication = async (appId) => {
    try {
      await deleteDoc(doc(db, "applications", appId));
      setApplications(prev => prev.filter(a => a.id !== appId));
      setSelected(null);
      setConfirmDelete(null);
      notify("Document permanently deleted.", "success");
    } catch (err) { notify("Deletion failed.", "error"); }
  };

  const filtered = applications.filter(a => {
    if (filterJob !== "all" && a.jobId !== filterJob) return false;
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    return true;
  });

  return (
    <div style={s.page}>
      <Sidebar profile={employerProfile} />

      <div style={s.mainWrapper}>
        <div style={s.mainInner}>

          {/* Topbar */}
          <div style={s.topbar}>
            <div>
              <h1 style={s.pageTitle}>Database: Applications</h1>
              <p style={s.pageSub}>
                {applications.length} document{applications.length !== 1 ? "s" : ""} retrieved in this collection
              </p>
            </div>
          </div>

          {/* Snackbar */}
          {actionMsg && (
            <div style={{
              ...s.actionMsg,
              ...(actionMsgType === "error" ? s.actionMsgError : {}),
            }}>
              {actionMsg}
            </div>
          )}

          {/* ── Filter bar ── */}
          <div style={s.filterBar}>

            {/* Row 1: Status tab bar */}
            <div style={s.tabBar}>
              {STATUSES.map(st => {
                const count = st === "all"
                  ? applications.filter(a => filterJob === "all" || a.jobId === filterJob).length
                  : applications.filter(a => a.status === st && (filterJob === "all" || a.jobId === filterJob)).length;
                const isActive = filterStatus === st;
                return (
                  <button
                    key={st}
                    style={{ ...s.tabBtn, ...(isActive ? s.tabBtnActive : {}) }}
                    onClick={() => setFilterStatus(st)}
                  >
                    {st === "all" ? "All" : st.charAt(0).toUpperCase() + st.slice(1)}
                    {count > 0 && (
                      <span style={{ ...s.tabCount, ...(isActive ? s.tabCountActive : {}) }}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Job selector pushed to the right inside the tab bar */}
              <div style={s.tabBarRight}>
                <select
                  style={s.jobSelect}
                  value={filterJob}
                  onChange={e => setFilterJob(e.target.value)}
                >
                  <option value="all">All Deployments</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
                <span style={s.matchCount}>{filtered.length} match{filtered.length !== 1 ? "es" : ""}</span>
              </div>
            </div>
          </div>

          {/* ── Main layout: list + drawer ── */}
          <div style={s.layout}>

            {/* Application List */}
            <div style={s.listCol}>
              {loading ? (
                <div style={s.empty}>Fetching documents...</div>
              ) : filtered.length === 0 ? (
                <div style={s.empty}>No documents match the current query parameters.</div>
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
                      <span>📅 {app.createdAt?.toDate?.().toLocaleDateString("en-ZA") || "—"}</span>
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
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#bdc1c6" strokeWidth="1.5" style={{ marginBottom: 16 }}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <p style={{ color: "#5f6368", fontSize: "14px", margin: 0, fontWeight: "500" }}>
                    Select a document node to view details
                  </p>
                </div>
              ) : (
                <DrawerContent
                  key={selected.id}
                  app={selected}
                  onStatusChange={updateStatus}
                  onSaveNotes={saveNotes}
                  onDelete={() => setConfirmDelete(selected)}
                />
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <>
          <div style={s.modalOverlay} onClick={() => setConfirmDelete(null)} />
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>Delete Document</div>
              <button style={s.modalClose} onClick={() => setConfirmDelete(null)}>✕</button>
            </div>
            <div style={s.modalBody}>
              <p style={{ color: "#5f6368", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
                Are you sure you want to permanently delete the node for{" "}
                <strong style={{ color: "#202124" }}>{confirmDelete.firstName} {confirmDelete.lastName}</strong>?
                This action cannot be reversed.
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button style={s.btnGhost} onClick={() => setConfirmDelete(null)}>Cancel</button>
                <button style={s.btnRed} onClick={() => deleteApplication(confirmDelete.id)}>Delete Data</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Drawer Content ─────────────────────────────────────────────────────
function DrawerContent({ app, onStatusChange, onSaveNotes, onDelete }) {
  const [notes, setNotes] = useState(app.notes || "");
  const [activeDoc, setActiveDoc] = useState(null);
  const [docLoading, setDocLoading] = useState(false);

  useEffect(() => { setNotes(app.notes || ""); }, [app.id]);

  const allDocs = [];
  if (app.cvPath) allDocs.push({ key: "cv", url: app.cvPath, name: app.cvFilename || "CV / Resume", icon: "📄" });
  if (app.idPath) allDocs.push({ key: "id", url: app.idPath, name: app.idFilename || "ID Document", icon: "🪪" });
  if (app.optionalDocs) {
    Object.entries(app.optionalDocs).forEach(([key, docObj]) => {
      if (docObj?.url) allDocs.push({ key, url: docObj.url, name: docObj.filename || key, icon: "📎" });
    });
  }

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      window.open(url, "_blank");
    }
  };

  const isPdf = (name) => name?.toLowerCase().endsWith(".pdf");

  return (
    <div style={s.drawerInner}>
      {/* Header */}
      <div style={s.drawerHeader}>
        <div style={s.drawerAvatar}>{app.firstName?.[0]}{app.lastName?.[0]}</div>
        <div style={{ flex: 1 }}>
          <div style={s.drawerName}>{app.firstName} {app.lastName}</div>
          <div style={s.drawerJob}>{app.jobTitle}</div>
        </div>
        <span style={{ ...s.pill, ...pillColor(app.status) }}>{app.status}</span>
      </div>

      {/* Status */}
      <div style={s.drawerSection}>
        <div style={s.drawerSectionTitle}>State Management</div>
        <div style={s.statusBtns}>
          {["reviewed", "shortlisted", "rejected", "hired"].map(st => (
            <button
              key={st}
              style={{ ...s.statusBtn, ...(app.status === st ? s.statusBtnActive : {}) }}
              onClick={() => onStatusChange(app.id, st)}
            >
              {st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Personal Details */}
      <div style={s.drawerSection}>
        <div style={s.drawerSectionTitle}>Payload Data</div>
        <InfoRow label="Email" value={app.email} />
        <InfoRow label="Phone" value={app.phone} />
        <InfoRow label="City" value={app.city} />
        <InfoRow label="Notice Period" value={app.notice} />
        <InfoRow label="Experience" value={app.experience} />
        <InfoRow label="Salary Expectation" value={app.salaryExpectation} />
      </div>

      {/* Cover Note */}
      {app.coverNote && (
        <div style={s.drawerSection}>
          <div style={s.drawerSectionTitle}>Cover Note String</div>
          <div style={s.coverNote}>{app.coverNote}</div>
        </div>
      )}

      {/* Documents — Inline Viewer */}
      {allDocs.length > 0 && (
        <div style={s.drawerSection}>
          <div style={s.drawerSectionTitle}>Storage Assets</div>
          <div style={s.docTabs}>
            {allDocs.map(d => (
              <button
                key={d.key}
                style={{ ...s.docTab, ...(activeDoc?.key === d.key ? s.docTabActive : {}) }}
                onClick={() => {
                  if (activeDoc?.key === d.key) {
                    setActiveDoc(null);
                  } else {
                    setDocLoading(true);
                    setActiveDoc(d);
                  }
                }}
              >
                <span>{d.icon}</span>
                <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                <span style={{ fontSize: "11px", opacity: activeDoc?.key === d.key ? 1 : 0.6 }}>
                  {activeDoc?.key === d.key ? "▲ Hide" : "▼ View"}
                </span>
              </button>
            ))}
          </div>

          {activeDoc && (
            <div style={s.docViewer}>
              <div style={s.docViewerToolbar}>
                <span style={s.docViewerName}>{activeDoc.name}</span>
                <button style={s.docDownloadBtn} onClick={() => handleDownload(activeDoc.url, activeDoc.name)} title="Download">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download Asset
                </button>
              </div>

              {isPdf(activeDoc.name) ? (
                <div style={{ position: "relative" }}>
                  {docLoading && (
                    <div style={s.docLoadingOverlay}>
                      <div style={s.docLoadingSpinner} />
                    </div>
                  )}
                  <iframe
                    src={`${activeDoc.url}#toolbar=0&navpanes=0`}
                    style={s.docIframe}
                    title={activeDoc.name}
                    onLoad={() => setDocLoading(false)}
                  />
                </div>
              ) : (
                activeDoc.name?.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                  <img src={activeDoc.url} alt={activeDoc.name} style={s.docImage} onLoad={() => setDocLoading(false)} />
                ) : (
                  <div style={s.docUnsupported}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="1.5" style={{ marginBottom: 10 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <div style={{ color: "#5f6368", fontSize: "14px", marginBottom: 16 }}>
                      Preview rendering not supported for this blob type
                    </div>
                    <button style={s.docDownloadBtn} onClick={() => handleDownload(activeDoc.url, activeDoc.name)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      Download to local
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* Internal Notes */}
      <div style={s.drawerSection}>
        <div style={s.drawerSectionTitle}>Internal Configuration Notes</div>
        <textarea
          style={s.notesInput}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Append private node variables here..."
          rows={4}
        />
        <button style={s.saveNotesBtn} onClick={() => onSaveNotes(app.id, notes)}>
          Commit Notes
        </button>
      </div>

      {/* Footer */}
      <div style={s.drawerFooter}>
        <div style={s.appliedDate}>
          Timestamp: {app.createdAt?.toDate?.().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" }) || "—"}
        </div>
        <button style={s.deleteAppBtn} onClick={onDelete}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          Delete Node
        </button>
      </div>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────
function Sidebar({ profile }) {
  const navigate = useNavigate();
  const path = window.location.pathname;
  const navItems = [
    { label: "Project Overview",        to: "/employer/dashboard",    icon: "⌂" },
    { label: "Deploy Job",              to: "/employer/post-job",     icon: "+" },
    { label: "Database (Applications)", to: "/employer/applications", icon: "≡" },
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
            <span style={{ ...s.navIcon, ...(path === item.to ? s.navIconActive : {}) }}>{item.icon}</span>
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
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────
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
    new:         { background: "#e3f2fd", color: "#1967d2" },
    reviewed:    { background: "#fef7e0", color: "#ea8600" },
    shortlisted: { background: "#e6f4ea", color: "#0d652d" },
    rejected:    { background: "#fce8e6", color: "#c5221f" },
    hired:       { background: "#ceead6", color: "#0b5123" },
  };
  return map[status] || { background: "#f1f3f4", color: "#3c4043" };
}

// ── Styles ─────────────────────────────────────────────────────────────
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
  profileChip: { display: "flex", alignItems: "center", gap: "10px" },
  profileAvatarWrap: { width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "1px solid #dadce0" },
  profileAvatar: { width: "100%", height: "100%", background: "#1a73e8", color: "#ffffff", fontWeight: "600", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" },
  profileLogoImg: { width: "100%", height: "100%", objectFit: "cover", background: "#ffffff" },
  profileName: { color: "#202124", fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  profileEmail: { color: "#5f6368", fontSize: "12px" },

  // ── Main Content ──
  mainWrapper: { flex: 1, height: "100%", overflowY: "auto", position: "relative" },
  mainInner: { padding: "32px 48px", maxWidth: "1400px", margin: "0 auto" },

  topbar: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", gap: "16px" },
  pageTitle: { color: "#202124", fontSize: "24px", fontWeight: "600", margin: "0 0 4px", letterSpacing: "-0.5px" },
  pageSub: { color: "#5f6368", fontSize: "14px", margin: 0 },

  actionMsg: { background: "#323232", color: "#ffffff", borderRadius: "4px", padding: "12px 16px", fontSize: "13px", display: "inline-flex", alignItems: "center", marginBottom: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" },
  actionMsgError: { background: "#d93025" },

  // ── Filter bar ──
  filterBar: { marginBottom: "20px" },

  // ── Tab Bar (Firebase-style horizontal filters) ──
  tabBar: {
    display: "flex",
    alignItems: "center",
    background: "#ffffff",
    borderRadius: "8px",
    border: "1px solid #e3e3e3",
    padding: "0 8px",
    boxShadow: "0 1px 2px 0 rgba(60,64,67,0.06)",
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
    padding: "12px 14px",
    cursor: "pointer",
    transition: "color 0.15s",
    marginBottom: "-1px",
    whiteSpace: "nowrap",
    fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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

  // Job selector + match count pushed to right
  tabBarRight: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    paddingLeft: "12px",
    borderLeft: "1px solid #e3e3e3",
  },
  jobSelect: {
    background: "#ffffff",
    border: "1px solid #e3e3e3",
    borderRadius: "4px",
    padding: "6px 10px",
    color: "#3c4043",
    fontSize: "12px",
    fontWeight: "500",
    outline: "none",
    cursor: "pointer",
    fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  matchCount: {
    color: "#9aa0a6",
    fontSize: "12px",
    fontWeight: "500",
    whiteSpace: "nowrap",
  },

  // ── Layout Grid ──
  layout: { display: "grid", gridTemplateColumns: "1fr 480px", gap: "24px", alignItems: "start" },
  listCol: { display: "flex", flexDirection: "column", gap: "12px" },

  // ── Application Cards ──
  appCard: { background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "8px", padding: "16px", cursor: "pointer", transition: "all 0.2s ease", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1)" },
  appCardActive: { borderColor: "#1967d2", background: "#f8fbff", boxShadow: "0 1px 3px 1px rgba(25,103,210,0.15), 0 1px 2px 0 rgba(25,103,210,0.1)" },
  appCardTop: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" },
  appAvatar: { width: "36px", height: "36px", borderRadius: "6px", background: "#f8f9fa", border: "1px solid #e3e3e3", color: "#3c4043", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  appInfo: { flex: 1 },
  appName: { color: "#202124", fontSize: "15px", fontWeight: "600", marginBottom: "2px" },
  appJob: { color: "#5f6368", fontSize: "13px", fontWeight: "500" },
  appMeta: { display: "flex", gap: "20px", fontSize: "12px", color: "#5f6368", fontWeight: "500" },
  pill: { padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" },

  // ── Drawer ──
  drawer: { background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "8px", position: "sticky", top: "0", maxHeight: "calc(100vh - 120px)", overflowY: "auto", boxShadow: "0 1px 3px 1px rgba(60,64,67,0.05)" },
  drawerEmpty: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "500px", padding: "32px", textAlign: "center" },
  drawerInner: { padding: "24px", display: "flex", flexDirection: "column", gap: "0" },
  drawerHeader: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid #e3e3e3" },
  drawerAvatar: { width: "48px", height: "48px", borderRadius: "8px", background: "#f8f9fa", border: "1px solid #e3e3e3", color: "#3c4043", fontSize: "16px", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  drawerName: { color: "#202124", fontSize: "18px", fontWeight: "600", marginBottom: "4px" },
  drawerJob: { color: "#5f6368", fontSize: "13px", fontWeight: "500" },
  drawerSection: { paddingBottom: "24px", marginBottom: "24px", borderBottom: "1px solid #e3e3e3" },
  drawerSectionTitle: { color: "#5f6368", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px" },

  // ── Drawer Actions ──
  statusBtns: { display: "flex", gap: "8px", flexWrap: "wrap" },
  statusBtn: { background: "#ffffff", border: "1px solid #e3e3e3", color: "#3c4043", borderRadius: "4px", padding: "8px 12px", fontSize: "13px", cursor: "pointer", fontWeight: "600", transition: "all 0.2s" },
  statusBtnActive: { background: "#e3f2fd", borderColor: "#1967d2", color: "#1967d2" },
  infoRow: { display: "flex", justifyContent: "space-between", gap: "16px", padding: "8px 0", borderBottom: "1px solid #f8f9fa", fontSize: "13px" },
  infoLabel: { color: "#5f6368" },
  infoValue: { color: "#202124", textAlign: "right", maxWidth: "60%", wordBreak: "break-word", fontWeight: "500" },
  coverNote: { background: "#f8f9fa", border: "1px solid #e3e3e3", borderRadius: "6px", padding: "16px", color: "#3c4043", fontSize: "13px", lineHeight: "1.6" },

  // ── Document Viewer ──
  docTabs: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" },
  docTab: { display: "flex", alignItems: "center", gap: "12px", background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "4px", padding: "10px 16px", color: "#3c4043", fontSize: "13px", fontWeight: "500", cursor: "pointer", textAlign: "left", width: "100%", transition: "all 0.2s", fontFamily: "inherit" },
  docTabActive: { borderColor: "#1967d2", background: "#f8fbff", color: "#1967d2" },
  docViewer: { background: "#f8f9fa", border: "1px solid #e3e3e3", borderRadius: "6px", overflow: "hidden", marginTop: "8px" },
  docViewerToolbar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid #e3e3e3", background: "#ffffff" },
  docViewerName: { color: "#202124", fontSize: "13px", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: "16px" },
  docDownloadBtn: { display: "inline-flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", color: "#1a73e8", padding: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", transition: "opacity 0.2s" },
  docIframe: { width: "100%", height: "480px", border: "none", display: "block" },
  docImage: { width: "100%", display: "block" },
  docLoadingOverlay: { position: "absolute", inset: 0, background: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 },
  docLoadingSpinner: { width: "24px", height: "24px", border: "3px solid #e3f2fd", borderTop: "3px solid #1967d2", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  docUnsupported: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px", textAlign: "center" },

  // ── Notes ──
  notesInput: { width: "100%", background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "4px", padding: "12px", color: "#202124", fontSize: "13px", outline: "none", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", transition: "border-color 0.2s" },
  saveNotesBtn: { marginTop: "12px", background: "#1a73e8", border: "none", color: "#ffffff", borderRadius: "4px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "background 0.2s", display: "inline-block", alignSelf: "flex-start" },

  // ── Drawer Footer ──
  drawerFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px", gap: "16px" },
  appliedDate: { color: "#5f6368", fontSize: "12px", fontWeight: "500" },
  deleteAppBtn: { display: "inline-flex", alignItems: "center", background: "transparent", border: "none", color: "#d93025", padding: "6px 0", fontSize: "13px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", transition: "opacity 0.2s" },

  // ── Modal ──
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(32,33,36,0.5)", zIndex: 400, backdropFilter: "blur(2px)" },
  modal: { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#ffffff", border: "none", borderRadius: "8px", width: "100%", maxWidth: "420px", zIndex: 401, boxShadow: "0 4px 6px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)" },
  modalHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #e3e3e3" },
  modalTitle: { color: "#202124", fontSize: "16px", fontWeight: "600" },
  modalClose: { background: "none", border: "none", color: "#5f6368", fontSize: "20px", cursor: "pointer" },
  modalBody: { padding: "24px" },
  btnRed: { background: "#d93025", color: "#ffffff", border: "none", borderRadius: "4px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
  btnGhost: { background: "transparent", color: "#5f6368", border: "1px solid transparent", borderRadius: "4px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer" },

  empty: { color: "#5f6368", padding: "48px", textAlign: "center", fontSize: "14px", fontWeight: "500" },
};