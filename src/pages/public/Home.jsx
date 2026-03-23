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
  const detailRef = useRef(null);

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
  const clearFilters = () => { setSearch(""); setFilterProvince(""); setFilterType(""); setFilterIndustry(""); setFilterSalary(""); setOpenDropdown(null); };
  const hasFilters = search || filterProvince || filterType || filterIndustry || filterSalary;

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
          <button style={s.searchBtn} onClick={() => {}}>
            Search
          </button>
        </div>
      </div>

      {/* ── Filter / Command Bar ── */}
      <div style={s.filterRow} onClick={closeDropdown}>
        <div className="filter-scroll-container" style={s.filterRowInner}>

          {/* Job Type */}
          <FilterTab
            label="Job Type"
            value={filterType}
            options={JOB_TYPES}
            open={openDropdown === "type"}
            onToggle={e => { e.stopPropagation(); setOpenDropdown(openDropdown === "type" ? null : "type"); }}
            onSelect={v => { setFilterType(v); setOpenDropdown(null); }}
            onClear={() => { setFilterType(""); setOpenDropdown(null); }}
          />

          {/* Province */}
          <FilterTab
            label="Province"
            value={filterProvince}
            options={PROVINCES}
            open={openDropdown === "province"}
            onToggle={e => { e.stopPropagation(); setOpenDropdown(openDropdown === "province" ? null : "province"); }}
            onSelect={v => { setFilterProvince(v); setOpenDropdown(null); }}
            onClear={() => { setFilterProvince(""); setOpenDropdown(null); }}
          />

          {/* Industry */}
          <FilterTab
            label="Industry"
            value={filterIndustry}
            options={INDUSTRIES}
            open={openDropdown === "industry"}
            onToggle={e => { e.stopPropagation(); setOpenDropdown(openDropdown === "industry" ? null : "industry"); }}
            onSelect={v => { setFilterIndustry(v); setOpenDropdown(null); }}
            onClear={() => { setFilterIndustry(""); setOpenDropdown(null); }}
          />

          {/* Salary */}
          <FilterTab
            label="Salary"
            value={filterSalary}
            options={["R0 – R10k", "R10k – R20k", "R20k – R35k", "R35k – R50k", "R50k – R75k", "R75k+", "Market Related"]}
            open={openDropdown === "salary"}
            onToggle={e => { e.stopPropagation(); setOpenDropdown(openDropdown === "salary" ? null : "salary"); }}
            onSelect={v => { setFilterSalary(v); setOpenDropdown(null); }}
            onClear={() => { setFilterSalary(""); setOpenDropdown(null); }}
          />

          {/* Sort */}
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
          <div className="results-header-mobile" style={s.resultsRow}>
            {mobileView === "detail" ? (
              <button style={s.mobileBackBtn} onClick={() => setMobileView("list")}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                Back to results
              </button>
            ) : (
              <span style={s.resultsCount}>
                <strong>{filtered.length}</strong> {filtered.length === 1 ? "job" : "jobs"} available
                {filterProvince && <span style={s.resultsLocation}> in {filterProvince}</span>}
              </span>
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
                filtered.slice(0, 20).map(job => (
                  <div
                    key={job.id}
                    className={`job-card-hover${selectedJob?.id === job.id ? " job-card-selected" : ""}`}
                    style={{ ...s.jobCard, ...(selectedJob?.id === job.id ? s.jobCardActive : {}) }}
                    onClick={() => handleSelectJob(job)}
                  >
                    <div style={s.jobCardHead}>
                      <div style={s.jobLogo}>
                        {job.logoUrl
                          ? <img src={job.logoUrl} alt={job.employerName} style={s.jobLogoImg} />
                          : <div style={{ ...s.jobLogoPlaceholder, background: job.brandColour || "#f1f3f4", color: job.brandColour ? "#fff" : "#5f6368" }}>{job.employerName?.[0]}</div>
                        }
                      </div>
                      <div style={s.jobCardHeadInfo}>
                        <div style={s.jobEmployer}>{job.employerName}</div>
                        <div style={s.jobTitle}>{job.title}</div>
                      </div>
                      <button style={s.saveBtn} onClick={e => toggleSave(e, job.id)}>
                        {savedJobs.includes(job.id)
                          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="#1a73e8" stroke="#1a73e8" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                          : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        }
                      </button>
                    </div>
                    <div style={s.jobLocation}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      {job.city}, {job.province}
                    </div>
                    {job.requirements?.length > 0 && (
                      <div style={s.reqPreview}>
                        {job.requirements.slice(0, 2).map((r, i) => (
                          <div key={i} style={s.reqPreviewItem}>
                            <span style={s.reqPreviewDot}>•</span>
                            <span style={{ fontSize: "13px", color: "#5f6368", lineHeight: 1.4 }}>{r.length > 70 ? r.slice(0, 70) + "…" : r}</span>
                          </div>
                        ))}
                        {job.requirements.length > 2 && (
                          <div style={{ fontSize: "12px", color: "#1a73e8", fontWeight: "500", marginTop: "4px", paddingLeft: "16px" }}>
                            +{job.requirements.length - 2} more requirement{job.requirements.length - 2 !== 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    )}
                    <div style={s.jobCardFoot}>
                      <span style={s.jobType}>{job.type}</span>
                      {job.remote && <span style={s.remoteBadge}>Remote</span>}
                      <span style={s.jobCloses}>Closes {job.closes}{job.closesTime ? ` · ${job.closesTime}` : ""}</span>
                    </div>
                  </div>
                ))
              )}
              {filtered.length > 20 && (
                <Link to="/jobs" style={s.viewMoreBtn}>View all {filtered.length} postings →</Link>
              )}
            </div>

            {/* ── Right: Detail Panel ── */}
            <div ref={detailRef} className={`right-panel ${mobileView === "list" ? "hide-on-mobile" : ""}`} style={s.rightPanel}>
              {!selectedJob ? (
                <div style={s.detailEmpty}>
                  <p style={{ color: "#80868b", fontSize: "14px" }}>Select a position to view details</p>
                </div>
              ) : (
                <div style={s.detailContent}>
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
                      <button style={s.applyBtn} onClick={() => navigate(`/apply/${selectedJob.id}`)}>
                        Apply Now
                      </button>
                      <button style={s.saveDetailBtn} onClick={e => toggleSave(e, selectedJob.id)}>
                        {savedJobs.includes(selectedJob.id)
                          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="#1a73e8" stroke="#1a73e8" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                          : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        }
                      </button>
                    </div>
                  </div>

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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── For Employers ── */}
      <div style={s.employerSection}>
        <div className="employer-grid-mobile" style={s.employerInner}>
          <div>
            <div style={s.heroTag}>Employer Access</div>
            <h2 className="employer-title" style={s.employerTitle}>Hire Confident.</h2>
            <p style={s.employerDesc}>
              Vetted operates as a closed, invite-only platform exclusively for verified South African enterprises.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link to="/employer/join" style={s.applyBtn}>Apply for Access</Link>
              <Link to="/employer/login" style={s.outlineBtnLight}>Login</Link>
            </div>
          </div>
          <div style={s.employerFeaturesBox}>
            {[
              { title: "Verified Enterprise Network", desc: "Rigorous CIPC verification ensuring an authentic, professional ecosystem." },
              { title: "Streamlined Architecture", desc: "Advanced dashboard to process, manage, and engage candidates seamlessly." },
              { title: "National Penetration", desc: "Extensive visibility across all 9 operational provinces." },
            ].map((f, i) => (
              <div key={i} style={s.featureCard}>
                <div style={s.featureCardTitle}>{f.title}</div>
                <div style={s.featureCardDesc}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <Footer />

      {/* ── Page-specific CSS ── */}
      <style>{`
        .page-wrapper { -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #dadce0; border-radius: 4px; }

        .job-card-hover { transition: box-shadow 0.2s ease, border-color 0.2s ease !important; transform: translateZ(0); }
        .job-card-hover:hover:not(.job-card-selected) { box-shadow: 0 4px 12px rgba(60,64,67,0.12) !important; border-color: #bdc1c6 !important; }
        .job-card-selected { border-color: #1a73e8 !important; box-shadow: inset 0 0 0 1px #1a73e8 !important; }

        .filter-tab-wrap button:hover { background: #f8f9fa !important; }
        .filter-tab-wrap .ft-option:hover { background: #f1f3f4 !important; }

        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        @media (max-width: 900px) {
          .split-layout { grid-template-columns: 1fr !important; gap: 0 !important; }
          .hide-on-mobile { display: none !important; }
          .results-header-mobile { background: #fff; padding: 12px 0; margin-bottom: 0 !important; position: sticky; top: 64px; z-index: 10; border-bottom: 1px solid #f1f3f4; }
        }

        @media (max-width: 768px) {
          .hero-title { font-size: 32px !important; }
          .hero-subtitle { font-size: 16px !important; }
          .employer-title { font-size: 28px !important; }
          .search-bar-inner { flex-direction: column !important; padding: 8px !important; border-radius: 16px !important; }
          .search-divider { width: 100% !important; height: 1px !important; margin: 4px 0 !important; }
          .search-bar-inner button { width: 100%; border-radius: 8px !important; margin-top: 8px; }
          .filter-scroll-container { display: flex !important; flex-wrap: wrap !important; justify-content: center !important; gap: 12px !important; padding-bottom: 12px; }
          .filter-tab-wrap { flex: 1 1 calc(50% - 12px); min-width: 140px; }
          .clear-btn-wrap { flex: 1 1 100%; text-align: center; margin-top: 8px; }
          .main-inner { padding: 16px !important; }
          .employer-grid-mobile { grid-template-columns: 1fr !important; gap: 32px !important; }
        }

        @media (max-width: 480px) {
          .detail-actions-mobile { flex-direction: column; width: 100%; }
          .detail-actions-mobile button { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
}

// ── FilterTab — custom label-over-line dropdown ────────────────────────
function FilterTab({ label, value, options, open, onToggle, onSelect, onClear, isSort }) {
  const isActive = isSort ? false : !!value;
  const displayValue = isSort ? value : (value || "- Select -");
  
  return (
    <div style={ft.tabWrap} className="filter-tab-wrap">
      <button
        onClick={onToggle}
        style={{
          ...ft.tab,
          ...(isActive || open ? ft.tabActive : {}),
        }}
      >
        {/* Floating Label overlay cutting the top border */}
        <span style={{ 
          ...ft.tabLabel, 
          ...(isActive || open ? ft.tabLabelActive : {}) 
        }}>
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
    background: "#fff", border: "1px solid #9aa0a6", borderRadius: "4px",
    padding: "10px 14px", cursor: "pointer", minWidth: "160px", gap: "12px",
    fontFamily: '"Circular Std", "Circular", -apple-system, sans-serif',
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  tabActive: { borderColor: "#1967d2", boxShadow: "inset 0 0 0 1px #1967d2" },
  tabLabel: { 
    position: "absolute", top: "-8px", left: "10px", background: "#fff", 
    padding: "0 4px", fontSize: "12px", fontWeight: "400", color: "#5f6368", 
    lineHeight: 1, zIndex: 1, transition: "color 0.15s" 
  },
  tabLabelActive: { color: "#1967d2", fontWeight: "500" },
  tabValue: { fontSize: "15px", fontWeight: "400", color: "#5f6368", lineHeight: 1.4, whiteSpace: "nowrap" },
  tabValueActive: { color: "#202124" },
  dropdown: {
    position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 100,
    background: "#fff", border: "1px solid #dadce0", borderRadius: "8px",
    boxShadow: "0 4px 16px rgba(60,64,67,0.18)", minWidth: "200px",
    maxHeight: "280px", overflowY: "auto", padding: "4px",
    display: "flex", flexDirection: "column",
  },
  option: {
    display: "flex", alignItems: "center", gap: "8px",
    background: "none", border: "none", width: "100%", textAlign: "left",
    padding: "9px 14px", fontSize: "14px", fontWeight: "400", color: "#202124",
    cursor: "pointer", borderRadius: "4px",
    fontFamily: '"Circular Std", "Circular", -apple-system, sans-serif',
    transition: "background 0.1s",
  },
  optionActive: { color: "#1967d2", fontWeight: "600", background: "#f0f4ff" },
  optionClear: {
    display: "flex", alignItems: "center", gap: "6px",
    background: "none", border: "none", borderBottom: "1px solid #f1f3f4",
    width: "100%", textAlign: "left", padding: "8px 14px 10px",
    fontSize: "13px", fontWeight: "500", color: "#9aa0a6", cursor: "pointer",
    fontFamily: '"Circular Std", "Circular", -apple-system, sans-serif',
    marginBottom: "4px",
  },
};

const s = {
  page: { background: "#ffffff", minHeight: "100vh", fontFamily: '"Circular Std", "Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: "#202124" },

  heroSection: { background: "#fff", padding: "128px 24px 40px", textAlign: "center" },
  heroInner: { maxWidth: "800px", margin: "0 auto" },
  heroTitle: { color: "#202124", fontSize: "44px", fontWeight: "400", margin: "0 0 16px", letterSpacing: "-0.5px", lineHeight: "1.2" },
  heroSubtitle: { color: "#5f6368", fontSize: "18px", lineHeight: "1.6", margin: "0" },

  searchContainer: { background: "#fff", padding: "16px 24px 32px", position: "relative", zIndex: 10 },
  searchBarInner: { maxWidth: "900px", margin: "0 auto", display: "flex", alignItems: "center", background: "#fff", borderRadius: "32px", boxShadow: "0 1px 6px rgba(32,33,36,0.28)", padding: "8px 8px 8px 20px" },
  searchLeft: { flex: 2, display: "flex", alignItems: "center", gap: "12px", minWidth: 0 },
  searchInput: { flex: 1, border: "none", outline: "none", fontSize: "16px", color: "#202124", background: "transparent", fontFamily: "inherit", padding: "12px 0" },
  searchClear: { background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" },
  searchDivider: { width: "1px", height: "32px", background: "#dadce0", flexShrink: 0, margin: "0 16px" },
  searchRight: { flex: 1, display: "flex", alignItems: "center", gap: "12px", minWidth: 0 },
  provinceSelect: { flex: 1, border: "none", outline: "none", fontSize: "16px", color: "#3c4043", background: "transparent", cursor: "pointer", fontFamily: "inherit", padding: "12px 0", appearance: "none" },
  searchBtn: { background: "#1a73e8", color: "#fff", border: "none", padding: "14px 32px", fontSize: "15px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, borderRadius: "24px" },

  filterRow: { background: "#fff", borderBottom: "1px solid #dadce0", padding: "0 24px" },
  filterRowInner: { maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", flexWrap: "wrap", paddingBottom: "16px" },
  filterGroup: { display: "flex", alignItems: "center" },
  clearBtn: { color: "#c5221f", background: "none", border: "none", fontSize: "14px", fontWeight: "500", cursor: "pointer", padding: "10px 16px", fontFamily: "inherit", alignSelf: "center", marginTop: "10px" },

  mainSection: { flex: 1, background: "#f8f9fa", paddingTop: "24px" },
  mainInner: { maxWidth: "1200px", margin: "0 auto", padding: "0 24px 64px" },

  resultsRow: { marginBottom: "20px", display: "flex", alignItems: "center" },
  resultsCount: { color: "#5f6368", fontSize: "14px" },
  resultsLocation: { color: "#202124", fontWeight: "500" },
  mobileBackBtn: { display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "#1a73e8", fontSize: "15px", fontWeight: "500", cursor: "pointer", fontFamily: "inherit", padding: 0 },

  splitLayout: { display: "grid", gridTemplateColumns: "380px 1fr", gap: "24px", alignItems: "start" },
  
  leftPanel: { display: "flex", flexDirection: "column", gap: "12px" }, 
  rightPanel: { position: "sticky", top: "76px", background: "#fff", border: "1px solid #dadce0", borderRadius: "8px", overflowY: "auto", maxHeight: "calc(100vh - 96px)" },

  skeleton: { background: "linear-gradient(90deg,#f1f3f4 25%,#e8eaed 50%,#f1f3f4 75%)", backgroundSize: "200%", animation: "shimmer 1.5s infinite", height: "140px", border: "1px solid #dadce0", borderRadius: "8px" },

  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 24px", textAlign: "center" },
  emptyTitle: { color: "#202124", fontSize: "20px", fontWeight: "400", marginBottom: "8px" },
  emptySub: { color: "#5f6368", fontSize: "15px", marginBottom: "24px" },

  jobCard: { background: "#fff", border: "1px solid #dadce0", borderRadius: "8px", padding: "16px", cursor: "pointer", position: "relative" },
  jobCardActive: { borderColor: "#1a73e8 !important", boxShadow: "inset 0 0 0 1px #1a73e8" },

  jobCardHead: { display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "6px" },
  jobLogo: { width: "40px", height: "40px", borderRadius: "4px", overflow: "hidden", border: "1px solid #dadce0", flexShrink: 0 },
  jobLogoImg: { width: "100%", height: "100%", objectFit: "contain" },
  jobLogoPlaceholder: { width: "40px", height: "40px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "500", fontSize: "18px" },
  jobCardHeadInfo: { flex: 1, minWidth: 0 },
  jobEmployer: { color: "#5f6368", fontSize: "12px", marginBottom: "2px" },
  saveBtn: { background: "none", border: "none", cursor: "pointer", padding: "4px", flexShrink: 0 },
  jobTitle: { color: "#1a73e8", fontSize: "16px", fontWeight: "500", lineHeight: "1.3" },
  jobLocation: { display: "flex", alignItems: "center", gap: "4px", color: "#5f6368", fontSize: "12px", marginBottom: "8px", marginTop: "2px" },
  reqPreview: { marginBottom: "10px", marginTop: "8px" },
  reqPreviewItem: { display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "4px" },
  reqPreviewDot: { color: "#9aa0a6", fontSize: "12px", marginTop: "1px" },
  jobCardFoot: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", borderTop: "1px solid #f1f3f4", paddingTop: "10px", marginTop: "4px" },
  jobType: { background: "#f1f3f4", color: "#3c4043", borderRadius: "4px", padding: "4px 8px", fontSize: "12px", fontWeight: "500" },
  remoteBadge: { background: "#e8f0fe", color: "#1967d2", borderRadius: "4px", padding: "4px 8px", fontSize: "12px", fontWeight: "500" },
  jobCloses: { color: "#80868b", fontSize: "12px", marginLeft: "auto" },
  viewMoreBtn: { display: "block", textAlign: "center", color: "#1a73e8", fontSize: "14px", textDecoration: "none", fontWeight: "500", padding: "16px", border: "1px solid #dadce0", background: "#fff", borderRadius: "24px" },

  detailEmpty: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "500px", textAlign: "center", background: "#f8f9fa" },
  detailContent: { padding: "0" },
  detailHead: { padding: "32px", borderBottom: "1px solid #dadce0", background: "#fff" },
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
  applyBtn: { background: "#1a73e8", color: "#fff", border: "none", borderRadius: "24px", padding: "12px 28px", fontSize: "15px", fontWeight: "500", cursor: "pointer", fontFamily: "inherit", textDecoration: "none", display: "inline-block" },
  saveDetailBtn: { height: "46px", padding: "0 24px", border: "1px solid #dadce0", borderRadius: "24px", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  outlineBtn: { background: "#fff", color: "#1a73e8", border: "1px solid #dadce0", borderRadius: "24px", padding: "12px 28px", fontSize: "15px", fontWeight: "500", cursor: "pointer", textDecoration: "none", display: "inline-block" },
  
  detailSection: { padding: "24px 32px 0" },
  detailSectionTitle: { color: "#202124", fontSize: "18px", fontWeight: "500", marginBottom: "16px" },
  detailText: { color: "#3c4043", fontSize: "15px", lineHeight: "1.6", margin: 0 },
  detailBullet: { display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" },
  detailBulletDot: { color: "#5f6368", fontSize: "14px", marginTop: "2px" },
  specialNote: { background: "#e8f0fe", padding: "16px 20px", color: "#202124", fontSize: "15px", lineHeight: "1.6", borderRadius: "8px" },
  
  detailCloses: { display: "flex", alignItems: "center", gap: "8px", color: "#5f6368", fontSize: "14px", padding: "32px", borderTop: "1px solid #dadce0", marginTop: "32px", background: "#f8f9fa" },
  fullDetailsBtn: { background: "#fff", border: "none", borderTop: "1px solid #dadce0", color: "#1a73e8", padding: "20px", fontSize: "15px", fontWeight: "500", cursor: "pointer", fontFamily: "inherit", width: "100%", display: "block" },

  employerSection: { background: "#f8f9fa", padding: "80px 24px" },
  employerInner: { maxWidth: "1150px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" },
  heroTag: { display: "inline-block", color: "#1a73e8", fontSize: "13px", fontWeight: "500", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" },
  employerTitle: { color: "#202124", fontSize: "36px", fontWeight: "400", margin: "0 0 16px", lineHeight: "1.2" },
  employerDesc: { color: "#5f6368", fontSize: "16px", lineHeight: "1.6", marginBottom: "32px", maxWidth: "480px" },
  outlineBtnLight: { background: "transparent", color: "#1a73e8", border: "1px solid #dadce0", borderRadius: "24px", padding: "12px 28px", fontSize: "15px", fontWeight: "500", cursor: "pointer", textDecoration: "none", display: "inline-block" },
  employerFeaturesBox: { display: "flex", flexDirection: "column", gap: "16px" },
  featureCard: { background: "#fff", border: "1px solid #dadce0", borderRadius: "8px", padding: "24px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1)" },
  featureCardTitle: { color: "#202124", fontSize: "16px", fontWeight: "500", marginBottom: "6px" },
  featureCardDesc: { color: "#5f6368", fontSize: "14px", lineHeight: "1.6" },
};