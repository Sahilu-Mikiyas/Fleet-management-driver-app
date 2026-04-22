import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const API_BASE_URL = Platform.OS === "web" 
  ? "http://localhost:3000/api/v1" 
  : "https://fleet-management-kzif.onrender.com/api/v1";

const TOKEN_KEY = "auth_token";

/**
 * Centralized API client with JWT token interceptor.
 * All API calls go through this client to automatically attach
 * the bearer token and handle auth errors.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Token Management ──

export async function getStoredToken(): Promise<string | null> {
  try {
    // Use SecureStore on native, AsyncStorage on web
    if (Platform.OS === "web") {
      return await AsyncStorage.getItem(TOKEN_KEY);
    }
    // Dynamic import for SecureStore to avoid web bundling issues
    const SecureStore = await import("expo-secure-store");
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function storeToken(token: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      const SecureStore = await import("expo-secure-store");
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch (error) {
    console.error("Failed to store token:", error);
  }
}

export async function clearToken(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } else {
      const SecureStore = await import("expo-secure-store");
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error("Failed to clear token:", error);
  }
}

// ── Request Interceptor: Attach JWT ──

apiClient.interceptors.request.use(
  async (config) => {
    const token = await getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: Handle errors ──

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || "An error occurred";

      // 401 = token expired or invalid
      if (status === 401) {
        clearToken();
        // The auth context will detect the missing token and redirect to login
      }

      return Promise.reject(new Error(message));
    }

    if (error.request) {
      return Promise.reject(new Error("Network error. Please check your connection."));
    }

    return Promise.reject(error);
  }
);

// ── API Types ──

export interface ApiUser {
  _id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  role: "SHIPPER" | "VENDOR" | "DRIVER" | "COMPANY_ADMIN" | "PRIVATE_TRANSPORTER" | "BROKER" | "SUPER_ADMIN";
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED";
  active: boolean;
  companyId: string | null;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiLoginResponse {
  status: string;
  token: string;
  data: {
    user: ApiUser;
  };
}

export interface ApiDriver {
  _id: string;
  userId: string;
  companyId: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  licenseNumber: string;
  licensePhoto: string;
  driverPhoto: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  active: boolean;
}

export interface ApiOrderLocation {
  address: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  contactPhone?: string;
}

export interface ApiCargo {
  type?: string;
  description?: string;
  weightKg?: number;
  quantity?: number;
  unit?: "ITEM" | "BOX" | "PALLET" | "TON";
  specialHandling?: string[];
}

export interface ApiPricing {
  proposedBudget?: number;
  currency?: string;
  paymentMethod?: "CASH" | "BANK_TRANSFER" | "WALLET" | "CARD";
  negotiable?: boolean;
}

export interface ApiVehicleRequirements {
  vehicleType?: string;
  minimumCapacityKg?: number;
}

export interface ApiMarketplaceOrder {
  _id: string;
  orderNumber: string;
  createdBy: string | ApiUser;
  assignmentMode: "DIRECT_COMPANY" | "DIRECT_PRIVATE_TRANSPORTER" | "OPEN_MARKETPLACE";
  targetCompanyId: string | null;
  targetTransporterId: string | null;
  channel: string;
  status: "OPEN" | "MATCHED" | "ASSIGNED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
  title: string;
  description?: string;
  pickupLocation: ApiOrderLocation;
  deliveryLocation: ApiOrderLocation;
  cargo?: ApiCargo;
  vehicleRequirements?: ApiVehicleRequirements;
  pickupDate: string;
  deliveryDeadline?: string;
  pricing?: ApiPricing;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiOrderProposal {
  _id: string;
  orderId: string | ApiMarketplaceOrder;
  submittedByUserId: string | ApiUser;
  companyId: string | null;
  proposalType: "COMPANY" | "PRIVATE_TRANSPORTER";
  proposedPrice: number;
  currency: string;
  message?: string;
  estimatedPickupDate?: string;
  vehicleDetails?: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  acceptedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiVehicle {
  _id: string;
  companyId: string;
  plateNumber: string;
  vehicleType: string;
  model?: string;
  capacityKg?: number;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  active: boolean;
}

export interface ApiTrip {
  _id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface ApiTransaction {
  _id: string;
  tx_ref: string;
  status: string;
  amount: number;
  ref_id?: string;
  orderId?: string;
  createdAt: string;
  updatedAt: string;
}

// ── API Functions ──

// Auth
export const authApi = {
  login: (identifier: string, password: string) =>
    apiClient.post<ApiLoginResponse>("/users/login", { identifier, password }),

  logout: () => apiClient.get("/users/logout"),

  checkAuth: () =>
    apiClient.get<{ status: string; data: { user: ApiUser } }>("/users/check-auth"),

  forgotPassword: (email: string) =>
    apiClient.post("/users/forgotPassword", { email }),

  updatePassword: (currentPassword: string, password: string, passwordConfirm: string) =>
    apiClient.patch("/users/updatePassword", { currentPassword, password, passwordConfirm }),
};

// Driver
export const driverApi = {
  getAssignments: () =>
    apiClient.get("/driver/assignments"),

  acceptAssignment: (orderId: string) =>
    apiClient.post(`/driver/assignments/${orderId}/accept`),

  rejectAssignment: (orderId: string) =>
    apiClient.post(`/driver/assignments/${orderId}/reject`),

  startAssignment: (orderId: string) =>
    apiClient.post(`/driver/assignments/${orderId}/start`),

  arriveAtPickup: (orderId: string) =>
    apiClient.post(`/driver/assignments/${orderId}/arrive`),

  completeAssignment: (orderId: string) =>
    apiClient.post(`/driver/assignments/${orderId}/complete`),

  updateStatus: (status: string, isAvailable: boolean) =>
    apiClient.put("/driver/status", { status, isAvailable }),

  streamLocation: (latitude: number, longitude: number, accuracy?: number) =>
    apiClient.post("/driver/location", { latitude, longitude, accuracy }),

  getCommission: () =>
    apiClient.get("/driver/commission"),

  getCommissionHistory: () =>
    apiClient.get("/driver/commission/history"),

  getTripHistory: () =>
    apiClient.get("/driver/trips/history"),

  uploadEvidence: (tripId: string, formData: FormData) =>
    apiClient.post(`/driver/trips/${tripId}/evidence`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  verifyOtp: (tripId: string, otp: string) =>
    apiClient.post(`/driver/trips/${tripId}/verify-otp`, { otp }),

  updateMilestone: (tripId: string, milestone: string) =>
    apiClient.put(`/driver/trips/${tripId}/milestone`, { milestone }),
};

// Orders & Marketplace
export const ordersApi = {
  getMarketplace: (params?: { page?: number; limit?: number }) =>
    apiClient.get("/orders/marketplace", { params }),

  getMyOrders: () =>
    apiClient.get("/orders/mine"),

  submitProposal: (orderId: string, data: {
    proposedPrice?: number;
    currency?: string;
    message?: string;
    estimatedPickupDate?: string;
    vehicleDetails?: string;
  }) =>
    apiClient.post(`/orders/${orderId}/proposals`, data),

  getOrderProposals: (orderId: string) =>
    apiClient.get(`/orders/${orderId}/proposals`),

  getMyProposals: () =>
    apiClient.get("/orders/proposals/mine"),
};

// Trips
export const tripsApi = {
  getTrip: (id: string) =>
    apiClient.get(`/trips/${id}`),

  listTrips: (params?: { page?: number; limit?: number }) =>
    apiClient.get("/trips", { params }),

  trackTrip: (id: string) =>
    apiClient.get(`/trips/${id}/track`),
};

// Geofences
export const geofencesApi = {
  checkLocation: (latitude: number, longitude: number, tripId: string) =>
    apiClient.post("/geofences/check-location", { latitude, longitude, tripId }),

  getByTrip: (tripId: string) =>
    apiClient.get(`/geofences/by-trip/${tripId}`),
};

// Payments
export const paymentsApi = {
  initialize: (orderId: string, amount: number) =>
    apiClient.post("/payment/initialize", { orderId, amount }),

  verify: (txRef: string) =>
    apiClient.post("/payment/verify", { tx_ref: txRef }),

  getTransactions: () =>
    apiClient.get("/transactions"),

  getTransaction: (txRef: string) =>
    apiClient.get(`/transactions/${txRef}`),
};

// Vehicles (via company endpoint)
export const vehiclesApi = {
  getCompanyVehicles: () =>
    apiClient.get("/company/vehicles"),
};

export default apiClient;
