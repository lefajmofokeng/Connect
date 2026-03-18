import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { db } from "../../lib/firebase";

const PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal",
  "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"
];

const JOB_TYPES = ["Full-Time", "Part-Time", "Contract", "Temporary", "Internship", "Freelance"];

const PAGE_SIZE = 10;

export default function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterProvince, setFilterProvince] = useState("");
  const [filterType, setFilterType] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [savedJobs, setSavedJobs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("savedJobs") || "[]"); }
    catch { return []; }
  });

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, "jobs"), where("status", "==", "live"), orderBy("createdAt", "desc"))
      );
      setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const toggleSave = (jobId, e) => {
    e.stopPropagation();
    const updated = savedJobs.includes(jobId)
      ? savedJobs.filter(id => id !== jobId)
      : [...savedJobs, jobId];
    setSavedJobs(updated);
    localStorage.setItem("savedJobs", JSON.stringify(updated));
  };

  const filtered = jobs.filter(j => {
    const term = search.toLowerCase();
    const matchSearch = !term ||
      j.title?.toLowerCase().includes(term) ||
      j.employerName?.toLowerCase().includes(term) ||
      j.city?.toLowerCase().includes(term) ||
      j.department?.toLowerCase().includes(term);
    const matchProvince = !filterProvince || j.province === filterProvince;
    const matchType = !filterType || j.type === filterType;
    return matchSearch && matchProvince && matchType;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
    setSelected(null);
  };

  return (
    <div style={s.page}>
      <Navbar />

      <div style={s.body}>
        {/* Sidebar filters */}
        <div style={s.filterSidebar}>
          <div style={s.filterTitle}>Filter Jobs</div>

          <div style={s.filterGroup}>
            <label style={s.filterLabel}>Search</label>
            <input
              style={s.filterInput}
              value={search}
              onChange={handleFilter(setSearch)}
              placeholder="Title, company, city..."
            />
          </div>

          <div style={s.filterGroup}>
            <label style={s.filterLabel}>Province</label>
            <select style={s.filterInput} value={filterProvince} onChange={handleFilter(setFilterProvince)}>
              <option value="">All Provinces</option>
              {PROVINCES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          <div style={s.filterGroup}>
            <label style={s.filterLabel}>Job Type</label>
            <select style={s.filterInput} value={filterType} onChange={handleFilter(setFilterType)}>
              <option value="">All Types</option>
              {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {(search || filterProvince || filterType) && (
            <button style={s.clearBtn} onClick={() => { setSearch(""); setFilterProvince(""); setFilterType(""); setPage(1); }}>
              Clear all filters
            </button>
          )}

          <div style={s.resultsCount}>
            {filtered.length} job{filtered.length !== 1 ? "s" : ""} found
          </div>
        </div>

        {/* Main content */}
        <div style={s.main}>
          <div style={s.mainHeader}>
            <h1 style={s.pageTitle}>Browse Jobs</h1>
            <p style={s.pageSub}>Verified employers across South Africa</p>
          </div>

          <div style={s.layout}>
            {/* Job list */}
            <div style={s.listCol}>
              {loading ? (
                <div style={s.empty}>Loading jobs...</div>
              ) : paginated.length === 0 ? (
                <div style={s.empty}>No jobs match your search.</div>
              ) : (
                <>
                  {paginated.map(job => (
                    <div
                      key={job.id}
                      style={{ ...s.jobRow, ...(selected?.id === job.id ? s.jobRowActive : {}) }}
                      onClick={() => setSelected(job)}
                    >
                      <div style={s.jobRowLeft}>
                        <div style={s.jobLogo}>
                          {job.logoUrl
                            ? <img src={job.logoUrl} alt={job.employerName} style={s.jobLogoImg} />
                            : <div style={{ ...s.jobLogoPlaceholder, background: job.brandColour || "#0099fa" }}>{job.employerName?.[0]}</div>
                          }
                        </div>
                        <div style={s.jobInfo}>
                          <div style={s.jobTitle}>{job.title}</div>
                          <div style={s.jobCompany}>{job.employerName}</div>
                          <div style={s.jobMeta}>
                            <span>📍 {job.city}, {job.province}</span>
                            <span>💼 {job.type}</span>
                            {job.remote && <span>🌐 Remote</span>}
                            {job.salary && <span>💰 {job.salary}</span>}
                          </div>
                        </div>
                      </div>
                      <div style={s.jobRowRight}>
                        <button
                          style={s.saveBtn}
                          onClick={e => toggleSave(job.id, e)}
                        >
                          {savedJobs.includes(job.id) ? "★" : "☆"}
                        </button>
                        <div style={s.jobCloses}>Closes {job.closes}</div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div style={s.pagination}>
                      <button
                        style={s.pageBtn}
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                      >← Prev</button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          style={{ ...s.pageBtn, ...(page === i + 1 ? s.pageBtnActive : {}) }}
                          onClick={() => setPage(i + 1)}
                        >{i + 1}</button>
                      ))}
                      <button
                        style={s.pageBtn}
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                      >Next →</button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Detail panel */}
            <div style={s.detailCol}>
              {!selected ? (
                <div style={s.detailEmpty}>
                  <div style={s.detailEmptyIcon}>💼</div>
                  <p>Select a job to see details</p>
                </div>
              ) : (
                <div style={s.detailCard}>
                  {/* Company header */}
                  <div style={{ ...s.detailBanner, background: (selected.brandColour || "#0099fa") + "18" }}>
                    <div style={s.detailLogo}>
                      {selected.logoUrl
                        ? <img src={selected.logoUrl} alt={selected.employerName} style={s.detailLogoImg} />
                        : <div style={{ ...s.detailLogoPlaceholder, background: selected.brandColour || "#0099fa" }}>{selected.employerName?.[0]}</div>
                      }
                    </div>
                    <div style={s.detailCompany}>{selected.employerName}</div>
                  </div>

                  <div style={s.detailBody}>
                    <h2 style={s.detailTitle}>{selected.title}</h2>

                    <div style={s.detailTags}>
                      <Tag icon="📍" value={`${selected.city}, ${selected.province}`} />
                      <Tag icon="💼" value={selected.type} />
                      {selected.department && <Tag icon="🏢" value={selected.department} />}
                      {selected.salary && <Tag icon="💰" value={selected.salary} color="#00e5a0" />}
                      {selected.remote && <Tag icon="🌐" value="Remote / Hybrid" />}
                      <Tag icon="📅" value={`Closes ${selected.closes}`} />
                    </div>

                    {selected.description && (
                      <div style={s.detailSection}>
                        <div style={s.detailSectionTitle}>About the Role</div>
                        <p style={s.detailText}>{selected.description}</p>
                      </div>
                    )}

                    {selected.responsibilities?.length > 0 && (
                      <div style={s.detailSection}>
                        <div style={s.detailSectionTitle}>Responsibilities</div>
                        {selected.responsibilities.map((r, i) => (
                          <div key={i} style={s.bullet}>• {r}</div>
                        ))}
                      </div>
                    )}

                    {selected.requirements?.length > 0 && (
                      <div style={s.detailSection}>
                        <div style={s.detailSectionTitle}>Requirements</div>
                        {selected.requirements.map((r, i) => (
                          <div key={i} style={s.bullet}>• {r}</div>
                        ))}
                      </div>
                    )}

                    <div style={s.detailActions}>
                      <button
                        style={s.applyBtn}
                        onClick={() => navigate(`/apply/${selected.id}`)}
                      >
                        Apply Now
                      </button>
                      <button
                        style={s.fullBtn}
                        onClick={() => navigate(`/jobs/${selected.id}`)}
                      >
                        Full Details →
                      </button>
                    </div>
                  </div>
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
        <div style={s.navLogo} onClick={() => navigate("/")}>
          <img src="/logo.png" alt="Cronos Jobs" style={s.navLogoImg} />
        </div>
        <div style={s.navLinks}>
          <Link to="/jobs" style={{ ...s.navLink, color: "#0099fa" }}>Browse Jobs</Link>
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

const s = {
  page: { background: "#080d1b", minHeight: "100vh", fontFamily: "sans-serif", color: "#e8edf8", display: "flex", flexDirection: "column" },
  navbar: { background: "#0d1428", borderBottom: "1px solid #1e2d52", position: "sticky", top: 0, zIndex: 100 },
  navInner: { maxWidth: "1400px", margin: "0 auto", padding: "0 32px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  navLogo: { cursor: "pointer" },
  navLogoImg: { height: "32px", objectFit: "contain" },
  navLinks: { display: "flex", alignItems: "center", gap: "24px" },
  navLink: { color: "#6b7fa3", fontSize: "14px", textDecoration: "none" },
  navLinkBtn: { background: "rgba(0,153,250,0.12)", border: "1px solid rgba(0,153,250,0.25)", color: "#0099fa", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", textDecoration: "none" },
  body: { display: "flex", flex: 1, maxWidth: "1400px", margin: "0 auto", width: "100%", padding: "0 32px" },
  filterSidebar: { width: "240px", flexShrink: 0, padding: "32px 24px 32px 0", borderRight: "1px solid #1e2d52" },
  filterTitle: { color: "#e8edf8", fontSize: "15px", fontWeight: "600", marginBottom: "24px" },
  filterGroup: { marginBottom: "20px" },
  filterLabel: { color: "#6b7fa3", fontSize: "12px", fontWeight: "500", display: "block", marginBottom: "8px" },
  filterInput: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "8px", padding: "9px 12px", color: "#e8edf8", fontSize: "13px", outline: "none", width: "100%", fontFamily: "sans-serif" },
  clearBtn: { background: "none", border: "1px solid #1e2d52", color: "#6b7fa3", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", cursor: "pointer", width: "100%", marginBottom: "16px" },
  resultsCount: { color: "#3d4f73", fontSize: "12px" },
  main: { flex: 1, padding: "32px 0 32px 32px" },
  mainHeader: { marginBottom: "24px" },
  pageTitle: { color: "#e8edf8", fontSize: "24px", fontWeight: "700", margin: "0 0 4px" },
  pageSub: { color: "#6b7fa3", fontSize: "14px", margin: 0 },
  layout: { display: "grid", gridTemplateColumns: "1fr 400px", gap: "24px", alignItems: "start" },
  listCol: { display: "flex", flexDirection: "column", gap: "10px" },
  jobRow: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "12px", padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", transition: "border-color 0.15s" },
  jobRowActive: { borderColor: "#0099fa", background: "rgba(0,153,250,0.05)" },
  jobRowLeft: { display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 },
  jobLogo: { width: "44px", height: "44px", borderRadius: "10px", overflow: "hidden", flexShrink: 0 },
  jobLogoImg: { width: "100%", height: "100%", objectFit: "contain" },
  jobLogoPlaceholder: { width: "44px", height: "44px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "700", fontSize: "18px" },
  jobInfo: { flex: 1, minWidth: 0 },
  jobTitle: { color: "#e8edf8", fontSize: "15px", fontWeight: "600", marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  jobCompany: { color: "#6b7fa3", fontSize: "13px", marginBottom: "6px" },
  jobMeta: { display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "12px", color: "#3d4f73" },
  jobRowRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", flexShrink: 0 },
  saveBtn: { background: "none", border: "none", color: "#f5a623", fontSize: "18px", cursor: "pointer", padding: 0, lineHeight: 1 },
  jobCloses: { color: "#3d4f73", fontSize: "11px", whiteSpace: "nowrap" },
  pagination: { display: "flex", gap: "6px", justifyContent: "center", marginTop: "24px", flexWrap: "wrap" },
  pageBtn: { background: "#0d1428", border: "1px solid #1e2d52", color: "#6b7fa3", borderRadius: "6px", padding: "7px 12px", fontSize: "13px", cursor: "pointer" },
  pageBtnActive: { background: "rgba(0,153,250,0.12)", borderColor: "#0099fa", color: "#0099fa" },
  detailCol: { position: "sticky", top: "80px", maxHeight: "calc(100vh - 120px)", overflowY: "auto" },
  detailEmpty: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "12px", padding: "60px 24px", textAlign: "center", color: "#3d4f73", fontSize: "14px" },
  detailEmptyIcon: { fontSize: "32px", marginBottom: "12px" },
  detailCard: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "12px", overflow: "hidden" },
  detailBanner: { padding: "24px", display: "flex", alignItems: "center", gap: "14px", borderBottom: "1px solid #1e2d52" },
  detailLogo: { width: "48px", height: "48px", borderRadius: "10px", overflow: "hidden", flexShrink: 0 },
  detailLogoImg: { width: "100%", height: "100%", objectFit: "contain" },
  detailLogoPlaceholder: { width: "48px", height: "48px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "700", fontSize: "20px" },
  detailCompany: { color: "#6b7fa3", fontSize: "14px", fontWeight: "500" },
  detailBody: { padding: "24px" },
  detailTitle: { color: "#e8edf8", fontSize: "20px", fontWeight: "700", margin: "0 0 16px" },
  detailTags: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" },
  tag: { display: "flex", alignItems: "center", gap: "6px", background: "#131b33", border: "1px solid #1e2d52", borderRadius: "6px", padding: "5px 10px", fontSize: "12px", color: "#6b7fa3" },
  detailSection: { marginBottom: "20px" },
  detailSectionTitle: { color: "#0099fa", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" },
  detailText: { color: "#6b7fa3", fontSize: "13px", lineHeight: "1.7", margin: 0 },
  bullet: { color: "#6b7fa3", fontSize: "13px", lineHeight: "1.8" },
  detailActions: { display: "flex", gap: "10px", marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #1e2d52" },
  applyBtn: { flex: 1, background: "#0099fa", color: "#fff", border: "none", borderRadius: "8px", padding: "12px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  fullBtn: { background: "none", border: "1px solid #1e2d52", color: "#6b7fa3", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", cursor: "pointer" },
  empty: { color: "#6b7fa3", textAlign: "center", padding: "60px 0" },
  footer: { background: "#0d1428", borderTop: "1px solid #1e2d52", padding: "24px 32px" },
  footerInner: { maxWidth: "1400px", margin: "0 auto" },
  footerBottom: { display: "flex", justifyContent: "space-between", color: "#3d4f73", fontSize: "12px", flexWrap: "wrap", gap: "8px" },
  footerLink: { color: "#3d4f73", textDecoration: "none" },
};