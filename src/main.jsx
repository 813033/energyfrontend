import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

//如果目前是開發環境(DEV)且sessionStorage中未標記token_cleared的話
if (import.meta.env.DEV && !sessionStorage.getItem('token_cleared')) {
  //避免沿用舊的登入憑證
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  //在sessionStorage中設定一個記號 避免每次重新整理都清除token
  sessionStorage.setItem('token_cleared', 'true');
}
//建立React的root並渲染畫面
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
