import { useState, useEffect } from "react";
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, useSearchParams } from "react-router-dom";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";

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

    // Re-fetch fresh employer profile to guarantee slug is present
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
      <div style={s.empty}>Loading job...</div>
    </div>
  );

  return (
    <div style={s.page}>
      <Sidebar profile={employerProfile} />

      <div style={s.main}>
        <div style={s.topbar}>
          <div>
            <h1 style={s.pageTitle}>{isEdit ? "Edit Job" : "Post a Job"}</h1>
            <p style={s.pageSub}>{isEdit ? "Update your listing details" : "Fill in the details below to create a listing"}</p>
          </div>
          <button onClick={() => navigate("/employer/dashboard")} style={s.btnBack}>← Dashboard</button>
        </div>

        {error && <div style={s.error}>{error}</div>}
        {actionMsg && <div style={s.successMsg}>{actionMsg}</div>}

        <div style={s.layout}>
          <div style={s.formCol}>

            {/* Basic Info */}
            <Section title="Basic Information">
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
                  <input style={s.input} type="date" value={form.closes} onChange={set("closes")} />
                </Field>
              </Row>
              <label style={s.checkRow}>
                <input type="checkbox" checked={form.remote} onChange={set("remote")} />
                <span style={s.checkLabel}>Remote / hybrid position</span>
              </label>
            </Section>

            {/* Description */}
            <Section title="Job Description *">
              <textarea
                style={{ ...s.input, minHeight: "160px", resize: "vertical" }}
                value={form.description}
                onChange={set("description")}
                placeholder="Describe the role, team, and what success looks like..."
              />
            </Section>

            {/* Responsibilities */}
            <Section title="Responsibilities *">
              <div style={s.bulletInputRow}>
                <input
                  style={{ ...s.input, flex: 1 }}
                  value={respInput}
                  onChange={e => setRespInput(e.target.value)}
                  onKeyDown={handleKeyDown("responsibilities", respInput, setRespInput)}
                  placeholder="Type a responsibility and press Enter"
                />
                <button style={s.addBtn} onClick={() => addItem("responsibilities", respInput, setRespInput)}>Add</button>
              </div>
              <BulletList items={form.responsibilities} onRemove={(i) => removeItem("responsibilities", i)} />
            </Section>

            {/* Requirements */}
            <Section title="Requirements *">
              <div style={s.bulletInputRow}>
                <input
                  style={{ ...s.input, flex: 1 }}
                  value={reqInput}
                  onChange={e => setReqInput(e.target.value)}
                  onKeyDown={handleKeyDown("requirements", reqInput, setReqInput)}
                  placeholder="Type a requirement and press Enter"
                />
                <button style={s.addBtn} onClick={() => addItem("requirements", reqInput, setReqInput)}>Add</button>
              </div>
              <BulletList items={form.requirements} onRemove={(i) => removeItem("requirements", i)} />
            </Section>

            {/* Nice to Haves */}
            <Section title="Nice to Haves (optional)">
              <p style={s.sectionNote}>Skills or experience that are beneficial but not essential.</p>
              <div style={s.bulletInputRow}>
                <input
                  style={{ ...s.input, flex: 1 }}
                  value={niceInput}
                  onChange={e => setNiceInput(e.target.value)}
                  onKeyDown={handleKeyDown("niceToHaves", niceInput, setNiceInput)}
                  placeholder="e.g. Experience with Figma"
                />
                <button style={s.addBtn} onClick={() => addItem("niceToHaves", niceInput, setNiceInput)}>Add</button>
              </div>
              <BulletList items={form.niceToHaves} onRemove={(i) => removeItem("niceToHaves", i)} />
            </Section>

            {/* Special Notes */}
            <Section title="Special Notes (optional)">
              <p style={s.sectionNote}>Any additional information for applicants — working hours, travel requirements, dress code, etc.</p>
              <textarea
                style={{ ...s.input, minHeight: "100px", resize: "vertical" }}
                value={form.specialNotes}
                onChange={set("specialNotes")}
                placeholder="e.g. This role requires occasional travel to Durban. Flexi-hours available."
              />
            </Section>

            {/* Actions */}
            <div style={s.actionRow}>
              <button style={s.btnDraft} disabled={loading} onClick={() => handleSave("draft")}>
                Save as Draft
              </button>
              <button style={s.btnPublish} disabled={loading} onClick={() => handleSave("live")}>
                {loading ? "Saving…" : isEdit ? "Update & Publish" : "Publish Job"}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div style={s.previewCol}>
            <div style={s.previewCard}>
              <div style={s.previewLabel}>Live Preview</div>
              <div style={{ borderBottom: "1px solid #1e2d52", paddingBottom: "16px", marginBottom: "16px" }}>
                <div style={s.previewTitle}>{form.title || "Job Title"}</div>
                <div style={s.previewCompany}>{employerProfile?.companyName || "Your Company"}</div>
              </div>
              <div style={s.previewMeta}>
                <PreviewTag icon="📍" value={form.city && form.province ? `${form.city}, ${form.province}` : "Location"} />
                <PreviewTag icon="💼" value={form.type || "Job Type"} />
                {form.department && <PreviewTag icon="🏢" value={form.department} />}
                {form.salary && <PreviewTag icon="💰" value={form.salary} />}
                {form.remote && <PreviewTag icon="🌐" value="Remote / Hybrid" />}
                {form.closes && <PreviewTag icon="📅" value={`Closes ${form.closes}`} />}
              </div>
              {form.description && (
                <div style={s.previewDesc}>{form.description.slice(0, 200)}{form.description.length > 200 ? "…" : ""}</div>
              )}
              {form.responsibilities.length > 0 && (
                <div style={s.previewSection}>
                  <div style={s.previewSectionTitle}>Responsibilities</div>
                  {form.responsibilities.slice(0, 4).map((r, i) => (
                    <div key={i} style={s.previewBullet}>• {r}</div>
                  ))}
                </div>
              )}
              {form.requirements.length > 0 && (
                <div style={s.previewSection}>
                  <div style={s.previewSectionTitle}>Requirements</div>
                  {form.requirements.slice(0, 4).map((r, i) => (
                    <div key={i} style={s.previewBullet}>• {r}</div>
                  ))}
                </div>
              )}
              {form.niceToHaves.length > 0 && (
                <div style={s.previewSection}>
                  <div style={s.previewSectionTitle}>Nice to Haves</div>
                  {form.niceToHaves.slice(0, 3).map((r, i) => (
                    <div key={i} style={s.previewBullet}>• {r}</div>
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
            <div style={s.profilePlan}>{profile?.plan || "Verified Employer"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={s.sectionCard}>
      <div style={s.sectionTitle}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>{children}</div>
    </div>
  );
}

function Row({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>{children}</div>;
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ color: "#6b7fa3", fontSize: "12px", fontWeight: "500" }}>{label}</label>
      {children}
    </div>
  );
}

function BulletList({ items, onRemove }) {
  if (items.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
      {items.map((item, i) => (
        <div key={i} style={s.bulletItem}>
          <span style={{ color: "#0099fa", marginRight: "8px" }}>•</span>
          <span style={{ flex: 1, color: "#e8edf8", fontSize: "13px" }}>{item}</span>
          <button onClick={() => onRemove(i)} style={s.removeBtn}>✕</button>
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
  topbar: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", gap: "16px", flexWrap: "wrap" },
  pageTitle: { color: "#e8edf8", fontSize: "24px", fontWeight: "700", margin: "0 0 4px" },
  pageSub: { color: "#6b7fa3", fontSize: "14px", margin: 0 },
  btnBack: { background: "none", border: "1px solid #1e2d52", color: "#6b7fa3", borderRadius: "8px", padding: "9px 16px", fontSize: "13px", cursor: "pointer" },
  error: { background: "rgba(255,79,106,0.1)", border: "1px solid rgba(255,79,106,0.3)", color: "#ff4f6a", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", marginBottom: "20px" },
  successMsg: { background: "rgba(0,229,160,0.1)", border: "1px solid rgba(0,229,160,0.3)", color: "#00e5a0", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", marginBottom: "20px" },
  layout: { display: "grid", gridTemplateColumns: "1fr 360px", gap: "32px", alignItems: "start" },
  formCol: { display: "flex", flexDirection: "column", gap: "24px" },
  sectionCard: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "12px", padding: "24px" },
  sectionTitle: { color: "#e8edf8", fontSize: "15px", fontWeight: "600", marginBottom: "18px" },
  sectionNote: { color: "#3d4f73", fontSize: "12px", marginBottom: "8px", lineHeight: "1.5" },
  input: { background: "#131b33", border: "1px solid #1e2d52", borderRadius: "8px", padding: "10px 13px", color: "#e8edf8", fontSize: "13px", outline: "none", width: "100%", fontFamily: "sans-serif" },
  checkRow: { display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" },
  checkLabel: { color: "#6b7fa3", fontSize: "13px" },
  bulletInputRow: { display: "flex", gap: "10px" },
  addBtn: { background: "rgba(0,153,250,0.12)", color: "#0099fa", border: "1px solid rgba(0,153,250,0.25)", borderRadius: "8px", padding: "10px 16px", fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap" },
  bulletItem: { display: "flex", alignItems: "center", background: "#131b33", border: "1px solid #1e2d52", borderRadius: "6px", padding: "8px 12px" },
  removeBtn: { background: "none", border: "none", color: "#3d4f73", cursor: "pointer", fontSize: "12px", padding: "0 4px" },
  actionRow: { display: "flex", gap: "12px", justifyContent: "flex-end" },
  btnDraft: { background: "none", border: "1px solid #1e2d52", color: "#6b7fa3", borderRadius: "8px", padding: "11px 20px", fontSize: "14px", cursor: "pointer" },
  btnPublish: { background: "#0099fa", color: "#fff", border: "none", borderRadius: "8px", padding: "11px 24px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  previewCol: { position: "sticky", top: "40px" },
  previewCard: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "12px", padding: "24px" },
  previewLabel: { color: "#0099fa", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" },
  previewTitle: { color: "#e8edf8", fontSize: "18px", fontWeight: "700", marginBottom: "4px" },
  previewCompany: { color: "#6b7fa3", fontSize: "13px" },
  previewMeta: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" },
  previewTag: { display: "flex", alignItems: "center", gap: "6px", background: "#131b33", border: "1px solid #1e2d52", borderRadius: "6px", padding: "5px 10px", fontSize: "12px", color: "#6b7fa3" },
  previewDesc: { color: "#6b7fa3", fontSize: "13px", lineHeight: "1.6", marginBottom: "16px" },
  previewSection: { marginBottom: "12px" },
  previewSectionTitle: { color: "#e8edf8", fontSize: "12px", fontWeight: "600", marginBottom: "6px" },
  previewBullet: { color: "#6b7fa3", fontSize: "12px", lineHeight: "1.8" },
  empty: { color: "#6b7fa3", padding: "40px", textAlign: "center" },
};