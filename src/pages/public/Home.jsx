import { useState, useEffect, useRef } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { toggleSavedJob, getLocalSavedJobs } from "../../lib/savedJobs";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal",
  "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"
];
const JOB_TYPES = ["Full-Time", "Part-Time", "Contract", "Temporary", "Internship", "Freelance"];
const INDUSTRIES = [
  "Agriculture","Automotive","Construction","Education","Energy",
  "Finance & Banking","Healthcare","Hospitality","IT & Technology",
  "Legal","Logistics & Transport","Manufacturing","Media & Marketing",
  "Mining","NGO & Non-Profit","Real Estate","Retail","Telecommunications","Other"
];

export default function Home() {
  const navigate = useNavigate();
  const { user, jobSeekerProfile } = useAuth();
  const [allJobs, setAllJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterProvince, setFilterProvince] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [filterSalary, setFilterSalary] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedJob, setSelectedJob] = useState(null);
  const [savedJobs, setSavedJobs] = useState(getLocalSavedJobs);
  const [mobileView, setMobileView] = useState("list");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const detailRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 10;

  useEffect(() => { fetchJobs(); }, [sortBy]);

  // Proactive UI fix: Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (mobileFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileFilterOpen]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const order = sortBy === "oldest" ? "asc" : "desc";
      const snap = await getDocs(query(
        collection(db, "jobs"),
        where("status", "==", "live"),
        orderBy("createdAt", order),
        limit(50)
      ));
      const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllJobs(results);
      if (results.length > 0 && !selectedJob) setSelectedJob(results[0]);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const filtered = allJobs.filter(j => {
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
    const matchSalary = !filterSalary || (j.salary && j.salary.toLowerCase().includes(filterSalary.toLowerCase()));
    return matchSearch && matchProvince && matchType && matchIndustry && matchSalary;
  });

  useEffect(() => { setCurrentPage(1); }, [search, filterProvince, filterType, filterIndustry, filterSalary]);

  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filtered.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filtered.length / jobsPerPage);

  const toggleSave = async (e, jobId) => {
    e.stopPropagation();
    await toggleSavedJob(jobId, user);
    setSavedJobs(getLocalSavedJobs());
  };

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    setMobileView("detail");
    detailRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeDropdown = () => setOpenDropdown(null);
  const clearFilters = () => {
    setSearch(""); setFilterProvince(""); setFilterType("");
    setFilterIndustry(""); setOpenDropdown(null);
    setMobileFilterOpen(false);
  };
  const hasFilters = search || filterProvince || filterType || filterIndustry;
  const activeFilterCount = [filterProvince, filterType, filterIndustry].filter(Boolean).length;

  return (
    <div className="page-wrapper" style={s.page}>

      {/* ── Navbar ── */}
      <Navbar />

      {/* ── Hero Section ── */}
      <div style={s.heroSection}>
        <div style={s.heroInner}>
          <h1 className="hero-title" style={s.heroTitle}>Join your<br />dream team.</h1>
          <p className="hero-subtitle" style={s.heroSubtitle}>Connect with verified enterprises across South Africa in a streamlined, premium ecosystem built for your career advancement.</p>
        </div>
      </div>

      {/* ── Desktop Filter Bar ── */}
      <div style={s.filterRow} onClick={closeDropdown}>
        <div className="filter-scroll-container desktop-filters" style={s.filterRowInner}>

          {/* Search by title — text input tab */}
          <div style={ft.tabWrap}>
            <div style={{ ...ft.tab, ...(search ? ft.tabActive : {}), cursor: "text" }} onClick={() => document.getElementById("home-search-input")?.focus()}>
              <span style={{ ...ft.tabLabel, ...(search ? ft.tabLabelActive : {}) }}>Search</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={search ? "#1967d2" : "#9aa0a6"} strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                id="home-search-input"
                style={{ ...ft.searchInput, padding: "0" }}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Job title or keyword…"
                onClick={e => e.stopPropagation()}
              />
              {search && (
                <button style={ft.searchClear} onClick={e => { e.stopPropagation(); setSearch(""); }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
          </div>

          <FilterTab
            label="Job Type" value={filterType} options={JOB_TYPES}
            open={openDropdown === "type"}
            onToggle={e => { e.stopPropagation(); setOpenDropdown(openDropdown === "type" ? null : "type"); }}
            onSelect={v => { setFilterType(v); setOpenDropdown(null); }}
          />
          <FilterTab
            label="Province" value={filterProvince} options={PROVINCES}
            open={openDropdown === "province"}
            onToggle={e => { e.stopPropagation(); setOpenDropdown(openDropdown === "province" ? null : "province"); }}
            onSelect={v => { setFilterProvince(v); setOpenDropdown(null); }}
          />
          <FilterTab
            label="Industry" value={filterIndustry} options={INDUSTRIES}
            open={openDropdown === "industry"}
            onToggle={e => { e.stopPropagation(); setOpenDropdown(openDropdown === "industry" ? null : "industry"); }}
            onSelect={v => { setFilterIndustry(v); setOpenDropdown(null); }}
          />

          {hasFilters && (
            <div className="clear-btn-wrap" style={{ display: 'flex', alignItems: 'center', height: '60px' }}>
              <button style={s.clearBtn} onClick={clearFilters}>✕ Clear</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Panel ── */}
      <div style={s.mainSection}>
        <div className="main-inner" style={s.mainInner}>

          {/* ── Mobile Sticky Filter Row (Proactive UI addition) ── */}
          <div className="mobile-sticky-filter-bar">
            <span style={s.mobileHeroCount}>
              <strong style={{ color: "#202124" }}>{filtered.length}</strong>
              <span style={{ color: "#5f6368" }}> {filtered.length === 1 ? "job" : "jobs"}</span>
            </span>
            <button
              style={s.mobileFilterBtn}
              onClick={() => setMobileFilterOpen(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              Filter
              {activeFilterCount > 0 && (
                <span style={s.mobileFilterBadge}>{activeFilterCount}</span>
              )}
            </button>
          </div>

          {/* Desktop results count only */}
          <div className="desktop-results-row" style={s.resultsRow}>
            <span style={s.resultsCount}>
              <strong>{filtered.length}</strong> {filtered.length === 1 ? "job" : "jobs"} available
              {filterProvince && <span style={s.resultsLocation}> in {filterProvince}</span>}
            </span>
          </div>

          <div className="split-layout" style={s.splitLayout}>

            {/* ── Centered Job List ── */}
            <div className={`left-panel ${mobileView === "detail" ? "hide-on-mobile" : ""}`} style={s.leftPanel}>
              {loading ? (
                [...Array(5)].map((_, i) => <div key={i} style={s.skeleton} />)
              ) : filtered.length === 0 ? (
                <div style={s.emptyState}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dadce0" strokeWidth="1.5" style={{ marginBottom: 16 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <div style={s.emptyTitle}>No matching positions</div>
                  <div style={s.emptySub}>Adjust your filters or search terms.</div>
                  <button style={s.outlineBtn} onClick={clearFilters}>Clear Search Criteria</button>
                </div>
              ) : (
                <div style={s.jobListWrapper}>
                  {currentJobs.map(job => (
                    <div
                      key={job.id}
                      className="job-list-item-hover mobile-tap-highlight"
                      style={s.jobListItem}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      <div style={s.jobListItemInner}>
                        <div style={s.jobListLogo}>
                          {job.logoUrl
                            ? <img src={job.logoUrl} alt={job.employerName} style={s.jobListLogoImg} />
                            : <div style={{ ...s.jobListLogoPlaceholder, background: job.brandColour || "#f1f3f4", color: job.brandColour ? "#fff" : "#5f6368" }}>{job.employerName?.[0] || "C"}</div>
                          }
                        </div>
                        
                        <div style={s.jobListCenter}>
                          <h3 style={s.jobListItemTitle}>{job.title}</h3>
                          <div style={s.jobListItemSub}>
                            <span style={s.jobListItemDept}>{job.employerName}</span>
                            <span style={s.jobListItemSeparator}> · </span>
                            <span style={s.jobListItemLocation}>{job.city}, {job.province}</span>
                          </div>
                        </div>

                        {/* Arrow with conditionally hidden Apply Now text */}
                        <div style={s.jobListArrow}>
                          <span className="job-list-apply-text">Apply now</span>
                          <svg className="job-list-arrow-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="7" y1="17" x2="17" y2="7"></line>
                            <polyline points="7 7 17 7 17 17"></polyline>
                          </svg>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div style={s.pagination}>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      style={{ ...s.paginationBtn, ...(currentPage === i + 1 ? s.paginationBtnActive : {}) }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Employer CTA Section ── */}
      <div className="vt-employer-wrapper">
        <div className="vt-employer-inner">

          <h2 className="vt-employer-heading">List your jobs on<br />Vetted</h2>
          <p className="vt-employer-sub">
            We are now accepting applications from verified South African enterprises. If your business is registered with CIPC and you are ready to access a pool of serious, qualified candidates — apply now to get listed.
          </p>

          <span className="vt-platform-group-title">Learn more about our plans:</span>
          <div className="vt-platform-btn-group">
            <Link to="/employer/join" className="vt-platform-btn">
              Spark Plan — R450 / listing / mo
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8h11.5m0 0L8.5 4m4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
            <Link to="/employer/join" className="vt-platform-btn">
              Enterprise — Custom pricing
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8h11.5m0 0L8.5 4m4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>

          <div className="vt-info-card">
            <div className="vt-alert-note">
              <strong>Note:</strong> Your business must be registered with the Companies and Intellectual Property Commission (CIPC) and pass our verification process before listings go live. Due to the volume of applications, our team will only contact shortlisted businesses within 1–2 business days.
            </div>

            <p className="vt-disclaimer">
              By submitting your application you acknowledge having read the Vetted Privacy Policy and agree that the information provided will be used solely for the purpose of employer verification and account setup. You guarantee that any third-party information submitted has been authorised for use in this process.
            </p>

            <div className="vt-list">
              <div>Vetted operates as a closed, invite-only platform. Every employer is independently verified against CIPC records before being granted access to post job listings. This ensures candidates trust every listing on the platform.</div>
              <div style={{marginTop: "14px"}}>Pricing is R450 per live listing per month — no setup fees, no agency commissions, no long-term contracts. You pay only for active listings. Enterprise pricing is available for businesses with high-volume or multi-province hiring needs.</div>
            </div>

            <div className="vt-cta-btn-wrap">
              <Link to="/employer/join" className="vt-listing-cta">
                Apply for employer access
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M10 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V14M14 4H20M20 4V10M20 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* ── Footer ── */}
      <Footer />

      {/* ── Mobile Filter Drawer (Animated) ── */}
      {mobileFilterOpen && (
        <>
          <div className="drawer-overlay-anim" style={s.drawerOverlay} onClick={() => setMobileFilterOpen(false)} />
          <div className="mobile-drawer-anim" style={s.mobileDrawer}>
            <div style={s.mobileDrawerHeader}>
              <span style={s.mobileDrawerTitle}>Refine Search</span>
              <button style={s.mobileDrawerClose} onClick={() => setMobileFilterOpen(false)}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#202124" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div style={s.mobileDrawerBody}>
              {/* Search by title */}
              <div style={s.mobileDrawerGroup}>
                <div style={s.mobileDrawerLabel}>Keyword or Title</div>
                <div style={{ position: "relative", display: "flex", alignItems: "center", background: "#f8f9fa", border: "2px solid #e0e0e0", borderRadius: "8px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" style={{ flexShrink: 0, marginLeft: "14px" }}>
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    style={{ flex: 1, border: "none", outline: "none", background: "transparent", padding: "14px 12px", fontSize: "16px", color: "#202124", fontFamily: "inherit" }}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="e.g. Software Engineer"
                  />
                  {search && (
                    <button style={{ background: "none", border: "none", cursor: "pointer", padding: "12px", display: "flex", alignItems: "center" }} onClick={() => setSearch("")}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Job Type */}
              <div style={s.mobileDrawerGroup}>
                <div style={s.mobileDrawerLabel}>Job Type</div>
                <div style={{position: "relative"}}>
                  <select style={s.mobileDrawerSelect} value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option value="">All Types</option>
                    {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <div style={s.selectArrow}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg></div>
                </div>
              </div>

              {/* Province */}
              <div style={s.mobileDrawerGroup}>
                <div style={s.mobileDrawerLabel}>Province</div>
                <div style={{position: "relative"}}>
                  <select style={s.mobileDrawerSelect} value={filterProvince} onChange={e => setFilterProvince(e.target.value)}>
                    <option value="">All Provinces</option>
                    {PROVINCES.map(p => <option key={p}>{p}</option>)}
                  </select>
                  <div style={s.selectArrow}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg></div>
                </div>
              </div>

              {/* Industry */}
              <div style={s.mobileDrawerGroup}>
                <div style={s.mobileDrawerLabel}>Industry</div>
                <div style={{position: "relative"}}>
                  <select style={s.mobileDrawerSelect} value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)}>
                    <option value="">All Industries</option>
                    {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                  </select>
                  <div style={s.selectArrow}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg></div>
                </div>
              </div>
            </div>

            <div style={s.mobileDrawerFooter}>
              <button style={s.mobileDrawerApply} onClick={() => setMobileFilterOpen(false)}>
                Show {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </button>
              {hasFilters && (
                <button style={s.mobileDrawerClear} onClick={clearFilters}>
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Page CSS ── */}
      <style>{`
        *:focus { outline: none !important; box-shadow: none !important; }
        button, div, a, select, input { -webkit-tap-highlight-color: transparent !important; }

        .page-wrapper { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #dadce0; border-radius: 4px; }

        .job-list-item-hover { will-change: auto !important; transform: none !important; backface-visibility: visible !important; outline: none !important; }

        .filter-tab-wrap { will-change: auto !important; }
        .filter-tab-wrap button { will-change: auto !important; transform: none !important; -webkit-font-smoothing: antialiased !important; }
        .filter-tab-wrap button:hover { background: #f8f9fa !important; }

        /* Desktop Apply now hover accent */
        .job-list-apply-text {
          opacity: 0;
          visibility: hidden;
          transform: translateX(10px);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-weight: 500;
          font-size: 22px;
          color: #004599;
          margin-right: 8px;
        }


        .job-list-arrow-icon { transition: transform 0.2s ease, color 0.2s ease; }

        @media (min-width: 769px) {
          .job-list-item-hover:hover .job-list-apply-text {
            opacity: 1;
            visibility: visible;
            transform: translateX(0);
          }
          .job-list-item-hover:hover .job-list-arrow-icon {
            color: #004599;
            transform: translate(2px, -2px);
          }
        }

        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* Mobile animations */
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(4px); }
        }
        .mobile-drawer-anim {
          animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .drawer-overlay-anim {
          animation: fadeIn 0.3s ease forwards;
        }

        /* Mobile specific hiding */
        .mobile-sticky-filter-bar { display: none !important; }
        .desktop-results-row { display: flex !important; }

        /* ── Tablet / Mobile ── */
        @media (max-width: 900px) {
          .hide-on-mobile { display: none !important; }
        }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .desktop-filters { display: none !important; }
          .desktop-results-row { display: none !important; }
          
          /* Hide Apply text on mobile so tap is clean */
          .job-list-apply-text { display: none !important; }

          /* Dedicated Sticky Filter Row */
          .mobile-sticky-filter-bar { 
            display: flex !important; 
            align-items: center;
            justify-content: space-between;
            background: rgba(244, 244, 244, 0.95);
            backdrop-filter: blur(12px);
            padding: 12px 0 16px;
            margin-bottom: 8px;
            position: sticky;
            top: 0; /* Adjust this value if you have a sticky navbar */
            z-index: 90;
            border-bottom: 1px solid #dadce0;
          }
          
          /* Touch feedback for mobile */
          .mobile-tap-highlight:active { background-color: #e8eaed !important; border-radius: 8px; }

          .hero-title { font-size: 36px !important; line-height: 1.25 !important; }
          .hero-subtitle { font-size: 14px !important; }

          .job-list-item-hover { padding: 18px 12px !important; margin: 0 -12px !important; }
        }

        /* ── Small phones ── */
        @media (max-width: 480px) {
          .hero-title { font-size: 26px !important; }
        }

        /* ── Employer CTA Section ── */
        .vt-employer-wrapper {
          font-family: 'Circular Std', 'Circular', -apple-system, BlinkMacSystemFont, sans-serif;
          background-color: #0a1422;
          color: #ffffff;
          padding: 100px 20px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .vt-employer-inner {
          max-width: 650px;
          width: 100%;
          text-align: center;
        }
        .vt-employer-heading {
          font-size: clamp(36px, 6vw, 56px);
          font-weight: 400;
          letter-spacing: -0.02em;
          margin: 0 0 28px;
          line-height: 1.1;
          color: #ffffff;
          font-family: inherit;
        }
        .vt-employer-sub {
          font-size: clamp(14px, 2vw, 16px);
          line-height: 1.65;
          margin: 0 auto 48px;
          max-width: 560px;
          color: #ffffff;
          font-family: inherit;
        }
        .vt-platform-group-title {
          font-size: 14px;
          margin-bottom: 14px;
          display: block;
          color: #c2c9d9;
          font-family: inherit;
        }
        .vt-platform-btn-group {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-bottom: 56px;
          flex-wrap: wrap;
        }
        .vt-platform-btn {
          background-color: transparent;
          border: 2px solid rgb(255, 255, 255);
          color: #ffffff;
          padding: 9px 28px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 400;
          font-size: clamp(13px, 2vw, 15px);
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: background 0.2s ease, border-color 0.2s ease;
          font-family: inherit;
        }
        .vt-platform-btn:hover {
          background-color: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.85);
        }
        .vt-info-card {
          background-color: #ffffff;
          color: #111827;
          border-radius: 20px;
          margin-top: 3rem;
          padding: 40px;
          text-align: left;
          box-shadow: 0 10px 40px rgba(0,0,0,0.25);
        }
        .vt-alert-note {
          color: #034481;
          font-size: clamp(12px, 2vw, 14px);
          margin-bottom: 28px;
          line-height: 1.6;
          font-family: inherit;
        }
        .vt-disclaimer {
          font-size: clamp(12px, 1.8vw, 13px);
          line-height: 1.75;
          color: #151d32;
          margin-bottom: 22px;
          font-family: inherit;
        }
        .vt-list {
          font-size: clamp(12px, 1.8vw, 13px);
          line-height: 1.75;
          color: #151d32;
          margin-bottom: 36px;
          font-family: inherit;
        }
        .vt-cta-btn-wrap {
          display: flex;
          justify-content: center;
        }
        .vt-listing-cta {
          background-color: #0d1e3a;
          color: #ffffff;
          padding: 11px 36px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 400;
          font-size: clamp(14px, 2vw, 16px);
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: background 0.2s ease;
          font-family: inherit;
        }
        .vt-listing-cta:hover { background-color: #1a2c4e; }

        @media (max-width: 768px) {
          .vt-employer-wrapper { padding: 60px 16px; }
          .vt-employer-heading { margin-bottom: 20px; }
          .vt-employer-sub { margin-bottom: 36px; }
          .vt-platform-btn-group { flex-direction: column; gap: 12px; margin-bottom: 40px; }
          .vt-platform-btn { width: 100%; justify-content: center; }
          .vt-info-card { padding: 24px 20px; border-radius: 14px; }
          .vt-listing-cta { width: 100%; justify-content: center; }
        }
            `}</style>
    </div>
  );
}

// ── FilterTab — desktop dropdown ──────────────────────────
function FilterTab({ label, value, options, open, onToggle, onSelect, isSort }) {
  const isActive = isSort ? false : !!value;
  const displayValue = isSort ? value : (value || "- Select -");

  return (
    <div style={ft.tabWrap} className="filter-tab-wrap">
      <button
        onClick={onToggle}
        style={{ ...ft.tab, ...(isActive || open ? ft.tabActive : {}) }}
      >
        <span style={{ ...ft.tabLabel, ...(isActive || open ? ft.tabLabelActive : {}) }}>
          {label}
        </span>
        <span style={{ ...ft.tabValue, ...(isActive ? ft.tabValueActive : {}) }}>
          {displayValue}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ flexShrink: 0, color: (isActive || open) ? "#1967d2" : "#5f6368", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={ft.dropdown} onClick={e => e.stopPropagation()}>
          {options.map(opt => (
            <button
              key={opt}
              style={{ ...ft.option, ...(value === opt ? ft.optionActive : {}) }}
              onClick={() => onSelect(opt)}
            >
              {value === opt && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1967d2" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const ft = {
  tabWrap: { position: "relative", marginTop: "10px", flex: "1 1 0", minWidth: "160px" },
  tab: {
    position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "#f4f4f4", border: "2px solid #939393", borderRadius: "4px", outline: "none",
    padding: "0 14px", cursor: "pointer", width: "100%", height: "60px", gap: "12px", boxSizing: "border-box",
    fontFamily: '"Circular Std", "Circular", -apple-system, sans-serif',
    transition: "border-color 0.15s",
    WebkitFontSmoothing: "antialiased",
  },
  tabActive: { borderColor: "#1967d2" },
  tabLabel: {
    position: "absolute", top: "-10px", left: "10px", background: "#f4f4f4",
    padding: "0 4px", fontSize: "20px", fontWeight: "500", color: "#0058aa",
    lineHeight: 1, zIndex: 1,
    WebkitFontSmoothing: "antialiased",
  },
  tabLabelActive: { color: "#1967d2" },
  tabValue: { fontSize: "15px", fontWeight: "400", color: "#5f6368", lineHeight: 1.4, whiteSpace: "nowrap", WebkitFontSmoothing: "antialiased" },
  tabValueActive: { color: "#202124" },
  dropdown: {
    position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 80,
    background: "#f4f4f4", border: "2px solid #939393", borderRadius: "4px", outline: "none",
    boxShadow: "0 4px 16px rgba(60,64,67,0.18)", minWidth: "280px",
    maxHeight: "280px", overflowY: "auto", padding: "4px",
    display: "flex", flexDirection: "column",
  },
  option: {
    display: "flex", alignItems: "center", gap: "8px", outline: "none",
    background: "none", border: "none", width: "100%", textAlign: "left",
    padding: "9px 14px", fontSize: "19px", fontWeight: "400", color: "#000000",
    cursor: "pointer", borderRadius: "4px",
    fontFamily: '"Circular Std", "Circular", -apple-system, sans-serif',
    WebkitFontSmoothing: "antialiased",
  },
  optionActive: { color: "#1967d2", fontWeight: "600", background: "#f0f4ff" },
  searchInput: {
    flex: 1, border: "none", outline: "none", background: "transparent", height: "100%",
    fontSize: "15px", fontWeight: "400", color: "#202124", fontFamily: '"Circular Std", "Circular", -apple-system, sans-serif',
    padding: "0 10px 0 8px", WebkitFontSmoothing: "antialiased", width: "100%", boxSizing: "border-box"
  },
  searchClear: { background: "none", border: "none", outline: "none", cursor: "pointer", padding: "6px", display: "flex", alignItems: "center", flexShrink: 0 },
};

const s = {
  page: { background: "#f4f4f4", minHeight: "100vh", fontFamily: '"Circular Std", "Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: "#202124" },

  heroSection: { 
    background: "linear-gradient(rgba(244, 244, 244, 0.14), rgba(244, 244, 244, 0)), url('https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D') center/cover no-repeat", 
    padding: "100px 0 40px", 
    textAlign: "left" 
  },

  heroInner: { maxWidth: "1200px", margin: "0 auto", padding: "0 20px", width: "100%", boxSizing: "border-box" },
  heroTitle: { color: "#ffffff", fontSize: "clamp(32px, 6vw, 72px)", fontWeight: "400", margin: "0 0 16px", lineHeight: "1", letterSpacing: "-0.02em" },
  heroSubtitle: { color: "#a9b1ba", fontSize: "clamp(14px, 2vw, 17px)", lineHeight: "1.6", margin: "0 0 14px", maxWidth: "720px" },
  heroJobCount: { fontSize: "14px", color: "#9aa0a6", margin: 0 },

  filterRow: { background: "#f4f4f4", paddingTop: "1rem" },
  filterRowInner: { maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "12px", flexWrap: "wrap", padding: "20px 20px 16px", width: "100%", boxSizing: "border-box" },
  clearBtn: { color: "#c5221f", background: "none", outline: "none", fontSize: "14px", fontWeight: "500", cursor: "pointer", padding: "10px 16px", fontFamily: "inherit" },

  mainSection: { flex: 1, background: "#f4f4f4", paddingTop: "16px" },
  mainInner: { maxWidth: "1200px", margin: "0 auto", padding: "0 20px 64px", width: "100%", boxSizing: "border-box" },

  resultsRow: { width: "100%", margin: "0 0 20px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  resultsCount: { color: "#5f6368", fontSize: "14px", fontWeight: "400" },
  resultsLocation: { color: "#202124", fontWeight: "500" },

  mobileFilterBtn: { background: "#1a73e8", border: "none", borderRadius: "50px", padding: "10px 20px", fontSize: "14px", color: "#ffffff", cursor: "pointer", fontFamily: "inherit", fontWeight: "500", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 2px 8px rgba(26,115,232,0.3)" },
  mobileFilterBadge: { background: "#fff", color: "#1a73e8", borderRadius: "50%", width: "18px", height: "18px", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" },
  mobileHeroCount: { fontSize: "15px", fontFamily: "inherit" },

  splitLayout: { width: "100%", display: "flex", flexDirection: "column" },
  leftPanel: { display: "flex", flexDirection: "column", gap: "12px", width: "100%" },
  skeleton: { background: "linear-gradient(90deg,#f1f3f4 25%,#e8eaed 50%,#f1f3f4 75%)", backgroundSize: "200%", animation: "shimmer 1.5s infinite", height: "140px", border: "1px solid #dadce0", borderRadius: "8px" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 24px", textAlign: "center" },
  emptyTitle: { color: "#202124", fontSize: "20px", fontWeight: "400", margin: "0 0 8px" },
  emptySub: { color: "#5f6368", fontSize: "15px", margin: "0 0 24px" },
  outlineBtn: { background: "#fff", color: "#1a73e8", border: "1px solid #dadce0", outline: "none", borderRadius: "24px", padding: "12px 28px", fontSize: "15px", fontWeight: "500", cursor: "pointer", textDecoration: "none", display: "inline-block" },

  jobListWrapper: { display: "flex", flexDirection: "column", background: "transparent", borderBottom: "none", borderRadius: "8px", overflow: "hidden" },
  jobListItem: { padding: "20px 0", cursor: "pointer", position: "relative", borderBottom: "1px solid #dadce0" },
  jobListItemInner: { display: "flex", alignItems: "center", gap: "16px", width: "100%" },
  
  jobListLogo: { width: "75px", height: "75px", borderRadius: "50px", overflow: "hidden", flexShrink: 0, background: "#fff" },
  jobListLogoImg: { width: "100%", height: "100%", objectFit: "contain" },
  jobListLogoPlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: "16px" },

  jobListCenter: { flex: 1, minWidth: 0 },
  jobListItemTitle: { color: "#000000", fontSize: "clamp(16px, 2.5vw, 24px)", fontWeight: "500", margin: "0 0 5px", lineHeight: "1.3", WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" },
  jobListItemSub: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px", color: "#5f6368", fontSize: "21px", fontWeight: "400", WebkitFontSmoothing: "antialiased" },
  jobListItemDept: { color: "#004599", fontWeight: "500" }, 
  jobListItemSeparator: { color: "#dadce0" },
  jobListItemLocation: { color: "#004599", fontWeight: "500" },

  jobListArrow: { display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, paddingLeft: "12px", color: "#9aa0a6" },

  pagination: { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "20px", padding: "16px", border: "1px solid #dadce0", borderRadius: "8px", background: "#fff" },
  paginationBtn: { border: "none", background: "#f1f3f4", color: "#5f6368", fontWeight: "500", fontSize: "14px", padding: "8px 14px", borderRadius: "20px", cursor: "pointer" },
  paginationBtnActive: { background: "#1a73e8", color: "#fff" },

  // Mobile filter drawer (Animated version)
  drawerOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 299 },
  mobileDrawer: { position: "fixed", top: 0, right: 0, bottom: 0, width: "100%", maxWidth: "340px", background: "#fff", zIndex: 300, display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(0,0,0,0.15)", overflowY: "auto" },
  mobileDrawerHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 24px 20px", borderBottom: "1px solid #f1f3f4" },
  mobileDrawerTitle: { color: "#000", fontSize: "20px", fontWeight: "600", fontFamily: "inherit" },
  mobileDrawerClose: { background: "#f1f3f4", border: "none", borderRadius: "50%", cursor: "pointer", padding: "8px", display: "flex", alignItems: "center", justifyContent: "center" },
  mobileDrawerBody: { flex: 1, overflowY: "auto", paddingBottom: "24px" },
  mobileDrawerGroup: { padding: "24px 24px 0" },
  mobileDrawerLabel: { color: "#004598", fontSize: "14px", fontWeight: "600", margin: "0 0 10px" },
  mobileDrawerSelect: { width: "100%", background: "#f8f9fa", border: "2px solid #e0e0e0", borderRadius: "4px", padding: "14px 40px 14px 16px", fontSize: "16px", color: "#202124", outline: "none", cursor: "pointer", fontFamily: "inherit", appearance: "none" },
  selectArrow: { position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex" },
  mobileDrawerFooter: { padding: "24px", display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid #f1f3f4", background: "#fff" },
  mobileDrawerApply: { background: "#1a73e8", color: "#fff", border: "none", borderRadius: "50px", padding: "16px", fontSize: "16px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },
  mobileDrawerClear: { background: "none", border: "none", color: "#c5221f", fontSize: "15px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", textAlign: "center", padding: "8px" },
};