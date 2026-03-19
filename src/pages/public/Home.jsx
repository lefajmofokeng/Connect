import { useState, useEffect, useRef } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
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

const DISCLAIMERS = [
  { icon: "ℹ", text: "Croloft Jobs is an advertising platform, not a recruitment agency. We list job opportunities on behalf of verified employers but are not involved in any hiring decisions." },
  { icon: "👥", text: "We do not review, screen, shortlist, or manage any job applications. All applications go directly to the employer." },
  { icon: "🤖", text: "No artificial intelligence is used in the selection, ranking, or filtering of candidates at any stage." },
  { icon: "🛡", text: "Croloft Jobs verifies employer registrations through CIPC documentation. However, we cannot guarantee employment outcomes." },
  { icon: "⚠", text: "Croloft Jobs will never ask job seekers for payment. If an employer requests payment from you, report it to us immediately." },
];

const APPLICATION_TIPS = [
  { title: "Certify Documents", content: "Ensure your ID and qualifications are certified at a police station or by a commissioner of oaths. Certifications should not be older than 3 to 6 months." },
  { title: "Tailor Your CV", content: "Customize your CV for each application. Highlight the specific experience and skills that directly match the job's core requirements." },
  { title: "Professional Details", content: "Use a professional email address (e.g., first.last@email.com) and always double-check that your contact numbers are currently active." },
  { title: "Follow Instructions", content: "If a job post asks for a specific reference number in the subject line or specific supporting documents, ensure you provide exactly that to avoid disqualification." }
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
  const [sortBy, setSortBy] = useState("newest");
  const [savedJobs, setSavedJobs] = useState(getLocalSavedJobs);
  const [alertEmail, setAlertEmail] = useState("");
  const [alertMsg, setAlertMsg] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [openTip, setOpenTip] = useState(0);

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
      setAllJobs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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
    return matchSearch && matchProvince && matchType && matchIndustry;
  });

  const toggleSave = async (jobId) => {
    await toggleSavedJob(jobId, user);
    setSavedJobs(getLocalSavedJobs());
  };

  const handleAlertSubmit = async (e) => {
    e.preventDefault();
    try {
      const { addDoc, collection: col, serverTimestamp } = await import("firebase/firestore");
      await addDoc(col(db, "jobAlerts"), { email: alertEmail, createdAt: serverTimestamp() });
      setAlertMsg("Subscribed!");
      setAlertEmail("");
    } catch { setAlertMsg("Something went wrong."); }
  };

  const clearFilters = () => {
    setSearch(""); setFilterProvince(""); setFilterType(""); setFilterIndustry("");
  };

  const hasFilters = search || filterProvince || filterType || filterIndustry;
  const activeFilterCount = [filterProvince, filterType, filterIndustry].filter(Boolean).length;
  const isJobSeeker = user && jobSeekerProfile;
  const jsPhoto = jobSeekerProfile?.photoUrl || null;
  const jsInitials = jobSeekerProfile?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || null;

  return (
    <div style={s.page}>

      {/* ── White Navbar ── */}
      <nav style={s.navbar}>
        <div style={s.navInner} className="nav-inner">
          <div style={s.navLogo} onClick={() => navigate("/")}>
            <img src="/logo.png" alt="Croloft Jobs" style={s.navLogoImg} />
          </div>
          <div style={s.navLinks} className="nav-links">
            <Link to="/jobs" style={s.navLink} className="nav-link">Browse Jobs</Link>
            <Link to="/employer/join" style={s.navLink} className="nav-link">For Employers</Link>
            {isJobSeeker ? (
              <div style={s.navAvatar} onClick={() => navigate("/jobseeker/dashboard")} title="My Profile">
                {jsPhoto ? <img src={jsPhoto} alt="" style={s.navAvatarImg} /> : <div style={s.navAvatarInitials}>{jsInitials}</div>}
              </div>
            ) : (
              <Link to="/jobseeker/login" style={s.navLink} className="nav-link">Sign In</Link>
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

      {/* ── Hero ── */}
      <div style={s.hero}>
        <div style={s.heroInner} className="hero-inner">
          <div style={s.heroTag}>South Africa's Verified Job Board</div>
          <h1 style={s.heroTitle} className="hero-title">Find Your Next <span style={s.heroAccent}>Opportunity</span></h1>
          <p style={s.heroSub}>Real jobs from verified South African companies — free to apply.</p>
          <div style={s.heroStats} className="hero-stats">
            <span style={s.heroStat}><strong style={{ color: "#1a73e8" }}>{allJobs.length}+</strong> Live Jobs</span>
            <span style={s.heroStatDivider} />
            <span style={s.heroStat}><strong style={{ color: "#1a73e8" }}>100%</strong> Verified Employers</span>
            <span style={s.heroStatDivider} />
            <span style={s.heroStat}><strong style={{ color: "#1a73e8" }}>Free</strong> to Apply</span>
          </div>
          {!isJobSeeker && (
            <div style={s.heroCta} className="hero-cta">
              <Link to="/jobseeker/register" style={s.heroBtnPrimary}>Create Free Account</Link>
              <Link to="/employer/join" style={s.heroBtnOutline}>Post a Job</Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Search Bar — standalone below hero ── */}
      <div style={s.searchSection} className="search-section">
        <div style={s.searchInner}>
          <div style={s.searchBox} className="search-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              style={s.searchInput}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by job title, company, skill or requirement..."
            />
            {search && (
              <button style={s.searchClearBtn} onClick={() => setSearch("")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Jobs Section ── */}
      <div style={s.jobsSection}>
        <div style={s.jobsInner} className="jobs-inner">

          {/* Section header */}
          <div style={s.jobsHeader} className="jobs-header">
            <div>
              <h2 style={s.jobsTitle} className="jobs-title">
                {hasFilters ? `${filtered.length} job${filtered.length !== 1 ? "s" : ""} found` : "Latest Job Listings"}
              </h2>
              {hasFilters && (
                <button style={s.clearAllBtn} onClick={clearFilters}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Clear all filters
                </button>
              )}
            </div>
            <div style={s.jobsHeaderRight}>
              <select style={s.sortSelect} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              <button style={s.filterToggleBtn} className="filter-toggle-btn" onClick={() => setFilterDrawerOpen(true)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                Filters
                {activeFilterCount > 0 && <span style={s.filterBadge}>{activeFilterCount}</span>}
              </button>
            </div>
          </div>

          {/* Three-panel layout */}
          <div style={s.mainGrid} className="main-grid">

            {/* Left — Filter Sidebar */}
            <div style={s.filterSidebar} className="filter-sidebar">
              <div style={s.filterSidebarHead}>
                <span style={s.filterSidebarTitle}>Filters</span>
                {hasFilters && <button style={s.clearAllBtn} onClick={clearFilters}>Clear all</button>}
              </div>

              <div style={s.filterBlock}>
                <div style={s.filterBlockLabel}>Province</div>
                <select style={s.filterSelectEl} value={filterProvince} onChange={e => setFilterProvince(e.target.value)}>
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
                      onClick={() => setFilterType(filterType === t ? "" : t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div style={s.filterBlock}>
                <div style={s.filterBlockLabel}>Industry</div>
                <select style={s.filterSelectEl} value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)}>
                  <option value="">All Industries</option>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>

              <div style={s.filterCount}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span><strong style={{ color: "#1a73e8" }}>{filtered.length}</strong> result{filtered.length !== 1 ? "s" : ""}</span>
              </div>
            </div>

            {/* Mobile Filter Drawer */}
            {filterDrawerOpen && (
              <>
                <div style={s.drawerOverlay} onClick={() => setFilterDrawerOpen(false)} />
                <div style={s.filterDrawer}>
                  <div style={s.drawerHeader}>
                    <span style={s.filterSidebarTitle}>Filters</span>
                    <button style={s.drawerCloseBtn} onClick={() => setFilterDrawerOpen(false)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#202124" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  <div style={s.filterBlock}>
                    <div style={s.filterBlockLabel}>Province</div>
                    <select style={s.filterSelectEl} value={filterProvince} onChange={e => setFilterProvince(e.target.value)}>
                      <option value="">All Provinces</option>
                      {PROVINCES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div style={s.filterBlock}>
                    <div style={s.filterBlockLabel}>Job Type</div>
                    <div style={s.filterChips}>
                      {JOB_TYPES.map(t => (
                        <button key={t} className="chip" style={{ ...s.chip, ...(filterType === t ? s.chipActive : {}) }} onClick={() => setFilterType(filterType === t ? "" : t)}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div style={s.filterBlock}>
                    <div style={s.filterBlockLabel}>Industry</div>
                    <select style={s.filterSelectEl} value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)}>
                      <option value="">All Industries</option>
                      {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                    </select>
                  </div>
                  <div style={{ padding: "16px" }}>
                    <button style={{ ...s.heroBtnPrimary, width: "100%", textAlign: "center", display: "block" }} onClick={() => setFilterDrawerOpen(false)}>
                      Show {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                    </button>
                    {hasFilters && <button style={{ ...s.clearAllBtn, marginTop: 12, display: "block", width: "100%", textAlign: "center" }} onClick={() => { clearFilters(); setFilterDrawerOpen(false); }}>Clear all filters</button>}
                  </div>
                </div>
              </>
            )}

            {/* Center — Job Cards */}
            <div style={s.jobListCol}>
              {loading ? (
                [...Array(4)].map((_, i) => <div key={i} style={s.skeleton} />)
              ) : filtered.length === 0 ? (
                <div style={s.emptyState}>
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#dadce0" strokeWidth="1.5" style={{ marginBottom: 14 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <div style={s.emptyTitle}>No jobs found</div>
                  <div style={s.emptySub}>Try different keywords or adjust your filters</div>
                  <button style={s.emptyBtn} onClick={clearFilters}>Clear filters</button>
                </div>
              ) : (
                filtered.slice(0, 20).map(job => (
                  <div key={job.id} style={s.jobCard} className="job-card">
                    {/* Top row */}
                    <div style={s.jobCardTop}>
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
                          {job.remote && <span style={s.remoteBadge}>Remote</span>}
                        </div>
                      </div>
                      <button style={s.saveBtn} onClick={() => toggleSave(job.id)}>
                        {savedJobs.includes(job.id)
                          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="#f9ab00" stroke="#f9ab00" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bdc1c6" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        }
                      </button>
                    </div>

                    {/* Requirements preview */}
                    {job.requirements?.length > 0 && (
                      <div style={s.reqBlock}>
                        <div style={s.reqBlockLabel}>Key Requirements</div>
                        {job.requirements.map((r, i) => (
                            <div key={i} style={s.reqItem}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 3 }}><polyline points="20 6 9 17 4 12"/></svg>
                                <span>{r}</span>
                            </div>
                            ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div style={s.jobCardFooter}>
                      <span style={s.jobCloses}>Closes {job.closes}</span>
                      <button style={s.viewJobBtn} className="view-job-btn" onClick={() => navigate(`/jobs/${job.id}`)}>
                        View Job
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 5 }}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                      </button>
                    </div>
                  </div>
                ))
              )}

              {filtered.length > 20 && (
                <div style={s.viewAllWrap}>
                  <Link to="/jobs" style={s.viewAllBtn}>
                    View all {filtered.length} jobs
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 6 }}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </Link>
                </div>
              )}
            </div>

            {/* Right — Application Tips Panel */}
            <div style={s.rightPanel} className="right-panel">
              <div style={s.rightPanelTitle}>Application Tips</div>
              <div style={s.accordionGroup}>
                {APPLICATION_TIPS.map((tip, idx) => {
                  const isOpen = openTip === idx;
                  return (
                    <div key={idx} style={s.accordionItem}>
                      <button
                        style={s.accordionHeader}
                        onClick={() => setOpenTip(isOpen ? -1 : idx)}
                      >
                        <span style={s.accordionTitle}>{tip.title}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </button>
                      {isOpen && (
                        <div style={s.accordionContent}>
                          {tip.content}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Job Alert ── */}
      <div style={s.alertBanner}>
        <div style={s.alertInner} className="alert-inner">
          <div>
            <div style={s.alertTitle}>Get Job Alerts</div>
            <div style={s.alertSub}>Be the first to know when new jobs are posted</div>
          </div>
          {alertMsg ? (
            <div style={s.alertSuccess}>✓ {alertMsg}</div>
          ) : (
            <form onSubmit={handleAlertSubmit} style={s.alertForm}>
              <input style={s.alertInput} type="email" value={alertEmail} onChange={e => setAlertEmail(e.target.value)} placeholder="your@email.com" required />
              <button type="submit" style={s.heroBtnPrimary}>Subscribe</button>
            </form>
          )}
        </div>
      </div>

      {/* ── For Employers ── */}
      <div style={s.employerSection}>
        <div style={s.employerInner} className="employer-inner">
          <div>
            <div style={s.heroTag}>For Employers</div>
            <h2 style={{ ...s.sectionH2, marginTop: 14, marginBottom: 14 }}>Hire Verified. Hire Confident.</h2>
            <p style={{ color: "#5f6368", fontSize: "16px", lineHeight: 1.7, marginBottom: 28, maxWidth: 460 }}>
              Croloft Jobs is an invite-only platform for verified South African businesses.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link to="/employer/join" style={s.heroBtnPrimary}>Apply for Access</Link>
              <Link to="/employer/login" style={s.heroBtnOutline}>Employer Login</Link>
            </div>
          </div>
          <div style={s.featureList}>
            {[
              { icon: "✓", title: "Verified Employers Only", desc: "CIPC-verified companies. No spam, no fake listings.", bg: "#e6f4ea", color: "#1e8e3e" },
              { icon: "📋", title: "Application Management", desc: "Review, shortlist and hire from your dashboard.", bg: "#e8f0fe", color: "#1a73e8" },
              { icon: "🎯", title: "Targeted Reach", desc: "Reach job seekers across all 9 provinces.", bg: "#fef7e0", color: "#b06000" },
            ].map(f => (
              <div key={f.title} style={s.featureCard}>
                <div style={{ ...s.featureIcon, background: f.bg, color: f.color }}>{f.icon}</div>
                <div>
                  <div style={s.featureTitle}>{f.title}</div>
                  <div style={s.featureSub}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div style={s.disclaimerSection}>
            <div style={s.disclaimerTitle}>ℹ Important Information for Job Seekers</div>
            <div style={s.disclaimerGrid} className="disclaimer-grid">
              {DISCLAIMERS.map((d, i) => (
                <div key={i} style={s.disclaimerItem}>
                  <span style={s.disclaimerIcon}>{d.icon}</span>
                  <p style={s.disclaimerText}>{d.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={s.footerTop} className="footer-top">
            <div>
              <img src="/logo.png" alt="Croloft Jobs" style={{ height: "26px", marginBottom: 10, filter: "brightness(0) invert(1)", opacity: 0.85 }} />
              <p style={s.footerTagline}>South Africa's verified job board.</p>
            </div>
            <div style={s.footerLinks} className="footer-links">
              <div style={s.footerCol}>
                <div style={s.footerColTitle}>Job Seekers</div>
                <Link to="/jobs" style={s.footerLink}>Browse Jobs</Link>
                <Link to="/jobseeker/login" style={s.footerLink}>Sign In</Link>
                <Link to="/jobseeker/register" style={s.footerLink}>Create Account</Link>
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
            <span>© {new Date().getFullYear()} Croloft Jobs. All rights reserved.</span>
            <span>Built for South Africa 🇿🇦</span>
          </div>
        </div>
      </footer>

      <style>{`
        * { box-sizing: border-box; }

        /* Tablet */
        @media (max-width: 1024px) {
          .main-grid { grid-template-columns: 220px 1fr !important; }
          .right-panel { grid-column: 1 / -1; margin-top: 12px; position: static !important; }
        }

        /* Mobile */
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .menu-toggle { display: flex !important; align-items: center; }
          .hero-inner { padding: 32px 16px !important; }
          .hero-cta { flex-direction: column !important; }
          .hero-cta a { width: 100% !important; text-align: center !important; }
          .search-section { padding: 0 16px !important; }
          .search-box { padding: 14px 16px !important; font-size: 15px !important; }
          .jobs-inner { padding: 20px 16px 48px !important; }
          .main-grid { grid-template-columns: 1fr !important; }
          .filter-sidebar { display: none !important; }
          .filter-toggle-btn { display: flex !important; }
          .jobs-header { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
          .employer-inner { grid-template-columns: 1fr !important; gap: 32px !important; }
          .footer-top { flex-direction: column !important; gap: 28px !important; }
          .footer-links { flex-wrap: wrap !important; gap: 28px !important; }
          .disclaimer-grid { grid-template-columns: 1fr !important; }
          .alert-inner { flex-direction: column !important; align-items: flex-start !important; }
          .hero-stats { flex-wrap: wrap !important; gap: 8px !important; }
        }

        @media (max-width: 480px) {
          .hero-title { font-size: 28px !important; }
          .jobs-title { font-size: 20px !important; }
          .job-card { padding: 16px !important; }
        }

        /* Hover effects */
        .job-card:hover { box-shadow: 0 4px 12px rgba(60,64,67,0.12) !important; border-color: #1a73e8 !important; }
        .nav-link:hover { background: #f1f3f4 !important; color: #202124 !important; }
        .view-job-btn:hover { background: #1557b0 !important; }
        .chip:hover { background: #e8f0fe !important; border-color: #1a73e8 !important; color: #1a73e8 !important; }
        .accordion-header:hover { background: #f1f3f4 !important; }
      `}</style>
    </div>
  );
}

const s = {
  page: { background: "#f8f9fa", minHeight: "100vh", fontFamily: "'Circular Std', sans-serif", color: "#202124" },

  // Navbar — WHITE
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
  menuToggle: { display: "none", background: "none", border: "none", cursor: "pointer", padding: "4px" },
  mobileMenu: { background: "#fff", borderTop: "1px solid #e0e0e0", padding: "10px 16px 16px", display: "flex", flexDirection: "column", gap: "2px", boxShadow: "0 4px 8px rgba(60,64,67,0.1)" },
  mobileLink: { color: "#202124", fontSize: "16px", padding: "13px 16px", borderRadius: "8px", textDecoration: "none", display: "block" },
  mobileLinkBtn: { color: "#fff", background: "#1a73e8", fontSize: "16px", padding: "13px 16px", borderRadius: "8px", textDecoration: "none", display: "block", textAlign: "center", marginTop: "8px" },

  // Hero
  hero: { background: "#fff", padding: "52px 24px 40px" },
  heroInner: { maxWidth: "1200px", margin: "0 auto", textAlign: "center" },
  heroTag: { display: "inline-block", background: "#e8f0fe", color: "#1a73e8", borderRadius: "999px", padding: "5px 16px", fontSize: "13px", fontWeight: "500", marginBottom: "16px" },
  heroTitle: { fontSize: "clamp(30px, 4vw, 48px)", fontWeight: "500", lineHeight: 1.1, margin: "0 0 12px", letterSpacing: "-0.02em", color: "#202124" },
  heroAccent: { color: "#1a73e8" },
  heroSub: { color: "#5f6368", fontSize: "17px", margin: "0 0 20px" },
  heroStats: { display: "inline-flex", alignItems: "center", gap: "0", marginBottom: "24px", background: "#f8f9fa", border: "1px solid #e0e0e0", borderRadius: "999px", padding: "8px 4px" },
  heroStat: { color: "#5f6368", fontSize: "14px", padding: "0 18px" },
  heroStatDivider: { width: "1px", height: "16px", background: "#e0e0e0" },
  heroCta: { display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" },
  heroBtnPrimary: { background: "#1a73e8", color: "#fff", border: "none", borderRadius: "8px", padding: "12px 26px", fontSize: "15px", fontWeight: "500", cursor: "pointer", textDecoration: "none", display: "inline-block" },
  heroBtnOutline: { background: "#fff", color: "#1a73e8", border: "2px solid #dadce0", borderRadius: "8px", padding: "12px 26px", fontSize: "15px", fontWeight: "500", cursor: "pointer", textDecoration: "none", display: "inline-block" },

  // Search — standalone section
  searchSection: { background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "0 24px 20px" },
  searchInner: { maxWidth: "800px", margin: "0 auto" },
  searchBox: { display: "flex", alignItems: "center", gap: "12px", background: "#fff", border: "2px solid #dadce0", borderRadius: "12px", padding: "14px 18px", transition: "border-color 0.15s, box-shadow 0.15s", boxShadow: "0 1px 4px rgba(60,64,67,0.08)" },
  searchInput: { flex: 1, border: "none", outline: "none", fontSize: "16px", color: "#202124", background: "transparent", fontFamily: "'Circular Std', sans-serif", minWidth: 0 },
  searchClearBtn: { background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center", flexShrink: 0 },

  // Jobs section
  jobsSection: { padding: "32px 24px 64px" },
  jobsInner: { maxWidth: "1200px", margin: "0 auto" },
  jobsHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", gap: "12px" },
  jobsTitle: { color: "#202124", fontSize: "22px", fontWeight: "700", margin: "0 0 4px" },
  clearAllBtn: { background: "none", border: "none", color: "#1a73e8", fontSize: "14px", cursor: "pointer", padding: "2px 0", display: "flex", alignItems: "center", gap: "5px", fontFamily: "'Circular Std', sans-serif" },
  jobsHeaderRight: { display: "flex", alignItems: "center", gap: "10px" },
  sortSelect: { background: "#fff", border: "1px solid #dadce0", borderRadius: "8px", padding: "9px 14px", fontSize: "14px", color: "#202124", outline: "none", cursor: "pointer", fontFamily: "'Circular Std', sans-serif" },
  filterToggleBtn: { display: "none", alignItems: "center", gap: "7px", background: "#fff", border: "1px solid #dadce0", borderRadius: "8px", padding: "9px 14px", fontSize: "14px", color: "#202124", cursor: "pointer", fontFamily: "'Circular Std', sans-serif" },
  filterBadge: { background: "#1a73e8", color: "#fff", borderRadius: "999px", padding: "1px 7px", fontSize: "12px" },

  // Three panel Main Grid
  mainGrid: { display: "grid", gridTemplateColumns: "240px 1fr 280px", gap: "24px", alignItems: "start" },

  // Filter Sidebar
  filterSidebar: { background: "#fff", border: "1px solid #e0e0e0", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "22px", position: "sticky", top: "80px", boxShadow: "0 1px 3px rgba(60,64,67,0.06)" },
  filterSidebarHead: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  filterSidebarTitle: { color: "#202124", fontSize: "16px", fontWeight: "700" },
  filterBlock: { display: "flex", flexDirection: "column", gap: "10px" },
  filterBlockLabel: { color: "#202124", fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.04em" },
  filterSelectEl: { background: "#f8f9fa", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "10px 12px", fontSize: "14px", color: "#202124", outline: "none", cursor: "pointer", fontFamily: "'Circular Std', sans-serif" },
  filterChips: { display: "flex", flexWrap: "wrap", gap: "7px" },
  chip: { background: "#f8f9fa", border: "1px solid #e0e0e0", borderRadius: "999px", padding: "5px 12px", fontSize: "13px", color: "#5f6368", cursor: "pointer", fontFamily: "'Circular Std', sans-serif", transition: "all 0.15s" },
  chipActive: { background: "#e8f0fe", border: "1px solid #1a73e8", color: "#1a73e8", fontWeight: "500" },
  filterCount: { display: "flex", alignItems: "center", gap: "7px", color: "#5f6368", fontSize: "14px", paddingTop: "10px", borderTop: "1px solid #f1f3f4" },

  // Mobile filter drawer
  drawerOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 299 },
  filterDrawer: { position: "fixed", top: 0, left: 0, bottom: 0, width: "300px", background: "#fff", zIndex: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px", padding: "20px", boxShadow: "4px 0 16px rgba(0,0,0,0.15)" },
  drawerHeader: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  drawerCloseBtn: { background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" },

  // Job List
  jobListCol: { display: "flex", flexDirection: "column", gap: "12px", minWidth: 0 },
  skeleton: { background: "linear-gradient(90deg,#f1f3f4 25%,#e8eaed 50%,#f1f3f4 75%)", backgroundSize: "200%", animation: "shimmer 1.5s infinite", borderRadius: "12px", height: "180px" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 24px", background: "#fff", borderRadius: "12px", border: "1px solid #e0e0e0", textAlign: "center" },
  emptyTitle: { color: "#202124", fontSize: "18px", fontWeight: "700", marginBottom: "6px" },
  emptySub: { color: "#5f6368", fontSize: "15px", marginBottom: "18px" },
  emptyBtn: { background: "#1a73e8", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 22px", fontSize: "14px", cursor: "pointer", fontFamily: "'Circular Std', sans-serif" },

  // Job Card
  jobCard: { background: "#fff", border: "1px solid #e0e0e0", borderRadius: "12px", padding: "30px", cursor: "default", transition: "box-shadow 0.15s, border-color 0.15s", boxShadow: "0 1px 3px rgba(60,64,67,0.06)" },
  jobCardTop: { display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "14px", borderBottom: "1px solid #ececec", paddingBottom: "20px" },
  jobLogo: { width: "54px", height: "54px", borderRadius: "10px", overflow: "hidden", border: "1px solid #e0e0e0", flexShrink: 0 },
  jobLogoImg: { width: "100%", height: "100%", objectFit: "contain" },
  jobLogoPlaceholder: { width: "48px", height: "48px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "700", fontSize: "18px" },
  jobInfo: { flex: 1, minWidth: 0 },
  jobTitle: { color: "#202124", fontSize: "22px", fontWeight: "500", marginBottom: "3px" },
  jobCompany: { color: "#5f6368", fontSize: "16px", marginBottom: "8px" },
  jobMeta: { display: "flex", flexWrap: "wrap", gap: "10px" },
  jobMetaItem: { display: "flex", alignItems: "center", gap: "5px", color: "#5f6368", fontSize: "16px" },
  remoteBadge: { background: "#e6f4ea", color: "#1e8e3e", borderRadius: "999px", padding: "2px 10px", fontSize: "12px", fontWeight: "500" },
  saveBtn: { background: "none", border: "none", cursor: "pointer", padding: "4px", flexShrink: 0 },

  // Requirements block
  reqBlock: { background: "transparent", borderRadius: "8px", padding: "12px 0", marginBottom: "14px", },
  reqBlockLabel: { color: "#272727", fontSize: "16px", fontWeight: "500", textTransform: "none", marginBottom: "8px" },
  reqItem: { display: "flex", alignItems: "flex-start", gap: "7px", color: "#3c4043", fontSize: "17px", lineHeight: "1.5", marginBottom: "5px" },
  reqMore: { color: "#80868b", fontSize: "16px", paddingLeft: "18px", marginTop: "2px" },

  // Job card footer
  jobCardFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "14px", borderTop: "1px solid #f1f3f4" },
  jobCloses: { color: "#80868b", fontSize: "13px", display: "flex", alignItems: "center", gap: "5px" },
  viewJobBtn: { display: "inline-flex", alignItems: "center", background: "#090909", color: "#fff", border: "none", borderRadius: "8px", padding: "11px 18px", fontSize: "16px", fontWeight: "400", cursor: "pointer", fontFamily: "'Circular Std', sans-serif", transition: "background 0.15s" },

  viewAllWrap: { textAlign: "center", paddingTop: "8px" },
  viewAllBtn: { display: "inline-flex", alignItems: "center", color: "#1a73e8", fontSize: "15px", textDecoration: "none", fontWeight: "500" },

  // Right Panel - Application Tips
  rightPanel: { background: "#fff", border: "1px solid #e0e0e0", borderRadius: "1px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px", position: "sticky", top: "80px", boxShadow: "0 1px 3px rgba(60,64,67,0.06)" },
  rightPanelTitle: { color: "#202124", fontSize: "16px", fontWeight: "700", borderBottom: "1px solid #e0e0e0", paddingBottom: "12px", margin: 0 },
  accordionGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  accordionItem: { border: "1px solid #e0e0e0", borderRadius: "1px", overflow: "hidden" },
  accordionHeader: { width: "100%", background: "#f8f9fa", border: "none", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: "'Circular Std', sans-serif", color: "#202124", transition: "background 0.15s" },
  accordionTitle: { fontSize: "14px", fontWeight: "600", textAlign: "left" },
  accordionContent: { padding: "12px 14px", fontSize: "13px", color: "#5f6368", lineHeight: "1.6", background: "#fff", borderTop: "1px solid #e0e0e0" },

  // Alert
  alertBanner: { background: "#fff", borderTop: "1px solid #e0e0e0", borderBottom: "1px solid #e0e0e0", padding: "48px 24px" },
  alertInner: { maxWidth: "800px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "28px", flexWrap: "wrap" },
  alertTitle: { color: "#202124", fontSize: "20px", fontWeight: "700", marginBottom: "5px" },
  alertSub: { color: "#5f6368", fontSize: "15px" },
  alertForm: { display: "flex", gap: "10px", flexWrap: "wrap" },
  alertInput: { background: "#fff", border: "1px solid #dadce0", borderRadius: "8px", padding: "11px 16px", color: "#202124", fontSize: "15px", outline: "none", minWidth: "220px", fontFamily: "'Circular Std', sans-serif" },
  alertSuccess: { color: "#1e8e3e", fontSize: "15px", fontWeight: "500" },

  // Employer section
  employerSection: { background: "#f8f9fa", padding: "72px 24px", borderTop: "1px solid #e0e0e0" },
  employerInner: { maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "56px", alignItems: "center" },
  sectionH2: { color: "#202124", fontSize: "30px", fontWeight: "800", letterSpacing: "-0.01em" },
  featureList: { display: "flex", flexDirection: "column", gap: "12px" },
  featureCard: { background: "#fff", border: "1px solid #e0e0e0", borderRadius: "12px", padding: "18px 20px", display: "flex", alignItems: "flex-start", gap: "14px", boxShadow: "0 1px 3px rgba(60,64,67,0.06)" },
  featureIcon: { width: "36px", height: "36px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 },
  featureTitle: { color: "#202124", fontSize: "15px", fontWeight: "600", marginBottom: "4px" },
  featureSub: { color: "#5f6368", fontSize: "14px", lineHeight: 1.5 },

  // Footer
  footer: { background: "#202124", padding: "0 0 28px" },
  footerInner: { maxWidth: "1200px", margin: "0 auto", padding: "0 24px" },
  disclaimerSection: { borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "40px 0" },
  disclaimerTitle: { color: "rgba(255,255,255,0.7)", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "18px" },
  disclaimerGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" },
  disclaimerItem: { display: "flex", alignItems: "flex-start", gap: "10px" },
  disclaimerIcon: { color: "rgba(255,255,255,0.4)", fontSize: "14px", flexShrink: 0, marginTop: "1px" },
  disclaimerText: { color: "rgba(255,255,255,0.4)", fontSize: "13px", lineHeight: "1.7", margin: 0 },
  footerTop: { display: "flex", justifyContent: "space-between", gap: "40px", padding: "36px 0 28px", borderBottom: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap" },
  footerTagline: { color: "rgba(255,255,255,0.3)", fontSize: "13px", lineHeight: 1.6, margin: 0 },
  footerLinks: { display: "flex", gap: "48px", flexWrap: "wrap" },
  footerCol: { display: "flex", flexDirection: "column", gap: "10px" },
  footerColTitle: { color: "#fff", fontSize: "14px", fontWeight: "600", marginBottom: "2px" },
  footerLink: { color: "rgba(255,255,255,0.4)", fontSize: "14px", textDecoration: "none" },
  footerBottom: { paddingTop: "22px", display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.25)", fontSize: "13px", flexWrap: "wrap", gap: "8px" },
};