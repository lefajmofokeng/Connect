import { useState, useEffect } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../../lib/firebase";

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

const FONT_HEAD = '"Bricolage Grotesque", "Circular Std", -apple-system, BlinkMacSystemFont, sans-serif';
const FONT_BODY = '"Inter", "Circular Std", -apple-system, BlinkMacSystemFont, sans-serif';

export default function JobSeekerRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Precision viewport tracking to adapt layout columns flawlessly
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 900);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleGoogleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!agreeTerms) {
      setError("You must read and agree with the Terms of Use and Privacy Policy to continue.");
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // ── 1. Block employer accounts from registering as job seekers ──
      const empSnap = await getDoc(doc(db, "employers", user.uid));
      if (empSnap.exists()) {
        await auth.signOut();
        setError("This Google account is already linked to an employer account. Please use the employer login.");
        setLoading(false);
        return;
      }

      // ── 2. Block admin ─────────────────────────────────────────────
      if (user.email === "lefamjack@gmail.com") {
        await auth.signOut();
        setError("Please use the admin login.");
        setLoading(false);
        return;
      }

      // ── 3. Handle Already registered accounts on the registration view ──
      const jsSnap = await getDoc(doc(db, "jobseekers", user.uid));
      if (jsSnap.exists()) {
        setError("An account with this Google profile already exists. Redirecting you to your dashboard...");
        setTimeout(() => {
          navigate("/jobseeker/dashboard");
        }, 2000);
        return;
      }

      // ── 4. New user — create their profile ─────────────────────────
      await setDoc(doc(db, "jobseekers", user.uid), {
        email: user.email,
        firstName: user.displayName?.split(" ")[0] || "",
        lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
        phone: "", city: "", province: "", bio: "", skills: [],
        savedJobs: [], photoUrl: user.photoURL || "",
        cvUrl: "", cvFilename: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      navigate("/jobseeker/dashboard");
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        setError("Registration failed. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Global CSS Styling Engine for Micro-Interactions */}
      <style>{`
        .cro-btn:hover {
          background-color: #2a2e39 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(19, 23, 34, 0.15) !important;
        }
        .cro-btn:active {
          transform: translateY(0);
        }
        .cro-checkbox-wrapper {
          display: flex;
          align-items: center;
          justifyContent: center;
          width: 18px;
          height: 18px;
          border: 2px solid #d1d4dc;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
          background-color: #ffffff;
          flex-shrink: 0;
          margin-top: 1px;
          box-sizing: border-box;
        }
        .cro-checkbox-wrapper.checked {
          border-color: #131722;
          background-color: #131722;
        }
        .cro-text-link {
          color: #2962ff !important;
          text-decoration: none;
        }
        .cro-text-link:hover {
          text-decoration: underline !important;
        }
        @keyframes croSpinner {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Left Panel: High-End Immersive Graphic Cover Workspace Card */}
      {!isMobile && (
        <div style={styles.leftVisualContainer}>
          <div style={styles.graphicCard}>
            {/* Visual Text Overlay System */}
            <div style={styles.textOverlayContainer}>
              <h2 style={styles.graphicHeading}>Look first, then leap.</h2>
            </div>
          </div>
        </div>
      )}

      {/* Right Panel: Clean Workflow Action Hub */}
      <div style={{ ...styles.rightFormContainer, padding: isMobile ? "40px 24px" : "40px 80px" }}>
        
        {/* Sole Logo Placement Container - Configured exclusively on the right side */}
        <div style={styles.brandRow}>
          <img 
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop" 
            alt="Brand Logo" 
            style={styles.mainLogoImage} 
          />
        </div>

        {/* Central Registration Form Body wrapper */}
        <form onSubmit={handleGoogleSubmit} style={styles.formContent}>
          <h1 style={styles.mainTitle}>Almost there</h1>
          <p style={styles.subTitle}>Finish creating your account</p>

          {/* Form System Workspace Diagnostic Error Loggers */}
          {error && (
            <div style={styles.alertError}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: "1px" }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Explicit Core Authentication Action Submission Element */}
          <button
            type="submit"
            className="cro-btn"
            disabled={loading}
            style={{
              ...styles.primarySubmitBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? (
              <span style={styles.spinner} />
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <svg height="16" width="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#ffffff"/>
                </svg>
                Next with Google
              </span>
            )}
          </button>

          {/* Custom interactive tick selection box matching professional specification parameters */}
          <div style={styles.checkboxContainer} onClick={() => setAgreeTerms(!agreeTerms)}>
            <div className={`cro-checkbox-wrapper ${agreeTerms ? 'checked' : ''}`}>
              {agreeTerms && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
            <label 
              style={styles.checkboxLabel} 
              onClick={(e) => e.stopPropagation()} 
              htmlFor="agreeTermsHidden"
            >
              I have read and agreed with the <a href="#terms" className="cro-text-link">Terms of Use</a> and <a href="#privacy" className="cro-text-link">Privacy Policy</a>
            </label>
            <input
              id="agreeTermsHidden"
              type="checkbox"
              style={{ display: "none" }}
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              required
            />
          </div>

          {/* Account Relational State Redirection Paths */}
          <div style={styles.navigationFooterLinks}>
            <span style={styles.navLabel}>Already have an account? </span>
            <Link to="/jobseeker/login" className="cro-text-link" style={{ fontWeight: "500" }}>Sign In</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

// ULTRA-PREMIUM PRODUCTION ENGINE INLINE LAYOUT SHEET
const styles = {
  container: {
    width: "100vw",
    minHeight: "100vh",
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "row",
    boxSizing: "border-box",
    margin: 0,
    padding: 0,
    overflowX: "hidden",
  },

  /* Left Side Full-Coverage Visual Container */
  leftVisualContainer: {
    flex: "1.1",
    backgroundColor: "#ffffff",
    padding: "20px 0px 20px 20px",
    display: "flex",
    boxSizing: "border-box",
  },

  graphicCard: {
    width: "100%",
    // Background graphic fully covers the entire panel bounding area edge-to-edge
    backgroundImage: "url('https://images.pexels.com/photos/28428587/pexels-photo-28428587.jpeg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    borderRadius: "24px",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: "80px",
    overflow: "hidden",
    boxSizing: "border-box",
    boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
    backgroundColor: "#050811",
  },

  textOverlayContainer: {
    position: "relative",
    zIndex: 5,
    padding: "0 32px",
    boxSizing: "border-box",
    textAlign: "center",
    paddingBottom: "60px"
  },

  graphicHeading: {
    fontFamily: FONT_HEAD,
    color: "#ffffff",
    fontSize: "36px",
    fontWeight: "500",
    letterSpacing: "-0.01em",
    margin: 0,
    textShadow: "0 2px 12px rgba(0,0,0,0.5)"
  },

  /* Right Side Clean Corporate Layout Form UI Elements */
  rightFormContainer: {
    flex: "1",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#ffffff",
    boxSizing: "border-box",
    justifyContent: "flex-start"
  },

  brandRow: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
    marginTop: "40px",
    marginBottom: "80px"
  },

  mainLogoImage: {
    height: "36px",
    width: "auto",
    objectFit: "contain"
  },

  formContent: {
    width: "100%",
    maxWidth: "360px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },

  mainTitle: {
    fontFamily: FONT_HEAD,
    fontSize: "26px",
    fontWeight: "500",
    color: "#131722",
    margin: "0 0 6px 0",
    textAlign: "center"
  },

  subTitle: {
    fontFamily: FONT_BODY,
    fontSize: "14px",
    color: "#434651",
    margin: "0 0 36px 0",
    textAlign: "center"
  },

  alertError: {
    background: "#fff5f5",
    border: "1px solid #feb2b2",
    color: "#c53030",
    borderRadius: "8px",
    padding: "12px 14px",
    fontSize: "13px",
    fontFamily: FONT_BODY,
    lineHeight: "1.4",
    marginBottom: "24px",
    display: "flex",
    alignItems: "flex-start",
    textAlign: "left",
    gap: "8px",
    width: "100%",
    boxSizing: "border-box",
  },

  primarySubmitBtn: {
    width: "100%",
    background: "#131722",
    borderRadius: "50px",
    color: "#ffffff",
    fontFamily: FONT_BODY,
    fontSize: "14px",
    fontWeight: "500",
    padding: "14px",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
    outline: "none"
  },

  checkboxContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: "12px",
    width: "100%",
    marginTop: "24px",
    textAlign: "left",
    cursor: "pointer",
    userSelect: "none"
  },

  checkboxLabel: {
    fontFamily: FONT_BODY,
    fontSize: "12.5px",
    color: "#434651",
    lineHeight: "1.5",
    cursor: "pointer"
  },

  spinner: {
    display: "inline-block",
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.2)",
    borderTopColor: "#ffffff",
    borderRadius: "50%",
    animation: "croSpinner 0.6s linear infinite",
  },

  navigationFooterLinks: {
    marginTop: "40px",
    fontSize: "14px",
    fontFamily: FONT_BODY,
    color: "#434651",
    textAlign: "center"
  },

  navLabel: {
    fontWeight: "400"
  }
};