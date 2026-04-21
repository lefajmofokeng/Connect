import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { toggleSavedJob, getLocalSavedJobs } from "../../lib/savedJobs";

// Global Layout Components
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

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
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterProvince, setFilterProvince] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [savedJobs, setSavedJobs] = useState(getLocalSavedJobs);
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

  return (
    <>
      <Navbar />

      <main className="jobs-page">
        {/* ── Page Header & Search ── */}
        <header className="page-header">
          <div className="header-inner">
            <div className="header-title-block">
              <div>
                <h1 className="page-title">Browse Jobs</h1>
                <p className="page-sub">Verified employers across South Africa</p>
              </div>
              <div className="header-stats">
                <span className="stat-item"><strong>{jobs.length}</strong> live jobs</span>
                <span className="stat-divider" />
                <span className="stat-item"><strong>9</strong> provinces</span>
              </div>
            </div>

            <div className="search-wrap">
              <div className="search-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  className="search-input"
                  value={search}
                  onChange={e => handleFilterChange(setSearch)(e.target.value)}
                  placeholder="Search by job title, company, skill or requirement..."
                />
                {search && (
                  <button className="search-clear-btn" onClick={() => handleFilterChange(setSearch)("")}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ── Body Layout ── */}
        <div className="body-layout">
          
          {/* Results Bar */}
          <div className="results-bar">
            <div className="results-text">
              <strong>{filtered.length}</strong> job{filtered.length !== 1 ? "s" : ""} found
              {hasFilters && (
                <button className="clear-text-btn" onClick={clearFilters}>
                  Clear filters
                </button>
              )}
            </div>
            <div className="results-actions">
              <div className="sort-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2.5">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                <select className="sort-select" value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
              <button className="mobile-filter-btn" onClick={() => setFilterDrawerOpen(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                Filters
                {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
              </button>
            </div>
          </div>

          <div className="main-grid">
            
            {/* ── Desktop Sidebar ── */}
            <aside className="filter-sidebar">
              <div className="sidebar-header">
                <span className="sidebar-title">Filters</span>
                {hasFilters && <button className="clear-text-btn" onClick={clearFilters}>Clear all</button>}
              </div>

              <div className="filter-block">
                <label className="filter-label">Province</label>
                <select className="filter-select" value={filterProvince} onChange={e => handleFilterChange(setFilterProvince)(e.target.value)}>
                  <option value="">All Provinces</option>
                  {PROVINCES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div className="filter-block">
                <label className="filter-label">Job Type</label>
                <div className="filter-chips">
                  {JOB_TYPES.map(t => (
                    <button
                      key={t}
                      className={`filter-chip ${filterType === t ? "active" : ""}`}
                      onClick={() => handleFilterChange(setFilterType)(filterType === t ? "" : t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-block">
                <label className="filter-label">Industry</label>
                <select className="filter-select" value={filterIndustry} onChange={e => handleFilterChange(setFilterIndustry)(e.target.value)}>
                  <option value="">All Industries</option>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
            </aside>

            {/* ── Mobile Filter Drawer ── */}
            {filterDrawerOpen && (
              <>
                <div className="drawer-overlay" onClick={() => setFilterDrawerOpen(false)} />
                <div className="filter-drawer">
                  <div className="drawer-header">
                    <span className="sidebar-title">Filters</span>
                    <button className="drawer-close" onClick={() => setFilterDrawerOpen(false)}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#202124" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                  <div className="filter-block">
                    <label className="filter-label">Province</label>
                    <select className="filter-select" value={filterProvince} onChange={e => handleFilterChange(setFilterProvince)(e.target.value)}>
                      <option value="">All Provinces</option>
                      {PROVINCES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="filter-block">
                    <label className="filter-label">Job Type</label>
                    <div className="filter-chips">
                      {JOB_TYPES.map(t => (
                        <button key={t} className={`filter-chip ${filterType === t ? "active" : ""}`} onClick={() => handleFilterChange(setFilterType)(filterType === t ? "" : t)}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div className="filter-block">
                    <label className="filter-label">Industry</label>
                    <select className="filter-select" value={filterIndustry} onChange={e => handleFilterChange(setFilterIndustry)(e.target.value)}>
                      <option value="">All Industries</option>
                      {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                    </select>
                  </div>
                  <div className="drawer-actions">
                    <button className="btn-primary" onClick={() => setFilterDrawerOpen(false)}>
                      Show {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                    </button>
                    {hasFilters && (
                      <button className="clear-text-btn" style={{ margin: "0 auto" }} onClick={() => { clearFilters(); setFilterDrawerOpen(false); }}>
                        Clear all filters
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ── Job Feed ── */}
            <section className="job-feed">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="job-card skeleton-card">
                    <div className="skel-top">
                      <div className="skel-logo" />
                      <div className="skel-info">
                        <div className="skel-line title" />
                        <div className="skel-line sub" />
                        <div className="skel-tags">
                          <div className="skel-tag" />
                          <div className="skel-tag" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : paginated.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon-wrap">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  </div>
                  <h3 className="empty-title">No jobs found</h3>
                  <p className="empty-sub">Try adjusting your search or clearing the filters.</p>
                  <button className="btn-primary" onClick={clearFilters}>Clear all filters</button>
                </div>
              ) : (
                <>
                  {paginated.map(job => (
                    <article key={job.id} className="job-card">
                      <div className="job-top">
                        <div className="job-logo-box">
                          {job.logoUrl
                            ? <img src={job.logoUrl} alt={job.employerName} className="job-logo-img" />
                            : <div className="job-logo-placeholder" style={{ background: job.brandColour || "var(--brand-blue)" }}>{job.employerName?.[0]}</div>
                          }
                        </div>
                        <div className="job-info">
                          <h2 className="job-title">{job.title}</h2>
                          <div className="job-company">{job.employerName}</div>
                          <div className="job-meta-list">
                            <span className="meta-pill">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                              {job.city}, {job.province}
                            </span>
                            <span className="meta-pill">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                              {job.type}
                            </span>
                            {job.department && (
                              <span className="meta-pill">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                                {job.department}
                              </span>
                            )}
                            {job.remote && <span className="meta-pill highlight">Remote</span>}
                          </div>
                        </div>
                        <button
                          className={`btn-save ${savedJobs.includes(job.id) ? "saved" : ""}`}
                          onClick={() => toggleSave(job.id)}
                          title={savedJobs.includes(job.id) ? "Unsave" : "Save"}
                        >
                          <svg width="22" height="22" viewBox="0 0 24 24" fill={savedJobs.includes(job.id) ? "#f9ab00" : "none"} stroke={savedJobs.includes(job.id) ? "#f9ab00" : "#9aa0a6"} strokeWidth="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                        </button>
                      </div>

                      {job.requirements?.length > 0 && (
                        <div className="req-block">
                          <div className="req-title">Key Requirements</div>
                          <div className="req-list">
                            {job.requirements.map((r, i) => (
                              <div key={i} className="req-item">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand-blue)" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 3 }}>
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                <span>{r}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="job-footer">
                        <span className="job-closing">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          Closes {job.closes}
                        </span>
                        <button className="btn-view" onClick={() => navigate(`/jobs/${job.id}`)}>
                          View Job
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                          </svg>
                        </button>
                      </div>
                    </article>
                  ))}

                  {totalPages > 1 && (
                    <div className="pagination">
                      <button className="page-nav" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                      </button>
                      <div className="page-numbers">
                        {[...Array(totalPages)].map((_, i) => (
                          <button key={i} className={`page-num ${page === i + 1 ? "active" : ""}`} onClick={() => setPage(i + 1)}>
                            {i + 1}
                          </button>
                        ))}
                      </div>
                      <button className="page-nav" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        :root {
          --brand-blue: #1a73e8;
          --brand-blue-hover: #1557b0;
          --text-main: #202124;
          --text-muted: #5f6368;
          --bg-main: #f8f9fa;
          --border-color: #eaebed;
          --radius-main: 15px;
          --radius-pill: 100px;
          --font-family: "Circular Std", "Circular", -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .jobs-page {
          background-color: var(--bg-main);
          min-height: 100vh;
          font-family: var(--font-family);
          color: var(--text-main);
        }

        /* ── Header ── */
        .page-header {
          background: #ffffff;
          border-bottom: 1px solid var(--border-color);
          padding: 100px 24px 0; /* Padding top accounts for fixed global navbar */
        }

        .header-inner {
          max-width: 1200px;
          margin: 0 auto;
        }

        .header-title-block {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 32px;
          gap: 20px;
        }

        .page-title {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 8px;
          letter-spacing: -0.5px;
          color: var(--text-main);
        }

        .page-sub {
          color: var(--text-muted);
          font-size: 16px;
          margin: 0;
        }

        .header-stats {
          display: flex;
          align-items: center;
          gap: 16px;
          background: var(--bg-main);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-pill);
          padding: 10px 20px;
        }

        .stat-item {
          color: var(--text-muted);
          font-size: 14px;
        }

        .stat-item strong {
          color: var(--brand-blue);
        }

        .stat-divider {
          width: 1px;
          height: 16px;
          background: var(--border-color);
        }

        /* ── Search Bar ── */
        .search-wrap {
          padding-bottom: 32px;
          transform: translateY(16px); /* Pulls it down over the border slightly */
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 16px;
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-pill);
          padding: 14px 24px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.04);
          transition: box-shadow 0.2s, border-color 0.2s;
        }

        .search-box:focus-within {
          border-color: var(--brand-blue);
          box-shadow: 0 8px 32px rgba(26, 115, 232, 0.1);
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 16px;
          color: var(--text-main);
          background: transparent;
          font-family: var(--font-family);
        }
        
        .search-input::placeholder {
          color: #9aa0a6;
        }

        .search-clear-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          padding: 4px;
          display: flex;
          transition: color 0.2s;
        }

        .search-clear-btn:hover { color: var(--text-main); }

        /* ── Body Layout ── */
        .body-layout {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px 80px;
        }

        .results-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .results-text {
          color: var(--text-muted);
          font-size: 15px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .results-text strong {
          color: var(--text-main);
        }

        .clear-text-btn {
          background: none;
          border: none;
          color: var(--brand-blue);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
          font-family: var(--font-family);
        }

        .clear-text-btn:hover { text-decoration: underline; }

        .results-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sort-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-pill);
          padding: 8px 16px;
        }

        .sort-select {
          border: none;
          outline: none;
          background: transparent;
          font-size: 14px;
          color: var(--text-main);
          font-family: var(--font-family);
          cursor: pointer;
          appearance: none;
          padding-right: 16px;
          background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%235f6368' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right center;
        }

        .mobile-filter-btn {
          display: none;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-pill);
          padding: 8px 16px;
          font-size: 14px;
          color: var(--text-main);
          cursor: pointer;
          font-family: var(--font-family);
          font-weight: 500;
        }

        .filter-badge {
          background: var(--brand-blue);
          color: #ffffff;
          border-radius: 10px;
          padding: 2px 8px;
          font-size: 12px;
          font-weight: 600;
        }

        /* ── Main Grid ── */
        .main-grid {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 32px;
          align-items: start;
        }

        /* ── Sidebar Filters ── */
        .filter-sidebar {
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-main);
          padding: 24px;
          position: sticky;
          top: 100px;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .sidebar-title {
          font-size: 16px;
          font-weight: 600;
        }

        .filter-block {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }
        
        .filter-block:last-child {
          margin-bottom: 0;
        }

        .filter-label {
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filter-select {
          background: var(--bg-main);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 12px;
          font-size: 14px;
          color: var(--text-main);
          font-family: var(--font-family);
          outline: none;
          appearance: none;
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%235f6368' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
        }

        .filter-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .filter-chip {
          background: var(--bg-main);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-pill);
          padding: 6px 14px;
          font-size: 13px;
          color: var(--text-muted);
          cursor: pointer;
          font-family: var(--font-family);
          transition: all 0.2s;
        }

        .filter-chip:hover {
          border-color: #d2e3fc;
          background: #f1f3f4;
        }

        .filter-chip.active {
          background: #e8f0fe;
          border-color: var(--brand-blue);
          color: var(--brand-blue);
          font-weight: 500;
        }

        /* ── Job Cards ── */
        .job-feed {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .job-card {
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-main);
          padding: 24px;
          transition: all 0.2s ease;
        }

        .job-card:hover {
          border-color: transparent;
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
          transform: translateY(-2px);
        }

        .job-top {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
        }

        .job-logo-box {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          overflow: hidden;
          flex-shrink: 0;
          background: #fff;
        }

        .job-logo-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .job-logo-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 24px;
          font-weight: 700;
        }

        .job-info {
          flex: 1;
        }

        .job-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-main);
          margin: 0 0 4px;
        }

        .job-company {
          color: var(--text-muted);
          font-size: 15px;
          margin-bottom: 12px;
        }

        .job-meta-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .meta-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-main);
          border: 1px solid var(--border-color);
          padding: 4px 10px;
          border-radius: var(--radius-pill);
          font-size: 13px;
          color: var(--text-muted);
        }
        
        .meta-pill.highlight {
          background: #e8f0fe;
          border-color: #d2e3fc;
          color: var(--brand-blue);
          font-weight: 500;
        }

        .btn-save {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          transition: background 0.2s;
        }
        
        .btn-save:hover {
          background: var(--bg-main);
        }

        /* ── Requirements Block ── */
        .req-block {
          background: rgba(26, 115, 232, 0.03);
          border: 1px solid rgba(26, 115, 232, 0.1);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .req-title {
          color: var(--brand-blue);
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }

        .req-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .req-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 14px;
          color: #3c4043;
          line-height: 1.5;
        }

        /* ── Job Footer ── */
        .job-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 20px;
          border-top: 1px solid var(--border-color);
        }

        .job-closing {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #80868b;
          font-size: 13px;
        }

        .btn-view {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--brand-blue);
          color: #ffffff;
          border: none;
          border-radius: var(--radius-pill);
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: var(--font-family);
          transition: all 0.2s;
        }

        .btn-view:hover {
          background: var(--brand-blue-hover);
          transform: translateX(4px);
        }

        /* ── Empty & Skeleton States ── */
        .empty-state {
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-main);
          padding: 80px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .empty-icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--bg-main);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .empty-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 8px;
        }

        .empty-sub {
          color: var(--text-muted);
          font-size: 15px;
          margin: 0 0 24px;
        }

        .btn-primary {
          background: var(--brand-blue);
          color: #ffffff;
          border: none;
          border-radius: var(--radius-pill);
          padding: 12px 24px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          font-family: var(--font-family);
        }

        .skeleton-card {
          pointer-events: none;
        }

        .skel-top {
          display: flex;
          gap: 16px;
        }

        .skel-logo {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          background: #f1f3f4;
          animation: pulse 1.5s infinite ease-in-out;
        }

        .skel-info {
          flex: 1;
        }

        .skel-line {
          height: 16px;
          border-radius: 8px;
          background: #f1f3f4;
          margin-bottom: 12px;
          animation: pulse 1.5s infinite ease-in-out;
        }
        
        .skel-line.title { width: 40%; height: 20px; }
        .skel-line.sub { width: 25%; }

        .skel-tags {
          display: flex;
          gap: 8px;
        }

        .skel-tag {
          width: 80px;
          height: 28px;
          border-radius: var(--radius-pill);
          background: #f1f3f4;
          animation: pulse 1.5s infinite ease-in-out;
        }

        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }

        /* ── Pagination ── */
        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-top: 40px;
        }

        .page-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid var(--border-color);
          background: #ffffff;
          color: var(--text-main);
          cursor: pointer;
          transition: all 0.2s;
        }

        .page-nav:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .page-nav:not(:disabled):hover {
          background: var(--bg-main);
        }

        .page-numbers {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .page-num {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          border-radius: 50%;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-muted);
          cursor: pointer;
          font-family: var(--font-family);
          transition: all 0.2s;
        }

        .page-num:hover {
          background: var(--bg-main);
          color: var(--text-main);
        }

        .page-num.active {
          background: var(--brand-blue);
          color: #ffffff;
          font-weight: 600;
        }

        /* ── Mobile Drawer Elements ── */
        .drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          z-index: 1000;
          backdrop-filter: blur(2px);
        }

        .filter-drawer {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 320px;
          background: #ffffff;
          z-index: 1001;
          padding: 24px;
          display: flex;
          flex-direction: column;
          box-shadow: 4px 0 24px rgba(0,0,0,0.1);
          overflow-y: auto;
        }

        .drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
        }

        .drawer-close {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
        }

        .drawer-actions {
          margin-top: auto;
          padding-top: 32px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .drawer-actions .btn-primary { width: 100%; }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .main-grid {
            grid-template-columns: 240px 1fr;
            gap: 24px;
          }
        }

        @media (max-width: 768px) {
          .main-grid { grid-template-columns: 1fr; }
          .filter-sidebar { display: none; }
          .mobile-filter-btn { display: inline-flex; }
          .header-title-block { flex-direction: column; align-items: flex-start; }
          .header-stats { width: 100%; justify-content: flex-start; }
          .results-bar { flex-direction: column; align-items: flex-start; gap: 16px; }
          
          .results-actions { width: 100%; justify-content: space-between; }
          .job-card { padding: 20px; }
          .job-meta-list { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </>
  );
}