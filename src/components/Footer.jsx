import { Link } from "react-router-dom";

const FONT = '"Circular Std", "Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const DISCLAIMERS = [
  { text: "Vetted is an advertising platform, not a recruitment agency. We publish job opportunities on behalf of verified South African employers. We are not involved in any part of the hiring process — including shortlisting, interviewing, or making employment decisions. Any such decisions rest entirely with the employer who posted the listing." },
  { text: "All job applications submitted through this platform are sent directly to the relevant employer. Vetted does not receive, review, store, forward, or influence any application at any stage. Once you submit your application, your information is shared solely with the employer associated with that specific listing." },
  { text: "Vetted does not use artificial intelligence, automated scoring systems, or algorithmic ranking to evaluate, filter, or prioritise any candidate's application at any point. Every application you submit reaches the employer exactly as you submitted it — no modifications, no scoring, no filtering by our platform." },
  { text: "Vetted verifies employer registrations through CIPC documentation and supporting identity records before granting platform access. While we take reasonable steps to confirm that employers are legitimate registered entities, we cannot guarantee the accuracy of job descriptions, advertised salaries, or employment outcomes. We encourage all applicants to conduct their own due diligence." },
  { text: "Vetted will never ask job seekers for any form of payment, fee, or deposit at any stage of the application process. Browsing jobs and applying is completely free. If any employer or individual using this platform requests payment from you — whether for training, uniforms, background checks, or any other reason — do not pay and report it to us immediately at support@vetted.co.za." },
];

export default function Footer() {
  return (
    <>
      <footer style={s.footer}>
        <div style={s.footerInner}>

          {/* Disclaimer notices */}
          <div style={s.disclaimerSection}>
            <div style={s.disclaimerTitle}>Important Notice for Candidates</div>
            <div style={s.disclaimerList}>
              {DISCLAIMERS.map((d, i) => (
                <div key={i} style={s.disclaimerRow}>
                  <span style={s.disclaimerNum}>{i + 1}.</span>
                  <p style={s.disclaimerText}>{d.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer links */}
          <div className="footer-top-mobile" style={s.footerTop}>
            <div style={{ maxWidth: "250px" }}>
              <div style={s.footerBrand}>
                <div style={s.footerLogoMark}>V</div>
                <span style={s.footerBrandName}>Vetted</span>
              </div>
              <p style={s.footerTagline}>Verified Professional Network.</p>
            </div>
            <div className="footer-links-grid" style={s.footerLinksGrid}>
              <div style={s.footerCol}>
                <div style={s.footerColTitle}>Job Seekers</div>
                <Link to="/jobs"               style={s.footerLink}>Browse Jobs</Link>
                <Link to="/jobseeker/login"    style={s.footerLink}>Sign In</Link>
                <Link to="/jobseeker/register" style={s.footerLink}>Register</Link>
              </div>
              <div style={s.footerCol}>
                <div style={s.footerColTitle}>Employers</div>
                <Link to="/employer/join"  style={s.footerLink}>Apply for Access</Link>
                <Link to="/employer/login" style={s.footerLink}>Portal Login</Link>
              </div>
              <div style={s.footerCol}>
                <div style={s.footerColTitle}>Legal</div>
                <Link to="/terms"   style={s.footerLink}>Terms of Service</Link>
                <Link to="/privacy" style={s.footerLink}>Privacy Policy</Link>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="footer-bottom-mobile" style={s.footerBottom}>
            <span>© {new Date().getFullYear()} Vetted (Pty) Ltd. All rights reserved.</span>
            <span>Developed for South Africa 🇿🇦</span>
          </div>

        </div>
      </footer>

      {/* Responsive CSS — scoped to footer */}
      <style>{`
        @media (max-width: 768px) {
          .footer-top-mobile    { flex-direction: column !important; gap: 32px !important; }
          .footer-links-grid    { grid-template-columns: 1fr 1fr !important; width: 100%; gap: 32px !important; }
          .footer-bottom-mobile { flex-direction: column !important; text-align: center; gap: 8px; }
        }
        @media (max-width: 480px) {
          .footer-links-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

const s = {
  footer:      { background: "#fff", padding: "0", fontFamily: FONT },
  footerInner: { maxWidth: "1200px", margin: "0 auto", padding: "0 24px" },

  // Disclaimer
  disclaimerSection: { padding: "40px 0", borderTop: "1px solid #dadce0" },
  disclaimerTitle:   { color: "#5f6368", fontSize: "12px", fontWeight: "500", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px", fontFamily: FONT },
  disclaimerList:    { display: "flex", flexDirection: "column", gap: "16px" },
  disclaimerRow:     { display: "flex", alignItems: "flex-start", gap: "12px" },
  disclaimerNum:     { color: "#9aa0a6", fontSize: "13px", fontWeight: "600", flexShrink: 0, minWidth: "18px", paddingTop: "1px", fontFamily: FONT },
  disclaimerText:    { color: "#80868b", fontSize: "13px", lineHeight: "1.7", margin: 0, fontFamily: FONT },

  // Footer top
  footerTop:       { display: "flex", justifyContent: "space-between", gap: "48px", padding: "48px 0", borderTop: "1px solid #dadce0", borderBottom: "1px solid #dadce0" },
  footerBrand:     { display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" },
  footerLogoMark:  { width: "24px", height: "24px", borderRadius: "4px", background: "#ffca28", color: "#d84315", fontWeight: "700", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT },
  footerBrandName: { color: "#202124", fontWeight: "600", fontSize: "14px", fontFamily: FONT },
  footerTagline:   { color: "#5f6368", fontSize: "13px", margin: 0, fontFamily: FONT },

  // Links grid
  footerLinksGrid: { display: "flex", gap: "64px" },
  footerCol:       { display: "flex", flexDirection: "column", gap: "14px" },
  footerColTitle:  { color: "#202124", fontSize: "13px", fontWeight: "600", fontFamily: FONT },
  footerLink:      { color: "#5f6368", fontSize: "13px", textDecoration: "none", fontFamily: FONT },

  // Bottom bar
  footerBottom: { padding: "24px 0 48px", display: "flex", justifyContent: "space-between", color: "#9aa0a6", fontSize: "12px", fontFamily: FONT },
};