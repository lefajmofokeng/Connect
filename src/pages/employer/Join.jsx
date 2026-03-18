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

  if (submitted) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.logo}>Cronos Jobs</div>
          <div style={s.successIcon}>✓</div>
          <h1 style={s.heading}>Application Received</h1>
          <p style={s.sub}>
            Thanks <strong style={{ color: "#e8edf8" }}>{form.firstName}</strong>! We've received your expression
            of interest and will review it shortly. If approved, you'll receive an invite link at{" "}
            <strong style={{ color: "#0099fa" }}>{form.email}</strong>.
          </p>
          <Link to="/" style={s.backLink}>← Back to homepage</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={{ ...s.card, maxWidth: "560px" }}>
        <div style={s.logo}>Cronos Jobs</div>
        <h1 style={s.heading}>Apply for Employer Access</h1>
        <p style={s.sub}>Fill in your details and we'll review your application within 2 business days.</p>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>First Name</label>
              <input style={s.input} required value={form.firstName} onChange={set("firstName")} placeholder="Jane" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Last Name</label>
              <input style={s.input} required value={form.lastName} onChange={set("lastName")} placeholder="Smith" />
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label}>Company Name</label>
            <input style={s.input} required value={form.companyName} onChange={set("companyName")} placeholder="Acme (Pty) Ltd" />
          </div>

          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Work Email</label>
              <input style={s.input} type="email" required value={form.email} onChange={set("email")} placeholder="jane@acme.co.za" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Phone</label>
              <input style={s.input} type="tel" required value={form.phone} onChange={set("phone")} placeholder="071 000 0000" />
            </div>
          </div>

          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Industry</label>
              <select style={s.input} required value={form.industry} onChange={set("industry")}>
                <option value="">Select industry</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div style={s.field}>
              <label style={s.label}>Province</label>
              <select style={s.input} required value={form.province} onChange={set("province")}>
                <option value="">Select province</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label}>Company Size</label>
            <select style={s.input} required value={form.companySize} onChange={set("companySize")}>
              <option value="">Select size</option>
              {SIZES.map(sz => <option key={sz} value={sz}>{sz}</option>)}
            </select>
          </div>

          <div style={s.field}>
            <label style={s.label}>Message <span style={{ color: "#3d4f73" }}>(optional)</span></label>
            <textarea
              style={{ ...s.input, minHeight: "90px", resize: "vertical" }}
              value={form.message}
              onChange={set("message")}
              placeholder="Tell us about your hiring needs..."
            />
          </div>

          <button type="submit" disabled={loading} style={s.btn}>
            {loading ? "Submitting…" : "Submit Application"}
          </button>
        </form>

        <p style={s.footer}>
          Already have an account?{" "}
          <Link to="/employer/login" style={s.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#080d1b", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" },
  card: { background: "#0d1428", border: "1px solid #1e2d52", borderRadius: "16px", padding: "48px 40px", width: "100%" },
  logo: { color: "#0099fa", fontWeight: "700", fontSize: "18px", marginBottom: "32px" },
  heading: { color: "#e8edf8", fontSize: "24px", fontWeight: "700", margin: "0 0 6px" },
  sub: { color: "#6b7fa3", fontSize: "14px", margin: "0 0 32px", lineHeight: "1.6" },
  error: { background: "rgba(255,79,106,0.1)", border: "1px solid rgba(255,79,106,0.3)", color: "#ff4f6a", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", marginBottom: "24px" },
  form: { display: "flex", flexDirection: "column", gap: "18px" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  field: { display: "flex", flexDirection: "column", gap: "7px" },
  label: { color: "#6b7fa3", fontSize: "13px", fontWeight: "500" },
  input: { background: "#131b33", border: "1px solid #1e2d52", borderRadius: "8px", padding: "11px 14px", color: "#e8edf8", fontSize: "14px", outline: "none", width: "100%", fontFamily: "sans-serif" },
  btn: { background: "#0099fa", color: "#fff", border: "none", borderRadius: "8px", padding: "13px", fontSize: "15px", fontWeight: "600", cursor: "pointer", marginTop: "8px" },
  footer: { color: "#6b7fa3", fontSize: "13px", textAlign: "center", marginTop: "28px" },
  link: { color: "#0099fa", textDecoration: "none" },
  successIcon: { width: "56px", height: "56px", borderRadius: "50%", background: "rgba(0,229,160,0.12)", border: "1px solid rgba(0,229,160,0.3)", color: "#00e5a0", fontSize: "24px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" },
  backLink: { display: "inline-block", marginTop: "24px", color: "#0099fa", fontSize: "14px", textDecoration: "none" },
};