const mongoose = require('mongoose')

// A Role groups multiple permissions together
// e.g. "manager" role has ["staff:read", "appointment:update", ...]
// Roles are assigned to Users

const roleSchema = new mongoose.Schema(
  {
    // role name — must be one of our 4 types
    name: {
      type: String,
      required: [true, 'Role name is required'],
      enum: ['owner', 'manager', 'staff', 'customer'],
      unique: true,
      lowercase: true
    },

    // array of references to Permission documents
    // this is what gets cached in Redis per role
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission' // tells mongoose this is a reference to Permission model
      }
    ],

    description: {
      type: String,
      trim: true
    },

    // soft disable a role without deleting it
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Role', roleSchema)