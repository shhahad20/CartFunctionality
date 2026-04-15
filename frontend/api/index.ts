/**
 * Centralized Backend API Configuration
 * Change the API_BASE_URL to switch between development/production environments
 */

const env = (import.meta as unknown as { env: Record<string, string> }).env;

// ── Configuration ────────────────────────────────────────────────────────
const API_BASE_URL = env.VITE_API_URL || "http://localhost:4000";
const API_VERSION = "/api";

// ── Base Endpoint ────────────────────────────────────────────────────────
export const API = {
  BASE: API_BASE_URL,
  FULL_URL: `${API_BASE_URL}${API_VERSION}`,
};

// ── Auth Endpoints ───────────────────────────────────────────────────────
export const AUTH_ENDPOINTS = {
  REGISTER: `${API.FULL_URL}/auth/register`,
  LOGIN: `${API.FULL_URL}/auth/login`,
  LOGOUT: `${API.FULL_URL}/auth/logout`,
  ME: `${API.FULL_URL}/auth/me`,
  FORGOT_PASSWORD: `${API.FULL_URL}/auth/forgot-password`,
  RESET_PASSWORD: `${API.FULL_URL}/auth/reset-password`,
  CHANGE_PASSWORD: `${API.FULL_URL}/auth/change-password`,
};

// ── Cart Endpoints ───────────────────────────────────────────────────────
export const CART_ENDPOINTS = {
  GET_CART: `${API.FULL_URL}/cart`,
  ADD_ITEM: `${API.FULL_URL}/items`,
  UPDATE_ITEM: (productId: string) => `${API.FULL_URL}/items/${productId}`,
  REMOVE_ITEM: (productId: string) => `${API.FULL_URL}/items/${productId}`,
  CHECKOUT: `${API.FULL_URL}/cart/checkout`,
  CLEAR_CART: `${API.FULL_URL}/cart`,
};

// ── Product Endpoints ────────────────────────────────────────────────────
export const PRODUCT_ENDPOINTS = {
  GET_ALL: `${API.FULL_URL}/products`,
  GET_BY_ID: (productId: string) => `${API.FULL_URL}/products/${productId}`,
};

// ── Order Endpoints ──────────────────────────────────────────────────────
export const ORDER_ENDPOINTS = {
  GET_BY_SESSION: (sessionId: string) => `${API.FULL_URL}/orders/session/${sessionId}`,
};

// ── Webhook Endpoints ────────────────────────────────────────────────────
export const WEBHOOK_ENDPOINTS = {
  STRIPE: `${API.FULL_URL}/webhook`,
};

// ── Export All Endpoints ─────────────────────────────────────────────────
export const ENDPOINTS = {
  ...AUTH_ENDPOINTS,
  ...CART_ENDPOINTS,
  ...PRODUCT_ENDPOINTS,
  ...ORDER_ENDPOINTS,
  ...WEBHOOK_ENDPOINTS,
};

// ── Default Exports ─────────────────────────────────────────────────────
export default API;
