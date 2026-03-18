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
    // Step 0 — Company Info
    companyName: "",
    industry: "",
    companySize: "",
    province: "",
    city: "",
    website: "",
    linkedin: "",
    // Step 1 — Contact Person
    contactFirstName: "",
    contactLastName: "",
    contactEmail: "",
    contactPhone: "",
    contactTitle: "",
    contactIdNumber: "",
    selfAuthorised: false,
    // Step 2 — Company Profile
    about: "",
    appEmail: "",
    replyName: "",
    hiringProvinces: [],
    // Step 3 — Documents
    cipcFile: null,
    idFile: null,
    addrFile: null,
    authFile: null,
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
        companyName: form.companyName,
        industry: form.industry,
        companySize: form.companySize,
        province: form.province,
        city: form.city,
        website: form.website,
        linkedin: form.linkedin,
        contactFirstName: form.contactFirstName,
        contactLastName: form.contactLastName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        contactTitle: form.contactTitle,
        contactIdNumber: form.contactIdNumber,
        selfAuthorised: form.selfAuthorised,
        about: form.about,
        appEmail: form.appEmail,
        replyName: form.replyName,
        hiringProvinces: form.hiringProvinces,
        documents: {
          cipc: cipcUrl,
          id: idUrl,
          addr: addrUrl,
          auth: authUrl || null,
        },
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
      <div style={s.card}>
        <div style={s.logo}>Cronos Jobs</div>
        <h1 style={s.heading}>Business Verification</h1>
        <p style={s.sub}>Complete all steps to submit your account for review.</p>

        {/* Stepper */}
        <div style={s.stepper}>
          {STEPS.map((label, i) => (
            <div key={label} style={s.stepItem}>
              <div style={{ ...s.stepDot, ...(i === step ? s.stepActive : i < step ? s.stepDone : {}) }}>
                {i < step ? "✓" : i + 1}
              </div>
              <div style={{ ...s.stepLabel, ...(i === step ? { color: "#e8edf8" } : {}) }}>{label}</div>
            </div>
          ))}
        </div>

        {error && <div style={s.error}>{error}</div>}

        {/* Step 0 — Company Info */}
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

        {/* Step 1 — Contact Person */}
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
              <input type="checkbox" checked={form.selfAuthorised} onChange={set("selfAuthorised")} />
              <span style={s.checkLabel}>I am authorised to act on behalf of this company</span>
            </label>
          </div>
        )}

        {/* Step 2 — Company Profile */}
        {step === 2 && (
          <div style={s.form}>
            <Field label="About the Company *">
              <textarea
                style={{ ...s.input, minHeight: "100px", resize: "vertical" }}
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
                    />
                    <span style={s.checkLabel}>{p}</span>
                  </label>
                ))}
              </div>
            </Field>
          </div>
        )}

        {/* Step 3 — Documents */}
        {step === 3 && (
          <div style={s.form}>
            <p style={s.docNote}>Upload clear, legible copies. Accepted formats: PDF, JPG, PNG (max 5MB each).</p>
            <Field label="CIPC Registration Certificate *">
              <input style={s.fileInput} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={setFile("cipcFile")} />
              {form.cipcFile && <span style={s.fileName}>✓ {form.cipcFile.name}</span>}
            </Field>
            <Field label="Director / Authorised Person ID *">
              <input style={s.fileInput} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={setFile("idFile")} />
              {form.idFile && <span style={s.fileName}>✓ {form.idFile.name}</span>}
            </Field>
            <Field label="Proof of Business Address *">
              <input style={s.fileInput} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={setFile("addrFile")} />
              {form.addrFile && <span style={s.fileName}>✓ {form.addrFile.name}</span>}
            </Field>
            <Field label="Letter of Authorisation (optional)">
              <input style={s.fileInput} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={setFile("authFile")} />
              {form.authFile && <span style={s.fileName}>✓ {form.authFile.name}</span>}
            </Field>
          </div>
        )}

        {/* Step 4 — Review */}
        {step === 4 && (
          <div style={s.form}>
            <div style={s.reviewGrid}>
              <ReviewSection title="Company Info">
                <ReviewRow label="Company" value={form.companyName} />
                <ReviewRow label="Industry" value={form.industry} />
                <ReviewRow label="Size" value={form.companySize} />
                <ReviewRow label="Province" value={form.province} />
                <ReviewRow label="City" value={form.city} />
              </ReviewSection>
              <ReviewSection title="Contact Person">
                <ReviewRow label="Name" value={`${form.contactFirstName} ${form.contactLastName}`} />
                <ReviewRow label="Email" value={form.contactEmail} />
                <ReviewRow label="Phone" value={form.contactPhone} />
                <ReviewRow label="Title" value={form.contactTitle} />
              </ReviewSection>
              <ReviewSection title="Profile">
                <ReviewRow label="App Email" value={form.appEmail} />
                <ReviewRow label="Reply Name" value={form.replyName} />
                <ReviewRow label="Provinces" value={form.hiringProvinces.join(", ")} />
              </ReviewSection>
              <ReviewSection title="Documents">
                <ReviewRow label="CIPC" value={form.cipcFile?.name || "—"} />
                <ReviewRow label="ID" value={form.idFile?.name || "—"} />
                <ReviewRow label="Address" value={form.addrFile?.name || "—"} />
                <ReviewRow label="Auth Letter" value={form.authFile?.name || "Not provided"} />
              </ReviewSection>
            </div>
            <p style={s.docNote}>
              By submitting, you confirm that all information and documents provided are accurate and authentic.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div style={s.navRow}>
          {step > 0 && (
            <button onClick={back} disabled={loading} style={s.btnBack}>← Back</button>
          )}
          <div style={{ flex: 1 }} />
          {step < 4 && (
            <button onClick={handleNext} style={s.btnNext}>Next →</button>
          )}
          {step === 4 && (
            <button onClick={handleSubmit} disabled={loading} style={s.btnSubmit}>
              {loading ? "Uploading & Submitting…" : "Submit for Review"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Small helper components
function Row({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>{children}</div>;
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
      <label style={{ color: "#6b7fa3", fontSize: "13px", fontWeight: "500" }}>{label}</label>
      {children}
    </div>
  );
}

function ReviewSection({ title, children }) {
  return (
    <div style={{ background: "#131b33", border: "1px solid #1e2d52", borderRadius: "10px", padding: "16px 20px" }}>
      <div style={{ color: "#0099fa", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>{title}</div>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "6px 0", borderBottom: "1px solid #1e2d52", fontSize: "13px" }}>
      <span style={{ color: "#6b7fa3" }}>{label}</span>
      <span style={{ color: "#e8edf8", textAlign: "right", maxWidth: "60%" }}>{value || "—"}</span>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#080d1b", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" },
  card: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "16px", padding: "48px 40px", width: "100%", maxWidth: "640px" },
  logo: { color: "#0099fa", fontWeight: "700", fontSize: "18px", marginBottom: "24px" },
  heading: { color: "#e8edf8", fontSize: "24px", fontWeight: "700", margin: "0 0 6px" },
  sub: { color: "#6b7fa3", fontSize: "14px", margin: "0 0 32px" },
  stepper: { display: "flex", gap: "8px", marginBottom: "36px", flexWrap: "wrap" },
  stepItem: { display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "80px" },
  stepDot: { width: "28px", height: "28px", borderRadius: "50%", background: "#131b33", border: "1px solid #1e2d52", color: "#3d4f73", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: "600" },
  stepActive: { background: "#0099fa", border: "1px solid #0099fa", color: "#fff" },
  stepDone: { background: "rgba(0,229,160,0.12)", border: "1px solid rgba(0,229,160,0.3)", color: "#00e5a0" },
  stepLabel: { fontSize: "11px", color: "#3d4f73", lineHeight: 1.3 },
  error: { background: "rgba(255,79,106,0.1)", border: "1px solid rgba(255,79,106,0.3)", color: "#ff4f6a", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", marginBottom: "20px" },
  form: { display: "flex", flexDirection: "column", gap: "18px", marginBottom: "32px" },
  input: { background: "#131b33", border: "1px solid #1e2d52", borderRadius: "8px", padding: "11px 14px", color: "#e8edf8", fontSize: "14px", outline: "none", width: "100%", fontFamily: "sans-serif" },
  fileInput: { background: "#131b33", border: "1px dashed #1e2d52", borderRadius: "8px", padding: "11px 14px", color: "#6b7fa3", fontSize: "13px", width: "100%", cursor: "pointer" },
  fileName: { color: "#00e5a0", fontSize: "12px", marginTop: "4px" },
  checkRow: { display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" },
  checkLabel: { color: "#6b7fa3", fontSize: "13px" },
  checkGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "4px 0" },
  docNote: { color: "#6b7fa3", fontSize: "13px", lineHeight: "1.6", background: "#131b33", border: "1px solid #1e2d52", borderRadius: "8px", padding: "12px 16px" },
  reviewGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" },
  navRow: { display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" },
  btnBack: { background: "none", border: "1px solid #1e2d52", color: "#6b7fa3", borderRadius: "8px", padding: "11px 20px", fontSize: "14px", cursor: "pointer" },
  btnNext: { background: "#0099fa", color: "#fff", border: "none", borderRadius: "8px", padding: "11px 24px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  btnSubmit: { background: "#00e5a0", color: "#080d1b", border: "none", borderRadius: "8px", padding: "11px 24px", fontSize: "14px", fontWeight: "700", cursor: "pointer" },
};