//取得角色用之小工具
import { jwtDecode } from 'jwt-decode';

export const getUserRole = () => {
  const token = localStorage.getItem('access_token');
  if (typeof token !== 'string' || !token.trim()) {
    return { username: '', role: null };
  }

  try {
    const decoded = jwtDecode(token);
    return {
      username: decoded.username || '',
      role: decoded.role || null
    };
  } catch {
    return { username: '', role: null };
  }
};
