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
  // FIX 3: Mobile filter drawer state
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const detailRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 10;

  useEffect(() => { fetchJobs(); }, [sortBy]);

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
    setFilterIndustry(""); setFilterSalary(""); setOpenDropdown(null);
    setMobileFilterOpen(false);
  };
  const hasFilters = search || filterProvince || filterType || filterIndustry || filterSalary;
  const activeFilterCount = [filterProvince, filterType, filterIndustry, filterSalary].filter(Boolean).length;

  return (
    <div className="page-wrapper" style={s.page}>

      {/* ── Navbar ── */}
      <Navbar />

      {/* ── Hero Section ── */}
      <div style={s.heroSection}>
        <div style={s.heroInner}>
          <h1 className="hero-title" style={s.heroTitle}>Discover High-End Professional Opportunities.</h1>
          <p className="hero-subtitle" style={s.heroSubtitle}>Connect with verified enterprises across South Africa in a streamlined, premium ecosystem built for your career advancement.</p>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div style={s.searchContainer}>
        <div className="search-bar-inner" style={s.searchBarInner}>
          <div style={s.searchLeft}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              style={s.searchInput}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by job title, keyword, or company..."
            />
            {search && (
              <button style={s.searchClear} onClick={() => setSearch("")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
          <div className="search-divider" style={s.searchDivider} />
          <div style={s.searchRight}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2" style={{ flexShrink: 0 }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <select style={s.provinceSelect} value={filterProvince} onChange={e => setFilterProvince(e.target.value)}>
              <option value="">All Regions</option>
              {PROVINCES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <button style={s.searchBtn} onClick={() => {}}>Search</button>
        </div>
      </div>

      {/* ── Filter Bar (desktop) ── */}
      <div style={s.filterRow} onClick={closeDropdown}>
        <div className="filter-scroll-container desktop-filters" style={s.filterRowInner}>

          <FilterTab
            label="Job Type" value={filterType} options={JOB_TYPES}
            open={openDropdown === "type"}
            onToggle={e => { e.stopPropagation(); setOpenDropdown(openDropdown === "type" ? null : "type"); }}
            onSelect={v => { setFilterType(v); setOpenDropdown(null); }}
            onClear={() => { setFilterType(""); setOpenDropdown(null); }}
          />
          <FilterTab
            label="Province" value={filterProvince} options={PROVINCES}
            open={openDropdown === "province"}
            onToggle={e => { e.stopPropagation(); setOpenDropdown(openDropdown === "province" ? null : "province"); }}
            onSelect={v => { setFilterProvince(v); setOpenDropdown(null); }}
            onClear={() => { setFilterProvince(""); setOpenDropdown(null); }}
          />
          <FilterTab
            label="Industry" value={filterIndustry} options={INDUSTRIES}
            open={openDropdown === "industry"}
            onToggle={e => { e.stopPropagation(); setOpenDropdown(openDropdown === "industry" ? null : "industry"); }}
            onSelect={v => { setFilterIndustry(v); setOpenDropdown(null); }}
            onClear={() => { setFilterIndustry(""); setOpenDropdown(null); }}
          />
          <FilterTab
            label="Salary" value={filterSalary}
            options={["R0 – R10k", "R10k – R20k", "R20k – R35k", "R35k – R50k", "R50k – R75k", "R75k+", "Market Related"]}
            open={openDropdown === "salary"}
            onToggle={e => { e.stopPropagation(); setOpenDropdown(openDropdown === "salary" ? null : "salary"); }}
            onSelect={v => { setFilterSalary(v); setOpenDropdown(null); }}
            onClear={() => { setFilterSalary(""); setOpenDropdown(null); }}
          />
          <FilterTab
            label="Sort"
            value={sortBy === "oldest" ? "Oldest First" : "Newest First"}
            options={["Newest First", "Oldest First"]}
            open={openDropdown === "sort"}
            onToggle={e => { e.stopPropagation(); setOpenDropdown(openDropdown === "sort" ? null : "sort"); }}
            onSelect={v => { setSortBy(v === "Oldest First" ? "oldest" : "newest"); setOpenDropdown(null); }}
            isSort
          />
          {hasFilters && (
            <div className="clear-btn-wrap">
              <button style={s.clearBtn} onClick={clearFilters}>✕ Clear</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Panel ── */}
      <div style={s.mainSection}>
        <div className="main-inner" style={s.mainInner}>

          {/* Results row — desktop shows count, mobile shows count + filter button */}
          <div className="results-header-mobile" style={s.resultsRow}>
            {mobileView === "detail" ? (
              <button style={s.mobileBackBtn} onClick={() => setMobileView("list")}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                Back to results
              </button>
            ) : (
              <>
                <span style={s.resultsCount}>
                  <strong>{filtered.length}</strong> {filtered.length === 1 ? "job" : "jobs"} available
                  {filterProvince && <span style={s.resultsLocation}> in {filterProvince}</span>}
                </span>
                {/* Mobile filter button — only visible on mobile via CSS */}
                <button
                  className="mobile-filter-btn"
                  style={s.mobileFilterBtn}
                  onClick={() => setMobileFilterOpen(true)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                  Filters
                  {activeFilterCount > 0 && (
                    <span style={s.mobileFilterBadge}>{activeFilterCount}</span>
                  )}
                </button>
              </>
            )}
          </div>

          <div className="split-layout" style={s.splitLayout}>

            {/* ── Left: Job List ── */}
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
                      className={`job-list-item-hover${selectedJob?.id === job.id ? " job-list-item-selected" : ""}`}
                      style={{ ...s.jobListItem, ...(selectedJob?.id === job.id ? s.jobListItemActive : {}) }}
                      onClick={() => handleSelectJob(job)}
                    >
                      <h3 style={s.jobListItemTitle}>{job.title}</h3>
                      <div style={s.jobListItemSub}>
                        {/* FIX 1: Show employerName instead of department */}
                        <span style={s.jobListItemDept}>{job.employerName}</span>
                        <span style={s.jobListItemSeparator}> | </span>
                        <span style={s.jobListItemLocation}>{job.city}, {job.province}</span>
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

            {/* ── Right: Detail Panel ── */}
            <div ref={detailRef} className={`right-panel ${mobileView === "list" ? "hide-on-mobile" : "show-detail"}`} style={s.rightPanel}>
              {!selectedJob ? (
                <div style={s.detailEmpty}>
                  <p style={{ color: "#80868b", fontSize: "14px" }}>Select a position to view details</p>
                </div>
              ) : (
                <div style={s.detailContent}>
                  {/* Mobile back button — sticky at top of detail panel */}
                  <div className="mobile-back-btn-wrap" style={{ display: "none" }}>
                    <button style={s.mobileBackBtn} onClick={() => setMobileView("list")}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                      Back to results
                    </button>
                  </div>
                  <div style={s.detailHead}>
                    <div style={s.detailHeadTop}>
                      <div style={s.detailLogo}>
                        {selectedJob.logoUrl
                          ? <img src={selectedJob.logoUrl} alt={selectedJob.employerName} style={s.detailLogoImg} />
                          : <div style={{ ...s.detailLogoPlaceholder, background: selectedJob.brandColour || "#f1f3f4", color: selectedJob.brandColour ? "#fff" : "#5f6368" }}>{selectedJob.employerName?.[0]}</div>
                        }
                      </div>
                      <div style={s.detailHeadInfo}>
                        <div style={s.detailEmployer}>{selectedJob.employerName}</div>
                        <h2 style={s.detailTitle}>{selectedJob.title}</h2>
                      </div>
                    </div>
                    <div style={s.detailMeta}>
                      <span style={s.detailMetaItem}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {selectedJob.city}, {selectedJob.province}
                      </span>
                      {selectedJob.salary && (
                        <span style={s.detailMetaItem}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                          {selectedJob.salary}
                        </span>
                      )}
                      <span style={s.detailMetaItem}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                        {selectedJob.type}
                      </span>
                      {selectedJob.remote && <span style={s.remoteBadge}>Remote</span>}
                    </div>
                    <div className="detail-actions-mobile" style={s.detailActions}>
                      <button style={s.applyBtn} onClick={() => navigate(`/apply/${selectedJob.id}`)}>Apply Now</button>
                      <button style={s.saveDetailBtn} onClick={e => toggleSave(e, selectedJob.id)}>
                        {savedJobs.includes(selectedJob.id)
                          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="#1a73e8" stroke="#1a73e8" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                          : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        }
                      </button>
                    </div>
                  </div>

                  <div style={s.detailScrollArea}>
                    {selectedJob.description && (
                      <div style={s.detailSection}>
                        <div style={s.detailSectionTitle}>Description</div>
                        <p style={s.detailText}>{selectedJob.description}</p>
                      </div>
                    )}
                    {selectedJob.responsibilities?.length > 0 && (
                      <div style={s.detailSection}>
                        <div style={s.detailSectionTitle}>Responsibilities</div>
                        {selectedJob.responsibilities.map((r, i) => (
                          <div key={i} style={s.detailBullet}>
                            <span style={s.detailBulletDot}>•</span>
                            <span style={s.detailText}>{r}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedJob.requirements?.length > 0 && (
                      <div style={s.detailSection}>
                        <div style={s.detailSectionTitle}>Requirements</div>
                        {selectedJob.requirements.map((r, i) => (
                          <div key={i} style={s.detailBullet}>
                            <span style={s.detailBulletDot}>•</span>
                            <span style={s.detailText}>{r}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedJob.niceToHaves?.length > 0 && (
                      <div style={s.detailSection}>
                        <div style={s.detailSectionTitle}>Nice to Have</div>
                        {selectedJob.niceToHaves.map((r, i) => (
                          <div key={i} style={s.detailBullet}>
                            <span style={s.detailBulletDot}>•</span>
                            <span style={s.detailText}>{r}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedJob.specialNotes && (
                      <div style={s.detailSection}>
                        <div style={s.detailSectionTitle}>Special Notes</div>
                        <div style={s.specialNote}>{selectedJob.specialNotes}</div>
                      </div>
                    )}
                    <div style={s.detailCloses}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      Application closes <strong>{selectedJob.closes}</strong>
                    </div>
                    <button style={s.fullDetailsBtn} onClick={() => navigate(`/jobs/${selectedJob.id}`)}>
                      View Full Specification →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── For Employers ── */}
      <div className="vt-pricing-wrapper">
        <div className="vt-pricing-bg-graphic" />
        <div className="vt-pricing-container">
          <h2 className="vt-pricing-headline">
            Hiring infrastructure built<br />for South African enterprises
          </h2>
          <div className="vt-pricing-grid">
            <div className="vt-pricing-card vt-card-standard">
              <div className="vt-card-left">
                <h3 className="vt-card-title">Spark Plan</h3>
                <p className="vt-card-desc">
                  Access verified job seekers across South Africa with simple, transparent pricing. No setup fees, no contracts. Pay only for active listings.
                </p>
                <Link to="/employer/join" className="vt-btn vt-btn-blue">
                  Apply for Access
                  <svg className="vt-btn-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M5.25 10.5L8.75 7L5.25 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
              <div className="vt-card-price-right">
                <div className="vt-price-large">R450 / mo</div>
                <div className="vt-price-sub">per live job listing, billed monthly</div>
              </div>
            </div>
            <div className="vt-pricing-card vt-card-enterprise">
              <div className="vt-card-left vt-card-left-dark">
                <h3 className="vt-card-title vt-text-white">Enterprise Access</h3>
                <p className="vt-card-desc vt-text-muted">
                  A tailored recruitment strategy for enterprises with high-volume hiring needs, dedicated account management, and bespoke onboarding.
                </p>
                <Link to="/employer/join" className="vt-btn vt-btn-yellow">
                  Contact Us
                  <svg className="vt-btn-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M5.25 10.5L8.75 7L5.25 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
              <div className="vt-card-features-right">
                <ul className="vt-feature-list">
                  <li className="vt-feature-item">Dedicated Account Manager</li>
                  <li className="vt-feature-item">CIPC Verified Employer Badge</li>
                  <li className="vt-feature-item">Priority Candidate Matching</li>
                  <li className="vt-feature-item vt-item-last">National Multi-Province Reach</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <Footer />

      {/* FIX 3: Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <>
          <div style={s.drawerOverlay} onClick={() => setMobileFilterOpen(false)} />
          <div style={s.mobileDrawer}>
            <div style={s.mobileDrawerHeader}>
              <span style={s.mobileDrawerTitle}>Filters</span>
              <button style={s.mobileDrawerClose} onClick={() => setMobileFilterOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#202124" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Job Type */}
            <div style={s.mobileDrawerGroup}>
              <div style={s.mobileDrawerLabel}>Job Type</div>
              <select style={s.mobileDrawerSelect} value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="">All Types</option>
                {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            {/* Province */}
            <div style={s.mobileDrawerGroup}>
              <div style={s.mobileDrawerLabel}>Province</div>
              <select style={s.mobileDrawerSelect} value={filterProvince} onChange={e => setFilterProvince(e.target.value)}>
                <option value="">All Provinces</option>
                {PROVINCES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            {/* Industry */}
            <div style={s.mobileDrawerGroup}>
              <div style={s.mobileDrawerLabel}>Industry</div>
              <select style={s.mobileDrawerSelect} value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)}>
                <option value="">All Industries</option>
                {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>

            {/* Salary */}
            <div style={s.mobileDrawerGroup}>
              <div style={s.mobileDrawerLabel}>Salary Range</div>
              <select style={s.mobileDrawerSelect} value={filterSalary} onChange={e => setFilterSalary(e.target.value)}>
                <option value="">Any Salary</option>
                {["R0 – R10k","R10k – R20k","R20k – R35k","R35k – R50k","R50k – R75k","R75k+","Market Related"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            {/* Sort */}
            <div style={s.mobileDrawerGroup}>
              <div style={s.mobileDrawerLabel}>Sort By</div>
              <select style={s.mobileDrawerSelect} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
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
        button, div, a { -webkit-tap-highlight-color: transparent !important; }

        .page-wrapper { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #dadce0; border-radius: 4px; }

        .job-list-item-hover { will-change: auto !important; transform: none !important; backface-visibility: visible !important; outline: none !important; }
        .job-list-item-hover:hover:not(.job-list-item-selected) { background-color: #f8f9fa !important; }
        .job-list-item-selected { outline: none !important; }

        .filter-tab-wrap { will-change: auto !important; }
        .filter-tab-wrap button { will-change: auto !important; transform: none !important; -webkit-font-smoothing: antialiased !important; }
        .filter-tab-wrap button:hover { background: #f8f9fa !important; }

        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* ── Desktop: hide mobile filter button and mobile back btn ── */
        .mobile-filter-btn { display: none !important; }
        .mobile-back-btn-wrap { display: none !important; }

        /* ── Mobile: show back button inside detail panel ── */
        @media (max-width: 900px) {
          .show-detail .mobile-back-btn-wrap { display: block !important; }
        }

        /* ── Tablet / Mobile ── */
        @media (max-width: 900px) {
          .split-layout { grid-template-columns: 1fr !important; gap: 0 !important; }
          .hide-on-mobile { display: none !important; }
          .results-header-mobile {
            background: #fff;
            padding: 12px 16px;
            margin-bottom: 0 !important;
            position: sticky;
            top: 56px;
            z-index: 10;
            border-bottom: 1px solid #f1f3f4;
            margin-left: -16px;
            margin-right: -16px;
          }
          /* Right panel — full screen on mobile */
          .right-panel {
            position: fixed !important;
            inset: 0 !important;
            top: 0 !important;
            max-height: 50dvh !important;
            border-radius: 0 !important;
            border: none !important;
            z-index: 200;
          }
        }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .desktop-filters { display: none !important; }
          .mobile-filter-btn { display: flex !important; }
          .results-header-mobile { display: flex; align-items: center; justify-content: space-between; width: 100%; }

          /* Hero */
          .hero-title { font-size: 26px !important; line-height: 1.25 !important; }
          .hero-subtitle { font-size: 14px !important; }

          /* Search bar — stack vertically */
          .search-bar-inner {
            flex-direction: column !important;
            padding: 12px !important;
            border-radius: 16px !important;
            gap: 0 !important;
            align-items: stretch !important;
          }
          .search-bar-inner > div:first-child {
            padding: 4px 0 !important;
          }
          .search-divider {
            width: 100% !important;
            height: 1px !important;
            margin: 8px 0 !important;
          }
          .search-bar-inner > div:last-of-type {
            padding: 4px 0 !important;
          }
          .search-bar-inner button {
            width: 100% !important;
            border-radius: 10px !important;
            margin-top: 10px !important;
            padding: 14px !important;
            font-size: 15px !important;
          }

          /* Main inner padding */
          .main-inner { padding: 0 20px 48px !important; }

          /* Job list cards */
          .job-list-item-hover { padding: 16px 0 !important; }

          /* Detail panel mobile — full screen with back button */
          .right-panel {
            position: fixed !important;
            inset: 0 !important;
            max-height: 100dvh !important;
            border-radius: 0 !important;
            border: none !important;
            z-index: 200;
            overflow-y: auto !important;
          }

          /* Back button on mobile detail */
          .mobile-back-btn-wrap {
            position: sticky;
            top: 0;
            background: #fff;
            padding: 15px 20px;
            border-bottom: 1px solid #dadce0;
            z-index: 10;
          }
        }

        /* ── Small phones ── */
        @media (max-width: 480px) {
          .detail-actions-mobile {
            flex-direction: column !important;
            width: 100% !important;
            gap: 10px !important;
          }
          .detail-actions-mobile a,
          .detail-actions-mobile button {
            width: 100% !important;
            justify-content: center !important;
            text-align: center !important;
            box-sizing: border-box !important;
          }
          .hero-title { font-size: 22px !important; }
          .main-inner { padding: 0 12px 40px !important; }
        }

        /* ── Employer Pricing Section ── */
        .vt-pricing-wrapper {
          font-family: "Circular Std", "Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          position: relative; overflow: hidden;
          background-color: #f4f5f7; padding: 80px 20px 120px;
        }
        .vt-pricing-bg-graphic {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 1;
          background-image: linear-gradient(to right, rgba(0,0,0,0.025) 1px, transparent 1px);
          background-size: 150px 100%;
        }
        .vt-pricing-bg-graphic::after {
          content: ''; position: absolute; left: -10%; right: -10%; bottom: 10%; height: 400px;
          background: linear-gradient(135deg, #ffca28 0%, #ff8f00 30%, #d84315 65%, #b71c1c 100%);
          transform: skewY(-8deg); opacity: 0.85; z-index: -1; pointer-events: none;
        }
        .vt-pricing-container { position: relative; z-index: 2; max-width: 1200px; margin: 0 auto; padding: 50px 20px 0; }
        .vt-pricing-headline { font-size: 48px; font-weight: 500; line-height: 1.15; color: #202124; margin-bottom: 56px; font-family: inherit; }
        .vt-pricing-grid { display: flex; flex-wrap: wrap; gap: 28px; }
        .vt-pricing-card { display: flex; border-radius: 8px; overflow: hidden; min-height: 280px; flex: 1 1 400px; }
        .vt-card-standard { background: #ffffff; }
        .vt-card-enterprise { background: #202124; }
        .vt-card-left { padding: 40px; flex: 1.4; display: flex; flex-direction: column; justify-content: space-between; }
        .vt-card-left-dark { padding-right: 56px; }
        .vt-card-price-right { background: #f4f5f7; padding: 40px; margin: 6px; flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; border-radius: 4px; }
        .vt-price-large { font-size: 30px; font-weight: 700; color: #202124; margin-bottom: 8px; font-family: inherit; }
        .vt-price-sub { font-size: 15px; line-height: 1.5; color: #5f6368; font-family: inherit; }
        .vt-card-features-right { flex: 1; background: rgba(255,255,255,0.08); display: flex; flex-direction: column; margin: 6px; border-radius: 4px; }
        .vt-feature-list { list-style: none; height: 100%; display: flex; flex-direction: column; margin: 0; padding: 0; }
        .vt-feature-item { flex: 1; display: flex; align-items: center; padding: 0 28px; font-size: 15px; font-weight: 400; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.12); font-family: inherit; }
        .vt-item-last { border-bottom: none; }
        .vt-card-title { font-size: 22px; font-weight: 700; margin-bottom: 14px; color: #202124; font-family: inherit; }
        .vt-text-white { color: #ffffff !important; }
        .vt-card-desc { font-size: 15px; line-height: 1.65; color: #5f6368; margin-bottom: 28px; font-family: inherit; }
        .vt-text-muted { color: #9aa0a6 !important; }
        .vt-btn { display: inline-flex; align-items: center; padding: 11px 22px; border-radius: 24px; font-weight: 600; font-size: 14px; text-decoration: none; width: fit-content; transition: transform 0.15s ease, box-shadow 0.15s ease; font-family: inherit; }
        .vt-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .vt-btn-blue { background: #1a73e8; color: #ffffff; }
        .vt-btn-yellow { background: #ffca28; color: #202124; }
        .vt-btn-icon { margin-left: 8px; transition: transform 0.15s ease; }
        .vt-btn:hover .vt-btn-icon { transform: translateX(3px); }

        @media (max-width: 900px) {
          .vt-pricing-headline { font-size: 38px; margin-bottom: 44px; }
          .vt-pricing-grid { flex-direction: column; gap: 20px; }
          .vt-pricing-card { min-height: auto; }
          .vt-card-left { padding: 32px; }
          .vt-card-left-dark { padding-right: 32px; }
          .vt-card-price-right { padding: 32px; }
        }
        @media (max-width: 600px) {
          .vt-pricing-wrapper { padding: 60px 16px 80px; }
          .vt-pricing-headline { font-size: 26px; margin-bottom: 32px; line-height: 1.2; }
          .vt-pricing-card { flex-direction: column; }
          .vt-card-left { padding: 28px 24px; }
          .vt-card-left-dark { padding-right: 24px; }
          .vt-card-price-right { margin: 0; border-top: 1px solid rgba(0,0,0,0.07); padding: 24px; border-radius: 0; }
          .vt-card-features-right { margin: 0; border-radius: 0; border-top: 1px solid rgba(255,255,255,0.12); }
          .vt-price-large { font-size: 26px; }
          .vt-feature-item { padding: 16px 20px; font-size: 14px; }
          .vt-btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
}

// ── FilterTab — desktop dropdown ──────────────────────────
function FilterTab({ label, value, options, open, onToggle, onSelect, onClear, isSort }) {
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
          {!isSort && (
            <button style={ft.optionClear} onClick={onClear}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Clear
            </button>
          )}
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
  tabWrap: { position: "relative", marginTop: "10px" },
  tab: {
    position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "#f4f4f4", border: "2px solid #939393", borderRadius: "4px", outline: "none",
    padding: "10px 14px", cursor: "pointer", minWidth: "160px", gap: "12px",
    fontFamily: '"Circular Std", "Circular", -apple-system, sans-serif',
    // FIX 2: No transition on the tab itself to prevent blur
    transition: "border-color 0.15s",
    WebkitFontSmoothing: "antialiased",
  },
  tabActive: { borderColor: "#1967d2" },
  tabLabel: {
    position: "absolute", top: "-8px", left: "10px", background: "#f4f4f4",
    padding: "0 4px", fontSize: "14px", fontWeight: "400", color: "#0058aa",
    lineHeight: 1, zIndex: 1,
    // FIX 2: No transition on label text
    WebkitFontSmoothing: "antialiased",
  },
  tabLabelActive: { color: "#1967d2" },
  tabValue: { fontSize: "15px", fontWeight: "400", color: "#5f6368", lineHeight: 1.4, whiteSpace: "nowrap", WebkitFontSmoothing: "antialiased" },
  tabValueActive: { color: "#202124" },
  dropdown: {
    position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 100,
    background: "#f4f4f4", border: "2px solid #939393", borderRadius: "4px", outline: "none",
    boxShadow: "0 4px 16px rgba(60,64,67,0.18)", minWidth: "200px",
    maxHeight: "280px", overflowY: "auto", padding: "4px",
    display: "flex", flexDirection: "column",
  },
  option: {
    display: "flex", alignItems: "center", gap: "8px", outline: "none",
    background: "none", border: "none", width: "100%", textAlign: "left",
    padding: "9px 14px", fontSize: "16px", fontWeight: "400", color: "#000000",
    cursor: "pointer", borderRadius: "4px",
    fontFamily: '"Circular Std", "Circular", -apple-system, sans-serif',
    WebkitFontSmoothing: "antialiased",
  },
  optionActive: { color: "#1967d2", fontWeight: "600", background: "#f0f4ff" },
  optionClear: {
    display: "flex", alignItems: "center", gap: "6px", outline: "none",
    background: "none", border: "none", borderBottom: "1px solid #f1f3f4",
    width: "100%", textAlign: "left", padding: "8px 14px 10px",
    fontSize: "13px", fontWeight: "500", color: "#9aa0a6", cursor: "pointer",
    fontFamily: '"Circular Std", "Circular", -apple-system, sans-serif',
    marginBottom: "4px",
  },
};

const s = {
  page: { background: "#f4f4f4", minHeight: "100vh", fontFamily: '"Circular Std", "Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: "#202124" },

  heroSection: { background: "#f4f4f4", padding: "clamp(90px, 15vw, 128px) clamp(16px, 4vw, 24px) 40px", textAlign: "center" },
  heroInner: { maxWidth: "800px", margin: "0 auto" },
  heroTitle: { color: "#000000", fontSize: "clamp(22px, 5vw, 44px)", fontWeight: "400", margin: "0 0 16px", letterSpacing: "-0.5px", lineHeight: "1.2" },
  heroSubtitle: { color: "#5f6368", fontSize: "clamp(14px, 2.5vw, 18px)", lineHeight: "1.6", margin: "0" },

  searchContainer: { background: "#f4f4f4", padding: "16px clamp(12px, 4vw, 24px) 32px", position: "relative", zIndex: 10 },
  searchBarInner: { maxWidth: "900px", margin: "0 auto", display: "flex", alignItems: "center", background: "#fff", borderRadius: "32px", boxShadow: "0 1px 6px rgba(32,33,36,0.28)", padding: "8px 8px 8px 20px" },
  searchLeft: { flex: 2, display: "flex", alignItems: "center", gap: "12px", minWidth: 0 },
  searchInput: { flex: 1, border: "none", outline: "none", fontSize: "16px", color: "#202124", background: "transparent", fontFamily: "inherit", padding: "12px 0" },
  searchClear: { background: "none", border: "none", outline: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" },
  searchDivider: { width: "1px", height: "32px", background: "#dadce0", flexShrink: 0, margin: "0 16px" },
  searchRight: { flex: 1, display: "flex", alignItems: "center", gap: "12px", minWidth: 0 },
  provinceSelect: { flex: 1, border: "none", outline: "none", fontSize: "16px", color: "#3c4043", background: "transparent", cursor: "pointer", fontFamily: "inherit", padding: "12px 0", appearance: "none" },
  searchBtn: { background: "#1a73e8", color: "#fff", border: "none", outline: "none", padding: "14px 32px", fontSize: "15px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, borderRadius: "24px" },

  filterRow: { background: "#f4f4f4", padding: "0 24px" },
  filterRowInner: { maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", flexWrap: "wrap", paddingBottom: "16px" },
  clearBtn: { color: "#c5221f", background: "none", outline: "none", fontSize: "14px", fontWeight: "500", cursor: "pointer", padding: "10px 16px", fontFamily: "inherit", alignSelf: "center", marginTop: "10px" },

  mainSection: { flex: 1, background: "#f4f4f4", paddingTop: "24px" },
  mainInner: { maxWidth: "1200px", margin: "0 auto", padding: "0 clamp(12px, 3vw, 24px) 64px" },

  resultsRow: { marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  resultsCount: { color: "#5f6368", fontSize: "14px" },
  resultsLocation: { color: "#202124", fontWeight: "500" },
  mobileBackBtn: { display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", outline: "none", color: "#0099fa", fontSize: "15px", fontWeight: "500", cursor: "pointer", fontFamily: "inherit", padding: 0 },

  // FIX 3: Mobile filter button style
  mobileFilterBtn: { display: "none", alignItems: "center", gap: "7px", background: "#fff", border: "1px solid #dadce0", borderRadius: "20px", padding: "8px 16px", fontSize: "14px", color: "#202124", cursor: "pointer", fontFamily: "inherit", fontWeight: "500" },
  mobileFilterBadge: { background: "#1a73e8", color: "#fff", borderRadius: "50%", width: "18px", height: "18px", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" },

  splitLayout: { display: "grid", gridTemplateColumns: "380px 1fr", gap: "24px", alignItems: "start" },
  leftPanel: { display: "flex", flexDirection: "column", gap: "12px" },
  rightPanel: { position: "sticky", top: "76px", background: "#f4f4f4", border: "2px solid #dadce0", outline: "none", borderRadius: "8px", overflow: "hidden", maxHeight: "calc(100vh - 96px)", display: "flex", flexDirection: "column" },
  skeleton: { background: "linear-gradient(90deg,#f1f3f4 25%,#e8eaed 50%,#f1f3f4 75%)", backgroundSize: "200%", animation: "shimmer 1.5s infinite", height: "140px", border: "1px solid #dadce0", borderRadius: "8px" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 24px", textAlign: "center" },
  emptyTitle: { color: "#202124", fontSize: "20px", fontWeight: "400", marginBottom: "8px" },
  emptySub: { color: "#5f6368", fontSize: "15px", marginBottom: "24px" },

  // FIX 1 + FIX 2: Job list items — crisp text, company name shown
  jobListWrapper: { display: "flex", flexDirection: "column", background: "transparent", borderBottom: "none", borderRadius: "8px", overflow: "hidden" },
  jobListItem: { padding: "20px 0", cursor: "pointer", position: "relative", borderBottom: "1px solid #a6a6a6" },
  jobListItemActive: { background: "#f8f9fa !important", outline: "none" },
  // FIX 2: Explicit font rendering properties on text elements
  jobListItemTitle: { color: "#000000", fontSize: "clamp(17px, 2.5vw, 24px)", fontWeight: "500", margin: "0 0 4px", letterSpacing: "0.2px", lineHeight: "1.3", WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" },
  jobListItemSub: { display: "flex", alignItems: "center", gap: "6px", color: "#5f6368", fontSize: "clamp(13px, 2vw, 18px)", fontWeight: "400", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", WebkitFontSmoothing: "antialiased" },
  jobListItemDept: { color: "#004599", fontWeight: "500" }, // FIX 1: now shows company name
  jobListItemSeparator: { color: "#9aa0a6" },
  jobListItemLocation: { color: "#004599", fontWeight: "500" },

  jobCardFoot: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", borderTop: "1px solid #f1f3f4", paddingTop: "10px", marginTop: "4px" },
  jobType: { background: "#f1f3f4", color: "#3c4043", borderRadius: "4px", padding: "4px 8px", fontSize: "12px", fontWeight: "500" },
  remoteBadge: { background: "#e8f0fe", color: "#1967d2", borderRadius: "4px", padding: "4px 8px", fontSize: "12px", fontWeight: "500" },

  detailEmpty: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "500px", textAlign: "center", background: "#f8f9fa", flex: 1 },
  detailContent: { padding: "0", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" },
  detailHead: { padding: "32px", borderBottom: "1px solid #dadce0", background: "#fff", flexShrink: 0 },
  detailHeadTop: { display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "16px" },
  detailLogo: { width: "56px", height: "56px", borderRadius: "8px", overflow: "hidden", border: "1px solid #dadce0", flexShrink: 0 },
  detailLogoImg: { width: "100%", height: "100%", objectFit: "contain" },
  detailLogoPlaceholder: { width: "56px", height: "56px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "500", fontSize: "20px" },
  detailHeadInfo: { flex: 1, marginTop: "2px", minWidth: 0 },
  detailEmployer: { color: "#1a73e8", fontSize: "13px", fontWeight: "500", marginBottom: "3px" },
  detailTitle: { color: "#202124", fontSize: "20px", fontWeight: "600", margin: "0 0 0", lineHeight: "1.3", letterSpacing: "-0.3px" },
  detailMeta: { display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "24px" },
  detailMetaItem: { display: "flex", alignItems: "center", gap: "8px", color: "#5f6368", fontSize: "15px" },
  detailActions: { display: "flex", gap: "12px", alignItems: "center" },
  applyBtn: { background: "#1a73e8", color: "#fff", border: "none", outline: "none", borderRadius: "24px", padding: "12px 28px", fontSize: "15px", fontWeight: "500", cursor: "pointer", fontFamily: "inherit", textDecoration: "none", display: "inline-block" },
  saveDetailBtn: { height: "46px", padding: "0 24px", border: "1px solid #dadce0", outline: "none", borderRadius: "24px", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  outlineBtn: { background: "#fff", color: "#1a73e8", border: "1px solid #dadce0", outline: "none", borderRadius: "24px", padding: "12px 28px", fontSize: "15px", fontWeight: "500", cursor: "pointer", textDecoration: "none", display: "inline-block" },
  detailScrollArea: { flex: 1, overflowY: "auto" },
  detailSection: { padding: "24px 32px 0" },
  detailSectionTitle: { color: "#202124", fontSize: "18px", fontWeight: "500", marginBottom: "16px" },
  detailText: { color: "#3c4043", fontSize: "15px", lineHeight: "1.6", margin: 0 },
  detailBullet: { display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" },
  detailBulletDot: { color: "#5f6368", fontSize: "14px", marginTop: "2px" },
  specialNote: { background: "#e8f0fe", padding: "16px 20px", color: "#202124", fontSize: "15px", lineHeight: "1.6", borderRadius: "8px" },
  detailCloses: { display: "flex", alignItems: "center", gap: "8px", color: "#5f6368", fontSize: "14px", padding: "32px", borderTop: "1px solid #dadce0", marginTop: "32px", background: "#f8f9fa" },
  fullDetailsBtn: { background: "#fff", border: "none", outline: "none", borderTop: "1px solid #dadce0", color: "#1a73e8", padding: "20px", fontSize: "15px", fontWeight: "500", cursor: "pointer", fontFamily: "inherit", width: "100%", display: "block" },

  pagination: { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "20px", padding: "16px", border: "1px solid #dadce0", borderRadius: "8px", background: "#fff" },
  paginationBtn: { border: "none", background: "#f1f3f4", color: "#5f6368", fontWeight: "500", fontSize: "14px", padding: "8px 14px", borderRadius: "20px", cursor: "pointer" },
  paginationBtnActive: { background: "#1a73e8", color: "#fff" },

  // FIX 3: Mobile filter drawer
  drawerOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 299 },
  mobileDrawer: { position: "fixed", top: 0, left: 0, bottom: 0, width: "300px", background: "#fff", zIndex: 300, display: "flex", flexDirection: "column", boxShadow: "4px 0 24px rgba(0,0,0,0.15)", overflowY: "auto" },
  mobileDrawerHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 16px", borderBottom: "1px solid #f1f3f4" },
  mobileDrawerTitle: { color: "#000", fontSize: "17px", fontWeight: "600", fontFamily: "inherit" },
  mobileDrawerClose: { background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" },
  mobileDrawerGroup: { padding: "16px 20px 0" },
  mobileDrawerLabel: { color: "#004598", fontSize: "14px", fontWeight: "500", marginBottom: "8px" },
  mobileDrawerSelect: { width: "100%", background: "#f8f9fa", border: "2px solid #e0e0e0", borderRadius: "4px", padding: "11px 14px", fontSize: "15px", color: "#202124", outline: "none", cursor: "pointer", fontFamily: "inherit" },
  mobileDrawerFooter: { padding: "20px", marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid #f1f3f4" },
  mobileDrawerApply: { background: "#1a73e8", color: "#fff", border: "none", borderRadius: "50px", padding: "13px", fontSize: "15px", fontWeight: "500", cursor: "pointer", fontFamily: "inherit" },
  mobileDrawerClear: { background: "none", border: "none", color: "#c5221f", fontSize: "14px", fontWeight: "500", cursor: "pointer", fontFamily: "inherit", textAlign: "center" },
};