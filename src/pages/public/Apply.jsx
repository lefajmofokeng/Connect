import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db, storage } from "../../lib/firebase";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const STEPS = ["Personal Info", "Documents", "Review & Submit"];

const OPTIONAL_DOCS = [
  { key: "academic",  label: "Academic Certificates" },
  { key: "sars",      label: "SARS Letter / Tax Clearance" },
  { key: "residence", label: "Proof of Residence" },
  { key: "reference", label: "Reference Letter" },
  { key: "drivers",   label: "Driver's Licence" },
  { key: "other",     label: "Other Document" },
];

export default function Apply() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, jobSeekerProfile } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", city: "", province: "",
    experience: "", coverNote: "",
    dateOfBirth: "", gender: "",
    qualification: "", employmentStatus: "",
    hasSimilarExperience: "", similarExperienceYears: "", similarExperienceCompany: "",
    skills: [],
  });

  const [skillInput, setSkillInput] = useState("");

  const [cvFile, setCvFile] = useState(null);
  const [idFile, setIdFile] = useState(null);
  const [optionalFiles, setOptionalFiles] = useState({});
  const [declarations, setDeclarations] = useState({
    accurate: false, rightToWork: false, consent: false,
  });

  useEffect(() => { fetchJob(); }, [id]);

  useEffect(() => {
    if (jobSeekerProfile) {
      setForm(prev => ({
        ...prev,
        firstName: prev.firstName || jobSeekerProfile.firstName || "",
        lastName:  prev.lastName  || jobSeekerProfile.lastName  || "",
        email:     prev.email     || user?.email                 || "",
        phone:     prev.phone     || jobSeekerProfile.phone      || "",
        city:      prev.city      || jobSeekerProfile.city       || "",
        province:  prev.province  || jobSeekerProfile.province   || "",
        skills:    prev.skills?.length > 0 ? prev.skills : (jobSeekerProfile.skills || []),
      }));
    } else if (user?.email) {
      setForm(prev => ({ ...prev, email: prev.email || user.email }));
    }
  }, [jobSeekerProfile, user]);

  const fetchJob = async () => {
    try {
      const snap = await getDoc(doc(db, "jobs", id));
      if (snap.exists()) setJob({ id: snap.id, ...snap.data() });
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const toggleDecl = (field) => {
    setDeclarations(prev => ({ ...prev, [field]: !prev[field] }));
  };

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
      if (!form.firstName || !form.lastName || !form.email || !form.phone)
        return "Please fill in all required fields.";
      if (!form.address || !form.city || !form.province)
        return "Please enter your full address, city and province.";
      if (!form.dateOfBirth)
        return "Please enter your date of birth.";
      if (!form.gender)
        return "Please select your gender.";
      if (!form.qualification)
        return "Please select your highest qualification.";
      if (!form.employmentStatus)
        return "Please select your current employment status.";
      if (!form.hasSimilarExperience)
        return "Please indicate whether you have similar experience.";
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
      const [cvPath, idPath] = await Promise.all([
        uploadFile(cvFile, `${base}/cv_${cvFile.name}`),
        uploadFile(idFile, `${base}/id_${idFile.name}`),
      ]);
      const optionalPaths = {};
      await Promise.all(
        Object.entries(optionalFiles).map(async ([key, file]) => {
          if (file) {
            const url = await uploadFile(file, `${base}/${key}_${file.name}`);
            optionalPaths[key] = { url, filename: file.name };
          }
        })
      );
      // Compute age from date of birth
      let age = null;
      if (form.dateOfBirth) {
        const dob = new Date(form.dateOfBirth);
        const today = new Date();
        age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      }

      await addDoc(collection(db, "applications"), {
        jobId: id, jobTitle: job.title, jobDepartment: job.department || "",
        employerId: job.employerId, employerName: job.employerName,
        applyEmail: job.applyEmail || "",
        ...form, age,
        skills: form.skills || [],
        cvPath, cvMime: cvFile.type, cvFilename: cvFile.name,
        idPath, idFilename: idFile.name, optionalDocs: optionalPaths,
        jobSeekerId: user?.uid || null,
        status: "new", notes: "",
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError("Submission failed. Please check your files and try again.");
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="apply-page" style={s.page}><Navbar /><div style={s.empty}>Loading...</div></div>
  );

  if (!job) return (
    <div style={s.page}><Navbar /><div style={s.empty}>Job not found.</div></div>
  );

  // ── Success state ──
  if (submitted) return (
    <div style={s.page}>
      <Navbar />
      <div style={s.body}>
        <div className="apply-success-card" style={s.successCard}>
          <div style={s.successIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0d652d" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 style={s.successTitle}>Application Submitted!</h1>
          <p style={s.successSub}>
            Your application for <strong style={{ color: "#202124" }}>{job.title}</strong> at{" "}
            <strong style={{ color: "#202124" }}>{job.employerName}</strong> has been received. Good luck!
          </p>
          {user && jobSeekerProfile && (
            <p style={{ ...s.successSub, fontSize: "13px", marginBottom: "24px" }}>
              Track your application status in your{" "}
              <Link to="/jobseeker/dashboard" style={{ color: "#1a73e8", fontWeight: "600" }}>dashboard</Link>.
            </p>
          )}
          <div className="apply-success-actions" style={s.successActions}>
            <button onClick={() => navigate("/jobs")} style={s.btnPrimary}>Browse More Jobs</button>
            <button onClick={() => navigate("/")} style={s.btnOutline}>Back to Home</button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Main form ──
  return (
    <div style={s.page}>
      <Navbar />
      <div className="apply-body" style={s.body}>
        <div style={s.inner}>

          {/* Back */}
          <button className="apply-back-btn" onClick={() => navigate(`/jobs/${id}`)} style={s.backBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to Job
          </button>

          <div className="apply-layout" style={s.layout}>

            {/* ── Form column ── */}
            <div style={s.formCol}>
              <div className="apply-card" style={s.card}>

                {/* Horizontal stepper */}
                <div style={s.stepper}>
                  {STEPS.map((label, i) => {
                    const isDone   = i < step;
                    const isActive = i === step;
                    return (
                      <div key={label} style={s.stepItem}>
                        <div className="apply-step-label" style={{
                          ...s.stepDot,
                          ...(isActive ? s.stepDotActive : {}),
                          ...(isDone   ? s.stepDotDone   : {}),
                        }}>
                          {isDone
                            ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                            : i + 1
                          }
                        </div>
                        <span className="apply-step-label" style={{
                          ...s.stepLabel,
                          ...(isActive ? s.stepLabelActive : {}),
                          ...(isDone   ? s.stepLabelDone   : {}),
                        }}>
                          {label}
                        </span>
                        {i < STEPS.length - 1 && (
                          <div style={{ ...s.stepLine, ...(isDone ? s.stepLineDone : {}) }} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Error */}
                {error && (
                  <div style={s.alertError}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8, flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </div>
                )}

                {/* ── Step 0 — Personal Info ── */}
                {step === 0 && (
                  <div style={s.form}>
                    {jobSeekerProfile && (
                      <div style={s.prefillNote}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6, flexShrink: 0 }}>
                          <circle cx="12" cy="12" r="10"/><polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Some fields have been pre-filled from your profile. Review and update as needed.
                      </div>
                    )}

                    {/* Name */}
                    <div className="apply-row" style={s.row}>
                      <Field label="First Name *"><input style={s.input} value={form.firstName} onChange={set("firstName")} placeholder="Jane" /></Field>
                      <Field label="Last Name *"><input style={s.input} value={form.lastName} onChange={set("lastName")} placeholder="Smith" /></Field>
                    </div>

                    {/* Contact */}
                    <div className="apply-row" style={s.row}>
                      <Field label="Email Address *"><input style={s.input} type="email" value={form.email} onChange={set("email")} placeholder="jane@email.com" /></Field>
                      <Field label="Phone Number *"><input style={s.input} type="tel" value={form.phone} onChange={set("phone")} placeholder="071 000 0000" /></Field>
                    </div>

                    {/* DOB + Gender */}
                    <div className="apply-row" style={s.row}>
                      <Field label="Date of Birth *">
                        <input style={s.input} type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} max={new Date().toISOString().split("T")[0]} />
                      </Field>
                      <Field label="Gender *">
                        <select style={s.input} value={form.gender} onChange={set("gender")}>
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Non-binary">Non-binary</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </Field>
                    </div>

                    {/* Address */}
                    <Field label="Street Address *">
                      <input style={s.input} value={form.address} onChange={set("address")} placeholder="e.g. 123 Riverside Drive, Witsieshoek 9870" />
                    </Field>
                    <div className="apply-row" style={s.row}>
                      <Field label="City *">
                        <input style={s.input} value={form.city} onChange={set("city")} placeholder="e.g. Cape Town" />
                      </Field>
                      <Field label="Province *">
                        <select style={s.input} value={form.province} onChange={set("province")}>
                          <option value="">Select province</option>
                          {["Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo","Mpumalanga","Northern Cape","North West","Western Cape"].map(p => (
                            <option key={p}>{p}</option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    {/* Qualification + Employment status */}
                    <div className="apply-row" style={s.row}>
                      <Field label="Highest Qualification *">
                        <select style={s.input} value={form.qualification} onChange={set("qualification")}>
                          <option value="">Select qualification</option>
                          <option value="Below Matric">Below Matric</option>
                          <option value="Matric / Grade 12">Matric / Grade 12</option>
                          <option value="Certificate">Certificate</option>
                          <option value="Diploma">Diploma</option>
                          <option value="Bachelor's Degree">Bachelor's Degree</option>
                          <option value="Honours Degree">Honours Degree</option>
                          <option value="Master's Degree">Master's Degree</option>
                          <option value="Doctorate (PhD)">Doctorate (PhD)</option>
                        </select>
                      </Field>
                      <Field label="Employment Status *">
                        <select style={s.input} value={form.employmentStatus} onChange={set("employmentStatus")}>
                          <option value="">Select status</option>
                          <option value="Employed">Currently Employed</option>
                          <option value="Unemployed">Unemployed</option>
                          <option value="Student">Student</option>
                          <option value="Freelancing">Freelancing / Self-employed</option>
                        </select>
                      </Field>
                    </div>

                    {/* Similar experience section */}
                    <div style={s.expSection}>
                      <div style={s.expSectionTitle}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                          <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                        </svg>
                        Similar Experience
                      </div>
                      <Field label="Do you have similar experience for this position? *">
                        <div style={s.radioGroup}>
                          {["Yes", "No"].map(opt => (
                            <label key={opt} style={s.radioLabel}>
                              <div
                                style={{ ...s.radioBtn, ...(form.hasSimilarExperience === opt ? s.radioBtnActive : {}) }}
                                onClick={() => setForm(prev => ({
                                  ...prev,
                                  hasSimilarExperience: opt,
                                  similarExperienceYears: opt === "No" ? "" : prev.similarExperienceYears,
                                  similarExperienceCompany: opt === "No" ? "" : prev.similarExperienceCompany,
                                }))}
                              >
                                {form.hasSimilarExperience === opt && <div style={s.radioDot} />}
                              </div>
                              <span style={s.radioText}>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </Field>
                      {form.hasSimilarExperience === "Yes" && (
                        <div className="apply-row" style={s.row}>
                          <Field label="Years of Similar Experience">
                            <input style={s.input} value={form.similarExperienceYears} onChange={set("similarExperienceYears")} placeholder="e.g. 3 years" />
                          </Field>
                          <Field label="Company Where Gained">
                            <input style={s.input} value={form.similarExperienceCompany} onChange={set("similarExperienceCompany")} placeholder="e.g. Acme Corp" />
                          </Field>
                        </div>
                      )}
                    </div>

                    {/* Skills — interactive, works with and without account */}
                    <div style={s.skillsSection}>
                      <div style={s.skillsSectionHeader}>
                        <div style={s.skillsSectionTitle}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                          </svg>
                          Skills
                        </div>
                        <span style={s.skillsVisibleBadge}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          Visible to employer
                        </span>
                      </div>
                      <p style={s.skillsSectionHint}>
                        {jobSeekerProfile
                          ? "Your profile skills have been pre-filled. Add or remove as needed — the employer will see these."
                          : "Add your relevant skills below. The employer will see these alongside your application."
                        }
                      </p>
                      {/* Skill input */}
                      <div style={s.skillInputRow}>
                        <input
                          style={{ ...s.input, flex: 1 }}
                          value={skillInput}
                          onChange={e => setSkillInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const val = skillInput.trim();
                              if (val && !form.skills.includes(val)) {
                                setForm(prev => ({ ...prev, skills: [...prev.skills, val] }));
                                setSkillInput("");
                              }
                            }
                          }}
                          placeholder="e.g. Microsoft Excel, Customer Service..."
                        />
                        <button
                          type="button"
                          style={s.skillAddBtn}
                          onClick={() => {
                            const val = skillInput.trim();
                            if (val && !form.skills.includes(val)) {
                              setForm(prev => ({ ...prev, skills: [...prev.skills, val] }));
                              setSkillInput("");
                            }
                          }}
                        >
                          + Add
                        </button>
                      </div>
                      {/* Skill tags */}
                      {form.skills.length > 0 ? (
                        <div style={s.skillTags}>
                          {form.skills.map(skill => (
                            <div key={skill} style={s.skillTag}>
                              {skill}
                              <button
                                type="button"
                                style={s.skillRemoveBtn}
                                onClick={() => setForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={s.skillsEmpty}>No skills added yet. Type a skill above and press Enter or + Add.</p>
                      )}
                    </div>

                    {/* Cover Note */}
                    <Field label="Cover Note">
                      <textarea
                        style={{ ...s.input, minHeight: "120px", resize: "vertical", lineHeight: "1.6" }}
                        value={form.coverNote}
                        onChange={set("coverNote")}
                        placeholder="Briefly introduce yourself and why you're a great fit..."
                      />
                    </Field>
                  </div>
                )}

                {/* ── Step 1 — Documents ── */}
                {step === 1 && (
                  <div style={s.form}>
                    <div style={s.infoNote}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6, flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      Accepted: PDF, DOC, DOCX, JPG, PNG · Max 5MB per file
                    </div>

                    {/* Required documents */}
                    <div style={s.docGroup}>
                      <div style={s.docGroupTitle}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6, flexShrink: 0 }}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                        </svg>
                        Required Documents
                      </div>

                      <Field label="CV / Resume *">
                        {cvFile ? (
                          <div style={s.fileAttached}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0d652d" strokeWidth="2" style={{ marginRight: 6, flexShrink: 0 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            <span style={s.fileAttachedName}>{cvFile.name}</span>
                            <button style={s.removeFileBtn} onClick={() => setCvFile(null)}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              Remove
                            </button>
                          </div>
                        ) : (
                          <label style={s.fileLabel}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            Attach CV / Resume
                            <input type="file" accept=".pdf,.doc,.docx" onChange={e => setCvFile(e.target.files[0] || null)} style={{ display: "none" }} />
                          </label>
                        )}
                      </Field>

                      <Field label="ID Document *">
                        {idFile ? (
                          <div style={s.fileAttached}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0d652d" strokeWidth="2" style={{ marginRight: 6, flexShrink: 0 }}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                            <span style={s.fileAttachedName}>{idFile.name}</span>
                            <button style={s.removeFileBtn} onClick={() => setIdFile(null)}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              Remove
                            </button>
                          </div>
                        ) : (
                          <label style={s.fileLabel}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            Attach ID Document
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setIdFile(e.target.files[0] || null)} style={{ display: "none" }} />
                          </label>
                        )}
                      </Field>
                    </div>

                    {/* Optional documents */}
                    <div style={s.docGroup}>
                      <div style={s.docGroupTitle}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6, flexShrink: 0 }}>
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
                        </svg>
                        Additional Documents
                        <span style={s.optionalBadge}>Optional</span>
                      </div>
                      <p style={s.docGroupNote}>Supporting documents that strengthen your application.</p>

                      {OPTIONAL_DOCS.map(({ key, label }) => (
                        <Field key={key} label={label}>
                          {optionalFiles[key] ? (
                            <div style={s.fileAttached}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0d652d" strokeWidth="2" style={{ marginRight: 6, flexShrink: 0 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                              <span style={s.fileAttachedName}>{optionalFiles[key].name}</span>
                              <button style={s.removeFileBtn} onClick={() => removeOptionalFile(key)}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                Remove
                              </button>
                            </div>
                          ) : (
                            <label style={s.fileLabel}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                              Attach {label}
                              <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={setOptionalFile(key)} style={{ display: "none" }} />
                            </label>
                          )}
                        </Field>
                      ))}
                    </div>

                    {/* Declarations */}
                    <div style={s.declCard}>
                      <div style={s.declTitle}>Declarations</div>
                      <p style={s.declNote}>Please read and confirm each declaration before proceeding.</p>
                      {[
                        { key: "accurate",     text: "All information I have provided is accurate and truthful." },
                        { key: "rightToWork",  text: "I have the legal right to work in South Africa." },
                        { key: "consent",      text: `I consent to my information being shared with ${job.employerName} for recruitment purposes.` },
                      ].map(({ key, text }) => (
                        <div
                          key={key}
                          style={{ ...s.checkRow, ...(declarations[key] ? s.checkRowChecked : {}) }}
                          onClick={() => toggleDecl(key)}
                        >
                          <div style={{ ...s.checkbox, ...(declarations[key] ? s.checkboxChecked : {}) }}>
                            {declarations[key] && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                            )}
                          </div>
                          <span style={s.checkLabel}>{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Step 2 — Review ── */}
                {step === 2 && (
                  <div style={s.form}>
                    <ReviewSection title="Personal Information">
                      <ReviewRow label="Name"                value={`${form.firstName} ${form.lastName}`} />
                      <ReviewRow label="Email"               value={form.email} />
                      <ReviewRow label="Phone"               value={form.phone} />
                      <ReviewRow label="Date of Birth"       value={form.dateOfBirth} />
                      <ReviewRow label="Gender"              value={form.gender} />
                      <ReviewRow label="Street Address"      value={form.address} />
                      <ReviewRow label="City"                value={form.city} />
                      <ReviewRow label="Province"            value={form.province} />
                      <ReviewRow label="Qualification"       value={form.qualification} />
                      <ReviewRow label="Employment Status"   value={form.employmentStatus} />
                    </ReviewSection>

                    <ReviewSection title="Experience">
                      <ReviewRow label="Similar Experience"         value={form.hasSimilarExperience} />
                      {form.hasSimilarExperience === "Yes" && <>
                        <ReviewRow label="Years of Similar Exp."   value={form.similarExperienceYears} />
                        <ReviewRow label="Company"                  value={form.similarExperienceCompany} />
                      </>}
                      {form.skills?.length > 0 && (
                        <div style={{ padding: "6px 0", borderBottom: "1px solid #f8f9fa" }}>
                          <div style={{ color: "#5f6368", fontSize: "13px", marginBottom: "6px" }}>Skills</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                            {form.skills.map(skill => (
                              <span key={skill} style={{ background: "#e3f2fd", border: "1px solid #bdd7f5", color: "#1967d2", borderRadius: "4px", padding: "2px 8px", fontSize: "12px", fontWeight: "500" }}>
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </ReviewSection>

                    {form.coverNote && (
                      <ReviewSection title="Cover Note">
                        <p style={{ color: "#5f6368", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>{form.coverNote}</p>
                      </ReviewSection>
                    )}

                    <ReviewSection title="Documents">
                      <ReviewRow label="CV / Resume"  value={cvFile?.name} />
                      <ReviewRow label="ID Document"  value={idFile?.name} />
                      {Object.entries(optionalFiles).map(([key, file]) => {
                        const docLabel = OPTIONAL_DOCS.find(d => d.key === key)?.label || key;
                        return file ? <ReviewRow key={key} label={docLabel} value={file.name} /> : null;
                      })}
                    </ReviewSection>

                    <div style={s.reviewNote}>
                      By submitting this application you confirm all declarations made in the previous step.
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="apply-nav-row" style={s.navRow}>
                  {step > 0 && (
                    <button onClick={() => { setError(""); setStep(s => s - 1); }} style={s.btnBack2}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                        <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                      </svg>
                      Back
                    </button>
                  )}
                  <div style={{ flex: 1 }} />
                  {step < 2 && (
                    <button onClick={handleNext} style={s.btnNext}>
                      Continue
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 6 }}>
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </button>
                  )}
                  {step === 2 && (
                    <button onClick={handleSubmit} disabled={submitting} style={s.btnSubmit}>
                      {submitting ? "Uploading & Submitting…" : (
                        <>
                          Submit Application
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 8 }}>
                            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                          </svg>
                        </>
                      )}
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* ── Job sidebar ── */}
            <div className="apply-side-col" style={s.sideCol}>
              <div style={s.jobCard}>
                <div style={s.jobCardLabel}>Applying For</div>
                <div style={s.jobLogoWrap}>
                  {job.logoUrl
                    ? <img src={job.logoUrl} alt={job.employerName} style={s.jobLogoImg} />
                    : <div style={{ ...s.jobLogoPlaceholder, background: job.brandColour || "#1a73e8" }}>{job.employerName?.[0]}</div>
                  }
                </div>
                <div style={s.jobTitle}>{job.title}</div>
                <div style={s.jobCompany}>{job.employerName}</div>
                <div style={s.jobMeta}>
                  <div style={s.jobMetaItem}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {job.city}, {job.province}
                  </div>
                  <div style={s.jobMetaItem}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                    {job.type}
                  </div>
                  {job.salary && (
                    <div style={{ ...s.jobMetaItem, color: "#0d652d" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      {job.salary}
                    </div>
                  )}
                  <div style={s.jobMetaItem}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Closes {job.closes}
                  </div>
                </div>
              </div>

              {!user && (
                <div style={s.signInPrompt}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1967d2" strokeWidth="2" style={{ marginBottom: 8 }}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <p style={s.signInPromptText}>
                    <Link to="/jobseeker/login" style={{ color: "#1a73e8", fontWeight: "600" }}>Sign in</Link> to track your applications and pre-fill your details.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
      <Footer />

      <style>{`
        .apply-page * { font-family: ${FONT} !important; }
        .apply-input:focus { border-color: #1a73e8 !important; outline: none; }
        .apply-file-label:hover { border-color: #1a73e8 !important; }

        /* Hide nav links on mobile */
        @media (max-width: 768px) {
          .apply-nav-links { display: none !important; }
          .apply-layout { grid-template-columns: 1fr !important; }
          .apply-side-col { position: static !important; }
          .apply-row { grid-template-columns: 1fr !important; }
          .apply-card { padding: 20px !important; }
          .apply-body { padding: 80px 16px 40px !important; }
          .apply-step-label { display: none !important; }
          .apply-back-btn { padding: 0 0 16px !important; }
          .apply-success-card { padding: 32px 20px !important; margin: 0 !important; }
          .apply-success-actions { flex-direction: column !important; }
          .apply-success-actions button { width: 100% !important; }
          .apply-nav-row button { flex: 1; justify-content: center; }
        }

        @media (max-width: 480px) {
          .apply-skill-input-row { flex-direction: column !important; }
          .apply-skill-add-btn { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={s.fieldLabel}>{label}</label>
      {children}
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
  if (!value) return null;
  return (
    <div style={s.reviewRow}>
      <span style={s.reviewLabel}>{label}</span>
      <span style={s.reviewValue}>{value}</span>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const FONT = '"Circular Std", "Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const s = {
  page: {
    background: "#f4f5f7",
    minHeight: "100vh",
    fontFamily: FONT,
    color: "#202124",
    display: "flex",
    flexDirection: "column",
  },

  // ── Body ──
  body: { flex: 1, padding: "92px 24px 48px" },
  inner: { maxWidth: "1060px", margin: "0 auto" },
  backBtn: { display: "inline-flex", alignItems: "center", background: "none", border: "none", color: "#5f6368", fontSize: "13px", fontWeight: "500", cursor: "pointer", padding: "0 0 20px", fontFamily: FONT },

  // ── Layout ──
  layout: { display: "grid", gridTemplateColumns: "1fr 300px", gap: "24px", alignItems: "start" },
  formCol: {},
  sideCol: { position: "sticky", top: "80px", display: "flex", flexDirection: "column", gap: "12px" },

  // ── Main card ──
  card: { background: "#ffffff", border: "1px solid #dadce0", borderRadius: "8px", padding: "28px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.08)" },

  // ── Horizontal stepper ──
  stepper: { display: "flex", alignItems: "center", marginBottom: "28px" },
  stepItem: { display: "flex", alignItems: "center", flex: 1 },
  stepDot: { width: "28px", height: "28px", borderRadius: "50%", background: "#f1f3f4", border: "2px solid #e3e3e3", color: "#9aa0a6", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s", fontFamily: FONT },
  stepDotActive: { background: "#1a73e8", border: "2px solid #1a73e8", color: "#ffffff" },
  stepDotDone:   { background: "#e6f4ea", border: "2px solid #34a853", color: "#0d652d" },
  stepLabel: { fontSize: "12px", color: "#9aa0a6", marginLeft: "8px", whiteSpace: "nowrap", fontWeight: "500", fontFamily: FONT },
  stepLabelActive: { color: "#202124", fontWeight: "600" },
  stepLabelDone:   { color: "#0d652d" },
  stepLine: { flex: 1, height: "2px", background: "#e3e3e3", margin: "0 8px", borderRadius: "1px" },
  stepLineDone: { background: "#34a853" },

  // ── Alerts / notes ──
  alertError: { display: "flex", alignItems: "flex-start", background: "#fce8e6", border: "1px solid #f5c6c2", color: "#c5221f", borderRadius: "4px", padding: "12px 14px", fontSize: "13px", fontWeight: "500", marginBottom: "20px", gap: "8px", fontFamily: FONT },
  prefillNote: { display: "flex", alignItems: "center", gap: "6px", background: "#e3f2fd", border: "1px solid #bdd7f5", color: "#1967d2", borderRadius: "4px", padding: "10px 14px", fontSize: "13px", fontFamily: FONT },
  infoNote: { display: "flex", alignItems: "center", gap: "6px", background: "#f8f9fa", border: "1px solid #e3e3e3", borderRadius: "4px", padding: "10px 14px", color: "#5f6368", fontSize: "13px", fontFamily: FONT },

  // ── Form ──
  form: { display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" },
  fieldLabel: { color: "#5f6368", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.4px", fontFamily: FONT },
  input: { background: "#ffffff", border: "1px solid #dadce0", borderRadius: "4px", padding: "10px 12px", color: "#202124", fontSize: "14px", outline: "none", width: "100%", fontFamily: FONT, boxSizing: "border-box", transition: "border-color 0.15s" },

  // ── Document groups ──
  docGroup: { background: "#f8f9fa", border: "1px solid #dadce0", borderRadius: "8px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px" },
  docGroupTitle: { color: "#202124", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", marginBottom: "2px", fontFamily: FONT },
  docGroupNote: { color: "#9aa0a6", fontSize: "12px", margin: 0, lineHeight: "1.5", fontFamily: FONT },
  optionalBadge: { background: "#e3e3e3", color: "#5f6368", borderRadius: "4px", padding: "2px 7px", fontSize: "11px", fontWeight: "500", marginLeft: "8px", fontFamily: FONT },
  fileLabel: { display: "flex", alignItems: "center", background: "#ffffff", border: "1px dashed #dadce0", borderRadius: "4px", padding: "11px 14px", color: "#5f6368", fontSize: "13px", cursor: "pointer", transition: "border-color 0.15s", fontFamily: FONT },
  fileAttached: { display: "flex", alignItems: "center", background: "#e6f4ea", border: "1px solid #ceead6", borderRadius: "4px", padding: "10px 14px", gap: "8px" },
  fileAttachedName: { color: "#0d652d", fontSize: "13px", fontWeight: "500", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: FONT },
  removeFileBtn: { display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", color: "#c5221f", fontSize: "12px", fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, fontFamily: FONT },

  // ── Declarations ──
  declCard: { background: "#ffffff", border: "1px solid #dadce0", borderRadius: "8px", padding: "18px", display: "flex", flexDirection: "column", gap: 0 },
  declTitle: { color: "#202124", fontSize: "13px", fontWeight: "600", marginBottom: "6px", fontFamily: FONT },
  declNote: { color: "#5f6368", fontSize: "12px", marginBottom: "14px", lineHeight: "1.5", fontFamily: FONT },
  checkRow: { display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer", padding: "10px 12px", borderRadius: "6px", margin: "0 -12px", transition: "background 0.15s" },
  checkRowChecked: { background: "#e8f0fe" },
  checkbox: { width: "17px", height: "17px", borderRadius: "3px", border: "2px solid #dadce0", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px", transition: "all 0.15s" },
  checkboxChecked: { background: "#1a73e8", border: "2px solid #1a73e8" },
  checkLabel: { color: "#202124", fontSize: "13px", lineHeight: "1.5", userSelect: "none", fontFamily: FONT },

  // ── Navigation buttons ──
  navRow: { display: "flex", alignItems: "center", gap: "12px", paddingTop: "4px" },
  btnBack2: { display: "inline-flex", alignItems: "center", gap: "6px", background: "#ffffff", border: "1px solid #dadce0", color: "#5f6368", borderRadius: "4px", padding: "9px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: FONT },
  btnNext: { display: "inline-flex", alignItems: "center", gap: "6px", background: "#1a73e8", color: "#ffffff", border: "none", borderRadius: "24px", padding: "9px 22px", fontSize: "13px", fontWeight: "500", cursor: "pointer", fontFamily: FONT },
  btnSubmit: { display: "inline-flex", alignItems: "center", gap: "8px", background: "#1a73e8", color: "#ffffff", border: "none", borderRadius: "24px", padding: "10px 24px", fontSize: "13px", fontWeight: "500", cursor: "pointer", fontFamily: FONT },

  // ── Review sections ──
  reviewSection: { background: "#ffffff", border: "1px solid #dadce0", borderRadius: "8px", padding: "16px 20px", marginBottom: "12px" },
  reviewSectionTitle: { color: "#5f6368", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px", fontFamily: FONT },
  reviewRow: { display: "flex", justifyContent: "space-between", gap: "12px", padding: "7px 0", borderBottom: "1px solid #f1f3f4", fontSize: "13px" },
  reviewLabel: { color: "#5f6368", fontFamily: FONT },
  reviewValue: { color: "#202124", textAlign: "right", maxWidth: "60%", wordBreak: "break-word", fontWeight: "500", fontFamily: FONT },
  reviewNote: { background: "#fff8e1", border: "1px solid #ffe082", borderRadius: "4px", padding: "12px 14px", color: "#f57f17", fontSize: "12px", lineHeight: "1.6", fontFamily: FONT },

  // ── Similar experience section ──
  expSection: { background: "#f8f9fa", border: "1px solid #dadce0", borderRadius: "8px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "14px" },
  expSectionTitle: { display: "flex", alignItems: "center", gap: "8px", color: "#202124", fontSize: "13px", fontWeight: "600", fontFamily: FONT },

  // ── Radio buttons ──
  radioGroup: { display: "flex", gap: "16px", alignItems: "center", paddingTop: "4px" },
  radioLabel: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" },
  radioBtn: { width: "18px", height: "18px", borderRadius: "50%", border: "2px solid #dadce0", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "border-color 0.15s", cursor: "pointer" },
  radioBtnActive: { borderColor: "#1a73e8" },
  radioDot: { width: "8px", height: "8px", borderRadius: "50%", background: "#1a73e8" },
  radioText: { color: "#202124", fontSize: "13px", fontWeight: "500", userSelect: "none", fontFamily: FONT },

  // ── Skills section ──
  skillsSection: { background: "#f8f9fa", border: "1px solid #dadce0", borderRadius: "8px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px" },
  skillsSectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  skillsSectionTitle: { display: "flex", alignItems: "center", gap: "8px", color: "#202124", fontSize: "13px", fontWeight: "600", fontFamily: FONT },
  skillsVisibleBadge: { display: "inline-flex", alignItems: "center", gap: "5px", background: "#e8f0fe", border: "1px solid #d2e3fc", color: "#1967d2", borderRadius: "16px", padding: "3px 10px", fontSize: "11px", fontWeight: "500", fontFamily: FONT },
  skillsSectionHint: { color: "#5f6368", fontSize: "12px", lineHeight: "1.5", margin: 0, fontFamily: FONT },
  skillInputRow: { display: "flex", gap: "8px" },
  skillAddBtn: { background: "#ffffff", border: "1px solid #dadce0", color: "#1a73e8", borderRadius: "20px", padding: "9px 16px", fontSize: "13px", fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap", fontFamily: FONT },
  skillTags: { display: "flex", flexWrap: "wrap", gap: "6px" },
  skillTag: { display: "inline-flex", alignItems: "center", gap: "6px", background: "#e8f0fe", border: "none", color: "#1967d2", borderRadius: "16px", padding: "4px 12px", fontSize: "13px", fontWeight: "400", fontFamily: FONT },
  skillRemoveBtn: { background: "none", border: "none", color: "#5f6368", cursor: "pointer", fontSize: "16px", padding: "0", lineHeight: 1, fontFamily: FONT },
  skillsEmpty: { color: "#9aa0a6", fontSize: "12px", margin: 0, fontFamily: FONT },

  // ── Job sidebar card ──
  jobCard: { background: "#ffffff", border: "1px solid #dadce0", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.08)" },
  jobCardLabel: { color: "#9aa0a6", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "14px", fontFamily: FONT },
  jobLogoWrap: { width: "44px", height: "44px", borderRadius: "4px", overflow: "hidden", border: "1px solid #dadce0", marginBottom: "12px" },
  jobLogoImg: { width: "100%", height: "100%", objectFit: "contain" },
  jobLogoPlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "700", fontSize: "18px", fontFamily: FONT },
  jobTitle: { color: "#202124", fontSize: "15px", fontWeight: "500", marginBottom: "2px", fontFamily: FONT },
  jobCompany: { color: "#1a73e8", fontSize: "13px", marginBottom: "14px", fontFamily: FONT },
  jobMeta: { display: "flex", flexDirection: "column", gap: "8px" },
  jobMetaItem: { display: "flex", alignItems: "center", gap: "7px", color: "#5f6368", fontSize: "12px", fontFamily: FONT },

  // ── Sign-in prompt ──
  signInPrompt: { background: "#e8f0fe", border: "1px solid #d2e3fc", borderRadius: "8px", padding: "16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" },
  signInPromptText: { color: "#5f6368", fontSize: "13px", lineHeight: "1.5", margin: 0, fontFamily: FONT },

  // ── Success ──
  successCard: { maxWidth: "500px", margin: "0 auto", background: "#ffffff", border: "1px solid #dadce0", borderRadius: "8px", padding: "48px 40px", textAlign: "center", boxShadow: "0 1px 3px rgba(60,64,67,0.1)" },
  successIcon: { width: "56px", height: "56px", borderRadius: "50%", background: "#e6f4ea", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" },
  successTitle: { color: "#202124", fontSize: "22px", fontWeight: "400", margin: "0 0 12px", fontFamily: FONT },
  successSub: { color: "#5f6368", fontSize: "14px", lineHeight: "1.7", margin: "0 0 20px", fontFamily: FONT },
  successActions: { display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" },
  btnPrimary: { background: "#1a73e8", color: "#ffffff", border: "none", borderRadius: "24px", padding: "10px 24px", fontSize: "14px", fontWeight: "500", cursor: "pointer", fontFamily: FONT },
  btnOutline: { background: "#ffffff", border: "1px solid #dadce0", color: "#3c4043", borderRadius: "24px", padding: "10px 24px", fontSize: "14px", fontWeight: "400", cursor: "pointer", fontFamily: FONT },

  empty: { color: "#5f6368", textAlign: "center", padding: "80px", fontSize: "14px", fontFamily: FONT },

};