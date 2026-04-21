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

  return (
    <>
      <style>{`
        :root {
          --brand-blue: #1a73e8;
          --brand-blue-hover: #1557b0;
          --text-main: #202124;
          --text-muted: #5f6368;
          --bg-main: #f8f9fa;
          --border-color: #e2e8f0;
          --radius: 15px;
          --font-family: "Circular Std", -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .join-page {
          display: flex;
          min-height: 100vh;
          background-color: var(--bg-main);
          font-family: var(--font-family);
          color: var(--text-main);
        }

        /* --- Left Panel (Branding) --- */
        .join-left {
          width: 420px;
          flex-shrink: 0;
          background: #ffffff;
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          padding: 64px 48px;
          position: sticky;
          top: 0;
          height: 100vh;
          box-sizing: border-box;
        }

        .brand-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 80px;
        }

        .logo-mark {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #ffca28;
          color: #d84315;
          font-weight: 700;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand-name {
          font-weight: 600;
          font-size: 18px;
          letter-spacing: -0.3px;
        }

        .brand-body {
          flex: 1;
        }

        .brand-heading {
          font-size: 28px;
          font-weight: 600;
          margin: 0 0 16px;
          letter-spacing: -0.5px;
          line-height: 1.2;
        }

        .brand-sub {
          color: var(--text-muted);
          font-size: 15px;
          line-height: 1.6;
          margin: 0 0 40px;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .feature-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--brand-blue);
          flex-shrink: 0;
          margin-top: 6px;
        }

        .feature-text {
          color: #3c4043;
          font-size: 14px;
          line-height: 1.5;
          font-weight: 500;
        }

        .brand-footer {
          color: #9aa0a6;
          font-size: 13px;
          font-weight: 500;
        }

        /* --- Right Panel (Form) --- */
        .join-right {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 64px 48px;
          box-sizing: border-box;
          overflow-y: auto;
        }

        .form-container {
          width: 100%;
          max-width: 540px;
          background: #ffffff;
          padding: 48px;
          border-radius: var(--radius);
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.02);
          border: 1px solid #f1f3f5;
        }

        .form-header {
          margin-bottom: 40px;
        }

        .form-heading {
          font-size: 26px;
          font-weight: 600;
          margin: 0 0 8px;
          letter-spacing: -0.5px;
        }

        .form-sub {
          color: var(--text-muted);
          font-size: 15px;
          margin: 0;
        }

        /* --- Form Elements --- */
        .form-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          color: #4a5568;
          font-size: 13px;
          font-weight: 600;
        }

        .form-input {
          background: #fafafa;
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 14px 16px;
          color: var(--text-main);
          font-size: 14px;
          font-family: var(--font-family);
          width: 100%;
          box-sizing: border-box;
          transition: all 0.2s ease;
          outline: none;
          appearance: none;
        }

        .form-input:focus {
          background: #ffffff;
          border-color: var(--brand-blue);
          box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
        }

        select.form-input {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235f6368' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          padding-right: 40px;
        }

        .btn-submit {
          background: var(--brand-blue);
          color: #ffffff;
          border: none;
          border-radius: var(--radius);
          padding: 16px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          margin-top: 16px;
          transition: all 0.2s ease;
          font-family: var(--font-family);
        }

        .btn-submit:hover:not(:disabled) {
          background: var(--brand-blue-hover);
          transform: translateY(-1px);
        }

        .btn-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* --- Alerts & Utilities --- */
        .alert-error {
          background: #fff0f0;
          border: 1px solid #ffd6d6;
          color: #c5221f;
          border-radius: var(--radius);
          padding: 14px 16px;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .form-footer {
          color: var(--text-muted);
          font-size: 14px;
          text-align: center;
          margin-top: 32px;
        }

        .text-link {
          color: var(--brand-blue);
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }

        .text-link:hover {
          color: var(--brand-blue-hover);
        }

        /* --- Success State --- */
        .success-icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #e6f4ea;
          border: 1px solid #ceead6;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }

        .back-link {
          display: inline-block;
          margin-top: 16px;
          color: var(--brand-blue);
          font-size: 15px;
          text-decoration: none;
          font-weight: 600;
          transition: transform 0.2s ease;
        }
        
        .back-link:hover {
          transform: translateX(-4px);
        }

        /* --- Mobile Responsiveness --- */
        @media (max-width: 900px) {
          .join-page {
            flex-direction: column;
          }
          
          .join-left {
            width: 100%;
            height: auto;
            position: relative;
            padding: 40px 24px;
            border-right: none;
            border-bottom: 1px solid var(--border-color);
          }
          
          .brand-header { margin-bottom: 40px; }
          .brand-sub { margin-bottom: 32px; }
          
          .join-right {
            padding: 32px 24px;
            align-items: flex-start;
          }

          .form-container {
            padding: 32px 24px;
            box-shadow: none;
            border: none;
            background: transparent;
          }
        }

        @media (max-width: 600px) {
          .form-row {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
      `}</style>

      {/* ── Success state ── */}
      {submitted ? (
        <div className="join-page">
          <div className="join-left">
            <div className="brand-header">
              <div className="logo-mark">V</div>
              <div className="brand-name">Vetted</div>
            </div>
            <div className="brand-body">
              <h2 className="brand-heading">Your hiring console</h2>
              <p className="brand-sub">
                Post jobs, review applications, and manage your pipeline — all in one place.
              </p>
              <div className="feature-list">
                {[
                  "Live job listings with applicant tracking",
                  "Structured candidate profiles & documents",
                  "Real-time application status management",
                ].map((f, i) => (
                  <div key={i} className="feature-item">
                    <div className="feature-dot" />
                    <span className="feature-text">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="brand-footer">vetted.co.za</div>
          </div>

          <div className="join-right">
            <div className="form-container">
              <div className="success-icon-wrap">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0d652d" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h1 className="form-heading">Application received</h1>
              <p className="form-sub" style={{ marginBottom: "32px", lineHeight: "1.7" }}>
                Thanks <strong style={{ color: "var(--text-main)", fontWeight: "600" }}>{form.firstName}</strong>! We've received
                your expression of interest and will review it within 2 business days. If approved, you'll receive
                an invite link at <strong style={{ color: "var(--brand-blue)", fontWeight: "600" }}>{form.email}</strong>.
              </p>
              <Link to="/" className="back-link">← Back to homepage</Link>
            </div>
          </div>
        </div>
      ) : (

      /* ── Form state ── */
        <div className="join-page">
          {/* Left panel — branding */}
          <div className="join-left">
            <div className="brand-header">
              <div className="logo-mark">V</div>
              <div className="brand-name">Vetted</div>
            </div>
            <div className="brand-body">
              <h2 className="brand-heading">Start hiring on Vetted</h2>
              <p className="brand-sub">
                Apply for employer access and reach thousands of verified job seekers across South Africa.
              </p>
              <div className="feature-list">
                {[
                  "Reviewed and approved within 2 business days",
                  "Post unlimited job listings per plan",
                  "Full applicant management dashboard",
                ].map((f, i) => (
                  <div key={i} className="feature-item">
                    <div className="feature-dot" />
                    <span className="feature-text">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="brand-footer">vetted.co.za</div>
          </div>

          {/* Right panel — form */}
          <div className="join-right">
            <div className="form-container">
              
              {/* Header */}
              <div className="form-header">
                <h1 className="form-heading">Apply for access</h1>
                <p className="form-sub">We'll review your application within 2 business days.</p>
              </div>

              {/* Error */}
              {error && (
                <div className="alert-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="form-grid">
                
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">First Name</label>
                    <input className="form-input" required value={form.firstName} onChange={set("firstName")} placeholder="Jane" />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Last Name</label>
                    <input className="form-input" required value={form.lastName} onChange={set("lastName")} placeholder="Smith" />
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">Company Name</label>
                  <input className="form-input" required value={form.companyName} onChange={set("companyName")} placeholder="Acme (Pty) Ltd" />
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Work Email</label>
                    <input className="form-input" type="email" required value={form.email} onChange={set("email")} placeholder="jane@acme.co.za" />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Phone</label>
                    <input className="form-input" type="tel" required value={form.phone} onChange={set("phone")} placeholder="071 000 0000" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Industry</label>
                    <select className="form-input" required value={form.industry} onChange={set("industry")}>
                      <option value="">Select industry</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Province</label>
                    <select className="form-input" required value={form.province} onChange={set("province")}>
                      <option value="">Select province</option>
                      {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">Company Size</label>
                  <select className="form-input" required value={form.companySize} onChange={set("companySize")}>
                    <option value="">Select size</option>
                    {SIZES.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Message (optional)</label>
                  <textarea
                    className="form-input"
                    style={{ minHeight: "100px", resize: "vertical", lineHeight: "1.6" }}
                    value={form.message}
                    onChange={set("message")}
                    placeholder="Tell us about your hiring needs..."
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-submit">
                  {loading ? "Submitting…" : "Submit Application"}
                </button>
              </form>

              {/* Footer */}
              <div className="form-footer">
                Already have an account?{" "}
                <Link to="/employer/login" className="text-link">Sign in</Link>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}