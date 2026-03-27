import { useState, useRef, useEffect } from "react";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../../lib/firebase";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// ─── Verify types config ────────────────────────────────────────────────────
const VERIFY_TYPES = [
  {
    key: "job",
    label: "Job Listing",
    placeholder: "e.g., VET-ABC123 or paste a job URL",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key: "employer",
    label: "Employer",
    placeholder: "e.g., Acme Corp or company name",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key: "email",
    label: "Email Address",
    placeholder: "e.g., hr@company.co.za",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

// ─── Firestore lookup functions ─────────────────────────────────────────────
async function verifyJob(input) {
  const val = input.trim();
  try {
    // 1. Try by Firestore doc ID (exact match)
    const { doc, getDoc } = await import("firebase/firestore");
    const directSnap = await getDoc(doc(db, "jobs", val));
    if (directSnap.exists()) {
      const d = directSnap.data();
      if (d.status === "live") {
        return { found: true, data: { ...d, id: directSnap.id } };
      } else {
        return { found: false, reason: "expired" };
      }
    }

    // 2. Try by title (partial, case-insensitive not natively supported — search live jobs)
    const snap = await getDocs(
      query(collection(db, "jobs"), where("status", "==", "live"), limit(100))
    );
    const lower = val.toLowerCase();
    const match = snap.docs.find(d => {
      const j = d.data();
      return (
        j.title?.toLowerCase().includes(lower) ||
        d.id.toLowerCase() === lower
      );
    });
    if (match) {
      return { found: true, data: { ...match.data(), id: match.id } };
    }
    return { found: false, reason: "notfound" };
  } catch (e) {
    console.error(e);
    return { found: false, reason: "error" };
  }
}

async function verifyEmployer(input) {
  const val = input.trim().toLowerCase();
  try {
    const snap = await getDocs(
      query(
        collection(db, "employers"),
        where("verificationStatus", "==", "approved"),
        limit(200)
      )
    );
    const match = snap.docs.find(d => {
      const e = d.data();
      return (
        e.companyName?.toLowerCase().includes(val) ||
        e.slug?.toLowerCase() === val ||
        e.registrationNumber?.toLowerCase() === val
      );
    });
    if (match) {
      const e = match.data();
      return { found: true, data: { companyName: e.companyName, industry: e.industry, verified: true, slug: e.slug } };
    }
    return { found: false, reason: "notfound" };
  } catch (e) {
    console.error(e);
    return { found: false, reason: "error" };
  }
}

async function verifyEmail(input) {
  const val = input.trim().toLowerCase();
  try {
    // Check if any verified employer has this as their application/contact email
    const snap = await getDocs(
      query(
        collection(db, "employers"),
        where("verificationStatus", "==", "approved"),
        limit(200)
      )
    );
    const match = snap.docs.find(d => {
      const e = d.data();
      return (
        e.appEmail?.toLowerCase() === val ||
        e.email?.toLowerCase() === val ||
        e.contactEmail?.toLowerCase() === val
      );
    });
    if (match) {
      const e = match.data();
      return { found: true, data: { companyName: e.companyName, email: val } };
    }
    return { found: false, reason: "notfound" };
  } catch (e) {
    console.error(e);
    return { found: false, reason: "error" };
  }
}

// ─── Result details for success modal ───────────────────────────────────────
function SuccessDetails({ type, data }) {
  if (!data) return null;
  if (type === "job") return (
    <div style={ms.detailBox}>
      <div style={ms.detailRow}><span style={ms.detailLabel}>Role</span><span style={ms.detailVal}>{data.title}</span></div>
      <div style={ms.detailRow}><span style={ms.detailLabel}>Employer</span><span style={ms.detailVal}>{data.employerName}</span></div>
      <div style={ms.detailRow}><span style={ms.detailLabel}>Location</span><span style={ms.detailVal}>{data.city}, {data.province}</span></div>
      <div style={ms.detailRow}><span style={ms.detailLabel}>Type</span><span style={ms.detailVal}>{data.type}</span></div>
      {data.closes && <div style={ms.detailRow}><span style={ms.detailLabel}>Closes</span><span style={ms.detailVal}>{data.closes}</span></div>}
    </div>
  );
  if (type === "employer") return (
    <div style={ms.detailBox}>
      <div style={ms.detailRow}><span style={ms.detailLabel}>Company</span><span style={ms.detailVal}>{data.companyName}</span></div>
      {data.industry && <div style={ms.detailRow}><span style={ms.detailLabel}>Industry</span><span style={ms.detailVal}>{data.industry}</span></div>}
      <div style={ms.detailRow}><span style={ms.detailLabel}>Status</span><span style={{ ...ms.detailVal, color: "#17a85a", fontWeight: 700 }}>✓ CIPC Verified</span></div>
    </div>
  );
  if (type === "email") return (
    <div style={ms.detailBox}>
      <div style={ms.detailRow}><span style={ms.detailLabel}>Email</span><span style={ms.detailVal}>{data.email}</span></div>
      <div style={ms.detailRow}><span style={ms.detailLabel}>Belongs to</span><span style={ms.detailVal}>{data.companyName}</span></div>
      <div style={ms.detailRow}><span style={ms.detailLabel}>Status</span><span style={{ ...ms.detailVal, color: "#17a85a", fontWeight: 700 }}>✓ Verified Employer</span></div>
    </div>
  );
  return null;
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function Verify() {
  const [selectedType, setSelectedType] = useState(VERIFY_TYPES[0]);
  const [inputVal, setInputVal]         = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [modal, setModal]               = useState(null); // null | "success" | "failure"
  const [result, setResult]             = useState(null);
  const [barError, setBarError]         = useState(false);

  const inputRef      = useRef(null);
  const dropdownRef   = useRef(null);
  const verifyBtnRef  = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close modal on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Lock body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = modal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [modal]);

  // URL param: ?job=xxx auto-fills and runs
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get("job");
    if (jobId) {
      setSelectedType(VERIFY_TYPES[0]);
      setInputVal(jobId);
      setTimeout(() => runVerification(jobId, VERIFY_TYPES[0]), 400);
    }
  }, []);

  const selectType = (type) => {
    setSelectedType(type);
    setInputVal("");
    setDropdownOpen(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const closeModal = () => {
    setModal(null);
    setResult(null);
    setTimeout(() => verifyBtnRef.current?.focus(), 50);
  };

  const runVerification = async (val, type) => {
    const v = (val ?? inputVal).trim();
    const t = type ?? selectedType;
    if (!v) {
      setBarError(true);
      setTimeout(() => setBarError(false), 1500);
      inputRef.current?.focus();
      return;
    }
    setLoading(true);
    try {
      let res;
      if (t.key === "job")      res = await verifyJob(v);
      else if (t.key === "employer") res = await verifyEmployer(v);
      else                      res = await verifyEmail(v);
      setResult(res);
      setModal(res.found ? "success" : "failure");
    } catch (e) {
      setResult({ found: false, reason: "error" });
      setModal("failure");
    }
    setLoading(false);
  };

  const failureMessage = () => {
    if (!result) return "";
    if (result.reason === "expired") return "This job listing exists but has expired or been closed. It is no longer accepting applications.";
    if (result.reason === "error")   return "We couldn't complete the check. Please try again or contact support@vetted.co.za.";
    if (selectedType.key === "job")  return "This job listing ID or title was not found in our verified listings database. If you received this from an external source, do not apply or send any personal information.";
    if (selectedType.key === "employer") return "This company name is not in our verified employer registry. Only CIPC-verified businesses are listed on Vetted. Do not engage with unverified recruitment sources.";
    return "This email address is not registered to any verified employer on Vetted. Do not send your CV or personal documents to this address.";
  };

  return (
    <div style={s.page}>
      <Navbar />

      <div style={s.wrapper}>
        <div style={s.card}>

          {/* Header */}
          <div style={s.brandRow}>
            <span style={s.brandName}>Vetted</span>
            <span style={s.brandDivider} />
            <span style={s.brandLabel}>Verify</span>
          </div>

          <p style={s.subtitle}>
            Select what you want to verify and enter the details below.<br />
            We'll confirm whether it's officially associated with a verified employer on Vetted.
          </p>

          {/* Input bar */}
          <div style={s.form}>
            <div style={{ ...s.bar, ...(barError ? s.barError : {}) }}>

              {/* Dropdown */}
              <div ref={dropdownRef} style={s.dropdownWrapper}>
                <button
                  style={{ ...s.dropdownTrigger, ...(dropdownOpen ? s.dropdownTriggerOpen : {}) }}
                  onClick={() => setDropdownOpen(o => !o)}
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={dropdownOpen}
                >
                  <span style={s.triggerLabel}>
                    <span style={s.triggerIcon}>{selectedType.icon}</span>
                    <span style={s.triggerText}>{selectedType.label}</span>
                  </span>
                  <svg style={{ ...s.chevron, ...(dropdownOpen ? s.chevronOpen : {}) }} viewBox="0 0 24 24" fill="none">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {dropdownOpen && (
                  <div style={s.dropdownMenu} role="listbox">
                    {VERIFY_TYPES.map(type => (
                      <button
                        key={type.key}
                        role="option"
                        aria-selected={selectedType.key === type.key}
                        style={{ ...s.dropdownOption, ...(selectedType.key === type.key ? s.dropdownOptionSelected : {}) }}
                        onClick={() => selectType(type)}
                      >
                        <span style={s.optionIcon}>{type.icon}</span>
                        {type.label}
                        {selectedType.key === type.key && (
                          <svg style={s.checkIcon} viewBox="0 0 24 24" fill="none">
                            <path d="M20 6L9 17l-5-5" stroke="#1a73e8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Text input */}
              <input
                ref={inputRef}
                style={s.input}
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !loading && runVerification()}
                placeholder={selectedType.placeholder}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                aria-label="Verification input"
              />

              {/* Verify button */}
              <button
                ref={verifyBtnRef}
                style={{ ...s.btn, ...(loading ? s.btnLoading : {}) }}
                onClick={() => !loading && runVerification()}
                disabled={loading}
                type="button"
              >
                {loading ? (
                  <span style={s.spinner} />
                ) : (
                  <span style={s.btnText}>Verify</span>
                )}
              </button>
            </div>

            <p style={s.reportNote}>
              Spotted a suspicious listing or fake employer?{" "}
              <a href="mailto:support@vetted.co.za" style={s.reportLink}>Report it here.</a>
            </p>
          </div>

          {/* How it works */}
          <div style={s.howItWorks}>
            <ul style={s.howList}>
              {[
                { title: "Job Listing", desc: "Paste a job ID or title to confirm it exists, is live, and matches what you were told." },
                { title: "Employer", desc: "Search a company name to confirm they are CIPC-verified and listed on Vetted." },
                { title: "Email Address", desc: "Enter an email address to confirm it belongs to a verified employer on our platform." },
              ].map(item => (
                <li key={item.title} style={s.howListItem}>
                  <strong style={s.howTitle}>{item.title}:</strong> <span style={s.howDesc}>{item.desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Success Modal ── */}
      {modal === "success" && (
        <div style={s.modalOverlay} onClick={e => e.target === e.currentTarget && closeModal()} role="dialog" aria-modal="true" aria-labelledby="success-title">
          <div style={s.modalContent}>
            <div style={s.modalHeader}>
              <div style={s.modalHeaderLogo}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2L17 6V10C17 13.87 13.87 17.6 10 18.5C6.13 17.6 3 13.87 3 10V6L10 2Z" fill="rgba(23,168,90,0.2)" stroke="#17a85a" strokeWidth="1.5"/>
                </svg>
                <span style={s.modalBrand}>Vetted</span>
                <span style={s.modalHeaderDivider} />
                <span style={s.modalHeaderLabel}>Verify</span>
              </div>
              <button style={s.closeBtn} onClick={closeModal} aria-label="Close">×</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.shieldWrap}>
                <svg style={s.shieldBg} viewBox="0 0 80 80" fill="none">
                  <path d="M40 6L68 18V36C68 54 55 68 40 74C25 68 12 54 12 36V18L40 6Z" fill="rgba(23,168,90,0.12)" stroke="#17a85a" strokeWidth="1.5"/>
                </svg>
                <div style={s.shieldInner}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#17a85a"/>
                    <path d="M7.5 12L10.5 15L16.5 9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <p style={{ ...s.assetId, color: "#17a85a" }}>{inputVal}</p>
              <h3 id="success-title" style={s.modalTitle}>
                This <span style={{ color: "#17a85a" }}>IS</span> an official<br />Vetted verified source.
              </h3>
              <SuccessDetails type={selectedType.key} data={result?.data} />
              <p style={s.modalSub}>
                This {selectedType.label.toLowerCase()} has been verified as legitimate on the Vetted platform.
                Always stay vigilant — never share sensitive documents unless you are 100% certain.
              </p>
              <button style={{ ...s.modalBtn, background: "#17a85a", color: "#fff" }} onClick={closeModal}>
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Failure Modal ── */}
      {modal === "failure" && (
        <div style={s.modalOverlay} onClick={e => e.target === e.currentTarget && closeModal()} role="dialog" aria-modal="true" aria-labelledby="failure-title">
          <div style={s.modalContent}>
            <div style={s.modalHeader}>
              <div style={s.modalHeaderLogo}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2L17 6V10C17 13.87 3 13.87 3 10V6L10 2Z" fill="rgba(224,48,48,0.15)" stroke="#e03030" strokeWidth="1.5"/>
                </svg>
                <span style={s.modalBrand}>Vetted</span>
                <span style={s.modalHeaderDivider} />
                <span style={s.modalHeaderLabel}>Verify</span>
              </div>
              <button style={s.closeBtn} onClick={closeModal} aria-label="Close">×</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.shieldWrap}>
                <svg style={s.shieldBg} viewBox="0 0 80 80" fill="none">
                  <path d="M40 6L68 18V36C68 54 55 68 40 74C25 68 12 54 12 36V18L40 6Z" fill="rgba(224,48,48,0.12)" stroke="#e03030" strokeWidth="1.5"/>
                </svg>
                <div style={s.shieldInner}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#e03030"/>
                    <path d="M8 8L16 16M16 8L8 16" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
              <p style={{ ...s.assetId, color: "#e03030" }}>{inputVal}</p>
              <h3 id="failure-title" style={s.modalTitle}>
                This is <span style={{ color: "#e03030" }}>NOT</span> verified<br />on the Vetted platform.
              </h3>
              <p style={s.modalSub}>{failureMessage()}</p>
              <p style={{ ...s.modalSub, marginTop: 0 }}>
                Contact us at{" "}
                <a href="mailto:support@vetted.co.za" style={{ color: "#0033a0", fontWeight: 600, textDecoration: "none" }}>
                  support@vetted.co.za
                </a>{" "}
                if you are unsure.
              </p>
              <button style={{ ...s.modalBtn, background: "#0a0a14", color: "#fff" }} onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />

      <style>{`
        @keyframes vtf-spin { to { transform: rotate(360deg); } }
        @keyframes vtf-dropdown { from { opacity:0; transform:translateY(-6px) scale(0.97); } to { opacity:1; transform:none; } }
        @keyframes vtf-modal { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:none; } }
        .vtf-modal-inner { animation: vtf-modal 0.32s cubic-bezier(0.22,1,0.36,1) forwards; }
        .vtf-dropdown-menu { animation: vtf-dropdown 0.18s cubic-bezier(0.22,1,0.36,1) forwards; }
      `}</style>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = {
  page: {
    background: "#06080e",
    minHeight: "100vh",
    fontFamily: '"Circular Std","Circular",-apple-system,BlinkMacSystemFont,sans-serif',
    color: "#fff",
    WebkitFontSmoothing: "antialiased",
  },
  wrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "calc(100vh - 120px)",
    padding: "60px 20px 80px",
    background: "radial-gradient(circle at 10% 20%, rgba(0,106,255,0.08), transparent 35%), radial-gradient(circle at 90% 75%, rgba(0,132,255,0.1), transparent 35%)",
  },
  card: {
    width: "100%",
    maxWidth: "680px",
    textAlign: "center",
    marginTop: "5rem",
  },

  // Brand header
  brandRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
    marginBottom: 14,
  },
  brandName: {
    fontSize: "clamp(22px,4vw,32px)",
    fontWeight: 700,
    color: "#fff",
    paddingRight: 16,
    letterSpacing: "-0.01em",
  },
  brandDivider: {
    display: "inline-block",
    width: 2,
    height: 24,
    background: "#555",
    flexShrink: 0,
  },
  brandLabel: {
    fontSize: "clamp(12px,2vw,15px)",
    fontWeight: 600,
    color: "#888",
    paddingLeft: 16,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: "clamp(14px,2.5vw,16px)",
    color: "#a0b3d6",
    lineHeight: 1.65,
    marginBottom: 36,
  },

  // Input bar
  form: { display: "flex", flexDirection: "column", gap: 14 },
  bar: {
    display: "flex",
    alignItems: "center",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid #0099fa",
    borderRadius: 50,
    padding: "5px 5px 5px 6px",
    gap: 4,
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  barError: {
    borderColor: "rgba(255,77,77,0.7)",
    boxShadow: "0 0 0 3px rgba(255,77,77,0.12)",
  },

  // Dropdown trigger
  dropdownWrapper: { position: "relative", flexShrink: 0 },
  dropdownTrigger: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    background: "rgba(255,255,255,0.08)",
    border: "none",
    borderRadius: 50,
    padding: "10px 14px",
    cursor: "pointer",
    fontFamily: '"Circular Std","Circular",-apple-system,sans-serif',
    fontSize: 13,
    fontWeight: 600,
    color: "#fff",
    whiteSpace: "nowrap",
    userSelect: "none",
    minWidth: 130,
    justifyContent: "space-between",
    transition: "background 0.2s",
  },
  dropdownTriggerOpen: { background: "rgba(255,255,255,0.14)" },
  triggerLabel: { display: "flex", alignItems: "center", gap: 7 },
  triggerIcon: { width: 15, height: 15, opacity: 0.8, flexShrink: 0, display: "flex", alignItems: "center" },
  triggerText: { fontSize: 13 },
  chevron: {
    width: 14, height: 14, opacity: 0.55, flexShrink: 0,
    transition: "transform 0.22s",
    display: "block",
  },
  chevronOpen: { transform: "rotate(180deg)" },

  // Dropdown menu
  dropdownMenu: {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: 0,
    minWidth: 180,
    background: "#0e1420",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: 5,
    zIndex: 100,
    boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
  },
  dropdownOption: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 13px",
    borderRadius: 9,
    cursor: "pointer",
    fontFamily: '"Circular Std","Circular",-apple-system,sans-serif',
    fontSize: 13,
    fontWeight: 500,
    color: "#a0b3d6",
    background: "none",
    border: "none",
    width: "100%",
    textAlign: "left",
    transition: "background 0.15s, color 0.15s",
  },
  dropdownOptionSelected: { background: "rgba(255,255,255,0.1)", color: "#fff", fontWeight: 700 },
  optionIcon: { width: 15, height: 15, opacity: 0.75, flexShrink: 0, display: "flex", alignItems: "center" },
  checkIcon: { width: 13, height: 13, marginLeft: "auto", flexShrink: 0 },

  // Text input
  input: {
    flex: 1,
    minWidth: 0,
    padding: "10px 10px",
    border: "none",
    background: "transparent",
    color: "#fff",
    fontSize: "clamp(13px,2.5vw,15px)",
    fontFamily: '"Circular Std","Circular",-apple-system,sans-serif',
    outline: "none",
  },

  // Verify button
  btn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fdfdfd",
    color: "#06080e",
    padding: "11px 22px",
    borderRadius: 50,
    fontFamily: '"Circular Std","Circular",-apple-system,sans-serif',
    fontWeight: 600,
    fontSize: 14,
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
    minHeight: 42,
    minWidth: 80,
    position: "relative",
    transition: "opacity 0.2s, transform 0.15s",
  },
  btnLoading: { background: "#00A3B5", cursor: "not-allowed" },
  btnText: {},
  spinner: {
    display: "block",
    width: 18,
    height: 18,
    border: "2.5px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "vtf-spin 0.75s linear infinite",
  },

  reportNote: {
    fontSize: "clamp(12px,2vw,13px)",
    color: "#666",
    lineHeight: 1.5,
    marginTop: 8,
  },
  reportLink: {
    color: "#bdbdbd",
    fontWeight: 600,
    textDecoration: "underline",
    textUnderlineOffset: 2,
    cursor: "pointer",
  },

  // How it works list
  howItWorks: {
    marginTop: 52,
    textAlign: "left",
  },
  howList: {
    listStyleType: "disc",
    paddingLeft: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    margin: 0,
    color: "#a0b3d6",
  },
  howListItem: {
    fontSize: "clamp(14px,2.5vw,16px)",
    lineHeight: 1.6,
  },
  howTitle: {
    fontWeight: 700,
    color: "#fff",
  },
  howDesc: {
    color: "#a0b3d6",
  },

  // Modals
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    zIndex: 1000,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  modalContent: {
    background: "#f2f2f2",
    borderRadius: "20px 20px 0 0",
    width: "100%",
    maxWidth: 520,
    overflow: "hidden",
    animation: "vtf-modal 0.32s cubic-bezier(0.22,1,0.36,1) forwards",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px 14px",
    background: "#fff",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
  },
  modalHeaderLogo: { display: "flex", alignItems: "center", gap: 8 },
  modalBrand: { fontSize: 15, fontWeight: 700, color: "#0a0a14", fontFamily: '"Circular Std","Circular",-apple-system,sans-serif' },
  modalHeaderDivider: { width: 1, height: 16, background: "#c0c0c0", margin: "0 2px" },
  modalHeaderLabel: { fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888", fontFamily: '"Circular Std","Circular",-apple-system,sans-serif' },
  closeBtn: {
    background: "none", border: "none", fontSize: 22, cursor: "pointer",
    color: "#555", lineHeight: 1, padding: 4, display: "flex", alignItems: "center",
    transition: "color 0.2s",
  },
  modalBody: { padding: "32px 28px 28px", textAlign: "center" },
  shieldWrap: {
    width: 80, height: 80, margin: "0 auto 18px",
    position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
  },
  shieldBg: { width: 80, height: 80, position: "absolute", inset: 0 },
  shieldInner: { position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center" },
  assetId: {
    fontSize: "clamp(12px,2.5vw,14px)",
    fontWeight: 700,
    marginBottom: 14,
    wordBreak: "break-all",
    fontFamily: '"Circular Std","Circular",-apple-system,sans-serif',
  },
  modalTitle: {
    fontFamily: '"Circular Std","Circular",-apple-system,sans-serif',
    fontSize: "clamp(17px,3.5vw,21px)",
    fontWeight: 800,
    color: "#0a0a14",
    marginBottom: 14,
    lineHeight: 1.3,
    letterSpacing: "-0.02em",
  },
  modalSub: {
    fontFamily: '"Circular Std","Circular",-apple-system,sans-serif',
    fontSize: "clamp(12px,2vw,14px)",
    color: "#555",
    lineHeight: 1.65,
    marginBottom: 24,
    textAlign: "left",
  },
  modalBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    padding: "16px",
    borderRadius: 50,
    border: "none",
    cursor: "pointer",
    fontFamily: '"Circular Std","Circular",-apple-system,sans-serif',
    fontSize: "clamp(14px,2.5vw,16px)",
    fontWeight: 700,
    letterSpacing: "-0.01em",
    transition: "opacity 0.2s, transform 0.15s",
  },
};

// ─── Detail box styles for success modal ─────────────────────────────────────
const ms = {
  detailBox: {
    background: "#fff",
    border: "1px solid #e8e8e8",
    borderRadius: 12,
    padding: "16px 18px",
    marginBottom: 20,
    textAlign: "left",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "8px 0",
    borderBottom: "1px solid #f0f0f0",
    gap: 12,
  },
  detailLabel: { fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 },
  detailVal:   { fontSize: 13, fontWeight: 500, color: "#0a0a14", textAlign: "right", wordBreak: "break-word" },
};