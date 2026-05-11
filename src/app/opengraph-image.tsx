import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Nexus — Education ERP for Schools, Colleges & Universities";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div style={{
        width: "1200px", height: "630px",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #064e3b 100%)",
        fontFamily: "sans-serif",
        position: "relative",
      }}>
        {/* Grid pattern */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }} />
        {/* Green glow */}
        <div style={{
          position: "absolute",
          width: "600px", height: "400px", borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(5,150,105,0.2) 0%, transparent 70%)",
          top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        }} />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "28px", zIndex: 1 }}>
          {/* Badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "8px 20px", borderRadius: "100px",
            background: "rgba(5,150,105,0.2)", border: "1px solid rgba(5,150,105,0.4)",
          }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} />
            <span style={{ color: "#34d399", fontSize: "17px", fontWeight: 600, letterSpacing: "2px" }}>WISEMEN SOFT</span>
          </div>

          {/* Logo PNG + wordmark */}
          <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://nexus.wisemensoft.com/icons/icon.png"
              width={120}
              height={120}
              alt="Nexus logo"
              style={{ objectFit: "contain" }}
            />
          </div>

          {/* Tagline */}
          <div style={{ fontSize: "26px", fontWeight: 400, color: "rgba(255,255,255,0.6)", letterSpacing: "0.3px" }}>
            The ERP That Runs Your Entire Institution.
          </div>

          {/* Module pills */}
          <div style={{ display: "flex", gap: "10px" }}>
            {["Academics", "Attendance", "Finance", "Examinations", "Reporting", "Multi-Campus"].map((m) => (
              <div key={m} style={{
                padding: "6px 16px", borderRadius: "100px",
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.7)", fontSize: "15px", fontWeight: 500,
              }}>
                {m}
              </div>
            ))}
          </div>
        </div>

        {/* Domain */}
        <div style={{
          position: "absolute", bottom: "36px",
          color: "rgba(255,255,255,0.25)", fontSize: "17px", letterSpacing: "1px",
        }}>
          nexus.wisemensoft.com
        </div>
      </div>
    ),
    { ...size }
  );
}
