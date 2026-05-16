import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export interface AuthUser {
  user_id: number;
  email: string;
  full_name: string;
  role: string;
  token: string;
}

export interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  role: string;
  avatar_url?: string;
  created_at: string;
}

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

export const register = async (data: {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  city: string;
  role: string;
}) => {
  const res = await axios.post<AuthUser>(`${API_URL}/auth/register`, data);
  return res.data;
};

export const login = async (email: string, password: string) => {
  const res = await axios.post<AuthUser>(`${API_URL}/auth/login`, { email, password });
  return res.data;
};

export const getMe = async (token: string) => {
  const res = await axios.get<UserProfile>(`${API_URL}/auth/me`, { headers: authHeaders(token) });
  return res.data;
};

export const updateProfile = async (
  token: string,
  data: Partial<{ full_name: string; phone: string; city: string; avatar_url: string }>
) => {
  const res = await axios.put<UserProfile>(`${API_URL}/auth/profile`, data, {
    headers: authHeaders(token),
  });
  return res.data;
};
