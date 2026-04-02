const { AsyncLocalStorage } = require('async_hooks')

// ================================
// TenantContext
// ================================
// AsyncLocalStorage works like a request-scoped global
// whatever you store in it is available anywhere
// in the same async call chain — no need to pass req around
//
// think of it like a thread-local variable
// each request gets its own isolated storage

const tenantStorage = new AsyncLocalStorage()

// --------------------------------
// setTenantContext
// --------------------------------
// called in authenticate middleware
// stores the current user's scope for this request

const setTenantContext = (context, callback) => {
  tenantStorage.run(context, callback)
}

// --------------------------------
// getTenantContext
// --------------------------------
// called in mongoose plugin
// returns { userId, role, salonId, branchId }

const getTenantContext = () => {
  return tenantStorage.getStore()
}

module.exports = { setTenantContext, getTenantContext }