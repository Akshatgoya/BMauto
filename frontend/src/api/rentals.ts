import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

export interface Rental {
  id: number;
  owner_id: number;
  vehicle_type: string;
  title: string;
  brand: string;
  model_name: string;
  year: number;
  fuel_type: string;
  transmission: string;
  kms_driven: number;
  price_per_day: number;
  price_per_week?: number;
  price_per_month?: number;
  location: string;
  description: string;
  images: string[];
  is_available: boolean;
  created_at: string;
  updated_at: string;
  owner?: {
    id: number;
    full_name: string;
    city: string;
    role: string;
    avatar_url?: string;
    created_at: string;
    phone?: string;
  };
}

export interface RentalListResponse {
  items: Rental[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface RentalBooking {
  id: number;
  listing_id: number;
  renter_id: number;
  start_date: string;
  end_date: string;
  total_days: number;
  total_price: number;
  status: string;
  created_at: string;
  listing_title?: string;
  renter_name?: string;
  listing_location?: string;
}

export interface BookedRange {
  start_date: string;
  end_date: string;
  status: string;
}

export const fetchRentals = async (params: Record<string, string | number | boolean>) => {
  const res = await axios.get<RentalListResponse>(`${API_URL}/rentals`, { params });
  return res.data;
};

export const fetchRental = async (id: number, token?: string, revealPhone = false) => {
  const headers = token ? authHeaders(token) : {};
  const res = await axios.get<Rental>(`${API_URL}/rentals/${id}`, {
    headers,
    params: revealPhone ? { reveal_phone: true } : {},
  });
  return res.data;
};

export const fetchRentalAvailability = async (id: number) => {
  const res = await axios.get<{ booked_ranges: BookedRange[] }>(`${API_URL}/rentals/${id}/availability`);
  return res.data;
};

export const createRental = async (token: string, data: Record<string, unknown>) => {
  const res = await axios.post<Rental>(`${API_URL}/rentals`, data, { headers: authHeaders(token) });
  return res.data;
};

export const updateRental = async (token: string, id: number, data: Record<string, unknown>) => {
  const res = await axios.put<Rental>(`${API_URL}/rentals/${id}`, data, { headers: authHeaders(token) });
  return res.data;
};

export const deleteRental = async (token: string, id: number) => {
  await axios.delete(`${API_URL}/rentals/${id}`, { headers: authHeaders(token) });
};

export const bookRental = async (
  token: string,
  id: number,
  body: { start_date: string; end_date: string }
) => {
  const res = await axios.post<RentalBooking>(`${API_URL}/rentals/${id}/book`, body, {
    headers: authHeaders(token),
  });
  return res.data;
};

export const fetchMyRentals = async (token: string) => {
  const res = await axios.get<Rental[]>(`${API_URL}/rentals/my-rentals`, { headers: authHeaders(token) });
  return res.data;
};

export const fetchMyBookings = async (token: string) => {
  const res = await axios.get<RentalBooking[]>(`${API_URL}/rentals/my-bookings`, {
    headers: authHeaders(token),
  });
  return res.data;
};

export const fetchListingBookings = async (token: string, listingId: number) => {
  const res = await axios.get<RentalBooking[]>(`${API_URL}/rentals/${listingId}/bookings`, {
    headers: authHeaders(token),
  });
  return res.data;
};

export const updateBookingStatus = async (token: string, bookingId: number, status: string) => {
  const res = await axios.put<RentalBooking>(
    `${API_URL}/rentals/bookings/${bookingId}/status`,
    { status },
    { headers: authHeaders(token) }
  );
  return res.data;
};
