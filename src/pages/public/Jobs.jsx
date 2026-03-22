import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { toggleSavedJob, getLocalSavedJobs } from "../../lib/savedJobs";

const PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal",
  "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"
];

const JOB_TYPES = ["Full-Time", "Part-Time", "Contract", "Temporary", "Internship", "Freelance"];

const INDUSTRIES = [
  "Agriculture", "Automotive", "Construction", "Education", "Energy",
  "Finance & Banking", "Healthcare", "Hospitality", "IT & Technology",
  "Legal", "Logistics & Transport", "Manufacturing", "Media & Marketing",
  "Mining", "NGO & Non-Profit", "Real Estate", "Retail", "Telecommunications", "Other"
];

const PAGE_SIZE = 10;

export default function Jobs() {
  const navigate = useNavigate();
  const { user, jobSeekerProfile } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterProvince, setFilterProvince] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [savedJobs, setSavedJobs] = useState(getLocalSavedJobs);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  useEffect(() => { fetchJobs(); }, [sortBy]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const order = sortBy === "oldest" ? "asc" : "desc";
      const snap = await getDocs(
        query(collection(db, "jobs"), where("status", "==", "live"), orderBy("createdAt", order))
      );
      setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleFilterChange = (setter) => (val) => {
    setter(val);
    setPage(1);
  };

  const toggleSave = async (jobId) => {
    await toggleSavedJob(jobId, user);
    setSavedJobs(getLocalSavedJobs());
  };

  const filtered = jobs.filter(j => {
    const term = search.toLowerCase();
    const matchSearch = !term ||
      j.title?.toLowerCase().includes(term) ||
      j.employerName?.toLowerCase().includes(term) ||
      j.city?.toLowerCase().includes(term) ||
      j.department?.toLowerCase().includes(term) ||
      j.requirements?.some(r => r.toLowerCase().includes(term));
    const matchProvince = !filterProvince || j.province === filterProvince;
    const matchType = !filterType || j.type === filterType;
    const matchIndustry = !filterIndustry || j.industry === filterIndustry || j.department === filterIndustry;
    return matchSearch && matchProvince && matchType && matchIndustry;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const clearFilters = () => {
    setSearch(""); setFilterProvince(""); setFilterType(""); setFilterIndustry(""); setPage(1);
  };

  const hasFilters = search || filterProvince || filterType || filterIndustry;
  const activeFilterCount = [filterProvince, filterType, filterIndustry].filter(Boolean).length + (search ? 1 : 0);

  const isJobSeeker = user && jobSeekerProfile;
  const jsPhoto = jobSeekerProfile?.photoUrl || null;
  const jsInitials = jobSeekerProfile?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || null;

  return (
    <div className="jobs-page" style={s.page}>

      {/* ── White Navbar ── */}
      <nav style={s.navbar}>
        <div style={s.navInner}>
          <div style={s.navLogo} onClick={() => navigate("/")}>
            <div style={s.logoMark}>V</div>
            <span style={s.logoText}>Vetted</span>
          </div>
          <div style={s.navLinks} className="nav-links">
            <Link to="/jobs" className="nav-link" style={{ ...s.navLink, color: "#1a73e8", fontWeight: "500" }}>Browse Jobs</Link>
            <Link to="/employer/join" className="nav-link" style={s.navLink}>For Employers</Link>
            {isJobSeeker ? (
              <div style={s.navAvatar} onClick={() => navigate("/jobseeker/dashboard")} title="My Profile">
                {jsPhoto ? <img src={jsPhoto} alt="" style={s.navAvatarImg} /> : <div style={s.navAvatarInitials}>{jsInitials}</div>}
              </div>
            ) : (
              <Link to="/jobseeker/login" className="nav-link" style={s.navSignIn}>Sign In</Link>
            )}
            <Link to="/employer/login" style={s.navBtn}>Employer Login</Link>
          </div>
          <button style={s.menuToggle} className="menu-toggle" onClick={() => setMenuOpen(o => !o)}>
            {menuOpen
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#202124" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#202124" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            }
          </button>
        </div>
        {menuOpen && (
          <div style={s.mobileMenu}>
            <Link to="/jobs" style={{ ...s.mobileLink, color: "#1a73e8", fontWeight: "500" }} onClick={() => setMenuOpen(false)}>Browse Jobs</Link>
            <Link to="/employer/join" style={s.mobileLink} onClick={() => setMenuOpen(false)}>For Employers</Link>
            {isJobSeeker
              ? <Link to="/jobseeker/dashboard" style={s.mobileLink} onClick={() => setMenuOpen(false)}>My Profile</Link>
              : <Link to="/jobseeker/login" style={s.mobileLink} onClick={() => setMenuOpen(false)}>Sign In</Link>
            }
            <Link to="/employer/login" style={s.mobileLinkBtn} onClick={() => setMenuOpen(false)}>Employer Login</Link>
          </div>
        )}
      </nav>

      {/* ── Page Header ── */}
      <div style={s.pageHeader} className="page-header">
        <div style={s.pageHeaderInner} className="page-header-inner">
          <div>
            <h1 style={s.pageTitle} className="page-title">Browse Jobs</h1>
            <p style={s.pageSub}>Verified employers across South Africa</p>
          </div>
          <div className="header-stats" style={s.headerStats}>
            <span style={s.headerStat}><strong style={{ color: "#1a73e8" }}>{jobs.length}</strong> live jobs</span>
            <span style={s.headerStatDivider} />
            <span style={s.headerStat}><strong style={{ color: "#1a73e8" }}>9</strong> provinces</span>
          </div>
        </div>

        {/* Search bar */}
        <div style={s.searchWrap} className="search-wrap">
          <div style={s.searchBox}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              style={s.searchInput}
              value={search}
              onChange={e => { handleFilterChange(setSearch)(e.target.value); }}
              placeholder="Search by job title, company, skill or requirement..."
            />
            {search && (
              <button style={s.searchClearBtn} onClick={() => handleFilterChange(setSearch)("")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={s.body}>
        <div style={s.bodyInner} className="body-inner">

          {/* Results bar */}
          <div style={s.resultsBar} className="results-bar">
            <div style={s.resultsText}>
              <strong style={{ color: "#202124" }}>{filtered.length}</strong> job{filtered.length !== 1 ? "s" : ""} found
              {hasFilters && (
                <button style={s.clearAllBtn} onClick={clearFilters}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Clear filters
                </button>
              )}
            </div>
            <div style={s.resultsBarRight} className="results-bar-right">
              <div style={s.sortWrap}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                <select style={s.sortSelect} value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
              <button style={s.filterToggleBtn} className="filter-toggle-btn" onClick={() => setFilterDrawerOpen(true)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                Filters
                {activeFilterCount > 0 && <span style={s.filterBadge}>{activeFilterCount}</span>}
              </button>
            </div>
          </div>

          {/* Two-panel */}
          <div style={s.twoPanel} className="two-panel">

            {/* ── Left Sidebar ── */}
            <div style={s.filterSidebar} className="filter-sidebar">
              <div style={s.filterSidebarHead}>
                <span style={s.filterSidebarTitle}>Filters</span>
                {hasFilters && (
                  <button style={s.clearAllBtn} onClick={clearFilters}>Clear all</button>
                )}
              </div>

              <div style={s.filterBlock}>
                <div style={s.filterBlockLabel}>Province</div>
                <select
                  style={s.filterSelectEl}
                  value={filterProvince}
                  onChange={e => handleFilterChange(setFilterProvince)(e.target.value)}
                >
                  <option value="">All Provinces</option>
                  {PROVINCES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div style={s.filterBlock}>
                <div style={s.filterBlockLabel}>Job Type</div>
                <div style={s.filterChips}>
                  {JOB_TYPES.map(t => (
                    <button
                      key={t}
                      className="chip"
                      style={{ ...s.chip, ...(filterType === t ? s.chipActive : {}) }}
                      onClick={() => handleFilterChange(setFilterType)(filterType === t ? "" : t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div style={s.filterBlock}>
                <div style={s.filterBlockLabel}>Industry</div>
                <select
                  style={s.filterSelectEl}
                  value={filterIndustry}
                  onChange={e => handleFilterChange(setFilterIndustry)(e.target.value)}
                >
                  <option value="">All Industries</option>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>

              <div style={s.filterCount}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span><strong style={{ color: "#1a73e8" }}>{filtered.length}</strong> result{filtered.length !== 1 ? "s" : ""}</span>
              </div>
            </div>

            {/* Mobile filter drawer */}
            {filterDrawerOpen && (
              <>
                <div style={s.drawerOverlay} onClick={() => setFilterDrawerOpen(false)} />
                <div style={s.filterDrawer}>
                  <div style={s.drawerHeader}>
                    <span style={s.filterSidebarTitle}>Filters</span>
                    <button style={s.drawerCloseBtn} onClick={() => setFilterDrawerOpen(false)}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#202124" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  <div style={s.filterBlock}>
                    <div style={s.filterBlockLabel}>Province</div>
                    <select style={s.filterSelectEl} value={filterProvince} onChange={e => handleFilterChange(setFilterProvince)(e.target.value)}>
                      <option value="">All Provinces</option>
                      {PROVINCES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div style={s.filterBlock}>
                    <div style={s.filterBlockLabel}>Job Type</div>
                    <div style={s.filterChips}>
                      {JOB_TYPES.map(t => (
                        <button key={t} className="chip" style={{ ...s.chip, ...(filterType === t ? s.chipActive : {}) }} onClick={() => handleFilterChange(setFilterType)(filterType === t ? "" : t)}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div style={s.filterBlock}>
                    <div style={s.filterBlockLabel}>Industry</div>
                    <select style={s.filterSelectEl} value={filterIndustry} onChange={e => handleFilterChange(setFilterIndustry)(e.target.value)}>
                      <option value="">All Industries</option>
                      {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                    </select>
                  </div>
                  <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <button style={{ ...s.applyBtn, width: "100%" }} onClick={() => setFilterDrawerOpen(false)}>
                      Show {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                    </button>
                    {hasFilters && (
                      <button style={{ ...s.clearAllBtn, justifyContent: "center", display: "flex" }} onClick={() => { clearFilters(); setFilterDrawerOpen(false); }}>
                        Clear all filters
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ── Job Cards ── */}
            <div style={s.jobListCol}>
              {loading ? (
                [...Array(4)].map((_, i) => <div key={i} style={s.skeleton} />)
              ) : paginated.length === 0 ? (
                <div style={s.emptyState}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dadce0" strokeWidth="1.5" style={{ marginBottom: 14 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <div style={s.emptyTitle}>No jobs found</div>
                  <div style={s.emptySub}>Try different keywords or adjust your filters</div>
                  <button style={s.emptyBtn} onClick={clearFilters}>Clear all filters</button>
                </div>
              ) : (
                <>
                  {paginated.map(job => (
                    <div key={job.id} style={s.jobCard} className="job-card">

                      {/* Top */}
                      <div style={s.jobCardTop} className="job-card-top">
                        <div style={s.jobLogo}>
                          {job.logoUrl
                            ? <img src={job.logoUrl} alt={job.employerName} style={s.jobLogoImg} />
                            : <div style={{ ...s.jobLogoPlaceholder, background: job.brandColour || "#1a73e8" }}>{job.employerName?.[0]}</div>
                          }
                        </div>
                        <div style={s.jobInfo}>
                          <div style={s.jobTitle}>{job.title}</div>
                          <div style={s.jobCompany}>{job.employerName}</div>
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
                        <button
                          style={s.saveBtn}
                          onClick={() => toggleSave(job.id)}
                          title={savedJobs.includes(job.id) ? "Unsave" : "Save"}
                        >
                          {savedJobs.includes(job.id)
                            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="#f9ab00" stroke="#f9ab00" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#bdc1c6" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                          }
                        </button>
                      </div>

                      {/* Requirements — all shown in full */}
                      {job.requirements?.length > 0 && (
                        <div style={s.reqBlock}>
                          <div style={s.reqBlockLabel}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                            Key Requirements
                          </div>
                          {job.requirements.map((r, i) => (
                            <div key={i} style={s.reqItem}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 4 }}><polyline points="20 6 9 17 4 12"/></svg>
                              <span>{r}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div style={s.jobCardFooter}>
                        <span style={s.jobCloses}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 5 }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          Closes {job.closes}
                        </span>
                        <button style={s.viewJobBtn} className="view-job-btn" onClick={() => navigate(`/jobs/${job.id}`)}>
                          View Job
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 6 }}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div style={s.pagination} className="pagination">
                      <button
                        style={{ ...s.pageBtn, ...(page === 1 ? s.pageBtnDisabled : {}) }}
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                        Prev
                      </button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          style={{ ...s.pageBtn, ...(page === i + 1 ? s.pageBtnActive : {}) }}
                          onClick={() => setPage(i + 1)}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        style={{ ...s.pageBtn, ...(page === totalPages ? s.pageBtnDisabled : {}) }}
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                      >
                        Next
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={s.footerLogoMark}>V</div>
            <span style={s.footerCopy}>© {new Date().getFullYear()} Vetted (Pty) Ltd. All rights reserved.</span>
          </div>
          <div style={{ display: "flex", gap: "20px" }}>
            <Link to="/"        style={s.footerLink}>Home</Link>
            <Link to="/terms"   style={s.footerLink}>Terms</Link>
            <Link to="/privacy" style={s.footerLink}>Privacy</Link>
          </div>
        </div>
      </footer>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .jobs-page * { font-family: ${FONT} !important; }

        @media (max-width: 1024px) {
          .two-panel { grid-template-columns: 200px 1fr !important; }
        }
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .menu-toggle { display: flex !important; }
          .filter-sidebar { display: none !important; }
          .filter-toggle-btn { display: inline-flex !important; }
          .two-panel { grid-template-columns: 1fr !important; }
          .page-header-inner { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
          .results-bar { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
          .results-bar-right { width: 100% !important; justify-content: space-between !important; }
          .body-inner { padding: 16px 16px 48px !important; }
          .page-header { padding: 80px 16px 0 !important; }
          .search-wrap { padding: 0 0 16px !important; }
        }
        @media (max-width: 480px) {
          .job-card { padding: 14px !important; }
          .page-title { font-size: 22px !important; }
          .pagination { gap: 4px !important; }
          .header-stats { display: none !important; }
        }
        .job-card:hover { box-shadow: 0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15) !important; border-color: transparent !important; }
        .view-job-btn:hover { background: #1557b0 !important; }
        .chip:hover { background: #e8f0fe !important; border-color: #1a73e8 !important; color: #1a73e8 !important; }
        .nav-link:hover { background: #f1f3f4 !important; }
      `}</style>
    </div>
  );
}

const FONT = '"Circular Std", "Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const s = {
  page: { background: "#f4f5f7", minHeight: "100vh", fontFamily: FONT, color: "#202124", display: "flex", flexDirection: "column" },

  // ── Navbar ──
  navbar: { background: "#ffffff", borderBottom: "1px solid #dadce0", position: "fixed", top: 0, left: 0, right: 0, zIndex: 100 },
  navInner: { maxWidth: "1280px", margin: "0 auto", padding: "0 24px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" },
  navLogo: { cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 },
  logoMark: { width: "28px", height: "28px", borderRadius: "5px", background: "#ffca28", color: "#d84315", fontWeight: "700", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT },
  logoText: { color: "#202124", fontWeight: "600", fontSize: "15px", fontFamily: FONT },
  navLinks: { display: "flex", alignItems: "center", gap: "4px" },
  navLink: { color: "#5f6368", fontSize: "14px", textDecoration: "none", padding: "7px 12px", borderRadius: "4px", fontFamily: FONT },
  navSignIn: { color: "#1a73e8", border: "1px solid #dadce0", background: "#fff", padding: "7px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "500", textDecoration: "none", fontFamily: FONT },
  navBtn: { background: "#1a73e8", color: "#fff", padding: "7px 16px", borderRadius: "4px", fontSize: "13px", fontWeight: "600", textDecoration: "none", marginLeft: "4px", fontFamily: FONT },
  navAvatar: { width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", cursor: "pointer", border: "1px solid #dadce0", flexShrink: 0, marginLeft: "8px" },
  navAvatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  navAvatarInitials: { width: "100%", height: "100%", background: "#1a73e8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700" },
  menuToggle: { display: "none", background: "none", border: "none", cursor: "pointer", padding: "4px", alignItems: "center" },
  mobileMenu: { background: "#fff", borderTop: "1px solid #dadce0", padding: "10px 16px 16px", display: "flex", flexDirection: "column", gap: "2px" },
  mobileLink: { color: "#202124", fontSize: "15px", padding: "12px 16px", borderRadius: "4px", textDecoration: "none", display: "block", fontFamily: FONT },
  mobileLinkBtn: { color: "#fff", background: "#1a73e8", fontSize: "15px", padding: "12px 16px", borderRadius: "4px", textDecoration: "none", display: "block", textAlign: "center", marginTop: "8px", fontFamily: FONT },

  // ── Page header ──
  pageHeader: { background: "#ffffff", borderBottom: "1px solid #dadce0", padding: "92px 24px 0", paddingTop: "92px" },
  pageHeaderInner: { maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", marginBottom: "20px" },
  pageTitle: { color: "#202124", fontSize: "28px", fontWeight: "700", margin: "0 0 4px", letterSpacing: "-0.5px", fontFamily: FONT },
  pageSub: { color: "#5f6368", fontSize: "14px", margin: 0, fontFamily: FONT },
  headerStats: { display: "flex", alignItems: "center", gap: "0", background: "#f8f9fa", border: "1px solid #dadce0", borderRadius: "20px", padding: "8px 4px", flexShrink: 0 },
  headerStat: { color: "#5f6368", fontSize: "13px", padding: "0 16px", fontFamily: FONT },
  headerStatDivider: { width: "1px", height: "14px", background: "#dadce0" },

  // ── Search ──
  searchWrap: { maxWidth: "1280px", margin: "0 auto", paddingBottom: "20px" },
  searchBox: { display: "flex", alignItems: "center", gap: "12px", background: "#fff", border: "1px solid #dadce0", borderRadius: "32px", padding: "12px 18px", boxShadow: "0 1px 6px rgba(32,33,36,0.18)" },
  searchInput: { flex: 1, border: "none", outline: "none", fontSize: "15px", color: "#202124", background: "transparent", fontFamily: FONT, minWidth: 0 },
  searchClearBtn: { background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center", flexShrink: 0 },

  // ── Body ──
  body: { flex: 1, padding: "0 24px" },
  bodyInner: { maxWidth: "1280px", margin: "0 auto", padding: "24px 0 64px" },

  // ── Results bar ──
  resultsBar: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", gap: "12px" },
  resultsText: { display: "flex", alignItems: "center", gap: "12px", color: "#5f6368", fontSize: "14px", fontFamily: FONT },
  clearAllBtn: { display: "inline-flex", alignItems: "center", gap: "5px", background: "none", border: "none", color: "#1a73e8", fontSize: "13px", cursor: "pointer", padding: 0, fontFamily: FONT },
  resultsBarRight: { display: "flex", alignItems: "center", gap: "10px" },
  sortWrap: { display: "flex", alignItems: "center", gap: "7px" },
  sortSelect: { background: "#fff", border: "1px solid #dadce0", borderRadius: "4px", padding: "8px 12px", fontSize: "13px", color: "#202124", outline: "none", cursor: "pointer", fontFamily: FONT },
  filterToggleBtn: { display: "none", alignItems: "center", gap: "7px", background: "#fff", border: "1px solid #dadce0", borderRadius: "4px", padding: "8px 12px", fontSize: "13px", color: "#202124", cursor: "pointer", fontFamily: FONT },
  filterBadge: { background: "#1a73e8", color: "#fff", borderRadius: "10px", padding: "1px 7px", fontSize: "11px", fontWeight: "600" },

  // ── Two-panel ──
  twoPanel: { display: "grid", gridTemplateColumns: "220px 1fr", gap: "24px", alignItems: "start" },

  // ── Filter sidebar ──
  filterSidebar: { background: "#ffffff", border: "1px solid #dadce0", borderRadius: "8px", padding: "20px", display: "flex", flexDirection: "column", gap: "20px", position: "sticky", top: "76px", boxShadow: "0 1px 2px rgba(60,64,67,0.06)" },
  filterSidebarHead: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  filterSidebarTitle: { color: "#202124", fontSize: "14px", fontWeight: "600", fontFamily: FONT },
  filterBlock: { display: "flex", flexDirection: "column", gap: "10px" },
  filterBlockLabel: { color: "#5f6368", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.4px", fontFamily: FONT },
  filterSelectEl: { background: "#f8f9fa", border: "1px solid #dadce0", borderRadius: "4px", padding: "9px 10px", fontSize: "13px", color: "#202124", outline: "none", cursor: "pointer", fontFamily: FONT },
  filterChips: { display: "flex", flexWrap: "wrap", gap: "6px" },
  chip: { background: "#f8f9fa", border: "1px solid #dadce0", borderRadius: "16px", padding: "4px 11px", fontSize: "12px", color: "#5f6368", cursor: "pointer", fontFamily: FONT, transition: "all 0.15s" },
  chipActive: { background: "#e8f0fe", border: "1px solid #1a73e8", color: "#1a73e8", fontWeight: "500" },
  filterCount: { display: "flex", alignItems: "center", gap: "7px", color: "#9aa0a6", fontSize: "13px", paddingTop: "10px", borderTop: "1px solid #f1f3f4", fontFamily: FONT },

  // ── Filter drawer (mobile) ──
  drawerOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 299 },
  filterDrawer: { position: "fixed", top: 0, left: 0, bottom: 0, width: "290px", background: "#fff", zIndex: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px", padding: "20px", boxShadow: "4px 0 16px rgba(0,0,0,0.12)" },
  drawerHeader: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  drawerCloseBtn: { background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" },

  // ── Job cards ──
  jobListCol: { display: "flex", flexDirection: "column", gap: "12px" },
  skeleton: { background: "linear-gradient(90deg,#f1f3f4 25%,#e8eaed 50%,#f1f3f4 75%)", backgroundSize: "200%", animation: "shimmer 1.5s infinite", borderRadius: "8px", height: "180px" },
  emptyState: { background: "#fff", border: "1px solid #dadce0", borderRadius: "8px", padding: "64px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" },
  emptyTitle: { color: "#202124", fontSize: "18px", fontWeight: "600", marginBottom: "8px", fontFamily: FONT },
  emptySub: { color: "#5f6368", fontSize: "14px", marginBottom: "20px", fontFamily: FONT },
  emptyBtn: { background: "#1a73e8", color: "#fff", border: "none", borderRadius: "4px", padding: "10px 22px", fontSize: "13px", cursor: "pointer", fontFamily: FONT },

  jobCard: { background: "#fff", border: "1px solid #dadce0", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px rgba(60,64,67,0.06)" },
  jobCardTop: { display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "12px" },
  jobLogo: { width: "44px", height: "44px", borderRadius: "4px", overflow: "hidden", border: "1px solid #dadce0", flexShrink: 0 },
  jobLogoImg: { width: "100%", height: "100%", objectFit: "contain" },
  jobLogoPlaceholder: { width: "44px", height: "44px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "700", fontSize: "18px" },
  jobInfo: { flex: 1, minWidth: 0 },
  jobTitle: { color: "#1a73e8", fontSize: "16px", fontWeight: "500", marginBottom: "2px", fontFamily: FONT },
  jobCompany: { color: "#5f6368", fontSize: "13px", marginBottom: "8px", fontFamily: FONT },
  jobMeta: { display: "flex", flexWrap: "wrap", gap: "10px" },
  jobMetaItem: { display: "flex", alignItems: "center", gap: "5px", color: "#5f6368", fontSize: "13px", fontFamily: FONT },
  remoteBadge: { background: "#e8f0fe", color: "#1967d2", borderRadius: "4px", padding: "2px 8px", fontSize: "12px", fontWeight: "500", fontFamily: FONT },
  saveBtn: { background: "none", border: "none", cursor: "pointer", padding: "4px", flexShrink: 0 },

  // ── Requirements ──
  reqBlock: { background: "#f8f9fa", border: "1px solid #e8f0fe", borderRadius: "6px", padding: "12px 14px", marginBottom: "12px" },
  reqBlockLabel: { display: "flex", alignItems: "center", gap: "6px", color: "#1a73e8", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px", fontFamily: FONT },
  reqItem: { display: "flex", alignItems: "flex-start", gap: "8px", color: "#3c4043", fontSize: "13px", lineHeight: "1.6", marginBottom: "6px", fontFamily: FONT },

  // ── Card footer ──
  jobCardFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid #f1f3f4" },
  jobCloses: { display: "flex", alignItems: "center", color: "#80868b", fontSize: "12px", fontFamily: FONT },
  viewJobBtn: { display: "inline-flex", alignItems: "center", gap: "6px", background: "#1a73e8", color: "#fff", border: "none", borderRadius: "24px", padding: "8px 18px", fontSize: "13px", fontWeight: "500", cursor: "pointer", fontFamily: FONT },
  applyBtn: { background: "#1a73e8", color: "#fff", border: "none", borderRadius: "4px", padding: "10px 18px", fontSize: "14px", fontWeight: "500", cursor: "pointer", fontFamily: FONT },

  // ── Pagination ──
  pagination: { display: "flex", alignItems: "center", gap: "6px", justifyContent: "center", marginTop: "28px", flexWrap: "wrap" },
  pageBtn: { display: "inline-flex", alignItems: "center", gap: "5px", background: "#fff", border: "1px solid #dadce0", color: "#5f6368", borderRadius: "4px", padding: "8px 12px", fontSize: "13px", cursor: "pointer", fontFamily: FONT, transition: "all 0.15s" },
  pageBtnActive: { background: "#e8f0fe", border: "1px solid #1a73e8", color: "#1a73e8", fontWeight: "600" },
  pageBtnDisabled: { opacity: 0.4, cursor: "not-allowed" },

  // ── Footer ──
  footer: { background: "#ffffff", borderTop: "1px solid #dadce0", padding: "20px 24px" },
  footerInner: { maxWidth: "1280px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" },
  footerLogoMark: { width: "20px", height: "20px", borderRadius: "4px", background: "#ffca28", color: "#d84315", fontWeight: "700", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT },
  footerCopy: { color: "#9aa0a6", fontSize: "12px", fontFamily: FONT },
  footerLink: { color: "#9aa0a6", textDecoration: "none", fontSize: "12px", fontFamily: FONT },
};