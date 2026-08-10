// src/services/socketClient.js
import { io } from "socket.io-client/dist/socket.io.js";
import { API_BASE_URL, getAuthToken } from "./apiClient";

// Derive base WebSocket URL from API_BASE_URL (e.g. http://localhost:6969)
const SOCKET_URL = API_BASE_URL.replace("/api/v1", "");

let socket = null;

export const socketClient = {
  connect: (userId) => {
    if (socket && socket.connected) {
      if (userId) socket.emit("join_customer", userId);
      return socket;
    }

    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      auth: {
        token: getAuthToken() || "",
      },
      extraHeaders: {
        "bypass-tunnel-reminder": "true",
        "ngrok-skip-browser-warning": "true",
      },
    });

    socket.on("connect", () => {
      if (userId) {
        socket.emit("join_customer", userId);
      }
    });

    socket.on("disconnect", () => {});

    return socket;
  },

  onAppointmentStatusChanged: (callback) => {
    if (!socket) return () => {};
    socket.on("appointment_status_changed", callback);
    return () => {
      if (socket) socket.off("appointment_status_changed", callback);
    };
  },

  onAppointmentUpdated: (callback) => {
    if (!socket) return () => {};
    socket.on("appointment_updated", callback);
    return () => {
      if (socket) socket.off("appointment_updated", callback);
    };
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },
};
