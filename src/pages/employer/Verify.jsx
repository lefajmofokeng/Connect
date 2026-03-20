import { useState } from "react";
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

const STEPS = [
  "Company Info",
  "Contact Person",
  "Company Profile",
  "Documents",
  "Review & Submit"
];

export default function Verify() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    companyName: "", industry: "", companySize: "", province: "", city: "",
    website: "", linkedin: "",
    contactFirstName: "", contactLastName: "", contactEmail: "", contactPhone: "",
    contactTitle: "", contactIdNumber: "", selfAuthorised: false,
    about: "", appEmail: "", replyName: "", hiringProvinces: [],
    cipcFile: null, idFile: null, addrFile: null, authFile: null,
  });

  const set = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const setFile = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.files[0] || null }));
  };

  const toggleProvince = (p) => {
    setForm(prev => ({
      ...prev,
      hiringProvinces: prev.hiringProvinces.includes(p)
        ? prev.hiringProvinces.filter(x => x !== p)
        : [...prev.hiringProvinces, p]
    }));
  };

  const next = () => { setError(""); setStep(s => s + 1); };
  const back = () => { setError(""); setStep(s => s - 1); };

  const validateStep = () => {
    if (step === 0) {
      if (!form.companyName || !form.industry || !form.companySize || !form.province || !form.city)
        return "Please fill in all required fields.";
    }
    if (step === 1) {
      if (!form.contactFirstName || !form.contactLastName || !form.contactEmail || !form.contactPhone || !form.contactTitle || !form.contactIdNumber)
        return "Please fill in all required fields.";
    }
    if (step === 2) {
      if (!form.about || !form.appEmail || !form.replyName)
        return "Please fill in all required fields.";
      if (form.hiringProvinces.length === 0)
        return "Please select at least one hiring province.";
    }
    if (step === 3) {
      if (!form.cipcFile || !form.idFile || !form.addrFile)
        return "Please upload CIPC certificate, ID document, and proof of address.";
    }
    return "";
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    next();
  };

  const uploadFile = async (file, path) => {
    if (!file) return null;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const uid = user.uid;
      const base = `employers/${uid}/docs`;
      const [cipcUrl, idUrl, addrUrl, authUrl] = await Promise.all([
        uploadFile(form.cipcFile, `${base}/cipc`),
        uploadFile(form.idFile, `${base}/id`),
        uploadFile(form.addrFile, `${base}/addr`),
        uploadFile(form.authFile, `${base}/auth`),
      ]);
      await updateDoc(doc(db, "employers", uid), {
        companyName: form.companyName, industry: form.industry,
        companySize: form.companySize, province: form.province,
        city: form.city, website: form.website, linkedin: form.linkedin,
        contactFirstName: form.contactFirstName, contactLastName: form.contactLastName,
        contactEmail: form.contactEmail, contactPhone: form.contactPhone,
        contactTitle: form.contactTitle, contactIdNumber: form.contactIdNumber,
        selfAuthorised: form.selfAuthorised,
        about: form.about, appEmail: form.appEmail, replyName: form.replyName,
        hiringProvinces: form.hiringProvinces,
        documents: { cipc: cipcUrl, id: idUrl, addr: addrUrl, auth: authUrl || null },
        verificationStatus: "submitted",
        updatedAt: serverTimestamp(),
      });
      await refreshProfile();
      navigate("/employer/dashboard");
    } catch (err) {
      console.error(err);
      setError("Upload failed. Please check your files and try again.");
    }
    setLoading(false);
  };

  return (
    <div style={s.page}>

      {/* Left panel — branding + stepper */}
      <div style={s.leftPanel}>
        <div style={s.brandWrap}>
          <div style={s.logoMark}>V</div>
          <div style={s.brandName}>Vetted</div>
        </div>

        <div style={s.brandBody}>
          <h2 style={s.brandHeading}>Business Verification</h2>
          <p style={s.brandSub}>Complete all steps to submit your account for review.</p>

          {/* Vertical stepper */}
          <div style={s.stepper}>
            {STEPS.map((label, i) => {
              const isDone   = i < step;
              const isActive = i === step;
              return (
                <div key={label} style={s.stepItem}>
                  {/* Connector line */}
                  {i > 0 && (
                    <div style={{
                      ...s.stepConnector,
                      background: isDone || isActive ? "#1a73e8" : "#e3e3e3",
                    }} />
                  )}
                  <div style={s.stepRow}>
                    <div style={{
                      ...s.stepDot,
                      ...(isActive ? s.stepDotActive : {}),
                      ...(isDone   ? s.stepDotDone  : {}),
                    }}>
                      {isDone
                        ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        : i + 1
                      }
                    </div>
                    <span style={{
                      ...s.stepLabel,
                      ...(isActive ? s.stepLabelActive : {}),
                      ...(isDone   ? s.stepLabelDone  : {}),
                    }}>
                      {label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={s.brandFooter}>vetted.co.za</div>
      </div>

      {/* Right panel — form content */}
      <div style={s.rightPanel}>
        <div style={s.formWrap}>

          {/* Step header */}
          <div style={s.stepHeader}>
            <div style={s.stepBadge}>Step {step + 1} of {STEPS.length}</div>
            <h1 style={s.heading}>{STEPS[step]}</h1>
          </div>

          {/* Error */}
          {error && (
            <div style={s.alertError}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {/* ── Step 0 — Company Info ── */}
          {step === 0 && (
            <div style={s.form}>
              <Row>
                <Field label="Company Name *">
                  <input style={s.input} value={form.companyName} onChange={set("companyName")} placeholder="Acme (Pty) Ltd" />
                </Field>
                <Field label="Industry *">
                  <select style={s.input} value={form.industry} onChange={set("industry")}>
                    <option value="">Select</option>
                    {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                  </select>
                </Field>
              </Row>
              <Row>
                <Field label="Company Size *">
                  <select style={s.input} value={form.companySize} onChange={set("companySize")}>
                    <option value="">Select</option>
                    {["1–10","11–50","51–200","201–500","500+"].map(sz => <option key={sz}>{sz}</option>)}
                  </select>
                </Field>
                <Field label="Province *">
                  <select style={s.input} value={form.province} onChange={set("province")}>
                    <option value="">Select</option>
                    {PROVINCES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </Field>
              </Row>
              <Row>
                <Field label="City *">
                  <input style={s.input} value={form.city} onChange={set("city")} placeholder="Johannesburg" />
                </Field>
                <Field label="Website">
                  <input style={s.input} value={form.website} onChange={set("website")} placeholder="https://acme.co.za" />
                </Field>
              </Row>
              <Field label="LinkedIn">
                <input style={s.input} value={form.linkedin} onChange={set("linkedin")} placeholder="https://linkedin.com/company/acme" />
              </Field>
            </div>
          )}

          {/* ── Step 1 — Contact Person ── */}
          {step === 1 && (
            <div style={s.form}>
              <Row>
                <Field label="First Name *">
                  <input style={s.input} value={form.contactFirstName} onChange={set("contactFirstName")} placeholder="Jane" />
                </Field>
                <Field label="Last Name *">
                  <input style={s.input} value={form.contactLastName} onChange={set("contactLastName")} placeholder="Smith" />
                </Field>
              </Row>
              <Row>
                <Field label="Email *">
                  <input style={s.input} type="email" value={form.contactEmail} onChange={set("contactEmail")} placeholder="jane@acme.co.za" />
                </Field>
                <Field label="Phone *">
                  <input style={s.input} type="tel" value={form.contactPhone} onChange={set("contactPhone")} placeholder="071 000 0000" />
                </Field>
              </Row>
              <Row>
                <Field label="Job Title *">
                  <input style={s.input} value={form.contactTitle} onChange={set("contactTitle")} placeholder="HR Manager" />
                </Field>
                <Field label="SA ID Number *">
                  <input style={s.input} value={form.contactIdNumber} onChange={set("contactIdNumber")} placeholder="8001015009087" />
                </Field>
              </Row>
              <label style={s.checkRow}>
                <input type="checkbox" checked={form.selfAuthorised} onChange={set("selfAuthorised")} style={{ accentColor: "#1a73e8" }} />
                <span style={s.checkLabel}>I am authorised to act on behalf of this company</span>
              </label>
            </div>
          )}

          {/* ── Step 2 — Company Profile ── */}
          {step === 2 && (
            <div style={s.form}>
              <Field label="About the Company *">
                <textarea
                  style={{ ...s.input, minHeight: "100px", resize: "vertical", lineHeight: "1.6" }}
                  value={form.about}
                  onChange={set("about")}
                  placeholder="Tell job seekers about your company culture, mission, and what makes you a great employer..."
                />
              </Field>
              <Row>
                <Field label="Applications Email *">
                  <input style={s.input} type="email" value={form.appEmail} onChange={set("appEmail")} placeholder="careers@acme.co.za" />
                </Field>
                <Field label="Reply Name *">
                  <input style={s.input} value={form.replyName} onChange={set("replyName")} placeholder="Acme Careers" />
                </Field>
              </Row>
              <Field label="Hiring Provinces * (select all that apply)">
                <div style={s.checkGrid}>
                  {PROVINCES.map(p => (
                    <label key={p} style={s.checkRow}>
                      <input
                        type="checkbox"
                        checked={form.hiringProvinces.includes(p)}
                        onChange={() => toggleProvince(p)}
                        style={{ accentColor: "#1a73e8" }}
                      />
                      <span style={s.checkLabel}>{p}</span>
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {/* ── Step 3 — Documents ── */}
          {step === 3 && (
            <div style={s.form}>
              <div style={s.docNote}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Upload clear, legible copies. Accepted: PDF, JPG, PNG (max 5MB each).
              </div>
              <FileField
                label="CIPC Registration Certificate *"
                field="cipcFile"
                file={form.cipcFile}
                onChange={setFile("cipcFile")}
              />
              <FileField
                label="Director / Authorised Person ID *"
                field="idFile"
                file={form.idFile}
                onChange={setFile("idFile")}
              />
              <FileField
                label="Proof of Business Address *"
                field="addrFile"
                file={form.addrFile}
                onChange={setFile("addrFile")}
              />
              <FileField
                label="Letter of Authorisation (optional)"
                field="authFile"
                file={form.authFile}
                onChange={setFile("authFile")}
              />
            </div>
          )}

          {/* ── Step 4 — Review ── */}
          {step === 4 && (
            <div style={s.form}>
              <div style={s.reviewGrid}>
                <ReviewSection title="Company Info">
                  <ReviewRow label="Company"  value={form.companyName} />
                  <ReviewRow label="Industry" value={form.industry} />
                  <ReviewRow label="Size"     value={form.companySize} />
                  <ReviewRow label="Province" value={form.province} />
                  <ReviewRow label="City"     value={form.city} />
                </ReviewSection>
                <ReviewSection title="Contact Person">
                  <ReviewRow label="Name"  value={`${form.contactFirstName} ${form.contactLastName}`} />
                  <ReviewRow label="Email" value={form.contactEmail} />
                  <ReviewRow label="Phone" value={form.contactPhone} />
                  <ReviewRow label="Title" value={form.contactTitle} />
                </ReviewSection>
                <ReviewSection title="Profile">
                  <ReviewRow label="App Email"   value={form.appEmail} />
                  <ReviewRow label="Reply Name"  value={form.replyName} />
                  <ReviewRow label="Provinces"   value={form.hiringProvinces.join(", ")} />
                </ReviewSection>
                <ReviewSection title="Documents">
                  <ReviewRow label="CIPC"        value={form.cipcFile?.name || "—"} />
                  <ReviewRow label="ID"          value={form.idFile?.name || "—"} />
                  <ReviewRow label="Address"     value={form.addrFile?.name || "—"} />
                  <ReviewRow label="Auth Letter" value={form.authFile?.name || "Not provided"} />
                </ReviewSection>
              </div>
              <div style={s.submitNote}>
                By submitting, you confirm that all information and documents provided are accurate and authentic.
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={s.navRow}>
            {step > 0 && (
              <button onClick={back} disabled={loading} style={s.btnBack}>
                ← Back
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step < 4 && (
              <button onClick={handleNext} style={s.btnNext}>
                Continue →
              </button>
            )}
            {step === 4 && (
              <button onClick={handleSubmit} disabled={loading} style={s.btnSubmit}>
                {loading ? "Uploading & Submitting…" : "Submit for Review"}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────
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

function FileField({ label, file, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={s.fieldLabel}>{label}</label>
      <label style={s.fileLabel}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        {file ? file.name : "Choose file…"}
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={onChange} style={{ display: "none" }} />
      </label>
      {file && (
        <span style={s.fileName}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 4 }}><polyline points="20 6 9 17 4 12"/></svg>
          {file.name}
        </span>
      )}
    </div>
  );
}

function ReviewSection({ title, children }) {
  return (
    <div style={s.reviewSection}>
      <div style={s.reviewSectionTitle}>{title}</div>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div style={s.reviewRow}>
      <span style={s.reviewLabel}>{label}</span>
      <span style={s.reviewValue}>{value || "—"}</span>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const s = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#f4f5f7",
    fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  // ── Left branding panel ──
  leftPanel: {
    width: "280px",
    flexShrink: 0,
    background: "#ffffff",
    borderRight: "1px solid #e3e3e3",
    display: "flex",
    flexDirection: "column",
    padding: "48px 32px",
    position: "sticky",
    top: 0,
    height: "100vh",
  },
  brandWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "48px",
  },
  logoMark: {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    background: "#ffca28",
    color: "#d84315",
    fontWeight: "700",
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: { color: "#202124", fontWeight: "600", fontSize: "16px" },
  brandBody: { flex: 1 },
  brandHeading: {
    color: "#202124",
    fontSize: "18px",
    fontWeight: "600",
    margin: "0 0 6px",
    letterSpacing: "-0.3px",
  },
  brandSub: {
    color: "#5f6368",
    fontSize: "13px",
    lineHeight: "1.5",
    margin: "0 0 32px",
  },
  brandFooter: { color: "#9aa0a6", fontSize: "12px", fontWeight: "500" },

  // ── Vertical Stepper ──
  stepper: { display: "flex", flexDirection: "column" },
  stepItem: { display: "flex", flexDirection: "column" },
  stepConnector: {
    width: "2px",
    height: "20px",
    marginLeft: "11px",
    borderRadius: "1px",
  },
  stepRow: { display: "flex", alignItems: "center", gap: "12px" },
  stepDot: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "#f1f3f4",
    border: "2px solid #e3e3e3",
    color: "#9aa0a6",
    fontSize: "11px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepDotActive: {
    background: "#1a73e8",
    border: "2px solid #1a73e8",
    color: "#ffffff",
  },
  stepDotDone: {
    background: "#e6f4ea",
    border: "2px solid #34a853",
    color: "#0d652d",
  },
  stepLabel: {
    fontSize: "13px",
    color: "#9aa0a6",
    fontWeight: "500",
    lineHeight: 1.3,
  },
  stepLabelActive: { color: "#202124", fontWeight: "600" },
  stepLabelDone:   { color: "#0d652d" },

  // ── Right form panel ──
  rightPanel: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    padding: "48px 48px",
    overflowY: "auto",
  },
  formWrap: { width: "100%", maxWidth: "560px" },

  stepHeader: { marginBottom: "28px" },
  stepBadge: {
    display: "inline-flex",
    alignItems: "center",
    background: "#e3f2fd",
    color: "#1967d2",
    border: "1px solid #bdd7f5",
    borderRadius: "4px",
    padding: "3px 10px",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
    marginBottom: "10px",
  },
  heading: {
    color: "#202124",
    fontSize: "22px",
    fontWeight: "600",
    margin: 0,
    letterSpacing: "-0.4px",
  },

  // ── Alert ──
  alertError: {
    background: "#fce8e6",
    border: "1px solid #f5c6c2",
    color: "#c5221f",
    borderRadius: "4px",
    padding: "12px 16px",
    fontSize: "13px",
    fontWeight: "500",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  // ── Form elements ──
  form: { display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" },
  fieldLabel: {
    color: "#5f6368",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },
  input: {
    background: "#ffffff",
    border: "1px solid #e3e3e3",
    borderRadius: "4px",
    padding: "9px 12px",
    color: "#202124",
    fontSize: "13px",
    outline: "none",
    width: "100%",
    fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },

  // ── Checkboxes ──
  checkRow: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" },
  checkLabel: { color: "#3c4043", fontSize: "13px", fontWeight: "500" },
  checkGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "4px 0" },

  // ── File upload ──
  fileLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "#ffffff",
    border: "1px dashed #dadce0",
    borderRadius: "4px",
    padding: "10px 14px",
    color: "#5f6368",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "border-color 0.2s",
  },
  fileName: {
    color: "#0d652d",
    fontSize: "12px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
  },

  // ── Doc note ──
  docNote: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    background: "#e3f2fd",
    color: "#1967d2",
    border: "1px solid #bdd7f5",
    borderRadius: "4px",
    padding: "12px 14px",
    fontSize: "13px",
    lineHeight: "1.5",
    fontWeight: "400",
  },

  // ── Review grid ──
  reviewGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" },
  reviewSection: {
    background: "#ffffff",
    border: "1px solid #e3e3e3",
    borderRadius: "8px",
    padding: "16px 20px",
    boxShadow: "0 1px 2px 0 rgba(60,64,67,0.06)",
  },
  reviewSectionTitle: {
    color: "#5f6368",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "12px",
  },
  reviewRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "6px 0",
    borderBottom: "1px solid #f1f3f4",
    fontSize: "13px",
  },
  reviewLabel: { color: "#5f6368" },
  reviewValue: { color: "#202124", textAlign: "right", maxWidth: "60%", wordBreak: "break-word", fontWeight: "500" },

  // ── Submit note ──
  submitNote: {
    background: "#f8f9fa",
    border: "1px solid #e3e3e3",
    borderRadius: "4px",
    padding: "12px 16px",
    color: "#5f6368",
    fontSize: "13px",
    lineHeight: "1.6",
  },

  // ── Navigation buttons ──
  navRow: { display: "flex", alignItems: "center", gap: "12px", paddingBottom: "48px" },
  btnBack: {
    background: "#ffffff",
    border: "1px solid #dadce0",
    color: "#3c4043",
    borderRadius: "4px",
    padding: "9px 20px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  btnNext: {
    background: "#1a73e8",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    padding: "9px 24px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
    transition: "background 0.2s",
  },
  btnSubmit: {
    background: "#1a73e8",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    padding: "9px 24px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
    transition: "background 0.2s",
  },
};