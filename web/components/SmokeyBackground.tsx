import React from "react";

export default function SmokeyBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background:
          "radial-gradient(circle at 25% 20%, rgba(128,90,213,0.25), transparent 60%), " +
          "radial-gradient(circle at 75% 0%, rgba(110,231,183,0.25), transparent 55%), " +
          "radial-gradient(circle at 80% 70%, rgba(236,72,153,0.2), transparent 55%), " +
          "#0b0e1c",
        filter: "blur(80px)",
      }}
    />
  );
}
