import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import EmployerSidebar from "../../components/EmployerSidebar";

const FONT = '"Circular Std", "Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const JOB_PRICE = 450;

export default function Billing() {
  const { user, employerProfile } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, "jobs"), where("employerId", "==", user.uid))
      );
      setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // ── Generate Invoice PDF ───────────────────────────────────────────
  const generateInvoicePDF = ({ monthLabel, monthAmount, monthLiveCount, monthDueStr, status, monthJobs }) => {
    const company     = employerProfile?.companyName || "Employer";
    const email       = user?.email || "";
    const genDate     = new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
    const invoiceNo   = `VTD-${new Date().getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(user?.uid || "000000").slice(-6).toUpperCase()}`;
    const statusLabel = status === "paid" ? "PAID" : status === "outstanding" ? "OUTSTANDING" : "NO CHARGE";
    const statusColor = status === "paid" ? "#0d652d" : status === "outstanding" ? "#ea8600" : "#9aa0a6";
    const statusBg    = status === "paid" ? "#e6f4ea" : status === "outstanding" ? "#fef7e0" : "#f1f3f4";

    const listingRows = (monthJobs || liveJobs).map((job, i) => `
      <tr class="${i % 2 === 0 ? "even" : "odd"}">
        <td>${i + 1}</td>
        <td><strong>${job.title || "—"}</strong><br><span class="sub">${job.city || ""}${job.province ? `, ${job.province}` : ""}</span></td>
        <td>${job.department || "—"}</td>
        <td>${job.type || "—"}</td>
        <td class="status-live">Live</td>
        <td class="amount">R ${JOB_PRICE.toLocaleString("en-ZA")}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Invoice ${invoiceNo} — Vetted</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #202124; background: #fff; }
  .page { padding: 40px 48px; max-width: 800px; margin: 0 auto; }

  /* ── Header ── */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand-mark { width: 38px; height: 38px; background: #ffca28; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; color: #d84315; }
  .brand-name { font-size: 22px; font-weight: 700; color: #202124; letter-spacing: -0.5px; }
  .brand-sub  { font-size: 11px; color: #9aa0a6; margin-top: 1px; }
  .invoice-meta { text-align: right; }
  .invoice-title { font-size: 28px; font-weight: 700; color: #202124; letter-spacing: -1px; margin-bottom: 6px; }
  .invoice-no    { font-size: 12px; color: #5f6368; margin-bottom: 3px; }
  .invoice-date  { font-size: 11px; color: #9aa0a6; }

  /* ── Divider ── */
  .divider { border: none; border-top: 2px solid #202124; margin: 0 0 28px; }

  /* ── Bill to / from grid ── */
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 28px; }
  .party-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #9aa0a6; margin-bottom: 6px; }
  .party-name  { font-size: 14px; font-weight: 700; color: #202124; margin-bottom: 2px; }
  .party-sub   { font-size: 11px; color: #5f6368; line-height: 1.6; }

  /* ── Summary box ── */
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border: 1px solid #e3e3e3; border-radius: 6px; overflow: hidden; margin-bottom: 28px; }
  .summary-item { padding: 14px 18px; border-right: 1px solid #e3e3e3; }
  .summary-item:last-child { border-right: none; }
  .summary-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #9aa0a6; margin-bottom: 4px; }
  .summary-value { font-size: 15px; font-weight: 700; color: #202124; }
  .status-badge  { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; background: ${statusBg}; color: ${statusColor}; }

  /* ── Line items table ── */
  .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #5f6368; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
  thead tr { background: #202124; }
  thead th { padding: 9px 12px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #ffffff; white-space: nowrap; }
  th.amount, td.amount { text-align: right; }
  tbody tr.even { background: #ffffff; }
  tbody tr.odd  { background: #f8f9fa; }
  tbody td { padding: 10px 12px; vertical-align: top; border-bottom: 1px solid #f1f3f4; font-size: 11px; line-height: 1.4; }
  tbody tr:last-child td { border-bottom: none; }
  td .sub { color: #9aa0a6; font-size: 10px; }
  td.status-live { color: #0d652d; font-weight: 600; }
  td.amount { font-weight: 600; color: #202124; text-align: right; }

  /* ── Total row ── */
  .total-row { border-top: 2px solid #202124; }
  .total-row td { padding: 12px; font-weight: 700; font-size: 13px; color: #202124; }
  .total-label { text-align: right; }
  .total-amount { text-align: right; font-size: 16px; }

  /* ── Bank details ── */
  .bank-section { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
  .bank-box { background: #f8f9fa; border: 1px solid #e3e3e3; border-radius: 6px; padding: 16px 18px; }
  .bank-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; border-bottom: 1px solid #e3e3e3; }
  .bank-row:last-child { border-bottom: none; }
  .bank-key   { color: #5f6368; }
  .bank-val   { color: #202124; font-weight: 600; text-align: right; }
  .ref-val    { color: #1967d2; font-weight: 700; font-family: "Courier New", monospace; text-align: right; }
  .ref-note   { background: #e3f2fd; border: 1px solid #bdd7f5; border-radius: 6px; padding: 12px 14px; color: #1967d2; font-size: 11px; line-height: 1.6; }

  /* ── Footer ── */
  .footer { border-top: 1px solid #e3e3e3; padding-top: 14px; display: flex; justify-content: space-between; font-size: 10px; color: #9aa0a6; }

  /* ── No listings ── */
  .no-listings { text-align: center; padding: 32px; color: #9aa0a6; font-size: 12px; background: #f8f9fa; border-radius: 6px; margin-bottom: 28px; }

  @media print {
    body { font-size: 10px; }
    .page { padding: 24px 28px; }
    @page { margin: 1.5cm; size: A4 portrait; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="brand">
      <div class="brand-mark">V</div>
      <div>
        <div class="brand-name">Vetted</div>
        <div class="brand-sub">vetted.co.za</div>
      </div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-no">${invoiceNo}</div>
      <div class="invoice-date">Generated ${genDate}</div>
    </div>
  </div>

  <hr class="divider">

  <!-- Bill From / To -->
  <div class="parties">
    <div>
      <div class="party-label">From</div>
      <div class="party-name">Vetted (Pty) Ltd</div>
      <div class="party-sub">vetted.co.za<br>support@vetted.co.za<br>South Africa</div>
    </div>
    <div>
      <div class="party-label">Bill To</div>
      <div class="party-name">${company}</div>
      <div class="party-sub">${email}<br>Billing Period: ${monthLabel}<br>Due: ${monthDueStr}</div>
    </div>
  </div>

  <!-- Summary -->
  <div class="summary">
    <div class="summary-item">
      <div class="summary-label">Invoice No.</div>
      <div class="summary-value" style="font-size:12px;">${invoiceNo}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Billing Period</div>
      <div class="summary-value" style="font-size:12px;">${monthLabel}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Amount Due</div>
      <div class="summary-value">R ${monthAmount.toLocaleString("en-ZA")}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Status</div>
      <div class="summary-value"><span class="status-badge">${statusLabel}</span></div>
    </div>
  </div>

  <!-- Line Items -->
  <div class="section-title">Line Items — Active Listings</div>
  ${monthLiveCount === 0
    ? `<div class="no-listings">No active listings this period — no charge applies.</div>`
    : `<table>
    <thead>
      <tr>
        <th style="width:28px">#</th>
        <th>Job Title</th>
        <th>Department</th>
        <th>Type</th>
        <th>Status</th>
        <th class="amount">Charge</th>
      </tr>
    </thead>
    <tbody>
      ${listingRows}
      <tr class="total-row">
        <td colspan="5" class="total-label">Total Monthly Charge</td>
        <td class="total-amount">R ${monthAmount.toLocaleString("en-ZA")}</td>
      </tr>
    </tbody>
  </table>`}

  <!-- Bank Details -->
  <div class="section-title">Payment Details</div>
  <div class="bank-section">
    <div class="bank-box">
      <div class="bank-row"><span class="bank-key">Bank</span><span class="bank-val">First National Bank (FNB)</span></div>
      <div class="bank-row"><span class="bank-key">Account Name</span><span class="bank-val">Vetted (Pty) Ltd</span></div>
      <div class="bank-row"><span class="bank-key">Account No.</span><span class="bank-val">62000000000</span></div>
      <div class="bank-row"><span class="bank-key">Branch Code</span><span class="bank-val">250655</span></div>
      <div class="bank-row"><span class="bank-key">Account Type</span><span class="bank-val">Cheque / Current</span></div>
      <div class="bank-row"><span class="bank-key">Reference</span><span class="ref-val">${email}</span></div>
    </div>
    <div class="ref-note">
      <strong>Important:</strong> Use your registered email address (<strong>${email}</strong>) as the payment reference. This allows us to match your payment to your account. Proof of payment will be sent within 24 hours of clearance.
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <span>Vetted (Pty) Ltd · vetted.co.za</span>
    <span>Confidential · For internal use only</span>
    <span>${invoiceNo} · ${monthLabel}</span>
  </div>

</div>
<script>window.onload = () => window.print();</script>
</body>
</html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  };

  // ── Derived billing data ───────────────────────────────────────────

  const liveJobs    = jobs.filter(j => j.status === "live");
  const currentCost = liveJobs.length * JOB_PRICE;
  const paymentRef  = user?.email || "";
  const isPaid      = employerProfile?.paymentStatus === "paid";

  // Due date — 15th of current or next month
  const now = new Date();
  const dueDate = new Date(now.getFullYear(), now.getMonth(), 15);
  if (now.getDate() > 15) dueDate.setMonth(dueDate.getMonth() + 1);
  const dueDateStr = dueDate.toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" });

  // Build monthly billing history from jobs — last 6 months
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("en-ZA", { month: "long", year: "numeric" }),
      shortLabel: d.toLocaleDateString("en-ZA", { month: "short", year: "2-digit" }),
      year: d.getFullYear(),
      month: d.getMonth(),
      liveCount: 0,
      amount: 0,
    };
  });

  // For each month, count jobs that were live during that period
  // We approximate: a job is counted in a month if it was created on or before that month
  // and its status was live (or it's currently live)
  jobs.forEach(job => {
    if (!job.createdAt) return;
    const created = job.createdAt.toDate?.() || new Date(job.createdAt);
    months.forEach(m => {
      const monthStart = new Date(m.year, m.month, 1);
      const monthEnd   = new Date(m.year, m.month + 1, 0);
      // Count job if it was created before or during this month
      // and was live at some point (status is live, paused, or expired means it was once live)
      if (
        created <= monthEnd &&
        ["live", "paused", "expired", "cancelled"].includes(job.status)
      ) {
        m.liveCount++;
        m.amount += JOB_PRICE;
      }
    });
  });

  const totalBilled = months.reduce((sum, m) => sum + m.amount, 0);
  const currentMonthIdx = months.length - 1;

  if (loading) return (
    <><style>{`* { font-family: ${FONT} !important; } body { font-family: ${FONT} !important; }`}</style>
    <div style={s.page}>
      <EmployerSidebar />
      <div style={s.mainWrapper}>
        <div style={s.mainInner}>
          <div style={s.empty}>Fetching billing data...</div>
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
              <h1 style={s.pageTitle}>Billing & Invoices</h1>
              <p style={s.pageSub}>Usage-based billing · R{JOB_PRICE} per live listing per month</p>
            </div>
            {currentCost > 0 && (
              <button
                style={s.downloadInvoiceBtn}
                onClick={() => generateInvoicePDF({
                  monthLabel:     now.toLocaleDateString("en-ZA", { month: "long", year: "numeric" }),
                  monthAmount:    currentCost,
                  monthLiveCount: liveJobs.length,
                  monthDueStr:    dueDateStr,
                  status:         isPaid ? "paid" : "outstanding",
                  monthJobs:      liveJobs,
                })}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download Current Invoice
              </button>
            )}
          </div>

          {/* ── Current invoice card ── */}
          <div style={s.invoiceHero}>

            {/* Left — amount + status */}
            <div style={s.invoiceHeroLeft}>
              <div style={s.invoiceTag}>Current Month · {now.toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}</div>
              <div style={s.invoiceAmount}>R {currentCost.toLocaleString("en-ZA")}</div>
              <div style={s.invoiceBreakdown}>
                {liveJobs.length} live listing{liveJobs.length !== 1 ? "s" : ""} × R{JOB_PRICE}
              </div>

              <div style={s.invoiceStatusRow}>
                <div style={s.invoiceDuePill}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Due {dueDateStr}
                </div>
                <div style={{
                  ...s.paymentStatusBadge,
                  ...(isPaid
                    ? { background: "#e6f4ea", color: "#0d652d", border: "1px solid #ceead6" }
                    : currentCost > 0
                      ? { background: "#fef7e0", color: "#ea8600", border: "1px solid #fde68a" }
                      : { background: "#f1f3f4", color: "#5f6368", border: "1px solid #e3e3e3" }
                  ),
                }}>
                  {isPaid ? "✓ Paid" : currentCost > 0 ? "Outstanding" : "Nothing owed"}
                </div>
              </div>

              {currentCost === 0 && (
                <div style={s.zeroCostNote}>
                  No active listings this month — zero charges apply.
                </div>
              )}
            </div>

            <div style={s.invoiceHeroDivider} />

            {/* Right — bank details */}
            <div style={s.invoiceHeroRight}>
              <div style={s.bankTitle}>Payment Instructions</div>
              <div style={s.bankCard}>
                {[
                  ["Bank",           "First National Bank (FNB)"],
                  ["Account Name",   "Vetted (Pty) Ltd"],
                  ["Account No.",    "62000000000"],
                  ["Branch Code",    "250655"],
                  ["Account Type",   "Cheque / Current"],
                ].map(([label, value]) => (
                  <div key={label} style={s.bankRow}>
                    <span style={s.bankLabel}>{label}</span>
                    <span style={s.bankValue}>{value}</span>
                  </div>
                ))}
                <div style={{ ...s.bankRow, borderTop: "1px solid #dadce0", marginTop: "6px", paddingTop: "10px" }}>
                  <span style={s.bankLabel}>Your Reference</span>
                  <span style={s.refValue}>{paymentRef}</span>
                </div>
              </div>
              <div style={s.refNote}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Use your email address as the payment reference so we can match your payment accurately.
              </div>
            </div>
          </div>

          {/* ── Stat summary ── */}
          <div style={s.statsGrid}>
            <StatCard label="Current Month"   value={`R ${currentCost.toLocaleString("en-ZA")}`} color="#1a73e8"  small />
            <StatCard label="Live Listings"   value={liveJobs.length}                              color="#0f9d58" />
            <StatCard label="Total (6 mo.)"   value={`R ${totalBilled.toLocaleString("en-ZA")}`}  color="#ea8600" small />
            <StatCard label="Price per Listing" value={`R ${JOB_PRICE}`}                           color="#5f6368" small />
          </div>

          {/* ── Billing History Table ── */}
          <div style={s.section}>
            <h2 style={s.sectionTitle}>Billing History</h2>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {["Period", "Live Listings", "Amount", "Due Date", "Status", ""].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...months].reverse().map((m, i) => {
                    const isCurrentMonth = i === 0;
                    const monthDue = new Date(m.year, m.month, 15);
                    if (new Date(m.year, m.month, 1) <= now && monthDue < now && !isCurrentMonth) {
                      monthDue.setMonth(monthDue.getMonth());
                    }
                    const monthDueStr = monthDue.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
                    const status = isCurrentMonth
                      ? isPaid ? "paid" : m.amount > 0 ? "outstanding" : "none"
                      : m.amount > 0 ? "historical" : "none";

                    return (
                      <tr key={m.key} style={{ ...s.tr, ...(isCurrentMonth ? { background: "#f8fbff" } : {}) }}>
                        <td style={s.td}>
                          <div style={{ fontWeight: isCurrentMonth ? "600" : "500", color: "#202124", fontSize: "14px" }}>
                            {m.label}
                          </div>
                          {isCurrentMonth && (
                            <div style={s.currentBadge}>Current</div>
                          )}
                        </td>
                        <td style={{ ...s.td, fontWeight: "600", color: "#3c4043" }}>
                          {m.liveCount}
                        </td>
                        <td style={s.td}>
                          <span style={{ fontWeight: "600", color: m.amount > 0 ? "#202124" : "#9aa0a6", fontSize: "14px" }}>
                            {m.amount > 0 ? `R ${m.amount.toLocaleString("en-ZA")}` : "—"}
                          </span>
                        </td>
                        <td style={{ ...s.td, color: "#5f6368" }}>{monthDueStr}</td>
                        <td style={s.td}>
                          <StatusBadge status={status} isPaid={isPaid && isCurrentMonth} />
                        </td>
                        <td style={s.td}>
                          {m.amount > 0 && (
                            <button
                              style={s.printBtn}
                              onClick={() => generateInvoicePDF({
                                monthLabel:     m.label,
                                monthAmount:    m.amount,
                                monthLiveCount: m.liveCount,
                                monthDueStr:    monthDueStr,
                                status:         status,
                                monthJobs:      isCurrentMonth ? liveJobs : [],
                              })}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                              Download PDF
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Live listings breakdown ── */}
          {liveJobs.length > 0 && (
            <div style={s.section}>
              <h2 style={s.sectionTitle}>Current Listing Charges</h2>
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {["Listing", "Department", "Region", "Status", "Monthly Charge"].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {liveJobs.map(job => (
                      <tr key={job.id} style={s.tr}>
                        <td style={s.td}>
                          <div style={s.jobTitleText}>{job.title}</div>
                          <div style={s.jobSub}>{job.city}</div>
                        </td>
                        <td style={s.td}>{job.department || "—"}</td>
                        <td style={s.td}>{job.province || "—"}</td>
                        <td style={s.td}>
                          <span style={{ ...s.pill, background: "#e6f4ea", color: "#0d652d" }}>Live</span>
                        </td>
                        <td style={{ ...s.td, fontWeight: "600", color: "#0d652d" }}>
                          R {JOB_PRICE.toLocaleString("en-ZA")}
                        </td>
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr style={{ ...s.tr, background: "#f8f9fa", borderTop: "2px solid #e3e3e3" }}>
                      <td style={{ ...s.td, fontWeight: "700", color: "#202124" }} colSpan={4}>
                        Total Monthly Charge
                      </td>
                      <td style={{ ...s.td, fontWeight: "700", color: "#202124", fontSize: "16px" }}>
                        R {currentCost.toLocaleString("en-ZA")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Pricing note ── */}
          <div style={s.pricingNote}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
              <strong>How billing works:</strong> You are charged R{JOB_PRICE} per live job listing per month.
              Drafts and paused listings are not billed. Payment is due on the 15th of each month.
              Proof of payment is sent within 24 hours of clearance.
            </div>
          </div>

        </div>
      </div>
    </div>
    </>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────
function StatusBadge({ status, isPaid }) {
  const styles = {
    paid:        { background: "#e6f4ea", color: "#0d652d", border: "1px solid #ceead6" },
    outstanding: { background: "#fef7e0", color: "#ea8600", border: "1px solid #fde68a" },
    historical:  { background: "#f1f3f4", color: "#5f6368", border: "1px solid #e3e3e3" },
    none:        { background: "#f1f3f4", color: "#9aa0a6", border: "1px solid #e3e3e3" },
  };
  const labels = {
    paid:        "✓ Paid",
    outstanding: "Outstanding",
    historical:  "Billed",
    none:        "No charge",
  };
  const key = isPaid ? "paid" : status;
  return (
    <span style={{ ...s.statusBadge, ...styles[key] }}>
      {labels[key]}
    </span>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────
function StatCard({ label, value, color, small }) {
  return (
    <div style={s.statCard}>
      <div style={s.statHeader}>
        <div style={s.statLabel}>{label}</div>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: color }} />
      </div>
      <div style={{ ...s.statValue, fontSize: small ? "22px" : "32px" }}>{value}</div>
    </div>
  );
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
  mainInner: { padding: "32px 48px", maxWidth: "1200px", margin: "0 auto" },
  topbar: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", gap: "16px" },
  pageTitle: { color: "#202124", fontSize: "24px", fontWeight: "600", margin: "0 0 4px", letterSpacing: "-0.5px" },
  pageSub: { color: "#5f6368", fontSize: "14px", margin: 0 },
  downloadInvoiceBtn: { display: "inline-flex", alignItems: "center", gap: "7px", background: "#1a73e8", border: "none", color: "#ffffff", borderRadius: "4px", padding: "9px 18px", fontSize: "13px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, fontFamily: FONT },
  empty: { color: "#5f6368", padding: "48px", textAlign: "center", fontSize: "14px", fontWeight: "500" },

  // ── Invoice hero card ──
  invoiceHero: { background: "#ffffff", borderRadius: "8px", padding: "32px", display: "grid", gridTemplateColumns: "1fr auto 1.4fr", gap: "40px", alignItems: "start", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1), 0 1px 3px 1px rgba(60,64,67,0.05)", marginBottom: "24px" },
  invoiceHeroLeft: { display: "flex", flexDirection: "column", gap: "0" },
  invoiceTag: { color: "#5f6368", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" },
  invoiceAmount: { color: "#202124", fontSize: "44px", fontWeight: "600", lineHeight: 1, marginBottom: "6px", letterSpacing: "-1.5px" },
  invoiceBreakdown: { color: "#5f6368", fontSize: "14px", marginBottom: "20px" },
  invoiceStatusRow: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  invoiceDuePill: { display: "inline-flex", alignItems: "center", gap: "6px", background: "#f8f9fa", border: "1px solid #dadce0", borderRadius: "4px", padding: "6px 10px", fontSize: "12px", fontWeight: "500", color: "#3c4043" },
  paymentStatusBadge: { borderRadius: "4px", padding: "6px 10px", fontSize: "12px", fontWeight: "600" },
  zeroCostNote: { marginTop: "16px", color: "#0d652d", fontSize: "13px", fontWeight: "500", background: "#e6f4ea", padding: "8px 12px", borderRadius: "4px", display: "inline-block" },
  invoiceHeroDivider: { width: "1px", background: "#e3e3e3", alignSelf: "stretch" },
  invoiceHeroRight: {},

  // ── Bank details ──
  bankTitle: { color: "#202124", fontSize: "14px", fontWeight: "600", marginBottom: "14px" },
  bankCard: { background: "#f8f9fa", borderRadius: "6px", padding: "14px 16px", border: "1px solid #e3e3e3", marginBottom: "12px" },
  bankRow: { display: "flex", justifyContent: "space-between", gap: "16px", padding: "5px 0", fontSize: "13px" },
  bankLabel: { color: "#5f6368" },
  bankValue: { color: "#202124", textAlign: "right", fontWeight: "500" },
  refValue: { color: "#1a73e8", textAlign: "right", fontWeight: "600", fontFamily: '"Roboto Mono", monospace', fontSize: "13px" },
  refNote: { display: "flex", alignItems: "flex-start", gap: "8px", background: "#e3f2fd", color: "#1967d2", fontSize: "12px", lineHeight: "1.5", padding: "12px 14px", borderRadius: "6px" },

  // ── Stat cards ──
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "32px" },
  statCard: { background: "#ffffff", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1), 0 1px 3px 1px rgba(60,64,67,0.05)" },
  statHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  statValue: { color: "#202124", fontWeight: "600", lineHeight: 1, letterSpacing: "-0.5px" },
  statLabel: { color: "#5f6368", fontSize: "13px", fontWeight: "500" },

  // ── Tables ──
  section: { marginBottom: "32px" },
  sectionTitle: { color: "#202124", fontSize: "16px", fontWeight: "600", margin: "0 0 16px" },
  tableWrap: { overflowX: "auto", background: "#ffffff", borderRadius: "8px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.1), 0 1px 3px 1px rgba(60,64,67,0.05)" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  th: { color: "#5f6368", fontWeight: "600", textAlign: "left", padding: "12px 24px", borderBottom: "1px solid #e3e3e3", whiteSpace: "nowrap", background: "#f8f9fa", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" },
  tr: { borderBottom: "1px solid #e3e3e3", transition: "background 0.2s" },
  td: { color: "#202124", padding: "16px 24px", verticalAlign: "middle" },
  jobTitleText: { fontWeight: "600", marginBottom: "4px", fontSize: "14px", color: "#1a73e8" },
  jobSub: { color: "#5f6368", fontSize: "12px" },
  pill: { padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" },
  currentBadge: { display: "inline-block", background: "#e3f2fd", color: "#1967d2", borderRadius: "4px", padding: "2px 6px", fontSize: "10px", fontWeight: "700", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.4px" },
  statusBadge: { borderRadius: "4px", padding: "4px 8px", fontSize: "11px", fontWeight: "600" },
  printBtn: { display: "inline-flex", alignItems: "center", gap: "5px", background: "transparent", border: "1px solid #dadce0", color: "#5f6368", borderRadius: "4px", padding: "5px 10px", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: FONT },

  // ── Pricing note ──
  pricingNote: { display: "flex", alignItems: "flex-start", gap: "10px", background: "#e3f2fd", color: "#1967d2", fontSize: "13px", lineHeight: "1.6", padding: "16px 18px", borderRadius: "8px", marginBottom: "40px" },
};