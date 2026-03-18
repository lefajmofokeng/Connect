import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db } from "../../lib/firebase";

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchJob();
    const savedJobs = JSON.parse(localStorage.getItem("savedJobs") || "[]");
    setSaved(savedJobs.includes(id));
  }, [id]);

  const fetchJob = async () => {
    try {
      const snap = await getDoc(doc(db, "jobs", id));
      if (snap.exists()) setJob({ id: snap.id, ...snap.data() });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const toggleSave = () => {
    const savedJobs = JSON.parse(localStorage.getItem("savedJobs") || "[]");
    const updated = saved
      ? savedJobs.filter(sid => sid !== id)
      : [...savedJobs, id];
    localStorage.setItem("savedJobs", JSON.stringify(updated));
    setSaved(!saved);
  };

  if (loading) return (
    <div style={s.page}>
      <Navbar />
      <div style={s.empty}>Loading job...</div>
    </div>
  );

  if (!job) return (
    <div style={s.page}>
      <Navbar />
      <div style={s.empty}>Job not found.</div>
    </div>
  );

  return (
    <div style={s.page}>
      <Navbar />

      <div style={s.body}>
        <div style={s.inner}>
          {/* Back */}
          <button onClick={() => navigate("/jobs")} style={s.backBtn}>← Back to Jobs</button>

          <div style={s.layout}>
            {/* Main */}
            <div style={s.mainCol}>
              {/* Header card */}
              <div style={s.headerCard}>
                <div style={{ ...s.headerBanner, background: (job.brandColour || "#0099fa") + "18" }}>
                  <div style={s.headerLogo}>
                    {job.logoUrl
                      ? <img src={job.logoUrl} alt={job.employerName} style={s.logoImg} />
                      : <div style={{ ...s.logoPlaceholder, background: job.brandColour || "#0099fa" }}>{job.employerName?.[0]}</div>
                    }
                  </div>
                  <div style={s.headerInfo}>
                    <h1 style={s.jobTitle}>{job.title}</h1>
                    <div style={s.jobCompany}>{job.employerName}</div>
                  </div>
                  <button onClick={toggleSave} style={s.saveBtn}>
                    {saved ? "★ Saved" : "☆ Save"}
                  </button>
                </div>

                <div style={s.tagRow}>
                  <Tag icon="📍" value={`${job.city}, ${job.province}`} />
                  <Tag icon="💼" value={job.type} />
                  {job.department && <Tag icon="🏢" value={job.department} />}
                  {job.salary && <Tag icon="💰" value={job.salary} color="#00e5a0" />}
                  {job.remote && <Tag icon="🌐" value="Remote / Hybrid" />}
                  <Tag icon="📅" value={`Closes ${job.closes}`} />
                </div>
              </div>

              {/* Description */}
              {job.description && (
                <div style={s.card}>
                  <div style={s.cardTitle}>About the Role</div>
                  <p style={s.bodyText}>{job.description}</p>
                </div>
              )}

              {/* Responsibilities */}
              {job.responsibilities?.length > 0 && (
                <div style={s.card}>
                  <div style={s.cardTitle}>Responsibilities</div>
                  <ul style={s.bulletList}>
                    {job.responsibilities.map((r, i) => (
                      <li key={i} style={s.bulletItem}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {job.requirements?.length > 0 && (
                <div style={s.card}>
                  <div style={s.cardTitle}>Requirements</div>
                  <ul style={s.bulletList}>
                    {job.requirements.map((r, i) => (
                      <li key={i} style={s.bulletItem}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div style={s.sideCol}>
              {/* Apply card */}
              <div style={s.applyCard}>
                <div style={s.applyTitle}>Ready to Apply?</div>
                <p style={s.applySub}>Submit your application directly to {job.employerName}.</p>
                <button
                  style={s.applyBtn}
                  onClick={() => navigate(`/apply/${job.id}`)}
                >
                  Apply Now
                </button>
                <div style={s.applyNote}>Free to apply · No account required</div>
              </div>

              {/* Job summary */}
              <div style={s.summaryCard}>
                <div style={s.summaryTitle}>Job Summary</div>
                <InfoRow label="Job Type" value={job.type} />
                <InfoRow label="Department" value={job.department} />
                <InfoRow label="Province" value={job.province} />
                <InfoRow label="City" value={job.city} />
                <InfoRow label="Remote" value={job.remote ? "Yes" : "No"} />
                {job.salary && <InfoRow label="Salary" value={job.salary} />}
                <InfoRow label="Closing Date" value={job.closes} />
              </div>

              {/* Company card */}
              <div style={s.summaryCard}>
                <div style={s.summaryTitle}>About the Employer</div>
                <div style={s.companyRow}>
                  <div style={s.companyLogo}>
                    {job.logoUrl
                      ? <img src={job.logoUrl} alt={job.employerName} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      : <div style={{ ...s.logoPlaceholder, background: job.brandColour || "#0099fa", width: "100%", height: "100%" }}>{job.employerName?.[0]}</div>
                    }
                  </div>
                  <div style={s.companyName}>{job.employerName}</div>
                </div>
                <Link
                to={`/company/${job.employerSlug || job.employerId}`}
                style={s.viewCompanyBtn}
                >
                View Company Page →
                </Link>
              </div>
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
function Tag({ icon, value, color }) {
  return (
    <div style={{ ...s.tag, ...(color ? { color, borderColor: color + "44" } : {}) }}>
      <span>{icon}</span><span>{value}</span>
    </div>
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
  page: { background: "#080d1b", minHeight: "100vh", fontFamily: "sans-serif", color: "#e8edf8", display: "flex", flexDirection: "column" },
  navbar: { background: "#0d1428", borderBottom: "1px solid #1e2d52", position: "sticky", top: 0, zIndex: 100 },
  navInner: { maxWidth: "1200px", margin: "0 auto", padding: "0 32px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  navLogo: { cursor: "pointer" },
  navLogoImg: { height: "32px", objectFit: "contain" },
  navLinks: { display: "flex", alignItems: "center", gap: "24px" },
  navLink: { color: "#6b7fa3", fontSize: "14px", textDecoration: "none" },
  navLinkBtn: { background: "rgba(0,153,250,0.12)", border: "1px solid rgba(0,153,250,0.25)", color: "#0099fa", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", textDecoration: "none" },
  body: { flex: 1, padding: "40px 32px" },
  inner: { maxWidth: "1200px", margin: "0 auto" },
  backBtn: { background: "none", border: "none", color: "#6b7fa3", fontSize: "14px", cursor: "pointer", padding: "0 0 24px", display: "block" },
  layout: { display: "grid", gridTemplateColumns: "1fr 340px", gap: "32px", alignItems: "start" },
  mainCol: { display: "flex", flexDirection: "column", gap: "20px" },
  headerCard: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "14px", overflow: "hidden" },
  headerBanner: { padding: "28px", display: "flex", alignItems: "center", gap: "16px", borderBottom: "1px solid #1e2d52", flexWrap: "wrap" },
  headerLogo: { width: "60px", height: "60px", borderRadius: "12px", overflow: "hidden", flexShrink: 0 },
  logoImg: { width: "100%", height: "100%", objectFit: "contain" },
  logoPlaceholder: { width: "60px", height: "60px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "700", fontSize: "24px" },
  headerInfo: { flex: 1 },
  jobTitle: { color: "#e8edf8", fontSize: "24px", fontWeight: "700", margin: "0 0 4px" },
  jobCompany: { color: "#6b7fa3", fontSize: "15px" },
  saveBtn: { background: "none", border: "1px solid #1e2d52", color: "#f5a623", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", cursor: "pointer" },
  tagRow: { display: "flex", flexWrap: "wrap", gap: "8px", padding: "16px 28px" },
  tag: { display: "flex", alignItems: "center", gap: "6px", background: "#131b33", border: "1px solid #1e2d52", borderRadius: "6px", padding: "5px 10px", fontSize: "12px", color: "#6b7fa3" },
  card: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "14px", padding: "28px" },
  cardTitle: { color: "#0099fa", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" },
  bodyText: { color: "#6b7fa3", fontSize: "14px", lineHeight: "1.8", margin: 0, whiteSpace: "pre-wrap" },
  bulletList: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" },
  bulletItem: { color: "#6b7fa3", fontSize: "14px", lineHeight: "1.6", paddingLeft: "16px", position: "relative" },
  sideCol: { position: "sticky", top: "80px", display: "flex", flexDirection: "column", gap: "16px" },
  applyCard: { background: "linear-gradient(135deg, #0d1a3a, #0d1428)", border: "1px solid rgba(0,153,250,0.25)", borderRadius: "14px", padding: "28px", textAlign: "center" },
  applyTitle: { color: "#e8edf8", fontSize: "18px", fontWeight: "700", marginBottom: "8px" },
  applySub: { color: "#6b7fa3", fontSize: "13px", lineHeight: "1.6", marginBottom: "20px" },
  applyBtn: { width: "100%", background: "#0099fa", color: "#fff", border: "none", borderRadius: "10px", padding: "14px", fontSize: "15px", fontWeight: "600", cursor: "pointer", marginBottom: "12px" },
  applyNote: { color: "#3d4f73", fontSize: "12px" },
  summaryCard: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "14px", padding: "24px" },
  summaryTitle: { color: "#e8edf8", fontSize: "14px", fontWeight: "600", marginBottom: "16px" },
  infoRow: { display: "flex", justifyContent: "space-between", gap: "12px", padding: "8px 0", borderBottom: "1px solid #131b33", fontSize: "13px" },
  infoLabel: { color: "#6b7fa3" },
  infoValue: { color: "#e8edf8", textAlign: "right" },
  companyRow: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" },
  companyLogo: { width: "40px", height: "40px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, border: "1px solid #1e2d52" },
  companyName: { color: "#e8edf8", fontSize: "14px", fontWeight: "600" },
  viewCompanyBtn: { display: "block", color: "#0099fa", fontSize: "13px", textDecoration: "none", fontWeight: "500" },
  empty: { color: "#6b7fa3", textAlign: "center", padding: "80px", fontSize: "16px" },
  footer: { background: "#0d1428", borderTop: "1px solid #1e2d52", padding: "24px 32px" },
  footerInner: { maxWidth: "1200px", margin: "0 auto" },
  footerBottom: { display: "flex", justifyContent: "space-between", color: "#3d4f73", fontSize: "12px", flexWrap: "wrap", gap: "8px" },
  footerLink: { color: "#3d4f73", textDecoration: "none" },
};