//常用字卡之小元件
import React from 'react';
import { THEME } from './theme';
export const Card = ({ title, subtitle, right, children, style }) => (
  <div style={{
    background: THEME.bg.surface,
    border: THEME.border,
    borderRadius: THEME.radius,
    padding: 16,
    ...style
  }}>
    {(title || subtitle || right) && (
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 10 }}>
        <div>
          {subtitle && <div style={{ fontSize: 12, color: THEME.text.secondary }}>{subtitle}</div>}
          {title && <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>}
        </div>
        {right}
      </div>
    )}
    {children}
  </div>
);