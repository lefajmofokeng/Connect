import { useNavigate, Link } from "react-router-dom";

export default function Terms() {
  const navigate = useNavigate();
  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.body}>
        <div style={s.inner}>
          <button onClick={() => navigate(-1)} style={s.backBtn}>← Back</button>
          <h1 style={s.title}>Terms of Service</h1>
          <p style={s.updated}>Last updated: January 2025</p>

          <Section title="1. Acceptance of Terms">
            By accessing or using Cronos Jobs ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.
          </Section>

          <Section title="2. About the Platform">
            Cronos Jobs is a South African job listing platform that connects verified employers with job seekers. All employers on the platform have undergone a verification process including CIPC registration checks.
          </Section>

          <Section title="3. Job Seekers">
            Job seekers may browse and apply for jobs free of charge. By submitting an application, you confirm that all information provided is accurate and truthful. You consent to your application data being shared with the relevant employer for recruitment purposes only.
          </Section>

          <Section title="4. Employers">
            Employer accounts are invite-only and subject to verification. Employers must hold a valid CIPC registration and provide authentic supporting documents. Cronos Jobs reserves the right to suspend or terminate employer accounts that violate these terms, post fraudulent listings, or engage in any form of misrepresentation.
          </Section>

          <Section title="5. Job Listings">
            Employers are responsible for the accuracy of their job listings. Listings must represent genuine employment opportunities. Cronos Jobs reserves the right to remove any listing deemed inappropriate, misleading, or in violation of South African labour law.
          </Section>

          <Section title="6. Intellectual Property">
            All content on the Platform, including design, text, and functionality, is the property of Cronos Jobs. You may not reproduce, distribute, or create derivative works without express written permission.
          </Section>

          <Section title="7. Limitation of Liability">
            Cronos Jobs acts as an intermediary between employers and job seekers. We do not guarantee employment outcomes and are not liable for any hiring decisions made by employers or any loss arising from use of the platform.
          </Section>

          <Section title="8. Governing Law">
            These terms are governed by the laws of the Republic of South Africa. Any disputes shall be subject to the jurisdiction of South African courts.
          </Section>

          <Section title="9. Changes to Terms">
            We reserve the right to update these terms at any time. Continued use of the Platform after changes constitutes acceptance of the updated terms.
          </Section>

          <Section title="10. Contact">
            For questions about these terms, contact us at legal@cronosjobs.co.za.
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
  page: { background: "#080d1b", minHeight: "100vh", fontFamily: "sans-serif", color: "#e8edf8", display: "flex", flexDirection: "column" },
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