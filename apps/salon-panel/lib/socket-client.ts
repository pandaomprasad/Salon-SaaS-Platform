import { io, Socket } from "socket.io-client";
import { tokenStorage } from "./api-client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:6969/api/v1";
const SOCKET_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

let socket: Socket | null = null;
let currentBranchId: string | null = null;
let currentSalonId: string | null = null;
let currentUserId: string | null = null;

export const socketClient = {
  connect: (params?: {
    branchId?: string | null;
    salonId?: string | null;
  }) => {
    if (params?.branchId !== undefined) currentBranchId = params.branchId;
    if (params?.salonId !== undefined) currentSalonId = params.salonId;

    const token = tokenStorage.getAccessToken() || "";

    if (socket) {
      socket.auth = { token };
    }

    if (socket && socket.connected) {
      if (currentBranchId) socket.emit("join_branch", currentBranchId);
      if (currentSalonId) socket.emit("join_salon", currentSalonId);
      if (currentUserId) socket.emit("join_user", currentUserId);
      return socket;
    }

    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        auth: (cb) => {
          cb({ token: tokenStorage.getAccessToken() || "" });
        },
        extraHeaders: {
          "bypass-tunnel-reminder": "true",
          "ngrok-skip-browser-warning": "true",
        },
      });

      socket.on("connect", () => {
        console.log("⚡ [SOCKET] Connected to backend websocket server");
        if (currentBranchId) socket?.emit("join_branch", currentBranchId);
        if (currentSalonId) socket?.emit("join_salon", currentSalonId);
        if (currentUserId) socket?.emit("join_user", currentUserId);
      });

      socket.on("disconnect", (reason) => {
        console.log("⚡ [SOCKET] Disconnected:", reason);
      });

      socket.on("connect_error", (err) => {
        console.log("⚡ [SOCKET] Connection error:", err.message);
      });
    } else if (!socket.connected) {
      socket.connect();
    }

    return socket;
  },

  setUserId: (userId: string | null) => {
    currentUserId = userId;
    if (userId && socket?.connected) {
      socket.emit("join_user", userId);
    }
  },

  isConnected: (): boolean => {
    return !!(socket && socket.connected);
  },

  onConnect: (callback: () => void) => {
    if (!socket) return () => {};
    if (socket.connected) {
      callback();
    }
    socket.on("connect", callback);
    return () => {
      if (socket) socket.off("connect", callback);
    };
  },

  onDisconnect: (callback: (reason: string) => void) => {
    if (!socket) return () => {};
    if (!socket.connected) {
      callback("already_disconnected");
    }
    socket.on("disconnect", callback);
    return () => {
      if (socket) socket.off("disconnect", callback);
    };
  },


  onNotificationNew: (callback: (data: { type: string; title: string; body: string; data?: unknown }) => void) => {
    if (!socket) return () => {};
    socket.on("notification:new", callback);
    return () => {
      if (socket) socket.off("notification:new", callback);
    };
  },

  onAppointmentCreated: (callback: (data: any) => void) => {
    if (!socket) return () => {};
    socket.on("appointment_created", callback);
    return () => {
      if (socket) socket.off("appointment_created", callback);
    };
  },

  onAppointmentUpdated: (callback: (data: any) => void) => {
    if (!socket) return () => {};
    socket.on("appointment_updated", callback);
    return () => {
      if (socket) socket.off("appointment_updated", callback);
    };
  },

  onAppointmentStatusChanged: (callback: (data: any) => void) => {
    if (!socket) return () => {};
    socket.on("appointment_status_changed", callback);
    return () => {
      if (socket) socket.off("appointment_status_changed", callback);
    };
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },
};
