import { useState, useEffect } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate, Link } from "react-router-dom";
import { db, storage } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import EmployerSidebar from '../../components/EmployerSidebar';

const FONT = '"Circular Std", "Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

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

  // ── Verification guard ──
  if (employerProfile?.verificationStatus !== "approved") {
    return (
      <>
        <style>{`* { font-family: ${FONT} !important; } body { font-family: ${FONT} !important; }`}</style>
        <div style={s.page}>
        <EmployerSidebar />
        <div style={s.mainWrapper}>
          <div style={s.mainInner}>
            <div style={{ maxWidth: "480px", margin: "80px auto", background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "8px", padding: "40px 36px", textAlign: "center", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1)" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#fef7e0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ea8600" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h2 style={{ color: "#202124", fontSize: "18px", fontWeight: "600", marginBottom: "10px" }}>Profile locked until approved</h2>
              <p style={{ color: "#5f6368", fontSize: "13px", lineHeight: "1.7", marginBottom: "20px" }}>
                Your company profile can only be edited after your account has been verified and approved by Vetted.
                {employerProfile?.verificationStatus === "submitted" && " Your verification is currently under review."}
              </p>
              {(!employerProfile?.verificationStatus || employerProfile?.verificationStatus === "pending") && (
                <Link to="/employer/verify" style={{ display: "inline-block", background: "#1a73e8", color: "#ffffff", borderRadius: "4px", padding: "9px 20px", fontSize: "13px", fontWeight: "600", textDecoration: "none" }}>
                  Complete Verification
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <style>{`* { font-family: ${FONT} !important; } body { font-family: ${FONT} !important; }`}</style>
      <div style={s.page}>
      <EmployerSidebar />

      <div style={s.mainWrapper}>
        <div style={s.mainInner}>

          {/* Topbar */}
          <div style={s.topbar}>
            <div>
              <h1 style={s.pageTitle}>Settings</h1>
              <p style={s.pageSub}>Manage your public company profile and application preferences</p>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div style={s.alertError}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}
          {successMsg && (
            <div style={s.actionMsg}>{successMsg}</div>
          )}

          <form onSubmit={handleSave} style={s.layout}>

            {/* ── Left Column ── */}
            <div style={s.formCol}>

              {/* Logo & Branding */}
              <div style={s.card}>
                <div style={s.cardHeader}>
                  <div style={s.cardTitle}>Logo &amp; Branding</div>
                  <div style={s.cardSub}>Appears on your public company page and job listings</div>
                </div>

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
                    <p style={s.logoHint}>JPG, PNG or WebP · Max 2MB · Recommended 200×200px</p>
                    {logoFile && (
                      <p style={s.logoFileName}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 4 }}><polyline points="20 6 9 17 4 12"/></svg>
                        {logoFile.name}
                      </p>
                    )}
                  </div>
                </div>

                <div style={s.field}>
                  <label style={s.fieldLabel}>Brand Colour</label>
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

              {/* Company Information */}
              <div style={s.card}>
                <div style={s.cardHeader}>
                  <div style={s.cardTitle}>Company Information</div>
                  <div style={s.cardSub}>Basic details about your organisation</div>
                </div>
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
                <div style={s.cardHeader}>
                  <div style={s.cardTitle}>About the Company</div>
                  <div style={s.cardSub}>Tell job seekers about your culture, mission, and values</div>
                </div>
                <Field label="Company Description">
                  <textarea
                    style={{ ...s.input, minHeight: "120px", resize: "vertical", lineHeight: "1.6" }}
                    value={form.about}
                    onChange={set("about")}
                    placeholder="Tell job seekers about your company culture, mission, and values..."
                  />
                </Field>
              </div>

              {/* Applications Settings */}
              <div style={s.card}>
                <div style={s.cardHeader}>
                  <div style={s.cardTitle}>Applications Settings</div>
                  <div style={s.cardSub}>Where candidate applications are routed</div>
                </div>
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

              {/* Action Row */}
              <div style={s.actionRow}>
                <button type="button" onClick={() => navigate("/employer/dashboard")} style={s.btnCancel}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} style={s.btnSave}>
                  {loading ? "Saving…" : "Save Changes"}
                </button>
              </div>

            </div>

            {/* ── Right Column — Preview ── */}
            <div style={s.previewCol}>
              <div style={s.card}>
                <div style={s.previewHeaderBar}>
                  <span style={s.previewHeaderLabel}>Public Page Preview</span>
                  <span style={s.previewHeaderDot} />
                </div>

                {/* Brand banner */}
                <div style={{ ...s.previewBanner, background: form.brandColour + "18", borderColor: form.brandColour + "40" }}>
                  <div style={s.previewLogoWrap}>
                    {logoPreview
                      ? <img src={logoPreview} alt="Logo" style={s.previewLogo} />
                      : <div style={{ ...s.previewLogoPlaceholder, background: form.brandColour }}>{form.companyName?.[0] || "C"}</div>
                    }
                  </div>
                  <div style={s.previewCompanyName}>{form.companyName || "Company Name"}</div>
                  <div style={s.previewIndustry}>
                    {form.industry || "Industry"} · {form.city || "City"}{form.province ? `, ${form.province}` : ""}
                  </div>
                </div>

                {form.about && (
                  <div style={s.previewAbout}>
                    {form.about.slice(0, 200)}{form.about.length > 200 ? "…" : ""}
                  </div>
                )}

                {(form.website || form.linkedin) && (
                  <div style={s.previewLinks}>
                    {form.website && (
                      <a href={form.website} style={{ ...s.previewLink, color: form.brandColour }} target="_blank" rel="noreferrer">
                        🌐 Website
                      </a>
                    )}
                    {form.linkedin && (
                      <a href={form.linkedin} style={{ ...s.previewLink, color: form.brandColour }} target="_blank" rel="noreferrer">
                        💼 LinkedIn
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
    </>
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

// ── Styles ────────────────────────────────────────────────────────────
const s = {
  // ── Page Shell ──
  page: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    background: "#f4f5f7",
    fontFamily: FONT,
  },

  // ── Sidebar ──

  // ── Main Content ──
  mainWrapper: { flex: 1, height: "100%", overflowY: "auto", position: "relative" },
  mainInner: { padding: "32px 48px", maxWidth: "1400px", margin: "0 auto" },

  topbar: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", gap: "16px" },
  pageTitle: { color: "#202124", fontSize: "24px", fontWeight: "600", margin: "0 0 4px", letterSpacing: "-0.5px" },
  pageSub: { color: "#5f6368", fontSize: "14px", margin: 0 },

  // ── Alerts ──
  alertError: { background: "#fce8e6", border: "1px solid #f5c6c2", color: "#c5221f", borderRadius: "4px", padding: "12px 16px", fontSize: "13px", fontWeight: "500", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" },
  actionMsg: { background: "#323232", color: "#ffffff", borderRadius: "4px", padding: "12px 16px", fontSize: "13px", display: "inline-flex", alignItems: "center", marginBottom: "24px", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" },

  // ── Layout ──
  layout: { display: "grid", gridTemplateColumns: "1fr 300px", gap: "24px", alignItems: "start" },
  formCol: { display: "flex", flexDirection: "column", gap: "20px" },

  // ── Cards ──
  card: { background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "8px", padding: "24px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1)" },
  cardHeader: { marginBottom: "20px" },
  cardTitle: { color: "#202124", fontSize: "14px", fontWeight: "600", marginBottom: "2px" },
  cardSub: { color: "#5f6368", fontSize: "12px" },

  // ── Form Elements ──
  fields: { display: "flex", flexDirection: "column", gap: "14px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  fieldLabel: { color: "#5f6368", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.3px" },
  input: {
    background: "#ffffff",
    border: "1px solid #e3e3e3",
    borderRadius: "4px",
    padding: "9px 12px",
    color: "#202124",
    fontSize: "13px",
    outline: "none",
    width: "100%",
    fontFamily: FONT,
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },

  // ── Logo Upload ──
  logoRow: { display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" },
  logoPreview: { width: "68px", height: "68px", borderRadius: "8px", border: "1px solid #e3e3e3", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa" },
  logoImg: { width: "100%", height: "100%", objectFit: "contain" },
  logoPlaceholder: { color: "#1a73e8", fontWeight: "700", fontSize: "26px" },
  logoMeta: { flex: 1 },
  uploadBtn: { display: "inline-block", background: "#ffffff", border: "1px solid #dadce0", color: "#1a73e8", borderRadius: "4px", padding: "7px 14px", fontSize: "13px", fontWeight: "600", cursor: "pointer", marginBottom: "8px", transition: "background 0.2s" },
  logoHint: { color: "#9aa0a6", fontSize: "11px", lineHeight: "1.5", margin: 0 },
  logoFileName: { color: "#0d652d", fontSize: "12px", fontWeight: "500", margin: "6px 0 0", display: "flex", alignItems: "center" },

  // ── Brand Colour ──
  colourRow: { display: "flex", alignItems: "center", gap: "10px" },
  colourPicker: { width: "40px", height: "36px", border: "1px solid #e3e3e3", borderRadius: "4px", cursor: "pointer", padding: "2px", background: "#ffffff", flexShrink: 0 },
  colourSwatch: { width: "36px", height: "36px", borderRadius: "4px", flexShrink: 0, border: "1px solid #e3e3e3" },

  // ── Action Row ──
  actionRow: { display: "flex", gap: "12px", justifyContent: "flex-end", paddingBottom: "48px" },
  btnCancel: { background: "#ffffff", border: "1px solid #dadce0", color: "#3c4043", borderRadius: "4px", padding: "9px 20px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "background 0.2s" },
  btnSave: { background: "#1a73e8", color: "#ffffff", border: "none", borderRadius: "4px", padding: "9px 24px", fontSize: "13px", fontWeight: "600", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.1)", transition: "background 0.2s" },

  // ── Preview Column ──
  previewCol: { position: "sticky", top: "32px" },
  previewHeaderBar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "#f8f9fa", borderBottom: "1px solid #e3e3e3", borderRadius: "8px 8px 0 0", margin: "-24px -24px 20px -24px" },
  previewHeaderLabel: { color: "#5f6368", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" },
  previewHeaderDot: { width: "8px", height: "8px", borderRadius: "50%", background: "#34a853" },

  previewBanner: { border: "1px solid", borderRadius: "6px", padding: "20px 16px", textAlign: "center", marginBottom: "16px" },
  previewLogoWrap: { marginBottom: "10px", display: "flex", justifyContent: "center" },
  previewLogo: { width: "56px", height: "56px", borderRadius: "8px", objectFit: "contain" },
  previewLogoPlaceholder: { width: "56px", height: "56px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "700", fontSize: "24px" },
  previewCompanyName: { color: "#202124", fontSize: "16px", fontWeight: "600", marginBottom: "4px" },
  previewIndustry: { color: "#5f6368", fontSize: "12px" },
  previewAbout: { color: "#5f6368", fontSize: "12px", lineHeight: "1.6", marginBottom: "16px" },
  previewLinks: { display: "flex", gap: "12px", flexWrap: "wrap" },
  previewLink: { fontSize: "12px", textDecoration: "none", fontWeight: "600" },
};