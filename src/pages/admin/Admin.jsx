import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { sendSignInLinkToEmail, signOut } from "firebase/auth";
import { db, auth } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const TABS = ["Expressions of Interest", "Pending Verification", "Employers", "Jobs", "Invoices"];
const JOB_PRICE = 450;

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [invites, setInvites] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [actionMsgType, setActionMsgType] = useState("info"); // info | success | error
  const [selectedInvite, setSelectedInvite] = useState(null);
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'job'|'employer', id, name }
  const [jobSearch, setJobSearch] = useState("");
  const [empSearch, setEmpSearch] = useState("");

  useEffect(() => { fetchAll(); }, []);

  const handleSignOut = async () => { await signOut(auth); navigate("/admin/login"); };

  const notify = (msg, type = "success") => {
    setActionMsg(msg); setActionMsgType(type);
    setTimeout(() => setActionMsg(""), 4000);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [invSnap, empSnap, jobSnap] = await Promise.all([
        getDocs(query(collection(db, "invites"), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, "employers"), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, "jobs"), orderBy("createdAt", "desc"))),
      ]);
      setInvites(invSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setEmployers(empSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setJobs(jobSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error("Fetch error:", err); }
    setLoading(false);
  };

  // ── Invite actions ──────────────────────────────────
  const sendInvite = async (invite) => {
    try {
      const actionCodeSettings = {
        url: `https://jobs-42a5d.web.app/employer/register?email=${encodeURIComponent(invite.email)}&invited=true`,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, invite.email, actionCodeSettings);
      await updateDoc(doc(db, "invites", invite.id), { status: "invited", invitedAt: new Date() });
      notify(`Invite sent to ${invite.email}`);
      fetchAll();
    } catch (err) { notify("Failed to send invite: " + err.message, "error"); }
  };

  const updateInviteStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "invites", id), { status });
      notify(`Status updated to ${status}`);
      setSelectedInvite(prev => prev?.id === id ? { ...prev, status } : prev);
      fetchAll();
    } catch (err) { notify("Update failed: " + err.message, "error"); }
  };

  // ── Employer actions ────────────────────────────────
  const approveEmployer = async (id) => {
    try {
      await updateDoc(doc(db, "employers", id), { verificationStatus: "approved", updatedAt: new Date() });
      notify("Employer approved.");
      setSelectedEmployer(prev => prev?.id === id ? { ...prev, verificationStatus: "approved" } : prev);
      fetchAll();
    } catch (err) { notify("Update failed: " + err.message, "error"); }
  };

  const rejectEmployer = async (id) => {
    try {
      await updateDoc(doc(db, "employers", id), { verificationStatus: "rejected", updatedAt: new Date() });
      notify("Employer rejected.");
      setSelectedEmployer(prev => prev?.id === id ? { ...prev, verificationStatus: "rejected" } : prev);
      fetchAll();
    } catch (err) { notify("Update failed: " + err.message, "error"); }
  };

  const toggleEmployerDisabled = async (emp) => {
    const disabled = !emp.disabled;
    try {
      await updateDoc(doc(db, "employers", emp.id), { disabled, updatedAt: new Date() });
      notify(disabled ? `${emp.companyName} has been disabled.` : `${emp.companyName} has been re-enabled.`);
      setSelectedEmployer(prev => prev?.id === emp.id ? { ...prev, disabled } : prev);
      setEmployers(prev => prev.map(e => e.id === emp.id ? { ...e, disabled } : e));
    } catch (err) { notify("Update failed: " + err.message, "error"); }
  };

  const markEmployerPaid = async (emp) => {
    try {
      await updateDoc(doc(db, "employers", emp.id), { paymentStatus: "paid", lastPaidAt: new Date(), updatedAt: new Date() });
      notify(`${emp.companyName} marked as paid.`);
      setEmployers(prev => prev.map(e => e.id === emp.id ? { ...e, paymentStatus: "paid" } : e));
    } catch (err) { notify("Update failed: " + err.message, "error"); }
  };

  const markEmployerUnpaid = async (emp) => {
    try {
      await updateDoc(doc(db, "employers", emp.id), { paymentStatus: "unpaid", updatedAt: new Date() });
      notify(`${emp.companyName} marked as unpaid.`);
      setEmployers(prev => prev.map(e => e.id === emp.id ? { ...e, paymentStatus: "unpaid" } : e));
    } catch (err) { notify("Update failed: " + err.message, "error"); }
  };

  const deleteEmployer = async (id) => {
    try {
      await updateDoc(doc(db, "employers", id), { deleted: true, verificationStatus: "deleted", updatedAt: new Date() });
      notify("Employer removed.");
      setEmployers(prev => prev.filter(e => e.id !== id));
      setSelectedEmployer(null);
      setConfirmDelete(null);
    } catch (err) { notify("Delete failed: " + err.message, "error"); }
  };

  // ── Job actions ─────────────────────────────────────
  const setJobStatus = async (jobId, status) => {
    try {
      await updateDoc(doc(db, "jobs", jobId), { status, updatedAt: new Date() });
      notify(`Job ${status === "live" ? "published" : status === "cancelled" ? "cancelled" : "updated"}.`);
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status } : j));
    } catch (err) { notify("Update failed: " + err.message, "error"); }
  };

  const saveJobEdit = async () => {
    if (!editingJob) return;
    try {
      await updateDoc(doc(db, "jobs", editingJob.id), {
        title: editingJob.title,
        closes: editingJob.closes,
        status: editingJob.status,
        updatedAt: new Date(),
      });
      notify("Job updated successfully.");
      setJobs(prev => prev.map(j => j.id === editingJob.id ? { ...j, ...editingJob } : j));
      setEditingJob(null);
    } catch (err) { notify("Update failed: " + err.message, "error"); }
  };

  const deleteJob = async (jobId) => {
    try {
      await deleteDoc(doc(db, "jobs", jobId));
      notify("Job deleted permanently.");
      setJobs(prev => prev.filter(j => j.id !== jobId));
      setConfirmDelete(null);
    } catch (err) { notify("Delete failed: " + err.message, "error"); }
  };

  // ── Derived data ────────────────────────────────────
  const pendingInvites = invites.filter(i => i.status === "pending");
  const pendingVerification = employers.filter(e => e.verificationStatus === "submitted");
  const approvedEmployers = employers.filter(e => e.verificationStatus === "approved" && !e.deleted);
  const allActiveEmployers = employers.filter(e => !e.deleted);

  const filteredJobs = jobs.filter(j => {
    const term = jobSearch.toLowerCase();
    return !term || j.title?.toLowerCase().includes(term) || j.employerName?.toLowerCase().includes(term);
  });

  const filteredEmps = allActiveEmployers.filter(e => {
    const term = empSearch.toLowerCase();
    return !term || e.companyName?.toLowerCase().includes(term) || e.email?.toLowerCase().includes(term);
  });

  return (
    <div style={s.page}>

      {/* ── Sidebar ── */}
      <div style={s.sidebar}>
        <div style={s.sidebarLogo}>
          Cronos Jobs
          <span style={s.sidebarSub}>Admin Panel</span>
        </div>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(i); setSelectedInvite(null); setSelectedEmployer(null); setEditingJob(null); }}
            style={{ ...s.navBtn, ...(activeTab === i ? s.navBtnActive : {}) }}
          >
            <span>{tab}</span>
            {i === 0 && pendingInvites.length > 0 && <span style={s.badge}>{pendingInvites.length}</span>}
            {i === 1 && pendingVerification.length > 0 && <span style={s.badge}>{pendingVerification.length}</span>}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => navigate("/")} style={s.navBtn}>← Back to Site</button>
        <button onClick={handleSignOut} style={{ ...s.navBtn, color: "#ff4f6a" }}>Sign Out</button>
      </div>

      {/* ── Main ── */}
      <div style={s.main}>
        <div style={s.topbar}>
          <h1 style={s.pageTitle}>{TABS[activeTab]}</h1>
          {actionMsg && (
            <div style={{ ...s.actionMsg, ...(actionMsgType === "error" ? s.actionMsgError : actionMsgType === "success" ? s.actionMsgSuccess : {}) }}>
              {actionMsg}
              <button style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, marginLeft: 8 }} onClick={() => setActionMsg("")}>✕</button>
            </div>
          )}
        </div>

        {loading ? <div style={s.empty}>Loading...</div> : (
          <>

            {/* ── Tab 0 — Expressions of Interest ── */}
            {activeTab === 0 && (
              <div style={s.splitLayout}>
                <div style={s.listCol}>
                  {invites.length === 0 ? <div style={s.empty}>No expressions of interest yet.</div> : (
                    invites.map(inv => (
                      <div
                        key={inv.id}
                        style={{ ...s.listCard, ...(selectedInvite?.id === inv.id ? s.listCardActive : {}) }}
                        onClick={() => setSelectedInvite(inv)}
                      >
                        <div style={s.listCardRow}>
                          <div style={s.avatar}>{inv.firstName?.[0]}{inv.lastName?.[0]}</div>
                          <div style={s.listCardInfo}>
                            <div style={s.listCardName}>{inv.firstName} {inv.lastName}</div>
                            <div style={s.listCardSub}>{inv.companyName}</div>
                          </div>
                          <span style={{ ...s.pill, ...pillColor(inv.status) }}>{inv.status}</span>
                        </div>
                        <div style={s.listCardMeta}>
                          <span>{inv.province}</span>
                          <span>{inv.industry}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div style={s.drawer}>
                  {!selectedInvite ? (
                    <div style={s.drawerEmpty}><p>Select a submission to review</p></div>
                  ) : (
                    <div style={s.drawerInner}>
                      <div style={s.drawerHeader}>
                        <div style={s.avatar}>{selectedInvite.firstName?.[0]}{selectedInvite.lastName?.[0]}</div>
                        <div style={{ flex: 1 }}>
                          <div style={s.drawerName}>{selectedInvite.firstName} {selectedInvite.lastName}</div>
                          <div style={s.drawerSub}>{selectedInvite.companyName}</div>
                        </div>
                        <span style={{ ...s.pill, ...pillColor(selectedInvite.status) }}>{selectedInvite.status}</span>
                      </div>
                      <Section title="Contact">
                        <InfoRow label="Email" value={selectedInvite.email} />
                        <InfoRow label="Phone" value={selectedInvite.phone} />
                      </Section>
                      <Section title="Company">
                        <InfoRow label="Company" value={selectedInvite.companyName} />
                        <InfoRow label="Industry" value={selectedInvite.industry} />
                        <InfoRow label="Province" value={selectedInvite.province} />
                        <InfoRow label="Size" value={selectedInvite.companySize} />
                      </Section>
                      {selectedInvite.message && (
                        <Section title="Message">
                          <div style={s.messageBox}>{selectedInvite.message}</div>
                        </Section>
                      )}
                      <Section title="Submitted">
                        <div style={s.dateText}>{selectedInvite.createdAt?.toDate?.().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" }) || "—"}</div>
                      </Section>
                      <div style={s.drawerActions}>
                        {selectedInvite.status === "pending" && (
                          <>
                            <button style={s.btnGreen} onClick={() => updateInviteStatus(selectedInvite.id, "approved")}>✓ Approve</button>
                            <button style={s.btnRed} onClick={() => updateInviteStatus(selectedInvite.id, "rejected")}>✕ Reject</button>
                          </>
                        )}
                        {selectedInvite.status === "approved" && (
                          <button style={s.btnBlue} onClick={() => sendInvite(selectedInvite)}>📧 Send Invite Email</button>
                        )}
                        {selectedInvite.status === "invited" && <div style={s.statusNote}>✓ Invite sent</div>}
                        {selectedInvite.status === "registered" && <div style={s.statusNote}>✓ Registered</div>}
                        {selectedInvite.status === "rejected" && <div style={{ ...s.statusNote, color: "#ff4f6a" }}>✕ Rejected</div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Tab 1 — Pending Verification ── */}
            {activeTab === 1 && (
              <div style={s.splitLayout}>
                <div style={s.listCol}>
                  {pendingVerification.length === 0 ? <div style={s.empty}>No pending verifications.</div> : (
                    pendingVerification.map(emp => (
                      <div
                        key={emp.id}
                        style={{ ...s.listCard, ...(selectedEmployer?.id === emp.id ? s.listCardActive : {}) }}
                        onClick={() => setSelectedEmployer(emp)}
                      >
                        <div style={s.listCardRow}>
                          <div style={s.avatar}>{emp.companyName?.[0]}</div>
                          <div style={s.listCardInfo}>
                            <div style={s.listCardName}>{emp.companyName}</div>
                            <div style={s.listCardSub}>{emp.email}</div>
                          </div>
                          <span style={{ ...s.pill, ...pillColor(emp.verificationStatus) }}>{emp.verificationStatus}</span>
                        </div>
                        <div style={s.listCardMeta}><span>{emp.industry}</span><span>{emp.province}</span></div>
                      </div>
                    ))
                  )}
                </div>
                <div style={s.drawer}>
                  {!selectedEmployer ? (
                    <div style={s.drawerEmpty}><p>Select an employer to review</p></div>
                  ) : (
                    <div style={s.drawerInner}>
                      <div style={s.drawerHeader}>
                        <div style={s.avatar}>{selectedEmployer.companyName?.[0]}</div>
                        <div style={{ flex: 1 }}>
                          <div style={s.drawerName}>{selectedEmployer.companyName}</div>
                          <div style={s.drawerSub}>{selectedEmployer.email}</div>
                        </div>
                        <span style={{ ...s.pill, ...pillColor(selectedEmployer.verificationStatus) }}>{selectedEmployer.verificationStatus}</span>
                      </div>
                      <Section title="Company Info">
                        <InfoRow label="Industry" value={selectedEmployer.industry} />
                        <InfoRow label="Size" value={selectedEmployer.companySize} />
                        <InfoRow label="Province" value={selectedEmployer.province} />
                        <InfoRow label="City" value={selectedEmployer.city} />
                        <InfoRow label="Website" value={selectedEmployer.website} />
                      </Section>
                      <Section title="Contact Person">
                        <InfoRow label="Name" value={`${selectedEmployer.contactFirstName || ""} ${selectedEmployer.contactLastName || ""}`} />
                        <InfoRow label="Email" value={selectedEmployer.contactEmail} />
                        <InfoRow label="Phone" value={selectedEmployer.contactPhone} />
                        <InfoRow label="Title" value={selectedEmployer.contactTitle} />
                        <InfoRow label="ID Number" value={selectedEmployer.contactIdNumber} />
                      </Section>
                      <Section title="Documents">
                        {selectedEmployer.documents?.cipc && <a href={selectedEmployer.documents.cipc} target="_blank" rel="noreferrer" style={s.docLink}>📄 CIPC Certificate</a>}
                        {selectedEmployer.documents?.id && <a href={selectedEmployer.documents.id} target="_blank" rel="noreferrer" style={s.docLink}>📄 ID Document</a>}
                        {selectedEmployer.documents?.addr && <a href={selectedEmployer.documents.addr} target="_blank" rel="noreferrer" style={s.docLink}>📄 Proof of Address</a>}
                        {selectedEmployer.documents?.auth && <a href={selectedEmployer.documents.auth} target="_blank" rel="noreferrer" style={s.docLink}>📄 Auth Letter</a>}
                        {!selectedEmployer.documents && <div style={s.dateText}>No documents uploaded yet.</div>}
                      </Section>
                      <div style={s.drawerActions}>
                        {selectedEmployer.verificationStatus === "submitted" && (
                          <>
                            <button style={s.btnGreen} onClick={() => approveEmployer(selectedEmployer.id)}>✓ Approve</button>
                            <button style={s.btnRed} onClick={() => rejectEmployer(selectedEmployer.id)}>✕ Reject</button>
                          </>
                        )}
                        {selectedEmployer.verificationStatus === "approved" && <div style={s.statusNote}>✓ Approved</div>}
                        {selectedEmployer.verificationStatus === "rejected" && <div style={{ ...s.statusNote, color: "#ff4f6a" }}>✕ Rejected</div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Tab 2 — Employers (FULL CONTROL) ── */}
            {activeTab === 2 && (
              <div>
                <div style={s.tableTopBar}>
                  <input
                    style={s.searchInput}
                    value={empSearch}
                    onChange={e => setEmpSearch(e.target.value)}
                    placeholder="Search employers..."
                  />
                  <span style={s.tableCount}>{filteredEmps.length} employer{filteredEmps.length !== 1 ? "s" : ""}</span>
                </div>
                <div style={s.tableWrap}>
                  {filteredEmps.length === 0 ? <div style={s.empty}>No employers found.</div> : (
                    <table style={s.table}>
                      <thead>
                        <tr>
                          {["Company", "Email", "Status", "Live Jobs", "Payment", "Account", "Actions"].map(h => (
                            <th key={h} style={s.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEmps.map(emp => {
                          const liveJobs = jobs.filter(j => j.employerId === emp.id && j.status === "live");
                          return (
                            <tr key={emp.id} style={{ ...s.tr, ...(emp.disabled ? { opacity: 0.55 } : {}) }}>
                              <td style={s.td}>
                                <div style={{ fontWeight: "600", color: "#e8edf8" }}>{emp.companyName}</div>
                                <div style={{ fontSize: "11px", color: "#6b7fa3" }}>{emp.industry}</div>
                              </td>
                              <td style={s.td}>{emp.email}</td>
                              <td style={s.td}>
                                <span style={{ ...s.pill, ...pillColor(emp.verificationStatus) }}>{emp.verificationStatus}</span>
                              </td>
                              <td style={{ ...s.td, textAlign: "center" }}>{liveJobs.length}</td>
                              <td style={s.td}>
                                <span style={{ ...s.pill, ...(emp.paymentStatus === "paid" ? pillColor("approved") : pillColor("pending")) }}>
                                  {emp.paymentStatus || "pending"}
                                </span>
                              </td>
                              <td style={s.td}>
                                <span style={{ ...s.pill, ...(emp.disabled ? pillColor("rejected") : pillColor("active")) }}>
                                  {emp.disabled ? "Disabled" : "Active"}
                                </span>
                              </td>
                              <td style={s.td}>
                                <div style={s.actions}>
                                  {/* Payment toggle */}
                                  {emp.paymentStatus === "paid"
                                    ? <button style={s.btnSmallRed} onClick={() => markEmployerUnpaid(emp)} title="Mark as unpaid">Unpaid</button>
                                    : <button style={s.btnSmallGreen} onClick={() => markEmployerPaid(emp)} title="Mark as paid">✓ Paid</button>
                                  }
                                  {/* Disable / Enable toggle */}
                                  {emp.disabled
                                    ? <button style={s.btnSmallBlue} onClick={() => toggleEmployerDisabled(emp)}>Enable</button>
                                    : <button style={s.btnSmallAmber} onClick={() => toggleEmployerDisabled(emp)}>Disable</button>
                                  }
                                  {/* Delete */}
                                  <button style={s.btnSmallRed} onClick={() => setConfirmDelete({ type: "employer", id: emp.id, name: emp.companyName })}>Delete</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ── Tab 3 — Jobs (FULL CONTROL) ── */}
            {activeTab === 3 && (
              <div>
                <div style={s.tableTopBar}>
                  <input
                    style={s.searchInput}
                    value={jobSearch}
                    onChange={e => setJobSearch(e.target.value)}
                    placeholder="Search jobs..."
                  />
                  <span style={s.tableCount}>{filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""}</span>
                </div>
                <div style={s.tableWrap}>
                  {filteredJobs.length === 0 ? <div style={s.empty}>No jobs found.</div> : (
                    <table style={s.table}>
                      <thead>
                        <tr>
                          {["Title", "Company", "Province", "Type", "Status", "Closes", "Posted", "Actions"].map(h => (
                            <th key={h} style={s.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredJobs.map(job => (
                          <tr key={job.id} style={s.tr}>
                            <td style={s.td}>
                              <div style={{ fontWeight: "600", color: "#e8edf8", maxWidth: 200 }}>{job.title}</div>
                            </td>
                            <td style={s.td}>{job.employerName}</td>
                            <td style={s.td}>{job.province}</td>
                            <td style={s.td}>{job.type}</td>
                            <td style={s.td}><span style={{ ...s.pill, ...pillColor(job.status) }}>{job.status}</span></td>
                            <td style={s.td}>{job.closes || "—"}</td>
                            <td style={s.td}>{job.createdAt?.toDate?.().toLocaleDateString("en-ZA") || "—"}</td>
                            <td style={s.td}>
                              <div style={s.actions}>
                                {/* Status controls */}
                                {job.status !== "live" && (
                                  <button style={s.btnSmallGreen} onClick={() => setJobStatus(job.id, "live")}>Publish</button>
                                )}
                                {job.status === "live" && (
                                  <button style={s.btnSmallAmber} onClick={() => setJobStatus(job.id, "cancelled")}>Cancel</button>
                                )}
                                {/* Edit */}
                                <button style={s.btnSmallBlue} onClick={() => setEditingJob({ ...job })}>Edit</button>
                                {/* Delete */}
                                <button style={s.btnSmallRed} onClick={() => setConfirmDelete({ type: "job", id: job.id, name: job.title })}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ── Tab 4 — Invoices ── */}
            {activeTab === 4 && (
              <div style={s.tableWrap}>
                {approvedEmployers.length === 0 ? <div style={s.empty}>No approved employers yet.</div> : (
                  <table style={s.table}>
                    <thead>
                      <tr>
                        {["Company", "Email", "Live Jobs", "Amount Due", "Due Date", "Payment Status", "Action"].map(h => (
                          <th key={h} style={s.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {approvedEmployers.map(emp => {
                        const empLiveJobs = jobs.filter(j => j.employerId === emp.id && j.status === "live");
                        const amount = empLiveJobs.length * JOB_PRICE;
                        const now = new Date();
                        const due = new Date(now.getFullYear(), now.getMonth(), 15);
                        if (now.getDate() > 15) due.setMonth(due.getMonth() + 1);
                        const dueStr = due.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
                        const isPaid = emp.paymentStatus === "paid";
                        return (
                          <tr key={emp.id} style={s.tr}>
                            <td style={s.td}>
                              <div style={{ fontWeight: "600", color: "#e8edf8" }}>{emp.companyName}</div>
                              {emp.disabled && <div style={{ fontSize: "11px", color: "#ff4f6a" }}>Account disabled</div>}
                            </td>
                            <td style={s.td}>{emp.email}</td>
                            <td style={{ ...s.td, textAlign: "center" }}>{empLiveJobs.length}</td>
                            <td style={s.td}>
                              <span style={{ color: amount > 0 && !isPaid ? "#f5a623" : "#6b7fa3", fontWeight: "600" }}>
                                R {amount.toLocaleString("en-ZA")}
                              </span>
                            </td>
                            <td style={s.td}>{dueStr}</td>
                            <td style={s.td}>
                              <span style={{ ...s.pill, ...(isPaid ? pillColor("approved") : amount > 0 ? pillColor("pending") : pillColor("inactive")) }}>
                                {isPaid ? "Paid" : amount > 0 ? "Outstanding" : "Nothing owed"}
                              </span>
                            </td>
                            <td style={s.td}>
                              <div style={s.actions}>
                                {isPaid
                                  ? <button style={s.btnSmallRed} onClick={() => markEmployerUnpaid(emp)}>Mark Unpaid</button>
                                  : <button style={s.btnSmallGreen} onClick={() => markEmployerPaid(emp)}>✓ Mark Paid</button>
                                }
                                {!emp.disabled && amount > 0 && !isPaid && (
                                  <button style={s.btnSmallAmber} onClick={() => toggleEmployerDisabled(emp)}>Suspend</button>
                                )}
                                {emp.disabled && (
                                  <button style={s.btnSmallBlue} onClick={() => toggleEmployerDisabled(emp)}>Re-enable</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Edit Job Modal ── */}
      {editingJob && (
        <>
          <div style={s.modalOverlay} onClick={() => setEditingJob(null)} />
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>Edit Job</div>
              <button style={s.modalClose} onClick={() => setEditingJob(null)}>✕</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.modalField}>
                <label style={s.modalLabel}>Job Title</label>
                <input
                  style={s.modalInput}
                  value={editingJob.title}
                  onChange={e => setEditingJob(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div style={s.modalField}>
                <label style={s.modalLabel}>Closing Date</label>
                <input
                  style={s.modalInput}
                  value={editingJob.closes}
                  onChange={e => setEditingJob(prev => ({ ...prev, closes: e.target.value }))}
                  placeholder="e.g. 31 Dec 2025"
                />
              </div>
              <div style={s.modalField}>
                <label style={s.modalLabel}>Status</label>
                <select
                  style={s.modalInput}
                  value={editingJob.status}
                  onChange={e => setEditingJob(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="live">Live</option>
                  <option value="draft">Draft</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button style={s.btnGreen} onClick={saveJobEdit}>Save Changes</button>
                <button style={s.btnBlue} onClick={() => setEditingJob(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Confirm Delete Modal ── */}
      {confirmDelete && (
        <>
          <div style={s.modalOverlay} onClick={() => setConfirmDelete(null)} />
          <div style={{ ...s.modal, maxWidth: "400px" }}>
            <div style={s.modalHeader}>
              <div style={{ ...s.modalTitle, color: "#ff4f6a" }}>Confirm Delete</div>
              <button style={s.modalClose} onClick={() => setConfirmDelete(null)}>✕</button>
            </div>
            <div style={s.modalBody}>
              <p style={{ color: "#6b7fa3", fontSize: "14px", marginBottom: "20px", lineHeight: "1.6" }}>
                Are you sure you want to permanently delete <strong style={{ color: "#e8edf8" }}>"{confirmDelete.name}"</strong>? This cannot be undone.
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  style={s.btnRed}
                  onClick={() => confirmDelete.type === "job" ? deleteJob(confirmDelete.id) : deleteEmployer(confirmDelete.id)}
                >
                  Yes, Delete
                </button>
                <button style={s.btnBlue} onClick={() => setConfirmDelete(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Helper components ──────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid #1e2d52" }}>
      <div style={{ color: "#0099fa", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>{title}</div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "7px 0", borderBottom: "1px solid #131b33", fontSize: "13px" }}>
      <span style={{ color: "#6b7fa3" }}>{label}</span>
      <span style={{ color: "#e8edf8", textAlign: "right", maxWidth: "60%", wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}

function pillColor(status) {
  const map = {
    approved: { background: "rgba(0,229,160,0.12)", color: "#00e5a0" },
    active:   { background: "rgba(0,229,160,0.12)", color: "#00e5a0" },
    live:     { background: "rgba(0,229,160,0.12)", color: "#00e5a0" },
    paid:     { background: "rgba(0,229,160,0.12)", color: "#00e5a0" },
    pending:  { background: "rgba(245,166,35,0.12)", color: "#f5a623" },
    submitted:{ background: "rgba(0,153,250,0.12)", color: "#0099fa" },
    invited:  { background: "rgba(0,153,250,0.12)", color: "#0099fa" },
    rejected: { background: "rgba(255,79,106,0.12)", color: "#ff4f6a" },
    expired:  { background: "rgba(255,79,106,0.12)", color: "#ff4f6a" },
    cancelled:{ background: "rgba(255,79,106,0.12)", color: "#ff4f6a" },
    disabled: { background: "rgba(255,79,106,0.12)", color: "#ff4f6a" },
    unpaid:   { background: "rgba(245,166,35,0.12)", color: "#f5a623" },
    inactive: { background: "rgba(107,127,163,0.12)", color: "#6b7fa3" },
    draft:    { background: "rgba(107,127,163,0.12)", color: "#6b7fa3" },
    registered:{ background: "rgba(0,229,160,0.12)", color: "#00e5a0" },
  };
  return map[status] || { background: "rgba(107,127,163,0.12)", color: "#6b7fa3" };
}

const s = {
  page: { display: "flex", minHeight: "100vh", background: "#080d1b", fontFamily: "sans-serif" },

  // Sidebar
  sidebar: { width: "220px", flexShrink: 0, background: "#0d1428", borderRight: "1px solid #1e2d52", padding: "32px 16px", display: "flex", flexDirection: "column", gap: "4px", position: "sticky", top: 0, height: "100vh", overflowY: "auto" },
  sidebarLogo: { color: "#0099fa", fontWeight: "700", fontSize: "16px", marginBottom: "28px", lineHeight: 1.4, display: "flex", flexDirection: "column" },
  sidebarSub: { color: "#6b7fa3", fontSize: "11px", fontWeight: "400" },
  navBtn: { background: "none", border: "none", color: "#6b7fa3", fontSize: "13px", padding: "10px 12px", borderRadius: "8px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", width: "100%" },
  navBtnActive: { background: "rgba(0,153,250,0.12)", color: "#0099fa" },
  badge: { background: "#0099fa", color: "#fff", borderRadius: "10px", fontSize: "10px", padding: "2px 7px", fontWeight: "700" },

  // Main
  main: { flex: 1, padding: "32px 40px", overflowX: "auto" },
  topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "12px" },
  pageTitle: { color: "#e8edf8", fontSize: "22px", fontWeight: "700", margin: 0 },
  actionMsg: { display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,153,250,0.12)", border: "1px solid rgba(0,153,250,0.3)", color: "#0099fa", borderRadius: "8px", padding: "10px 16px", fontSize: "13px" },
  actionMsgSuccess: { background: "rgba(0,229,160,0.12)", border: "1px solid rgba(0,229,160,0.3)", color: "#00e5a0" },
  actionMsgError: { background: "rgba(255,79,106,0.12)", border: "1px solid rgba(255,79,106,0.3)", color: "#ff4f6a" },

  // Split layout (tabs 0 & 1)
  splitLayout: { display: "grid", gridTemplateColumns: "1fr 360px", gap: "20px", alignItems: "start" },
  listCol: { display: "flex", flexDirection: "column", gap: "8px" },
  listCard: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "10px", padding: "14px 16px", cursor: "pointer", transition: "border-color 0.15s" },
  listCardActive: { borderColor: "#0099fa", background: "rgba(0,153,250,0.05)" },
  listCardRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" },
  avatar: { width: "34px", height: "34px", borderRadius: "50%", background: "#131b33", border: "1px solid #1e2d52", color: "#6b7fa3", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  listCardInfo: { flex: 1 },
  listCardName: { color: "#e8edf8", fontSize: "14px", fontWeight: "600" },
  listCardSub: { color: "#6b7fa3", fontSize: "12px" },
  listCardMeta: { display: "flex", gap: "14px", fontSize: "12px", color: "#3d4f73" },

  // Drawer
  drawer: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "12px", position: "sticky", top: "32px", maxHeight: "calc(100vh - 80px)", overflowY: "auto" },
  drawerEmpty: { display: "flex", alignItems: "center", justifyContent: "center", height: "300px", color: "#3d4f73", fontSize: "14px" },
  drawerInner: { padding: "20px" },
  drawerHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid #1e2d52" },
  drawerName: { color: "#e8edf8", fontSize: "15px", fontWeight: "700" },
  drawerSub: { color: "#6b7fa3", fontSize: "12px" },
  drawerActions: { display: "flex", gap: "8px", flexWrap: "wrap", paddingTop: "4px" },
  messageBox: { background: "#131b33", border: "1px solid #1e2d52", borderRadius: "8px", padding: "12px", color: "#6b7fa3", fontSize: "13px", lineHeight: "1.6" },
  dateText: { color: "#6b7fa3", fontSize: "13px" },
  docLink: { display: "block", color: "#0099fa", fontSize: "13px", textDecoration: "none", padding: "6px 0", borderBottom: "1px solid #131b33" },
  statusNote: { color: "#00e5a0", fontSize: "13px", fontWeight: "500" },

  // Table
  tableTopBar: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" },
  searchInput: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "8px", padding: "9px 14px", color: "#e8edf8", fontSize: "13px", outline: "none", width: "280px", fontFamily: "sans-serif" },
  tableCount: { color: "#6b7fa3", fontSize: "13px" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  th: { color: "#6b7fa3", fontWeight: "500", textAlign: "left", padding: "10px 14px", borderBottom: "1px solid #1e2d52", whiteSpace: "nowrap", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.04em" },
  tr: { borderBottom: "1px solid #1e2d52", transition: "background 0.1s" },
  td: { color: "#e8edf8", padding: "12px 14px", verticalAlign: "middle" },
  actions: { display: "flex", gap: "6px", flexWrap: "wrap" },
  pill: { padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "500", whiteSpace: "nowrap" },

  // Buttons
  btnGreen:  { background: "rgba(0,229,160,0.12)", color: "#00e5a0", border: "1px solid rgba(0,229,160,0.25)", borderRadius: "6px", padding: "8px 14px", fontSize: "13px", cursor: "pointer" },
  btnRed:    { background: "rgba(255,79,106,0.12)", color: "#ff4f6a", border: "1px solid rgba(255,79,106,0.25)", borderRadius: "6px", padding: "8px 14px", fontSize: "13px", cursor: "pointer" },
  btnBlue:   { background: "rgba(0,153,250,0.12)", color: "#0099fa", border: "1px solid rgba(0,153,250,0.25)", borderRadius: "6px", padding: "8px 14px", fontSize: "13px", cursor: "pointer" },
  btnSmallGreen:  { background: "rgba(0,229,160,0.12)", color: "#00e5a0", border: "1px solid rgba(0,229,160,0.2)", borderRadius: "5px", padding: "5px 10px", fontSize: "11px", cursor: "pointer", whiteSpace: "nowrap" },
  btnSmallRed:    { background: "rgba(255,79,106,0.12)", color: "#ff4f6a", border: "1px solid rgba(255,79,106,0.2)", borderRadius: "5px", padding: "5px 10px", fontSize: "11px", cursor: "pointer", whiteSpace: "nowrap" },
  btnSmallBlue:   { background: "rgba(0,153,250,0.12)", color: "#0099fa", border: "1px solid rgba(0,153,250,0.2)", borderRadius: "5px", padding: "5px 10px", fontSize: "11px", cursor: "pointer", whiteSpace: "nowrap" },
  btnSmallAmber:  { background: "rgba(245,166,35,0.12)", color: "#f5a623", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "5px", padding: "5px 10px", fontSize: "11px", cursor: "pointer", whiteSpace: "nowrap" },

  empty: { color: "#6b7fa3", padding: "48px 0", textAlign: "center" },

  // Modal
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 400 },
  modal: { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "14px", width: "100%", maxWidth: "480px", zIndex: 401, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" },
  modalHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #1e2d52" },
  modalTitle: { color: "#e8edf8", fontSize: "16px", fontWeight: "700" },
  modalClose: { background: "none", border: "none", color: "#6b7fa3", fontSize: "18px", cursor: "pointer", padding: "2px" },
  modalBody: { padding: "24px" },
  modalField: { marginBottom: "16px" },
  modalLabel: { color: "#6b7fa3", fontSize: "12px", fontWeight: "500", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" },
  modalInput: { background: "#131b33", border: "1px solid #1e2d52", borderRadius: "8px", padding: "10px 13px", color: "#e8edf8", fontSize: "14px", outline: "none", width: "100%", fontFamily: "sans-serif" },
};