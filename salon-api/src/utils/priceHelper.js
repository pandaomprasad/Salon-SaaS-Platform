// ================================
// Price helper utilities
// ================================
// ALL prices in DB are stored in paise (smallest INR unit)
// 1 INR = 100 paise
//
// Examples:
//   ₹500   → store as 50000
//   ₹1500  → store as 150000
//   ₹99.50 → store as 9950
//
// Why paise?
//   Avoids floating point bugs
//   e.g. 0.1 + 0.2 = 0.30000000000000004 in JS
//   With integers: 10 + 20 = 30 — always exact

// paise to rupees display
// 50000 → "₹500.00"
const toRupees = (paise) => {
  if (paise === null || paise === undefined) return "₹0.00";
  return `₹${(paise / 100).toFixed(2)}`;
};

// paise to number
// 50000 → 500.00
const toRupeesNumber = (paise) => {
  if (paise === null || paise === undefined) return 0;
  return paise / 100;
};

// rupees to paise — for when frontend sends rupees
// 500 → 50000
const toPaise = (rupees) => {
  return Math.round(rupees * 100);
};

// validate price is in paise range
// returns true if valid
const isValidPaise = (value) => {
  return Number.isInteger(value) && value >= 100 && value <= 10000000;
};

// format price for API responses
// always include both raw paise and display string
const formatPrice = (paise, currency = "INR") => ({
  amount: paise,
  currency,
  display: toRupees(paise),
});

module.exports = {
  toRupees,
  toRupeesNumber,
  toPaise,
  isValidPaise,
  formatPrice,
};
