import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Link } from "react-router-dom";

const PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal",
  "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"
];

const INDUSTRIES = [
  "Agriculture", "Automotive", "Construction", "Education", "Energy",
  "Finance & Banking", "Healthcare", "Hospitality", "IT & Technology",
  "Legal", "Logistics & Transport", "Manufacturing", "Media & Marketing",
  "Mining", "NGO & Non-Profit", "Real Estate", "Retail", "Telecommunications", "Other"
];

const SIZES = ["1–10", "11–50", "51–200", "201–500", "500+"];

export default function Join() {
  const [form, setForm] = useState({
    firstName: "", lastName: "", companyName: "", email: "",
    phone: "", industry: "", province: "", companySize: "", message: ""
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await addDoc(collection(db, "invites"), {
        ...form,
        status: "pending",
        ref: crypto.randomUUID(),
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    }
    setLoading(false);
  };

  // ── Success state ──
  if (submitted) {
    return (
      <div style={s.page}>
        <div style={s.leftPanel}>
          <div style={s.brandWrap}>
            <div style={s.logoMark}>V</div>
            <div style={s.brandName}>Vetted</div>
          </div>
          <div style={s.brandBody}>
            <h2 style={s.brandHeading}>Your hiring console</h2>
            <p style={s.brandSub}>
              Post jobs, review applications, and manage your pipeline — all in one place.
            </p>
            <div style={s.featureList}>
              {[
                "Live job listings with applicant tracking",
                "Structured candidate profiles & documents",
                "Real-time application status management",
              ].map((f, i) => (
                <div key={i} style={s.featureItem}>
                  <div style={s.featureDot} />
                  <span style={s.featureText}>{f}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={s.brandFooter}>vetted.co.za</div>
        </div>

        <div style={s.rightPanel}>
          <div style={s.formWrap}>
            <div style={s.successIconWrap}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d652d" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 style={s.heading}>Application received</h1>
            <p style={{ ...s.sub, marginBottom: "32px" }}>
              Thanks <strong style={{ color: "#202124", fontWeight: "600" }}>{form.firstName}</strong>! We've received
              your expression of interest and will review it within 2 business days. If approved, you'll receive
              an invite link at <strong style={{ color: "#1a73e8", fontWeight: "600" }}>{form.email}</strong>.
            </p>
            <Link to="/" style={s.backLink}>← Back to homepage</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <div style={s.page}>

      {/* Left panel — branding */}
      <div style={s.leftPanel}>
        <div style={s.brandWrap}>
          <div style={s.logoMark}>V</div>
          <div style={s.brandName}>Vetted</div>
        </div>
        <div style={s.brandBody}>
          <h2 style={s.brandHeading}>Start hiring on Vetted</h2>
          <p style={s.brandSub}>
            Apply for employer access and reach thousands of verified job seekers across South Africa.
          </p>
          <div style={s.featureList}>
            {[
              "Reviewed and approved within 2 business days",
              "Post unlimited job listings per plan",
              "Full applicant management dashboard",
            ].map((f, i) => (
              <div key={i} style={s.featureItem}>
                <div style={s.featureDot} />
                <span style={s.featureText}>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={s.brandFooter}>vetted.co.za</div>
      </div>

      {/* Right panel — form */}
      <div style={s.rightPanel}>
        <div style={s.formWrap}>

          {/* Header */}
          <div style={s.formHeader}>
            <h1 style={s.heading}>Apply for access</h1>
            <p style={s.sub}>We'll review your application within 2 business days.</p>
          </div>

          {/* Error */}
          {error && (
            <div style={s.alertError}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={s.form}>

            <Row>
              <Field label="First Name">
                <input style={s.input} required value={form.firstName} onChange={set("firstName")} placeholder="Jane" />
              </Field>
              <Field label="Last Name">
                <input style={s.input} required value={form.lastName} onChange={set("lastName")} placeholder="Smith" />
              </Field>
            </Row>

            <Field label="Company Name">
              <input style={s.input} required value={form.companyName} onChange={set("companyName")} placeholder="Acme (Pty) Ltd" />
            </Field>

            <Row>
              <Field label="Work Email">
                <input style={s.input} type="email" required value={form.email} onChange={set("email")} placeholder="jane@acme.co.za" />
              </Field>
              <Field label="Phone">
                <input style={s.input} type="tel" required value={form.phone} onChange={set("phone")} placeholder="071 000 0000" />
              </Field>
            </Row>

            <Row>
              <Field label="Industry">
                <select style={s.input} required value={form.industry} onChange={set("industry")}>
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </Field>
              <Field label="Province">
                <select style={s.input} required value={form.province} onChange={set("province")}>
                  <option value="">Select province</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
            </Row>

            <Field label="Company Size">
              <select style={s.input} required value={form.companySize} onChange={set("companySize")}>
                <option value="">Select size</option>
                {SIZES.map(sz => <option key={sz} value={sz}>{sz}</option>)}
              </select>
            </Field>

            <Field label="Message (optional)">
              <textarea
                style={{ ...s.input, minHeight: "90px", resize: "vertical", lineHeight: "1.6" }}
                value={form.message}
                onChange={set("message")}
                placeholder="Tell us about your hiring needs..."
              />
            </Field>

            <button type="submit" disabled={loading} style={s.btnPrimary}>
              {loading ? "Submitting…" : "Submit Application"}
            </button>
          </form>

          {/* Footer */}
          <p style={s.footer}>
            Already have an account?{" "}
            <Link to="/employer/login" style={s.link}>Sign in</Link>
          </p>

        </div>
      </div>

    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────
function Row({ children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const s = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#f4f5f7",
    fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  // ── Left branding panel ──
  leftPanel: {
    width: "380px",
    flexShrink: 0,
    background: "#ffffff",
    borderRight: "1px solid #e3e3e3",
    display: "flex",
    flexDirection: "column",
    padding: "48px 40px",
    position: "sticky",
    top: 0,
    height: "100vh",
  },
  brandWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "64px",
  },
  logoMark: {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    background: "#ffca28",
    color: "#d84315",
    fontWeight: "700",
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    color: "#202124",
    fontWeight: "600",
    fontSize: "16px",
  },
  brandBody: { flex: 1 },
  brandHeading: {
    color: "#202124",
    fontSize: "24px",
    fontWeight: "600",
    margin: "0 0 12px",
    letterSpacing: "-0.5px",
    lineHeight: 1.3,
  },
  brandSub: {
    color: "#5f6368",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0 0 32px",
  },
  featureList: { display: "flex", flexDirection: "column", gap: "14px" },
  featureItem: { display: "flex", alignItems: "flex-start", gap: "12px" },
  featureDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#1a73e8",
    flexShrink: 0,
    marginTop: "6px",
  },
  featureText: {
    color: "#3c4043",
    fontSize: "13px",
    lineHeight: "1.5",
    fontWeight: "500",
  },
  brandFooter: { color: "#9aa0a6", fontSize: "12px", fontWeight: "500" },

  // ── Right form panel ──
  rightPanel: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    padding: "48px 40px",
    overflowY: "auto",
  },
  formWrap: {
    width: "100%",
    maxWidth: "500px",
  },
  formHeader: { marginBottom: "32px" },
  heading: {
    color: "#202124",
    fontSize: "24px",
    fontWeight: "600",
    margin: "0 0 6px",
    letterSpacing: "-0.5px",
  },
  sub: { color: "#5f6368", fontSize: "14px", margin: 0, lineHeight: "1.6" },

  // ── Alert ──
  alertError: {
    background: "#fce8e6",
    border: "1px solid #f5c6c2",
    color: "#c5221f",
    borderRadius: "4px",
    padding: "12px 16px",
    fontSize: "13px",
    fontWeight: "500",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  // ── Form elements ──
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  label: {
    color: "#5f6368",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },
  input: {
    background: "#ffffff",
    border: "1px solid #e3e3e3",
    borderRadius: "4px",
    padding: "9px 12px",
    color: "#202124",
    fontSize: "13px",
    outline: "none",
    width: "100%",
    fontFamily: '"Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  btnPrimary: {
    background: "#1a73e8",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    padding: "11px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "8px",
    width: "100%",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
    transition: "background 0.2s",
  },

  // ── Footer ──
  footer: {
    color: "#5f6368",
    fontSize: "13px",
    textAlign: "center",
    marginTop: "28px",
  },
  link: {
    color: "#1a73e8",
    textDecoration: "none",
    fontWeight: "600",
  },

  // ── Success state ──
  successIconWrap: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#e6f4ea",
    border: "1px solid #ceead6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
  },
  backLink: {
    display: "inline-block",
    marginTop: "8px",
    color: "#1a73e8",
    fontSize: "14px",
    textDecoration: "none",
    fontWeight: "600",
  },
};