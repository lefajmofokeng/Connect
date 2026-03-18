import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db } from "../../lib/firebase";

export default function CompanyPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [employer, setEmployer] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [slug]);

  const fetchData = async () => {
    try {
      const empSnap = await getDocs(
        query(collection(db, "employers"), where("slug", "==", slug))
      );
      if (!empSnap.empty) {
        const empDoc = { id: empSnap.docs[0].id, ...empSnap.docs[0].data() };
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
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (loading) return (
    <div style={s.page}><Navbar /><div style={s.empty}>Loading...</div></div>
  );

  if (!employer) return (
    <div style={s.page}>
      <Navbar />
      <div style={s.empty}>
        <div style={s.emptyIcon}>🏢</div>
        <p>Company not found.</p>
        <button onClick={() => navigate("/jobs")} style={s.btnPrimary}>Browse Jobs</button>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <Navbar />

      {/* Hero banner */}
      <div style={{ ...s.hero, background: `linear-gradient(135deg, ${employer.brandColour || "#0099fa"}22, #080d1b)` }}>
        <div style={s.heroInner}>
          <div style={s.heroLogo}>
            {employer.logoUrl
              ? <img src={employer.logoUrl} alt={employer.companyName} style={s.logoImg} />
              : <div style={{ ...s.logoPlaceholder, background: employer.brandColour || "#0099fa" }}>{employer.companyName?.[0]}</div>
            }
          </div>
          <div style={s.heroInfo}>
            <h1 style={s.companyName}>{employer.companyName}</h1>
            <div style={s.companyMeta}>
              {employer.industry && <span style={s.metaTag}>🏭 {employer.industry}</span>}
              {employer.companySize && <span style={s.metaTag}>👥 {employer.companySize} employees</span>}
              {employer.province && <span style={s.metaTag}>📍 {employer.city ? `${employer.city}, ` : ""}{employer.province}</span>}
            </div>
            <div style={s.heroLinks}>
              {employer.website && (
                <a href={employer.website} target="_blank" rel="noreferrer" style={{ ...s.heroLink, color: employer.brandColour || "#0099fa" }}>
                  🌐 Website
                </a>
              )}
              {employer.linkedin && (
                <a href={employer.linkedin} target="_blank" rel="noreferrer" style={{ ...s.heroLink, color: employer.brandColour || "#0099fa" }}>
                  💼 LinkedIn
                </a>
              )}
            </div>
          </div>
          <div style={s.heroJobCount}>
            <div style={{ ...s.jobCountNum, color: employer.brandColour || "#0099fa" }}>{jobs.length}</div>
            <div style={s.jobCountLabel}>Open Position{jobs.length !== 1 ? "s" : ""}</div>
          </div>
        </div>
      </div>

      <div style={s.body}>
        <div style={s.inner}>
          <div style={s.layout}>
            {/* Main */}
            <div style={s.mainCol}>
              {/* About */}
              {employer.about && (
                <div style={s.card}>
                  <div style={s.cardTitle}>About {employer.companyName}</div>
                  <p style={s.aboutText}>{employer.about}</p>
                </div>
              )}

              {/* Jobs */}
              <div style={s.card}>
                <div style={s.cardTitle}>
                  Open Positions
                  <span style={s.jobCountBadge}>{jobs.length}</span>
                </div>
                {jobs.length === 0 ? (
                  <div style={s.noJobs}>No open positions at the moment. Check back soon.</div>
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
                            <span>📍 {job.city}, {job.province}</span>
                            <span>💼 {job.type}</span>
                            {job.department && <span>🏢 {job.department}</span>}
                            {job.remote && <span>🌐 Remote</span>}
                            {job.salary && <span style={{ color: "#00e5a0" }}>💰 {job.salary}</span>}
                          </div>
                        </div>
                        <div style={s.jobRowRight}>
                          <div style={s.jobCloses}>Closes {job.closes}</div>
                          <button
                            style={{ ...s.applyBtn, background: employer.brandColour || "#0099fa" }}
                            onClick={e => { e.stopPropagation(); navigate(`/apply/${job.id}`); }}
                          >
                            Apply
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
              <div style={s.infoCard}>
                <div style={s.infoCardTitle}>Company Details</div>
                <InfoRow label="Industry" value={employer.industry} />
                <InfoRow label="Company Size" value={employer.companySize} />
                <InfoRow label="Province" value={employer.province} />
                <InfoRow label="City" value={employer.city} />
                {employer.website && (
                  <div style={s.infoRow}>
                    <span style={s.infoLabel}>Website</span>
                    <a href={employer.website} target="_blank" rel="noreferrer" style={{ ...s.infoValue, color: employer.brandColour || "#0099fa", textDecoration: "none" }}>
                      Visit →
                    </a>
                  </div>
                )}
              </div>

              {jobs.length > 0 && (
                <div style={s.ctaCard}>
                  <div style={s.ctaTitle}>Interested in working here?</div>
                  <p style={s.ctaSub}>Browse all open positions and apply directly.</p>
                  <button
                    style={{ ...s.ctaBtn, background: employer.brandColour || "#0099fa" }}
                    onClick={() => document.getElementById("jobs-section")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    View {jobs.length} Open Job{jobs.length !== 1 ? "s" : ""}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// ── Navbar ───────────────────────────────────────────────────────────
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
          <Link to="/employer/join" style={s.navLink}>For Employers</Link>
          <Link to="/employer/login" style={s.navLinkBtn}>Employer Login</Link>
        </div>
      </div>
    </nav>
  );
}

// ── Footer ───────────────────────────────────────────────────────────
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

// ── Helpers ──────────────────────────────────────────────────────────
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
  page: { background: "#080d1b", minHeight: "100vh", fontFamily: "sans-serif", color: "#e8edf8", display: "flex", flexDirection: "column" },
  navbar: { background: "#0d1428", borderBottom: "1px solid #1e2d52", position: "sticky", top: 0, zIndex: 100 },
  navInner: { maxWidth: "1200px", margin: "0 auto", padding: "0 32px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  navLogo: { cursor: "pointer" },
  navLogoImg: { height: "32px", objectFit: "contain" },
  navLinks: { display: "flex", alignItems: "center", gap: "24px" },
  navLink: { color: "#6b7fa3", fontSize: "14px", textDecoration: "none" },
  navLinkBtn: { background: "rgba(0,153,250,0.12)", border: "1px solid rgba(0,153,250,0.25)", color: "#0099fa", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", textDecoration: "none" },
  hero: { padding: "60px 32px", borderBottom: "1px solid #1e2d52" },
  heroInner: { maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", gap: "32px", flexWrap: "wrap" },
  heroLogo: { width: "96px", height: "96px", borderRadius: "20px", overflow: "hidden", border: "1px solid #1e2d52", background: "#0d1428", flexShrink: 0 },
  logoImg: { width: "100%", height: "100%", objectFit: "contain" },
  logoPlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "800", fontSize: "40px" },
  heroInfo: { flex: 1 },
  companyName: { color: "#e8edf8", fontSize: "32px", fontWeight: "800", margin: "0 0 10px", letterSpacing: "-0.02em" },
  companyMeta: { display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "14px" },
  metaTag: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "6px", padding: "5px 12px", fontSize: "13px", color: "#6b7fa3" },
  heroLinks: { display: "flex", gap: "16px" },
  heroLink: { fontSize: "14px", textDecoration: "none", fontWeight: "500" },
  heroJobCount: { textAlign: "center", background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "14px", padding: "20px 32px" },
  jobCountNum: { fontSize: "40px", fontWeight: "800", lineHeight: 1 },
  jobCountLabel: { color: "#6b7fa3", fontSize: "13px", marginTop: "4px" },
  body: { flex: 1, padding: "40px 32px" },
  inner: { maxWidth: "1200px", margin: "0 auto" },
  layout: { display: "grid", gridTemplateColumns: "1fr 300px", gap: "32px", alignItems: "start" },
  mainCol: { display: "flex", flexDirection: "column", gap: "20px" },
  card: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "14px", padding: "28px" },
  cardTitle: { color: "#e8edf8", fontSize: "16px", fontWeight: "600", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" },
  aboutText: { color: "#6b7fa3", fontSize: "14px", lineHeight: "1.8", margin: 0, whiteSpace: "pre-wrap" },
  jobCountBadge: { background: "rgba(0,153,250,0.12)", color: "#0099fa", borderRadius: "20px", padding: "2px 10px", fontSize: "12px", fontWeight: "600" },
  noJobs: { color: "#3d4f73", fontSize: "14px", textAlign: "center", padding: "32px 0" },
  jobsList: { display: "flex", flexDirection: "column", gap: "12px" },
  jobRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", background: "#131b33", border: "1px solid #1e2d52", borderRadius: "10px", padding: "16px 20px", cursor: "pointer", transition: "border-color 0.15s" },
  jobInfo: { flex: 1 },
  jobTitle: { color: "#e8edf8", fontSize: "15px", fontWeight: "600", marginBottom: "6px" },
  jobMeta: { display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "12px", color: "#3d4f73" },
  jobRowRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", flexShrink: 0 },
  jobCloses: { color: "#3d4f73", fontSize: "11px" },
  applyBtn: { color: "#fff", border: "none", borderRadius: "6px", padding: "7px 16px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
  sideCol: { position: "sticky", top: "80px", display: "flex", flexDirection: "column", gap: "16px" },
  infoCard: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "14px", padding: "24px" },
  infoCardTitle: { color: "#e8edf8", fontSize: "14px", fontWeight: "600", marginBottom: "16px" },
  infoRow: { display: "flex", justifyContent: "space-between", gap: "12px", padding: "8px 0", borderBottom: "1px solid #131b33", fontSize: "13px" },
  infoLabel: { color: "#6b7fa3" },
  infoValue: { color: "#e8edf8", textAlign: "right" },
  ctaCard: { background: "linear-gradient(135deg, #0d1a3a, #0d1428)", border: "1px solid rgba(0,153,250,0.2)", borderRadius: "14px", padding: "24px", textAlign: "center" },
  ctaTitle: { color: "#e8edf8", fontSize: "15px", fontWeight: "700", marginBottom: "8px" },
  ctaSub: { color: "#6b7fa3", fontSize: "13px", lineHeight: "1.6", marginBottom: "16px" },
  ctaBtn: { color: "#fff", border: "none", borderRadius: "8px", padding: "11px 20px", fontSize: "14px", fontWeight: "600", cursor: "pointer", width: "100%" },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "16px", color: "#3d4f73", fontSize: "16px", padding: "80px" },
  emptyIcon: { fontSize: "48px" },
  btnPrimary: { background: "#0099fa", color: "#fff", border: "none", borderRadius: "8px", padding: "12px 24px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  footer: { background: "#0d1428", borderTop: "1px solid #1e2d52", padding: "24px 32px" },
  footerInner: { maxWidth: "1200px", margin: "0 auto" },
  footerBottom: { display: "flex", justifyContent: "space-between", color: "#3d4f73", fontSize: "12px", flexWrap: "wrap", gap: "8px" },
  footerLink: { color: "#3d4f73", textDecoration: "none" },
};