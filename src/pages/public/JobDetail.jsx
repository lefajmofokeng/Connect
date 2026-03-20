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

  const isSaved    = savedJobs.includes(id);
  const isJobSeeker = user && jobSeekerProfile;
  const jsPhoto    = jobSeekerProfile?.photoUrl || null;
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
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dadce0" strokeWidth="1.5" style={{ marginBottom: 16 }}>
          <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to Jobs
          </button>

          <div style={s.layout}>

            {/* ── Main Column ── */}
            <div style={s.mainCol}>

              {/* Header card */}
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
                      ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="#ea8600" stroke="#ea8600" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Saved</>
                      : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Save</>
                    }
                  </button>
                </div>

                {/* Tags */}
                <div style={s.tagRow}>
                  <Tag icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>} value={`${job.city}, ${job.province}`} />
                  <Tag icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>} value={job.type} />
                  {job.department && <Tag icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>} value={job.department} />}
                  {job.salary && <Tag icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} value={job.salary} highlight />}
                  {job.remote && <Tag icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>} value="Remote / Hybrid" green />}
                  <Tag icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} value={`Closes ${job.closes}`} />
                </div>

                {/* Mobile Apply */}
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
                  {job.responsibilities.map((r, i) => <BulletItem key={i} text={r} dot />)}
                </Section>
              )}

              {/* Requirements */}
              {job.requirements?.length > 0 && (
                <Section title="Requirements">
                  {job.requirements.map((r, i) => <BulletItem key={i} text={r} check />)}
                </Section>
              )}

              {/* Nice to Haves */}
              {job.niceToHaves?.length > 0 && (
                <Section title="Nice to Have">
                  {job.niceToHaves.map((r, i) => <BulletItem key={i} text={r} dot />)}
                </Section>
              )}

              {/* Special Notes */}
              {job.specialNotes && (
                <Section title="Special Notes">
                  <div style={s.specialNote}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ea8600" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p style={s.bodyText}>{job.specialNotes}</p>
                  </div>
                </Section>
              )}
            </div>

            {/* ── Sidebar ── */}
            <div style={s.sideCol}>

              {/* Apply card */}
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
                    ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="#ea8600" stroke="#ea8600" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Saved</>
                    : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Save Job</>
                  }
                </button>
              </div>

              {/* Summary card */}
              <div style={s.sideCard}>
                <div style={s.sideCardTitle}>Job Summary</div>
                <InfoRow label="Job Type"      value={job.type} />
                <InfoRow label="Department"    value={job.department} />
                <InfoRow label="Province"      value={job.province} />
                <InfoRow label="City"          value={job.city} />
                <InfoRow label="Remote"        value={job.remote ? "Yes" : "No"} />
                {job.salary && <InfoRow label="Salary" value={job.salary} highlight />}
                <InfoRow label="Closing Date"  value={job.closes} />
              </div>

              {/* Company card */}
              <div style={s.sideCard}>
                <div style={s.sideCardTitle}>About the Employer</div>
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
          <span>© {new Date().getFullYear()} Vetted. All rights reserved.</span>
          <div style={{ display: "flex", gap: "24px" }}>
            <Link to="/" style={s.footerLink}>Home</Link>
            <Link to="/terms" style={s.footerLink}>Terms</Link>
            <Link to="/privacy" style={s.footerLink}>Privacy</Link>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @media (max-width: 900px) { .jd-layout{grid-template-columns:1fr!important} .jd-side{position:static!important} .jd-apply-card{display:none!important} .jd-mobile-apply{display:block!important} }
        @media (max-width: 768px) { .jd-nav-links{display:none!important} .jd-menu-toggle{display:flex!important} .jd-body{padding:16px!important} }
      `}</style>
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────
function Navbar({ menuOpen, setMenuOpen, navigate, isJobSeeker, jsPhoto, jsInitials }) {
  return (
    <nav style={s.navbar}>
      <div style={s.navInner}>
        <div onClick={() => navigate("/")} style={s.navLogo}>
          <img src="/logo.png" alt="Vetted" style={s.navLogoImg} />
        </div>
        <div style={s.navLinks} className="jd-nav-links">
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
        <button style={s.menuToggle} className="jd-menu-toggle" onClick={() => setMenuOpen(o => !o)}>
          {menuOpen
            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#202124" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#202124" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
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

// ── Sub-components ────────────────────────────────────────────────────
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
        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 3 }}><polyline points="20 6 9 17 4 12"/></svg>
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
      ...(highlight ? { background: "#e6f4ea", color: "#0d652d", border: "1px solid #ceead6" } : {}),
      ...(green     ? { background: "#e6f4ea", color: "#0d652d", border: "1px solid #ceead6" } : {}),
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
      <span style={{ ...s.infoValue, ...(highlight ? { color: "#0d652d", fontWeight: "600" } : {}) }}>{value}</span>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const s = {
  page: {
    background: "#f4f5f7",
    minHeight: "100vh",
    fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: "#202124",
    display: "flex",
    flexDirection: "column",
  },

  // ── Navbar ──
  navbar: { background: "#ffffff", borderBottom: "1px solid #e3e3e3", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 2px rgba(60,64,67,0.06)" },
  navInner: { maxWidth: "1200px", margin: "0 auto", padding: "0 24px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" },
  navLogo: { cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 },
  navLogoImg: { height: "26px", objectFit: "contain" },
  navLinks: { display: "flex", alignItems: "center", gap: "4px" },
  navLink: { color: "#5f6368", fontSize: "13px", fontWeight: "500", textDecoration: "none", padding: "7px 12px", borderRadius: "4px", transition: "background 0.15s" },
  navBtn: { background: "#1a73e8", color: "#ffffff", padding: "7px 14px", borderRadius: "4px", fontSize: "13px", fontWeight: "600", textDecoration: "none", marginLeft: "4px" },
  navAvatar: { width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", cursor: "pointer", border: "2px solid #e3e3e3", flexShrink: 0, marginLeft: "8px" },
  navAvatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  navAvatarInitials: { width: "100%", height: "100%", background: "#1a73e8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700" },
  menuToggle: { display: "none", background: "none", border: "none", cursor: "pointer", padding: "4px", alignItems: "center" },
  mobileMenu: { background: "#ffffff", borderTop: "1px solid #e3e3e3", padding: "8px 16px 16px", display: "flex", flexDirection: "column", gap: "2px" },
  mobileLink: { color: "#202124", fontSize: "14px", fontWeight: "500", padding: "12px 16px", borderRadius: "4px", textDecoration: "none", display: "block" },
  mobileLinkBtn: { color: "#ffffff", background: "#1a73e8", fontSize: "14px", fontWeight: "600", padding: "12px 16px", borderRadius: "4px", textDecoration: "none", display: "block", textAlign: "center", marginTop: "8px" },

  // ── Body ──
  body: { flex: 1, padding: "28px 24px" },
  inner: { maxWidth: "1200px", margin: "0 auto" },
  backBtn: { display: "inline-flex", alignItems: "center", background: "none", border: "none", color: "#5f6368", fontSize: "13px", fontWeight: "500", cursor: "pointer", padding: "0 0 20px", fontFamily: "inherit" },

  // ── Layout ──
  layout: { display: "grid", gridTemplateColumns: "1fr 300px", gap: "24px", alignItems: "start" },
  mainCol: { display: "flex", flexDirection: "column", gap: "14px" },
  sideCol: { position: "sticky", top: "76px", display: "flex", flexDirection: "column", gap: "12px" },

  // ── Header card ──
  headerCard: { background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.08)" },
  headerTop: { padding: "20px 24px", display: "flex", alignItems: "flex-start", gap: "14px", borderBottom: "1px solid #f1f3f4" },
  headerLogo: { width: "56px", height: "56px", borderRadius: "8px", overflow: "hidden", border: "1px solid #e3e3e3", flexShrink: 0 },
  logoImg: { width: "100%", height: "100%", objectFit: "contain" },
  logoPlaceholder: { width: "56px", height: "56px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "700", fontSize: "22px" },
  headerInfo: { flex: 1 },
  jobTitle: { color: "#202124", fontSize: "22px", fontWeight: "600", margin: "0 0 4px", letterSpacing: "-0.3px" },
  jobCompany: { color: "#5f6368", fontSize: "14px", fontWeight: "500" },
  saveBtn: { display: "inline-flex", alignItems: "center", gap: "5px", background: "#ffffff", border: "1px solid #dadce0", color: "#5f6368", borderRadius: "4px", padding: "7px 12px", fontSize: "13px", fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, fontFamily: "inherit", transition: "all 0.15s" },
  saveBtnActive: { border: "1px solid #fde68a", color: "#ea8600", background: "#fef7e0" },

  tagRow: { display: "flex", flexWrap: "wrap", gap: "6px", padding: "14px 24px" },
  tag: { display: "inline-flex", alignItems: "center", gap: "5px", background: "#f8f9fa", border: "1px solid #e3e3e3", borderRadius: "4px", padding: "5px 10px", fontSize: "12px", color: "#5f6368", fontWeight: "500" },
  mobileApplyWrap: { display: "none", padding: "14px 24px", borderTop: "1px solid #f1f3f4" },

  // ── Section cards ──
  sectionCard: { background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "8px", padding: "22px 24px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.06)" },
  sectionTitle: { color: "#202124", fontSize: "15px", fontWeight: "600", marginBottom: "14px", paddingBottom: "10px", borderBottom: "2px solid #e3f2fd" },
  sectionBody: { display: "flex", flexDirection: "column", gap: "8px" },
  bodyText: { color: "#3c4043", fontSize: "14px", lineHeight: "1.8", margin: 0, whiteSpace: "pre-wrap" },
  bulletItem: { display: "flex", alignItems: "flex-start", gap: "10px" },
  bulletDot: { width: "5px", height: "5px", borderRadius: "50%", background: "#9aa0a6", flexShrink: 0, marginTop: "8px" },
  bulletText: { color: "#3c4043", fontSize: "14px", lineHeight: "1.7" },
  specialNote: { display: "flex", gap: "10px", background: "#fef7e0", border: "1px solid #fde68a", borderRadius: "6px", padding: "12px 14px" },

  // ── Apply card ──
  applyCard: { background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "8px", padding: "20px", textAlign: "center", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.08)" },
  applyTitle: { color: "#202124", fontSize: "15px", fontWeight: "600", marginBottom: "6px" },
  applySub: { color: "#5f6368", fontSize: "13px", lineHeight: "1.6", marginBottom: "16px" },
  applyBtn: { width: "100%", background: "#1a73e8", color: "#ffffff", border: "none", borderRadius: "4px", padding: "11px", fontSize: "14px", fontWeight: "600", cursor: "pointer", marginBottom: "10px", fontFamily: "inherit", boxShadow: "0 1px 2px rgba(0,0,0,0.1)", transition: "background 0.15s" },
  applyNote: { display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", color: "#9aa0a6", fontSize: "12px", marginBottom: "12px", fontWeight: "500" },
  saveBtnLarge: { display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", width: "100%", background: "#ffffff", border: "1px solid #dadce0", color: "#5f6368", borderRadius: "4px", padding: "9px", fontSize: "13px", fontWeight: "500", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" },
  saveBtnLargeActive: { background: "#fef7e0", border: "1px solid #fde68a", color: "#ea8600" },

  // ── Sidebar cards ──
  sideCard: { background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "8px", padding: "18px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.06)" },
  sideCardTitle: { color: "#202124", fontSize: "12px", fontWeight: "700", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.4px" },
  infoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "8px 0", borderBottom: "1px solid #f1f3f4", fontSize: "13px" },
  infoLabel: { color: "#5f6368", fontWeight: "500" },
  infoValue: { color: "#202124", fontWeight: "500", textAlign: "right" },
  companyRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" },
  companyLogo: { width: "36px", height: "36px", borderRadius: "6px", overflow: "hidden", flexShrink: 0, border: "1px solid #e3e3e3" },
  companyName: { color: "#202124", fontSize: "13px", fontWeight: "600" },
  viewCompanyBtn: { display: "inline-flex", alignItems: "center", color: "#1a73e8", fontSize: "13px", fontWeight: "600", textDecoration: "none" },

  // ── Loading / empty ──
  loadingWrap: { maxWidth: "1200px", margin: "28px auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: "14px" },
  skeleton: { background: "linear-gradient(90deg,#f1f3f4 25%,#e8eaed 50%,#f1f3f4 75%)", backgroundSize: "200%", animation: "shimmer 1.5s infinite", borderRadius: "8px", height: "120px" },
  emptyWrap: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center" },
  emptyTitle: { color: "#202124", fontSize: "20px", fontWeight: "600", marginBottom: "8px", letterSpacing: "-0.3px" },
  emptySub: { color: "#5f6368", fontSize: "14px", marginBottom: "24px" },
  emptyBtn: { background: "#1a73e8", color: "#ffffff", border: "none", borderRadius: "4px", padding: "10px 24px", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },

  // ── Footer ──
  footer: { background: "#202124", padding: "20px 24px" },
  footerInner: { maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", color: "rgba(255,255,255,0.35)", fontSize: "12px" },
  footerLink: { color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: "12px" },
};