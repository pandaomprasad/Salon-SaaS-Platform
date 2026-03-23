const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  phone: {
    type: String,
    unique: true
  },

  email: {
    type: String,
    unique: true
  },

  password_hash: {
    type: String,
    required: true
  },

  profile_image: String,

  status: {
    type: String,
    enum: ["active", "blocked"],
    default: "active"
  }

}, { timestamps: { createdAt: "created_at" } });

module.exports = mongoose.model("User", userSchema);