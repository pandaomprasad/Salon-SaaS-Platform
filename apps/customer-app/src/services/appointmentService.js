// src/services/appointmentService.js
import { apiClient } from "./apiClient";

export const appointmentService = {
  bookAppointment: async ({ slotId, serviceId, customerNotes }) => {
    return await apiClient.post("/appointments", {
      slotId,
      serviceId,
      customerNotes,
    });
  },

  getAppointments: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/appointments${query ? `?${query}` : ""}`;
    return await apiClient.get(endpoint);
  },

  getAppointmentById: async (id) => {
    return await apiClient.get(`/appointments/${id}`);
  },

  cancelAppointment: async (id, reason) => {
    return await apiClient.patch(`/appointments/${id}/status`, {
      status: "CANCELLED",
      reason,
    });
  },

  rescheduleAppointment: async (id, newSlotId) => {
    return await apiClient.patch(`/appointments/${id}/reschedule`, {
      newSlotId,
      slotId: newSlotId,
    });
  },

  rateAppointment: async (id, score, review) => {
    return await apiClient.post(`/appointments/${id}/review`, {
      score,
      review,
    });
  },

  submitReview: async (id, score, review) => {
    return await apiClient.post(`/appointments/${id}/review`, {
      score,
      review,
    });
  },
};
