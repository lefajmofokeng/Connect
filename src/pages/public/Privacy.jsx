import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// Prioritizing Circular as requested to match Terms.jsx
const FONT = '"Circular Std", "Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const TOC = [
  { id: "p1",  label: "1. Who We Are" },
  { id: "p2",  label: "2. Information Officer" },
  { id: "p3",  label: "3. Information We Collect" },
  { id: "p4",  label: "4. How We Collect" },
  { id: "p5",  label: "5. Purpose of Processing" },
  { id: "p6",  label: "6. Legal Basis" },
  { id: "p7",  label: "7. Data Sharing" },
  { id: "p8",  label: "8. Cross-Border Transfers" },
  { id: "p9",  label: "9. Data Retention" },
  { id: "p10", label: "10. Security Measures" },
  { id: "p11", label: "11. Your Rights (POPIA)" },
  { id: "p12", label: "12. Cookies" },
  { id: "p13", label: "13. Children's Privacy" },
  { id: "p14", label: "14. Third-Party Links" },
  { id: "p15", label: "15. Changes to Policy" },
  { id: "p16", label: "16. Contact & Complaints" },
];

export default function Privacy() {
  const [active, setActive] = useState("p1");
  const mobileTocRef = useRef(null);

  useEffect(() => {
    const observers = [];
    TOC.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  useEffect(() => {
    if (!mobileTocRef.current) return;
    const btn = mobileTocRef.current.querySelector(`[data-id="${active}"]`);
    if (btn) btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [active]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 110;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        
        /* Global Circular Font Application */
        body { font-family: ${FONT}; background: #f8f9fa; color: #202124; -webkit-font-smoothing: antialiased; }
        .legal-page * { font-family: ${FONT} !important; }
        
        /* Sidebar Navigation Styling */
        .toc-btn { 
          transition: background 0.2s ease, color 0.2s ease;
          border-radius: 0 16px 16px 0;
          margin-bottom: 2px;
        }
        .toc-btn:hover { background: #f1f3f4; color: #202124 !important; }
        .toc-btn.active { 
          background: #e8f0fe !important; 
          color: #1a73e8 !important; 
          font-weight: 600 !important; 
        }
        
        /* Mobile Horizontal Nav Styling */
        .mob-toc-btn { 
          transition: all 0.2s ease; 
          white-space: nowrap; 
          border: 1px solid #dadce0;
        }
        .mob-toc-btn:hover { background: #f8f9fa !important; }
        .mob-toc-btn.active { 
          background: #e8f0fe !important; 
          color: #1a73e8 !important; 
          border-color: #d2e3fc !important;
          font-weight: 600 !important;
        }

        /* Material Card Hover Styling */
        .section-card { transition: box-shadow 0.2s ease, border-color 0.2s ease; }
        .section-card:hover { box-shadow: 0 1px 3px 0 rgba(60,64,67,0.1), 0 4px 8px 3px rgba(60,64,67,0.05); }

        /* Responsive Breakpoints */
        @media (max-width: 900px) {
          .legal-sidebar { display: none !important; }
          .legal-mobile-toc { display: flex !important; }
          .legal-layout { display: block !important; padding: 0 16px !important; }
          .legal-content { padding-top: 24px !important; padding-bottom: 60px !important; }
          .legal-header { padding: 32px 24px 32px !important; }
          .legal-page-title { font-size: 32px !important; letter-spacing: -0.5px !important; }
        }
        @media (min-width: 901px) {
          .legal-mobile-toc { display: none !important; }
        }
      `}</style>

      <div className="legal-page" style={{ background: "#f8f9fa", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />

        {/* Mobile Sticky TOC */}
        <div className="legal-mobile-toc" ref={mobileTocRef} style={{ display: "none", position: "sticky", top: "64px", zIndex: 90, overflowX: "auto", gap: "8px", padding: "12px 16px", background: "rgba(255, 255, 255, 0.98)", backdropFilter: "blur(8px)", borderBottom: "1px solid #dadce0", scrollbarWidth: "none" }}>
          {TOC.map(item => (
            <button
              key={item.id}
              data-id={item.id}
              className={`mob-toc-btn${active === item.id ? " active" : ""}`}
              onClick={() => scrollTo(item.id)}
              style={{ flexShrink: 0, background: "#ffffff", borderRadius: "16px", padding: "8px 16px", fontSize: "13px", fontWeight: "500", color: "#3c4043", cursor: "pointer" }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Page Header */}
        <div className="legal-header" style={{ background: "#ffffff", borderBottom: "1px solid #dadce0", padding: "104px 40px 48px" }}>
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
              <span style={{ color: "#1a73e8", fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.8px" }}>Legal Policies</span>
              <span style={{ color: "#dadce0" }}>|</span>
              <span style={{ color: "#5f6368", fontSize: "14px" }}>Last updated: March 2025</span>
              <span style={{ color: "#dadce0" }}>|</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#0d652d", background: "#e6f4ea", borderRadius: "4px", padding: "4px 8px", fontSize: "12px", fontWeight: "600" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                POPIA Compliant
              </span>
            </div>
            <h1 className="legal-page-title" style={{ color: "#202124", fontSize: "44px", fontWeight: "500", letterSpacing: "-1px", lineHeight: 1.2, marginBottom: "16px" }}>
              Privacy Policy
            </h1>
            <p style={{ color: "#3c4043", fontSize: "18px", lineHeight: "1.6", maxWidth: "720px", fontWeight: "400" }}>
              Vetted (Pty) Ltd is committed to protecting your personal information in accordance with the Protection of Personal Information Act 4 of 2013 (POPIA).
            </p>
          </div>
        </div>

        {/* Main Layout */}
        <div className="legal-layout" style={{ display: "flex", flex: 1, maxWidth: "1080px", margin: "0 auto", width: "100%", padding: "0 40px", gap: "64px" }}>

          {/* Sidebar TOC */}
          <div className="legal-sidebar" style={{ width: "260px", flexShrink: 0, paddingTop: "48px" }}>
            <div style={{ position: "sticky", top: "80px", maxHeight: "calc(100vh - 100px)", overflowY: "auto", paddingRight: "4px" }}>
              <div style={{ color: "#5f6368", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px", paddingLeft: "16px" }}>Contents</div>
              <nav style={{ display: "flex", flexDirection: "column" }}>
                {TOC.map(item => (
                  <button
                    key={item.id}
                    className={`toc-btn${active === item.id ? " active" : ""}`}
                    onClick={() => scrollTo(item.id)}
                    style={{ background: "transparent", border: "none", textAlign: "left", padding: "10px 16px", fontSize: "14px", fontWeight: "500", color: "#3c4043", cursor: "pointer", lineHeight: "1.5" }}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Policy Content Sections */}
          <div className="legal-content" style={{ flex: 1, paddingTop: "48px", paddingBottom: "100px", minWidth: 0 }}>
            <Section id="p1" number="1" title="Who We Are">Vetted (Pty) Ltd ("Vetted", "we", "us", "our") is a South African company operating a recruitment platform at vetted.co.za that connects verified employers with job seekers. We are a Responsible Party as defined under POPIA and are responsible for determining the purpose and means of processing personal information collected through the Platform.</Section>
            <Section id="p2" number="2" title="Information Officer">Vetted has designated an Information Officer responsible for ensuring compliance with POPIA. You may contact our Information Officer directly at: <a href="mailto:privacy@vetted.co.za" style={{ color: "#1a73e8", textDecoration: "none", fontWeight: "500" }}>privacy@vetted.co.za</a>. We will acknowledge receipt of any privacy-related request within 3 business days and respond substantively within 30 days as required by POPIA.</Section>
            <Section id="p3" number="3" title="Personal Information We Collect">
              We collect the following categories of personal information depending on your role:<br /><br />
              <strong>Job Seekers:</strong> Full name, email address, phone number, physical address, date of birth, gender, identity number (via submitted documents), employment history, qualifications, CV and supporting documents, skills, cover notes, and application-related responses.<br /><br />
              <strong>Employers:</strong> Company name, CIPC registration number, company address, industry, contact person's full name, title, email address, phone number, and identity number; company registration documents, proof of address, and authorisation letters.<br /><br />
              <strong>All Users:</strong> Login credentials (stored in encrypted form), device information, IP address, browser type, and usage data collected for platform improvement and security purposes.
            </Section>
            <Section id="p4" number="4" title="How We Collect Information">We collect personal information through: (a) account registration and profile completion; (b) the employer verification process, including document uploads; (c) job applications submitted through the Platform; (d) communications with Vetted support; and (e) automated means such as cookies and log files used to understand how the Platform is used.</Section>
            <Section id="p5" number="5" title="Purpose of Processing">We process personal information only for the purposes for which it was collected, including: creating and managing user accounts; verifying employer identity; facilitating job applications; enabling candidate reviews; billing; communicating platform updates; improving security; and complying with legal obligations.</Section>
            <Section id="p6" number="6" title="Legal Basis for Processing">We process your personal information on the following lawful grounds under POPIA: (a) <strong>Contractual necessity</strong>; (b) <strong>Legitimate interests</strong> — fraud prevention and security; (c) <strong>Legal obligation</strong> — compliance with South African law; and (d) <strong>Consent</strong> — where specifically requested for optional activities.</Section>
            <Section id="p7" number="7" title="Data Sharing and Disclosure">
              We share personal information only in the following circumstances:<br /><br />
              <strong>With employers:</strong> When a job seeker submits an application, their data is shared with the specific employer for recruitment purposes relating to that position only.<br /><br />
              <strong>With service providers:</strong> We use Google Firebase for infrastructure, storage, and authentication under strict data processing agreements.<br /><br />
              <strong>Legal requirements:</strong> Where required by law, court order, or regulatory authority.
            </Section>
            <Section id="p8" number="8" title="Cross-Border Transfers">Your data is stored on Google Firebase infrastructure. Where personal information is transferred outside South Africa, we ensure that the recipient is subject to adequate data protection laws or appropriate contractual safeguards in place, in accordance with Section 72 of POPIA.</Section>
            <Section id="p9" number="9" title="Data Retention">
              We retain personal information as required by law or necessity:<br /><br />
              — <strong>Job applications:</strong> 12 months.<br />
              — <strong>Employer accounts:</strong> Duration of active account and 36 months thereafter.<br />
              — <strong>Job seeker accounts:</strong> Duration of active account and 24 months after last login.<br />
              — <strong>Financial records:</strong> 5 years as required by SARS.
            </Section>
            <Section id="p10" number="10" title="Security Measures">We implement technical and organisational measures including: encryption of data at rest and in transit; role-based access controls; secure authentication; and incident response procedures. In the event of a breach, we will notify the Information Regulator and affected data subjects as required by POPIA.</Section>
            <Section id="p11" number="11" title="Your Rights Under POPIA">
              As a data subject, you have the right to:<br /><br />
              — <strong>Access</strong> your personal information.<br />
              — <strong>Correction</strong> of inaccurate or outdated information.<br />
              — <strong>Deletion</strong> of your information, subject to legal obligations.<br />
              — <strong>Object</strong> to processing and <strong>Withdraw consent</strong>.<br />
              — <strong>Complain</strong> to the South African Information Regulator at <a href="mailto:inforeg@justice.gov.za" style={{ color: "#1a73e8", textDecoration: "none" }}>inforeg@justice.gov.za</a>.
            </Section>
            <Section id="p12" number="12" title="Cookies and Tracking">We use essential cookies strictly necessary for Platform operation, including session management and authentication tokens. We do not use third-party advertising cookies or cross-site tracking technologies. You may disable cookies in your browser settings, though this may impair functionality.</Section>
            <Section id="p13" number="13" title="Children's Privacy">The Platform is not directed at persons under 18 years of age. We do not knowingly collect personal information from minors. If you believe a minor has submitted information without consent, contact us at <a href="mailto:privacy@vetted.co.za" style={{ color: "#1a73e8", textDecoration: "none" }}>privacy@vetted.co.za</a>.</Section>
            <Section id="p14" number="14" title="Third-Party Links">The Platform may contain links to external sites not operated by Vetted. We accept no responsibility for the privacy practices of third-party sites and encourage you to review their policies.</Section>
            <Section id="p15" number="15" title="Changes to This Policy">We may update this Privacy Policy from time to time. Where changes are material, we will provide at least 14 days' notice via the Platform or email. Continued use of the Platform constitutes acceptance of the revised Policy.</Section>
            <Section id="p16" number="16" title="Complaints and Contact">
              For privacy-related queries, contact us at:<br /><br />
              <strong>Information Officer — Vetted (Pty) Ltd</strong><br />
              Email: <a href="mailto:privacy@vetted.co.za" style={{ color: "#1a73e8", textDecoration: "none", fontWeight: "500" }}>privacy@vetted.co.za</a><br />
              Platform: <a href="https://vetted.co.za" style={{ color: "#1a73e8", textDecoration: "none", fontWeight: "500" }}>vetted.co.za</a>
            </Section>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}

// Reusable Section Component
function Section({ id, number, title, children }) {
  return (
    <div id={id} style={{ marginBottom: "24px", scrollMarginTop: "140px" }}>
      <div className="section-card" style={{ background: "#ffffff", border: "1px solid #dadce0", borderRadius: "8px", padding: "32px", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
          <div style={{ background: "#f1f3f4", color: "#1a73e8", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "600", flexShrink: 0 }}>
            {number}
          </div>
          <h2 style={{ color: "#202124", fontSize: "20px", fontWeight: "500", margin: 0 }}>{title}</h2>
        </div>
        <p style={{ color: "#3c4043", fontSize: "15px", lineHeight: "1.7", margin: 0, paddingLeft: "48px" }}>
          {children}
        </p>
      </div>
    </div>
  );
}