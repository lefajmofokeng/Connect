import { useState, useEffect, useRef } from "react";
import {
  collection, query, where, getDocs,
  doc, setDoc, updateDoc, arrayUnion, serverTimestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signOut, updateProfile, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { db, storage, auth } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";

const PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal",
  "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"
];

const TABS = ["My Profile", "Saved Jobs", "Applications"];

export default function JobSeekerDashboard() {
  const { user, jobSeekerProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [savedJobs, setSavedJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "", city: "",
    province: "", address: "", qualification: "", employmentStatus: "",
    bio: "", skills: [],
  });

  // Load profile into form whenever profile changes
  useEffect(() => {
    if (jobSeekerProfile) {
      setForm({
        firstName:        jobSeekerProfile.firstName        || "",
        lastName:         jobSeekerProfile.lastName         || "",
        phone:            jobSeekerProfile.phone            || "",
        city:             jobSeekerProfile.city             || "",
        province:         jobSeekerProfile.province         || "",
        address:          jobSeekerProfile.address          || "",
        qualification:    jobSeekerProfile.qualification    || "",
        employmentStatus: jobSeekerProfile.employmentStatus || "",
        bio:              jobSeekerProfile.bio              || "",
        skills:           jobSeekerProfile.skills           || [],
      });
      if (jobSeekerProfile.photoUrl) setPhotoPreview(jobSeekerProfile.photoUrl);
    }
  }, [jobSeekerProfile]);

  useEffect(() => {
    if (activeTab === 1) fetchSavedJobs();
    if (activeTab === 2) fetchApplications();
  }, [activeTab]);

  const fetchSavedJobs = async () => {
    setLoadingJobs(true);
    try {
      const firestoreSaved = jobSeekerProfile?.savedJobs || [];
      const localSaved = JSON.parse(localStorage.getItem("savedJobs") || "[]");
      const allSaved = [...new Set([...firestoreSaved, ...localSaved])];
      if (allSaved.length === 0) { setSavedJobs([]); setLoadingJobs(false); return; }
      const snap = await getDocs(
        query(collection(db, "jobs"), where("__name__", "in", allSaved.slice(0, 10)))
      );
      setSavedJobs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      // Sync localStorage to Firestore
      if (localSaved.length > 0 && user) {
        await updateDoc(doc(db, "jobseekers", user.uid), {
          savedJobs: arrayUnion(...localSaved),
        });
      }
    } catch (err) { console.error(err); }
    setLoadingJobs(false);
  };

  const fetchApplications = async () => {
    if (!user) return;
    setLoadingApps(true);
    try {
      const snap = await getDocs(
        query(collection(db, "applications"), where("email", "==", user.email))
      );
      setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
    setLoadingApps(false);
  };

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const addSkill = () => {
    const val = skillInput.trim();
    if (!val || form.skills.includes(val)) return;
    setForm(prev => ({ ...prev, skills: [...prev.skills, val] }));
    setSkillInput("");
  };

  const removeSkill = (skill) => {
    setForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setSaving(true);

    try {
      let photoUrl = jobSeekerProfile?.photoUrl || "";
      let cvUrl = jobSeekerProfile?.cvUrl || "";
      let cvFilename = jobSeekerProfile?.cvFilename || "";

      if (photoFile) {
        const photoRef = ref(storage, `jobseekers/${user.uid}/photo/${photoFile.name}`);
        await uploadBytes(photoRef, photoFile);
        photoUrl = await getDownloadURL(photoRef);
        await updateProfile(auth.currentUser, { photoURL: photoUrl });
      }

      if (cvFile) {
        const cvRef = ref(storage, `jobseekers/${user.uid}/cv/${cvFile.name}`);
        await uploadBytes(cvRef, cvFile);
        cvUrl = await getDownloadURL(cvRef);
        cvFilename = cvFile.name;
      }

      // Use setDoc with merge:true so it works whether doc exists or not
      await setDoc(doc(db, "jobseekers", user.uid), {
        email:            user.email,
        firstName:        form.firstName,
        lastName:         form.lastName,
        phone:            form.phone,
        city:             form.city,
        province:         form.province,
        address:          form.address,
        qualification:    form.qualification,
        employmentStatus: form.employmentStatus,
        bio:              form.bio,
        skills:           form.skills,
        photoUrl,
        cvUrl,
        cvFilename,
        savedJobs: jobSeekerProfile?.savedJobs || [],
        updatedAt: serverTimestamp(),
      }, { merge: true });

      await refreshProfile();
      setSuccessMsg("Profile saved successfully.");
      setPhotoFile(null);
      setCvFile(null);
    } catch (err) {
      console.error(err);
      setError("Failed to save profile. Please try again.");
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") {
      setError("Please type DELETE to confirm.");
      return;
    }
    setDeleting(true);
    try {
      await updateDoc(doc(db, "jobseekers", user.uid), { deleted: true });
      await deleteUser(auth.currentUser);
      navigate("/");
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        setError("For security, please sign out and sign back in before deleting your account.");
      } else {
        setError("Failed to delete account. Please try again.");
      }
      setDeleting(false);
    }
  };

  const removeSavedJob = async (jobId) => {
    const updated = (jobSeekerProfile?.savedJobs || []).filter(id => id !== jobId);
    const local = JSON.parse(localStorage.getItem("savedJobs") || "[]").filter(id => id !== jobId);
    localStorage.setItem("savedJobs", JSON.stringify(local));
    await setDoc(doc(db, "jobseekers", user.uid), { savedJobs: updated }, { merge: true });
    await refreshProfile();
    setSavedJobs(prev => prev.filter(j => j.id !== jobId));
  };

  const displayName = `${form.firstName} ${form.lastName}`.trim() || user?.email || "Job Seeker";
  const initials = form.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "J";

  return (
    <div style={s.page}>
      {/* Navbar */}
      <nav style={s.navbar}>
        <div style={s.navInner}>
          <div style={s.navLogo} onClick={() => navigate("/")}>
            <img src="/logo.png" alt="Vetted" style={s.navLogoImg} />
          </div>
          <div style={s.navRight}>
            <Link to="/jobs" style={s.navLink}>Browse Jobs</Link>
            <ProfileDropdown
              displayName={displayName}
              photoPreview={photoPreview}
              initials={initials}
              onSignOut={handleSignOut}
              onSettings={() => { setShowSettings(true); setActiveTab(null); }}
              onProfile={() => setActiveTab(0)}
            />
          </div>
        </div>
      </nav>

      <div style={s.body}>
        <div style={s.inner}>

          {/* Profile Header Card */}
          <div style={s.profileHeader}>
            <div style={s.profileHeaderLeft}>
              <div style={s.headerAvatar}>
                {photoPreview
                  ? <img src={photoPreview} alt="" style={s.headerAvatarImg} />
                  : <div style={s.headerAvatarInitials}>{initials}</div>
                }
              </div>
              <div>
                <h1 style={s.profileName}>{displayName}</h1>
                <p style={s.profileEmail}>{user?.email}</p>
                <div style={s.profileMeta}>
                  {form.city && form.province && (
                    <span style={s.metaItem}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {form.city}, {form.province}
                    </span>
                  )}
                  {form.phone && (
                    <span style={s.metaItem}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.29 6.29l1.14-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      {form.phone}
                    </span>
                  )}
                </div>
                {/* Skills preview on header */}
                {form.skills.length > 0 && (
                  <div style={s.headerSkills}>
                    {form.skills.slice(0, 5).map(skill => (
                      <span key={skill} style={s.headerSkillTag}>{skill}</span>
                    ))}
                    {form.skills.length > 5 && (
                      <span style={s.headerSkillMore}>+{form.skills.length - 5} more</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            {form.bio && <p style={s.profileBio}>{form.bio}</p>}
          </div>

          {/* Tabs */}
          <div style={s.tabs}>
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(i); setShowSettings(false); }}
                style={{ ...s.tab, ...(activeTab === i && !showSettings ? s.tabActive : {}) }}
              >
                {tab}
              </button>
            ))}
            <button
              onClick={() => { setShowSettings(true); setActiveTab(null); }}
              style={{ ...s.tab, ...(showSettings ? s.tabActive : {}) }}
            >
              Settings
            </button>
          </div>

          {/* ── My Profile Tab ── */}
          {activeTab === 0 && !showSettings && (
            <form onSubmit={handleSave} style={s.profileForm}>
              {error && <div style={s.errorMsg}>{error}</div>}
              {successMsg && <div style={s.successMsgBox}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6 }}><polyline points="20 6 9 17 4 12"/></svg>
                {successMsg}
              </div>}

              <div style={s.formGrid}>
                {/* Left col */}
                <div style={s.formLeft}>
                  {/* Photo */}
                  <div style={s.card}>
                    <div style={s.cardTitle}>Profile Photo</div>
                    <div style={s.photoSection}>
                      <div style={s.photoPreview}>
                        {photoPreview
                          ? <img src={photoPreview} alt="" style={s.photoImg} />
                          : <div style={s.photoPlaceholder}>{initials}</div>
                        }
                      </div>
                      <div>
                        <label style={s.uploadBtn}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          Upload Photo
                          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} style={{ display: "none" }} />
                        </label>
                        <p style={s.uploadHint}>JPG, PNG or WebP · Max 2MB</p>
                        {photoFile && <p style={s.uploadFile}>✓ {photoFile.name}</p>}
                      </div>
                    </div>
                  </div>

                  {/* CV */}
                  <div style={s.card}>
                    <div style={s.cardTitle}>CV / Resume</div>
                    {jobSeekerProfile?.cvUrl && (
                      <a href={jobSeekerProfile.cvUrl} target="_blank" rel="noreferrer" style={s.cvLink}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        {jobSeekerProfile.cvFilename || "View Current CV"}
                      </a>
                    )}
                    <label style={s.uploadBtn}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      {jobSeekerProfile?.cvUrl ? "Replace CV" : "Upload CV"}
                      <input type="file" accept=".pdf,.doc,.docx" onChange={e => setCvFile(e.target.files[0] || null)} style={{ display: "none" }} />
                    </label>
                    {cvFile && <p style={s.uploadFile}>✓ {cvFile.name}</p>}
                    <p style={s.uploadHint}>PDF, DOC or DOCX · Max 5MB</p>
                  </div>
                </div>

                {/* Right col */}
                <div style={s.formRight}>
                  {/* Personal Info */}
                  <div style={s.card}>
                    <div style={s.cardTitle}>Personal Information</div>
                    <div style={s.fields}>
                      <div style={s.row}>
                        <Field label="First Name">
                          <input style={s.input} value={form.firstName} onChange={set("firstName")} placeholder="Jane" />
                        </Field>
                        <Field label="Last Name">
                          <input style={s.input} value={form.lastName} onChange={set("lastName")} placeholder="Smith" />
                        </Field>
                      </div>
                      <Field label="Phone Number">
                        <input style={s.input} type="tel" value={form.phone} onChange={set("phone")} placeholder="071 000 0000" />
                      </Field>
                      <Field label="Street Address">
                        <input style={s.input} value={form.address} onChange={set("address")} placeholder="e.g. 123 Riverside Drive, Witsieshoek 9870" />
                      </Field>
                      <div style={s.row}>
                        <Field label="City">
                          <input style={s.input} value={form.city} onChange={set("city")} placeholder="Cape Town" />
                        </Field>
                        <Field label="Province">
                          <select style={s.input} value={form.province} onChange={set("province")}>
                            <option value="">Select province</option>
                            {PROVINCES.map(p => <option key={p}>{p}</option>)}
                          </select>
                        </Field>
                      </div>
                      <div style={s.row}>
                        <Field label="Highest Qualification">
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
                        <Field label="Employment Status">
                          <select style={s.input} value={form.employmentStatus} onChange={set("employmentStatus")}>
                            <option value="">Select status</option>
                            <option value="Employed">Currently Employed</option>
                            <option value="Unemployed">Unemployed</option>
                            <option value="Student">Student</option>
                            <option value="Freelancing">Freelancing / Self-employed</option>
                          </select>
                        </Field>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div style={s.card}>
                    <div style={s.cardTitle}>About Me</div>
                    <textarea
                      style={{ ...s.input, minHeight: "100px", resize: "vertical" }}
                      value={form.bio}
                      onChange={set("bio")}
                      placeholder="A short summary about your experience and goals..."
                    />
                  </div>

                  {/* Skills */}
                  <div style={s.card}>
                    <div style={s.cardTitle}>Skills</div>
                    <div style={s.skillInputRow}>
                      <input
                        style={{ ...s.input, flex: 1 }}
                        value={skillInput}
                        onChange={e => setSkillInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                        placeholder="e.g. Microsoft Excel, Customer Service..."
                      />
                      <button type="button" onClick={addSkill} style={s.addSkillBtn}>Add</button>
                    </div>
                    {form.skills.length > 0 && (
                      <div style={s.skillTags}>
                        {form.skills.map(skill => (
                          <div key={skill} style={s.skillTag}>
                            {skill}
                            <button type="button" onClick={() => removeSkill(skill)} style={s.removeSkillBtn}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {form.skills.length === 0 && (
                      <p style={s.uploadHint}>Add skills to help employers find you</p>
                    )}
                  </div>
                </div>
              </div>

              <div style={s.saveRow}>
                <button type="submit" disabled={saving} style={s.saveBtn}>
                  {saving ? "Saving…" : "Save Profile"}
                </button>
              </div>
            </form>
          )}

          {/* ── Saved Jobs Tab ── */}
          {activeTab === 1 && !showSettings && (
            <div style={s.listSection}>
              {loadingJobs ? (
                <div style={s.empty}>Loading saved jobs...</div>
              ) : savedJobs.length === 0 ? (
                <div style={s.emptyState}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dadce0" strokeWidth="1.5" style={{ marginBottom: 12 }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <p style={s.emptyTitle}>No saved jobs yet</p>
                  <p style={s.emptySub}>Star jobs you're interested in to save them here</p>
                  <Link to="/jobs" style={s.emptyBtn}>Browse Jobs</Link>
                </div>
              ) : (
                <div style={s.jobList}>
                  {savedJobs.map(job => (
                    <div key={job.id} style={s.jobRow}>
                      <div style={s.jobLogo}>
                        {job.logoUrl
                          ? <img src={job.logoUrl} alt={job.employerName} style={s.jobLogoImg} />
                          : <div style={{ ...s.jobLogoPlaceholder, background: job.brandColour || "#1a73e8" }}>{job.employerName?.[0]}</div>
                        }
                      </div>
                      <div style={s.jobInfo}>
                        <div style={s.jobTitle}>{job.title}</div>
                        <div style={s.jobMeta}>{job.employerName} · {job.city}, {job.province} · {job.type}</div>
                      </div>
                      <div style={s.jobActions}>
                        <button onClick={() => navigate(`/jobs/${job.id}`)} style={s.viewBtn}>View</button>
                        <button onClick={() => navigate(`/apply/${job.id}`)} style={s.applyBtn}>Apply</button>
                        <button onClick={() => removeSavedJob(job.id)} style={s.removeBtn} title="Remove">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Applications Tab ── */}
          {activeTab === 2 && !showSettings && (
            <div style={s.listSection}>
              {loadingApps ? (
                <div style={s.empty}>Loading applications...</div>
              ) : applications.length === 0 ? (
                <div style={s.emptyState}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dadce0" strokeWidth="1.5" style={{ marginBottom: 12 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <p style={s.emptyTitle}>No applications yet</p>
                  <p style={s.emptySub}>Jobs you apply for will appear here</p>
                  <Link to="/jobs" style={s.emptyBtn}>Browse Jobs</Link>
                </div>
              ) : (
                <div style={s.jobList}>
                  {applications.map(app => (
                    <div key={app.id} style={s.jobRow}>
                      <div style={s.jobInfo}>
                        <div style={s.jobTitle}>{app.jobTitle}</div>
                        <div style={s.jobMeta}>{app.employerName} · Applied {app.createdAt?.toDate?.().toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" }) || "—"}</div>
                      </div>
                      <span style={{ ...s.statusPill, ...statusColor(app.status) }}>{app.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Settings Tab ── */}
          {showSettings && (
            <div style={s.settingsSection}>
              {error && <div style={s.errorMsg}>{error}</div>}

              <div style={s.card}>
                <div style={s.cardTitle}>Account Settings</div>
                <div style={s.settingRow}>
                  <div>
                    <div style={s.settingLabel}>Email Address</div>
                    <div style={s.settingValue}>{user?.email}</div>
                  </div>
                </div>
                <div style={s.settingRow}>
                  <div>
                    <div style={s.settingLabel}>Sign In Method</div>
                    <div style={s.settingValue}>{user?.providerData?.[0]?.providerId === "google.com" ? "Google Account" : "Email & Password"}</div>
                  </div>
                </div>
                <div style={s.settingRow}>
                  <div>
                    <div style={s.settingLabel}>Account Created</div>
                    <div style={s.settingValue}>{user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" }) : "—"}</div>
                  </div>
                </div>
              </div>

              <div style={s.card}>
                <div style={s.cardTitle}>Help Center</div>
                <div style={s.helpItems}>
                  {[
                    { q: "How do I apply for a job?", a: "Browse jobs, click on a listing, then click Apply Now. You can apply with or without an account." },
                    { q: "Will employers see my profile?", a: "No. Your profile is private. Employers only see the information you submit in your application." },
                    { q: "How do I withdraw an application?", a: "Contact the employer directly using their company contact details on the job listing." },
                    { q: "Is it free to use Cronos Jobs?", a: "Yes, applying for jobs on Vetted is completely free for job seekers." },
                    { q: "Why can't I see my application status?", a: "Application statuses are updated by employers. If your status hasn't changed, the employer hasn't reviewed it yet." },
                  ].map((item, i) => (
                    <div key={i} style={s.helpItem}>
                      <div style={s.helpQ}>{item.q}</div>
                      <div style={s.helpA}>{item.a}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger Zone */}
              <div style={{ ...s.card, border: "1px solid #fce8e6" }}>
                <div style={{ ...s.cardTitle, color: "#d93025" }}>Danger Zone</div>
                <p style={s.uploadHint}>Deleting your account is permanent and cannot be undone. All your saved jobs, applications history and profile data will be removed.</p>
                <div style={s.deleteRow}>
                  <input
                    style={{ ...s.input, maxWidth: "200px", borderColor: "#fce8e6" }}
                    value={deleteConfirm}
                    onChange={e => setDeleteConfirm(e.target.value)}
                    placeholder='Type "DELETE" to confirm'
                  />
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting || deleteConfirm !== "DELETE"}
                    style={s.deleteBtn}
                  >
                    {deleting ? "Deleting…" : "Delete Account"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Profile Dropdown ─────────────────────────────────────
function ProfileDropdown({ displayName, photoPreview, initials, onSignOut, onSettings, onProfile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <div style={s.avatarBtn} onClick={() => setOpen(o => !o)}>
        {photoPreview
          ? <img src={photoPreview} alt="" style={s.avatarImg} />
          : <div style={s.avatarInitials}>{initials}</div>
        }
      </div>
      {open && (
        <div style={s.dropdown}>
          <div style={s.dropdownHeader}>
            <div style={s.dropdownAvatar}>
              {photoPreview
                ? <img src={photoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                : <div style={s.dropdownAvatarInitials}>{initials}</div>
              }
            </div>
            <div style={s.dropdownName}>{displayName}</div>
          </div>
          <div style={s.dropdownDivider} />
          <button style={s.dropdownItem} onClick={() => { onProfile(); setOpen(false); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 10 }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            My Profile
          </button>
          <button style={s.dropdownItem} onClick={() => { onSettings(); setOpen(false); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 10 }}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Settings
          </button>
          <div style={s.dropdownDivider} />
          <button style={{ ...s.dropdownItem, color: "#d93025" }} onClick={() => { onSignOut(); setOpen(false); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 10 }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ color: "#5f6368", fontSize: "13px", fontWeight: "500" }}>{label}</label>
      {children}
    </div>
  );
}

function statusColor(status) {
  const map = {
    new:         { background: "#e3f2fd", color: "#1967d2" },
    reviewed:    { background: "#fef7e0", color: "#ea8600" },
    shortlisted: { background: "#e6f4ea", color: "#0d652d" },
    rejected:    { background: "#fce8e6", color: "#c5221f" },
    hired:       { background: "#e6f4ea", color: "#0d652d" },
  };
  return map[status] || { background: "#f1f3f4", color: "#5f6368" };
}

const s = {
  page: { background: "#f4f5f7", minHeight: "100vh", fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: "#202124" },

  // Navbar
  navbar: { background: "#202124", position: "sticky", top: 0, zIndex: 100 },
  navInner: { maxWidth: "1100px", margin: "0 auto", padding: "0 24px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  navLogo: { cursor: "pointer" },
  navLogoImg: { height: "28px", objectFit: "contain" },
  navRight: { display: "flex", alignItems: "center", gap: "16px" },
  navLink: { color: "rgba(255,255,255,0.75)", fontSize: "14px", textDecoration: "none", padding: "8px 12px", borderRadius: "6px" },

  // Avatar
  avatarBtn: { width: "36px", height: "36px", borderRadius: "50%", overflow: "hidden", cursor: "pointer", border: "2px solid rgba(255,255,255,0.25)", flexShrink: 0 },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  avatarInitials: { width: "100%", height: "100%", background: "#1a73e8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "700" },

  // Dropdown
  dropdown: { position: "absolute", right: 0, top: "calc(100% + 10px)", background: "#fff", border: "1px solid #e3e3e3", borderRadius: "8px", boxShadow: "0 4px 16px rgba(60,64,67,0.15)", minWidth: "220px", zIndex: 200, overflow: "hidden" },
  dropdownHeader: { padding: "16px", display: "flex", alignItems: "center", gap: "12px", background: "#f4f5f7" },
  dropdownAvatar: { width: "36px", height: "36px", borderRadius: "50%", overflow: "hidden", flexShrink: 0 },
  dropdownAvatarInitials: { width: "100%", height: "100%", background: "#1a73e8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "700", borderRadius: "50%" },
  dropdownName: { color: "#202124", fontSize: "13px", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  dropdownDivider: { height: "1px", background: "#e0e0e0" },
  dropdownItem: { display: "flex", alignItems: "center", width: "100%", padding: "12px 16px", background: "none", border: "none", color: "#202124", fontSize: "14px", cursor: "pointer", textAlign: "left", fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', transition: "background 0.15s" },

  // Body
  body: { padding: "28px 24px" },
  inner: { maxWidth: "1100px", margin: "0 auto" },

  // Profile Header
  profileHeader: { background: "#fff", border: "1px solid #e3e3e3", borderRadius: "8px 8px 0 0", padding: "24px 28px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(60,64,67,0.08)" },
  profileHeaderLeft: { display: "flex", alignItems: "flex-start", gap: "18px", marginBottom: "12px" },
  headerAvatar: { width: "72px", height: "72px", borderRadius: "50%", overflow: "hidden", border: "2px solid #e0e0e0", flexShrink: 0 },
  headerAvatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  headerAvatarInitials: { width: "100%", height: "100%", background: "#1a73e8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", fontWeight: "700" },
  profileName: { color: "#202124", fontSize: "20px", fontWeight: "700", margin: "0 0 2px" },
  profileEmail: { color: "#5f6368", fontSize: "13px", margin: "0 0 6px" },
  profileMeta: { display: "flex", gap: "16px", flexWrap: "wrap" },
  metaItem: { display: "flex", alignItems: "center", gap: "5px", color: "#5f6368", fontSize: "13px" },
  headerSkills: { display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" },
  headerSkillTag: { background: "#e3f2fd", color: "#1967d2", borderRadius: "4px", padding: "3px 8px", fontSize: "12px", fontWeight: "500" },
  headerSkillMore: { background: "#f1f3f4", color: "#5f6368", borderRadius: "4px", padding: "3px 8px", fontSize: "12px" },
  profileBio: { color: "#5f6368", fontSize: "14px", lineHeight: "1.6", margin: "0", borderTop: "1px solid #f1f3f4", paddingTop: "12px" },

  // Tabs
  tabs: { display: "flex", alignItems: "center", background: "#ffffff", border: "1px solid #e3e3e3", borderTop: "none", borderRadius: "0 0 8px 8px", padding: "0 8px", marginBottom: "20px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.06)" },
  tab: { flex: 1, padding: "9px 14px", borderRadius: "7px", background: "none", border: "none", color: "#5f6368", fontSize: "13px", fontWeight: "400", cursor: "pointer", fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', transition: "all 0.15s" },
  tabActive: { color: "#1967d2", borderBottom: "2px solid #1967d2", fontWeight: "600" },

  // Profile Form
  profileForm: {},
  formGrid: { display: "grid", gridTemplateColumns: "260px 1fr", gap: "18px", marginBottom: "18px" },
  formLeft: { display: "flex", flexDirection: "column", gap: "14px" },
  formRight: { display: "flex", flexDirection: "column", gap: "14px" },
  card: { background: "#fff", border: "1px solid #e3e3e3", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 3px rgba(60,64,67,0.06)" },
  cardTitle: { color: "#202124", fontSize: "14px", fontWeight: "600", marginBottom: "14px" },
  fields: { display: "flex", flexDirection: "column", gap: "12px" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  input: { background: "#fff", border: "1px solid #e3e3e3", borderRadius: "4px", padding: "9px 12px", color: "#202124", fontSize: "13px", outline: "none", width: "100%", fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  photoSection: { display: "flex", alignItems: "center", gap: "14px" },
  photoPreview: { width: "56px", height: "56px", borderRadius: "50%", overflow: "hidden", border: "1px solid #e3e3e3", flexShrink: 0 },
  photoImg: { width: "100%", height: "100%", objectFit: "cover" },
  photoPlaceholder: { width: "100%", height: "100%", background: "#1a73e8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "700" },
  uploadBtn: { display: "inline-flex", alignItems: "center", background: "#f4f5f7", border: "1px solid #e3e3e3", color: "#202124", borderRadius: "7px", padding: "7px 12px", fontSize: "13px", cursor: "pointer", marginBottom: "6px" },
  uploadHint: { color: "#80868b", fontSize: "11px", margin: "4px 0 0", lineHeight: "1.5" },
  uploadFile: { color: "#0d652d", fontSize: "12px", margin: "4px 0 0" },
  cvLink: { display: "inline-flex", alignItems: "center", color: "#1a73e8", fontSize: "13px", textDecoration: "none", marginBottom: "10px" },
  skillInputRow: { display: "flex", gap: "8px", marginBottom: "10px" },
  addSkillBtn: { background: "#1a73e8", color: "#fff", border: "none", borderRadius: "7px", padding: "10px 14px", fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap", fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  skillTags: { display: "flex", flexWrap: "wrap", gap: "8px" },
  skillTag: { display: "flex", alignItems: "center", gap: "6px", background: "#e8f0fe", color: "#1a73e8", borderRadius: "4px", padding: "4px 10px", fontSize: "13px", fontWeight: "500" },
  removeSkillBtn: { background: "none", border: "none", color: "#1a73e8", cursor: "pointer", fontSize: "16px", padding: 0, lineHeight: 1 },
  saveRow: { display: "flex", justifyContent: "flex-end" },
  saveBtn: { background: "#1a73e8", color: "#fff", border: "none", borderRadius: "8px", padding: "11px 28px", fontSize: "14px", fontWeight: "500", cursor: "pointer", fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  errorMsg: { background: "#fce8e6", border: "1px solid #f5c6c2", color: "#c5221f", borderRadius: "4px", padding: "12px 16px", fontSize: "13px", fontWeight: "500", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" },
  successMsgBox: { background: "#e6f4ea", border: "1px solid #ceead6", color: "#0d652d", borderRadius: "4px", padding: "12px 16px", fontSize: "13px", fontWeight: "500", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" },

  // Jobs / Apps list
  listSection: { background: "#fff", border: "1px solid #e3e3e3", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 3px rgba(60,64,67,0.06)" },
  jobList: { display: "flex", flexDirection: "column" },
  jobRow: { display: "flex", alignItems: "center", gap: "14px", padding: "14px 20px", borderBottom: "1px solid #f1f3f4" },
  jobLogo: { width: "40px", height: "40px", borderRadius: "8px", overflow: "hidden", border: "1px solid #e3e3e3", flexShrink: 0 },
  jobLogoImg: { width: "100%", height: "100%", objectFit: "contain" },
  jobLogoPlaceholder: { width: "40px", height: "40px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "700", fontSize: "16px" },
  jobInfo: { flex: 1 },
  jobTitle: { color: "#202124", fontSize: "14px", fontWeight: "600", marginBottom: "3px" },
  jobMeta: { color: "#5f6368", fontSize: "12px" },
  jobActions: { display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 },
  viewBtn: { background: "#f4f5f7", border: "1px solid #e3e3e3", color: "#202124", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: "pointer", fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  applyBtn: { background: "#1a73e8", color: "#fff", border: "none", borderRadius: "4px", padding: "6px 12px", fontSize: "12px", cursor: "pointer", fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  removeBtn: { background: "none", border: "1px solid #e3e3e3", color: "#5f6368", borderRadius: "6px", padding: "6px", cursor: "pointer", display: "flex", alignItems: "center" },
  statusPill: { padding: "3px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.4px", flexShrink: 0 },

  // Settings
  settingsSection: { display: "flex", flexDirection: "column", gap: "16px" },
  settingRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f1f3f4" },
  settingLabel: { color: "#5f6368", fontSize: "12px", marginBottom: "3px" },
  settingValue: { color: "#202124", fontSize: "14px", fontWeight: "500" },
  helpItems: { display: "flex", flexDirection: "column", gap: "14px" },
  helpItem: { paddingBottom: "14px", borderBottom: "1px solid #f1f3f4" },
  helpQ: { color: "#202124", fontSize: "14px", fontWeight: "600", marginBottom: "4px" },
  helpA: { color: "#5f6368", fontSize: "13px", lineHeight: "1.6" },
  deleteRow: { display: "flex", gap: "12px", alignItems: "center", marginTop: "14px", flexWrap: "wrap" },
  deleteBtn: { background: "#d93025", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "13px", fontWeight: "500", cursor: "pointer", fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },

  // Empty states
  empty: { color: "#5f6368", padding: "40px", textAlign: "center" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 24px", textAlign: "center" },
  emptyTitle: { color: "#202124", fontSize: "16px", fontWeight: "600", margin: "0 0 6px" },
  emptySub: { color: "#5f6368", fontSize: "14px", margin: "0 0 20px" },
  emptyBtn: { background: "#1a73e8", color: "#fff", borderRadius: "4px", padding: "9px 24px", fontSize: "13px", fontWeight: "600", textDecoration: "none" },
};