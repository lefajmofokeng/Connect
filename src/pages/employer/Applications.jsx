import { useState, useEffect, useRef, useCallback } from "react";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import NotificationDrawer from "../../components/NotificationDrawer";

const FONT = '"Circular Std", "Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const COLUMNS = [
  { key: "new",         label: "New"         },
  { key: "reviewed",    label: "Reviewed"    },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "interview",   label: "Interview"   },
  { key: "hired",       label: "Hired"       },
  { key: "rejected",    label: "Rejected"    },
];

const STATUS_COLORS = {
  new:         { bg: "#e3f2fd", color: "#1967d2" },
  reviewed:    { bg: "#fef7e0", color: "#ea8600" },
  shortlisted: { bg: "#e6f4ea", color: "#0d652d" },
  interview:   { bg: "#f3e8fd", color: "#6200ea" },
  hired:       { bg: "#e6f4ea", color: "#0b5123" },
  rejected:    { bg: "#fce8e6", color: "#c5221f" },
};

export default function Applications() {
  const { user, employerProfile } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterJob, setFilterJob] = useState("all");
  const [selected, setSelected] = useState(null);
  const [actionMsg, setActionMsg] = useState("");
  const [actionMsgType, setActionMsgType] = useState("info");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const boardRef = useRef(null);
  const scrollAnimRef = useRef(null);

  useEffect(() => { if (user) fetchData(); }, [user]);
  useEffect(() => () => cancelAnimationFrame(scrollAnimRef.current), []);

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
      notify("Moved to " + status + ".", "success");
    } catch { notify("Update failed.", "error"); }
  };

  const saveNotes = async (appId, notes) => {
    try {
      await updateDoc(doc(db, "applications", appId), { notes, updatedAt: serverTimestamp() });
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, notes } : a));
      setSelected(prev => ({ ...prev, notes }));
      notify("Notes saved.", "success");
    } catch { notify("Save failed.", "error"); }
  };

  const deleteApplication = async (appId) => {
    try {
      await deleteDoc(doc(db, "applications", appId));
      setApplications(prev => prev.filter(a => a.id !== appId));
      setSelected(null); setConfirmDelete(null);
      notify("Deleted.", "success");
    } catch { notify("Deletion failed.", "error"); }
  };

  const scrollBoard = (dir) => {
    if (!boardRef.current) return;
    boardRef.current.scrollBy({ left: dir * 260, behavior: "smooth" });
  };

  const handleBoardDragOver = useCallback((e) => {
    if (!dragging || !boardRef.current) return;
    const board = boardRef.current;
    const rect = board.getBoundingClientRect();
    const ZONE = 80; const SPEED = 12;
    cancelAnimationFrame(scrollAnimRef.current);
    const tick = () => {
      if (e.clientX < rect.left + ZONE) board.scrollLeft -= SPEED;
      else if (e.clientX > rect.right - ZONE) board.scrollLeft += SPEED;
    };
    scrollAnimRef.current = requestAnimationFrame(tick);
  }, [dragging]);

  const handleDragStart = (e, app) => { setDragging(app); e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver  = (e, colKey) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOver(colKey); };
  const handleDrop = (e, colKey) => {
    e.preventDefault(); setDragOver(null);
    if (!dragging || dragging.status === colKey) { setDragging(null); return; }
    updateStatus(dragging.id, colKey); setDragging(null);
  };
  const handleDragEnd = () => { setDragging(null); setDragOver(null); cancelAnimationFrame(scrollAnimRef.current); };

  // ── CSV Export ────────────────────────────────────────────────────
  const exportCSV = () => {
    const cols = [
      "First Name","Last Name","Email","Phone","City","Province","Address",
      "Age","Gender","Qualification","Employment Status","Similar Experience",
      "Exp. Years","Exp. Company","Skills","Job Title","Status","Applied At",
    ];
    const rows = filtered.map(a => [
      a.firstName || "", a.lastName || "", a.email || "", a.phone || "",
      a.city || "", a.province || "", a.address || "",
      a.age || "", a.gender || "", a.qualification || "", a.employmentStatus || "",
      a.hasSimilarExperience || "", a.similarExperienceYears || "", a.similarExperienceCompany || "",
      (a.skills || []).join("; "),
      a.jobTitle || "", a.status || "",
      a.createdAt?.toDate?.().toLocaleString("en-ZA") || "",
    ]);
    const escape = v => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [cols, ...rows].map(r => r.map(escape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const jobLabel = filterJob === "all" ? "all-listings" : (jobs.find(j => j.id === filterJob)?.title || "listing").toLowerCase().replace(/\s+/g, "-");
    a.download = `vetted-applications-${jobLabel}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify("CSV exported.", "success");
  };

  // ── PDF Export per column ─────────────────────────────────────────
  const exportColumnPDF = (colKey, colLabel, apps) => {
    const company = employerProfile?.companyName || "Vetted";
    const jobLabel = filterJob === "all" ? "All Listings" : (jobs.find(j => j.id === filterJob)?.title || "");
    const date = new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });

    const rows = apps.map((a, i) => `
      <tr class="${i % 2 === 0 ? "even" : "odd"}">
        <td class="num">${i + 1}</td>
        <td><strong>${a.firstName || ""} ${a.lastName || ""}</strong></td>
        <td>${a.email || "—"}</td>
        <td>${a.phone || "—"}</td>
        <td>${a.city || "—"}${a.province ? `, ${a.province}` : ""}</td>
        <td>${a.age ? `${a.age} yrs` : "—"}</td>
        <td>${a.gender || "—"}</td>
        <td>${a.qualification || "—"}</td>
        <td>${a.employmentStatus || "—"}</td>
        <td>${a.hasSimilarExperience === "Yes" ? `Yes · ${a.similarExperienceYears || ""}${a.similarExperienceCompany ? ` @ ${a.similarExperienceCompany}` : ""}` : (a.hasSimilarExperience || "—")}</td>
        <td>${(a.skills || []).join(", ") || "—"}</td>
        <td>${a.createdAt?.toDate?.().toLocaleString("en-ZA", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) || "—"}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${colLabel} — ${company}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #202124; background: #fff; }
  .page { padding: 32px 36px; }

  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #202124; padding-bottom: 14px; margin-bottom: 20px; }
  .header-left .company { font-size: 18px; font-weight: 700; letter-spacing: -0.3px; }
  .header-left .doc-title { font-size: 13px; color: #5f6368; margin-top: 3px; }
  .header-right { text-align: right; }
  .header-right .stage-badge { display: inline-block; background: #202124; color: #fff; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 3px; letter-spacing: 0.5px; text-transform: uppercase; }
  .header-right .meta { font-size: 10px; color: #5f6368; margin-top: 5px; }

  /* Summary bar */
  .summary { display: flex; gap: 24px; background: #f8f9fa; border: 1px solid #e3e3e3; border-radius: 4px; padding: 10px 16px; margin-bottom: 20px; }
  .summary-item .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #9aa0a6; }
  .summary-item .value { font-size: 13px; font-weight: 700; color: #202124; margin-top: 1px; }

  /* Table */
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #202124; color: #ffffff; }
  thead th { padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; white-space: nowrap; }
  th.num, td.num { width: 24px; text-align: center; }
  tbody tr.even { background: #ffffff; }
  tbody tr.odd  { background: #f8f9fa; }
  tbody td { padding: 8px 10px; vertical-align: top; border-bottom: 1px solid #e3e3e3; line-height: 1.4; }
  tbody tr:last-child td { border-bottom: none; }

  /* Footer */
  .footer { margin-top: 24px; border-top: 1px solid #e3e3e3; padding-top: 10px; display: flex; justify-content: space-between; font-size: 10px; color: #9aa0a6; }

  /* No data */
  .empty { text-align: center; padding: 40px; color: #9aa0a6; font-size: 13px; }

  @media print {
    body { font-size: 10px; }
    .page { padding: 20px 24px; }
    @page { margin: 1.5cm; size: A4 landscape; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-left">
      <div class="company">${company}</div>
      <div class="doc-title">Candidate Report · ${jobLabel || "All Listings"}</div>
    </div>
    <div class="header-right">
      <div class="stage-badge">${colLabel}</div>
      <div class="meta">Generated ${date}</div>
    </div>
  </div>

  <div class="summary">
    <div class="summary-item">
      <div class="label">Stage</div>
      <div class="value">${colLabel}</div>
    </div>
    <div class="summary-item">
      <div class="label">Candidates</div>
      <div class="value">${apps.length}</div>
    </div>
    <div class="summary-item">
      <div class="label">Listing</div>
      <div class="value">${jobLabel || "All"}</div>
    </div>
    <div class="summary-item">
      <div class="label">Exported by</div>
      <div class="value">${company}</div>
    </div>
  </div>

  ${apps.length === 0
    ? `<div class="empty">No candidates in the ${colLabel} stage.</div>`
    : `<table>
    <thead>
      <tr>
        <th class="num">#</th>
        <th>Full Name</th>
        <th>Email</th>
        <th>Phone</th>
        <th>Location</th>
        <th>Age</th>
        <th>Gender</th>
        <th>Qualification</th>
        <th>Status</th>
        <th>Similar Exp.</th>
        <th>Skills</th>
        <th>Applied</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`}

  <div class="footer">
    <span>Vetted — vetted.co.za</span>
    <span>Confidential · For internal use only</span>
    <span>${colLabel} · ${apps.length} candidate${apps.length !== 1 ? "s" : ""}</span>
  </div>
</div>
<script>window.onload = () => window.print();</script>
</body>
</html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  };

  const filtered = filterJob === "all" ? applications : applications.filter(a => a.jobId === filterJob);
  const colApps = (colKey) => filtered.filter(a => a.status === colKey);

  if (loading) return (
    <div style={s.page}>
      <Sidebar profile={employerProfile} userId={user?.uid} />
      <div style={s.mainWrapper}><div style={s.empty}>Loading pipeline...</div></div>
    </div>
  );

  return (
    <div style={s.page}>
      <Sidebar profile={employerProfile} userId={user?.uid} />
      <div style={s.mainWrapper}>

        <div style={s.topbar}>
          <div>
            <h1 style={s.pageTitle}>Candidate Pipeline</h1>
            <p style={s.pageSub}>{filtered.length} candidate{filtered.length !== 1 ? "s" : ""}</p>
          </div>
          <div style={s.topbarRight}>
            <select style={s.filterSelect} value={filterJob} onChange={e => setFilterJob(e.target.value)}>
              <option value="all">All Listings</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
            <button style={s.exportBtn} onClick={exportCSV} title="Export all filtered applications as CSV">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export CSV
            </button>
            <button style={s.scrollBtn} onClick={() => scrollBoard(-1)} title="Scroll left">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button style={s.scrollBtn} onClick={() => scrollBoard(1)} title="Scroll right">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        {actionMsg && (
          <div style={{ ...s.snackbar, ...(actionMsgType === "error" ? { background: "#c5221f" } : actionMsgType === "success" ? { background: "#0d652d" } : {}) }}>
            {actionMsg}
          </div>
        )}

        <div ref={boardRef} style={s.board} onDragOver={handleBoardDragOver}>
          {COLUMNS.map(col => {
            const cards = colApps(col.key);
            const isOver = dragOver === col.key;
            return (
              <div
                key={col.key}
                style={{ ...s.column, ...(isOver ? s.columnOver : {}) }}
                onDragOver={e => handleDragOver(e, col.key)}
                onDrop={e => handleDrop(e, col.key)}
                onDragLeave={() => setDragOver(null)}
              >
                <div style={s.colHeader}>
                  <span style={s.colLabel}>{col.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={s.colCount}>{cards.length}</span>
                    {cards.length > 0 && (
                      <button
                        style={s.colPdfBtn}
                        onClick={() => exportColumnPDF(col.key, col.label, cards)}
                        title={`Download ${col.label} as PDF`}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <div style={s.colBody}>
                  {cards.length === 0 ? (
                    <div style={{ ...s.colEmpty, ...(isOver ? s.colEmptyOver : {}) }}>
                      {isOver ? "Release to move here" : "No candidates"}
                    </div>
                  ) : (
                    cards.map(app => {
                      const sc = STATUS_COLORS[app.status] || { bg: "#f1f3f4", color: "#5f6368" };
                      return (
                        <div
                          key={app.id}
                          draggable
                          onDragStart={e => handleDragStart(e, app)}
                          onDragEnd={handleDragEnd}
                          onClick={() => setSelected(app)}
                          style={{
                            ...s.card,
                            ...(selected?.id === app.id ? s.cardSelected : {}),
                            ...(dragging?.id === app.id ? s.cardDragging : {}),
                          }}
                        >
                          <div style={s.grip}>
                            {[0,1,2].map(i => (
                              <div key={i} style={s.gripRow}><div style={s.gripDot}/><div style={s.gripDot}/></div>
                            ))}
                          </div>
                          <div style={s.cardName}>{app.firstName} {app.lastName}</div>
                          <div style={s.cardJob}>{app.jobTitle}</div>
                          <div style={s.cardMeta}>
                            {app.city && <span style={s.cardMetaItem}>{app.city}</span>}
                            {app.experience && <span style={s.cardMetaItem}>{app.experience}</span>}
                          </div>
                          <div style={s.cardFooter}>
                            <span style={s.cardDate}>
                              {app.createdAt?.toDate?.().toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) || "—"}
                            </span>
                            <span style={{ ...s.cardPill, background: sc.bg, color: sc.color }}>{app.status}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <div style={s.drawer}>
          <div style={s.drawerTopbar}>
            <span style={s.drawerTopbarTitle}>Candidate</span>
            <button style={s.drawerClose} onClick={() => setSelected(null)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div style={s.drawerScroll}>
            <DrawerContent key={selected.id} app={selected} onStatusChange={updateStatus} onSaveNotes={saveNotes} onDelete={() => setConfirmDelete(selected)} />
          </div>
        </div>
      )}

      {confirmDelete && (
        <>
          <div style={s.overlay} onClick={() => setConfirmDelete(null)} />
          <div style={s.modal}>
            <div style={s.modalHead}>
              <span style={s.modalTitle}>Delete Application</span>
              <button style={s.modalClose} onClick={() => setConfirmDelete(null)}>x</button>
            </div>
            <div style={s.modalBody}>
              <p style={{ color: "#5f6368", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
                Permanently delete the application from <strong style={{ color: "#202124" }}>{confirmDelete.firstName} {confirmDelete.lastName}</strong>? This cannot be undone.
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button style={s.btnGhost} onClick={() => setConfirmDelete(null)}>Cancel</button>
                <button style={s.btnRed} onClick={() => deleteApplication(confirmDelete.id)}>Delete</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DrawerContent({ app, onStatusChange, onSaveNotes, onDelete }) {
  const [notes, setNotes] = useState(app.notes || "");
  const [activeDoc, setActiveDoc] = useState(null);
  useEffect(() => { setNotes(app.notes || ""); }, [app.id]);
  const sc = STATUS_COLORS[app.status] || { bg: "#f1f3f4", color: "#5f6368" };
  const allDocs = [];
  if (app.cvPath) allDocs.push({ key: "cv", url: app.cvPath, name: app.cvFilename || "CV / Resume", icon: "doc" });
  if (app.idPath) allDocs.push({ key: "id", url: app.idPath, name: app.idFilename || "ID Document", icon: "id" });
  if (app.optionalDocs) {
    Object.entries(app.optionalDocs).forEach(([key, docObj]) => {
      if (docObj?.url) allDocs.push({ key, url: docObj.url, name: docObj.filename || key, icon: "att" });
    });
  }
  const handleDownload = async (url, filename) => {
    try {
      const res = await fetch(url); const blob = await res.blob();
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
      a.download = filename; a.click(); URL.revokeObjectURL(a.href);
    } catch { window.open(url, "_blank"); }
  };
  return (
    <div style={dr.wrap}>
      <div style={dr.header}>
        <div style={{ ...dr.avatar, background: sc.bg, color: sc.color }}>{app.firstName?.[0]}{app.lastName?.[0]}</div>
        <div style={{ flex: 1 }}>
          <div style={dr.name}>{app.firstName} {app.lastName}</div>
          <div style={dr.job}>{app.jobTitle}</div>
        </div>
        <span style={{ ...dr.pill, background: sc.bg, color: sc.color }}>{app.status}</span>
      </div>
      <div style={dr.section}>
        <div style={dr.sectionTitle}>Move to Stage</div>
        <div style={dr.stageBtns}>
          {COLUMNS.map(col => {
            const c = STATUS_COLORS[col.key];
            return (
              <button key={col.key} style={{ ...dr.stageBtn, ...(app.status === col.key ? { background: c.bg, borderColor: c.color, color: c.color } : {}) }} onClick={() => onStatusChange(app.id, col.key)}>
                {col.label}
              </button>
            );
          })}
        </div>
      </div>
      <div style={dr.section}>
        <div style={dr.sectionTitle}>Details</div>
        <InfoRow label="Age"               value={app.age ? `${app.age} years old` : null} />
        <InfoRow label="Gender"            value={app.gender} />
        <InfoRow label="Email"             value={app.email} />
        <InfoRow label="Phone"             value={app.phone} />
        <InfoRow label="Address"           value={app.address} />
        <InfoRow label="City"              value={app.city} />
        <InfoRow label="Province"          value={app.province} />
        <InfoRow label="Qualification"     value={app.qualification} />
        <InfoRow label="Employment Status" value={app.employmentStatus} />
      </div>
      {(app.hasSimilarExperience) && (
        <div style={dr.section}>
          <div style={dr.sectionTitle}>Similar Experience</div>
          <InfoRow label="Has Similar Experience" value={app.hasSimilarExperience} />
          {app.hasSimilarExperience === "Yes" && <>
            <InfoRow label="Years of Experience" value={app.similarExperienceYears} />
            <InfoRow label="Previous Company"    value={app.similarExperienceCompany} />
          </>}
        </div>
      )}

      {app.skills?.length > 0 && (
        <div style={dr.section}>
          <div style={dr.sectionTitle}>Skills</div>
          <div style={dr.skillTags}>
            {app.skills.map(skill => (
              <span key={skill} style={dr.skillTag}>{skill}</span>
            ))}
          </div>
        </div>
      )}
      {app.coverNote && (
        <div style={dr.section}>
          <div style={dr.sectionTitle}>Cover Note</div>
          <div style={dr.coverNote}>{app.coverNote}</div>
        </div>
      )}
      {allDocs.length > 0 && (
        <div style={dr.section}>
          <div style={dr.sectionTitle}>Documents</div>
          <div style={dr.docList}>
            {allDocs.map(docItem => (
              <button key={docItem.key} style={{ ...dr.docBtn, ...(activeDoc?.key === docItem.key ? dr.docBtnActive : {}) }} onClick={() => setActiveDoc(activeDoc?.key === docItem.key ? null : docItem)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{docItem.name}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{activeDoc?.key === docItem.key ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}</svg>
              </button>
            ))}
          </div>
          {activeDoc && (
            <div style={dr.viewer}>
              <div style={dr.viewerBar}>
                <span style={dr.viewerName}>{activeDoc.name}</span>
                <button style={dr.downloadBtn} onClick={() => handleDownload(activeDoc.url, activeDoc.name)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download
                </button>
              </div>
              {activeDoc.name?.toLowerCase().endsWith(".pdf") ? (
                <iframe src={activeDoc.url} style={dr.iframe} title={activeDoc.name} />
              ) : activeDoc.name?.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                <img src={activeDoc.url} alt={activeDoc.name} style={{ width: "100%", display: "block" }} />
              ) : (
                <div style={{ padding: "20px", textAlign: "center" }}>
                  <p style={{ color: "#5f6368", fontSize: "13px", marginBottom: 10 }}>Preview unavailable.</p>
                  <button style={dr.downloadBtn} onClick={() => handleDownload(activeDoc.url, activeDoc.name)}>Download file</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <div style={dr.section}>
        <div style={dr.sectionTitle}>Internal Notes</div>
        <textarea style={dr.notes} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Private notes about this candidate..." rows={4} />
        <button style={dr.saveBtn} onClick={() => onSaveNotes(app.id, notes)}>Save Notes</button>
      </div>
      <div style={dr.footer}>
        <span style={dr.dateText}>Applied {app.createdAt?.toDate?.().toLocaleString("en-ZA", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) || "—"}</span>
        <button style={dr.deleteBtn} onClick={onDelete}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 5 }}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          Delete
        </button>
      </div>
    </div>
  );
}

function Sidebar({ profile, userId }) {
  const navigate = useNavigate();
  const path = window.location.pathname;
  const navItems = [
    { label: "Project Overview",        to: "/employer/dashboard",    icon: "home" },
    { label: "Deploy Job",              to: "/employer/post-job",     icon: "plus" },
    { label: "Database (Applications)", to: "/employer/applications", icon: "list" },
    { label: "Analytics",               to: "/employer/analytics",    icon: "chart" },
    { label: "Billing",                 to: "/employer/billing",      icon: "card" },
    { label: "Settings",                to: "/employer/profile",      icon: "gear" },
  ];
  const ICONS = {
    home: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    plus: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    list: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    chart: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    card: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    gear: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  };
  return (
    <div style={s.sidebar}>
      <div style={s.sidebarHeader}>
        <div style={s.projectSelector}>
          <div style={s.logoMark}>V</div>
          <div style={s.projectInfo}><div style={s.logoText}>Vetted</div><div style={s.logoSub}>Spark Plan</div></div>
          <div style={s.dropdownArrow}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
      </div>
      <nav style={s.nav}>
        <div style={s.navSectionTitle}>Develop</div>
        {navItems.map(item => (
          <button key={item.to} onClick={() => navigate(item.to)} style={{ ...s.navBtn, ...(path === item.to ? s.navBtnActive : {}) }}>
            <span style={{ ...s.navIcon, ...(path === item.to ? s.navIconActive : {}) }}>{ICONS[item.icon]}</span>
            <span style={s.navLabel}>{item.label}</span>
          </button>
        ))}
      </nav>
      <div style={s.sidebarBottom}>
        <div style={s.profileChip}>
          <div style={s.profileAvatarWrap}>
            {profile?.logoUrl ? <img src={profile.logoUrl} alt={profile.companyName} style={s.profileLogoImg} /> : <div style={s.profileAvatar}>{profile?.companyName?.[0] || "E"}</div>}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={s.profileName}>{profile?.companyName || "Employer"}</div>
            <div style={s.profileEmail}>Admin Access</div>
          </div>
        </div>
        <div style={{ marginBottom: "8px" }}><NotificationDrawer userId={userId} /></div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={dr.infoRow}>
      <span style={dr.infoLabel}>{label}</span>
      <span style={dr.infoValue}>{value}</span>
    </div>
  );
}


const dr = {
  wrap: { padding: "20px", fontFamily: FONT },
  header: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid #e3e3e3" },
  avatar: { width: "40px", height: "40px", borderRadius: "8px", fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  name: { color: "#202124", fontSize: "15px", fontWeight: "600", marginBottom: "2px" },
  job: { color: "#5f6368", fontSize: "12px" },
  pill: { padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.4px" },
  section: { paddingBottom: "18px", marginBottom: "18px", borderBottom: "1px solid #e3e3e3" },
  sectionTitle: { color: "#5f6368", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" },
  stageBtns: { display: "flex", gap: "6px", flexWrap: "wrap" },
  stageBtn: { background: "#ffffff", border: "1px solid #e3e3e3", color: "#3c4043", borderRadius: "4px", padding: "5px 10px", fontSize: "12px", cursor: "pointer", fontWeight: "600", transition: "all 0.15s", fontFamily: FONT },
  infoRow: { display: "flex", justifyContent: "space-between", gap: "16px", padding: "6px 0", borderBottom: "1px solid #f8f9fa", fontSize: "13px" },
  infoLabel: { color: "#5f6368" },
  infoValue: { color: "#202124", textAlign: "right", maxWidth: "55%", wordBreak: "break-word", fontWeight: "500" },
  coverNote: { background: "#f8f9fa", border: "1px solid #e3e3e3", borderRadius: "4px", padding: "12px", color: "#3c4043", fontSize: "13px", lineHeight: "1.6" },
  docList: { display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" },
  docBtn: { display: "flex", alignItems: "center", gap: "10px", background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "4px", padding: "9px 12px", color: "#3c4043", fontSize: "13px", fontWeight: "500", cursor: "pointer", width: "100%", transition: "all 0.15s", fontFamily: FONT },
  docBtnActive: { borderColor: "#1967d2", background: "#f8fbff", color: "#1967d2" },
  viewer: { background: "#f8f9fa", border: "1px solid #e3e3e3", borderRadius: "4px", overflow: "hidden" },
  viewerBar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderBottom: "1px solid #e3e3e3", background: "#ffffff" },
  viewerName: { color: "#202124", fontSize: "12px", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: "10px" },
  downloadBtn: { display: "inline-flex", alignItems: "center", gap: "5px", background: "transparent", border: "none", color: "#1a73e8", padding: "4px", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: FONT },
  iframe: { width: "100%", height: "360px", border: "none", display: "block" },
  notes: { width: "100%", background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "4px", padding: "10px 12px", color: "#202124", fontSize: "13px", outline: "none", fontFamily: FONT, resize: "vertical", boxSizing: "border-box", lineHeight: "1.5" },
  saveBtn: { marginTop: "10px", background: "#1a73e8", border: "none", color: "#ffffff", borderRadius: "4px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: FONT },
  footer: { display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "4px" },
  dateText: { color: "#9aa0a6", fontSize: "12px" },
  deleteBtn: { display: "inline-flex", alignItems: "center", background: "transparent", border: "none", color: "#c5221f", padding: "4px 0", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: FONT },
  skillTags: { display: "flex", flexWrap: "wrap", gap: "6px" },
  skillTag: { background: "#e3f2fd", border: "1px solid #bdd7f5", color: "#1967d2", borderRadius: "4px", padding: "3px 10px", fontSize: "12px", fontWeight: "500" },
};

const s = {
  page: { display: "flex", height: "100vh", overflow: "hidden", background: "#f4f5f7", fontFamily: FONT },
  sidebar: { width: "256px", flexShrink: 0, height: "100%", background: "#ffffff", borderRight: "1px solid #e3e3e3", display: "flex", flexDirection: "column", zIndex: 10 },
  sidebarHeader: { padding: "16px 20px", borderBottom: "1px solid #e3e3e3" },
  projectSelector: { display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", padding: "8px", borderRadius: "8px" },
  logoMark: { width: "32px", height: "32px", borderRadius: "6px", background: "#ffca28", color: "#d84315", fontWeight: "700", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" },
  projectInfo: { flex: 1, overflow: "hidden" },
  logoText: { color: "#202124", fontWeight: "600", fontSize: "14px", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" },
  logoSub: { color: "#5f6368", fontSize: "12px", fontWeight: "500" },
  dropdownArrow: { color: "#5f6368" },
  nav: { display: "flex", flexDirection: "column", gap: "2px", flex: 1, padding: "16px 12px", overflowY: "auto" },
  navSectionTitle: { color: "#5f6368", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", padding: "0 12px", marginBottom: "8px", marginTop: "8px" },
  navBtn: { background: "none", border: "none", color: "#3c4043", fontSize: "13px", fontWeight: "500", padding: "10px 12px", borderRadius: "6px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "12px", transition: "all 0.15s", fontFamily: FONT },
  navBtnActive: { background: "#e3f2fd", color: "#1967d2", fontWeight: "600" },
  navIcon: { color: "#5f6368", display: "flex", alignItems: "center", justifyContent: "center", width: "20px", flexShrink: 0 },
  navIconActive: { color: "#1967d2" },
  navLabel: { flex: 1 },
  sidebarBottom: { borderTop: "1px solid #e3e3e3", padding: "16px", background: "#f8f9fa" },
  profileChip: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" },
  profileAvatarWrap: { width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "1px solid #dadce0" },
  profileAvatar: { width: "100%", height: "100%", background: "#1a73e8", color: "#ffffff", fontWeight: "600", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" },
  profileLogoImg: { width: "100%", height: "100%", objectFit: "cover" },
  profileName: { color: "#202124", fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  profileEmail: { color: "#5f6368", fontSize: "12px" },
  mainWrapper: { flex: 1, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", padding: "28px 28px 0 28px" },
  topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", gap: "16px", flexShrink: 0 },
  pageTitle: { color: "#202124", fontSize: "22px", fontWeight: "600", margin: "0 0 2px", letterSpacing: "-0.4px" },
  pageSub: { color: "#5f6368", fontSize: "13px", margin: 0 },
  topbarRight: { display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 },
  filterSelect: { background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "4px", padding: "7px 10px", color: "#3c4043", fontSize: "13px", fontWeight: "500", outline: "none", cursor: "pointer", fontFamily: FONT },
  scrollBtn: { width: "32px", height: "32px", background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#5f6368", transition: "all 0.15s", flexShrink: 0 },
  exportBtn: { display: "inline-flex", alignItems: "center", gap: "6px", background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "4px", padding: "0 14px", height: "32px", fontSize: "13px", fontWeight: "600", color: "#3c4043", cursor: "pointer", fontFamily: FONT, whiteSpace: "nowrap", transition: "all 0.15s" },
  colPdfBtn: { width: "22px", height: "22px", background: "none", border: "1px solid #e3e3e3", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9aa0a6", transition: "all 0.15s", flexShrink: 0 },
  snackbar: { background: "#323232", color: "#ffffff", borderRadius: "4px", padding: "9px 14px", fontSize: "13px", display: "inline-flex", marginBottom: "14px", boxShadow: "0 2px 4px rgba(0,0,0,0.2)", flexShrink: 0, fontFamily: FONT },
  board: { display: "flex", gap: "12px", overflowX: "auto", overflowY: "hidden", flex: 1, paddingBottom: "28px" },
  column: { width: "220px", minWidth: "220px", flexShrink: 0, background: "#ffffff", borderRadius: "8px", border: "2px solid transparent", transition: "border-color 0.15s", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.08)", display: "flex", flexDirection: "column", maxHeight: "100%" },
  columnOver: { borderColor: "#1a73e8", boxShadow: "0 0 0 3px #e3f2fd" },
  colHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderBottom: "1px solid #f1f3f4", flexShrink: 0 },
  colLabel: { color: "#202124", fontSize: "13px", fontWeight: "600" },
  colCount: { background: "#f1f3f4", color: "#5f6368", borderRadius: "10px", padding: "1px 8px", fontSize: "11px", fontWeight: "700" },
  colBody: { padding: "8px", display: "flex", flexDirection: "column", gap: "7px", overflowY: "auto", flex: 1 },
  colEmpty: { border: "2px dashed #e3e3e3", borderRadius: "6px", padding: "18px 10px", textAlign: "center", color: "#9aa0a6", fontSize: "12px", transition: "all 0.15s" },
  colEmptyOver: { borderColor: "#1a73e8", background: "#f0f7ff", color: "#1a73e8", borderStyle: "solid" },
  card: { background: "#f8f9fa", border: "1px solid #e3e3e3", borderRadius: "6px", padding: "10px 10px 10px 12px", cursor: "grab", transition: "box-shadow 0.15s, border-color 0.15s", userSelect: "none", position: "relative" },
  cardSelected: { background: "#ffffff", borderColor: "#1a73e8", boxShadow: "0 2px 6px rgba(26,115,232,0.15)" },
  cardDragging: { opacity: 0.35, cursor: "grabbing" },
  grip: { position: "absolute", top: "10px", right: "8px", display: "flex", flexDirection: "column", gap: "3px", cursor: "grab" },
  gripRow: { display: "flex", gap: "3px" },
  gripDot: { width: "3px", height: "3px", borderRadius: "50%", background: "#dadce0" },
  cardName: { color: "#202124", fontSize: "13px", fontWeight: "600", marginBottom: "2px", paddingRight: "22px", lineHeight: "1.3" },
  cardJob: { color: "#5f6368", fontSize: "11px", marginBottom: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "22px" },
  cardMeta: { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "7px" },
  cardMetaItem: { color: "#9aa0a6", fontSize: "11px" },
  cardFooter: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  cardDate: { color: "#9aa0a6", fontSize: "10px", fontWeight: "500" },
  cardPill: { borderRadius: "4px", padding: "2px 6px", fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.3px" },
  drawer: { width: "360px", flexShrink: 0, height: "100vh", background: "#ffffff", borderLeft: "1px solid #e3e3e3", display: "flex", flexDirection: "column", boxShadow: "-4px 0 16px rgba(60,64,67,0.08)" },
  drawerTopbar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #e3e3e3", flexShrink: 0 },
  drawerTopbarTitle: { color: "#202124", fontSize: "13px", fontWeight: "600", fontFamily: FONT },
  drawerClose: { background: "none", border: "none", cursor: "pointer", color: "#5f6368", padding: "4px", display: "flex", borderRadius: "4px" },
  drawerScroll: { flex: 1, overflowY: "auto" },
  overlay: { position: "fixed", inset: 0, background: "rgba(32,33,36,0.45)", zIndex: 400, backdropFilter: "blur(2px)" },
  modal: { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#ffffff", borderRadius: "8px", width: "100%", maxWidth: "400px", zIndex: 401, boxShadow: "0 4px 24px rgba(0,0,0,0.15)" },
  modalHead: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e3e3e3" },
  modalTitle: { color: "#202124", fontSize: "14px", fontWeight: "600", fontFamily: FONT },
  modalClose: { background: "none", border: "none", color: "#5f6368", fontSize: "16px", cursor: "pointer" },
  modalBody: { padding: "20px" },
  btnRed: { background: "#d93025", color: "#ffffff", border: "none", borderRadius: "4px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: FONT },
  btnGhost: { background: "transparent", color: "#5f6368", border: "1px solid #e3e3e3", borderRadius: "4px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: FONT },
  empty: { color: "#5f6368", padding: "48px", textAlign: "center", fontSize: "14px", fontWeight: "500", fontFamily: FONT },
};