import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

export interface Part {
  id: number;
  seller_id: number;
  vehicle_type: string;
  category: string;
  title: string;
  brand: string;
  part_number?: string;
  condition: string;
  compatibility: string[];
  price: number;
  negotiable: boolean;
  quantity_available: number;
  location: string;
  description: string;
  images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  seller?: {
    id: number;
    full_name: string;
    city: string;
    role: string;
    avatar_url?: string;
    created_at: string;
    phone?: string;
  };
  seller_listing_count?: number;
}

export interface PartListResponse {
  items: Part[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PartOrder {
  id: number;
  part_id: number;
  buyer_id: number;
  seller_id: number;
  quantity: number;
  total_price: number;
  status: string;
  shipping_address: string;
  created_at: string;
  part_title?: string;
  buyer_name?: string;
  seller_name?: string;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export const PART_CATEGORIES = [
  'Engine',
  'Brakes',
  'Electrical',
  'Body',
  'Suspension',
  'Tyres',
  'Accessories',
  'Other',
];

export const fetchParts = async (params: Record<string, string | number | boolean>) => {
  const res = await axios.get<PartListResponse>(`${API_URL}/parts`, { params });
  return res.data;
};

export const fetchPart = async (id: number, token?: string, revealPhone = false) => {
  const headers = token ? authHeaders(token) : {};
  const res = await axios.get<Part>(`${API_URL}/parts/${id}`, {
    headers,
    params: revealPhone ? { reveal_phone: true } : {},
  });
  return res.data;
};

export const fetchPartCategories = async () => {
  const res = await axios.get<CategoryCount[]>(`${API_URL}/parts/categories`);
  return res.data;
};

export const createPart = async (token: string, data: Record<string, unknown>) => {
  const res = await axios.post<Part>(`${API_URL}/parts`, data, { headers: authHeaders(token) });
  return res.data;
};

export const updatePart = async (token: string, id: number, data: Record<string, unknown>) => {
  const res = await axios.put<Part>(`${API_URL}/parts/${id}`, data, { headers: authHeaders(token) });
  return res.data;
};

export const deletePart = async (token: string, id: number) => {
  await axios.delete(`${API_URL}/parts/${id}`, { headers: authHeaders(token) });
};

export const placePartOrder = async (
  token: string,
  id: number,
  body: { quantity: number; shipping_address: string }
) => {
  const res = await axios.post<PartOrder>(`${API_URL}/parts/${id}/order`, body, {
    headers: authHeaders(token),
  });
  return res.data;
};

export const fetchMyParts = async (token: string) => {
  const res = await axios.get<Part[]>(`${API_URL}/parts/my-parts`, { headers: authHeaders(token) });
  return res.data;
};

export const fetchMyOrdersBuying = async (token: string) => {
  const res = await axios.get<PartOrder[]>(`${API_URL}/parts/my-orders/buying`, {
    headers: authHeaders(token),
  });
  return res.data;
};

export const fetchMyOrdersSelling = async (token: string) => {
  const res = await axios.get<PartOrder[]>(`${API_URL}/parts/my-orders/selling`, {
    headers: authHeaders(token),
  });
  return res.data;
};

export const updatePartOrderStatus = async (token: string, orderId: number, status: string) => {
  const res = await axios.put<PartOrder>(`${API_URL}/parts/orders/${orderId}/status`, { status }, {
    headers: authHeaders(token),
  });
  return res.data;
};

export function conditionBadgeClass(condition: string) {
  if (condition === 'New') return 'bg-green-500/20 text-green-400 border-green-500/40';
  if (condition === 'Used') return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
  return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
}
