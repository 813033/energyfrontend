//登入頁面
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { BASE_URL } from '@/config';
function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {//處理登入過程、解碼、token
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    //console.log(`${BASE_URL}`);
    if (res.ok) {
      const result = await res.json();
      const token = result.access_token;

      // 存入 localStorage
      localStorage.setItem('access_token', token);
      localStorage.setItem('refresh_token', result.refresh_token);

      // 解碼判斷角色
      const decoded = jwtDecode(token);
      const role = decoded.role;
      console.log('decoded:', decoded);
      console.log('role:', role);
      navigate('/dashboard');
    
    } else {
      const err = await res.text();
      setError(`登入失敗：${err}`);
    }
  } catch {
    setError('登入過程錯誤');
  }
};


  return (
    // 登入畫面
    <div style={styles.container}>
      <div style={styles.box }>
        <h2>登入系統</h2>
        <input
          type="text"
          placeholder="使用者名稱"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="密碼"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleLogin} style={styles.button}>
          登入
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </div>
  );
}

//樣式
const styles = {
  container: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    background: '#0F1115'
  },
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
    marginBottom:'0.8rem'
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
  error: { color: '#EF4444', fontSize: '1rem' }
};


export default Login;
