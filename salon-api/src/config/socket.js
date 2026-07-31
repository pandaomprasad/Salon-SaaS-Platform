// src/config/socket.js
const { Server } = require("socket.io");
const logger = require("../utils/logger");

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH", "PUT"],
    },
  });

  io.on("connection", (socket) => {
    // Join room for specific customer
    socket.on("join_customer", (userId) => {
      if (userId) {
        socket.join(`customer_${userId}`);
      }
    });

    // Join room for specific salon/branch (for salon panel)
    socket.on("join_branch", (branchId) => {
      if (branchId) {
        socket.join(`branch_${branchId}`);
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
