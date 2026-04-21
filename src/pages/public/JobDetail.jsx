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

      {/* ── Premium Dark Hero Banner ── */}
      <div style={s.heroBanner}>
        <div style={s.heroBannerInner}>

          {/* Back */}
          <div style={s.backRow}>
            <button onClick={() => navigate("/")} style={s.backBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6 }}>
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to positions
            </button>
          </div>

          <div className="jd-hero-inner" style={s.heroRow}>

            {/* Tight, refined Logo */}
            <div style={s.heroLogo}>
              {job.logoUrl
                ? <img src={job.logoUrl} alt={job.employerName} style={s.logoImg} />
                : <div style={{ ...s.logoPlaceholder, background: job.brandColour || "#1a73e8" }}>{job.employerName?.[0]}</div>
              }
            </div>

            {/* Title + meta */}
            <div style={s.heroText}>
              <div style={s.heroCompany}>{job.employerName}</div>
              <h1 className="jd-title" style={s.jobTitle}>{job.title}</h1>

              {/* Tag chips row */}
              <div className="jd-tag-row" style={s.tagRow}>
                <Chip icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>} value={`${job.city}, ${job.province}`} />
                <Chip icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>} value={job.type} />
                {job.department && <Chip icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>} value={job.department} />}
                {job.remote && <Chip value="Remote / Hybrid" green />}
                {job.salary && <Chip value={job.salary} highlight />}
                <Chip icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>} value={`Closes ${job.closes}`} muted />
              </div>
            </div>

            {/* Save — desktop */}
            <button onClick={handleToggleSave} className="jd-save-desktop" style={{ ...s.saveBtn, ...(isSaved ? s.saveBtnActive : {}) }}>
              {isSaved
                ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="#0058aa" stroke="#0058aa" strokeWidth="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>Saved</>
                : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>Save</>
              }
            </button>

          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="jd-body" style={s.body}>
        <div style={s.inner}>
          <div className="jd-layout" style={s.layout}>

            {/* ── Main Column ── */}
            <div style={s.mainCol}>

              {job.description && (
                <DetailBlock title="About the Role">
                  <p style={s.bodyText}>{job.description}</p>
                </DetailBlock>
              )}

              {job.responsibilities?.length > 0 && (
                <DetailBlock title="Responsibilities">
                  {job.responsibilities.map((r, i) => <BulletItem key={i} text={r} dot />)}
                </DetailBlock>
              )}

              {job.requirements?.length > 0 && (
                <DetailBlock title="Requirements">
                  {job.requirements.map((r, i) => <BulletItem key={i} text={r} check />)}
                </DetailBlock>
              )}

              {job.niceToHaves?.length > 0 && (
                <DetailBlock title="Nice to Have">
                  {job.niceToHaves.map((r, i) => <BulletItem key={i} text={r} dot />)}
                </DetailBlock>
              )}

              {job.specialNotes && (
                <DetailBlock title="Special Notes">
                  <div style={s.specialNote}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ea8600" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p style={s.specialNoteText}>{job.specialNotes}</p>
                  </div>
                </DetailBlock>
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
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Free to apply · Verified Listing
                </div>
                <div style={s.applyDivider} />
                <button onClick={handleToggleSave} style={{ ...s.saveBtnLarge, ...(isSaved ? s.saveBtnLargeActive : {}) }}>
                  {isSaved
                    ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="#0058aa" stroke="#0058aa" strokeWidth="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>Saved to Dashboard</>
                    : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>Save for Later</>
                  }
                </button>
              </div>

              {/* Position Details */}
              <div style={s.sideBlock}>
                <div style={s.sideBlockTitle}>Position Meta</div>
                <InfoRow label="Location"   value={`${job.city}, ${job.province}`} />
                <InfoRow label="Job Type"   value={job.type} />
                {job.department && <InfoRow label="Department" value={job.department} />}
                <InfoRow label="Work Mode"  value={job.remote ? "Remote / Hybrid" : "On-site"} />
                {job.salary && <InfoRow label="Salary Range" value={job.salary} highlight />}
                <InfoRow label="Closing Date" value={job.closes} />
              </div>

              {/* Employer */}
              <div style={s.sideBlock}>
                <div style={s.sideBlockTitle}>Enterprise</div>
                <div style={s.companyRow}>
                  <div style={s.companyLogo}>
                    {job.logoUrl
                      ? <img src={job.logoUrl} alt={job.employerName} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      : <div style={{ ...s.logoPlaceholder, background: job.brandColour || "#1a73e8", width: "100%", height: "100%", fontSize: "16px" }}>{job.employerName?.[0]}</div>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.companyName}>{job.employerName}</div>
                    <Link to={`/company/${job.employerSlug || job.employerId}`} style={s.viewCompanyBtn}>
                      View enterprise profile <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginLeft: 2}}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Mobile Sticky Apply Bar */}
      <div className="jd-mobile-sticky-bar" style={s.mobileStickyBar}>
        <button style={s.applyBtnMobile} onClick={() => navigate(`/apply/${job.id}`)}>Apply Now</button>
        <button onClick={handleToggleSave} style={{ ...s.mobileStickySave, ...(isSaved ? s.mobileStickySaveActive : {}) }}>
          {isSaved 
            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="#0058aa" stroke="#0058aa" strokeWidth="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          }
        </button>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        .jd-page * { font-family: ${FONT} !important; -webkit-font-smoothing: antialiased !important; -moz-osx-font-smoothing: grayscale !important; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .jd-mobile-sticky-bar { display: none !important; }

        @media (max-width: 900px) {
          .jd-layout      { grid-template-columns: 1fr !important; }
          .jd-side        { display: none !important; }
          .jd-mobile-sticky-bar { display: flex !important; }
        }

        @media (max-width: 768px) {
          .jd-body        { padding: 0 16px 80px !important; } /* Extra padding for sticky bar */
          .jd-title       { font-size: 26px !important; letter-spacing: -0.5px !important; }
          .jd-hero-inner  { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
          .jd-save-desktop { display: none !important; }
          .jd-tag-row     { gap: 8px !important; }
        }

        @media (max-width: 480px) {
          .jd-title { font-size: 24px !important; }
        }
      `}</style>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────
function DetailBlock({ title, children }) {
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
        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" style={{ flexShrink: 0, marginTop: 4 }}><polyline points="20 6 9 17 4 12"/></svg>
        : <div style={s.bulletDot} />
      }
      <span style={s.bulletText}>{text}</span>
    </div>
  );
}

function Chip({ icon, value, highlight, green, muted }) {
  return (
    <span style={{
      ...s.chip,
      ...(highlight ? s.chipHighlight : {}),
      ...(green     ? s.chipGreen    : {}),
      ...(muted     ? s.chipMuted    : {}),
    }}>
      {icon && <span style={{ display: "flex", alignItems: "center", opacity: 0.7 }}>{icon}</span>}
      {value}
    </span>
  );
}

function InfoRow({ label, value, highlight }) {
  if (!value) return null;
  return (
    <div style={s.infoRow}>
      <span style={s.infoLabel}>{label}</span>
      <span style={{ ...s.infoValue, ...(highlight ? { color: "#000000", fontWeight: "600" } : {}) }}>{value}</span>
    </div>
  );
}

const FONT = '"Circular Std", "Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const s = {
  page: {
    background: "#f7f8f9",
    minHeight: "100vh",
    fontFamily: FONT,
    color: "#111827",
    display: "flex",
    flexDirection: "column",
  },

  // ── Sleek Dark Hero Banner ──
  heroBanner: {
    background: "#050a14",
    borderBottom: "1px solid #1f2937",
    paddingTop: "60px",
    paddingBottom: "0",
  },
  heroBannerInner: {
    maxWidth: "1160px",
    margin: "0 auto",
    padding: "24px 32px 0",
  },
  backRow: {
    marginBottom: "24px",
  },
  backBtn: {
    display: "inline-flex", alignItems: "center",
    background: "transparent", border: "none",
    color: "#9ca3af", fontSize: "14px", fontWeight: "500",
    cursor: "pointer", padding: "0",
    fontFamily: FONT, transition: "color 0.2s ease",
  },
  heroRow: {
    display: "flex", alignItems: "flex-start", gap: "20px",
    paddingBottom: "32px",
  },
  heroLogo: {
    width: "64px", height: "64px", borderRadius: "12px",
    overflow: "hidden", flexShrink: 0,
    background: "#ffffff", border: "1px solid rgba(255,255,255,0.1)",
  },
  logoImg: { width: "100%", height: "100%", objectFit: "contain" },
  logoPlaceholder: {
    width: "100%", height: "100%", display: "flex", alignItems: "center",
    justifyContent: "center", color: "#fff", fontWeight: "700",
    fontSize: "24px",
  },
  heroText: { flex: 1, minWidth: 0 },
  heroCompany: {
    color: "#9ca3af", fontSize: "15px",
    fontWeight: "500", marginBottom: "6px",
  },
  jobTitle: {
    color: "#ffffff", fontSize: "34px", fontWeight: "500",
    margin: "0 0 16px", letterSpacing: "-0.02em", lineHeight: "1.15",
  },

  // Premium Pill Tags
  tagRow: { display: "flex", flexWrap: "wrap", gap: "10px" },
  chip: {
    display: "inline-flex", alignItems: "center", gap: "6px",
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#d1d5db", borderRadius: "50px",
    padding: "6px 14px", fontSize: "13px", fontWeight: "500",
    fontFamily: FONT,
  },
  chipHighlight: {
    background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)",
    color: "#ffffff",
  },
  chipGreen: {
    background: "rgba(52,168,83,0.1)", border: "1px solid rgba(52,168,83,0.2)",
    color: "#86efac",
  },
  chipMuted: {
    background: "transparent", border: "1px solid rgba(255,255,255,0.05)",
    color: "#6b7280",
  },

  // Save button
  saveBtn: {
    display: "inline-flex", alignItems: "center", gap: "8px",
    background: "transparent", border: "1px solid #374151",
    color: "#d1d5db", borderRadius: "8px",
    padding: "10px 16px", fontSize: "14px", fontWeight: "500",
    cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
    fontFamily: FONT, transition: "all 0.2s",
  },
  saveBtnActive: {
    background: "rgba(0,88,170,0.1)", border: "1px solid rgba(0,88,170,0.3)",
    color: "#60a5fa",
  },

  // ── Body ──
  body: { flex: 1, padding: "0 32px 80px" },
  inner: { maxWidth: "1160px", margin: "0 auto" },

  // ── Layout ──
  layout: { display: "grid", gridTemplateColumns: "1fr 320px", gap: "40px", alignItems: "start", paddingTop: "40px" },
  mainCol: { display: "flex", flexDirection: "column", gap: "24px" },
  sideCol: { position: "sticky", top: "80px", display: "flex", flexDirection: "column", gap: "24px" },

  // ── Blocks — Flat, bordered, clean ──
  sectionCard: {
   padding: "32px",
  },
  sectionTitle: {
    color: "#111827", fontSize: "18px", fontWeight: "600",
    marginBottom: "20px", letterSpacing: "-0.01em",
  },
  sectionBody: { display: "flex", flexDirection: "column", gap: "12px" },
  bodyText: { color: "#374151", fontSize: "18px", lineHeight: "1.7", margin: 0, whiteSpace: "pre-wrap" },
  bulletItem: { display: "flex", alignItems: "flex-start", gap: "14px" },
  bulletDot: {
    width: "6px", height: "6px", borderRadius: "50%",
    background: "#9ca3af", flexShrink: 0, marginTop: "10px",
  },
  bulletText: { color: "#374151", fontSize: "18px", lineHeight: "1.6" },
  specialNote: {
    display: "flex", gap: "14px",
    background: "#fffbeb", border: "1px solid #fef3c7",
    borderRadius: "8px", padding: "16px 20px",
  },
  specialNoteText: { color: "#92400e", fontSize: "18px", lineHeight: "1.6", margin: 0 },

  // ── Sidebar Cards ──
  applyCard: {
    background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px",
    padding: "24px",
  },
  applyBtn: {
    width: "100%", background: "#000000", color: "#ffffff",
    border: "none", borderRadius: "8px", padding: "14px",
    fontSize: "15px", fontWeight: "500", cursor: "pointer",
    marginBottom: "12px", fontFamily: FONT, transition: "background 0.2s",
  },
  applyNote: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: "6px", color: "#6b7280", fontSize: "13px", marginBottom: "16px",
  },
  applyDivider: { height: "1px", background: "#f3f4f6", margin: "0 0 16px" },
  saveBtnLarge: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: "8px", width: "100%", background: "#f9fafb",
    border: "1px solid #e5e7eb", color: "#374151",
    borderRadius: "8px", padding: "12px", fontSize: "14px",
    fontWeight: "500", cursor: "pointer", fontFamily: FONT,
  },
  saveBtnLargeActive: { background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8" },

  // ── Sidebar Info Blocks ──
  sideBlock: {
    background: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "24px",
  },
  sideBlockTitle: {
    color: "#6b7280", fontSize: "12px", fontWeight: "600",
    textTransform: "uppercase", letterSpacing: "0.05em",
    marginBottom: "16px",
  },
  infoRow: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", gap: "12px",
    padding: "10px 0", borderBottom: "1px solid #f3f4f6", fontSize: "14px",
  },
  infoLabel: { color: "#6b7280", fontWeight: "400", flexShrink: 0 },
  infoValue: { color: "#111827", fontWeight: "500", textAlign: "right" },

  companyRow: { display: "flex", alignItems: "center", gap: "14px" },
  companyLogo: {
    width: "48px", height: "48px", borderRadius: "10px",
    overflow: "hidden", flexShrink: 0, border: "1px solid #e5e7eb",
    background: "#ffffff", padding: "4px",
  },
  companyName: { color: "#111827", fontSize: "15px", fontWeight: "600", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  viewCompanyBtn: { display: "inline-flex", alignItems: "center", color: "#4b5563", fontSize: "13px", fontWeight: "500", textDecoration: "none" },

  // ── Mobile Sticky Bottom Bar ──
  mobileStickyBar: {
    position: "fixed", bottom: 0, left: 0, right: 0,
    background: "#ffffff", borderTop: "1px solid #e5e7eb",
    padding: "16px", display: "flex", gap: "12px", zIndex: 100,
    boxShadow: "0 -4px 12px rgba(0,0,0,0.05)",
  },
  applyBtnMobile: {
    flex: 1, background: "#000000", color: "#ffffff",
    border: "none", borderRadius: "8px", padding: "14px",
    fontSize: "15px", fontWeight: "500", cursor: "pointer", fontFamily: FONT,
  },
  mobileStickySave: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: "52px", flexShrink: 0, background: "#f9fafb",
    border: "1px solid #e5e7eb", color: "#374151",
    borderRadius: "8px", cursor: "pointer",
  },
  mobileStickySaveActive: {
    background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8"
  },

  // ── Loading / empty ──
  loadingWrap: {
    maxWidth: "1160px", margin: "92px auto 28px",
    padding: "0 32px", display: "flex", flexDirection: "column", gap: "16px",
  },
  skeleton: {
    background: "linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)",
    backgroundSize: "200%", animation: "shimmer 1.5s infinite",
    borderRadius: "12px", height: "120px", border: "1px solid #e5e7eb",
  },
  emptyWrap: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "80px 24px", textAlign: "center",
  },
  emptyTitle: { color: "#111827", fontSize: "22px", fontWeight: "600", marginBottom: "8px", fontFamily: FONT },
  emptySub: { color: "#6b7280", fontSize: "15px", marginBottom: "24px", fontFamily: FONT },
  emptyBtn: {
    background: "#000000", color: "#ffffff", border: "none",
    borderRadius: "8px", padding: "12px 28px",
    fontSize: "14px", fontWeight: "500", cursor: "pointer", fontFamily: FONT,
  },
};