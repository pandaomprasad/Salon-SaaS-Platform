// src/services/browseService.js
import { apiClient } from "./apiClient";

const SERVICES_MEMORY_CACHE = new Map();
const SALON_MEMORY_CACHE = new Map();

export const browseService = {
  getInitialLoad: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/browse/initial-load${query ? `?${query}` : ""}`;
    return await apiClient.get(endpoint);
  },

  getSalons: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/browse/salons${query ? `?${query}` : ""}`;
    return await apiClient.get(endpoint);
  },

  getSalonById: async (salonId) => {
    const res = await apiClient.get(`/browse/salons/${salonId}`);
    if (res?.data) {
      SALON_MEMORY_CACHE.set(salonId, res);
    }
    return res;
  },

  getCachedSalonById: (salonId) => {
    return SALON_MEMORY_CACHE.get(salonId) || null;
  },

  getBranches: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/browse/branches${query ? `?${query}` : ""}`;
    return await apiClient.get(endpoint);
  },

  getBranchById: async (branchId) => {
    return await apiClient.get(`/browse/branches/${branchId}`);
  },

  getBranchServices: async (branchId) => {
    const res = await apiClient.get(`/browse/branches/${branchId}/services`);
    if (res?.data) {
      SERVICES_MEMORY_CACHE.set(branchId, res);
    }
    return res;
  },

  getCachedBranchServices: (branchId) => {
    return SERVICES_MEMORY_CACHE.get(branchId) || null;
  },

  getBranchSlots: async (branchId, date, staffId, serviceId) => {
    const params = new URLSearchParams();
    if (date) params.append("date", date);
    if (staffId) params.append("staffId", staffId);
    if (serviceId) params.append("serviceId", serviceId);
    const query = params.toString();
    return await apiClient.get(`/browse/branches/${branchId}/slots${query ? `?${query}` : ""}`);
  },

  getBranchStaff: async (branchId) => {
    return await apiClient.get(`/browse/branches/${branchId}/staff`);
  },

  getBranchReviews: async (branchId) => {
    return await apiClient.get(`/browse/branches/${branchId}/reviews`);
  },

  getSalonReviews: async (salonId) => {
    return await apiClient.get(`/browse/salons/${salonId}/reviews`);
  },

  addBranchReview: async (branchId, rating, comment, serviceName) => {
    return await apiClient.post(`/browse/branches/${branchId}/reviews`, {
      rating,
      comment,
      serviceName,
    });
  },
};
