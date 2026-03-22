import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const FONT = '"Circular Std", "Circular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, jobSeekerProfile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isJobSeeker = user && jobSeekerProfile;
  const jsPhoto = jobSeekerProfile?.photoUrl || null;
  const jsInitials =
    jobSeekerProfile?.firstName?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    null;

  // Active link helper
  const linkStyle = (path) => ({
    ...s.navLink,
    ...(pathname === path ? s.navLinkActive : {}),
  });

  return (
    <>
      <nav style={s.navbar}>
        <div style={s.navInner}>

          {/* Logo */}
          <div style={s.navLogo} onClick={() => navigate("/")}>
            <div style={s.logoMark}>V</div>
            <span style={s.logoText}>Vetted</span>
          </div>

          {/* Desktop links */}
          <div className="nav-links-desktop" style={s.navLinks}>
            <Link to="/jobs"          style={linkStyle("/jobs")}>Browse Jobs</Link>
            <Link to="/employer/join" style={linkStyle("/employer/join")}>For Employers</Link>
            {isJobSeeker ? (
              <div
                style={s.navAvatar}
                onClick={() => navigate("/jobseeker/dashboard")}
                title="My Profile"
              >
                {jsPhoto
                  ? <img src={jsPhoto} alt="" style={s.navAvatarImg} />
                  : <div style={s.navAvatarInitials}>{jsInitials}</div>
                }
              </div>
            ) : (
              <Link to="/jobseeker/login" style={s.navSignIn}>Sign In</Link>
            )}
            <Link to="/employer/login" style={s.navBtn}>Employer Login</Link>
          </div>

          {/* Hamburger */}
          <button
            className="menu-toggle-btn"
            style={s.menuToggle}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen
              ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            }
          </button>

        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div style={s.mobileMenu}>
            <Link to="/jobs"              style={s.mobileLink} onClick={() => setMenuOpen(false)}>Browse Jobs</Link>
            <Link to="/employer/join"     style={s.mobileLink} onClick={() => setMenuOpen(false)}>For Employers</Link>
            {isJobSeeker
              ? <Link to="/jobseeker/dashboard" style={s.mobileLink} onClick={() => setMenuOpen(false)}>My Profile</Link>
              : <Link to="/jobseeker/login"     style={s.mobileLink} onClick={() => setMenuOpen(false)}>Sign In</Link>
            }
            <Link to="/employer/login" style={s.mobileLinkBtn} onClick={() => setMenuOpen(false)}>Employer Login</Link>
          </div>
        )}
      </nav>

      {/* Responsive CSS — scoped to navbar */}
      <style>{`
        .nav-links-desktop { display: flex; }
        .menu-toggle-btn   { display: none; }
        @media (max-width: 900px) {
          .nav-links-desktop { display: none !important; }
          .menu-toggle-btn   { display: flex !important; }
        }
      `}</style>
    </>
  );
}

const s = {
  navbar: {
    background: "#ffffff",
    borderBottom: "1px solid #dadce0",
    position: "fixed",
    top: 0, left: 0, right: 0,
    zIndex: 100,
    fontFamily: FONT,
  },
  navInner: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 24px",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // Logo
  navLogo:  { cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 },
  logoMark: { width: "28px", height: "28px", borderRadius: "5px", background: "#ffca28", color: "#d84315", fontWeight: "700", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT },
  logoText: { color: "#202124", fontWeight: "600", fontSize: "15px", fontFamily: FONT },

  // Desktop nav
  navLinks:     { display: "flex", alignItems: "center", gap: "16px" },
  navLink:      { color: "#3c4043", fontSize: "14px", fontWeight: "500", textDecoration: "none", padding: "8px 12px", borderRadius: "4px", fontFamily: FONT },
  navLinkActive:{ color: "#1a73e8" },
  navSignIn:    { color: "#1a73e8", border: "1px solid #dadce0", background: "#fff", padding: "7px 16px", borderRadius: "20px", fontSize: "14px", fontWeight: "500", textDecoration: "none", fontFamily: FONT },
  navBtn:       { background: "#1a73e8", color: "#fff", border: "none", padding: "8px 18px", borderRadius: "4px", fontSize: "14px", fontWeight: "500", textDecoration: "none", fontFamily: FONT },

  // Avatar
  navAvatar:        { width: "36px", height: "36px", borderRadius: "50%", overflow: "hidden", cursor: "pointer", border: "1px solid #dadce0", flexShrink: 0 },
  navAvatarImg:     { width: "100%", height: "100%", objectFit: "cover" },
  navAvatarInitials:{ width: "100%", height: "100%", background: "#1a73e8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "600" },

  // Hamburger
  menuToggle: { display: "none", background: "none", border: "none", cursor: "pointer", padding: "4px", alignItems: "center" },

  // Mobile menu
  mobileMenu:   { background: "#fff", borderTop: "1px solid #dadce0", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" },
  mobileLink:   { color: "#202124", fontSize: "15px", padding: "12px 16px", textDecoration: "none", display: "block", fontFamily: FONT },
  mobileLinkBtn:{ color: "#1a73e8", background: "#fff", border: "1px solid #dadce0", fontSize: "15px", padding: "12px 16px", borderRadius: "24px", textDecoration: "none", display: "block", textAlign: "center", marginTop: "12px", fontWeight: "500", fontFamily: FONT },
};