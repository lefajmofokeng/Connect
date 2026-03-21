import { useState, useEffect } from "react";
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, useSearchParams } from "react-router-dom";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import NotificationDrawer from "../../components/NotificationDrawer";

const PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal",
  "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"
];

const JOB_TYPES = ["Full-Time", "Part-Time", "Contract", "Temporary", "Internship", "Freelance"];

const DEPARTMENTS = [
  "Administration", "Customer Service", "Engineering", "Finance", "Human Resources",
  "IT & Technology", "Legal", "Logistics", "Management", "Marketing", "Operations",
  "Sales", "Supply Chain", "Other"
];

export default function PostJob() {
  const { user, employerProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEdit = !!editId;

  const [form, setForm] = useState({
    title: "", department: "", type: "", province: "", city: "",
    salary: "", remote: false, description: "", closes: "", closesTime: "17:00",
    responsibilities: [], requirements: [], niceToHaves: [], specialNotes: "", status: "draft",
  });

  const [respInput, setRespInput] = useState("");
  const [reqInput, setReqInput] = useState("");
  const [niceInput, setNiceInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    if (isEdit) loadJob();
  }, [editId]);

  const loadJob = async () => {
    try {
      const snap = await getDoc(doc(db, "jobs", editId));
      if (snap.exists()) {
        const d = snap.data();
        setForm({
          title: d.title || "",
          department: d.department || "",
          type: d.type || "",
          province: d.province || "",
          city: d.city || "",
          salary: d.salary || "",
          remote: d.remote || false,
          description: d.description || "",
          closes: d.closes || "",
          closesTime: d.closesTime || "17:00",
          responsibilities: d.responsibilities || [],
          requirements: d.requirements || [],
          niceToHaves: d.niceToHaves || [],
          specialNotes: d.specialNotes || "",
          status: d.status || "draft",
        });
      }
    } catch (err) {
      console.error(err);
    }
    setFetching(false);
  };

  const set = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addItem = (field, input, setInput) => {
    const val = input.trim();
    if (!val) return;
    setForm(prev => ({ ...prev, [field]: [...prev[field], val] }));
    setInput("");
  };

  const removeItem = (field, index) => {
    setForm(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const handleKeyDown = (field, input, setInput) => (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem(field, input, setInput);
    }
  };

  const validate = () => {
    if (!form.title) return "Job title is required.";
    if (!form.type) return "Job type is required.";
    if (!form.province) return "Province is required.";
    if (!form.city) return "City is required.";
    if (!form.description) return "Job description is required.";
    if (!form.closes) return "Closing date is required.";
    if (form.responsibilities.length === 0) return "Please add at least one responsibility.";
    if (form.requirements.length === 0) return "Please add at least one requirement.";
    return "";
  };

  const handleSave = async (publishStatus) => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);

    const slug = `${form.title}-${form.city}`
      .toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    let freshSlug = employerProfile?.slug || "";
    if (!freshSlug) {
      try {
        const freshSnap = await getDoc(doc(db, "employers", user.uid));
        if (freshSnap.exists()) freshSlug = freshSnap.data().slug || "";
      } catch (e) {
        console.error("Failed to fetch employer slug:", e);
      }
    }

    const payload = {
      ...form,
      slug,
      status: publishStatus,
      employerId: user.uid,
      employerName: employerProfile?.companyName || "",
      employerSlug: freshSlug,
      logoUrl: employerProfile?.logoUrl || "",
      brandColour: employerProfile?.brandColour || "#0099fa",
      applyEmail: employerProfile?.appEmail || "",
      updatedAt: serverTimestamp(),
    };
    try {
      if (isEdit) {
        await updateDoc(doc(db, "jobs", editId), payload);
        setActionMsg(publishStatus === "live" ? "Job published!" : "Draft saved.");
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, "jobs"), payload);
        setActionMsg(publishStatus === "live" ? "Job published!" : "Draft saved.");
      }
      setTimeout(() => navigate("/employer/dashboard"), 1200);
    } catch (err) {
      console.error(err);
      setError("Failed to save. Please try again.");
    }
    setLoading(false);
  };

  if (fetching) return (
    <div style={s.page}>
      <Sidebar profile={employerProfile} userId={user?.uid} />
      <div style={s.mainWrapper}>
        <div style={s.mainInner}>
          <div style={s.empty}>Fetching document...</div>
        </div>
      </div>
    </div>
  );

  // ── Disabled account guard ──
  if (employerProfile?.disabled) return (
    <div style={s.page}>
      <Sidebar profile={employerProfile} userId={user?.uid} />
      <div style={s.mainWrapper}>
        <div style={s.mainInner}>
          <div style={s.disabledGuard}>
            <div style={s.disabledIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c5221f" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
              </svg>
            </div>
            <h2 style={s.disabledTitle}>Account Suspended</h2>
            <p style={s.disabledText}>
              Your account has been temporarily suspended by Vetted. You cannot post new jobs at this time.
              Your existing data, applications and billing history are fully intact.
            </p>
            <p style={s.disabledContact}>
              To resolve this, please contact us at{" "}
              <a href="mailto:support@vetted.co.za" style={{ color: "#1a73e8", fontWeight: "600" }}>
                support@vetted.co.za
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <Sidebar profile={employerProfile} userId={user?.uid} />

      <div style={s.mainWrapper}>
        <div style={s.mainInner}>

          {/* Topbar */}
          <div style={s.topbar}>
            <div>
              <h1 style={s.pageTitle}>
                {isEdit ? "Edit Listing" : "Deploy Job"}
              </h1>
              <p style={s.pageSub}>
                {isEdit
                  ? `Editing document · ${editId}`
                  : "Configure and publish a new job listing to the database"}
              </p>
            </div>
            <button onClick={() => navigate("/employer/dashboard")} style={s.btnBack}>
              ← Dashboard
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div style={s.alertError}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}
          {actionMsg && (
            <div style={s.actionMsg}>{actionMsg}</div>
          )}

          {/* Layout */}
          <div style={s.layout}>

            {/* ── Form Column ── */}
            <div style={s.formCol}>

              {/* Basic Info */}
              <Section title="Basic Information" subtitle="Core listing metadata">
                <Field label="Job Title *">
                  <input style={s.input} value={form.title} onChange={set("title")} placeholder="e.g. Senior Software Engineer" />
                </Field>
                <Row>
                  <Field label="Department">
                    <select style={s.input} value={form.department} onChange={set("department")}>
                      <option value="">Select department</option>
                      {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </Field>
                  <Field label="Job Type *">
                    <select style={s.input} value={form.type} onChange={set("type")}>
                      <option value="">Select type</option>
                      {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </Field>
                </Row>
                <Row>
                  <Field label="Province *">
                    <select style={s.input} value={form.province} onChange={set("province")}>
                      <option value="">Select province</option>
                      {PROVINCES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </Field>
                  <Field label="City *">
                    <input style={s.input} value={form.city} onChange={set("city")} placeholder="e.g. Cape Town" />
                  </Field>
                </Row>
                <Row>
                  <Field label="Salary (optional)">
                    <input style={s.input} value={form.salary} onChange={set("salary")} placeholder="e.g. R25 000 – R35 000 pm" />
                  </Field>
                  <Field label="Closing Date *">
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        style={{ ...s.input, flex: 2 }}
                        type="date"
                        value={form.closes}
                        onChange={set("closes")}
                      />
                      <input
                        style={{ ...s.input, flex: 1, minWidth: 0 }}
                        type="time"
                        value={form.closesTime}
                        onChange={set("closesTime")}
                      />
                    </div>
                    <div style={s.closesHint}>Applications after this date and time will not be accepted.</div>
                  </Field>
                </Row>
                <label style={s.checkRow}>
                  <input type="checkbox" checked={form.remote} onChange={set("remote")} style={{ accentColor: "#1a73e8" }} />
                  <span style={s.checkLabel}>Remote / hybrid position</span>
                </label>
              </Section>

              {/* Description */}
              <Section title="Job Description *" subtitle="Describe the role, team, and what success looks like">
                <textarea
                  style={{ ...s.input, minHeight: "160px", resize: "vertical", lineHeight: "1.6" }}
                  value={form.description}
                  onChange={set("description")}
                  placeholder="Describe the role, team, and what success looks like..."
                />
              </Section>

              {/* Responsibilities */}
              <Section title="Responsibilities *" subtitle="Key duties — press Enter or click Add">
                <div style={s.bulletInputRow}>
                  <input
                    style={{ ...s.input, flex: 1 }}
                    value={respInput}
                    onChange={e => setRespInput(e.target.value)}
                    onKeyDown={handleKeyDown("responsibilities", respInput, setRespInput)}
                    placeholder="Type a responsibility and press Enter"
                  />
                  <button style={s.addBtn} onClick={() => addItem("responsibilities", respInput, setRespInput)}>
                    + Add
                  </button>
                </div>
                <BulletList items={form.responsibilities} onRemove={(i) => removeItem("responsibilities", i)} />
              </Section>

              {/* Requirements */}
              <Section title="Requirements *" subtitle="Must-have qualifications and skills">
                <div style={s.bulletInputRow}>
                  <input
                    style={{ ...s.input, flex: 1 }}
                    value={reqInput}
                    onChange={e => setReqInput(e.target.value)}
                    onKeyDown={handleKeyDown("requirements", reqInput, setReqInput)}
                    placeholder="Type a requirement and press Enter"
                  />
                  <button style={s.addBtn} onClick={() => addItem("requirements", reqInput, setReqInput)}>
                    + Add
                  </button>
                </div>
                <BulletList items={form.requirements} onRemove={(i) => removeItem("requirements", i)} />
              </Section>

              {/* Nice to Haves */}
              <Section title="Nice to Haves" subtitle="Beneficial but not essential — optional">
                <div style={s.bulletInputRow}>
                  <input
                    style={{ ...s.input, flex: 1 }}
                    value={niceInput}
                    onChange={e => setNiceInput(e.target.value)}
                    onKeyDown={handleKeyDown("niceToHaves", niceInput, setNiceInput)}
                    placeholder="e.g. Experience with Figma"
                  />
                  <button style={s.addBtn} onClick={() => addItem("niceToHaves", niceInput, setNiceInput)}>
                    + Add
                  </button>
                </div>
                <BulletList items={form.niceToHaves} onRemove={(i) => removeItem("niceToHaves", i)} />
              </Section>

              {/* Special Notes */}
              <Section title="Special Notes" subtitle="Working hours, travel requirements, dress code, etc. — optional">
                <textarea
                  style={{ ...s.input, minHeight: "100px", resize: "vertical", lineHeight: "1.6" }}
                  value={form.specialNotes}
                  onChange={set("specialNotes")}
                  placeholder="e.g. This role requires occasional travel to Durban. Flexi-hours available."
                />
              </Section>

              {/* Action Row */}
              <div style={s.actionRow}>
                <button style={s.btnDraft} disabled={loading} onClick={() => handleSave("draft")}>
                  Save as Draft
                </button>
                <button style={s.btnPublish} disabled={loading} onClick={() => handleSave("live")}>
                  {loading ? "Saving…" : isEdit ? "Update & Publish" : "Publish Job"}
                </button>
              </div>

            </div>

            {/* ── Preview Column ── */}
            <div style={s.previewCol}>
              <div style={s.previewCard}>

                {/* Preview header */}
                <div style={s.previewHeaderBar}>
                  <span style={s.previewHeaderLabel}>Live Preview</span>
                  <span style={s.previewHeaderDot} />
                </div>

                <div style={s.previewBody}>
                  <div style={s.previewTitle}>{form.title || "Job Title"}</div>
                  <div style={s.previewCompany}>{employerProfile?.companyName || "Your Company"}</div>

                  <div style={s.previewDivider} />

                  <div style={s.previewMeta}>
                    <PreviewTag icon="📍" value={form.city && form.province ? `${form.city}, ${form.province}` : "Location"} />
                    <PreviewTag icon="💼" value={form.type || "Job Type"} />
                    {form.department && <PreviewTag icon="🏢" value={form.department} />}
                    {form.salary && <PreviewTag icon="💰" value={form.salary} />}
                    {form.remote && <PreviewTag icon="🌐" value="Remote / Hybrid" />}
                    {form.closes && <PreviewTag icon="📅" value={`Closes ${form.closes}${form.closesTime ? ` at ${form.closesTime}` : ""}`} />}
                  </div>

                  {form.description && (
                    <div style={s.previewDesc}>
                      {form.description.slice(0, 200)}{form.description.length > 200 ? "…" : ""}
                    </div>
                  )}

                  {form.responsibilities.length > 0 && (
                    <div style={s.previewSection}>
                      <div style={s.previewSectionTitle}>Responsibilities</div>
                      {form.responsibilities.slice(0, 4).map((r, i) => (
                        <div key={i} style={s.previewBullet}>· {r}</div>
                      ))}
                    </div>
                  )}
                  {form.requirements.length > 0 && (
                    <div style={s.previewSection}>
                      <div style={s.previewSectionTitle}>Requirements</div>
                      {form.requirements.slice(0, 4).map((r, i) => (
                        <div key={i} style={s.previewBullet}>· {r}</div>
                      ))}
                    </div>
                  )}
                  {form.niceToHaves.length > 0 && (
                    <div style={s.previewSection}>
                      <div style={s.previewSectionTitle}>Nice to Haves</div>
                      {form.niceToHaves.slice(0, 3).map((r, i) => (
                        <div key={i} style={s.previewBullet}>· {r}</div>
                      ))}
                    </div>
                  )}
                  {form.specialNotes && (
                    <div style={s.previewSection}>
                      <div style={s.previewSectionTitle}>Special Notes</div>
                      <div style={{ ...s.previewBullet, fontStyle: "italic" }}>
                        {form.specialNotes.slice(0, 100)}{form.specialNotes.length > 100 ? "…" : ""}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────
function Sidebar({ profile, userId }) {
  const navigate = useNavigate();
  const path = window.location.pathname;
  const navItems = [
    { label: "Project Overview",        to: "/employer/dashboard",    icon: "⌂" },
    { label: "Deploy Job",              to: "/employer/post-job",     icon: "+" },
    { label: "Database (Applications)", to: "/employer/applications", icon: "≡" },
    { label: "Analytics",               to: "/employer/analytics",    icon: "📊" },
    { label: "Billing",                 to: "/employer/billing",      icon: "💳" },
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
        <div style={{ marginBottom: "8px" }}>
          <NotificationDrawer userId={userId} />
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────
function Section({ title, subtitle, children }) {
  return (
    <div style={s.sectionCard}>
      <div style={s.sectionHeader}>
        <div style={s.sectionTitle}>{title}</div>
        {subtitle && <div style={s.sectionSub}>{subtitle}</div>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {children}
      </div>
    </div>
  );
}

function Row({ children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={s.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

function BulletList({ items, onRemove }) {
  if (items.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
      {items.map((item, i) => (
        <div key={i} style={s.bulletItem}>
          <span style={s.bulletDot}>·</span>
          <span style={s.bulletText}>{item}</span>
          <button onClick={() => onRemove(i)} style={s.removeBtn} title="Remove">✕</button>
        </div>
      ))}
    </div>
  );
}

function PreviewTag({ icon, value }) {
  return (
    <div style={s.previewTag}>
      <span>{icon}</span>
      <span>{value}</span>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const s = {
  // ── Page Shell (matches Dashboard/Applications exactly) ──
  page: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    background: "#f4f5f7",
    fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  // ── Sidebar ──
  sidebar: {
    width: "256px",
    flexShrink: 0,
    height: "100%",
    background: "#ffffff",
    borderRight: "1px solid #e3e3e3",
    display: "flex",
    flexDirection: "column",
    zIndex: 10,
  },
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

  topbar: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", gap: "16px", flexWrap: "wrap" },
  pageTitle: { color: "#202124", fontSize: "24px", fontWeight: "600", margin: "0 0 4px", letterSpacing: "-0.5px" },
  pageSub: { color: "#5f6368", fontSize: "14px", margin: 0 },

  btnBack: { background: "#ffffff", border: "1px solid #dadce0", color: "#3c4043", borderRadius: "4px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "background 0.2s", whiteSpace: "nowrap" },

  // ── Alerts ──
  alertError: { background: "#fce8e6", border: "1px solid #f5c6c2", color: "#c5221f", borderRadius: "4px", padding: "12px 16px", fontSize: "13px", fontWeight: "500", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" },
  actionMsg: { background: "#323232", color: "#ffffff", borderRadius: "4px", padding: "12px 16px", fontSize: "13px", display: "inline-flex", alignItems: "center", marginBottom: "24px", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" },

  // ── Layout ──
  layout: { display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" },
  formCol: { display: "flex", flexDirection: "column", gap: "20px" },

  // ── Section Cards ──
  sectionCard: { background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "8px", padding: "24px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1)" },
  sectionHeader: { marginBottom: "18px" },
  sectionTitle: { color: "#202124", fontSize: "14px", fontWeight: "600", marginBottom: "2px" },
  sectionSub: { color: "#5f6368", fontSize: "12px", fontWeight: "400" },

  // ── Form Elements ──
  fieldLabel: { color: "#5f6368", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.3px" },
  input: {
    background: "#ffffff",
    border: "1px solid #e3e3e3",
    borderRadius: "4px",
    padding: "9px 12px",
    color: "#202124",
    fontSize: "13px",
    fontWeight: "400",
    outline: "none",
    width: "100%",
    fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  checkRow: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" },
  checkLabel: { color: "#3c4043", fontSize: "13px", fontWeight: "500" },
  closesHint: { color: "#9aa0a6", fontSize: "11px", marginTop: "4px" },

  // ── Bullet Input ──
  bulletInputRow: { display: "flex", gap: "10px" },
  addBtn: { background: "#ffffff", border: "1px solid #dadce0", color: "#1a73e8", borderRadius: "4px", padding: "9px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", transition: "background 0.2s" },
  bulletItem: { display: "flex", alignItems: "center", gap: "8px", background: "#f8f9fa", border: "1px solid #e3e3e3", borderRadius: "4px", padding: "8px 12px" },
  bulletDot: { color: "#1a73e8", fontWeight: "700", flexShrink: 0 },
  bulletText: { flex: 1, color: "#3c4043", fontSize: "13px" },
  removeBtn: { background: "none", border: "none", color: "#9aa0a6", cursor: "pointer", fontSize: "11px", padding: "0 2px", lineHeight: 1, transition: "color 0.2s" },

  // ── Action Row ──
  actionRow: { display: "flex", gap: "12px", justifyContent: "flex-end", paddingBottom: "48px" },
  btnDraft: { background: "#ffffff", border: "1px solid #dadce0", color: "#3c4043", borderRadius: "4px", padding: "9px 20px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "background 0.2s" },
  btnPublish: { background: "#1a73e8", color: "#ffffff", border: "none", borderRadius: "4px", padding: "9px 24px", fontSize: "13px", fontWeight: "600", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.1)", transition: "background 0.2s" },

  // ── Preview Column ──
  previewCol: { position: "sticky", top: "32px" },
  previewCard: { background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1)" },

  previewHeaderBar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "#f8f9fa", borderBottom: "1px solid #e3e3e3" },
  previewHeaderLabel: { color: "#5f6368", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" },
  previewHeaderDot: { width: "8px", height: "8px", borderRadius: "50%", background: "#34a853" },

  previewBody: { padding: "20px" },
  previewTitle: { color: "#202124", fontSize: "16px", fontWeight: "600", marginBottom: "2px" },
  previewCompany: { color: "#5f6368", fontSize: "13px", marginBottom: "12px" },
  previewDivider: { borderTop: "1px solid #e3e3e3", marginBottom: "12px" },
  previewMeta: { display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" },
  previewTag: { display: "flex", alignItems: "center", gap: "5px", background: "#f8f9fa", border: "1px solid #e3e3e3", borderRadius: "4px", padding: "4px 8px", fontSize: "11px", color: "#5f6368", fontWeight: "500" },
  previewDesc: { color: "#5f6368", fontSize: "12px", lineHeight: "1.6", marginBottom: "14px" },
  previewSection: { marginBottom: "12px" },
  previewSectionTitle: { color: "#202124", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "6px" },
  previewBullet: { color: "#5f6368", fontSize: "12px", lineHeight: "1.8", paddingLeft: "4px" },

  // ── Empty ──
  empty: { color: "#5f6368", padding: "48px", textAlign: "center", fontSize: "14px", fontWeight: "500" },

  // ── Disabled account guard ──
  disabledGuard: { maxWidth: "480px", margin: "80px auto", background: "#ffffff", border: "1px solid #f5c6c2", borderRadius: "8px", padding: "40px 36px", textAlign: "center", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1)" },
  disabledIcon: { width: "56px", height: "56px", background: "#fce8e6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" },
  disabledTitle: { color: "#202124", fontSize: "18px", fontWeight: "600", marginBottom: "12px", letterSpacing: "-0.3px" },
  disabledText: { color: "#5f6368", fontSize: "14px", lineHeight: "1.7", marginBottom: "16px" },
  disabledContact: { color: "#5f6368", fontSize: "13px", lineHeight: "1.6" },
};