// src/components/VerifiedBadge.jsx
import React from "react";
import Svg, { Path } from "react-native-svg";

export default function VerifiedBadge({ size = 16, color = "#3897F0", style }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      {/* 12-point scalloped starburst badge */}
      <Path
        d="M22.25 12c0-1.43-.79-2.67-1.94-3.26.14-.39.22-.82.22-1.27 0-2-1.62-3.63-3.63-3.63-.45 0-.88.08-1.27.22C15.04 2.91 13.8 2.12 12.37 2.12c-1.43 0-2.67.79-3.26 1.94-.39-.14-.82-.22-1.27-.22-2 0-3.63 1.62-3.63 3.63 0 .45.08.88.22 1.27C3.29 9.33 2.5 10.57 2.5 12c0 1.43.79 2.67 1.94 3.26-.14.39-.22.82-.22 1.27 0 2 1.62 3.63 3.63 3.63.45 0 .88-.08 1.27-.22.59 1.15 1.83 1.94 3.26 1.94 1.43 0 2.67-.79 3.26-1.94.39.14.82.22 1.27.22 2 0 3.63-1.62 3.63-3.63 0-.45-.08-.88-.22-1.27 1.15-.59 1.94-1.83 1.94-3.26z"
        fill={color}
      />
      {/* Checkmark */}
      <Path
        d="M9.8 15.8l-3.6-3.6 1.4-1.4 2.2 2.2 6.4-6.4 1.4 1.4-7.8 7.8z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}
