import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { toggleSavedJob, getLocalSavedJobs } from "../../lib/savedJobs";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, jobSeekerProfile } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState(getLocalSavedJobs);

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

  if (loading) return (
    <div className="jd-page" style={s.page}>
      <Navbar />
      <div style={s.loadingWrap}>
        <div style={s.skeleton} />
        <div style={{ ...s.skeleton, height: 200 }} />
        <div style={{ ...s.skeleton, height: 160 }} />
      </div>
    </div>
  );

  if (!job) return (
    <div className="jd-page" style={s.page}>
      <Navbar />
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
    <div className="jd-page" style={s.page}>
      <Navbar />

      <div className="jd-body" style={s.body}>
        <div style={s.inner}>

          {/* Back */}
          <button onClick={() => navigate("/")} style={s.backBtn}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 7 }}>
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Back
          </button>

          {/* ── Hero Header ── */}
          <div className="jd-hero" style={s.hero}>
            <div style={s.heroInner}>

              {/* Logo */}
              <div style={s.heroLogo}>
                {job.logoUrl
                  ? <img src={job.logoUrl} alt={job.employerName} style={s.logoImg} />
                  : <div style={{ ...s.logoPlaceholder, background: job.brandColour || "#1a73e8" }}>{job.employerName?.[0]}</div>
                }
              </div>

              {/* Title block */}
              <div style={s.heroText}>
                <div style={s.heroCompany}>{job.employerName}</div>
                <h1 className="jd-title" style={s.jobTitle}>{job.title}</h1>

                {/* Meta row */}
                <div className="jd-meta-row" style={s.metaRow}>
                  <MetaPill icon={
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  } value={`${job.city}, ${job.province}`} />
                  <span style={s.metaDot}>·</span>
                  <MetaPill icon={
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  } value={job.type} />
                  {job.department && <><span style={s.metaDot}>·</span><MetaPill icon={
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                  } value={job.department} /></>}
                  {job.remote && <><span style={s.metaDot}>·</span><span style={s.remoteTag}>Remote / Hybrid</span></>}
                </div>

                {/* Salary + Closing */}
                <div style={s.heroSubMeta}>
                  {job.salary && <span style={s.salaryBadge}>{job.salary}</span>}
                  <span style={s.closingText}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 5 }}>
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    Closes {job.closes}
                  </span>
                </div>
              </div>

              {/* Save button — desktop */}
              <button onClick={handleToggleSave} style={{ ...s.saveBtn, ...(isSaved ? s.saveBtnActive : {}) }}>
                {isSaved
                  ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="#ea8600" stroke="#ea8600" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Saved</>
                  : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Save</>
                }
              </button>

            </div>

            {/* Mobile Apply */}
            <div className="jd-mobile-apply" style={s.mobileApplyWrap}>
              <button style={s.applyBtnMobile} onClick={() => navigate(`/apply/${job.id}`)}>Apply Now</button>
            </div>
          </div>

          {/* ── Body Layout ── */}
          <div className="jd-layout" style={s.layout}>

            {/* ── Main Column ── */}
            <div style={s.mainCol}>

              {job.description && (
                <Section title="About the Role">
                  <p style={s.bodyText}>{job.description}</p>
                </Section>
              )}

              {job.responsibilities?.length > 0 && (
                <Section title="Responsibilities">
                  {job.responsibilities.map((r, i) => <BulletItem key={i} text={r} dot />)}
                </Section>
              )}

              {job.requirements?.length > 0 && (
                <Section title="Requirements">
                  {job.requirements.map((r, i) => <BulletItem key={i} text={r} check />)}
                </Section>
              )}

              {job.niceToHaves?.length > 0 && (
                <Section title="Nice to Have">
                  {job.niceToHaves.map((r, i) => <BulletItem key={i} text={r} dot />)}
                </Section>
              )}

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
            <div className="jd-side" style={s.sideCol}>

              {/* Apply card */}
              <div style={s.applyCard}>
                <button style={s.applyBtn} onClick={() => navigate(`/apply/${job.id}`)}>
                  Apply Now
                </button>
                <div style={s.applyNote}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Free to apply · No account required
                </div>
                <button onClick={handleToggleSave} style={{ ...s.saveBtnLarge, ...(isSaved ? s.saveBtnLargeActive : {}) }}>
                  {isSaved
                    ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="#ea8600" stroke="#ea8600" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Saved</>
                    : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Save Job</>
                  }
                </button>
              </div>

              {/* Job details — transparent, no card */}
              <div style={s.sideDetails}>
                <div style={s.sideDetailsTitle}>Position Details</div>
                <InfoRow label="Location"     value={`${job.city}, ${job.province}`} />
                <InfoRow label="Job Type"     value={job.type} />
                {job.department && <InfoRow label="Department"  value={job.department} />}
                <InfoRow label="Remote"       value={job.remote ? "Yes — Remote / Hybrid" : "On-site"} />
                {job.salary && <InfoRow label="Salary"      value={job.salary} highlight />}
                <InfoRow label="Closes"       value={job.closes} />
              </div>

              {/* Company — transparent, no card */}
              <div style={s.sideCompany}>
                <div style={s.sideDetailsTitle}>About the Employer</div>
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

      <Footer />

      <style>{`
        * { box-sizing: border-box; }
        .jd-page * { font-family: ${FONT} !important; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        @media (max-width: 900px) {
          .jd-layout  { grid-template-columns: 1fr !important; }
          .jd-side    { display: none !important; }
          .jd-mobile-apply { display: block !important; }
          .jd-hero    { border-radius: 0 !important; margin: 0 -16px !important; }
        }

        @media (max-width: 768px) {
          .jd-body    { padding: 72px 16px 40px !important; }
          .jd-title   { font-size: 22px !important; }
          .jd-meta-row { flex-wrap: wrap !important; gap: 6px !important; }
          .jd-hero-inner { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
          .jd-save-desktop { display: none !important; }
        }

        @media (max-width: 480px) {
          .jd-title { font-size: 20px !important; }
        }
      `}</style>
    </div>
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

