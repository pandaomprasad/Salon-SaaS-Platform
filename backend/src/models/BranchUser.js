const mongoose = require("mongoose");

const branchUserSchema = new mongoose.Schema({

  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  branch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch"
  },

  role_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role"
  },

  status: {
    type: String,
    default: "active"
  },

  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  joined_at: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("BranchUser", branchUserSchema);