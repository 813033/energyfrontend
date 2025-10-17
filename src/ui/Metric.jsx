//主數字＋單位對齊、等寬數字
import React from "react";
import { THEME } from "./theme";


export function Metric({ value, unit, size = 28, note }) {
  const isPrimitive = typeof value === "string" || typeof value === "number";

  const numStyle = {
    fontFamily: THEME.font.mono,
    fontVariantNumeric: "tabular-nums",
    fontSize: typeof size === "number" ? `${size}px` : size,
    lineHeight: 1,
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          height: 44,     
          lineHeight: 1
        }}
      >
        {isPrimitive ? (
          <span style={numStyle}>{value}</span>
        ) : (
          <div style={{ ...numStyle, display: "inline-flex", alignItems: "baseline" }}>
            {value}
          </div>
        )}
        {unit ? (
          <span
            style={{
              fontSize: "0.6em",
              color: THEME.text.secondary,
              transform: "translateY(-0.2em)"
            }}
          >
            {unit}
          </span>
        ) : null}
      </div>

      {note ? (
        <div style={{ marginTop: 6, fontSize: 12, color: THEME.text.secondary }}>{note}</div>
      ) : null}
    </div>
  );
}
