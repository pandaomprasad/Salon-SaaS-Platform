const mongoose = require("mongoose");

const salonSchema = new mongoose.Schema({

  name: String,

  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  description: String,
  city: String,

  status: {
    type: String,
    default: "active"
  }

}, { timestamps: { createdAt: "created_at" } });

module.exports = mongoose.model("Salon", salonSchema);