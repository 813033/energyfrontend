import React, { useEffect, useRef, useState } from "react";

// 數字改變 => 碼表感 舊字往上 新字下往上進場
export function FlipText({ text, style }) {
  const [prev, setPrev] = useState(text);
  const [anim, setAnim] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (text === prev) return;
    setAnim(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setPrev(text);
      setAnim(false);
    }, 260); //260ms
    return () => clearTimeout(timeoutRef.current);
  }, [text, prev]);

  const base = {
    position: "relative",
    display: "inline-block",
    height: "1em",
    overflow: "hidden",
    lineHeight: 1,
  };

  const row = (top) => ({
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "left",
    transform: `translateY(${top})`,
    transition: "transform .26s cubic-bezier(.2,.7,.2,1), opacity .26s",
    willChange: "transform",
  });

  return (
    <span style={{ ...base, ...style }}>
      {/* 舊字往上 */}
      <span
        style={{
          ...row(anim ? "-100%" : "0%"),
          opacity: anim ? 0.35 : 1,
        }}
      >
        {prev}
      </span>
      {/* 新字由下進場 */}
      <span
        style={{
          ...row(anim ? "0%" : "100%"),
          opacity: 1,
        }}
      >
        {text}
      </span>
    </span>
  );
}
