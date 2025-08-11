import React from "react";

export default function SmokeyBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        backgroundImage: "url('/smoke.svg')",
        backgroundRepeat: "repeat",
        color: "var(--main-color)",
      }}
    />
  );
}
