// src/config/socket.js
const { Server } = require("socket.io");
const logger = require("../utils/logger");
const { verifyAccessToken } = require("../utils/token");
const Branch = require("../models/branch.model");

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH", "PUT"],
    },
  });

  // ================================
  // Handshake authentication — every connection must carry a valid
  // access token (sent as { auth: { token } } from the client).
  // Users without a valid token are disconnected immediately.
  // ================================
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Authentication required"));
      }
      const decoded = verifyAccessToken(token);
      if (!decoded?.userId) {
        return next(new Error("Invalid token"));
      }
      socket.data.userId = decoded.userId;
      socket.data.role = decoded.role;
      socket.data.salonId = decoded.salonId || null;
      socket.data.branchId = decoded.branchId || null;
      logger.info(`Socket authenticated: user ${decoded.userId} [${decoded.role}]`);
      next();
    } catch (err) {
      logger.warn(`Socket auth rejected: ${err.message}`);
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const { userId, role, salonId, branchId } = socket.data;

    // ================================
    // Room joins — strictly validated so users can only join rooms
    // they actually belong to.
    // ================================

    // personal customer room — only the token owner
    socket.on("join_customer", (targetUserId) => {
      if (String(targetUserId) === String(userId)) {
        socket.join(`customer_${userId}`);
      } else {
        logger.warn(`Socket ${socket.id} blocked join_customer for ${targetUserId}`);
      }
    });

    // personal user room (salon panel) — only the token owner
    socket.on("join_user", (targetUserId) => {
      if (String(targetUserId) === String(userId)) {
        socket.join(`user_${userId}`);
      } else {
        logger.warn(`Socket ${socket.id} blocked join_user for ${targetUserId}`);
      }
    });

    // branch room — managers/staff join their own branch; owners join
    // branches of their salon (verified against the DB once at join time)
    socket.on("join_branch", async (branchToJoin) => {
      try {
        if (!branchToJoin) return;

        const isOwnBranch =
          branchId && String(branchToJoin) === String(branchId);

        if (isOwnBranch) {
          socket.join(`branch_${branchId}`);
          return;
        }

        // owner (or any salon-scoped role) may join branches of their salon
        if (salonId) {
          const branch = await Branch.findOne({
            _id: branchToJoin,
            salonId,
            isActive: { $ne: false },
          }).select("_id").lean();

          if (branch) {
            socket.join(`branch_${branchToJoin}`);
            return;
          }
        }

        logger.warn(`Socket ${socket.id} blocked join_branch for ${branchToJoin}`);
      } catch (err) {
        logger.warn(`join_branch error: ${err.message}`);
      }
    });

    // salon room — only users belonging to that salon
    socket.on("join_salon", (salonToJoin) => {
      if (
        salonId &&
        String(salonToJoin) === String(salonId)
      ) {
        socket.join(`salon_${salonId}`);
      } else {
        logger.warn(`Socket ${socket.id} blocked join_salon for ${salonToJoin}`);
      }
    });

    socket.on("disconnect", () => {});
  });

  return io;
}

function getIO() {
  if (!io) {
    logger.warn("Socket.io requested before initialization");
    return null;
  }
  return io;
}

module.exports = { initSocket, getIO };