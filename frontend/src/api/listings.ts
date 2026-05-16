import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export interface Listing {
  id: number;
  seller_id: number;
  vehicle_type: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  present_price: number;
  asking_price: number;
  ai_predicted_price: number;
  kms_driven: number;
  fuel_type: string;
  transmission: string;
  owner_count: number;
  seller_type: string;
  color: string;
  city: string;
  description: string;
  photos: string[];
  status: string;
  views: number;
  created_at: string;
  seller?: {
    id: number;
    full_name: string;
    city: string;
    role: string;
    avatar_url?: string;
    created_at: string;
    phone?: string;
  };
  is_saved?: boolean;
}

export interface ListingListResponse {
  items: Listing[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

export const fetchListings = async (params: Record<string, string | number>, token?: string) => {
  const headers = token ? authHeaders(token) : {};
  const res = await axios.get<ListingListResponse>(`${API_URL}/listings`, { params, headers });
  return res.data;
};

export const fetchListing = async (id: number, token?: string, revealPhone = false) => {
  const headers = token ? authHeaders(token) : {};
  const res = await axios.get<Listing>(`${API_URL}/listings/${id}`, {
    headers,
    params: revealPhone ? { reveal_phone: true } : {},
  });
  return res.data;
};

export const createListing = async (token: string, data: Record<string, unknown>) => {
  const res = await axios.post<Listing>(`${API_URL}/listings/create`, data, {
    headers: authHeaders(token),
  });
  return res.data;
};

export const updateListing = async (token: string, id: number, data: Record<string, unknown>) => {
  const res = await axios.put<Listing>(`${API_URL}/listings/${id}`, data, {
    headers: authHeaders(token),
  });
  return res.data;
};

export const deleteListing = async (token: string, id: number) => {
  await axios.delete(`${API_URL}/listings/${id}`, { headers: authHeaders(token) });
};

export const toggleSaveListing = async (token: string, id: number) => {
  const res = await axios.post<{ saved: boolean }>(`${API_URL}/listings/${id}/save`, null, {
    headers: authHeaders(token),
  });
  return res.data;
};

export const fetchMyListings = async (token: string) => {
  const res = await axios.get<Listing[]>(`${API_URL}/listings/user/my-listings`, {
    headers: authHeaders(token),
  });
  return res.data;
};

export const fetchSavedListings = async (token: string) => {
  const res = await axios.get<Listing[]>(`${API_URL}/listings/user/saved`, {
    headers: authHeaders(token),
  });
  return res.data;
};