function MetaPill({ icon, value }) {
  return (
    <span style={s.metaPill}>
      <span style={{ display: "flex", alignItems: "center", opacity: 0.6 }}>{icon}</span>
      {value}
    </span>
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

const FONT = '"Circular Std", "Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const s = {
  page: {
    background: "#ffffff",
    minHeight: "100vh",
    fontFamily: FONT,
    color: "#202124",
    display: "flex",
    flexDirection: "column",
  },

  // ── Body ──
  body: { flex: 1, padding: "80px 32px 80px" },
  inner: { maxWidth: "1160px", margin: "0 auto" },
  backBtn: { display: "inline-flex", alignItems: "center", background: "none", border: "none", color: "#9aa0a6", fontSize: "13px", fontWeight: "500", cursor: "pointer", padding: "0 0 28px", fontFamily: FONT, letterSpacing: "0.1px" },

  // ── Hero Header ── full-width, no card border
  hero: { borderBottom: "1px solid #a2a2a2", color: "#323444", padding: "0 20px 20px 20px", marginBottom: "0" },
  heroInner: { display: "flex", alignItems: "flex-start", gap: "20px" },
  heroLogo: { width: "72px", height: "72px", borderRadius: "50px", overflow: "hidden", border: "1px solid #f1f3f4", flexShrink: 0, background: "#f8f9fa" },
  logoImg: { width: "100%", height: "100%", objectFit: "contain" },
  logoPlaceholder: { width: "72px", height: "72px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "700", fontSize: "26px", borderRadius: "12px" },
  heroText: { flex: 1, minWidth: 0 },
  heroCompany: { color: "#1a73e8", fontSize: "17px", fontWeight: "500", marginBottom: "6px", letterSpacing: "0.1px" },
  jobTitle: { color: "#202124", fontSize: "28px", fontWeight: "500", margin: "0 0 12px", letterSpacing: "-0.5px", lineHeight: "1.25" },

  // Meta row — inline, dot-separated
  metaRow: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "12px" },
  metaPill: { display: "inline-flex", alignItems: "center", gap: "5px", color: "#5f6368", fontSize: "13px", fontWeight: "400" },
  metaDot: { color: "#dadce0", fontSize: "14px", lineHeight: 1 },
  remoteTag: { display: "inline-flex", alignItems: "center", background: "#e6f4ea", color: "#0d652d", borderRadius: "100px", padding: "3px 10px", fontSize: "12px", fontWeight: "600" },

  // Sub-meta: salary + closing
  heroSubMeta: { display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" },
  salaryBadge: { display: "inline-flex", alignItems: "center", background: "#f0f6ff", color: "#1557b0", borderRadius: "50px", padding: "4px 10px", fontSize: "13px", fontWeight: "600" },
  closingText: { display: "inline-flex", alignItems: "center", color: "#9aa0a6", fontSize: "13px" },

  // Save button
  saveBtn: { display: "inline-flex", alignItems: "center", gap: "6px", background: "#ffffff", border: "1px solid #e3e3e3", color: "#5f6368", borderRadius: "100px", padding: "8px 16px", fontSize: "13px", fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, fontFamily: FONT, transition: "all 0.15s" },
  saveBtnActive: { border: "1px solid #fde68a", color: "#ea8600", background: "#fef7e0" },

  // Mobile apply
  mobileApplyWrap: { display: "none", paddingTop: "20px" },
  applyBtnMobile: { width: "100%", background: "#1a73e8", color: "#ffffff", border: "none", borderRadius: "8px", padding: "13px", fontSize: "15px", fontWeight: "600", cursor: "pointer", fontFamily: FONT },

  // ── Layout ──
  layout: { display: "grid", gridTemplateColumns: "1fr 280px", gap: "64px", alignItems: "start", paddingTop: "40px" },
  mainCol: { display: "flex", flexDirection: "column", gap: "0" },
  sideCol: { position: "sticky", top: "80px", display: "flex", flexDirection: "column", gap: "28px" },

  // ── Section — transparent, separated by line only ──
  sectionCard: { background: "transparent", borderBottom: "1px solid #f1f3f4", padding: "32px 0" },
  sectionTitle: { color: "#202124", fontSize: "23px", fontWeight: "500", marginBottom: "20px", color: "#000000" },
  sectionBody: { display: "flex", flexDirection: "column", gap: "10px" },
  bodyText: { color: "#3c4043", fontSize: "17px", lineHeight: "1.85", margin: 0, whiteSpace: "pre-wrap" },
  bulletItem: { display: "flex", alignItems: "flex-start", gap: "12px" },
  bulletDot: { width: "5px", height: "5px", borderRadius: "50%", background: "#dadce0", flexShrink: 0, marginTop: "9px" },
  bulletText: { color: "#3c4043", fontSize: "17px", lineHeight: "1.7" },
  specialNote: { display: "flex", gap: "12px", background: "#fffbf0", border: "1px solid #fde68a", borderRadius: "8px", padding: "14px 16px" },

  // ── Apply card — minimal white ──
  applyCard: { background: "#ffffff", border: "1px solid #e8eaed", borderRadius: "12px", padding: "20px" },
  applyBtn: { width: "100%", background: "#1a73e8", color: "#ffffff", border: "none", borderRadius: "8px", padding: "12px", fontSize: "14px", fontWeight: "600", cursor: "pointer", marginBottom: "10px", fontFamily: FONT, letterSpacing: "0.1px" },
  applyNote: { display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", color: "#9aa0a6", fontSize: "12px", marginBottom: "14px" },
  saveBtnLarge: { display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", width: "100%", background: "#f8f9fa", border: "1px solid #e8eaed", color: "#5f6368", borderRadius: "8px", padding: "10px", fontSize: "13px", fontWeight: "500", cursor: "pointer", fontFamily: FONT, transition: "all 0.15s" },
  saveBtnLargeActive: { background: "#fef7e0", border: "1px solid #fde68a", color: "#ea8600" },

  // ── Sidebar details — transparent, no card ──
  sideDetails: { paddingTop: "4px" },
  sideDetailsTitle: { color: "#9aa0a6", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "14px" },
  infoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid #f1f3f4", fontSize: "13px" },
  infoLabel: { color: "#9aa0a6", fontWeight: "400" },
  infoValue: { color: "#202124", fontWeight: "500", textAlign: "right", maxWidth: "55%" },

  // ── Sidebar company — transparent ──
  sideCompany: { paddingTop: "4px" },
  companyRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" },
  companyLogo: { width: "36px", height: "36px", borderRadius: "6px", overflow: "hidden", flexShrink: 0, border: "1px solid #f1f3f4" },
  companyName: { color: "#202124", fontSize: "13px", fontWeight: "600" },
  viewCompanyBtn: { display: "inline-flex", alignItems: "center", color: "#1a73e8", fontSize: "13px", fontWeight: "500", textDecoration: "none" },

  // ── Loading / empty ──
  loadingWrap: { maxWidth: "1160px", margin: "92px auto 28px", padding: "0 32px", display: "flex", flexDirection: "column", gap: "14px" },
  skeleton: { background: "linear-gradient(90deg,#f1f3f4 25%,#e8eaed 50%,#f1f3f4 75%)", backgroundSize: "200%", animation: "shimmer 1.5s infinite", borderRadius: "8px", height: "120px" },
  emptyWrap: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center" },
  emptyTitle: { color: "#202124", fontSize: "20px", fontWeight: "600", marginBottom: "8px", letterSpacing: "-0.3px", fontFamily: FONT },
  emptySub: { color: "#9aa0a6", fontSize: "14px", marginBottom: "24px", fontFamily: FONT },
  emptyBtn: { background: "#1a73e8", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 24px", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: FONT },
};