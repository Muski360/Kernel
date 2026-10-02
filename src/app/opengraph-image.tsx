import { ImageResponse } from "next/og";

export const alt =
  "KERNEL. Da ideia ao software, em uma conversa. Projeto educacional SENAI Americana.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: "#111310",
        color: "#f1f2eb",
        padding: "65px 75px",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 22,
        }}
      >
        <span style={{ fontWeight: 700, letterSpacing: "-1px" }}>KERNEL</span>
        <span style={{ fontSize: 16, color: "#b9c0ad" }}>
          PROJETO EDUCACIONAL
        </span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 84,
          lineHeight: 1.08,
          letterSpacing: "-5px",
        }}
      >
        <span>Da ideia ao software,</span>
        <span style={{ color: "#ceff48" }}>em uma conversa.</span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderTop: "1px solid #414738",
          paddingTop: 24,
          fontSize: 18,
          color: "#b9c0ad",
        }}
      >
        <span>SENAI Americana</span>
      </div>
    </div>,
    size,
  );
}
