const router = require("express").Router({ mergeParams: true });

const {
  createStaff,
  getStaff,
  getStaffMember,
  updateStaff,
  deleteStaff,
  updateStaffPermissions,
  getStaffPermissions,
} = require("../controllers/staff.controller");

const {
  createLeave,
  getStaffLeaves,
  getLeave,
  updateLeave,
  deleteLeave,
  approveLeave,
  rejectLeave,
} = require("../controllers/leave.controller");

const authenticate = require("../middleware/authenticate");
const checkPermission = require("../middleware/checkPermission");
const validate = require("../middleware/validate");
const {
  createStaffValidator,
  updateStaffValidator,
} = require("../validators/staff.validator");
const {
  createLeaveValidator,
  updateLeaveValidator,
  approveLeaveValidator,
  rejectLeaveValidator,
} = require("../validators/leave.validator");

router.use(authenticate);

router.post(
  "/",
  checkPermission("staff:create"),
  createStaffValidator,
  validate,
  createStaff,
);

router.get("/", checkPermission("staff:read"), getStaff);

router.get("/:staffId", checkPermission("staff:read"), getStaffMember);

router.patch(
  "/:staffId",
  checkPermission("staff:update"),
  updateStaffValidator,
  validate,
  updateStaff,
);

router.delete("/:staffId", checkPermission("staff:delete"), deleteStaff);

// permission management — owner only
router.get("/:staffId/permissions", getStaffPermissions);

router.patch("/:staffId/permissions", updateStaffPermissions);

// ================================
// Staff leave / availability
// ================================
router.post(
  "/:staffId/leaves",
  checkPermission("staff:update"),
  createLeaveValidator,
  validate,
  createLeave,
);

router.get("/:staffId/leaves", checkPermission("staff:read"), getStaffLeaves);

router.get("/:staffId/leaves/:leaveId", checkPermission("staff:read"), getLeave);

router.patch(
  "/:staffId/leaves/:leaveId",
  checkPermission("staff:update"),
  updateLeaveValidator,
  validate,
  updateLeave,
);

router.delete(
  "/:staffId/leaves/:leaveId",
  checkPermission("staff:update"),
  deleteLeave,
);

// approval workflow — owner/manager reviews a staff self-service request
router.post(
  "/:staffId/leaves/:leaveId/approve",
  checkPermission("staff:update"),
  approveLeaveValidator,
  validate,
  approveLeave,
);

router.post(
  "/:staffId/leaves/:leaveId/reject",
  checkPermission("staff:update"),
  rejectLeaveValidator,
  validate,
  rejectLeave,
);

module.exports = router;
