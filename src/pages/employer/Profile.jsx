import { useState, useEffect } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { db, storage } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";

const PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal",
  "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"
];

const INDUSTRIES = [
  "Agriculture", "Automotive", "Construction", "Education", "Energy",
  "Finance & Banking", "Healthcare", "Hospitality", "IT & Technology",
  "Legal", "Logistics & Transport", "Manufacturing", "Media & Marketing",
  "Mining", "NGO & Non-Profit", "Real Estate", "Retail", "Telecommunications", "Other"
];

export default function Profile() {
  const { user, employerProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: "",
    industry: "",
    companySize: "",
    province: "",
    city: "",
    website: "",
    linkedin: "",
    about: "",
    appEmail: "",
    replyName: "",
    brandColour: "#0099fa",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (employerProfile) {
      setForm({
        companyName: employerProfile.companyName || "",
        industry: employerProfile.industry || "",
        companySize: employerProfile.companySize || "",
        province: employerProfile.province || "",
        city: employerProfile.city || "",
        website: employerProfile.website || "",
        linkedin: employerProfile.linkedin || "",
        about: employerProfile.about || "",
        appEmail: employerProfile.appEmail || "",
        replyName: employerProfile.replyName || "",
        brandColour: employerProfile.brandColour || "#0099fa",
      });
      if (employerProfile.logoUrl) setLogoPreview(employerProfile.logoUrl);
    }
  }, [employerProfile]);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!form.companyName) { setError("Company name is required."); return; }
    if (!form.appEmail) { setError("Applications email is required."); return; }

    setLoading(true);
    try {
      let logoUrl = employerProfile?.logoUrl || "";

      if (logoFile) {
        const storageRef = ref(storage, `employers/${user.uid}/logo/${logoFile.name}`);
        await uploadBytes(storageRef, logoFile);
        logoUrl = await getDownloadURL(storageRef);
      }

      const slug = form.companyName
        .toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      await updateDoc(doc(db, "employers", user.uid), {
        ...form,
        slug,
        logoUrl,
        updatedAt: serverTimestamp(),
      });

      await refreshProfile();
      setSuccessMsg("Profile saved successfully.");
      setLogoFile(null);
    } catch (err) {
      console.error(err);
      setError("Failed to save profile. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={s.page}>
      <Sidebar profile={employerProfile} />

      <div style={s.main}>
        <div style={s.topbar}>
          <div>
            <h1 style={s.pageTitle}>Company Profile</h1>
            <p style={s.pageSub}>This information appears on your public company page and job listings</p>
          </div>
        </div>

        {error && <div style={s.error}>{error}</div>}
        {successMsg && <div style={s.success}>{successMsg}</div>}

        <form onSubmit={handleSave} style={s.layout}>
          {/* Left column */}
          <div style={s.formCol}>

            {/* Logo & Brand */}
            <div style={s.card}>
              <div style={s.cardTitle}>Logo & Branding</div>
              <div style={s.logoRow}>
                <div style={s.logoPreview}>
                  {logoPreview
                    ? <img src={logoPreview} alt="Logo" style={s.logoImg} />
                    : <div style={s.logoPlaceholder}>{form.companyName?.[0] || "C"}</div>
                  }
                </div>
                <div style={s.logoMeta}>
                  <label style={s.uploadBtn}>
                    Upload Logo
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoChange} style={{ display: "none" }} />
                  </label>
                  <p style={s.logoHint}>JPG, PNG or WebP. Max 2MB. Recommended: 200×200px square.</p>
                  {logoFile && <p style={s.logoFileName}>✓ {logoFile.name}</p>}
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Brand Colour</label>
                <div style={s.colourRow}>
                  <input
                    type="color"
                    value={form.brandColour}
                    onChange={set("brandColour")}
                    style={s.colourPicker}
                  />
                  <input
                    style={{ ...s.input, flex: 1 }}
                    value={form.brandColour}
                    onChange={set("brandColour")}
                    placeholder="#0099fa"
                    maxLength={7}
                  />
                  <div style={{ ...s.colourSwatch, background: form.brandColour }} />
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div style={s.card}>
              <div style={s.cardTitle}>Company Information</div>
              <div style={s.fields}>
                <Field label="Company Name *">
                  <input style={s.input} value={form.companyName} onChange={set("companyName")} placeholder="Acme (Pty) Ltd" />
                </Field>
                <Row>
                  <Field label="Industry">
                    <select style={s.input} value={form.industry} onChange={set("industry")}>
                      <option value="">Select</option>
                      {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                    </select>
                  </Field>
                  <Field label="Company Size">
                    <select style={s.input} value={form.companySize} onChange={set("companySize")}>
                      <option value="">Select</option>
                      {["1–10","11–50","51–200","201–500","500+"].map(sz => <option key={sz}>{sz}</option>)}
                    </select>
                  </Field>
                </Row>
                <Row>
                  <Field label="Province">
                    <select style={s.input} value={form.province} onChange={set("province")}>
                      <option value="">Select</option>
                      {PROVINCES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </Field>
                  <Field label="City">
                    <input style={s.input} value={form.city} onChange={set("city")} placeholder="Johannesburg" />
                  </Field>
                </Row>
                <Row>
                  <Field label="Website">
                    <input style={s.input} value={form.website} onChange={set("website")} placeholder="https://acme.co.za" />
                  </Field>
                  <Field label="LinkedIn">
                    <input style={s.input} value={form.linkedin} onChange={set("linkedin")} placeholder="https://linkedin.com/company/..." />
                  </Field>
                </Row>
              </div>
            </div>

            {/* About */}
            <div style={s.card}>
              <div style={s.cardTitle}>About the Company</div>
              <Field label="Company Description">
                <textarea
                  style={{ ...s.input, minHeight: "120px", resize: "vertical" }}
                  value={form.about}
                  onChange={set("about")}
                  placeholder="Tell job seekers about your company culture, mission, and values..."
                />
              </Field>
            </div>

            {/* Applications Settings */}
            <div style={s.card}>
              <div style={s.cardTitle}>Applications Settings</div>
              <div style={s.fields}>
                <Row>
                  <Field label="Applications Email *">
                    <input style={s.input} type="email" value={form.appEmail} onChange={set("appEmail")} placeholder="careers@acme.co.za" />
                  </Field>
                  <Field label="Reply Name">
                    <input style={s.input} value={form.replyName} onChange={set("replyName")} placeholder="Acme Careers" />
                  </Field>
                </Row>
              </div>
            </div>

            <div style={s.actionRow}>
              <button type="button" onClick={() => navigate("/employer/dashboard")} style={s.btnCancel}>
                Cancel
              </button>
              <button type="submit" disabled={loading} style={s.btnSave}>
                {loading ? "Saving…" : "Save Profile"}
              </button>
            </div>
          </div>

          {/* Right column — preview */}
          <div style={s.previewCol}>
            <div style={s.card}>
              <div style={s.cardTitle}>Public Page Preview</div>
              <div style={{ ...s.previewBanner, background: form.brandColour + "22", borderColor: form.brandColour + "44" }}>
                <div style={s.previewLogoWrap}>
                  {logoPreview
                    ? <img src={logoPreview} alt="Logo" style={s.previewLogo} />
                    : <div style={{ ...s.previewLogoPlaceholder, background: form.brandColour }}>{form.companyName?.[0] || "C"}</div>
                  }
                </div>
                <div style={s.previewCompanyName}>{form.companyName || "Company Name"}</div>
                <div style={s.previewIndustry}>{form.industry || "Industry"} · {form.city || "City"}{form.province ? `, ${form.province}` : ""}</div>
              </div>
              {form.about && (
                <div style={s.previewAbout}>
                  {form.about.slice(0, 200)}{form.about.length > 200 ? "…" : ""}
                </div>
              )}
              <div style={s.previewLinks}>
                {form.website && <a href={form.website} style={{ ...s.previewLink, color: form.brandColour }} target="_blank" rel="noreferrer">🌐 Website</a>}
                {form.linkedin && <a href={form.linkedin} style={{ ...s.previewLink, color: form.brandColour }} target="_blank" rel="noreferrer">💼 LinkedIn</a>}
              </div>
            </div>
          </div>
        </form>
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
  topbar: { marginBottom: "32px" },
  pageTitle: { color: "#e8edf8", fontSize: "24px", fontWeight: "700", margin: "0 0 4px" },
  pageSub: { color: "#6b7fa3", fontSize: "14px", margin: 0 },
  error: { background: "rgba(255,79,106,0.1)", border: "1px solid rgba(255,79,106,0.3)", color: "#ff4f6a", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", marginBottom: "20px" },
  success: { background: "rgba(0,229,160,0.1)", border: "1px solid rgba(0,229,160,0.3)", color: "#00e5a0", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", marginBottom: "20px" },
  layout: { display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px", alignItems: "start" },
  formCol: { display: "flex", flexDirection: "column", gap: "20px" },
  card: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "12px", padding: "24px" },
  cardTitle: { color: "#e8edf8", fontSize: "15px", fontWeight: "600", marginBottom: "20px" },
  fields: { display: "flex", flexDirection: "column", gap: "14px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { color: "#6b7fa3", fontSize: "12px", fontWeight: "500" },
  input: { background: "#131b33", border: "1px solid #1e2d52", borderRadius: "8px", padding: "10px 13px", color: "#e8edf8", fontSize: "13px", outline: "none", width: "100%", fontFamily: "sans-serif" },
  logoRow: { display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" },
  logoPreview: { width: "72px", height: "72px", borderRadius: "12px", border: "1px solid #1e2d52", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#131b33" },
  logoImg: { width: "100%", height: "100%", objectFit: "contain" },
  logoPlaceholder: { color: "#0099fa", fontWeight: "800", fontSize: "28px" },
  logoMeta: { flex: 1 },
  uploadBtn: { display: "inline-block", background: "rgba(0,153,250,0.12)", border: "1px solid rgba(0,153,250,0.25)", color: "#0099fa", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", cursor: "pointer", marginBottom: "8px" },
  logoHint: { color: "#3d4f73", fontSize: "11px", lineHeight: "1.5", margin: 0 },
  logoFileName: { color: "#00e5a0", fontSize: "12px", margin: "6px 0 0" },
  colourRow: { display: "flex", alignItems: "center", gap: "10px" },
  colourPicker: { width: "44px", height: "38px", border: "1px solid #1e2d52", borderRadius: "8px", cursor: "pointer", padding: "2px", background: "#131b33" },
  colourSwatch: { width: "38px", height: "38px", borderRadius: "8px", flexShrink: 0 },
  actionRow: { display: "flex", gap: "12px", justifyContent: "flex-end" },
  btnCancel: { background: "none", border: "1px solid #1e2d52", color: "#6b7fa3", borderRadius: "8px", padding: "11px 20px", fontSize: "14px", cursor: "pointer" },
  btnSave: { background: "#0099fa", color: "#fff", border: "none", borderRadius: "8px", padding: "11px 24px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  previewCol: { position: "sticky", top: "40px" },
  previewBanner: { border: "1px solid", borderRadius: "10px", padding: "24px", textAlign: "center", marginBottom: "16px" },
  previewLogoWrap: { marginBottom: "12px", display: "flex", justifyContent: "center" },
  previewLogo: { width: "64px", height: "64px", borderRadius: "10px", objectFit: "contain" },
  previewLogoPlaceholder: { width: "64px", height: "64px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "800", fontSize: "28px" },
  previewCompanyName: { color: "#e8edf8", fontSize: "18px", fontWeight: "700", marginBottom: "4px" },
  previewIndustry: { color: "#6b7fa3", fontSize: "13px" },
  previewAbout: { color: "#6b7fa3", fontSize: "13px", lineHeight: "1.6", marginBottom: "16px", padding: "0 4px" },
  previewLinks: { display: "flex", gap: "12px", flexWrap: "wrap" },
  previewLink: { fontSize: "13px", textDecoration: "none", fontWeight: "500" },
};