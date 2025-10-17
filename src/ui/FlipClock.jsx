//更新數字用之過場動畫
import React from "react";
import { FlipText } from "./FlipText";
import { THEME } from "./theme";

export function FlipClock({ time, size = 28 }) {
  const safe = typeof time === "string" && time.includes(":") ? time : "--:--";
  const [hh, mm] = safe.split(":");
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 4,
        fontFamily: THEME.font.mono,
        fontVariantNumeric: "tabular-nums",
        lineHeight: 1
      }}
    >
      <FlipText text={hh} style={{ fontSize: size }} />
      <span style={{ opacity: 0.7, fontSize: size * 0.9 }}>:</span>
      <FlipText text={mm} style={{ fontSize: size }} />
    </div>
  );
}
