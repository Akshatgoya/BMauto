import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export interface PredictionRequest {
  year: number;
  present_price: number;
  kms_driven: number;
  fuel_type: number;
  seller_type: number;
  transmission: number;
  owner: number;
}

export interface PredictionResponse {
  best_model: string;
  best_prediction: number;
  linear_pred: number;
  lasso_pred: number;
  rf_pred: number;
  nn_pred: number;
  r2_linear: number;
  r2_lasso: number;
  r2_rf: number;
  r2_nn: number;
}

export const predictCarPrice = async (data: PredictionRequest): Promise<PredictionResponse> => {
  const response = await axios.post(`${API_URL}/predict/car`, data);
  return response.data;
};

export const predictBikePrice = async (data: PredictionRequest): Promise<PredictionResponse> => {
  const response = await axios.post(`${API_URL}/predict/bike`, data);
  return response.data;
};

export const getCarAnalytics = async () => {
  const response = await axios.get(`${API_URL}/analytics/car`);
  return response.data;
};

export const getBikeAnalytics = async () => {
  const response = await axios.get(`${API_URL}/analytics/bike`);
  return response.data;
};
