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
  const [actionMsgType, setActionMsgType] = useState("info");
  const [selectedInvite, setSelectedInvite] = useState(null);
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
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

  // ── Invite actions ──
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

  // ── Employer actions ──
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

  // ── Job actions ──
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

  // ── Derived data ──
  const pendingInvites      = invites.filter(i => i.status === "pending");
  const pendingVerification = employers.filter(e => e.verificationStatus === "submitted");
  const approvedEmployers   = employers.filter(e => e.verificationStatus === "approved" && !e.deleted);
  const allActiveEmployers  = employers.filter(e => !e.deleted);

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
        <div style={s.sidebarHeader}>
          <div style={s.projectSelector}>
            <div style={s.logoMark}>V</div>
            <div style={s.projectInfo}>
              <div style={s.logoText}>Vetted</div>
              <div style={s.logoSub}>Admin Console</div>
            </div>
          </div>
        </div>

        <nav style={s.nav}>
          <div style={s.navSectionTitle}>Management</div>
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(i); setSelectedInvite(null); setSelectedEmployer(null); setEditingJob(null); }}
              style={{ ...s.navBtn, ...(activeTab === i ? s.navBtnActive : {}) }}
            >
              <span style={{ ...s.navIcon, ...(activeTab === i ? s.navIconActive : {}) }}>
                {["📥", "🔍", "🏢", "💼", "💳"][i]}
              </span>
              <span style={s.navLabel}>{tab}</span>
              {i === 0 && pendingInvites.length > 0 && (
                <span style={s.navBadge}>{pendingInvites.length}</span>
              )}
              {i === 1 && pendingVerification.length > 0 && (
                <span style={s.navBadge}>{pendingVerification.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={s.sidebarBottom}>
          <button onClick={() => navigate("/")} style={s.sidebarLink}>← Back to Site</button>
          <button onClick={handleSignOut} style={{ ...s.sidebarLink, color: "#d93025" }}>Sign Out</button>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={s.mainWrapper}>
        <div style={s.mainInner}>

          {/* Topbar */}
          <div style={s.topbar}>
            <div>
              <h1 style={s.pageTitle}>{TABS[activeTab]}</h1>
              <p style={s.pageSub}>
                {activeTab === 0 && `${invites.length} total submission${invites.length !== 1 ? "s" : ""}`}
                {activeTab === 1 && `${pendingVerification.length} awaiting review`}
                {activeTab === 2 && `${allActiveEmployers.length} employer${allActiveEmployers.length !== 1 ? "s" : ""}`}
                {activeTab === 3 && `${jobs.length} job${jobs.length !== 1 ? "s" : ""} in database`}
                {activeTab === 4 && `${approvedEmployers.length} billing account${approvedEmployers.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            {actionMsg && (
              <div style={{
                ...s.actionMsg,
                ...(actionMsgType === "error"   ? s.actionMsgError   : {}),
                ...(actionMsgType === "success" ? s.actionMsgSuccess : {}),
              }}>
                {actionMsg}
                <button style={s.actionMsgClose} onClick={() => setActionMsg("")}>✕</button>
              </div>
            )}
          </div>

          {loading ? <div style={s.empty}>Fetching data...</div> : (
            <>
              {/* ── Tab 0 — Expressions of Interest ── */}
              {activeTab === 0 && (
                <div style={s.splitLayout}>
                  <div style={s.listCol}>
                    {invites.length === 0 ? (
                      <div style={s.empty}>No expressions of interest yet.</div>
                    ) : invites.map(inv => (
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
                    ))}
                  </div>
                  <div style={s.drawer}>
                    {!selectedInvite ? (
                      <div style={s.drawerEmpty}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#bdc1c6" strokeWidth="1.5" style={{ marginBottom: 12 }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <p style={{ color: "#5f6368", fontSize: "13px", margin: 0 }}>Select a submission to review</p>
                      </div>
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
                          <InfoRow label="Company"  value={selectedInvite.companyName} />
                          <InfoRow label="Industry" value={selectedInvite.industry} />
                          <InfoRow label="Province" value={selectedInvite.province} />
                          <InfoRow label="Size"     value={selectedInvite.companySize} />
                        </Section>
                        {selectedInvite.message && (
                          <Section title="Message">
                            <div style={s.messageBox}>{selectedInvite.message}</div>
                          </Section>
                        )}
                        <Section title="Submitted">
                          <div style={s.dateText}>
                            {selectedInvite.createdAt?.toDate?.().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" }) || "—"}
                          </div>
                        </Section>
                        <div style={s.drawerActions}>
                          {selectedInvite.status === "pending" && (
                            <>
                              <button style={s.btnGreen} onClick={() => updateInviteStatus(selectedInvite.id, "approved")}>✓ Approve</button>
                              <button style={s.btnRed}   onClick={() => updateInviteStatus(selectedInvite.id, "rejected")}>✕ Reject</button>
                            </>
                          )}
                          {selectedInvite.status === "approved" && (
                            <button style={s.btnBlue} onClick={() => sendInvite(selectedInvite)}>📧 Send Invite Email</button>
                          )}
                          {selectedInvite.status === "invited"    && <div style={s.statusNote}>✓ Invite sent</div>}
                          {selectedInvite.status === "registered" && <div style={s.statusNote}>✓ Registered</div>}
                          {selectedInvite.status === "rejected"   && <div style={{ ...s.statusNote, color: "#d93025" }}>✕ Rejected</div>}
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
                    {pendingVerification.length === 0 ? (
                      <div style={s.empty}>No pending verifications.</div>
                    ) : pendingVerification.map(emp => (
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
                        <div style={s.listCardMeta}>
                          <span>{emp.industry}</span>
                          <span>{emp.province}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={s.drawer}>
                    {!selectedEmployer ? (
                      <div style={s.drawerEmpty}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#bdc1c6" strokeWidth="1.5" style={{ marginBottom: 12 }}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                        <p style={{ color: "#5f6368", fontSize: "13px", margin: 0 }}>Select an employer to review</p>
                      </div>
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
                          <InfoRow label="Size"     value={selectedEmployer.companySize} />
                          <InfoRow label="Province" value={selectedEmployer.province} />
                          <InfoRow label="City"     value={selectedEmployer.city} />
                          <InfoRow label="Website"  value={selectedEmployer.website} />
                        </Section>
                        <Section title="Contact Person">
                          <InfoRow label="Name"      value={`${selectedEmployer.contactFirstName || ""} ${selectedEmployer.contactLastName || ""}`} />
                          <InfoRow label="Email"     value={selectedEmployer.contactEmail} />
                          <InfoRow label="Phone"     value={selectedEmployer.contactPhone} />
                          <InfoRow label="Title"     value={selectedEmployer.contactTitle} />
                          <InfoRow label="ID Number" value={selectedEmployer.contactIdNumber} />
                        </Section>
                        <Section title="Documents">
                          {selectedEmployer.documents?.cipc && <a href={selectedEmployer.documents.cipc} target="_blank" rel="noreferrer" style={s.docLink}>📄 CIPC Certificate</a>}
                          {selectedEmployer.documents?.id   && <a href={selectedEmployer.documents.id}   target="_blank" rel="noreferrer" style={s.docLink}>📄 ID Document</a>}
                          {selectedEmployer.documents?.addr && <a href={selectedEmployer.documents.addr} target="_blank" rel="noreferrer" style={s.docLink}>📄 Proof of Address</a>}
                          {selectedEmployer.documents?.auth && <a href={selectedEmployer.documents.auth} target="_blank" rel="noreferrer" style={s.docLink}>📄 Auth Letter</a>}
                          {!selectedEmployer.documents && <div style={s.dateText}>No documents uploaded yet.</div>}
                        </Section>
                        <div style={s.drawerActions}>
                          {selectedEmployer.verificationStatus === "submitted" && (
                            <>
                              <button style={s.btnGreen} onClick={() => approveEmployer(selectedEmployer.id)}>✓ Approve</button>
                              <button style={s.btnRed}   onClick={() => rejectEmployer(selectedEmployer.id)}>✕ Reject</button>
                            </>
                          )}
                          {selectedEmployer.verificationStatus === "approved" && <div style={s.statusNote}>✓ Approved</div>}
                          {selectedEmployer.verificationStatus === "rejected" && <div style={{ ...s.statusNote, color: "#d93025" }}>✕ Rejected</div>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Tab 2 — Employers ── */}
              {activeTab === 2 && (
                <div>
                  <div style={s.tableTopBar}>
                    <input style={s.searchInput} value={empSearch} onChange={e => setEmpSearch(e.target.value)} placeholder="Search employers..." />
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
                                  <div style={{ fontWeight: "600", color: "#202124" }}>{emp.companyName}</div>
                                  <div style={{ fontSize: "11px", color: "#5f6368" }}>{emp.industry}</div>
                                </td>
                                <td style={s.td}>{emp.email}</td>
                                <td style={s.td}><span style={{ ...s.pill, ...pillColor(emp.verificationStatus) }}>{emp.verificationStatus}</span></td>
                                <td style={{ ...s.td, textAlign: "center", fontWeight: "600" }}>{liveJobs.length}</td>
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
                                    {emp.paymentStatus === "paid"
                                      ? <button style={s.btnSmallRed}   onClick={() => markEmployerUnpaid(emp)}>Unpaid</button>
                                      : <button style={s.btnSmallGreen} onClick={() => markEmployerPaid(emp)}>✓ Paid</button>
                                    }
                                    {emp.disabled
                                      ? <button style={s.btnSmallBlue}  onClick={() => toggleEmployerDisabled(emp)}>Enable</button>
                                      : <button style={s.btnSmallAmber} onClick={() => toggleEmployerDisabled(emp)}>Disable</button>
                                    }
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

              {/* ── Tab 3 — Jobs ── */}
              {activeTab === 3 && (
                <div>
                  <div style={s.tableTopBar}>
                    <input style={s.searchInput} value={jobSearch} onChange={e => setJobSearch(e.target.value)} placeholder="Search jobs..." />
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
                                <div style={{ fontWeight: "600", color: "#1a73e8", maxWidth: 200 }}>{job.title}</div>
                              </td>
                              <td style={s.td}>{job.employerName}</td>
                              <td style={s.td}>{job.province}</td>
                              <td style={s.td}>{job.type}</td>
                              <td style={s.td}><span style={{ ...s.pill, ...pillColor(job.status) }}>{job.status}</span></td>
                              <td style={s.td}>{job.closes || "—"}</td>
                              <td style={s.td}>{job.createdAt?.toDate?.().toLocaleDateString("en-ZA") || "—"}</td>
                              <td style={s.td}>
                                <div style={s.actions}>
                                  {job.status !== "live"  && <button style={s.btnSmallGreen} onClick={() => setJobStatus(job.id, "live")}>Publish</button>}
                                  {job.status === "live"  && <button style={s.btnSmallAmber} onClick={() => setJobStatus(job.id, "cancelled")}>Cancel</button>}
                                  <button style={s.btnSmallBlue} onClick={() => setEditingJob({ ...job })}>Edit</button>
                                  <button style={s.btnSmallRed}  onClick={() => setConfirmDelete({ type: "job", id: job.id, name: job.title })}>Delete</button>
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
                                <div style={{ fontWeight: "600", color: "#202124" }}>{emp.companyName}</div>
                                {emp.disabled && <div style={{ fontSize: "11px", color: "#d93025" }}>Account disabled</div>}
                              </td>
                              <td style={s.td}>{emp.email}</td>
                              <td style={{ ...s.td, textAlign: "center", fontWeight: "600" }}>{empLiveJobs.length}</td>
                              <td style={s.td}>
                                <span style={{ color: amount > 0 && !isPaid ? "#ea8600" : "#5f6368", fontWeight: "600" }}>
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
                                    ? <button style={s.btnSmallRed}   onClick={() => markEmployerUnpaid(emp)}>Mark Unpaid</button>
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
                <input style={s.modalInput} value={editingJob.title} onChange={e => setEditingJob(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div style={s.modalField}>
                <label style={s.modalLabel}>Closing Date</label>
                <input style={s.modalInput} value={editingJob.closes} onChange={e => setEditingJob(prev => ({ ...prev, closes: e.target.value }))} placeholder="e.g. 31 Dec 2025" />
              </div>
              <div style={s.modalField}>
                <label style={s.modalLabel}>Status</label>
                <select style={s.modalInput} value={editingJob.status} onChange={e => setEditingJob(prev => ({ ...prev, status: e.target.value }))}>
                  <option value="live">Live</option>
                  <option value="draft">Draft</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button style={s.btnGreen} onClick={saveJobEdit}>Save Changes</button>
                <button style={s.btnGhost} onClick={() => setEditingJob(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Confirm Delete Modal ── */}
      {confirmDelete && (
        <>
          <div style={s.modalOverlay} onClick={() => setConfirmDelete(null)} />
          <div style={{ ...s.modal, maxWidth: "420px" }}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>Delete Permanently</div>
              <button style={s.modalClose} onClick={() => setConfirmDelete(null)}>✕</button>
            </div>
            <div style={s.modalBody}>
              <p style={{ color: "#5f6368", fontSize: "14px", marginBottom: "24px", lineHeight: "1.6" }}>
                Are you sure you want to permanently delete{" "}
                <strong style={{ color: "#202124" }}>"{confirmDelete.name}"</strong>? This cannot be undone.
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button style={s.btnGhost} onClick={() => setConfirmDelete(null)}>Cancel</button>
                <button style={s.btnRed} onClick={() => confirmDelete.type === "job" ? deleteJob(confirmDelete.id) : deleteEmployer(confirmDelete.id)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid #e3e3e3" }}>
      <div style={{ color: "#5f6368", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "7px 0", borderBottom: "1px solid #f8f9fa", fontSize: "13px" }}>
      <span style={{ color: "#5f6368" }}>{label}</span>
      <span style={{ color: "#202124", textAlign: "right", maxWidth: "60%", wordBreak: "break-all", fontWeight: "500" }}>{value}</span>
    </div>
  );
}

function pillColor(status) {
  const map = {
    approved:   { background: "#e6f4ea", color: "#0d652d" },
    active:     { background: "#e6f4ea", color: "#0d652d" },
    live:       { background: "#e6f4ea", color: "#0d652d" },
    paid:       { background: "#e6f4ea", color: "#0d652d" },
    registered: { background: "#e6f4ea", color: "#0d652d" },
    pending:    { background: "#fef7e0", color: "#ea8600" },
    unpaid:     { background: "#fef7e0", color: "#ea8600" },
    submitted:  { background: "#e3f2fd", color: "#1967d2" },
    invited:    { background: "#e3f2fd", color: "#1967d2" },
    rejected:   { background: "#fce8e6", color: "#c5221f" },
    expired:    { background: "#fce8e6", color: "#c5221f" },
    cancelled:  { background: "#fce8e6", color: "#c5221f" },
    disabled:   { background: "#fce8e6", color: "#c5221f" },
    inactive:   { background: "#f1f3f4", color: "#5f6368" },
    draft:      { background: "#f1f3f4", color: "#5f6368" },
  };
  return map[status] || { background: "#f1f3f4", color: "#5f6368" };
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
  projectSelector: { display: "flex", alignItems: "center", gap: "12px", padding: "8px", borderRadius: "8px" },
  logoMark: { width: "32px", height: "32px", borderRadius: "6px", background: "#ffca28", color: "#d84315", fontWeight: "700", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  projectInfo: { flex: 1, overflow: "hidden" },
  logoText: { color: "#202124", fontWeight: "600", fontSize: "14px" },
  logoSub: { color: "#5f6368", fontSize: "12px", fontWeight: "500" },

  nav: { display: "flex", flexDirection: "column", gap: "2px", flex: 1, padding: "16px 12px", overflowY: "auto" },
  navSectionTitle: { color: "#5f6368", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", padding: "0 12px", marginBottom: "8px", marginTop: "8px" },
  navBtn: { background: "none", border: "none", color: "#3c4043", fontSize: "13px", fontWeight: "500", padding: "10px 12px", borderRadius: "6px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "10px", transition: "all 0.15s", width: "100%" },
  navBtnActive: { background: "#e3f2fd", color: "#1967d2", fontWeight: "600" },
  navIcon: { fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", width: "22px", flexShrink: 0 },
  navIconActive: { color: "#1967d2" },
  navLabel: { flex: 1, textAlign: "left" },
  navBadge: { background: "#1a73e8", color: "#ffffff", borderRadius: "10px", fontSize: "10px", padding: "2px 7px", fontWeight: "700", marginLeft: "auto" },

  sidebarBottom: { borderTop: "1px solid #e3e3e3", padding: "12px 16px", background: "#f8f9fa", display: "flex", flexDirection: "column", gap: "4px" },
  sidebarLink: { background: "none", border: "none", color: "#5f6368", fontSize: "12px", fontWeight: "600", padding: "8px 12px", borderRadius: "4px", cursor: "pointer", textAlign: "left", transition: "background 0.15s" },

  // ── Main Content ──
  mainWrapper: { flex: 1, height: "100%", overflowY: "auto", position: "relative" },
  mainInner: { padding: "32px 48px", maxWidth: "1400px", margin: "0 auto" },

  topbar: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", gap: "16px", flexWrap: "wrap" },
  pageTitle: { color: "#202124", fontSize: "24px", fontWeight: "600", margin: "0 0 4px", letterSpacing: "-0.5px" },
  pageSub: { color: "#5f6368", fontSize: "14px", margin: 0 },

  actionMsg: { background: "#e3f2fd", border: "1px solid #bdd7f5", color: "#1967d2", borderRadius: "4px", padding: "10px 14px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "500" },
  actionMsgSuccess: { background: "#e6f4ea", border: "1px solid #ceead6", color: "#0d652d" },
  actionMsgError:   { background: "#fce8e6", border: "1px solid #f5c6c2", color: "#c5221f" },
  actionMsgClose: { background: "none", border: "none", cursor: "pointer", color: "inherit", padding: "0 0 0 8px", fontSize: "14px", fontWeight: "700", lineHeight: 1 },

  // ── Split layout ──
  splitLayout: { display: "grid", gridTemplateColumns: "1fr 360px", gap: "20px", alignItems: "start" },
  listCol: { display: "flex", flexDirection: "column", gap: "8px" },
  listCard: { background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "8px", padding: "14px 16px", cursor: "pointer", transition: "all 0.15s", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.06)" },
  listCardActive: { borderColor: "#1967d2", background: "#f8fbff", boxShadow: "0 1px 3px 1px rgba(25,103,210,0.12)" },
  listCardRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" },
  avatar: { width: "34px", height: "34px", borderRadius: "50%", background: "#f1f3f4", border: "1px solid #e3e3e3", color: "#5f6368", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  listCardInfo: { flex: 1 },
  listCardName: { color: "#202124", fontSize: "14px", fontWeight: "600" },
  listCardSub: { color: "#5f6368", fontSize: "12px" },
  listCardMeta: { display: "flex", gap: "14px", fontSize: "12px", color: "#9aa0a6" },

  // ── Drawer ──
  drawer: { background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "8px", position: "sticky", top: "0", maxHeight: "calc(100vh - 120px)", overflowY: "auto", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.06)" },
  drawerEmpty: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "320px", padding: "32px", textAlign: "center" },
  drawerInner: { padding: "20px" },
  drawerHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid #e3e3e3" },
  drawerName: { color: "#202124", fontSize: "15px", fontWeight: "600" },
  drawerSub: { color: "#5f6368", fontSize: "12px" },
  drawerActions: { display: "flex", gap: "8px", flexWrap: "wrap", paddingTop: "4px" },
  messageBox: { background: "#f8f9fa", border: "1px solid #e3e3e3", borderRadius: "4px", padding: "12px", color: "#3c4043", fontSize: "13px", lineHeight: "1.6" },
  dateText: { color: "#5f6368", fontSize: "13px" },
  docLink: { display: "block", color: "#1a73e8", fontSize: "13px", textDecoration: "none", padding: "6px 0", borderBottom: "1px solid #f1f3f4", fontWeight: "500" },
  statusNote: { color: "#0d652d", fontSize: "13px", fontWeight: "600" },

  // ── Table ──
  tableTopBar: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" },
  searchInput: { background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "4px", padding: "8px 12px", color: "#202124", fontSize: "13px", outline: "none", width: "280px", fontFamily: "inherit", transition: "border-color 0.2s" },
  tableCount: { color: "#5f6368", fontSize: "13px", fontWeight: "500" },
  tableWrap: { overflowX: "auto", background: "#ffffff", borderRadius: "8px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1)" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  th: { color: "#5f6368", fontWeight: "600", textAlign: "left", padding: "12px 16px", borderBottom: "1px solid #e3e3e3", whiteSpace: "nowrap", background: "#f8f9fa", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" },
  tr: { borderBottom: "1px solid #e3e3e3", transition: "background 0.1s" },
  td: { color: "#202124", padding: "12px 16px", verticalAlign: "middle" },
  actions: { display: "flex", gap: "6px", flexWrap: "wrap" },
  pill: { padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.4px", whiteSpace: "nowrap", display: "inline-block" },

  // ── Buttons ──
  btnGreen:  { background: "#e6f4ea", color: "#0d652d", border: "1px solid #ceead6", borderRadius: "4px", padding: "8px 14px", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
  btnRed:    { background: "#fce8e6", color: "#c5221f", border: "1px solid #f5c6c2", borderRadius: "4px", padding: "8px 14px", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
  btnBlue:   { background: "#e3f2fd", color: "#1967d2", border: "1px solid #bdd7f5", borderRadius: "4px", padding: "8px 14px", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
  btnGhost:  { background: "transparent", color: "#5f6368", border: "1px solid #dadce0", borderRadius: "4px", padding: "8px 14px", fontSize: "13px", fontWeight: "600", cursor: "pointer" },

  btnSmallGreen:  { background: "#e6f4ea", color: "#0d652d", border: "1px solid #ceead6", borderRadius: "4px", padding: "4px 10px", fontSize: "11px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" },
  btnSmallRed:    { background: "#fce8e6", color: "#c5221f", border: "1px solid #f5c6c2", borderRadius: "4px", padding: "4px 10px", fontSize: "11px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" },
  btnSmallBlue:   { background: "#e3f2fd", color: "#1967d2", border: "1px solid #bdd7f5", borderRadius: "4px", padding: "4px 10px", fontSize: "11px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" },
  btnSmallAmber:  { background: "#fef7e0", color: "#ea8600", border: "1px solid #fde68a", borderRadius: "4px", padding: "4px 10px", fontSize: "11px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" },

  empty: { color: "#5f6368", padding: "48px", textAlign: "center", fontSize: "14px", fontWeight: "500" },

  // ── Modal ──
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(32,33,36,0.5)", zIndex: 400, backdropFilter: "blur(2px)" },
  modal: { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "#ffffff", border: "none", borderRadius: "8px", width: "100%", maxWidth: "480px", zIndex: 401, boxShadow: "0 4px 16px rgba(0,0,0,0.12)" },
  modalHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #e3e3e3" },
  modalTitle: { color: "#202124", fontSize: "16px", fontWeight: "600" },
  modalClose: { background: "none", border: "none", color: "#5f6368", fontSize: "18px", cursor: "pointer" },
  modalBody: { padding: "24px" },
  modalField: { marginBottom: "16px" },
  modalLabel: { color: "#5f6368", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.3px" },
  modalInput: { background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "4px", padding: "9px 12px", color: "#202124", fontSize: "13px", outline: "none", width: "100%", fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.2s" },
};