import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import EmployerSidebar from '../../components/EmployerSidebar';

const FONT = '"Circular Std", "Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export default function Analytics() {
  const { user, employerProfile } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobSnap, appSnap] = await Promise.all([
        getDocs(query(collection(db, "jobs"), where("employerId", "==", user.uid))),
        getDocs(query(collection(db, "applications"), where("employerId", "==", user.uid))),
      ]);
      setJobs(jobSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setApplications(appSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // ── Derived analytics ──────────────────────────────────────────────

  // Funnel counts
  const funnelStages = [
    { label: "New",         key: "new",         color: "#1a73e8", bg: "#e3f2fd" },
    { label: "Reviewed",    key: "reviewed",     color: "#ea8600", bg: "#fef7e0" },
    { label: "Shortlisted", key: "shortlisted",  color: "#0d652d", bg: "#e6f4ea" },
    { label: "Rejected",    key: "rejected",     color: "#c5221f", bg: "#fce8e6" },
    { label: "Hired",       key: "hired",        color: "#0b5123", bg: "#ceead6" },
  ];

  const funnelData = funnelStages.map(stage => ({
    ...stage,
    count: applications.filter(a => a.status === stage.key).length,
  }));

  const maxFunnel = Math.max(...funnelData.map(f => f.count), 1);

  // Per-job performance
  const jobPerformance = jobs.map(job => {
    const jobApps = applications.filter(a => a.jobId === job.id);
    const hired = jobApps.filter(a => a.status === "hired").length;
    const shortlisted = jobApps.filter(a => a.status === "shortlisted").length;
    return { ...job, appCount: jobApps.length, hired, shortlisted };
  }).sort((a, b) => b.appCount - a.appCount);

  // Top locations
  const locationMap = {};
  applications.forEach(a => {
    if (a.city) locationMap[a.city] = (locationMap[a.city] || 0) + 1;
  });
  const topLocations = Object.entries(locationMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxLocation = topLocations[0]?.[1] || 1;

  // Application trend — last 6 months
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      label: d.toLocaleDateString("en-ZA", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth(),
      count: 0,
    };
  });
  applications.forEach(a => {
    const date = a.createdAt?.toDate?.();
    if (!date) return;
    const idx = months.findIndex(m => m.year === date.getFullYear() && m.month === date.getMonth());
    if (idx !== -1) months[idx].count++;
  });
  const maxMonth = Math.max(...months.map(m => m.count), 1);

  // Summary stats
  const totalApps   = applications.length;
  const hireRate    = totalApps > 0 ? ((funnelData.find(f => f.key === "hired")?.count || 0) / totalApps * 100).toFixed(1) : "0.0";
  const liveJobs    = jobs.filter(j => j.status === "live").length;
  const avgPerJob   = liveJobs > 0 ? (totalApps / jobs.length).toFixed(1) : "0.0";

  if (loading) return (
    <><style>{`* { font-family: ${FONT} !important; } body { font-family: ${FONT} !important; }`}</style>
    <div style={s.page}>
      <EmployerSidebar />
      <div style={s.mainWrapper}>
        <div style={s.mainInner}>
          <div style={s.empty}>Fetching analytics...</div>
        </div>
      </div>
    </div></>
  );

  return (
    <>
      <style>{`* { font-family: ${FONT} !important; } body { font-family: ${FONT} !important; }`}</style>
      <div style={s.page}>
      <EmployerSidebar />

      <div style={s.mainWrapper}>
        <div style={s.mainInner}>

          {/* Topbar */}
          <div style={s.topbar}>
            <div>
              <h1 style={s.pageTitle}>Analytics & Insights</h1>
              <p style={s.pageSub}>
                {totalApps} application{totalApps !== 1 ? "s" : ""} across {jobs.length} listing{jobs.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* ── Summary stat cards ── */}
          <div style={s.statsGrid}>
            <StatCard label="Total Applications" value={totalApps}        color="#1a73e8" />
            <StatCard label="Live Listings"       value={liveJobs}         color="#0f9d58" />
            <StatCard label="Hire Rate"           value={`${hireRate}%`}   color="#0d652d" small />
            <StatCard label="Avg. per Listing"    value={avgPerJob}        color="#ea8600" small />
          </div>

          {/* ── Row 1: Funnel + Trend ── */}
          <div style={s.twoCol}>

            {/* Application Funnel */}
            <div style={s.card}>
              <div style={s.cardHeader}>
                <div style={s.cardTitle}>Application Funnel</div>
                <div style={s.cardSub}>Status breakdown across all listings</div>
              </div>
              {totalApps === 0 ? (
                <EmptyChart label="No applications yet" />
              ) : (
                <div style={s.funnelList}>
                  {funnelData.map(stage => (
                    <div key={stage.key} style={s.funnelRow}>
                      <div style={s.funnelLabelWrap}>
                        <span style={{ ...s.funnelDot, background: stage.color }} />
                        <span style={s.funnelLabel}>{stage.label}</span>
                        <span style={{ ...s.funnelCount, background: stage.bg, color: stage.color }}>
                          {stage.count}
                        </span>
                      </div>
                      <div style={s.funnelBarTrack}>
                        <div style={{
                          ...s.funnelBar,
                          width: `${(stage.count / maxFunnel) * 100}%`,
                          background: stage.color,
                          opacity: stage.count === 0 ? 0.15 : 1,
                        }} />
                      </div>
                      <span style={s.funnelPct}>
                        {totalApps > 0 ? `${((stage.count / totalApps) * 100).toFixed(0)}%` : "0%"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Application Trend */}
            <div style={s.card}>
              <div style={s.cardHeader}>
                <div style={s.cardTitle}>Application Trend</div>
                <div style={s.cardSub}>Monthly volume — last 6 months</div>
              </div>
              {totalApps === 0 ? (
                <EmptyChart label="No application data yet" />
              ) : (
                <div style={s.trendChart}>
                  {months.map((m, i) => (
                    <div key={i} style={s.trendCol}>
                      <span style={s.trendValue}>{m.count > 0 ? m.count : ""}</span>
                      <div style={s.trendBarTrack}>
                        <div style={{
                          ...s.trendBar,
                          height: `${(m.count / maxMonth) * 100}%`,
                          background: m.count > 0 ? "#1a73e8" : "#e3e3e3",
                        }} />
                      </div>
                      <span style={s.trendLabel}>{m.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Top Locations ── */}
          {topLocations.length > 0 && (
            <div style={{ ...s.card, marginBottom: "24px" }}>
              <div style={s.cardHeader}>
                <div style={s.cardTitle}>Top Applicant Locations</div>
                <div style={s.cardSub}>Cities with the most applicants</div>
              </div>
              <div style={s.locationGrid}>
                {topLocations.map(([city, count], i) => (
                  <div key={city} style={s.locationRow}>
                    <span style={s.locationRank}>{i + 1}</span>
                    <span style={s.locationCity}>{city}</span>
                    <div style={s.locationBarTrack}>
                      <div style={{
                        ...s.locationBar,
                        width: `${(count / maxLocation) * 100}%`,
                      }} />
                    </div>
                    <span style={s.locationCount}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Per-Job Performance Table ── */}
          <div style={s.section}>
            <div style={s.sectionHeader}>
              <h2 style={s.sectionTitle}>Per-Job Performance</h2>
            </div>
            {jobs.length === 0 ? (
              <div style={s.emptyCard}>
                <p style={s.emptyText}>No listings yet — post a job to see performance data.</p>
              </div>
            ) : (
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {["Listing", "Status", "Applications", "Shortlisted", "Hired", "Conversion"].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jobPerformance.map(job => {
                      const conversion = job.appCount > 0
                        ? `${((job.hired / job.appCount) * 100).toFixed(0)}%`
                        : "—";
                      return (
                        <tr key={job.id} style={s.tr}>
                          <td style={s.td}>
                            <div style={s.jobTitleText}>{job.title}</div>
                            <div style={s.jobSub}>{job.city}, {job.province}</div>
                          </td>
                          <td style={s.td}>
                            <span style={{ ...s.pill, ...pillColor(job.status) }}>{job.status}</span>
                          </td>
                          <td style={{ ...s.td, fontWeight: "600", color: "#202124" }}>
                            {job.appCount}
                          </td>
                          <td style={{ ...s.td, color: "#0d652d", fontWeight: "600" }}>
                            {job.shortlisted}
                          </td>
                          <td style={{ ...s.td, color: "#0b5123", fontWeight: "600" }}>
                            {job.hired}
                          </td>
                          <td style={s.td}>
                            <span style={{
                              ...s.conversionBadge,
                              ...(job.hired > 0
                                ? { background: "#e6f4ea", color: "#0d652d" }
                                : { background: "#f1f3f4", color: "#5f6368" }
                              ),
                            }}>
                              {conversion}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
    </>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────
function StatCard({ label, value, color, small }) {
  return (
    <div style={s.statCard}>
      <div style={s.statHeader}>
        <div style={s.statLabel}>{label}</div>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: color }} />
      </div>
      <div style={{ ...s.statValue, fontSize: small ? "24px" : "32px" }}>{value}</div>
    </div>
  );
}

function EmptyChart({ label }) {
  return (
    <div style={s.emptyChart}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dadce0" strokeWidth="1.5" style={{ marginBottom: 8 }}>
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
      <span style={{ color: "#9aa0a6", fontSize: "13px" }}>{label}</span>
    </div>
  );
}

function pillColor(status) {
  const map = {
    live:    { background: "#e6f4ea", color: "#0d652d" },
    draft:   { background: "#f1f3f4", color: "#3c4043" },
    paused:  { background: "#fef7e0", color: "#ea8600" },
    expired: { background: "#fce8e6", color: "#c5221f" },
  };
  return map[status] || { background: "#f1f3f4", color: "#3c4043" };
}

// ── Styles ────────────────────────────────────────────────────────────
const s = {
  // ── Page Shell ──
  page: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    background: "#f4f5f7",
    fontFamily: FONT,
  },

  // ── Sidebar ──

  // ── Main ──
  mainWrapper: { flex: 1, height: "100%", overflowY: "auto", position: "relative" },
  mainInner: { padding: "32px 48px", maxWidth: "1400px", margin: "0 auto" },
  topbar: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", gap: "16px" },
  pageTitle: { color: "#202124", fontSize: "24px", fontWeight: "600", margin: "0 0 4px", letterSpacing: "-0.5px" },
  pageSub: { color: "#5f6368", fontSize: "14px", margin: 0 },
  empty: { color: "#5f6368", padding: "48px", textAlign: "center", fontSize: "14px", fontWeight: "500" },

  // ── Stat cards ──
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "24px" },
  statCard: { background: "#ffffff", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1), 0 1px 3px 1px rgba(60,64,67,0.05)" },
  statHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  statValue: { color: "#202124", fontWeight: "600", lineHeight: 1, letterSpacing: "-0.5px" },
  statLabel: { color: "#5f6368", fontSize: "13px", fontWeight: "500" },

  // ── Cards ──
  card: { background: "#ffffff", border: "1px solid #e3e3e3", borderRadius: "8px", padding: "24px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.06)", marginBottom: "24px" },
  cardHeader: { marginBottom: "20px" },
  cardTitle: { color: "#202124", fontSize: "14px", fontWeight: "600", marginBottom: "2px" },
  cardSub: { color: "#5f6368", fontSize: "12px" },

  // ── Two-col row ──
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "0" },

  // ── Funnel ──
  funnelList: { display: "flex", flexDirection: "column", gap: "12px" },
  funnelRow: { display: "flex", alignItems: "center", gap: "12px" },
  funnelLabelWrap: { display: "flex", alignItems: "center", gap: "8px", width: "140px", flexShrink: 0 },
  funnelDot: { width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0 },
  funnelLabel: { color: "#3c4043", fontSize: "13px", fontWeight: "500", flex: 1 },
  funnelCount: { borderRadius: "4px", padding: "1px 7px", fontSize: "11px", fontWeight: "700", flexShrink: 0 },
  funnelBarTrack: { flex: 1, height: "8px", background: "#f1f3f4", borderRadius: "4px", overflow: "hidden" },
  funnelBar: { height: "100%", borderRadius: "4px", transition: "width 0.4s ease", minWidth: "4px" },
  funnelPct: { width: "36px", textAlign: "right", color: "#9aa0a6", fontSize: "12px", fontWeight: "500", flexShrink: 0 },

  // ── Trend chart ──
  trendChart: { display: "flex", alignItems: "flex-end", gap: "8px", height: "160px", paddingTop: "24px" },
  trendCol: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%" },
  trendValue: { color: "#5f6368", fontSize: "11px", fontWeight: "600", minHeight: "16px" },
  trendBarTrack: { flex: 1, width: "100%", display: "flex", alignItems: "flex-end", background: "#f8f9fa", borderRadius: "4px 4px 0 0", overflow: "hidden" },
  trendBar: { width: "100%", borderRadius: "4px 4px 0 0", transition: "height 0.4s ease", minHeight: "4px" },
  trendLabel: { color: "#9aa0a6", fontSize: "11px", fontWeight: "500" },

  // ── Locations ──
  locationGrid: { display: "flex", flexDirection: "column", gap: "10px" },
  locationRow: { display: "flex", alignItems: "center", gap: "12px" },
  locationRank: { width: "20px", color: "#9aa0a6", fontSize: "12px", fontWeight: "600", flexShrink: 0, textAlign: "center" },
  locationCity: { width: "120px", color: "#3c4043", fontSize: "13px", fontWeight: "500", flexShrink: 0 },
  locationBarTrack: { flex: 1, height: "6px", background: "#f1f3f4", borderRadius: "3px", overflow: "hidden" },
  locationBar: { height: "100%", background: "#1a73e8", borderRadius: "3px", transition: "width 0.4s ease" },
  locationCount: { width: "32px", textAlign: "right", color: "#5f6368", fontSize: "12px", fontWeight: "600", flexShrink: 0 },

  // ── Empty chart ──
  emptyChart: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0" },

  // ── Table section ──
  section: { marginBottom: "40px" },
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0" },
  sectionTitle: { color: "#202124", fontSize: "16px", fontWeight: "600", margin: "0 0 16px" },
  tableWrap: { overflowX: "auto", background: "#ffffff", borderRadius: "8px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1), 0 1px 3px 1px rgba(60,64,67,0.05)" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  th: { color: "#5f6368", fontWeight: "600", textAlign: "left", padding: "12px 24px", borderBottom: "1px solid #e3e3e3", whiteSpace: "nowrap", background: "#f8f9fa", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" },
  tr: { borderBottom: "1px solid #e3e3e3", transition: "background 0.2s" },
  td: { color: "#202124", padding: "16px 24px", verticalAlign: "middle" },
  jobTitleText: { fontWeight: "600", marginBottom: "4px", fontSize: "14px", color: "#1a73e8" },
  jobSub: { color: "#5f6368", fontSize: "12px" },
  pill: { padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" },
  conversionBadge: { borderRadius: "4px", padding: "3px 8px", fontSize: "12px", fontWeight: "600" },
  emptyCard: { background: "#ffffff", borderRadius: "8px", padding: "48px 32px", textAlign: "center", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1)" },
  emptyText: { color: "#5f6368", fontSize: "14px", margin: 0 },
};