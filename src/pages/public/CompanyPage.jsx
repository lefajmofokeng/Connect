import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function CompanyPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, jobSeekerProfile } = useAuth();
  const [employer, setEmployer] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [slug]);

  const fetchData = async () => {
    try {
      let empDoc = null;
      const empSnap = await getDocs(
        query(collection(db, "employers"), where("slug", "==", slug))
      );
      if (!empSnap.empty) {
        empDoc = { id: empSnap.docs[0].id, ...empSnap.docs[0].data() };
      } else {
        try {
          const directSnap = await getDoc(doc(db, "employers", slug));
          if (directSnap.exists()) empDoc = { id: directSnap.id, ...directSnap.data() };
        } catch (e) { console.error("Direct lookup failed:", e); }
      }
      if (empDoc) {
        setEmployer(empDoc);
        const jobSnap = await getDocs(
          query(collection(db, "jobs"), where("employerId", "==", empDoc.id), where("status", "==", "live"))
        );
        setJobs(jobSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const accent = employer?.brandColour || "#1a73e8";

  // ── Loading skeleton ──
  if (loading) return (
    <div style={s.page}>
      <Navbar />
      <div style={s.loadingWrap}>
        <div style={{ ...s.skeleton, height: 160 }} />
        <div style={s.loadingBody}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
            <div style={{ ...s.skeleton, height: 140 }} />
            <div style={{ ...s.skeleton, height: 220 }} />
          </div>
          <div style={{ width: 280, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ ...s.skeleton, height: 180 }} />
          </div>
        </div>
      </div>
    </div>
  );

  // ── Not found ──
  if (!employer) return (
    <div style={s.page}>
      <Navbar />
      <div style={s.emptyWrap}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dadce0" strokeWidth="1.5" style={{ marginBottom: 16 }}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <div style={s.emptyTitle}>Company not found</div>
        <div style={s.emptySub}>This company page may not exist or has been removed.</div>
        <button style={s.emptyBtn} onClick={() => navigate("/jobs")}>Browse All Jobs</button>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <Navbar />

      {/* ── Hero banner ── */}
      <div style={{ ...s.hero, background: `${accent}0d`, borderBottom: `3px solid ${accent}` }}>
        <div style={s.heroInner}>

          {/* Logo */}
          <div style={s.heroLogo}>
            {employer.logoUrl
              ? <img src={employer.logoUrl} alt={employer.companyName} style={s.logoImg} />
              : <div style={{ ...s.logoPlaceholder, background: accent }}>{employer.companyName?.[0]}</div>
            }
          </div>

          {/* Info */}
          <div style={s.heroInfo}>
            <h1 style={s.companyName}>{employer.companyName}</h1>

            <div style={s.companyMeta}>
              {employer.industry && (
                <span style={s.metaTag}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  {employer.industry}
                </span>
              )}
              {employer.companySize && (
                <span style={s.metaTag}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  {employer.companySize} employees
                </span>
              )}
              {employer.province && (
                <span style={s.metaTag}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {employer.city ? `${employer.city}, ` : ""}{employer.province}
                </span>
              )}
            </div>

            <div style={s.heroLinks}>
              {employer.website && (
                <a href={employer.website} target="_blank" rel="noreferrer" style={{ ...s.heroLink, color: accent, borderColor: `${accent}40` }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  Website
                </a>
              )}
              {employer.linkedin && (
                <a href={employer.linkedin} target="_blank" rel="noreferrer" style={{ ...s.heroLink, color: accent, borderColor: `${accent}40` }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                  LinkedIn
                </a>
              )}
            </div>
          </div>

          {/* Open positions count */}
          <div style={{ ...s.heroJobCount, borderColor: `${accent}30`, background: "#ffffff" }}>
            <div style={{ ...s.jobCountNum, color: accent }}>{jobs.length}</div>
            <div style={s.jobCountLabel}>Open Position{jobs.length !== 1 ? "s" : ""}</div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={s.body}>
        <div style={s.inner}>
          <div style={s.layout}>

            {/* Main column */}
            <div style={s.mainCol}>

              {/* About */}
              {employer.about && (
                <div style={s.card}>
                  <div style={s.cardTitle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    About {employer.companyName}
                  </div>
                  <p style={s.aboutText}>{employer.about}</p>
                </div>
              )}

              {/* Open Positions */}
              <div style={s.card}>
                <div style={s.cardTitle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  Open Positions
                  <span style={{ ...s.countBadge, background: `${accent}14`, color: accent }}>{jobs.length}</span>
                </div>

                {jobs.length === 0 ? (
                  <div style={s.noJobs}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dadce0" strokeWidth="1.5" style={{ marginBottom: 10 }}>
                      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                    </svg>
                    <div>No open positions at the moment. Check back soon.</div>
                  </div>
                ) : (
                  <div style={s.jobsList}>
                    {jobs.map(job => (
                      <div
                        key={job.id}
                        style={s.jobRow}
                        onClick={() => navigate(`/jobs/${job.id}`)}
                      >
                        <div style={s.jobInfo}>
                          <div style={s.jobTitle}>{job.title}</div>
                          <div style={s.jobMeta}>
                            <span style={s.jobMetaItem}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                              {job.city}, {job.province}
                            </span>
                            <span style={s.jobMetaItem}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                              {job.type}
                            </span>
                            {job.department && (
                              <span style={s.jobMetaItem}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                                {job.department}
                              </span>
                            )}
                            {job.remote && <span style={s.remoteBadge}>Remote</span>}
                          </div>
                        </div>
                        <div style={s.jobRowRight}>
                          <span style={s.jobCloses}>Closes {job.closes}</span>
                          <button
                            style={{ ...s.applyBtn, background: accent }}
                            onClick={e => { e.stopPropagation(); navigate(`/apply/${job.id}`); }}
                          >
                            Apply Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div style={s.sideCol}>

              {/* Company details */}
              <div style={s.sideCard}>
                <div style={s.sideCardTitle}>Company Details</div>
                <InfoRow label="Industry"      value={employer.industry} />
                <InfoRow label="Company Size"  value={employer.companySize ? `${employer.companySize} employees` : null} />
                <InfoRow label="Province"      value={employer.province} />
                <InfoRow label="City"          value={employer.city} />
                {employer.website && (
                  <div style={s.infoRow}>
                    <span style={s.infoLabel}>Website</span>
                    <a href={employer.website} target="_blank" rel="noreferrer"
                      style={{ color: accent, textDecoration: "none", fontSize: "13px", fontWeight: "600" }}>
                      Visit →
                    </a>
                  </div>
                )}
              </div>

              {/* CTA card */}
              {jobs.length > 0 && (
                <div style={{ ...s.ctaCard, borderColor: `${accent}30` }}>
                  <div style={{ ...s.ctaIconWrap, background: `${accent}14`, color: accent }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  </div>
                  <div style={s.ctaTitle}>Interested in working here?</div>
                  <p style={s.ctaSub}>Browse all open positions and apply directly — it's free.</p>
                  <button
                    style={{ ...s.ctaBtn, background: accent }}
                    onClick={() => document.querySelector(".jobs-list-anchor")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    View {jobs.length} Open Job{jobs.length !== 1 ? "s" : ""}
                  </button>
                </div>
              )}

              {/* Verified badge */}
              <div style={s.verifiedCard}>
                <div style={s.verifiedRow}>
                  <div style={s.verifiedIconWrap}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d652d" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <div>
                    <div style={s.verifiedTitle}>Verified Employer</div>
                    <div style={s.verifiedSub}>CIPC registered and verified by Vetted</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @media (max-width: 900px) { .cp-layout{grid-template-columns:1fr!important} .cp-side{position:static!important} }
        @media (max-width: 768px) {
          .cp-hero-inner{flex-direction:column!important;align-items:flex-start!important;gap:16px!important}
          .cp-job-row{flex-direction:column!important;align-items:flex-start!important;gap:12px!important}
          .cp-job-row-right{width:100%!important;flex-direction:row!important;justify-content:space-between!important;align-items:center!important}
        }
        .cp-job-row:hover{border-color:#1a73e8!important;background:#f8fbff!important}
      `}</style>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={s.infoRow}>
      <span style={s.infoLabel}>{label}</span>
      <span style={s.infoValue}>{value}</span>
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

  // ── Hero ── brand-colour top border, very light tint bg
  hero: { padding: "40px 24px", paddingTop: "104px", borderBottom: "1px solid #e3e3e3" },
  heroInner: { maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" },
  heroLogo: { width: "88px", height: "88px", borderRadius: "12px", overflow: "hidden", border: "1px solid #e3e3e3", background: "#ffffff", flexShrink: 0, boxShadow: "0 1px 3px rgba(60,64,67,0.1)" },
  logoImg: { width: "100%", height: "100%", objectFit: "contain" },
  logoPlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontWeight: "700", fontSize: "36px" },
  heroInfo: { flex: 1, minWidth: 0 },
  companyName: { color: "#202124", fontSize: "28px", fontWeight: "600", margin: "0 0 10px", letterSpacing: "-0.5px" },
  companyMeta: { display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" },
  metaTag: { display: "inline-flex", alignItems: "center", gap: "5px", background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "4px", padding: "4px 10px", fontSize: "12px", color: "#5f6368", fontWeight: "500" },
  heroLinks: { display: "flex", gap: "8px", flexWrap: "wrap" },
  heroLink: { display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600", textDecoration: "none", padding: "6px 12px", borderRadius: "4px", background: "#ffffff", border: "1px solid" },
  heroJobCount: { textAlign: "center", border: "1px solid #e3e3e3", borderRadius: "8px", padding: "16px 28px", boxShadow: "0 1px 2px rgba(60,64,67,0.06)", flexShrink: 0 },
  jobCountNum: { fontSize: "36px", fontWeight: "600", lineHeight: 1, letterSpacing: "-1px" },
  jobCountLabel: { color: "#5f6368", fontSize: "12px", fontWeight: "500", marginTop: "4px" },

  // ── Body ──
  body: { flex: 1, padding: "28px 24px 64px", paddingTop: "92px" },
  inner: { maxWidth: "1200px", margin: "0 auto" },
  layout: { display: "grid", gridTemplateColumns: "1fr 272px", gap: "20px", alignItems: "start" },
  mainCol: { display: "flex", flexDirection: "column", gap: "16px" },
  sideCol: { position: "sticky", top: "80px", display: "flex", flexDirection: "column", gap: "12px" },

  // ── Main cards ──
  card: { background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "8px", padding: "24px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.06)" },
  cardTitle: { color: "#202124", fontSize: "15px", fontWeight: "600", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" },
  aboutText: { color: "#3c4043", fontSize: "14px", lineHeight: "1.8", margin: 0, whiteSpace: "pre-wrap" },
  countBadge: { borderRadius: "4px", padding: "2px 8px", fontSize: "12px", fontWeight: "600" },

  // ── Jobs list ──
  noJobs: { display: "flex", flexDirection: "column", alignItems: "center", color: "#9aa0a6", fontSize: "14px", textAlign: "center", padding: "32px 0", gap: "8px" },
  jobsList: { display: "flex", flexDirection: "column", gap: "8px" },
  jobRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", background: "#f8f9fa", border: "1px solid #e3e3e3", borderRadius: "8px", padding: "14px 18px", cursor: "pointer", transition: "all 0.15s" },
  jobInfo: { flex: 1, minWidth: 0 },
  jobTitle: { color: "#202124", fontSize: "14px", fontWeight: "600", marginBottom: "6px" },
  jobMeta: { display: "flex", flexWrap: "wrap", gap: "10px" },
  jobMetaItem: { display: "inline-flex", alignItems: "center", gap: "4px", color: "#5f6368", fontSize: "12px", fontWeight: "500" },
  remoteBadge: { background: "#e6f4ea", color: "#0d652d", borderRadius: "4px", padding: "2px 8px", fontSize: "11px", fontWeight: "600" },
  jobRowRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", flexShrink: 0 },
  jobCloses: { color: "#9aa0a6", fontSize: "11px", fontWeight: "500" },
  applyBtn: { color: "#ffffff", border: "none", borderRadius: "4px", padding: "7px 16px", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", boxShadow: "0 1px 2px rgba(0,0,0,0.08)" },

  // ── Sidebar cards ──
  sideCard: { background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "8px", padding: "18px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.06)" },
  sideCardTitle: { color: "#202124", fontSize: "13px", fontWeight: "700", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.4px" },
  infoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "8px 0", borderBottom: "1px solid #f1f3f4", fontSize: "13px" },
  infoLabel: { color: "#5f6368", fontWeight: "500" },
  infoValue: { color: "#202124", fontWeight: "500", textAlign: "right", fontSize: "13px" },

  ctaCard: { background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "8px", padding: "18px", textAlign: "center", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.06)" },
  ctaIconWrap: { width: "44px", height: "44px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" },
  ctaTitle: { color: "#202124", fontSize: "13px", fontWeight: "600", marginBottom: "6px" },
  ctaSub: { color: "#5f6368", fontSize: "12px", lineHeight: "1.6", marginBottom: "14px" },
  ctaBtn: { color: "#ffffff", border: "none", borderRadius: "4px", padding: "10px 18px", fontSize: "13px", fontWeight: "600", cursor: "pointer", width: "100%", fontFamily: "inherit", boxShadow: "0 1px 2px rgba(0,0,0,0.08)" },

  verifiedCard: { background: "#e6f4ea", border: "1px solid #ceead6", borderRadius: "8px", padding: "14px 16px" },
  verifiedRow: { display: "flex", alignItems: "flex-start", gap: "10px" },
  verifiedIconWrap: { width: "28px", height: "28px", borderRadius: "50%", background: "#ffffff", border: "1px solid #ceead6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  verifiedTitle: { color: "#0d652d", fontSize: "13px", fontWeight: "600", marginBottom: "2px" },
  verifiedSub: { color: "#5f6368", fontSize: "12px", lineHeight: "1.4" },

  // ── States ──
  loadingWrap: { maxWidth: "1200px", margin: "28px auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: "16px" },
  loadingBody: { display: "flex", gap: "20px" },
  skeleton: { background: "linear-gradient(90deg,#f1f3f4 25%,#e8eaed 50%,#f1f3f4 75%)", backgroundSize: "200%", animation: "shimmer 1.5s infinite", borderRadius: "8px" },
  emptyWrap: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center" },
  emptyTitle: { color: "#202124", fontSize: "20px", fontWeight: "600", marginBottom: "8px", letterSpacing: "-0.3px" },
  emptySub: { color: "#5f6368", fontSize: "14px", marginBottom: "24px" },
  emptyBtn: { background: "#1a73e8", color: "#ffffff", border: "none", borderRadius: "4px", padding: "10px 24px", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },

  // ── Footer ──
};