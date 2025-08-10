import React from "react";

export default function SmokeyBackground() {
  return (
    <svg
      className="pointer-events-none fixed inset-0 z-0"
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id="smoke">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="5" seed="2">
          <animate attributeName="baseFrequency" dur="60s" values="0.9;0.8;0.9" repeatCount="indefinite" />
        </feTurbulence>
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.5" />
        </feComponentTransfer>
      </filter>
      <rect width="100%" height="100%" filter="url(#smoke)" fill="var(--main-color)" opacity="0.2" />
    </svg>
  );
}
