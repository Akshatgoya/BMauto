import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

export interface CreateOrderResponse {
  order_id: string;
  amount: number;
  currency: string;
  razorpay_key: string;
}

export interface VerifyPaymentResponse {
  status: string;
  payment_id: string;
  amount: number;
  listing_title: string;
}

export interface PaymentRecord {
  id: number;
  buyer_id: number;
  seller_id: number;
  listing_id: number;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  amount: number;
  status: string;
  payment_method?: string;
  created_at: string;
  listing_title?: string;
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
}

export const createPaymentOrder = async (
  token: string,
  listingId: number,
  amount: number
) => {
  const res = await axios.post<CreateOrderResponse>(
    `${API_URL}/payment/create-order`,
    { listing_id: listingId, amount },
    { headers: authHeaders(token) }
  );
  return res.data;
};

export const verifyPayment = async (
  token: string,
  data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    listing_id: number;
  }
) => {
  const res = await axios.post<VerifyPaymentResponse>(
    `${API_URL}/payment/verify`,
    data,
    { headers: authHeaders(token) }
  );
  return res.data;
};

export const fetchPaymentHistory = async (token: string) => {
  const res = await axios.get<PaymentRecord[]>(`${API_URL}/payment/history`, {
    headers: authHeaders(token),
  });
  return res.data;
};

export const fetchPaymentsReceived = async (token: string) => {
  const res = await axios.get<PaymentRecord[]>(`${API_URL}/payment/received`, {
    headers: authHeaders(token),
  });
  return res.data;
};
