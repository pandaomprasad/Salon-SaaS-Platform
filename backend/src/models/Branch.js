const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema({

  salon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon"
  },

  name: String,
  address: String,
  city: String,

  latitude: Number,
  longitude: Number,

  contact_number: String,

  status: {
    type: String,
    default: "active"
  }

}, { timestamps: { createdAt: "created_at" } });

module.exports = mongoose.model("Branch", branchSchema);