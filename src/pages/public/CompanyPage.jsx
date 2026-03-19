import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";

export default function CompanyPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, jobSeekerProfile } = useAuth();
  const [employer, setEmployer] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { fetchData(); }, [slug]);

  const fetchData = async () => {
    try {
      let empDoc = null;

      // Try by slug first
      const empSnap = await getDocs(
        query(collection(db, "employers"), where("slug", "==", slug))
      );

      if (!empSnap.empty) {
        empDoc = { id: empSnap.docs[0].id, ...empSnap.docs[0].data() };
      } else {
        // Fallback to direct uid lookup
        try {
          const directSnap = await getDoc(doc(db, "employers", slug));
          if (directSnap.exists()) {
            empDoc = { id: directSnap.id, ...directSnap.data() };
          }
        } catch (e) { console.error("Direct lookup failed:", e); }
      }

      if (empDoc) {
        setEmployer(empDoc);
        const jobSnap = await getDocs(
          query(
            collection(db, "jobs"),
            where("employerId", "==", empDoc.id),
            where("status", "==", "live")
          )
        );
        setJobs(jobSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const isJobSeeker = user && jobSeekerProfile;
  const jsPhoto = jobSeekerProfile?.photoUrl || null;
  const jsInitials = jobSeekerProfile?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || null;
  const accent = employer?.brandColour || "#1a73e8";

  if (loading) return (
    <div style={s.page}>
      <Navbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} navigate={navigate} isJobSeeker={isJobSeeker} jsPhoto={jsPhoto} jsInitials={jsInitials} />
      <div style={s.loadingWrap}>
        <div style={{ ...s.skeleton, height: 180 }} />
        <div style={s.loadingBody}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
            <div style={{ ...s.skeleton, height: 160 }} />
            <div style={{ ...s.skeleton, height: 240 }} />
          </div>
          <div style={{ width: 280, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ ...s.skeleton, height: 200 }} />
          </div>
        </div>
      </div>
    </div>
  );

  if (!employer) return (
    <div style={s.page}>
      <Navbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} navigate={navigate} isJobSeeker={isJobSeeker} jsPhoto={jsPhoto} jsInitials={jsInitials} />
      <div style={s.emptyWrap}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#dadce0" strokeWidth="1.5" style={{ marginBottom: 16 }}>
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
      <Navbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} navigate={navigate} isJobSeeker={isJobSeeker} jsPhoto={jsPhoto} jsInitials={jsInitials} />

      {/* ── Hero Banner ── */}
      <div style={{ ...s.hero, background: `linear-gradient(135deg, ${accent}14 0%, #f8f9fa 100%)`, borderBottom: `1px solid ${accent}22` }}>
        <div style={s.heroInner}>
          <div style={s.heroLogo}>
            {employer.logoUrl
              ? <img src={employer.logoUrl} alt={employer.companyName} style={s.logoImg} />
              : <div style={{ ...s.logoPlaceholder, background: accent }}>{employer.companyName?.[0]}</div>
            }
          </div>

          <div style={s.heroInfo}>
            <h1 style={s.companyName}>{employer.companyName}</h1>
            <div style={s.companyMeta}>
              {employer.industry && (
                <span style={s.metaTag}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  {employer.industry}
                </span>
              )}
              {employer.companySize && (
                <span style={s.metaTag}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  {employer.companySize} employees
                </span>
              )}
              {employer.province && (
                <span style={s.metaTag}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {employer.city ? `${employer.city}, ` : ""}{employer.province}
                </span>
              )}
            </div>
            <div style={s.heroLinks}>
              {employer.website && (
                <a href={employer.website} target="_blank" rel="noreferrer" style={{ ...s.heroLink, color: accent }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  Website
                </a>
              )}
              {employer.linkedin && (
                <a href={employer.linkedin} target="_blank" rel="noreferrer" style={{ ...s.heroLink, color: accent }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                  LinkedIn
                </a>
              )}
            </div>
          </div>

          <div style={{ ...s.heroJobCount, borderColor: `${accent}30` }}>
            <div style={{ ...s.jobCountNum, color: accent }}>{jobs.length}</div>
            <div style={s.jobCountLabel}>Open Position{jobs.length !== 1 ? "s" : ""}</div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={s.body}>
        <div style={s.inner}>
          <div style={s.layout}>

            {/* ── Main Column ── */}
            <div style={s.mainCol}>

              {/* About */}
              {employer.about && (
                <div style={s.card}>
                  <div style={s.cardTitle}>About {employer.companyName}</div>
                  <p style={s.aboutText}>{employer.about}</p>
                </div>
              )}

              {/* Open Positions */}
              <div style={s.card}>
                <div style={s.cardTitle}>
                  Open Positions
                  <span style={{ ...s.countBadge, background: `${accent}14`, color: accent }}>{jobs.length}</span>
                </div>

                {jobs.length === 0 ? (
                  <div style={s.noJobs}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#dadce0" strokeWidth="1.5" style={{ marginBottom: 10 }}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                    <div>No open positions at the moment. Check back soon.</div>
                  </div>
                ) : (
                  <div style={s.jobsList}>
                    {jobs.map(job => (
                      <div
                        key={job.id}
                        style={s.jobRow}
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="job-row-hover"
                      >
                        <div style={s.jobInfo}>
                          <div style={s.jobTitle}>{job.title}</div>
                          <div style={s.jobMeta}>
                            <span style={s.jobMetaItem}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                              {job.city}, {job.province}
                            </span>
                            <span style={s.jobMetaItem}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                              {job.type}
                            </span>
                            {job.department && (
                              <span style={s.jobMetaItem}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
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

            {/* ── Sidebar ── */}
            <div style={s.sideCol}>

              {/* Company Details */}
              <div style={s.infoCard}>
                <div style={s.infoCardTitle}>Company Details</div>
                <InfoRow label="Industry" value={employer.industry} />
                <InfoRow label="Company Size" value={employer.companySize ? `${employer.companySize} employees` : null} />
                <InfoRow label="Province" value={employer.province} />
                <InfoRow label="City" value={employer.city} />
                {employer.website && (
                  <div style={s.infoRow}>
                    <span style={s.infoLabel}>Website</span>
                    <a href={employer.website} target="_blank" rel="noreferrer" style={{ ...s.infoValue, color: accent, textDecoration: "none", fontWeight: "500" }}>
                      Visit →
                    </a>
                  </div>
                )}
              </div>

              {/* CTA Card */}
              {jobs.length > 0 && (
                <div style={{ ...s.ctaCard, borderColor: `${accent}25` }}>
                  <div style={{ ...s.ctaIcon, background: `${accent}14`, color: accent }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
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

              {/* Verified Badge */}
              <div style={s.verifiedCard}>
                <div style={s.verifiedRow}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e8e3e" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  <div>
                    <div style={s.verifiedTitle}>Verified Employer</div>
                    <div style={s.verifiedSub}>CIPC registered and verified by Cronos Jobs</div>
                  </div>
                </div>
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
            <Link to="/jobs" style={s.footerLink}>Browse Jobs</Link>
            <Link to="/terms" style={s.footerLink}>Terms</Link>
            <Link to="/privacy" style={s.footerLink}>Privacy</Link>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 900px) {
          .company-layout { grid-template-columns: 1fr !important; }
          .side-col { position: static !important; }
        }
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .menu-toggle { display: flex !important; }
          .hero-inner { flex-direction: column !important; align-items: flex-start !important; gap: 20px !important; }
          .hero-job-count { align-self: flex-start !important; }
          .company-body { padding: 20px 16px 48px !important; }
          .hero { padding: 32px 16px !important; }
          .job-row { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .job-row-right { width: 100% !important; flex-direction: row !important; justify-content: space-between !important; align-items: center !important; }
        }
        @media (max-width: 480px) {
          .company-name { font-size: 24px !important; }
        }
        .job-row-hover:hover { border-color: #1a73e8 !important; box-shadow: 0 2px 8px rgba(26,115,232,0.1) !important; }
        .nav-link:hover { background: #f1f3f4 !important; color: #202124 !important; }
      `}</style>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────

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

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={s.infoRow}>
      <span style={s.infoLabel}>{label}</span>
      <span style={s.infoValue}>{value}</span>
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

  // Hero
  hero: { padding: "52px 24px", borderBottom: "1px solid #e0e0e0" },
  heroInner: { maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", gap: "28px", flexWrap: "wrap" },
  heroLogo: { width: "96px", height: "96px", borderRadius: "18px", overflow: "hidden", border: "1px solid #e0e0e0", background: "#fff", flexShrink: 0, boxShadow: "0 2px 8px rgba(60,64,67,0.1)" },
  logoImg: { width: "100%", height: "100%", objectFit: "contain" },
  logoPlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "800", fontSize: "40px" },
  heroInfo: { flex: 1, minWidth: 0 },
  companyName: { color: "#202124", fontSize: "32px", fontWeight: "800", margin: "0 0 10px", letterSpacing: "-0.02em" },
  companyMeta: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" },
  metaTag: { display: "inline-flex", alignItems: "center", gap: "5px", background: "#fff", border: "1px solid #e0e0e0", borderRadius: "999px", padding: "5px 12px", fontSize: "13px", color: "#5f6368", boxShadow: "0 1px 2px rgba(60,64,67,0.06)" },
  heroLinks: { display: "flex", gap: "14px", flexWrap: "wrap" },
  heroLink: { display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px", textDecoration: "none", fontWeight: "500", padding: "6px 14px", borderRadius: "8px", background: "#fff", border: "1px solid #e0e0e0" },
  heroJobCount: { textAlign: "center", background: "#fff", border: "1px solid #e0e0e0", borderRadius: "14px", padding: "20px 32px", boxShadow: "0 1px 3px rgba(60,64,67,0.08)", flexShrink: 0 },
  jobCountNum: { fontSize: "40px", fontWeight: "800", lineHeight: 1 },
  jobCountLabel: { color: "#5f6368", fontSize: "13px", marginTop: "6px" },

  // Body
  body: { flex: 1, padding: "32px 24px 64px" },
  inner: { maxWidth: "1200px", margin: "0 auto" },
  layout: { display: "grid", gridTemplateColumns: "1fr 280px", gap: "24px", alignItems: "start" },
  mainCol: { display: "flex", flexDirection: "column", gap: "16px" },
  sideCol: { position: "sticky", top: "80px", display: "flex", flexDirection: "column", gap: "14px" },

  // Cards
  card: { background: "#fff", border: "1px solid #e0e0e0", borderRadius: "14px", padding: "24px", boxShadow: "0 1px 3px rgba(60,64,67,0.06)" },
  cardTitle: { color: "#202124", fontSize: "18px", fontWeight: "700", marginBottom: "18px", display: "flex", alignItems: "center", gap: "10px" },
  aboutText: { color: "#3c4043", fontSize: "15px", lineHeight: "1.8", margin: 0, whiteSpace: "pre-wrap" },
  countBadge: { borderRadius: "999px", padding: "2px 10px", fontSize: "13px", fontWeight: "600" },

  // Jobs list
  noJobs: { display: "flex", flexDirection: "column", alignItems: "center", color: "#80868b", fontSize: "15px", textAlign: "center", padding: "40px 0", gap: "8px" },
  jobsList: { display: "flex", flexDirection: "column", gap: "10px" },
  jobRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", background: "#f8f9fa", border: "1px solid #e0e0e0", borderRadius: "10px", padding: "16px 20px", cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s" },
  jobInfo: { flex: 1, minWidth: 0 },
  jobTitle: { color: "#202124", fontSize: "16px", fontWeight: "600", marginBottom: "6px" },
  jobMeta: { display: "flex", flexWrap: "wrap", gap: "12px" },
  jobMetaItem: { display: "inline-flex", alignItems: "center", gap: "5px", color: "#5f6368", fontSize: "13px" },
  remoteBadge: { background: "#e6f4ea", color: "#1e8e3e", borderRadius: "999px", padding: "2px 10px", fontSize: "12px", fontWeight: "500" },
  jobRowRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", flexShrink: 0 },
  jobCloses: { color: "#80868b", fontSize: "12px" },
  applyBtn: { color: "#fff", border: "none", borderRadius: "8px", padding: "8px 18px", fontSize: "13px", fontWeight: "500", cursor: "pointer", fontFamily: "'Circular Std', sans-serif", whiteSpace: "nowrap" },

  // Sidebar
  infoCard: { background: "#fff", border: "1px solid #e0e0e0", borderRadius: "14px", padding: "20px", boxShadow: "0 1px 3px rgba(60,64,67,0.06)" },
  infoCardTitle: { color: "#202124", fontSize: "15px", fontWeight: "700", marginBottom: "14px" },
  infoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "9px 0", borderBottom: "1px solid #f1f3f4", fontSize: "14px" },
  infoLabel: { color: "#5f6368" },
  infoValue: { color: "#202124", fontWeight: "500", textAlign: "right" },

  ctaCard: { background: "#fff", border: "1px solid #e0e0e0", borderRadius: "14px", padding: "20px", textAlign: "center", boxShadow: "0 1px 3px rgba(60,64,67,0.06)" },
  ctaIcon: { width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" },
  ctaTitle: { color: "#202124", fontSize: "15px", fontWeight: "700", marginBottom: "6px" },
  ctaSub: { color: "#5f6368", fontSize: "13px", lineHeight: "1.6", marginBottom: "16px" },
  ctaBtn: { color: "#fff", border: "none", borderRadius: "8px", padding: "11px 20px", fontSize: "14px", fontWeight: "500", cursor: "pointer", width: "100%", fontFamily: "'Circular Std', sans-serif" },

  verifiedCard: { background: "#e6f4ea", border: "1px solid rgba(30,142,62,0.2)", borderRadius: "14px", padding: "16px 18px" },
  verifiedRow: { display: "flex", alignItems: "flex-start", gap: "12px" },
  verifiedTitle: { color: "#1e8e3e", fontSize: "14px", fontWeight: "600", marginBottom: "3px" },
  verifiedSub: { color: "#5f6368", fontSize: "12px", lineHeight: "1.5" },

  // States
  loadingWrap: { maxWidth: "1200px", margin: "32px auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: "16px" },
  loadingBody: { display: "flex", gap: "24px" },
  skeleton: { background: "linear-gradient(90deg,#f1f3f4 25%,#e8eaed 50%,#f1f3f4 75%)", backgroundSize: "200%", animation: "shimmer 1.5s infinite", borderRadius: "14px", height: "80px" },
  emptyWrap: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center" },
  emptyTitle: { color: "#202124", fontSize: "22px", fontWeight: "700", marginBottom: "8px" },
  emptySub: { color: "#5f6368", fontSize: "16px", marginBottom: "24px" },
  emptyBtn: { background: "#1a73e8", color: "#fff", border: "none", borderRadius: "8px", padding: "12px 28px", fontSize: "15px", fontWeight: "500", cursor: "pointer", fontFamily: "'Circular Std', sans-serif" },

  // Footer
  footer: { background: "#202124", padding: "24px" },
  footerInner: { maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", color: "rgba(255,255,255,0.3)", fontSize: "13px" },
  footerLink: { color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: "13px" },
};