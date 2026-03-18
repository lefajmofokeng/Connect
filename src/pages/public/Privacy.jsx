import { useNavigate, Link } from "react-router-dom";

export default function Privacy() {
  const navigate = useNavigate();
  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.body}>
        <div style={s.inner}>
          <button onClick={() => navigate(-1)} style={s.backBtn}>← Back</button>
          <h1 style={s.title}>Privacy Policy</h1>
          <p style={s.updated}>Last updated: January 2025</p>

          <Section title="1. Introduction">
            Cronos Jobs ("we", "us", "our") is committed to protecting your personal information in accordance with the Protection of Personal Information Act 4 of 2013 (POPIA). This policy explains how we collect, use, and protect your data.
          </Section>

          <Section title="2. Information We Collect">
            For job seekers: name, contact details, CV, work history, and application data. For employers: company details, CIPC registration, identity documents, and contact information. We also collect usage data such as pages visited and search queries to improve the platform.
          </Section>

          <Section title="3. How We Use Your Information">
            Job seeker data is used solely to facilitate job applications and match candidates with relevant opportunities. Employer data is used for verification, account management, and platform access. We do not sell your personal information to third parties.
          </Section>

          <Section title="4. Data Sharing">
            When you apply for a job, your application data is shared with the relevant employer only. Employer profiles and job listings are publicly visible. We do not share personal data with advertisers or unrelated third parties.
          </Section>

          <Section title="5. Data Storage & Security">
            Your data is stored securely using Google Firebase infrastructure with encryption at rest and in transit. Access to sensitive documents is restricted to authorised parties only. We retain application data for 12 months after submission unless deletion is requested.
          </Section>

          <Section title="6. Your Rights (POPIA)">
            You have the right to access, correct, or delete your personal information. To exercise these rights, contact us at privacy@cronosjobs.co.za. We will respond within 30 days.
          </Section>

          <Section title="7. Cookies">
            We use essential cookies for authentication and session management only. We do not use tracking or advertising cookies.
          </Section>

          <Section title="8. Children">
            Our platform is not intended for users under 18 years of age. We do not knowingly collect data from minors.
          </Section>

          <Section title="9. Changes to This Policy">
            We may update this policy periodically. We will notify users of significant changes via the platform. Continued use constitutes acceptance of the updated policy.
          </Section>

          <Section title="10. Contact Us">
            For privacy-related queries, contact our Information Officer at privacy@cronosjobs.co.za or write to us at our registered business address.
          </Section>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={s.section}>
      <h2 style={s.sectionTitle}>{title}</h2>
      <p style={s.sectionText}>{children}</p>
    </div>
  );
}

function Navbar() {
  const navigate = useNavigate();
  return (
    <nav style={s.navbar}>
      <div style={s.navInner}>
        <div onClick={() => navigate("/")} style={s.navLogo}>
          <img src="/logo.png" alt="Cronos Jobs" style={s.navLogoImg} />
        </div>
        <div style={s.navLinks}>
          <Link to="/jobs" style={s.navLink}>Browse Jobs</Link>
          <Link to="/employer/login" style={s.navLinkBtn}>Employer Login</Link>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer style={s.footer}>
      <div style={s.footerBottom}>
        <span>© {new Date().getFullYear()} Cronos Jobs. All rights reserved.</span>
        <div style={{ display: "flex", gap: "24px" }}>
          <Link to="/terms" style={s.footerLink}>Terms</Link>
          <Link to="/privacy" style={s.footerLink}>Privacy</Link>
        </div>
      </div>
    </footer>
  );
}

const s = {
  page: { background: "#080d1b", minHeight: "100vh", fontFamily: "sans-serif", color: "#e8edf8", display: "flex", flexDirection: "column", margin: 0, padding: 0},
  navbar: { background: "#0d1428", borderBottom: "1px solid #1e2d52", position: "sticky", top: 0, zIndex: 100 },
  navInner: { maxWidth: "1200px", margin: "0 auto", padding: "0 32px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  navLogo: { cursor: "pointer" },
  navLogoImg: { height: "32px", objectFit: "contain" },
  navLinks: { display: "flex", alignItems: "center", gap: "24px" },
  navLink: { color: "#6b7fa3", fontSize: "14px", textDecoration: "none" },
  navLinkBtn: { background: "rgba(0,153,250,0.12)", border: "1px solid rgba(0,153,250,0.25)", color: "#0099fa", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", textDecoration: "none" },
  body: { flex: 1, padding: "60px 32px" },
  inner: { maxWidth: "760px", margin: "0 auto" },
  backBtn: { background: "none", border: "none", color: "#6b7fa3", fontSize: "14px", cursor: "pointer", padding: "0 0 24px", display: "block" },
  title: { color: "#e8edf8", fontSize: "36px", fontWeight: "800", margin: "0 0 8px", letterSpacing: "-0.02em" },
  updated: { color: "#3d4f73", fontSize: "13px", marginBottom: "48px" },
  section: { marginBottom: "36px", paddingBottom: "36px", borderBottom: "1px solid #1e2d52" },
  sectionTitle: { color: "#0099fa", fontSize: "15px", fontWeight: "600", margin: "0 0 12px" },
  sectionText: { color: "#6b7fa3", fontSize: "14px", lineHeight: "1.8", margin: 0 },
  footer: { background: "#0d1428", borderTop: "1px solid #1e2d52", padding: "24px 32px" },
  footerBottom: { maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", color: "#3d4f73", fontSize: "12px", flexWrap: "wrap", gap: "8px" },
  footerLink: { color: "#3d4f73", textDecoration: "none" },
};