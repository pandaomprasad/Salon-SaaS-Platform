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
const { requireBranchScope } = require("../middleware/checkScope");
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

/**
 * @openapi
 * /branches/{branchId}/staff:
 *   post:
 *     summary: Onboard a new staff member to a branch
 *     tags: [Staff Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Staff member created
 *   get:
 *     summary: List staff specialists for a branch
 *     tags: [Staff Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of staff members
 */
router.post(
  "/",
  checkPermission("staff:create"),
  requireBranchScope,
  createStaffValidator,
  validate,
  createStaff,
);

router.get("/", checkPermission("staff:read"), requireBranchScope, getStaff);

router.get("/:staffId", checkPermission("staff:read"), requireBranchScope, getStaffMember);

router.patch(
  "/:staffId",
  checkPermission("staff:update"),
  requireBranchScope,
  updateStaffValidator,
  validate,
  updateStaff,
);

router.delete("/:staffId", checkPermission("staff:delete"), requireBranchScope, deleteStaff);

router.get("/:staffId/permissions", checkPermission("staff:read"), requireBranchScope, getStaffPermissions);
router.patch("/:staffId/permissions", checkPermission("staff:update"), requireBranchScope, updateStaffPermissions);

router.post(
  "/:staffId/leaves",
  checkPermission("staff:update"),
  requireBranchScope,
  createLeaveValidator,
  validate,
  createLeave,
);

router.get("/:staffId/leaves", checkPermission("staff:read"), requireBranchScope, getStaffLeaves);
router.get("/:staffId/leaves/:leaveId", checkPermission("staff:read"), requireBranchScope, getLeave);

router.patch(
  "/:staffId/leaves/:leaveId",
  checkPermission("staff:update"),
  requireBranchScope,
  updateLeaveValidator,
  validate,
  updateLeave,
);

router.delete(
  "/:staffId/leaves/:leaveId",
  checkPermission("staff:update"),
  requireBranchScope,
  deleteLeave,
);

router.post(
  "/:staffId/leaves/:leaveId/approve",
  checkPermission("staff:update"),
  requireBranchScope,
  approveLeaveValidator,
  validate,
  approveLeave,
);

router.post(
  "/:staffId/leaves/:leaveId/reject",
  checkPermission("staff:update"),
  requireBranchScope,
  rejectLeaveValidator,
  validate,
  rejectLeave,
);

module.exports = router;
