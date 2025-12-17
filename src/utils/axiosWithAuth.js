//取得身分小工具
import axios from 'axios';
import { BASE_URL } from '@/config';

const axiosWithAuth = () => {
  const token = localStorage.getItem('access_token');
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export default axiosWithAuth;
