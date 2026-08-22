// salon-api/src/utils/emailValidation.js
const dns = require('dns').promises
const disposableDomains = require('disposable-email-domains')

const disposableSet = new Set(disposableDomains)

function isValidFormat(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function getDomain(email) {
  return email.split('@')[1]?.toLowerCase()
}

function isDisposableDomain(email) {
  return disposableSet.has(getDomain(email))
}

async function hasMxRecord(email) {
  try {
    const domain = getDomain(email)
    if (!domain) return false
    const records = await dns.resolveMx(domain)
    return records && records.length > 0
  } catch (err) {
    // If DNS query fails (e.g. offline dev environment), log and return true to prevent blocking local dev
    if (process.env.NODE_ENV === 'development' || process.env.SKIP_MX_CHECK === 'true') {
      return true
    }
    return false
  }
}

async function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, reason: 'Email address is required.' }
  }
  const cleanEmail = email.trim()
  if (!isValidFormat(cleanEmail)) {
    return { valid: false, reason: 'Invalid email format.' }
  }
  if (isDisposableDomain(cleanEmail)) {
    return { valid: false, reason: 'Disposable email addresses are not allowed.' }
  }
  const mxValid = await hasMxRecord(cleanEmail)
  if (!mxValid) {
    return { valid: false, reason: 'This email domain cannot receive mail.' }
  }
  return { valid: true }
}

module.exports = { validateEmail }
