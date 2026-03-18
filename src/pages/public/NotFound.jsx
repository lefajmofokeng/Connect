import { useNavigate, Link } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={s.page}>
      <nav style={s.navbar}>
        <div style={s.navInner}>
          <div onClick={() => navigate("/")} style={s.navLogo}>
            <img src="/logo.png" alt="Cronos Jobs" style={s.navLogoImg} />
          </div>
        </div>
      </nav>
      <div style={s.body}>
        <div style={s.code}>404</div>
        <h1 style={s.title}>Page Not Found</h1>
        <p style={s.sub}>The page you're looking for doesn't exist or has been moved.</p>
        <div style={s.actions}>
          <button onClick={() => navigate("/")} style={s.btnPrimary}>Go Home</button>
          <button onClick={() => navigate("/jobs")} style={s.btnOutline}>Browse Jobs</button>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { background: "#080d1b", minHeight: "100vh", fontFamily: "sans-serif", color: "#e8edf8", display: "flex", flexDirection: "column" },
  navbar: { background: "#0d1428", borderBottom: "1px solid #1e2d52" },
  navInner: { maxWidth: "1200px", margin: "0 auto", padding: "0 32px", height: "64px", display: "flex", alignItems: "center" },
  navLogo: { cursor: "pointer" },
  navLogoImg: { height: "32px", objectFit: "contain" },
  body: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 32px", textAlign: "center" },
  code: { fontSize: "120px", fontWeight: "800", color: "#0099fa", lineHeight: 1, opacity: 0.3, marginBottom: "8px" },
  title: { color: "#e8edf8", fontSize: "32px", fontWeight: "700", margin: "0 0 12px" },
  sub: { color: "#6b7fa3", fontSize: "16px", margin: "0 0 40px" },
  actions: { display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center" },
  btnPrimary: { background: "#0099fa", color: "#fff", border: "none", borderRadius: "10px", padding: "13px 28px", fontSize: "15px", fontWeight: "600", cursor: "pointer" },
  btnOutline: { background: "none", color: "#e8edf8", border: "1px solid #1e2d52", borderRadius: "10px", padding: "13px 28px", fontSize: "15px", cursor: "pointer" },
};