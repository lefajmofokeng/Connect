import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { toggleSavedJob, getLocalSavedJobs } from "../../lib/savedJobs";

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, jobSeekerProfile } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState(getLocalSavedJobs);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { fetchJob(); }, [id]);

  const fetchJob = async () => {
    try {
      const snap = await getDoc(doc(db, "jobs", id));
      if (snap.exists()) setJob({ id: snap.id, ...snap.data() });
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleToggleSave = async () => {
    await toggleSavedJob(id, user);
    setSavedJobs(getLocalSavedJobs());
  };

  const isSaved = savedJobs.includes(id);
  const isJobSeeker = user && jobSeekerProfile;
  const jsPhoto = jobSeekerProfile?.photoUrl || null;
  const jsInitials = jobSeekerProfile?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || null;

  if (loading) return (
    <div style={s.page}>
      <Navbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} navigate={navigate} isJobSeeker={isJobSeeker} jsPhoto={jsPhoto} jsInitials={jsInitials} />
      <div style={s.loadingWrap}>
        <div style={s.skeleton} />
        <div style={{ ...s.skeleton, height: 200 }} />
        <div style={{ ...s.skeleton, height: 160 }} />
      </div>
    </div>
  );

  if (!job) return (
    <div style={s.page}>
      <Navbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} navigate={navigate} isJobSeeker={isJobSeeker} jsPhoto={jsPhoto} jsInitials={jsInitials} />
      <div style={s.emptyWrap}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dadce0" strokeWidth="1.5" style={{ marginBottom: 16 }}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        <div style={s.emptyTitle}>Job not found</div>
        <div style={s.emptySub}>This listing may have been removed or expired.</div>
        <button style={s.emptyBtn} onClick={() => navigate("/jobs")}>Browse All Jobs</button>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <Navbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} navigate={navigate} isJobSeeker={isJobSeeker} jsPhoto={jsPhoto} jsInitials={jsInitials} />

      <div style={s.body}>
        <div style={s.inner}>

          {/* Back */}
          <button onClick={() => navigate("/jobs")} style={s.backBtn}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back to Jobs
          </button>

          <div style={s.layout}>

            {/* ── Main Column ── */}
            <div style={s.mainCol}>

              {/* Header Card */}
              <div style={s.headerCard}>
                <div style={s.headerTop}>
                  <div style={s.headerLogo}>
                    {job.logoUrl
                      ? <img src={job.logoUrl} alt={job.employerName} style={s.logoImg} />
                      : <div style={{ ...s.logoPlaceholder, background: job.brandColour || "#1a73e8" }}>{job.employerName?.[0]}</div>
                    }
                  </div>
                  <div style={s.headerInfo}>
                    <h1 style={s.jobTitle}>{job.title}</h1>
                    <div style={s.jobCompany}>{job.employerName}</div>
                  </div>
                  <button onClick={handleToggleSave} style={{ ...s.saveBtn, ...(isSaved ? s.saveBtnActive : {}) }}>
                    {isSaved
                      ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="#f9ab00" stroke="#f9ab00" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Saved</>
                      : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Save</>
                    }
                  </button>
                </div>

                {/* Tags */}
                <div style={s.tagRow}>
                  <Tag icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>} value={`${job.city}, ${job.province}`} />
                  <Tag icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>} value={job.type} />
                  {job.department && <Tag icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>} value={job.department} />}
                  {job.salary && <Tag icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} value={job.salary} highlight />}
                  {job.remote && <Tag icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>} value="Remote / Hybrid" green />}
                  <Tag icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} value={`Closes ${job.closes}`} />
                </div>

                {/* Mobile Apply Button */}
                <div style={s.mobileApplyWrap}>
                  <button style={s.applyBtn} onClick={() => navigate(`/apply/${job.id}`)}>Apply Now</button>
                </div>
              </div>

              {/* Description */}
              {job.description && (
                <Section title="About the Role">
                  <p style={s.bodyText}>{job.description}</p>
                </Section>
              )}

              {/* Responsibilities */}
              {job.responsibilities?.length > 0 && (
                <Section title="Responsibilities">
                  {job.responsibilities.map((r, i) => (
                    <BulletItem key={i} text={r} dot />
                  ))}
                </Section>
              )}

              {/* Requirements */}
              {job.requirements?.length > 0 && (
                <Section title="Requirements">
                  {job.requirements.map((r, i) => (
                    <BulletItem key={i} text={r} check />
                  ))}
                </Section>
              )}

              {/* Nice to Haves */}
              {job.niceToHaves?.length > 0 && (
                <Section title="Nice to Have">
                  {job.niceToHaves.map((r, i) => (
                    <BulletItem key={i} text={r} dot />
                  ))}
                </Section>
              )}

              {/* Special Notes */}
              {job.specialNotes && (
                <Section title="Special Notes">
                  <div style={s.specialNote}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b06000" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <p style={s.bodyText}>{job.specialNotes}</p>
                  </div>
                </Section>
              )}
            </div>

            {/* ── Sidebar ── */}
            <div style={s.sideCol}>

              {/* Apply Card */}
              <div style={s.applyCard}>
                <div style={s.applyTitle}>Ready to Apply?</div>
                <p style={s.applySub}>Submit your application directly to {job.employerName}.</p>
                <button style={s.applyBtn} onClick={() => navigate(`/apply/${job.id}`)}>
                  Apply Now
                </button>
                <div style={s.applyNote}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Free to apply · No account required
                </div>
                <button onClick={handleToggleSave} style={{ ...s.saveBtnLarge, ...(isSaved ? s.saveBtnLargeActive : {}) }}>
                  {isSaved
                    ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="#f9ab00" stroke="#f9ab00" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Saved</>
                    : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Save Job</>
                  }
                </button>
              </div>

              {/* Summary Card */}
              <div style={s.summaryCard}>
                <div style={s.summaryTitle}>Job Summary</div>
                <InfoRow label="Job Type" value={job.type} />
                <InfoRow label="Department" value={job.department} />
                <InfoRow label="Province" value={job.province} />
                <InfoRow label="City" value={job.city} />
                <InfoRow label="Remote" value={job.remote ? "Yes" : "No"} />
                {job.salary && <InfoRow label="Salary" value={job.salary} highlight />}
                <InfoRow label="Closing Date" value={job.closes} />
              </div>

              {/* Company Card */}
              <div style={s.summaryCard}>
                <div style={s.summaryTitle}>About the Employer</div>
                <div style={s.companyRow}>
                  <div style={s.companyLogo}>
                    {job.logoUrl
                      ? <img src={job.logoUrl} alt={job.employerName} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      : <div style={{ ...s.logoPlaceholder, background: job.brandColour || "#1a73e8", width: "100%", height: "100%" }}>{job.employerName?.[0]}</div>
                    }
                  </div>
                  <div style={s.companyName}>{job.employerName}</div>
                </div>
                <Link to={`/company/${job.employerSlug || job.employerId}`} style={s.viewCompanyBtn}>
                  View Company Profile →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer style={s.footer}>
        <div style={s.footerInner}>
          <span>© {new Date().getFullYear()} Cronos Jobs. All rights reserved.</span>
          <div style={{ display: "flex", gap: "24px" }}>
            <Link to="/" style={s.footerLink}>Home</Link>
            <Link to="/terms" style={s.footerLink}>Terms</Link>
            <Link to="/privacy" style={s.footerLink}>Privacy</Link>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 900px) {
          .layout { grid-template-columns: 1fr !important; }
          .side-col { position: static !important; }
          .mobile-apply-wrap { display: block !important; }
          .apply-card { display: none !important; }
        }
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .menu-toggle { display: flex !important; }
          .body { padding: 16px !important; }
          .inner { max-width: 100% !important; }
          .header-top { flex-wrap: wrap !important; gap: 12px !important; }
          .tag-row { padding: 14px 16px !important; gap: 8px !important; }
          .job-title { font-size: 22px !important; }
          .section-card { padding: 20px !important; }
        }
        @media (max-width: 480px) {
          .job-title { font-size: 20px !important; }
          .header-card { border-radius: 10px !important; }
        }
        .apply-btn:hover { background: #1557b0 !important; }
        .nav-link:hover { background: #f1f3f4 !important; color: #202124 !important; }
        .save-btn:hover { border-color: #dadce0 !important; background: #f8f9fa !important; }
      `}</style>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────

function Navbar({ menuOpen, setMenuOpen, navigate, isJobSeeker, jsPhoto, jsInitials }) {
  return (
    <nav style={s.navbar}>
      <div style={s.navInner}>
        <div onClick={() => navigate("/")} style={s.navLogo}>
          <img src="/logo.png" alt="Cronos Jobs" style={s.navLogoImg} />
        </div>
        <div style={s.navLinks}>
          <Link to="/jobs" style={s.navLink}>Browse Jobs</Link>
          <Link to="/employer/join" style={s.navLink}>For Employers</Link>
          {isJobSeeker ? (
            <div style={s.navAvatar} onClick={() => navigate("/jobseeker/dashboard")} title="My Profile">
              {jsPhoto ? <img src={jsPhoto} alt="" style={s.navAvatarImg} /> : <div style={s.navAvatarInitials}>{jsInitials}</div>}
            </div>
          ) : (
            <Link to="/jobseeker/login" style={s.navLink}>Sign In</Link>
          )}
          <Link to="/employer/login" style={s.navBtn}>Employer Login</Link>
        </div>
        <button style={s.menuToggle} onClick={() => setMenuOpen(o => !o)}>
          {menuOpen
            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#202124" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#202124" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          }
        </button>
      </div>
      {menuOpen && (
        <div style={s.mobileMenu}>
          <Link to="/jobs" style={s.mobileLink} onClick={() => setMenuOpen(false)}>Browse Jobs</Link>
          <Link to="/employer/join" style={s.mobileLink} onClick={() => setMenuOpen(false)}>For Employers</Link>
          {isJobSeeker
            ? <Link to="/jobseeker/dashboard" style={s.mobileLink} onClick={() => setMenuOpen(false)}>My Profile</Link>
            : <Link to="/jobseeker/login" style={s.mobileLink} onClick={() => setMenuOpen(false)}>Sign In</Link>
          }
          <Link to="/employer/login" style={s.mobileLinkBtn} onClick={() => setMenuOpen(false)}>Employer Login</Link>
        </div>
      )}
    </nav>
  );
}

function Section({ title, children }) {
  return (
    <div style={s.sectionCard}>
      <div style={s.sectionTitle}>{title}</div>
      <div style={s.sectionBody}>{children}</div>
    </div>
  );
}

function BulletItem({ text, check, dot }) {
  return (
    <div style={s.bulletItem}>
      {check
        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 4 }}><polyline points="20 6 9 17 4 12"/></svg>
        : <div style={s.bulletDot} />
      }
      <span style={s.bulletText}>{text}</span>
    </div>
  );
}

function Tag({ icon, value, highlight, green }) {
  return (
    <div style={{
      ...s.tag,
      ...(highlight ? { background: "#e6f4ea", color: "#1e8e3e", border: "1px solid rgba(30,142,62,0.2)" } : {}),
      ...(green ? { background: "#e6f4ea", color: "#1e8e3e", border: "1px solid rgba(30,142,62,0.2)" } : {}),
    }}>
      <span style={{ display: "flex", alignItems: "center", color: "inherit" }}>{icon}</span>
      <span>{value}</span>
    </div>
  );
}

function InfoRow({ label, value, highlight }) {
  if (!value) return null;
  return (
    <div style={s.infoRow}>
      <span style={s.infoLabel}>{label}</span>
      <span style={{ ...s.infoValue, ...(highlight ? { color: "#1e8e3e", fontWeight: "600" } : {}) }}>{value}</span>
    </div>
  );
}

const s = {
  page: { background: "#f8f9fa", minHeight: "100vh", fontFamily: "'Circular Std', sans-serif", color: "#202124", display: "flex", flexDirection: "column" },

  // Navbar — white
  navbar: { background: "#fff", borderBottom: "1px solid #e0e0e0", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 4px rgba(60,64,67,0.08)" },
  navInner: { maxWidth: "1200px", margin: "0 auto", padding: "0 24px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" },
  navLogo: { cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 },
  navLogoImg: { height: "30px", objectFit: "contain" },
  navLinks: { display: "flex", alignItems: "center", gap: "4px" },
  navLink: { color: "#5f6368", fontSize: "15px", textDecoration: "none", padding: "8px 14px", borderRadius: "8px", transition: "background 0.15s" },
  navBtn: { background: "#1a73e8", color: "#fff", padding: "8px 18px", borderRadius: "999px", fontSize: "14px", fontWeight: "500", textDecoration: "none", marginLeft: "8px" },
  navAvatar: { width: "34px", height: "34px", borderRadius: "50%", overflow: "hidden", cursor: "pointer", border: "2px solid #e0e0e0", flexShrink: 0, marginLeft: "8px" },
  navAvatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  navAvatarInitials: { width: "100%", height: "100%", background: "#1a73e8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700" },
  menuToggle: { display: "none", background: "none", border: "none", cursor: "pointer", padding: "4px", alignItems: "center" },
  mobileMenu: { background: "#fff", borderTop: "1px solid #e0e0e0", padding: "10px 16px 16px", display: "flex", flexDirection: "column", gap: "2px", boxShadow: "0 4px 8px rgba(60,64,67,0.1)" },
  mobileLink: { color: "#202124", fontSize: "16px", padding: "13px 16px", borderRadius: "8px", textDecoration: "none", display: "block" },
  mobileLinkBtn: { color: "#fff", background: "#1a73e8", fontSize: "16px", padding: "13px 16px", borderRadius: "8px", textDecoration: "none", display: "block", textAlign: "center", marginTop: "8px" },

  // Body
  body: { flex: 1, padding: "32px 24px" },
  inner: { maxWidth: "1200px", margin: "0 auto" },
  backBtn: { display: "inline-flex", alignItems: "center", background: "none", border: "none", color: "#5f6368", fontSize: "15px", cursor: "pointer", padding: "0 0 24px", fontFamily: "'Circular Std', sans-serif" },

  // Layout
  layout: { display: "grid", gridTemplateColumns: "1fr 320px", gap: "28px", alignItems: "start" },
  mainCol: { display: "flex", flexDirection: "column", gap: "16px" },
  sideCol: { position: "sticky", top: "80px", display: "flex", flexDirection: "column", gap: "14px" },

  // Header card
  headerCard: { background: "#fff", border: "1px solid #e0e0e0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 1px 3px rgba(60,64,67,0.08)" },
  headerTop: { padding: "24px", display: "flex", alignItems: "flex-start", gap: "16px", borderBottom: "1px solid #f1f3f4" },
  headerLogo: { width: "64px", height: "64px", borderRadius: "12px", overflow: "hidden", border: "1px solid #e0e0e0", flexShrink: 0 },
  logoImg: { width: "100%", height: "100%", objectFit: "contain" },
  logoPlaceholder: { width: "64px", height: "64px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "700", fontSize: "26px" },
  headerInfo: { flex: 1 },
  jobTitle: { color: "#202124", fontSize: "26px", fontWeight: "800", margin: "0 0 6px", letterSpacing: "-0.01em" },
  jobCompany: { color: "#5f6368", fontSize: "16px" },
  saveBtn: { display: "inline-flex", alignItems: "center", gap: "6px", background: "#fff", border: "1px solid #dadce0", color: "#5f6368", borderRadius: "8px", padding: "8px 14px", fontSize: "14px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, fontFamily: "'Circular Std', sans-serif", transition: "all 0.15s" },
  saveBtnActive: { border: "1px solid #f9ab00", color: "#b06000", background: "#fef7e0" },
  tagRow: { display: "flex", flexWrap: "wrap", gap: "8px", padding: "16px 24px" },
  tag: { display: "inline-flex", alignItems: "center", gap: "6px", background: "#f8f9fa", border: "1px solid #e0e0e0", borderRadius: "999px", padding: "6px 12px", fontSize: "13px", color: "#5f6368" },
  mobileApplyWrap: { display: "none", padding: "16px 24px", borderTop: "1px solid #f1f3f4" },

  // Section cards
  sectionCard: { background: "#fff", border: "1px solid #e0e0e0", borderRadius: "14px", padding: "24px", boxShadow: "0 1px 3px rgba(60,64,67,0.06)" },
  sectionTitle: { color: "#202124", fontSize: "18px", fontWeight: "700", marginBottom: "16px", paddingBottom: "12px", borderBottom: "2px solid #e8f0fe" },
  sectionBody: { display: "flex", flexDirection: "column", gap: "10px" },
  bodyText: { color: "#3c4043", fontSize: "15px", lineHeight: "1.8", margin: 0, whiteSpace: "pre-wrap" },
  bulletItem: { display: "flex", alignItems: "flex-start", gap: "10px" },
  bulletDot: { width: "6px", height: "6px", borderRadius: "50%", background: "#5f6368", flexShrink: 0, marginTop: "8px" },
  bulletText: { color: "#3c4043", fontSize: "15px", lineHeight: "1.7" },
  specialNote: { display: "flex", gap: "10px", background: "#fef7e0", border: "1px solid rgba(249,171,0,0.3)", borderRadius: "10px", padding: "14px 16px" },

  // Sidebar
  applyCard: { background: "#fff", border: "1px solid #e0e0e0", borderRadius: "14px", padding: "24px", textAlign: "center", boxShadow: "0 1px 3px rgba(60,64,67,0.08)" },
  applyTitle: { color: "#202124", fontSize: "18px", fontWeight: "700", marginBottom: "8px" },
  applySub: { color: "#5f6368", fontSize: "14px", lineHeight: "1.6", marginBottom: "18px" },
  applyBtn: { width: "100%", background: "#1a73e8", color: "#fff", border: "none", borderRadius: "10px", padding: "14px", fontSize: "16px", fontWeight: "600", cursor: "pointer", marginBottom: "12px", fontFamily: "'Circular Std', sans-serif", transition: "background 0.15s" },
  applyNote: { display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", color: "#5f6368", fontSize: "12px", marginBottom: "14px" },
  saveBtnLarge: { display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", width: "100%", background: "#fff", border: "1px solid #dadce0", color: "#5f6368", borderRadius: "10px", padding: "11px", fontSize: "14px", cursor: "pointer", fontFamily: "'Circular Std', sans-serif", transition: "all 0.15s" },
  saveBtnLargeActive: { background: "#fef7e0", border: "1px solid #f9ab00", color: "#b06000" },

  summaryCard: { background: "#fff", border: "1px solid #e0e0e0", borderRadius: "14px", padding: "20px", boxShadow: "0 1px 3px rgba(60,64,67,0.06)" },
  summaryTitle: { color: "#202124", fontSize: "15px", fontWeight: "700", marginBottom: "14px" },
  infoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "9px 0", borderBottom: "1px solid #f1f3f4", fontSize: "14px" },
  infoLabel: { color: "#5f6368" },
  infoValue: { color: "#202124", fontWeight: "500", textAlign: "right" },
  companyRow: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" },
  companyLogo: { width: "40px", height: "40px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, border: "1px solid #e0e0e0" },
  companyName: { color: "#202124", fontSize: "15px", fontWeight: "600" },
  viewCompanyBtn: { display: "inline-flex", alignItems: "center", color: "#1a73e8", fontSize: "14px", textDecoration: "none", fontWeight: "500" },

  // Loading / empty states
  loadingWrap: { maxWidth: "1200px", margin: "40px auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: "16px" },
  skeleton: { background: "linear-gradient(90deg,#f1f3f4 25%,#e8eaed 50%,#f1f3f4 75%)", backgroundSize: "200%", animation: "shimmer 1.5s infinite", borderRadius: "14px", height: "120px" },
  emptyWrap: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center" },
  emptyTitle: { color: "#202124", fontSize: "22px", fontWeight: "700", marginBottom: "8px" },
  emptySub: { color: "#5f6368", fontSize: "16px", marginBottom: "24px" },
  emptyBtn: { background: "#1a73e8", color: "#fff", border: "none", borderRadius: "8px", padding: "12px 28px", fontSize: "15px", fontWeight: "500", cursor: "pointer", fontFamily: "'Circular Std', sans-serif" },

  // Footer
  footer: { background: "#202124", padding: "24px" },
  footerInner: { maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", color: "rgba(255,255,255,0.3)", fontSize: "13px" },
  footerLink: { color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: "13px" },
};