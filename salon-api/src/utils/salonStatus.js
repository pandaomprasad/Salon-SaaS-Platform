/**
 * Utility helper to check if a salon branch is currently open.
 * Evaluates active status, admin deactivation flags, working hours, and current time (IST).
 */

function isBranchOpen(branch) {
  if (!branch) return true;
  if (branch.isActive === false || branch.deactivatedByAdmin === true) return false;

  const workingHours = branch.workingHours;
  if (!Array.isArray(workingHours) || workingHours.length === 0) return true;

  // Get current date and time in IST (India Standard Time)
  const now = new Date();
  const istDateString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const istDate = new Date(istDateString);

  const dayOfWeek = istDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

  const workingDay = workingHours.find((w) => w.day === dayOfWeek);
  if (!workingDay || workingDay.isOpen === false) {
    return false;
  }

  if (workingDay.openTime && workingDay.closeTime) {
    const currentMinutes = istDate.getHours() * 60 + istDate.getMinutes();
    const [openH, openM] = workingDay.openTime.split(':').map(Number);
    const [closeH, closeM] = workingDay.closeTime.split(':').map(Number);

    const openMinutes = openH * 60 + (openM || 0);
    const closeMinutes = closeH * 60 + (closeM || 0);

    if (currentMinutes < openMinutes || currentMinutes >= closeMinutes) {
      return false;
    }
  }

  return true;
}

module.exports = {
  isBranchOpen,
};
