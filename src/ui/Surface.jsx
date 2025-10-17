//統一樣式用
import React from 'react';
import { THEME } from './theme';
export const Surface = ({ style, children }) => (
  <section style={{
    background: THEME.bg.surface,
    border: THEME.border,
    borderRadius: THEME.radius,
    boxShadow: THEME.shadow,
    padding: 16,
    ...style
  }}>
    {children}
  </section>
);


