import { useState, useEffect } from "react";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db, storage } from "../../lib/firebase";

const STEPS = ["Personal Info", "Documents", "Review & Submit"];

const OPTIONAL_DOCS = [
  { key: "academic", label: "Academic Certificates" },
  { key: "sars", label: "SARS Letter / Tax Clearance" },
  { key: "residence", label: "Proof of Residence" },
  { key: "reference", label: "Reference Letter" },
  { key: "drivers", label: "Driver's Licence" },
  { key: "other", label: "Other Document" },
];

export default function Apply() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    city: "", notice: "", experience: "", salaryExpectation: "", coverNote: "",
  });

  // Required files
  const [cvFile, setCvFile] = useState(null);
  const [idFile, setIdFile] = useState(null);

  // Optional files — object keyed by doc type
  const [optionalFiles, setOptionalFiles] = useState({});

  const [declarations, setDeclarations] = useState({
    accurate: false, rightToWork: false, consent: false,
  });

  useEffect(() => { fetchJob(); }, [id]);

  const fetchJob = async () => {
    try {
      const snap = await getDoc(doc(db, "jobs", id));
      if (snap.exists()) setJob({ id: snap.id, ...snap.data() });
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));
  const setDecl = (field) => (e) => setDeclarations(prev => ({ ...prev, [field]: e.target.checked }));

  const setOptionalFile = (key) => (e) => {
    const file = e.target.files[0] || null;
    setOptionalFiles(prev => ({ ...prev, [key]: file }));
  };

  const removeOptionalFile = (key) => {
    setOptionalFiles(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.city)
        return "Please fill in all required fields.";
    }
    if (step === 1) {
      if (!cvFile) return "CV / Resume is required.";
      if (!idFile) return "ID Document is required.";
      if (!declarations.accurate || !declarations.rightToWork || !declarations.consent)
        return "Please accept all declarations to continue.";
    }
    return "";
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    setStep(s => s + 1);
  };

  const uploadFile = async (file, path) => {
    if (!file) return null;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const appId = `${id}_${Date.now()}`;
      const base = `applications/${appId}`;

      // Upload required files
      const [cvPath, idPath] = await Promise.all([
        uploadFile(cvFile, `${base}/cv_${cvFile.name}`),
        uploadFile(idFile, `${base}/id_${idFile.name}`),
      ]);

      // Upload optional files
      const optionalPaths = {};
      await Promise.all(
        Object.entries(optionalFiles).map(async ([key, file]) => {
          if (file) {
            const url = await uploadFile(file, `${base}/${key}_${file.name}`);
            optionalPaths[key] = { url, filename: file.name };
          }
        })
      );

      await addDoc(collection(db, "applications"), {
        jobId: id,
        jobTitle: job.title,
        jobDepartment: job.department || "",
        employerId: job.employerId,
        employerName: job.employerName,
        applyEmail: job.applyEmail || "",
        ...form,
        // Required docs
        cvPath,
        cvMime: cvFile.type,
        cvFilename: cvFile.name,
        idPath,
        idFilename: idFile.name,
        // Optional docs
        optionalDocs: optionalPaths,
        status: "new",
        notes: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError("Submission failed. Please check your files and try again.");
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div style={s.page}><Navbar /><div style={s.empty}>Loading...</div></div>
  );

  if (!job) return (
    <div style={s.page}><Navbar /><div style={s.empty}>Job not found.</div></div>
  );

  if (submitted) return (
    <div style={s.page}>
      <Navbar />
      <div style={s.body}>
        <div style={s.successCard}>
          <div style={s.successIcon}>✓</div>
          <h1 style={s.successTitle}>Application Submitted!</h1>
          <p style={s.successSub}>
            Your application for <strong style={{ color: "#e8edf8" }}>{job.title}</strong> at{" "}
            <strong style={{ color: "#e8edf8" }}>{job.employerName}</strong> has been received. Good luck!
          </p>
          <div style={s.successActions}>
            <button onClick={() => navigate("/jobs")} style={s.btnPrimary}>Browse More Jobs</button>
            <button onClick={() => navigate("/")} style={s.btnOutline}>Back to Home</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.body}>
        <div style={s.inner}>
          <button onClick={() => navigate(`/jobs/${id}`)} style={s.backBtn}>← Back to Job</button>

          <div style={s.layout}>
            <div style={s.formCol}>
              <div style={s.card}>
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

                {/* Step 0 — Personal Info */}
                {step === 0 && (
                  <div style={s.form}>
                    <Row>
                      <Field label="First Name *">
                        <input style={s.input} value={form.firstName} onChange={set("firstName")} placeholder="Jane" />
                      </Field>
                      <Field label="Last Name *">
                        <input style={s.input} value={form.lastName} onChange={set("lastName")} placeholder="Smith" />
                      </Field>
                    </Row>
                    <Row>
                      <Field label="Email Address *">
                        <input style={s.input} type="email" value={form.email} onChange={set("email")} placeholder="jane@email.com" />
                      </Field>
                      <Field label="Phone Number *">
                        <input style={s.input} type="tel" value={form.phone} onChange={set("phone")} placeholder="071 000 0000" />
                      </Field>
                    </Row>
                    <Row>
                      <Field label="City *">
                        <input style={s.input} value={form.city} onChange={set("city")} placeholder="Cape Town" />
                      </Field>
                      <Field label="Notice Period">
                        <input style={s.input} value={form.notice} onChange={set("notice")} placeholder="e.g. 1 month" />
                      </Field>
                    </Row>
                    <Row>
                      <Field label="Years of Experience">
                        <input style={s.input} value={form.experience} onChange={set("experience")} placeholder="e.g. 3 years" />
                      </Field>
                      <Field label="Salary Expectation">
                        <input style={s.input} value={form.salaryExpectation} onChange={set("salaryExpectation")} placeholder="e.g. R25 000 pm" />
                      </Field>
                    </Row>
                    <Field label="Cover Note">
                      <textarea
                        style={{ ...s.input, minHeight: "120px", resize: "vertical" }}
                        value={form.coverNote}
                        onChange={set("coverNote")}
                        placeholder="Briefly introduce yourself and why you're a great fit..."
                      />
                    </Field>
                  </div>
                )}

                {/* Step 1 — Documents */}
                {step === 1 && (
                  <div style={s.form}>
                    <div style={s.uploadNote}>
                      Accepted formats: PDF, DOC, DOCX, JPG, PNG. Max 5MB per file.
                    </div>

                    {/* Required */}
                    <div style={s.docGroup}>
                      <div style={s.docGroupTitle}>Required Documents</div>

                      <Field label="CV / Resume *">
                        {cvFile ? (
                          <div style={s.fileAttached}>
                            <span style={s.fileAttachedName}>📄 {cvFile.name}</span>
                            <button style={s.removeFileBtn} onClick={() => setCvFile(null)}>✕ Remove</button>
                          </div>
                        ) : (
                          <label style={s.fileLabel}>
                            <span>+ Attach CV / Resume</span>
                            <input type="file" accept=".pdf,.doc,.docx" onChange={e => setCvFile(e.target.files[0] || null)} style={{ display: "none" }} />
                          </label>
                        )}
                      </Field>

                      <Field label="ID Document *">
                        {idFile ? (
                          <div style={s.fileAttached}>
                            <span style={s.fileAttachedName}>📄 {idFile.name}</span>
                            <button style={s.removeFileBtn} onClick={() => setIdFile(null)}>✕ Remove</button>
                          </div>
                        ) : (
                          <label style={s.fileLabel}>
                            <span>+ Attach ID Document</span>
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setIdFile(e.target.files[0] || null)} style={{ display: "none" }} />
                          </label>
                        )}
                      </Field>
                    </div>

                    {/* Optional */}
                    <div style={s.docGroup}>
                      <div style={s.docGroupTitle}>Additional Documents <span style={s.optionalTag}>(optional)</span></div>
                      <p style={s.docGroupNote}>Attach any supporting documents that strengthen your application.</p>

                      {OPTIONAL_DOCS.map(({ key, label }) => (
                        <Field key={key} label={label}>
                          {optionalFiles[key] ? (
                            <div style={s.fileAttached}>
                              <span style={s.fileAttachedName}>📄 {optionalFiles[key].name}</span>
                              <button style={s.removeFileBtn} onClick={() => removeOptionalFile(key)}>✕ Remove</button>
                            </div>
                          ) : (
                            <label style={s.fileLabel}>
                              <span>+ Attach {label}</span>
                              <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={setOptionalFile(key)} style={{ display: "none" }} />
                            </label>
                          )}
                        </Field>
                      ))}
                    </div>

                    {/* Declarations */}
                    <div style={s.declCard}>
                      <div style={s.declTitle}>Declarations</div>
                      <label style={s.checkRow}>
                        <input type="checkbox" checked={declarations.accurate} onChange={setDecl("accurate")} />
                        <span style={s.checkLabel}>All information I have provided is accurate and truthful.</span>
                      </label>
                      <label style={s.checkRow}>
                        <input type="checkbox" checked={declarations.rightToWork} onChange={setDecl("rightToWork")} />
                        <span style={s.checkLabel}>I have the legal right to work in South Africa.</span>
                      </label>
                      <label style={s.checkRow}>
                        <input type="checkbox" checked={declarations.consent} onChange={setDecl("consent")} />
                        <span style={s.checkLabel}>I consent to my information being shared with {job.employerName} for recruitment purposes.</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Step 2 — Review */}
                {step === 2 && (
                  <div style={s.form}>
                    <ReviewSection title="Personal Info">
                      <ReviewRow label="Name" value={`${form.firstName} ${form.lastName}`} />
                      <ReviewRow label="Email" value={form.email} />
                      <ReviewRow label="Phone" value={form.phone} />
                      <ReviewRow label="City" value={form.city} />
                      <ReviewRow label="Notice" value={form.notice} />
                      <ReviewRow label="Experience" value={form.experience} />
                      <ReviewRow label="Salary" value={form.salaryExpectation} />
                    </ReviewSection>

                    {form.coverNote && (
                      <ReviewSection title="Cover Note">
                        <p style={{ color: "#6b7fa3", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>{form.coverNote}</p>
                      </ReviewSection>
                    )}

                    <ReviewSection title="Documents">
                      <ReviewRow label="CV" value={cvFile?.name} />
                      <ReviewRow label="ID Document" value={idFile?.name} />
                      {Object.entries(optionalFiles).map(([key, file]) => {
                        const docLabel = OPTIONAL_DOCS.find(d => d.key === key)?.label || key;
                        return file ? <ReviewRow key={key} label={docLabel} value={file.name} /> : null;
                      })}
                    </ReviewSection>
                  </div>
                )}

                {/* Navigation */}
                <div style={s.navRow}>
                  {step > 0 && (
                    <button onClick={() => { setError(""); setStep(s => s - 1); }} style={s.btnBack2}>← Back</button>
                  )}
                  <div style={{ flex: 1 }} />
                  {step < 2 && (
                    <button onClick={handleNext} style={s.btnNext}>Next →</button>
                  )}
                  {step === 2 && (
                    <button onClick={handleSubmit} disabled={submitting} style={s.btnSubmit}>
                      {submitting ? "Uploading & Submitting…" : "Submit Application"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Job sidebar */}
            <div style={s.sideCol}>
              <div style={s.jobCard}>
                <div style={s.jobCardTitle}>Applying For</div>
                <div style={s.jobLogo}>
                  {job.logoUrl
                    ? <img src={job.logoUrl} alt={job.employerName} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    : <div style={{ ...s.jobLogoPlaceholder, background: job.brandColour || "#0099fa" }}>{job.employerName?.[0]}</div>
                  }
                </div>
                <div style={s.jobTitle}>{job.title}</div>
                <div style={s.jobCompany}>{job.employerName}</div>
                <div style={s.jobMeta}>
                  <span>📍 {job.city}, {job.province}</span>
                  <span>💼 {job.type}</span>
                  {job.salary && <span>💰 {job.salary}</span>}
                  <span>📅 Closes {job.closes}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────
function Navbar() {
  const navigate = useNavigate();
  return (
    <nav style={s.navbar}>
      <div style={s.navInner}>
        <div onClick={() => navigate("/")} style={s.navLogo}>
          <img src="/logo.png" alt="Cronos Jobs" style={s.navLogoImg} />
        </div>
        <div style={s.navLinks}>
          <Link to="/jobs" style={s.navLink}>Browse Jobs</Link>
          <Link to="/employer/login" style={s.navLinkBtn}>Employer Login</Link>
        </div>
      </div>
    </nav>
  );
}

// ── Footer ────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={s.footer}>
      <div style={s.footerInner}>
        <div style={s.footerBottom}>
          <span>© {new Date().getFullYear()} Cronos Jobs. All rights reserved.</span>
          <div style={{ display: "flex", gap: "24px" }}>
            <Link to="/terms" style={s.footerLink}>Terms</Link>
            <Link to="/privacy" style={s.footerLink}>Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────
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

function ReviewSection({ title, children }) {
  return (
    <div style={{ background: "#131b33", border: "1px solid #1e2d52", borderRadius: "10px", padding: "16px 20px", marginBottom: "12px" }}>
      <div style={{ color: "#0099fa", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>{title}</div>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "6px 0", borderBottom: "1px solid #1e2d52", fontSize: "13px" }}>
      <span style={{ color: "#6b7fa3" }}>{label}</span>
      <span style={{ color: "#e8edf8", textAlign: "right", maxWidth: "60%" }}>{value}</span>
    </div>
  );
}

const s = {
  page: { background: "#080d1b", minHeight: "100vh", fontFamily: "sans-serif", color: "#e8edf8", display: "flex", flexDirection: "column" },
  navbar: { background: "#0d1428", borderBottom: "1px solid #1e2d52", position: "sticky", top: 0, zIndex: 100 },
  navInner: { maxWidth: "1200px", margin: "0 auto", padding: "0 32px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  navLogo: { cursor: "pointer" },
  navLogoImg: { height: "32px", objectFit: "contain" },
  navLinks: { display: "flex", alignItems: "center", gap: "24px" },
  navLink: { color: "#6b7fa3", fontSize: "14px", textDecoration: "none" },
  navLinkBtn: { background: "rgba(0,153,250,0.12)", border: "1px solid rgba(0,153,250,0.25)", color: "#0099fa", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", textDecoration: "none" },
  body: { flex: 1, padding: "40px 32px" },
  inner: { maxWidth: "1100px", margin: "0 auto" },
  backBtn: { background: "none", border: "none", color: "#6b7fa3", fontSize: "14px", cursor: "pointer", padding: "0 0 24px", display: "block" },
  layout: { display: "grid", gridTemplateColumns: "1fr 300px", gap: "32px", alignItems: "start" },
  formCol: {},
  card: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "14px", padding: "32px" },
  stepper: { display: "flex", gap: "8px", marginBottom: "32px", flexWrap: "wrap" },
  stepItem: { display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "80px" },
  stepDot: { width: "28px", height: "28px", borderRadius: "50%", background: "#131b33", border: "1px solid #1e2d52", color: "#3d4f73", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: "600" },
  stepActive: { background: "#0099fa", border: "1px solid #0099fa", color: "#fff" },
  stepDone: { background: "rgba(0,229,160,0.12)", border: "1px solid rgba(0,229,160,0.3)", color: "#00e5a0" },
  stepLabel: { fontSize: "12px", color: "#3d4f73" },
  error: { background: "rgba(255,79,106,0.1)", border: "1px solid rgba(255,79,106,0.3)", color: "#ff4f6a", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", marginBottom: "20px" },
  form: { display: "flex", flexDirection: "column", gap: "16px", marginBottom: "28px" },
  input: { background: "#131b33", border: "1px solid #1e2d52", borderRadius: "8px", padding: "10px 13px", color: "#e8edf8", fontSize: "13px", outline: "none", width: "100%", fontFamily: "sans-serif" },
  uploadNote: { background: "#131b33", border: "1px solid #1e2d52", borderRadius: "8px", padding: "12px 16px", color: "#6b7fa3", fontSize: "13px" },
  docGroup: { background: "#131b33", border: "1px solid #1e2d52", borderRadius: "10px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "14px" },
  docGroupTitle: { color: "#e8edf8", fontSize: "13px", fontWeight: "600", marginBottom: "4px" },
  docGroupNote: { color: "#3d4f73", fontSize: "12px", margin: "0 0 4px", lineHeight: "1.5" },
  optionalTag: { color: "#3d4f73", fontWeight: "400", fontSize: "12px" },
  fileLabel: { display: "flex", alignItems: "center", gap: "8px", background: "#0d1428", border: "1px dashed #1e2d52", borderRadius: "8px", padding: "10px 14px", color: "#6b7fa3", fontSize: "13px", cursor: "pointer", transition: "border-color 0.15s" },
  fileAttached: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,229,160,0.06)", border: "1px solid rgba(0,229,160,0.2)", borderRadius: "8px", padding: "10px 14px" },
  fileAttachedName: { color: "#00e5a0", fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" },
  removeFileBtn: { background: "none", border: "none", color: "#ff4f6a", fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 },
  declCard: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "10px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" },
  declTitle: { color: "#e8edf8", fontSize: "14px", fontWeight: "600" },
  checkRow: { display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" },
  checkLabel: { color: "#6b7fa3", fontSize: "13px", lineHeight: "1.5" },
  navRow: { display: "flex", alignItems: "center", gap: "12px" },
  btnBack2: { background: "none", border: "1px solid #1e2d52", color: "#6b7fa3", borderRadius: "8px", padding: "11px 20px", fontSize: "14px", cursor: "pointer" },
  btnNext: { background: "#0099fa", color: "#fff", border: "none", borderRadius: "8px", padding: "11px 24px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  btnSubmit: { background: "#00e5a0", color: "#080d1b", border: "none", borderRadius: "8px", padding: "11px 24px", fontSize: "14px", fontWeight: "700", cursor: "pointer" },
  sideCol: { position: "sticky", top: "80px" },
  jobCard: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "14px", padding: "24px" },
  jobCardTitle: { color: "#0099fa", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "16px" },
  jobLogo: { width: "48px", height: "48px", borderRadius: "10px", overflow: "hidden", border: "1px solid #1e2d52", marginBottom: "12px" },
  jobLogoPlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "700", fontSize: "20px" },
  jobTitle: { color: "#e8edf8", fontSize: "16px", fontWeight: "700", marginBottom: "4px" },
  jobCompany: { color: "#6b7fa3", fontSize: "13px", marginBottom: "12px" },
  jobMeta: { display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "#3d4f73" },
  successCard: { maxWidth: "480px", margin: "80px auto", background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "16px", padding: "48px", textAlign: "center" },
  successIcon: { width: "64px", height: "64px", borderRadius: "50%", background: "rgba(0,229,160,0.12)", border: "1px solid rgba(0,229,160,0.3)", color: "#00e5a0", fontSize: "28px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" },
  successTitle: { color: "#e8edf8", fontSize: "26px", fontWeight: "700", margin: "0 0 12px" },
  successSub: { color: "#6b7fa3", fontSize: "15px", lineHeight: "1.6", margin: "0 0 32px" },
  successActions: { display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" },
  btnPrimary: { background: "#0099fa", color: "#fff", border: "none", borderRadius: "8px", padding: "12px 24px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  btnOutline: { background: "none", border: "1px solid #1e2d52", color: "#6b7fa3", borderRadius: "8px", padding: "12px 24px", fontSize: "14px", cursor: "pointer" },
  empty: { color: "#6b7fa3", textAlign: "center", padding: "80px", fontSize: "16px" },
  footer: { background: "#0d1428", borderTop: "1px solid #1e2d52", padding: "24px 32px" },
  footerInner: { maxWidth: "1200px", margin: "0 auto" },
  footerBottom: { display: "flex", justifyContent: "space-between", color: "#3d4f73", fontSize: "12px", flexWrap: "wrap", gap: "8px" },
  footerLink: { color: "#3d4f73", textDecoration: "none" },
};