import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";

// Prioritizing Circular as requested
const FONT = '"Circular Std", "Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const TOC = [
  { id: "s1",  label: "1. Acceptance of Terms" },
  { id: "s2",  label: "2. About Vetted" },
  { id: "s3",  label: "3. Eligibility" },
  { id: "s4",  label: "4. Employer Accounts" },
  { id: "s5",  label: "5. Job Seeker Accounts" },
  { id: "s6",  label: "6. Job Listings" },
  { id: "s7",  label: "7. Application Process" },
  { id: "s8",  label: "8. Fees and Billing" },
  { id: "s9",  label: "9. Prohibited Conduct" },
  { id: "s10", label: "10. Intellectual Property" },
  { id: "s11", label: "11. Disclaimers" },
  { id: "s12", label: "12. Limitation of Liability" },
  { id: "s13", label: "13. Indemnification" },
  { id: "s14", label: "14. Termination" },
  { id: "s15", label: "15. Governing Law" },
  { id: "s16", label: "16. Changes to Terms" },
  { id: "s17", label: "17. Contact" },
];

export default function Terms() {
  const [active, setActive] = useState("s1");
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

  // Scroll active item into view on mobile TOC
  useEffect(() => {
    if (!mobileTocRef.current) return;
    const btn = mobileTocRef.current.querySelector(`[data-id="${active}"]`);
    if (btn) btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [active]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    // Updated offset to accommodate the sticky header layout perfectly
    const top = el.getBoundingClientRect().top + window.scrollY - 110;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        
        /* Enforcing Circular on the body and all elements */
        body { font-family: ${FONT}; background: #f8f9fa; color: #202124; -webkit-font-smoothing: antialiased; }
        .legal-page * { font-family: ${FONT} !important; }
        
        /* Google Docs/Account style sidebar navigation */
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
        
        /* Mobile Horizontal Nav */
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

        /* Material Design Card Hover Effect */
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
        <div className="legal-header" style={{ background: "#ffffff", borderBottom: "1px solid #dadce0", padding: "64px 40px 48px" }}>
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
              <span style={{ color: "#1a73e8", fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.8px" }}>Legal Policies</span>
              <span style={{ color: "#dadce0" }}>|</span>
              <span style={{ color: "#5f6368", fontSize: "14px" }}>Last updated: March 2025</span>
            </div>
            <h1 className="legal-page-title" style={{ color: "#202124", fontSize: "44px", fontWeight: "500", letterSpacing: "-1px", lineHeight: 1.2, marginBottom: "16px" }}>
              Terms of Service
            </h1>
            <p style={{ color: "#3c4043", fontSize: "18px", lineHeight: "1.6", maxWidth: "720px", fontWeight: "400" }}>
              Please read these terms carefully before using Vetted. By accessing or using the platform, you agree to be bound by the following terms and conditions.
            </p>
          </div>
        </div>

        {/* Layout */}
        <div className="legal-layout" style={{ display: "flex", flex: 1, maxWidth: "1080px", margin: "0 auto", width: "100%", padding: "0 40px", gap: "64px" }}>

          {/* Sidebar TOC */}
          <div className="legal-sidebar" style={{ width: "260px", flexShrink: 0, paddingTop: "48px" }}>
            <div style={{ position: "sticky", top: "112px" }}>
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

          {/* Content */}
          <div className="legal-content" style={{ flex: 1, paddingTop: "48px", paddingBottom: "100px", minWidth: 0 }}>
            <Section id="s1" number="1" title="Acceptance of Terms">By accessing, registering on, or using the Vetted platform ("Platform", "Service"), operated by Vetted (Pty) Ltd ("Vetted", "we", "us", "our"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service ("Terms") and our Privacy Policy. If you do not agree to these Terms in their entirety, you must immediately cease use of the Platform. These Terms constitute a legally binding agreement between you and Vetted.</Section>
            <Section id="s2" number="2" title="About Vetted">Vetted is a South African recruitment platform that connects verified employers with job seekers. The Platform facilitates the posting of employment opportunities, the submission of job applications, and the management of recruitment pipelines. Vetted acts solely as an intermediary between employers and job seekers and is not a party to any employment relationship that may arise from use of the Platform.</Section>
            <Section id="s3" number="3" title="Eligibility">To use the Platform you must: (a) be at least 18 years of age; (b) be legally permitted to work or conduct business in South Africa or the applicable jurisdiction; (c) provide accurate, complete, and current information during registration and throughout your use of the Platform; and (d) not have been previously suspended or removed from the Platform for violations of these Terms. By using the Platform you represent and warrant that you meet all eligibility requirements.</Section>
            <Section id="s4" number="4" title="Employer Accounts">Employer accounts are subject to an invitation and verification process. To obtain an employer account you must: (a) receive an official invite from Vetted; (b) hold a valid CIPC registration and provide authentic supporting documentation including proof of identity and proof of address; (c) complete the business verification process to Vetted's satisfaction. Vetted reserves the right to approve or decline any application for an employer account at its sole discretion, without obligation to provide reasons. Approved employers are solely responsible for all activity conducted through their accounts. You must keep your login credentials confidential and notify Vetted immediately of any unauthorised access. Employer accounts are non-transferable.</Section>
            <Section id="s5" number="5" title="Job Seeker Accounts">Job seekers may create accounts and use the Platform to search and apply for employment opportunities free of charge. By creating an account you agree to provide accurate personal information and to keep that information current. You are responsible for maintaining the confidentiality of your account credentials. Vetted does not guarantee that use of the Platform will result in employment. You acknowledge that employers make their own independent hiring decisions and that Vetted has no control over or responsibility for those decisions.</Section>
            <Section id="s6" number="6" title="Job Listings">Employers are solely responsible for the accuracy, completeness, and lawfulness of all job listings they post. All listings must represent genuine, current employment opportunities. Listings must comply with applicable South African labour legislation including the Basic Conditions of Employment Act, the Employment Equity Act, and the Labour Relations Act. Vetted reserves the right to remove, edit, or decline any listing at its sole discretion, including listings that are misleading, discriminatory, unlawful, or otherwise in breach of these Terms. Vetted does not verify the accuracy of individual listings and makes no representations regarding the suitability of any position advertised.</Section>
            <Section id="s7" number="7" title="Application Process">By submitting an application through the Platform, job seekers confirm that all information provided is accurate and truthful. Submitting a false or misleading application may result in immediate removal from the Platform. Application data, including personal information and documents, will be shared with the relevant employer for recruitment purposes only. Vetted does not retain application documents beyond the period specified in our Privacy Policy. Employers agree to use application data solely for recruitment purposes relating to the specific position applied for and to handle all personal information in accordance with POPIA.</Section>
            <Section id="s8" number="8" title="Fees and Billing">Access to the Platform for job seekers is free of charge. Employers are billed on a usage-based model at the published rate per active job listing per month. All fees are quoted inclusive of any applicable taxes unless otherwise stated. Payment is due by the 15th of each month for active listings. Vetted reserves the right to suspend employer access for non-payment. All fees are non-refundable unless Vetted determines otherwise at its sole discretion. Vetted reserves the right to amend its fee structure at any time upon reasonable notice to affected employers.</Section>
            <Section id="s9" number="9" title="Prohibited Conduct">You agree not to: (a) post false, misleading, or fraudulent content; (b) use the Platform to discriminate unlawfully against any person on the basis of race, gender, age, disability, religion, or any other protected characteristic; (c) scrape, harvest, or systematically collect data from the Platform; (d) use automated tools, bots, or scripts to interact with the Platform; (e) attempt to gain unauthorised access to any part of the Platform or its infrastructure; (f) transmit malware, viruses, or any harmful code; (g) use the Platform to solicit users for purposes unrelated to legitimate recruitment; (h) misrepresent your identity, qualifications, or business; or (i) engage in any conduct that disrupts, damages, or impairs the Platform or other users' experience.</Section>
            <Section id="s10" number="10" title="Intellectual Property">All content on the Platform, including but not limited to design, layout, text, graphics, logos, functionality, and software, is the property of Vetted or its licensors and is protected by applicable intellectual property laws. You are granted a limited, non-exclusive, non-transferable, revocable licence to access and use the Platform for its intended purposes only. You may not reproduce, distribute, modify, create derivative works of, publicly display, or commercially exploit any part of the Platform without prior written consent from Vetted.</Section>
            <Section id="s11" number="11" title="Disclaimers">The Platform is provided on an "as is" and "as available" basis without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. Vetted does not warrant that the Platform will be uninterrupted, error-free, or free from viruses or other harmful components. Vetted does not endorse any employer, job seeker, listing, or application submitted through the Platform.</Section>
            <Section id="s12" number="12" title="Limitation of Liability">To the fullest extent permitted by applicable law, Vetted, its directors, officers, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, loss of data, or loss of business opportunity, arising out of or in connection with your use of the Platform. Vetted's total aggregate liability shall not exceed the total fees paid by you in the three months preceding the event giving rise to the claim, or R1,000, whichever is greater.</Section>
            <Section id="s13" number="13" title="Indemnification">You agree to indemnify, defend, and hold harmless Vetted and its directors, officers, employees, and agents from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising out of or in connection with: (a) your use of the Platform; (b) your breach of these Terms; (c) any content you submit, post, or transmit through the Platform; or (d) your violation of any third party rights or applicable law.</Section>
            <Section id="s14" number="14" title="Termination">Vetted reserves the right to suspend or terminate your access to the Platform at any time, with or without notice, for any reason including breach of these Terms, fraudulent activity, or non-payment. Upon termination, your right to use the Platform ceases immediately. Vetted may retain your data in accordance with its Privacy Policy and applicable law. Termination does not relieve you of any obligations that accrued prior to termination.</Section>
            <Section id="s15" number="15" title="Governing Law">These Terms are governed by and construed in accordance with the laws of the Republic of South Africa. You irrevocably submit to the exclusive jurisdiction of the South African courts for the resolution of any dispute arising out of or in connection with these Terms or the Platform.</Section>
            <Section id="s16" number="16" title="Changes to Terms">Vetted reserves the right to amend these Terms at any time. Where changes are material, we will provide reasonable notice via the Platform or by email. Your continued use of the Platform after the effective date of any amendment constitutes your acceptance of the revised Terms.</Section>
            <Section id="s17" number="17" title="Contact">
              For questions, concerns, or notices relating to these Terms, please contact Vetted at:<br /><br />
              <strong>Vetted (Pty) Ltd</strong><br />
              Email: <a href="mailto:legal@vetted.co.za" style={{ color: "#1a73e8", textDecoration: "none", fontWeight: "500" }}>legal@vetted.co.za</a><br />
              Platform: <a href="https://vetted.co.za" style={{ color: "#1a73e8", textDecoration: "none", fontWeight: "500" }}>vetted.co.za</a>
            </Section>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}

// Material Design Card Component
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

// Minimal Google App Shell Navbar
function Navbar() {
  const navigate = useNavigate();
  return (
    <nav style={{ background: "#ffffff", borderBottom: "1px solid #dadce0", position: "sticky", top: 0, zIndex: 100, height: "64px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "#fbbc04", color: "#d93025", fontWeight: "700", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>V</div>
          <span style={{ color: "#3c4043", fontWeight: "600", fontSize: "18px", letterSpacing: "-0.2px" }}>Vetted</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <Link to="/jobs" style={{ color: "#5f6368", fontSize: "14px", textDecoration: "none", fontWeight: "500", transition: "color 0.2s" }} onMouseOver={e => e.target.style.color = '#202124'} onMouseOut={e => e.target.style.color = '#5f6368'}>
            Browse Jobs
          </Link>
          <Link to="/employer/login" style={{ background: "#1a73e8", color: "#ffffff", borderRadius: "4px", padding: "8px 20px", fontSize: "14px", fontWeight: "500", textDecoration: "none", transition: "background 0.2s, box-shadow 0.2s", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.3)" }} onMouseOver={e => { e.target.style.background = '#1b6ef3'; e.target.style.boxShadow = '0 1px 3px 1px rgba(60,64,67,0.15), 0 1px 2px 0 rgba(60,64,67,0.3)'; }} onMouseOut={e => { e.target.style.background = '#1a73e8'; e.target.style.boxShadow = '0 1px 2px 0 rgba(60,64,67,0.3)'; }}>
            Employer Login
          </Link>
        </div>
      </div>
    </nav>
  );
}

// Clean, informative footer
function Footer() {
  return (
    <footer style={{ background: "#ffffff", borderTop: "1px solid #dadce0", padding: "32px 24px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "20px", height: "20px", borderRadius: "4px", background: "#fbbc04", color: "#d93025", fontWeight: "700", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>V</div>
            <span style={{ color: "#5f6368", fontWeight: "600", fontSize: "14px" }}>Vetted</span>
          </div>
          <span style={{ color: "#5f6368", fontSize: "12px" }}>© {new Date().getFullYear()} Vetted (Pty) Ltd. All rights reserved.</span>
          <span style={{ color: "#5f6368", fontSize: "12px" }}>Designed & Developed by Lefa Mofokeng</span>
        </div>
        <div style={{ display: "flex", gap: "24px" }}>
          <Link to="/terms"   style={{ color: "#5f6368", fontSize: "13px", textDecoration: "none", fontWeight: "500" }}>Terms of Service</Link>
          <Link to="/privacy" style={{ color: "#5f6368", fontSize: "13px", textDecoration: "none", fontWeight: "500" }}>Privacy Policy</Link>
          <a href="mailto:legal@vetted.co.za" style={{ color: "#5f6368", fontSize: "13px", textDecoration: "none", fontWeight: "500" }}>legal@vetted.co.za</a>
        </div>
      </div>
    </footer>
  );
}