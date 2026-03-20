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
  "Agriculture","Automotive","Construction","Education","Energy",
  "Finance & Banking","Healthcare","Hospitality","IT & Technology",
  "Legal","Logistics & Transport","Manufacturing","Media & Marketing",
  "Mining","NGO & Non-Profit","Real Estate","Retail","Telecommunications","Other"
];
const DISCLAIMERS = [
  { text: "Croloft Jobs is an advertising platform, not a recruitment agency. We list job opportunities on behalf of verified employers but are not involved in any hiring decisions." },
  { text: "We do not review, screen, shortlist, or manage any job applications. All applications go directly to the employer." },
  { text: "No artificial intelligence is used in the selection, ranking, or filtering of candidates at any stage." },
  { text: "Croloft Jobs verifies employer registrations through CIPC documentation. However, we cannot guarantee employment outcomes." },
  { text: "Croloft Jobs will never ask job seekers for payment. If an employer requests payment from you, report it to us immediately." },
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
  const [selectedJob, setSelectedJob] = useState(null);
  const [savedJobs, setSavedJobs] = useState(getLocalSavedJobs);
  const [alertEmail, setAlertEmail] = useState("");
  const [alertMsg, setAlertMsg] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileView, setMobileView] = useState("list");
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
    return matchSearch && matchProvince && matchType && matchIndustry;
  });

  const toggleSave = async (e, jobId) => {
    e.stopPropagation();
    await toggleSavedJob(jobId, user);
    setSavedJobs(getLocalSavedJobs());
  };

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    setMobileView("detail");
    detailRef.current?.scrollTo({ top: 0 });
  };

  const handleAlertSubmit = async (e) => {
    e.preventDefault();
    try {
      const { addDoc, collection: col, serverTimestamp } = await import("firebase/firestore");
      await addDoc(col(db, "jobAlerts"), { email: alertEmail, createdAt: serverTimestamp() });
      setAlertMsg("Subscribed!"); setAlertEmail("");
    } catch { setAlertMsg("Something went wrong."); }
  };

  const clearFilters = () => { setSearch(""); setFilterProvince(""); setFilterType(""); setFilterIndustry(""); };
  const hasFilters = search || filterProvince || filterType || filterIndustry;
  const isJobSeeker = user && jobSeekerProfile;
  const jsPhoto = jobSeekerProfile?.photoUrl || null;
  const jsInitials = jobSeekerProfile?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || null;

  return (
    <div style={s.page}>

      {/* ── Navbar ── */}
      <nav style={s.navbar}>
        <div style={s.navInner}>
          <div style={s.navLogo} onClick={() => navigate("/")}>
            <img src="/logo.png" alt="Croloft Jobs" style={s.navLogoImg} />
          </div>
          <div style={s.navLinks}>
            <Link to="/jobs" style={s.navLink}>Browse Jobs</Link>
            <Link to="/employer/join" style={s.navLink}>For Employers</Link>
            {isJobSeeker ? (
              <div style={s.navAvatar} onClick={() => navigate("/jobseeker/dashboard")} title="My Profile">
                {jsPhoto ? <img src={jsPhoto} alt="" style={s.navAvatarImg} /> : <div style={s.navAvatarInitials}>{jsInitials}</div>}
              </div>
            ) : (
              <Link to="/jobseeker/login" style={s.navLink}>Sign In</Link>
            )}
            <Link to="/employer/login" style={s.navBtn}>Employer Login</Link>
          </div>
          <button style={s.menuToggle} onClick={() => setMenuOpen(o => !o)}>
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

      {/* ── Hero Section ── */}
      <div style={s.heroSection}>
        <div style={s.heroInner}>
          <h1 style={s.heroTitle}>Discover High-End Professional Opportunities.</h1>
          <p style={s.heroSubtitle}>Connect with verified enterprises across South Africa in a streamlined, premium ecosystem built for your career advancement.</p>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div style={s.searchContainer}>
        <div style={s.searchBarInner}>
          <div style={s.searchLeft}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#80868b" strokeWidth="2" style={{ flexShrink: 0 }}>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#202124" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
          <div style={s.searchDivider} />
          <div style={s.searchRight}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#80868b" strokeWidth="2" style={{ flexShrink: 0 }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <select style={s.provinceSelect} value={filterProvince} onChange={e => setFilterProvince(e.target.value)}>
              <option value="">All Regions</option>
              {PROVINCES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <button style={s.searchBtn} onClick={() => {}}>
            Search Jobs
          </button>
        </div>
      </div>

      {/* ── Filter / Command Bar ── */}
      <div style={s.filterRow}>
        <div style={s.filterRowInner}>
          
          <div style={s.filterGroup}>
            <span style={s.filterLabel}>Type</span>
            <select style={s.modernSelect} value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div style={s.filterDividerUI} />

          <div style={s.filterGroup}>
            <span style={s.filterLabel}>Province</span>
            <select style={s.modernSelect} value={filterProvince} onChange={e => setFilterProvince(e.target.value)}>
              <option value="">All Provinces</option>
              {PROVINCES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          <div style={s.filterDividerUI} />

          <div style={s.filterGroup}>
            <span style={s.filterLabel}>Industry</span>
            <select style={s.modernSelect} value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)}>
              <option value="">All Industries</option>
              {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>

          <div style={s.filterDividerUI} />

          <div style={s.filterGroup}>
            <span style={s.filterLabel}>Sort By</span>
            <select style={s.modernSelect} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {hasFilters && (
            <>
              <div style={s.filterDividerUI} />
              <button style={s.clearBtn} onClick={clearFilters}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Clear Filters
              </button>
            </>
          )}

        </div>
      </div>

      {/* ── Main Panel ── */}
      <div style={s.mainSection}>
        <div style={s.mainInner}>
          <div style={s.resultsRow}>
            {mobileView === "detail" ? (
              <button style={s.mobileBackBtn} onClick={() => setMobileView("list")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                Back to results
              </button>
            ) : (
              <span style={s.resultsCount}>
                <strong>{filtered.length}</strong> {filtered.length === 1 ? "job" : "jobs"} found
                {filterProvince && <span style={s.resultsLocation}> in {filterProvince}</span>}
              </span>
            )}
          </div>

          <div style={s.splitLayout}>

            {/* ── Left: Job List ── */}
            <div style={{ ...s.leftPanel, ...(mobileView === "detail" ? s.leftPanelHidden : {}) }}>
              {loading ? (
                [...Array(5)].map((_, i) => <div key={i} style={s.skeleton} />)
              ) : filtered.length === 0 ? (
                <div style={s.emptyState}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dadce0" strokeWidth="1.5" style={{ marginBottom: 16 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <div style={s.emptyTitle}>No matching positions</div>
                  <div style={s.emptySub}>Adjust your filters or search terms.</div>
                  <button style={s.outlineBtn} onClick={clearFilters}>Clear Search Criteria</button>
                </div>
              ) : (
                filtered.slice(0, 20).map(job => (
                  <div
                    key={job.id}
                    style={{ ...s.jobCard, ...(selectedJob?.id === job.id ? s.jobCardActive : {}) }}
                    onClick={() => handleSelectJob(job)}
                  >
                    <div style={s.jobCardHead}>
                      <div style={s.jobLogo}>
                        {job.logoUrl
                          ? <img src={job.logoUrl} alt={job.employerName} style={s.jobLogoImg} />
                          : <div style={{ ...s.jobLogoPlaceholder, background: job.brandColour || "#202124" }}>{job.employerName?.[0]}</div>
                        }
                      </div>
                      <div style={s.jobCardHeadInfo}>
                        <div style={s.jobEmployer}>{job.employerName}</div>
                      </div>
                      <button style={s.saveBtn} onClick={e => toggleSave(e, job.id)}>
                        {savedJobs.includes(job.id)
                          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="#202124" stroke="#202124" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#80868b" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        }
                      </button>
                    </div>
                    <div style={s.jobTitle}>{job.title}</div>
                    <div style={s.jobLocation}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {job.city}, {job.province}
                    </div>
                    {job.requirements?.length > 0 && (
                      <div style={s.reqPreview}>
                        <div style={s.reqPreviewLabel}>Key Requirements</div>
                        {job.requirements.slice(0, 2).map((r, i) => (
                          <div key={i} style={s.reqPreviewItem}>
                            <div style={s.reqPreviewDot} />
                            <span style={{ fontSize: "13px", color: "#3c4043", lineHeight: 1.4 }}>{r.length > 70 ? r.slice(0, 70) + "…" : r}</span>
                          </div>
                        ))}
                        {job.requirements.length > 2 && <div style={s.reqMore}>+{job.requirements.length - 2} additional</div>}
                      </div>
                    )}
                    <div style={s.jobCardFoot}>
                      <span style={s.jobType}>{job.type}</span>
                      {job.remote && <span style={s.remoteBadge}>Remote</span>}
                      <span style={s.jobCloses}>Closes {job.closes}</span>
                    </div>
                  </div>
                ))
              )}
              {filtered.length > 20 && (
                <Link to="/jobs" style={s.viewMoreBtn}>View all {filtered.length} postings →</Link>
              )}
            </div>

            {/* ── Right: Detail Panel ── */}
            <div ref={detailRef} style={{ ...s.rightPanel, ...(mobileView === "list" ? s.rightPanelHidden : {}) }}>
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
                          : <div style={{ ...s.detailLogoPlaceholder, background: selectedJob.brandColour || "#202124" }}>{selectedJob.employerName?.[0]}</div>
                        }
                      </div>
                      <div style={s.detailHeadInfo}>
                        <div style={s.detailEmployer}>{selectedJob.employerName}</div>
                      </div>
                    </div>
                    <h2 style={s.detailTitle}>{selectedJob.title}</h2>
                    <div style={s.detailMeta}>
                      <span style={s.detailMetaItem}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {selectedJob.city}, {selectedJob.province}
                      </span>
                      {selectedJob.salary && (
                        <span style={s.detailMetaItem}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                          {selectedJob.salary}
                        </span>
                      )}
                      <span style={s.detailMetaItem}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="1"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                        {selectedJob.type}
                      </span>
                      {selectedJob.remote && <span style={s.remoteBadge}>Remote</span>}
                    </div>
                    <div style={s.detailActions}>
                      <button style={s.applyBtn} onClick={() => navigate(`/apply/${selectedJob.id}`)}>
                        Apply Now
                      </button>
                      <button style={s.saveDetailBtn} onClick={e => toggleSave(e, selectedJob.id)}>
                        {savedJobs.includes(selectedJob.id)
                          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="#202124" stroke="#202124" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#202124" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        }
                      </button>
                    </div>
                  </div>

                  {selectedJob.description && (
                    <div style={s.detailSection}>
                      <div style={s.detailSectionTitle}>DESCRIPTION</div>
                      <p style={s.detailText}>{selectedJob.description}</p>
                    </div>
                  )}

                  {selectedJob.responsibilities?.length > 0 && (
                    <div style={s.detailSection}>
                      <div style={s.detailSectionTitle}>RESPONSIBILITIES</div>
                      {selectedJob.responsibilities.map((r, i) => (
                        <div key={i} style={s.detailBullet}>
                          <div style={s.detailBulletDot} />
                          <span style={s.detailText}>{r}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedJob.requirements?.length > 0 && (
                    <div style={s.detailSection}>
                      <div style={s.detailSectionTitle}>REQUIREMENTS</div>
                      {selectedJob.requirements.map((r, i) => (
                        <div key={i} style={s.detailBullet}>
                          <div style={s.detailBulletDot} />
                          <span style={s.detailText}>{r}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedJob.niceToHaves?.length > 0 && (
                    <div style={s.detailSection}>
                      <div style={s.detailSectionTitle}>NICE TO HAVE</div>
                      {selectedJob.niceToHaves.map((r, i) => (
                        <div key={i} style={s.detailBullet}>
                          <div style={s.detailBulletDot} />
                          <span style={s.detailText}>{r}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedJob.specialNotes && (
                    <div style={s.detailSection}>
                      <div style={s.detailSectionTitle}>SPECIAL NOTES</div>
                      <div style={s.specialNote}>{selectedJob.specialNotes}</div>
                    </div>
                  )}

                  <div style={s.detailCloses}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="1"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
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

      {/* ── Job Alert ── */}
      <div style={s.alertBanner}>
        <div style={s.alertInner}>
          <div>
            <div style={s.alertTitle}>Receive Job Alerts</div>
            <div style={s.alertSub}>Subscribe to be notified when relevant opportunities are posted.</div>
          </div>
          {alertMsg ? (
            <div style={s.alertSuccess}>✓ {alertMsg}</div>
          ) : (
            <form onSubmit={handleAlertSubmit} style={s.alertForm}>
              <input style={s.alertInput} type="email" value={alertEmail} onChange={e => setAlertEmail(e.target.value)} placeholder="Enter email address" required />
              <button type="submit" style={s.applyBtn}>Subscribe</button>
            </form>
          )}
        </div>
      </div>

      {/* ── For Employers ── */}
      <div style={s.employerSection}>
        <div style={s.employerInner}>
          <div>
            <div style={s.heroTag}>Employer Access</div>
            <h2 style={s.employerTitle}>Hire Confident.</h2>
            <p style={s.employerDesc}>
              Croloft Jobs operates as a closed, invite-only platform exclusively for verified South African enterprises.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link to="/employer/join" style={s.applyBtn}>Apply for Access</Link>
              <Link to="/employer/login" style={s.outlineBtn}>Login</Link>
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
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div style={s.disclaimerSection}>
            <div style={s.disclaimerTitle}>Operational Notice for Candidates</div>
            <div style={s.disclaimerGrid}>
              {DISCLAIMERS.map((d, i) => (
                <div key={i} style={s.disclaimerRow}>
                  <div style={s.disclaimerIcon} />
                  <p style={s.disclaimerText}>{d.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={s.footerTop}>
            <div>
              <img src="/logo.png" alt="Croloft Jobs" style={{ height: "24px", marginBottom: "12px", filter: "brightness(0) invert(1)" }} />
              <p style={{ color: "#80868b", fontSize: "14px", margin: 0 }}>Verified Professional Network.</p>
            </div>
            <div style={s.footerLinksGrid}>
              <div style={s.footerCol}>
                <div style={s.footerColTitle}>Job Seekers</div>
                <Link to="/jobs" style={s.footerLink}>Browse Jobs</Link>
                <Link to="/jobseeker/login" style={s.footerLink}>Sign In</Link>
                <Link to="/jobseeker/register" style={s.footerLink}>Register</Link>
              </div>
              <div style={s.footerCol}>
                <div style={s.footerColTitle}>Employers</div>
                <Link to="/employer/join" style={s.footerLink}>Apply for Access</Link>
                <Link to="/employer/login" style={s.footerLink}>Portal Login</Link>
              </div>
              <div style={s.footerCol}>
                <div style={s.footerColTitle}>Legal Protocol</div>
                <Link to="/terms" style={s.footerLink}>Terms of Service</Link>
                <Link to="/privacy" style={s.footerLink}>Privacy Policy</Link>
              </div>
            </div>
          </div>
          <div style={s.footerBottom}>
            <span>© {new Date().getFullYear()} Croloft Jobs. All rights reserved.</span>
            <span>Developed for South Africa 🇿🇦</span>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .nav-links-hide { display: none !important; }
          .menu-toggle-show { display: flex !important; }
          .split-layout { grid-template-columns: 1fr !important; }
          .left-panel-hidden { display: none !important; }
          .right-panel-hidden { display: none !important; }
          .search-bar-inner { flex-direction: column !important; }
          .search-divider { width: 100% !important; height: 1px !important; }
          .filter-row-inner { overflow-x: auto !important; padding-bottom: 4px; }
          .employer-inner { grid-template-columns: 1fr !important; gap: 32px !important; }
          .footer-top { flex-direction: column !important; gap: 32px !important; }
          .disclaimer-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .main-inner { padding: 0 16px 48px !important; }
        }
      `}</style>
    </div>
  );
}

const s = {
  page: { background: "#ffffff", minHeight: "100vh", fontFamily: "'Inter', 'Circular Std', 'Bricolage Grotesque', sans-serif", color: "#202124" },

  navbar: { background: "#fff", borderBottom: "1px solid #e0e0e0", position: "sticky", top: 0, zIndex: 100 },
  navInner: { maxWidth: "1200px", margin: "0 auto", padding: "0 24px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  navLogo: { cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 },
  navLogoImg: { height: "24px", objectFit: "contain" },
  navLinks: { display: "flex", alignItems: "center", gap: "8px" },
  navLink: { color: "#3c4043", fontSize: "14px", fontWeight: "500", textDecoration: "none", padding: "8px 12px", borderRadius: "4px", transition: "background 0.2s ease" },
  navBtn: { background: "#202124", color: "#fff", padding: "8px 18px", borderRadius: "4px", fontSize: "14px", fontWeight: "500", textDecoration: "none", marginLeft: "8px" },
  navAvatar: { width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", cursor: "pointer", border: "1px solid #e0e0e0", flexShrink: 0, marginLeft: "12px" },
  navAvatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  navAvatarInitials: { width: "100%", height: "100%", background: "#202124", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "600" },
  menuToggle: { display: "none", background: "none", border: "none", cursor: "pointer", padding: "4px", alignItems: "center" },
  mobileMenu: { background: "#fff", borderTop: "1px solid #e0e0e0", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" },
  mobileLink: { color: "#202124", fontSize: "15px", padding: "12px 16px", textDecoration: "none", display: "block", borderBottom: "1px solid #f1f3f4" },
  mobileLinkBtn: { color: "#fff", background: "#202124", fontSize: "15px", padding: "12px 16px", borderRadius: "4px", textDecoration: "none", display: "block", textAlign: "center", marginTop: "12px" },

  heroSection: { background: "linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)", padding: "56px 24px 32px", textAlign: "center", borderBottom: "1px solid #eaeaea" },
  heroInner: { maxWidth: "800px", margin: "0 auto" },
  heroTitle: { color: "#202124", fontSize: "38px", fontWeight: "800", margin: "0 0 16px", letterSpacing: "-0.02em", lineHeight: "1.15" },
  heroSubtitle: { color: "#5f6368", fontSize: "17px", lineHeight: "1.6", margin: "0" },

  searchContainer: { background: "#ffffff", padding: "32px 24px 16px" },
  searchBarInner: { maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", background: "#fff", border: "1px solid #e0e0e0", borderRadius: "4px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" },
  searchLeft: { flex: 2, display: "flex", alignItems: "center", gap: "12px", padding: "0 16px", minWidth: 0 },
  searchInput: { flex: 1, border: "none", outline: "none", fontSize: "15px", color: "#202124", background: "transparent", fontFamily: "inherit", padding: "16px 0" },
  searchClear: { background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" },
  searchDivider: { width: "1px", height: "32px", background: "#e0e0e0", flexShrink: 0 },
  searchRight: { flex: 1, display: "flex", alignItems: "center", gap: "12px", padding: "0 16px", minWidth: 0 },
  provinceSelect: { flex: 1, border: "none", outline: "none", fontSize: "15px", color: "#202124", background: "transparent", cursor: "pointer", fontFamily: "inherit", padding: "16px 0" },
  searchBtn: { background: "#202124", color: "#fff", border: "none", padding: "16px 32px", fontSize: "15px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, borderRadius: "0 4px 4px 0", transition: "background 0.2s ease" },

  filterRow: { background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "16px 24px" },
  filterRowInner: { maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" },
  filterGroup: { display: "flex", alignItems: "center", gap: "12px" },
  filterLabel: { color: "#80868b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em" },
  modernSelect: { appearance: "none", background: "#fff url('data:image/svg+xml;utf8,<svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23202124\" stroke-width=\"2\"><path d=\"M6 9l6 6 6-6\"/></svg>') no-repeat right 12px center", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "8px 36px 8px 16px", fontSize: "13px", color: "#202124", cursor: "pointer", outline: "none", fontWeight: "500", fontFamily: "inherit" },
  filterDividerUI: { width: "1px", height: "24px", background: "#e0e0e0" },
  clearBtn: { display: "flex", alignItems: "center", gap: "6px", color: "#d93025", background: "none", border: "none", fontSize: "13px", fontWeight: "600", cursor: "pointer", padding: "8px 0", fontFamily: "inherit" },

  mainSection: { flex: 1, background: "#fafafa", paddingTop: "16px" },
  mainInner: { maxWidth: "1200px", margin: "0 auto", padding: "32px 24px 64px" },

  resultsRow: { marginBottom: "24px", display: "flex", alignItems: "center" },
  resultsCount: { color: "#3c4043", fontSize: "14px" },
  resultsLocation: { color: "#202124", fontWeight: "600" },
  mobileBackBtn: { display: "none", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#202124", fontSize: "14px", fontWeight: "500", cursor: "pointer", fontFamily: "inherit", padding: 0 },

  splitLayout: { display: "grid", gridTemplateColumns: "380px 1fr", gap: "24px", alignItems: "start" },
  
  leftPanel: { display: "flex", flexDirection: "column", gap: "16px", background: "transparent" }, 
  leftPanelHidden: {},
  rightPanel: { position: "sticky", top: "88px", background: "#fff", border: "1px solid #e0e0e0", borderRadius: "4px", overflowY: "auto", maxHeight: "calc(100vh - 120px)", boxShadow: "0 8px 24px rgba(0,0,0,0.03)" }, 
  rightPanelHidden: {},

  skeleton: { background: "linear-gradient(90deg,#f8f9fa 25%,#e0e0e0 50%,#f8f9fa 75%)", backgroundSize: "200%", animation: "shimmer 1.5s infinite", height: "140px", border: "1px solid #e0e0e0", borderRadius: "4px" },

  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 24px", textAlign: "center", border: "1px solid #e0e0e0", background: "#fff", borderRadius: "4px" },
  emptyTitle: { color: "#202124", fontSize: "18px", fontWeight: "600", marginBottom: "8px" },
  emptySub: { color: "#5f6368", fontSize: "14px", marginBottom: "24px" },

  jobCard: { background: "#fff", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "20px", cursor: "pointer", transition: "all 0.15s ease" },
  jobCardActive: { borderColor: "#202124", boxShadow: "0 0 0 1px #202124, 0 4px 12px rgba(0,0,0,0.05)", background: "#ffffff" },
  
  jobCardHead: { display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" },
  jobLogo: { width: "40px", height: "40px", borderRadius: "4px", overflow: "hidden", border: "1px solid #e0e0e0", flexShrink: 0 },
  jobLogoImg: { width: "100%", height: "100%", objectFit: "contain" },
  jobLogoPlaceholder: { width: "40px", height: "40px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "600", fontSize: "16px" },
  jobCardHeadInfo: { flex: 1, minWidth: 0, marginTop: "2px" },
  jobEmployer: { color: "#3c4043", fontSize: "14px", fontWeight: "500" },
  saveBtn: { background: "none", border: "none", cursor: "pointer", padding: "2px", flexShrink: 0 },
  jobTitle: { color: "#202124", fontSize: "18px", fontWeight: "600", marginBottom: "6px", lineHeight: "1.3" },
  jobLocation: { display: "flex", alignItems: "center", gap: "6px", color: "#5f6368", fontSize: "14px", marginBottom: "12px" },
  reqPreview: { marginBottom: "12px" },
  reqPreviewLabel: { color: "#202124", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" },
  reqPreviewItem: { display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "4px" },
  reqPreviewDot: { width: "4px", height: "4px", background: "#202124", marginTop: "7px", flexShrink: 0, borderRadius: "2px" },
  reqMore: { color: "#80868b", fontSize: "12px", paddingLeft: "12px", marginTop: "4px" },
  jobCardFoot: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginTop: "16px" },
  jobType: { border: "1px solid #e0e0e0", color: "#3c4043", borderRadius: "4px", padding: "4px 10px", fontSize: "12px", fontWeight: "500" },
  remoteBadge: { border: "1px solid #202124", color: "#202124", borderRadius: "4px", padding: "4px 10px", fontSize: "12px", fontWeight: "500" },
  jobCloses: { color: "#80868b", fontSize: "12px", marginLeft: "auto" },
  viewMoreBtn: { display: "block", textAlign: "center", color: "#202124", fontSize: "14px", textDecoration: "none", fontWeight: "600", padding: "16px", border: "1px solid #e0e0e0", background: "#fff", borderRadius: "4px" },

  detailEmpty: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "400px", textAlign: "center" },
  detailContent: { padding: "32px" },
  detailHead: { paddingBottom: "24px", borderBottom: "1px solid #e0e0e0", marginBottom: "24px" },
  detailHeadTop: { display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "16px" },
  detailLogo: { width: "56px", height: "56px", borderRadius: "4px", overflow: "hidden", border: "1px solid #e0e0e0", flexShrink: 0 },
  detailLogoImg: { width: "100%", height: "100%", objectFit: "contain" },
  detailLogoPlaceholder: { width: "56px", height: "56px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "600", fontSize: "20px" },
  detailHeadInfo: { flex: 1, marginTop: "4px" },
  detailEmployer: { color: "#3c4043", fontSize: "16px", fontWeight: "500" },
  detailTitle: { color: "#202124", fontSize: "28px", fontWeight: "700", margin: "0 0 16px", lineHeight: "1.2", letterSpacing: "-0.02em" },
  detailMeta: { display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "24px" },
  detailMetaItem: { display: "flex", alignItems: "center", gap: "8px", color: "#3c4043", fontSize: "15px" },
  detailActions: { display: "flex", gap: "12px", alignItems: "center" },
  applyBtn: { background: "#202124", color: "#fff", border: "none", borderRadius: "4px", padding: "14px 28px", fontSize: "15px", fontWeight: "500", cursor: "pointer", fontFamily: "inherit", textDecoration: "none", display: "inline-block", transition: "background 0.15s ease" },
  saveDetailBtn: { width: "46px", height: "46px", border: "1px solid #e0e0e0", borderRadius: "4px", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  outlineBtn: { background: "#fff", color: "#202124", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "14px 28px", fontSize: "15px", fontWeight: "500", cursor: "pointer", textDecoration: "none", display: "inline-block", transition: "all 0.15s ease" },
  
  detailSection: { marginBottom: "32px" },
  detailSectionTitle: { color: "#202124", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid #202124", paddingBottom: "8px", marginBottom: "16px", display: "inline-block" },
  detailText: { color: "#3c4043", fontSize: "15px", lineHeight: "1.8", margin: 0 },
  detailBullet: { display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" },
  detailBulletDot: { width: "5px", height: "5px", background: "#202124", flexShrink: 0, marginTop: "9px", borderRadius: "2px" },
  specialNote: { background: "#f8f9fa", borderLeft: "4px solid #202124", padding: "16px 20px", color: "#3c4043", fontSize: "15px", lineHeight: "1.7", borderRadius: "0 4px 4px 0" },
  
  detailCloses: { display: "flex", alignItems: "center", gap: "8px", color: "#5f6368", fontSize: "14px", marginBottom: "24px", paddingTop: "16px", borderTop: "1px solid #e0e0e0" },
  fullDetailsBtn: { background: "#fff", border: "1px solid #e0e0e0", color: "#202124", borderRadius: "4px", padding: "14px", fontSize: "14px", fontWeight: "500", cursor: "pointer", fontFamily: "inherit", width: "100%", transition: "border-color 0.15s ease" },

  alertBanner: { background: "#fafafa", borderTop: "1px solid #e0e0e0", borderBottom: "1px solid #e0e0e0", padding: "48px 24px" },
  alertInner: { maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "32px", flexWrap: "wrap" },
  alertTitle: { color: "#202124", fontSize: "22px", fontWeight: "700", marginBottom: "6px", letterSpacing: "-0.01em" },
  alertSub: { color: "#5f6368", fontSize: "15px" },
  alertForm: { display: "flex", gap: "12px", flexWrap: "wrap" },
  alertInput: { background: "#fff", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "14px 16px", color: "#202124", fontSize: "15px", outline: "none", minWidth: "260px", fontFamily: "inherit" },
  alertSuccess: { color: "#202124", fontSize: "15px", fontWeight: "600" },

  employerSection: { background: "#fff", padding: "80px 24px" },
  employerInner: { maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" },
  heroTag: { display: "inline-block", background: "#f8f9fa", border: "1px solid #e0e0e0", color: "#202124", borderRadius: "4px", padding: "6px 16px", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" },
  employerTitle: { color: "#202124", fontSize: "36px", fontWeight: "800", margin: "0 0 16px", letterSpacing: "-0.02em", lineHeight: "1.1" },
  employerDesc: { color: "#5f6368", fontSize: "16px", lineHeight: "1.6", marginBottom: "32px", maxWidth: "480px" },
  employerFeaturesBox: { display: "flex", flexDirection: "column", gap: "16px" },
  featureCard: { background: "#fafafa", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "24px" },
  featureCardTitle: { color: "#202124", fontSize: "16px", fontWeight: "600", marginBottom: "6px" },
  featureCardDesc: { color: "#5f6368", fontSize: "14px", lineHeight: "1.6" },

  footer: { background: "#000", color: "#fff", padding: "0 0 32px" },
  footerInner: { maxWidth: "1200px", margin: "0 auto", padding: "0 24px" },
  disclaimerSection: { borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "48px 0" },
  disclaimerTitle: { color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "24px" },
  disclaimerGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" },
  disclaimerRow: { display: "flex", alignItems: "flex-start", gap: "12px" },
  disclaimerIcon: { width: "6px", height: "6px", background: "rgba(255,255,255,0.2)", borderRadius: "2px", marginTop: "8px", flexShrink: 0 },
  disclaimerText: { color: "rgba(255,255,255,0.6)", fontSize: "13px", lineHeight: "1.6", margin: 0 },
  footerTop: { display: "flex", justifyContent: "space-between", gap: "48px", padding: "48px 0", borderBottom: "1px solid rgba(255,255,255,0.1)", flexWrap: "wrap" },
  footerLinksGrid: { display: "flex", gap: "64px", flexWrap: "wrap" },
  footerCol: { display: "flex", flexDirection: "column", gap: "12px" },
  footerColTitle: { color: "#fff", fontSize: "14px", fontWeight: "600", marginBottom: "8px" },
  footerLink: { color: "rgba(255,255,255,0.6)", fontSize: "14px", textDecoration: "none", transition: "color 0.2s" },
  footerBottom: { paddingTop: "24px", display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.4)", fontSize: "13px", flexWrap: "wrap", gap: "12px" },
};