//漏斗翻轉樣式
import React, { useId } from "react";

export function HourglassFlip({ size = 18, color = "#60A5FA", speed = 4000 }) {
  const id = useId().replace(/[:]/g, "");
  const key = `hgflip_${id}`;
  return (
    <>
      <style>{`
        @keyframes ${key} {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(180deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        aria-hidden
        style={{
          display: "block",
          transformOrigin: "12px 12px",
          animation: `${key} ${speed}ms linear infinite`
        }}
      >
        <path
          d="M6 2h12a1 1 0 0 1 1 1v2a1 1 0 0 1-.29.71L14 10v4l4.71 4.29c.18.18.29.43.29.71v2a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-2c0-.28.11-.53.29-.71L10 14v-4L5.29 5.71A1 1 0 0 1 5 5V3a1 1 0 0 1 1-1z"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M8 4h8l-4 4-4-4zM8 20h8l-4-4-4 4z" fill={color} opacity=".25" />
      </svg>
    </>
  );
}
