const { getTenantContext } = require('./tenantContext')

// ================================
// tenantPlugin
// ================================
// mongoose plugin that automatically injects
// salonId/branchId into queries based on current user
//
// applied to models that are tenant-scoped:
//   Branch, Service, Slot, Appointment, User (staff/manager)
//
// NOT applied to:
//   Salon    → owner checks are done explicitly
//   Role     → global, not tenant scoped
//   Permission → global, not tenant scoped

const tenantPlugin = (schema, options = {}) => {
  // which field to scope by
  // default is salonId — can override per model
  const scopeField = options.scopeField || 'salonId'
  const skipRoles = options.skipRoles || ['owner']

  // --------------------------------
  // pre find hooks
  // inject scope into every find query
  // --------------------------------

  const injectScope = function () {
    const context = getTenantContext()

    // no context means this query is running outside
    // of a request (e.g. seeder, cron job) — skip injection
    if (!context) return

    const { role, salonId, branchId } = context

    // skip for roles that don't need scoping
    // owner queries are already scoped in controllers
    if (skipRoles.includes(role)) return

    // skip if already has this field in query
    // prevents double-injecting
    if (this.getQuery()[scopeField]) return

    // inject the scope
    if (scopeField === 'salonId' && salonId) {
      this.where({ salonId })
    } else if (scopeField === 'branchId' && branchId) {
      this.where({ branchId })
    }
  }

  // apply to all find variants
  schema.pre('find', injectScope)
  schema.pre('findOne', injectScope)
  schema.pre('findOneAndUpdate', injectScope)
  schema.pre('countDocuments', injectScope)
  schema.pre('aggregate', function () {
    const context = getTenantContext()
    if (!context) return

    const { role, salonId } = context
    if (skipRoles.includes(role)) return
    if (!salonId) return

    // inject $match at the start of the pipeline
    this.pipeline().unshift({
      $match: { salonId: salonId }
    })
  })
}

module.exports = tenantPlugin