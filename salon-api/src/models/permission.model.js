const mongoose = require('mongoose')

// A permission is a single action on a resource
// format: "resource:action"
// examples: "appointment:read", "staff:delete", "branch:update"

const permissionSchema = new mongoose.Schema(
  {
    // resource = what are we acting on
    // e.g. "appointment", "branch", "staff", "service", "slot", "report"
    resource: {
      type: String,
      required: [true, 'Resource is required'],
      trim: true,
      lowercase: true
    },

    // action = what can we do to it
    // e.g. "create", "read", "update", "delete"
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: ['create', 'read', 'update', 'delete'],
      lowercase: true
    },

    // human readable description for admin UI
    description: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true // adds createdAt and updatedAt automatically
  }
)

// compound index — resource + action must be unique together
// you can't have two "appointment:read" permissions
permissionSchema.index({ resource: 1, action: 1 }, { unique: true })

// virtual field — returns "resource:action" string
// e.g. permission.key => "appointment:read"
permissionSchema.virtual('key').get(function () {
  return `${this.resource}:${this.action}`
})

module.exports = mongoose.model('Permission', permissionSchema)