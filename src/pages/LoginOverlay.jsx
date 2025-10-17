import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { BASE_URL } from '@/config';

export default function LoginOverlay() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef(null);

  //鎖住背景捲動、初始聚焦
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    return () => { document.body.style.overflow = prev; };
  }, []);

  //Enter送出
  const onKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  const handleLogin = async () => {
    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        setError(`登入失敗：${await res.text()}`);
        return;
      }
      const result = await res.json();
      localStorage.setItem('access_token', result.access_token);
      localStorage.setItem('refresh_token', result.refresh_token);
      try { jwtDecode(result.access_token); } catch {}
      navigate(-1); //回到背景頁
    } catch {
      setError('登入過程發生錯誤');
    }
  };

  return (
    //覆蓋整頁並把背景模糊
    <div
      onClick={() => navigate(-1)} //點擊遮罩關閉
      style={overlay}
      aria-modal="true"
      role="dialog"
    >
      <div onClick={(e) => e.stopPropagation()} style={styles.box}>
        <h3 style={styles.title}>登入系統</h3>

        <input
          ref={inputRef}
          type="text"
          placeholder="使用者名稱"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={onKeyDown}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="密碼"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={onKeyDown}
          style={styles.input}
        />

        <button onClick={handleLogin} style={styles.button}>
          登入
        </button>

        {error && <div style={styles.error}>{error}</div>}
      </div>
    </div>
  );
}

const styles = {
  box: {
    width: 360,
    background: '#2c2f35ff',
    padding: 28,
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,.06)',
    boxShadow: '0 8px 24px rgba(0,0,0,.4)',
    color: '#E6EBF2',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem',
    fontSize: '1.4rem',
  },
  title: { margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '.3px' },
  input: {
    padding: '10px 12px',
    fontSize: '1.2rem',
    background: '#0F141B',
    color: '#E6EBF2',
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 10,
    outline: 'none',
    marginBottom: '0.8rem',
  },
  button: {
    padding: '10px 12px',
    background: '#60A5FA',
    color: '#0F141B',
    fontWeight: 700,
    fontSize: '1.2rem',
    border: 0,
    borderRadius: 10,
    cursor: 'pointer',
  },
  error: { color: '#ff4444', fontSize: '1rem' },
};

//覆蓋層（保留模糊效果)
const overlay = {
  position: 'fixed',
  inset: 0,
  zIndex: 9999,
  display: 'grid',
  placeItems: 'center',
  //背景模糊、遮罩
  backdropFilter: 'blur(10px) saturate(1.2)',
  WebkitBackdropFilter: 'blur(10px) saturate(1.2)',
  background: 'rgba(0,0,0,0.35)',
};
