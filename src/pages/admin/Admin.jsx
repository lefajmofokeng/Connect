import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { sendSignInLinkToEmail, signOut } from "firebase/auth";
import { db, auth } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const TABS = ["Expressions of Interest", "Pending Verification", "Approved Employers", "All Jobs", "Invoices"];
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
  const [selectedInvite, setSelectedInvite] = useState(null);
  const [selectedEmployer, setSelectedEmployer] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/admin/login");
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
    } catch (err) {
      console.error("Fetch error:", err);
    }
    setLoading(false);
  };

  const sendInvite = async (invite) => {
    try {
      const actionCodeSettings = {
        url: `https://jobs-42a5d.web.app/employer/register?email=${encodeURIComponent(invite.email)}&invited=true`,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, invite.email, actionCodeSettings);
      await updateDoc(doc(db, "invites", invite.id), { status: "invited", invitedAt: new Date() });
      setActionMsg(`Invite sent to ${invite.email}`);
      fetchAll();
    } catch (err) {
      setActionMsg("Failed to send invite: " + err.message);
    }
  };

  const updateInviteStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "invites", id), { status });
      setActionMsg(`Status updated to ${status}`);
      setSelectedInvite(prev => prev?.id === id ? { ...prev, status } : prev);
      fetchAll();
    } catch (err) {
      setActionMsg("Update failed: " + err.message);
    }
  };

  const updateEmployerPlan = async (id, plan, planStatus) => {
    try {
      await updateDoc(doc(db, "employers", id), { plan, planStatus, updatedAt: new Date() });
      setActionMsg(`Plan updated to ${plan}`);
      fetchAll();
    } catch (err) {
      setActionMsg("Update failed: " + err.message);
    }
  };

  const approveEmployer = async (id) => {
    try {
      await updateDoc(doc(db, "employers", id), { verificationStatus: "approved", updatedAt: new Date() });
      setActionMsg("Employer approved.");
      setSelectedEmployer(prev => prev?.id === id ? { ...prev, verificationStatus: "approved" } : prev);
      fetchAll();
    } catch (err) {
      setActionMsg("Update failed: " + err.message);
    }
  };

  const rejectEmployer = async (id) => {
    try {
      await updateDoc(doc(db, "employers", id), { verificationStatus: "rejected", updatedAt: new Date() });
      setActionMsg("Employer rejected.");
      setSelectedEmployer(prev => prev?.id === id ? { ...prev, verificationStatus: "rejected" } : prev);
      fetchAll();
    } catch (err) {
      setActionMsg("Update failed: " + err.message);
    }
  };

  const pendingInvites = invites.filter(i => i.status === "pending");
  const pendingVerification = employers.filter(e => e.verificationStatus === "submitted");
  const approvedEmployers = employers.filter(e => e.verificationStatus === "approved");

  return (
    <div style={s.page}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sidebarLogo}>Cronos<br /><span style={s.sidebarSub}>Admin Panel</span></div>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(i); setSelectedInvite(null); setSelectedEmployer(null); }}
            style={{ ...s.navBtn, ...(activeTab === i ? s.navBtnActive : {}) }}
          >
            {tab}
            {i === 0 && pendingInvites.length > 0 && <span style={s.badge}>{pendingInvites.length}</span>}
            {i === 1 && pendingVerification.length > 0 && <span style={s.badge}>{pendingVerification.length}</span>}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => navigate("/")} style={s.navBtn}>← Back to Site</button>
        <button onClick={handleSignOut} style={{ ...s.navBtn, color: "#ff4f6a" }}>Sign Out</button>
      </div>

      {/* Main */}
      <div style={s.main}>
        <div style={s.topbar}>
          <h1 style={s.pageTitle}>{TABS[activeTab]}</h1>
          {actionMsg && (
            <div style={s.actionMsg} onClick={() => setActionMsg("")}>{actionMsg} ✕</div>
          )}
        </div>

        {loading ? (
          <div style={s.empty}>Loading...</div>
        ) : (
          <>
            {/* Tab 0 — Expressions of Interest */}
            {activeTab === 0 && (
              <div style={s.splitLayout}>
                <div style={s.listCol}>
                  {invites.length === 0 ? (
                    <div style={s.empty}>No expressions of interest yet.</div>
                  ) : (
                    invites.map(inv => (
                      <div
                        key={inv.id}
                        style={{ ...s.inviteCard, ...(selectedInvite?.id === inv.id ? s.inviteCardActive : {}) }}
                        onClick={() => setSelectedInvite(inv)}
                      >
                        <div style={s.inviteCardTop}>
                          <div style={s.inviteAvatar}>{inv.firstName?.[0]}{inv.lastName?.[0]}</div>
                          <div style={s.inviteInfo}>
                            <div style={s.inviteName}>{inv.firstName} {inv.lastName}</div>
                            <div style={s.inviteCompany}>{inv.companyName}</div>
                          </div>
                          <span style={{ ...s.pill, ...pillColor(inv.status) }}>{inv.status}</span>
                        </div>
                        <div style={s.inviteMeta}>
                          <span>📍 {inv.province}</span>
                          <span>🏭 {inv.industry}</span>
                          <span>👥 {inv.companySize}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div style={s.drawer}>
                  {!selectedInvite ? (
                    <div style={s.drawerEmpty}>
                      <div style={s.drawerEmptyIcon}>📋</div>
                      <p>Select a submission to review details</p>
                    </div>
                  ) : (
                    <div style={s.drawerInner}>
                      <div style={s.drawerHeader}>
                        <div style={s.drawerAvatar}>{selectedInvite.firstName?.[0]}{selectedInvite.lastName?.[0]}</div>
                        <div style={s.drawerHeaderInfo}>
                          <div style={s.drawerName}>{selectedInvite.firstName} {selectedInvite.lastName}</div>
                          <div style={s.drawerSub}>{selectedInvite.companyName}</div>
                        </div>
                        <span style={{ ...s.pill, ...pillColor(selectedInvite.status), marginLeft: "auto" }}>{selectedInvite.status}</span>
                      </div>

                      <div style={s.drawerSection}>
                        <div style={s.drawerSectionTitle}>Contact Details</div>
                        <InfoRow label="Email" value={selectedInvite.email} />
                        <InfoRow label="Phone" value={selectedInvite.phone} />
                      </div>

                      <div style={s.drawerSection}>
                        <div style={s.drawerSectionTitle}>Company Details</div>
                        <InfoRow label="Company" value={selectedInvite.companyName} />
                        <InfoRow label="Industry" value={selectedInvite.industry} />
                        <InfoRow label="Province" value={selectedInvite.province} />
                        <InfoRow label="Size" value={selectedInvite.companySize} />
                      </div>

                      {selectedInvite.message && (
                        <div style={s.drawerSection}>
                          <div style={s.drawerSectionTitle}>Message</div>
                          <div style={s.messageBox}>{selectedInvite.message}</div>
                        </div>
                      )}

                      <div style={s.drawerSection}>
                        <div style={s.drawerSectionTitle}>Submitted</div>
                        <div style={s.dateText}>
                          {selectedInvite.createdAt?.toDate?.().toLocaleDateString("en-ZA", {
                            year: "numeric", month: "long", day: "numeric"
                          }) || "—"}
                        </div>
                      </div>

                      <div style={s.drawerActions}>
                        {selectedInvite.status === "pending" && (
                          <>
                            <button style={s.btnGreen} onClick={() => updateInviteStatus(selectedInvite.id, "approved")}>
                              ✓ Approve
                            </button>
                            <button style={s.btnRed} onClick={() => updateInviteStatus(selectedInvite.id, "rejected")}>
                              ✕ Reject
                            </button>
                          </>
                        )}
                        {selectedInvite.status === "approved" && (
                          <button style={s.btnBlue} onClick={() => sendInvite(selectedInvite)}>
                            📧 Send Invite Email
                          </button>
                        )}
                        {selectedInvite.status === "invited" && (
                          <div style={s.statusNote}>✓ Invite email sent</div>
                        )}
                        {selectedInvite.status === "registered" && (
                          <div style={s.statusNote}>✓ Employer registered</div>
                        )}
                        {selectedInvite.status === "rejected" && (
                          <div style={{ ...s.statusNote, color: "#ff4f6a" }}>✕ Application rejected</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 1 — Pending Verification */}
            {activeTab === 1 && (
              <div style={s.splitLayout}>
                <div style={s.listCol}>
                  {pendingVerification.length === 0 ? (
                    <div style={s.empty}>No pending verifications.</div>
                  ) : (
                    pendingVerification.map(emp => (
                      <div
                        key={emp.id}
                        style={{ ...s.inviteCard, ...(selectedEmployer?.id === emp.id ? s.inviteCardActive : {}) }}
                        onClick={() => setSelectedEmployer(emp)}
                      >
                        <div style={s.inviteCardTop}>
                          <div style={s.inviteAvatar}>{emp.companyName?.[0]}</div>
                          <div style={s.inviteInfo}>
                            <div style={s.inviteName}>{emp.companyName}</div>
                            <div style={s.inviteCompany}>{emp.email}</div>
                          </div>
                          <span style={{ ...s.pill, ...pillColor(emp.verificationStatus) }}>{emp.verificationStatus}</span>
                        </div>
                        <div style={s.inviteMeta}>
                          <span>🏭 {emp.industry}</span>
                          <span>📍 {emp.province}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div style={s.drawer}>
                  {!selectedEmployer ? (
                    <div style={s.drawerEmpty}>
                      <div style={s.drawerEmptyIcon}>🏢</div>
                      <p>Select an employer to review</p>
                    </div>
                  ) : (
                    <div style={s.drawerInner}>
                      <div style={s.drawerHeader}>
                        <div style={s.drawerAvatar}>{selectedEmployer.companyName?.[0]}</div>
                        <div style={s.drawerHeaderInfo}>
                          <div style={s.drawerName}>{selectedEmployer.companyName}</div>
                          <div style={s.drawerSub}>{selectedEmployer.email}</div>
                        </div>
                        <span style={{ ...s.pill, ...pillColor(selectedEmployer.verificationStatus), marginLeft: "auto" }}>{selectedEmployer.verificationStatus}</span>
                      </div>

                      <div style={s.drawerSection}>
                        <div style={s.drawerSectionTitle}>Company Info</div>
                        <InfoRow label="Industry" value={selectedEmployer.industry} />
                        <InfoRow label="Size" value={selectedEmployer.companySize} />
                        <InfoRow label="Province" value={selectedEmployer.province} />
                        <InfoRow label="City" value={selectedEmployer.city} />
                        <InfoRow label="Website" value={selectedEmployer.website} />
                      </div>

                      <div style={s.drawerSection}>
                        <div style={s.drawerSectionTitle}>Contact Person</div>
                        <InfoRow label="Name" value={`${selectedEmployer.contactFirstName || ""} ${selectedEmployer.contactLastName || ""}`} />
                        <InfoRow label="Email" value={selectedEmployer.contactEmail} />
                        <InfoRow label="Phone" value={selectedEmployer.contactPhone} />
                        <InfoRow label="Title" value={selectedEmployer.contactTitle} />
                        <InfoRow label="ID Number" value={selectedEmployer.contactIdNumber} />
                      </div>

                      <div style={s.drawerSection}>
                        <div style={s.drawerSectionTitle}>Documents</div>
                        {selectedEmployer.documents?.cipc && (
                          <a href={selectedEmployer.documents.cipc} target="_blank" rel="noreferrer" style={s.docLink}>📄 CIPC Certificate</a>
                        )}
                        {selectedEmployer.documents?.id && (
                          <a href={selectedEmployer.documents.id} target="_blank" rel="noreferrer" style={s.docLink}>📄 ID Document</a>
                        )}
                        {selectedEmployer.documents?.addr && (
                          <a href={selectedEmployer.documents.addr} target="_blank" rel="noreferrer" style={s.docLink}>📄 Proof of Address</a>
                        )}
                        {selectedEmployer.documents?.auth && (
                          <a href={selectedEmployer.documents.auth} target="_blank" rel="noreferrer" style={s.docLink}>📄 Auth Letter</a>
                        )}
                        {!selectedEmployer.documents && <div style={s.dateText}>No documents uploaded yet.</div>}
                      </div>

                      <div style={s.drawerActions}>
                        {selectedEmployer.verificationStatus === "submitted" && (
                          <>
                            <button style={s.btnGreen} onClick={() => approveEmployer(selectedEmployer.id)}>✓ Approve</button>
                            <button style={s.btnRed} onClick={() => rejectEmployer(selectedEmployer.id)}>✕ Reject</button>
                          </>
                        )}
                        {selectedEmployer.verificationStatus === "approved" && (
                          <div style={s.statusNote}>✓ Employer approved</div>
                        )}
                        {selectedEmployer.verificationStatus === "rejected" && (
                          <div style={{ ...s.statusNote, color: "#ff4f6a" }}>✕ Employer rejected</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2 — Approved Employers */}
            {activeTab === 2 && (
              <div style={s.tableWrap}>
                {approvedEmployers.length === 0 ? <div style={s.empty}>No approved employers yet.</div> : (
                  <table style={s.table}>
                    <thead>
                      <tr>
                        {["Company", "Email", "Plan", "Plan Status", "Update Plan"].map(h => (
                          <th key={h} style={s.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {approvedEmployers.map(emp => (
                        <tr key={emp.id} style={s.tr}>
                          <td style={s.td}>{emp.companyName}</td>
                          <td style={s.td}>{emp.email}</td>
                          <td style={s.td}>{emp.plan || "none"}</td>
                          <td style={s.td}><span style={{ ...s.pill, ...pillColor(emp.planStatus) }}>{emp.planStatus || "inactive"}</span></td>
                          <td style={s.td}>
                            <div style={s.actions}>
                              {["Starter", "Growth", "Enterprise"].map(plan => (
                                <button
                                  key={plan}
                                  style={s.btnBlue}
                                  onClick={() => updateEmployerPlan(emp.id, plan, "active")}
                                >
                                  {plan}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Tab 3 — All Jobs */}
            {activeTab === 3 && (
              <div style={s.tableWrap}>
                {jobs.length === 0 ? <div style={s.empty}>No jobs posted yet.</div> : (
                  <table style={s.table}>
                    <thead>
                      <tr>
                        {["Title", "Company", "Province", "Type", "Status", "Posted"].map(h => (
                          <th key={h} style={s.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map(job => (
                        <tr key={job.id} style={s.tr}>
                          <td style={s.td}>{job.title}</td>
                          <td style={s.td}>{job.employerName}</td>
                          <td style={s.td}>{job.province}</td>
                          <td style={s.td}>{job.type}</td>
                          <td style={s.td}><span style={{ ...s.pill, ...pillColor(job.status) }}>{job.status}</span></td>
                          <td style={s.td}>{job.createdAt?.toDate?.().toLocaleDateString() || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Tab 4 — Invoices */}
        {activeTab === 4 && (
        <div style={s.tableWrap}>
            {approvedEmployers.length === 0 ? (
            <div style={s.empty}>No approved employers yet.</div>
            ) : (
            <table style={s.table}>
                <thead>
                <tr>
                    {["Company", "Email", "Live Jobs", "Amount Payable", "Due Date", "Status"].map(h => (
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
                    return (
                    <tr key={emp.id} style={s.tr}>
                        <td style={s.td}>{emp.companyName}</td>
                        <td style={s.td}>{emp.email}</td>
                        <td style={s.td}>{empLiveJobs.length}</td>
                        <td style={s.td}>
                        <span style={{ color: amount > 0 ? "#f5a623" : "#3d4f73", fontWeight: "600" }}>
                            R {amount.toLocaleString("en-ZA")}
                        </span>
                        </td>
                        <td style={s.td}>{dueStr}</td>
                        <td style={s.td}>
                        <span style={{ ...s.pill, ...(amount > 0 ? { background: "rgba(245,166,35,0.12)", color: "#f5a623" } : { background: "rgba(107,127,163,0.12)", color: "#6b7fa3" }) }}>
                            {amount > 0 ? "Outstanding" : "Nothing owed"}
                        </span>
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
  );
}

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
    approved: { background: "rgba(0,229,160,0.12)", color: "#00e5a0" },
    active: { background: "rgba(0,229,160,0.12)", color: "#00e5a0" },
    live: { background: "rgba(0,229,160,0.12)", color: "#00e5a0" },
    pending: { background: "rgba(245,166,35,0.12)", color: "#f5a623" },
    submitted: { background: "rgba(0,153,250,0.12)", color: "#0099fa" },
    invited: { background: "rgba(0,153,250,0.12)", color: "#0099fa" },
    expiring: { background: "rgba(245,166,35,0.12)", color: "#f5a623" },
    rejected: { background: "rgba(255,79,106,0.12)", color: "#ff4f6a" },
    expired: { background: "rgba(255,79,106,0.12)", color: "#ff4f6a" },
    inactive: { background: "rgba(107,127,163,0.12)", color: "#6b7fa3" },
    draft: { background: "rgba(107,127,163,0.12)", color: "#6b7fa3" },
    registered: { background: "rgba(0,229,160,0.12)", color: "#00e5a0" },
  };
  return map[status] || { background: "rgba(107,127,163,0.12)", color: "#6b7fa3" };
}

const s = {
  page: { display: "flex", minHeight: "100vh", background: "#080d1b", fontFamily: "sans-serif" },
  sidebar: { width: "220px", flexShrink: 0, background: "#0d1428", borderRight: "1px solid #1e2d52", padding: "32px 16px", display: "flex", flexDirection: "column", gap: "4px" },
  sidebarLogo: { color: "#0099fa", fontWeight: "700", fontSize: "18px", marginBottom: "32px", lineHeight: 1.3 },
  sidebarSub: { color: "#6b7fa3", fontSize: "11px", fontWeight: "400" },
  navBtn: { background: "none", border: "none", color: "#6b7fa3", fontSize: "13px", padding: "10px 12px", borderRadius: "8px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" },
  navBtnActive: { background: "rgba(0,153,250,0.12)", color: "#0099fa" },
  badge: { background: "#0099fa", color: "#fff", borderRadius: "10px", fontSize: "10px", padding: "2px 7px", fontWeight: "700" },
  main: { flex: 1, padding: "40px", overflowX: "auto" },
  topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "12px" },
  pageTitle: { color: "#e8edf8", fontSize: "22px", fontWeight: "700", margin: 0 },
  actionMsg: { background: "rgba(0,153,250,0.12)", border: "1px solid rgba(0,153,250,0.3)", color: "#0099fa", borderRadius: "8px", padding: "10px 16px", fontSize: "13px", cursor: "pointer" },
  splitLayout: { display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px", alignItems: "start" },
  listCol: { display: "flex", flexDirection: "column", gap: "10px" },
  inviteCard: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "12px", padding: "16px", cursor: "pointer", transition: "border-color 0.15s" },
  inviteCardActive: { borderColor: "#0099fa", background: "rgba(0,153,250,0.05)" },
  inviteCardTop: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" },
  inviteAvatar: { width: "36px", height: "36px", borderRadius: "50%", background: "#131b33", border: "1px solid #1e2d52", color: "#6b7fa3", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  inviteInfo: { flex: 1 },
  inviteName: { color: "#e8edf8", fontSize: "14px", fontWeight: "600" },
  inviteCompany: { color: "#6b7fa3", fontSize: "12px" },
  inviteMeta: { display: "flex", gap: "14px", fontSize: "12px", color: "#3d4f73" },
  drawer: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "12px", position: "sticky", top: "40px", minHeight: "400px" },
  drawerEmpty: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "400px", color: "#3d4f73", fontSize: "14px", gap: "12px" },
  drawerEmptyIcon: { fontSize: "32px" },
  drawerInner: { padding: "24px" },
  drawerHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid #1e2d52" },
  drawerAvatar: { width: "44px", height: "44px", borderRadius: "50%", background: "#131b33", border: "1px solid #1e2d52", color: "#6b7fa3", fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  drawerHeaderInfo: { flex: 1 },
  drawerName: { color: "#e8edf8", fontSize: "16px", fontWeight: "700" },
  drawerSub: { color: "#6b7fa3", fontSize: "13px" },
  drawerSection: { marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid #1e2d52" },
  drawerSectionTitle: { color: "#0099fa", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" },
  infoRow: { display: "flex", justifyContent: "space-between", gap: "12px", padding: "7px 0", borderBottom: "1px solid #131b33", fontSize: "13px" },
  infoLabel: { color: "#6b7fa3" },
  infoValue: { color: "#e8edf8", textAlign: "right", maxWidth: "60%", wordBreak: "break-all" },
  messageBox: { background: "#131b33", border: "1px solid #1e2d52", borderRadius: "8px", padding: "12px", color: "#6b7fa3", fontSize: "13px", lineHeight: "1.6" },
  dateText: { color: "#6b7fa3", fontSize: "13px" },
  drawerActions: { display: "flex", gap: "10px", flexWrap: "wrap", paddingTop: "4px" },
  statusNote: { color: "#00e5a0", fontSize: "13px", fontWeight: "500" },
  docLink: { display: "block", color: "#0099fa", fontSize: "13px", textDecoration: "none", padding: "6px 0", borderBottom: "1px solid #131b33" },
  pill: { padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "500", whiteSpace: "nowrap" },
  actions: { display: "flex", gap: "8px", flexWrap: "wrap" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  th: { color: "#6b7fa3", fontWeight: "500", textAlign: "left", padding: "10px 14px", borderBottom: "1px solid #1e2d52", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #1e2d52" },
  td: { color: "#e8edf8", padding: "12px 14px", verticalAlign: "middle" },
  btnGreen: { background: "rgba(0,229,160,0.12)", color: "#00e5a0", border: "1px solid rgba(0,229,160,0.25)", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", cursor: "pointer" },
  btnRed: { background: "rgba(255,79,106,0.12)", color: "#ff4f6a", border: "1px solid rgba(255,79,106,0.25)", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", cursor: "pointer" },
  btnBlue: { background: "rgba(0,153,250,0.12)", color: "#0099fa", border: "1px solid rgba(0,153,250,0.25)", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", cursor: "pointer" },
  empty: { color: "#6b7fa3", padding: "40px 0", textAlign: "center" },
  dimText: { color: "#6b7fa3", fontSize: "12px" },
};