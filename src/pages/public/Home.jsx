import { useState, useEffect } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../../lib/firebase";

const PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal",
  "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"
];

const JOB_TYPES = ["Full-Time", "Part-Time", "Contract", "Temporary", "Internship", "Freelance"];

export default function Home() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProvince, setFilterProvince] = useState("");
  const [filterType, setFilterType] = useState("");
  const [savedJobs, setSavedJobs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("savedJobs") || "[]"); }
    catch { return []; }
  });
  const [alertEmail, setAlertEmail] = useState("");
  const [alertMsg, setAlertMsg] = useState("");

  useEffect(() => { fetchJobs(); }, [filterProvince, filterType]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      let q = query(
        collection(db, "jobs"),
        where("status", "==", "live"),
        orderBy("createdAt", "desc"),
        limit(12)
      );
      const snap = await getDocs(q);
      let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (filterProvince) results = results.filter(j => j.province === filterProvince);
      if (filterType) results = results.filter(j => j.type === filterType);
      setJobs(results);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const toggleSave = (jobId) => {
    const updated = savedJobs.includes(jobId)
      ? savedJobs.filter(id => id !== jobId)
      : [...savedJobs, jobId];
    setSavedJobs(updated);
    localStorage.setItem("savedJobs", JSON.stringify(updated));
  };

  const handleAlertSubmit = async (e) => {
    e.preventDefault();
    if (!alertEmail) return;
    try {
      const { addDoc, collection: col, serverTimestamp } = await import("firebase/firestore");
      await addDoc(col(db, "jobAlerts"), {
        email: alertEmail,
        createdAt: serverTimestamp(),
      });
      setAlertMsg("You're subscribed! We'll notify you of new jobs.");
      setAlertEmail("");
    } catch (err) {
      setAlertMsg("Something went wrong. Please try again.");
    }
  };

  return (
    <div style={s.page}>
      <Navbar />

      {/* Hero */}
      <div style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.heroTag}>South Africa's Verified Job Board</div>
          <h1 style={s.heroTitle}>Find Your Next<br /><span style={s.heroAccent}>Opportunity</span></h1>
          <p style={s.heroSub}>
            Every employer on Cronos Jobs is verified. Browse real jobs from real companies across South Africa.
          </p>
          <div style={s.heroActions}>
            <button onClick={() => navigate("/jobs")} style={s.heroBtnPrimary}>Browse All Jobs</button>
            <button onClick={() => navigate("/employer/join")} style={s.heroBtnOutline}>Post a Job →</button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={s.statsBar}>
        <div style={s.statsInner}>
          <StatItem value={jobs.length + "+"} label="Live Jobs" />
          <div style={s.statsDivider} />
          <StatItem value="100%" label="Verified Employers" />
          <div style={s.statsDivider} />
          <StatItem value="9" label="Provinces Covered" />
          <div style={s.statsDivider} />
          <StatItem value="Free" label="To Apply" />
        </div>
      </div>

      {/* Jobs Section */}
      <div style={s.section}>
        <div style={s.sectionInner}>
          <div style={s.sectionHeader}>
            <div>
              <h2 style={s.sectionTitle}>Latest Job Listings</h2>
              <p style={s.sectionSub}>Updated daily from verified South African employers</p>
            </div>
            <Link to="/jobs" style={s.viewAll}>View all jobs →</Link>
          </div>

          {/* Filters */}
          <div style={s.filters}>
            <select style={s.filterSelect} value={filterProvince} onChange={e => setFilterProvince(e.target.value)}>
              <option value="">All Provinces</option>
              {PROVINCES.map(p => <option key={p}>{p}</option>)}
            </select>
            <select style={s.filterSelect} value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">All Job Types</option>
              {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            {(filterProvince || filterType) && (
              <button style={s.clearBtn} onClick={() => { setFilterProvince(""); setFilterType(""); }}>
                Clear filters
              </button>
            )}
          </div>

          {/* Job Grid */}
          {loading ? (
            <div style={s.loadingGrid}>
              {[...Array(6)].map((_, i) => <div key={i} style={s.skeleton} />)}
            </div>
          ) : jobs.length === 0 ? (
            <div style={s.empty}>No jobs found. Try adjusting your filters.</div>
          ) : (
            <div style={s.jobGrid}>
              {jobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  saved={savedJobs.includes(job.id)}
                  onSave={() => toggleSave(job.id)}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                />
              ))}
            </div>
          )}

          <div style={s.browseMore}>
            <Link to="/jobs" style={s.heroBtnPrimary}>Browse All Jobs</Link>
          </div>
        </div>
      </div>

      {/* Job Alert Banner */}
      <div style={s.alertBanner}>
        <div style={s.alertInner}>
          <div style={s.alertText}>
            <h3 style={s.alertTitle}>Get Job Alerts</h3>
            <p style={s.alertSub}>Be the first to know when new jobs are posted</p>
          </div>
          {alertMsg ? (
            <div style={s.alertSuccess}>{alertMsg}</div>
          ) : (
            <form onSubmit={handleAlertSubmit} style={s.alertForm}>
              <input
                style={s.alertInput}
                type="email"
                value={alertEmail}
                onChange={e => setAlertEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
              <button type="submit" style={s.alertBtn}>Subscribe</button>
            </form>
          )}
        </div>
      </div>

      {/* For Employers */}
      <div style={s.employerSection}>
        <div style={s.employerInner}>
          <div style={s.employerContent}>
            <div style={s.heroTag}>For Employers</div>
            <h2 style={s.employerTitle}>Hire Verified.<br />Hire Confident.</h2>
            <p style={s.employerSub}>
              Cronos Jobs is an invite-only platform for verified South African businesses.
              Post jobs, manage applications, and find the right candidates — all in one place.
            </p>
            <div style={s.employerActions}>
              <Link to="/employer/join" style={s.heroBtnPrimary}>Apply for Access</Link>
              <Link to="/employer/login" style={s.heroBtnOutline}>Employer Login →</Link>
            </div>
          </div>
          <div style={s.employerFeatures}>
            {[
              { icon: "✓", title: "Verified Employers Only", desc: "CIPC-verified companies. No spam, no fake listings." },
              { icon: "📋", title: "Application Management", desc: "Review, shortlist and hire from your dashboard." },
              { icon: "🎯", title: "Targeted Reach", desc: "Reach job seekers across all 9 provinces." },
            ].map(f => (
              <div key={f.title} style={s.featureCard}>
                <div style={s.featureIcon}>{f.icon}</div>
                <div>
                  <div style={s.featureTitle}>{f.title}</div>
                  <div style={s.featureSub}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// ── Job Card ─────────────────────────────────────────────────────────
function JobCard({ job, saved, onSave, onClick }) {
  return (
    <div style={s.jobCard} onClick={onClick}>
      <div style={s.jobCardTop}>
        <div style={s.jobLogo}>
          {job.logoUrl
            ? <img src={job.logoUrl} alt={job.employerName} style={s.jobLogoImg} />
            : <div style={{ ...s.jobLogoPlaceholder, background: job.brandColour || "#0099fa" }}>{job.employerName?.[0]}</div>
          }
        </div>
        <button
          style={s.saveBtn}
          onClick={e => { e.stopPropagation(); onSave(); }}
          title={saved ? "Unsave" : "Save job"}
        >
          {saved ? "★" : "☆"}
        </button>
      </div>
      <div style={s.jobCardBody}>
        <div style={s.jobTitle}>{job.title}</div>
        <div style={s.jobCompany}>{job.employerName}</div>
        <div style={s.jobMeta}>
          <span style={s.jobMetaItem}>📍 {job.city}, {job.province}</span>
          <span style={s.jobMetaItem}>💼 {job.type}</span>
          {job.remote && <span style={s.jobMetaItem}>🌐 Remote</span>}
        </div>
        {job.salary && <div style={s.jobSalary}>{job.salary}</div>}
      </div>
      <div style={s.jobCardFooter}>
        <span style={s.jobCloses}>Closes {job.closes}</span>
        <span style={s.jobApplyBtn}>View Job →</span>
      </div>
    </div>
  );
}

// ── Navbar ───────────────────────────────────────────────────────────
function Navbar() {
  const navigate = useNavigate();
  return (
    <nav style={s.navbar}>
      <div style={s.navInner}>
        <div style={s.navLogo} onClick={() => navigate("/")}>
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
        <div style={s.footerTop}>
          <div style={s.footerBrand}>
            <img src="/logo.png" alt="Cronos Jobs" style={{ height: "28px", marginBottom: "10px" }} />
            <p style={s.footerTagline}>South Africa's verified job board.</p>
          </div>
          <div style={s.footerLinks}>
            <div style={s.footerCol}>
              <div style={s.footerColTitle}>Job Seekers</div>
              <Link to="/jobs" style={s.footerLink}>Browse Jobs</Link>
            </div>
            <div style={s.footerCol}>
              <div style={s.footerColTitle}>Employers</div>
              <Link to="/employer/join" style={s.footerLink}>Apply for Access</Link>
              <Link to="/employer/login" style={s.footerLink}>Employer Login</Link>
            </div>
            <div style={s.footerCol}>
              <div style={s.footerColTitle}>Legal</div>
              <Link to="/terms" style={s.footerLink}>Terms of Service</Link>
              <Link to="/privacy" style={s.footerLink}>Privacy Policy</Link>
            </div>
          </div>
        </div>
        <div style={s.footerBottom}>
          <span>© {new Date().getFullYear()} Cronos Jobs. All rights reserved.</span>
          <span>Built for South Africa 🇿🇦</span>
        </div>
      </div>
    </footer>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────
function StatItem({ value, label }) {
  return (
    <div style={s.statItem}>
      <div style={s.statValue}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

const s = {
  page: { background: "#080d1b", minHeight: "100vh", fontFamily: "sans-serif", color: "#e8edf8" },
  // Navbar
  navbar: { background: "#0d1428", borderBottom: "1px solid #1e2d52", position: "sticky", top: 0, zIndex: 100 },
  navInner: { maxWidth: "1200px", margin: "0 auto", padding: "0 32px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  navLogo: { cursor: "pointer" },
  navLogoImg: { height: "32px", objectFit: "contain" },
  navLinks: { display: "flex", alignItems: "center", gap: "24px" },
  navLink: { color: "#6b7fa3", fontSize: "14px", textDecoration: "none" },
  navLinkBtn: { background: "rgba(0,153,250,0.12)", border: "1px solid rgba(0,153,250,0.25)", color: "#0099fa", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", textDecoration: "none" },
  // Hero
  hero: { background: "linear-gradient(135deg, #080d1b 0%, #0d1a3a 50%, #080d1b 100%)", padding: "100px 32px 80px", textAlign: "center", position: "relative", overflow: "hidden" },
  heroInner: { maxWidth: "700px", margin: "0 auto", position: "relative", zIndex: 1 },
  heroTag: { display: "inline-block", background: "rgba(0,153,250,0.12)", border: "1px solid rgba(0,153,250,0.25)", color: "#0099fa", borderRadius: "20px", padding: "6px 16px", fontSize: "12px", fontWeight: "600", letterSpacing: "0.04em", marginBottom: "24px" },
  heroTitle: { fontSize: "clamp(36px, 6vw, 64px)", fontWeight: "800", lineHeight: 1.1, margin: "0 0 20px", letterSpacing: "-0.02em" },
  heroAccent: { color: "#0099fa" },
  heroSub: { color: "#6b7fa3", fontSize: "18px", lineHeight: 1.6, margin: "0 0 40px", maxWidth: "500px", marginLeft: "auto", marginRight: "auto" },
  heroActions: { display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" },
  heroBtnPrimary: { background: "#0099fa", color: "#fff", border: "none", borderRadius: "10px", padding: "14px 28px", fontSize: "15px", fontWeight: "600", cursor: "pointer", textDecoration: "none", display: "inline-block" },
  heroBtnOutline: { background: "none", color: "#e8edf8", border: "1px solid #1e2d52", borderRadius: "10px", padding: "14px 28px", fontSize: "15px", cursor: "pointer", textDecoration: "none", display: "inline-block" },
  // Stats
  statsBar: { background: "#0d1428", borderTop: "1px solid #1e2d52", borderBottom: "1px solid #1e2d52" },
  statsInner: { maxWidth: "1200px", margin: "0 auto", padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0", flexWrap: "wrap" },
  statItem: { textAlign: "center", padding: "0 48px" },
  statValue: { color: "#0099fa", fontSize: "28px", fontWeight: "800", lineHeight: 1 },
  statLabel: { color: "#6b7fa3", fontSize: "12px", marginTop: "4px" },
  statsDivider: { width: "1px", height: "40px", background: "#1e2d52" },
  // Section
  section: { padding: "80px 32px" },
  sectionInner: { maxWidth: "1200px", margin: "0 auto" },
  sectionHeader: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" },
  sectionTitle: { color: "#e8edf8", fontSize: "28px", fontWeight: "700", margin: "0 0 6px" },
  sectionSub: { color: "#6b7fa3", fontSize: "14px", margin: 0 },
  viewAll: { color: "#0099fa", fontSize: "14px", textDecoration: "none", fontWeight: "500" },
  // Filters
  filters: { display: "flex", gap: "12px", marginBottom: "32px", flexWrap: "wrap", alignItems: "center" },
  filterSelect: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "8px", padding: "10px 14px", color: "#e8edf8", fontSize: "13px", outline: "none", cursor: "pointer" },
  clearBtn: { background: "none", border: "1px solid #1e2d52", color: "#6b7fa3", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", cursor: "pointer" },
  // Job Grid
  jobGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", marginBottom: "48px" },
  loadingGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", marginBottom: "48px" },
  skeleton: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "14px", height: "200px", animation: "pulse 1.5s ease-in-out infinite" },
  // Job Card
  jobCard: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "14px", padding: "20px", cursor: "pointer", transition: "border-color 0.15s, transform 0.15s", display: "flex", flexDirection: "column", gap: "12px" },
  jobCardTop: { display: "flex", alignItems: "flex-start", justifyContent: "space-between" },
  jobLogo: { width: "44px", height: "44px", borderRadius: "10px", overflow: "hidden", flexShrink: 0 },
  jobLogoImg: { width: "100%", height: "100%", objectFit: "contain" },
  jobLogoPlaceholder: { width: "44px", height: "44px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "700", fontSize: "18px" },
  saveBtn: { background: "none", border: "none", color: "#f5a623", fontSize: "20px", cursor: "pointer", padding: "0", lineHeight: 1 },
  jobCardBody: { flex: 1 },
  jobTitle: { color: "#e8edf8", fontSize: "16px", fontWeight: "600", marginBottom: "4px" },
  jobCompany: { color: "#6b7fa3", fontSize: "13px", marginBottom: "10px" },
  jobMeta: { display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "8px" },
  jobMetaItem: { color: "#3d4f73", fontSize: "12px" },
  jobSalary: { color: "#00e5a0", fontSize: "13px", fontWeight: "500" },
  jobCardFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #1e2d52", paddingTop: "12px" },
  jobCloses: { color: "#3d4f73", fontSize: "12px" },
  jobApplyBtn: { color: "#0099fa", fontSize: "13px", fontWeight: "500" },
  browseMore: { textAlign: "center" },
  // Alert Banner
  alertBanner: { background: "linear-gradient(135deg, #0d1a3a, #0d1428)", borderTop: "1px solid #1e2d52", borderBottom: "1px solid #1e2d52", padding: "60px 32px" },
  alertInner: { maxWidth: "700px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "32px", flexWrap: "wrap" },
  alertText: { flex: 1 },
  alertTitle: { color: "#e8edf8", fontSize: "22px", fontWeight: "700", margin: "0 0 6px" },
  alertSub: { color: "#6b7fa3", fontSize: "14px", margin: 0 },
  alertForm: { display: "flex", gap: "10px", flexWrap: "wrap" },
  alertInput: { background: "#131b33", border: "1px solid #1e2d52", borderRadius: "8px", padding: "11px 16px", color: "#e8edf8", fontSize: "14px", outline: "none", minWidth: "240px" },
  alertBtn: { background: "#0099fa", color: "#fff", border: "none", borderRadius: "8px", padding: "11px 20px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  alertSuccess: { color: "#00e5a0", fontSize: "14px" },
  // Employer Section
  employerSection: { padding: "80px 32px", background: "#080d1b" },
  employerInner: { maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" },
  employerContent: {},
  employerTitle: { color: "#e8edf8", fontSize: "36px", fontWeight: "800", margin: "16px 0 16px", lineHeight: 1.2, letterSpacing: "-0.02em" },
  employerSub: { color: "#6b7fa3", fontSize: "15px", lineHeight: 1.7, margin: "0 0 32px" },
  employerActions: { display: "flex", gap: "14px", flexWrap: "wrap" },
  employerFeatures: { display: "flex", flexDirection: "column", gap: "16px" },
  featureCard: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "12px", padding: "20px", display: "flex", alignItems: "flex-start", gap: "16px" },
  featureIcon: { width: "36px", height: "36px", borderRadius: "8px", background: "rgba(0,153,250,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 },
  featureTitle: { color: "#e8edf8", fontSize: "14px", fontWeight: "600", marginBottom: "4px" },
  featureSub: { color: "#6b7fa3", fontSize: "13px", lineHeight: 1.5 },
  // Footer
  footer: { background: "#0d1428", borderTop: "1px solid #1e2d52", padding: "60px 32px 32px" },
  footerInner: { maxWidth: "1200px", margin: "0 auto" },
  footerTop: { display: "flex", justifyContent: "space-between", gap: "48px", marginBottom: "48px", flexWrap: "wrap" },
  footerBrand: { maxWidth: "220px" },
  footerTagline: { color: "#3d4f73", fontSize: "13px", lineHeight: 1.6, margin: 0 },
  footerLinks: { display: "flex", gap: "48px", flexWrap: "wrap" },
  footerCol: { display: "flex", flexDirection: "column", gap: "10px" },
  footerColTitle: { color: "#e8edf8", fontSize: "13px", fontWeight: "600", marginBottom: "4px" },
  footerLink: { color: "#3d4f73", fontSize: "13px", textDecoration: "none" },
  footerBottom: { borderTop: "1px solid #1e2d52", paddingTop: "24px", display: "flex", justifyContent: "space-between", color: "#3d4f73", fontSize: "12px", flexWrap: "wrap", gap: "8px" },
  empty: { color: "#6b7fa3", textAlign: "center", padding: "60px 0" },
};