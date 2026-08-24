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
  createStaffValidator,
  validate,
  createStaff,
);

router.get("/", checkPermission("staff:read"), getStaff);

/**
 * @openapi
 * /branches/{branchId}/staff/{staffId}:
 *   get:
 *     summary: Get staff profile
 *     tags: [Staff Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff member profile
 *   patch:
 *     summary: Update staff member details
 *     tags: [Staff Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff member updated
 *   delete:
 *     summary: Soft delete staff member
 *     tags: [Staff Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff member deleted
 */
router.get("/:staffId", checkPermission("staff:read"), getStaffMember);

router.patch(
  "/:staffId",
  checkPermission("staff:update"),
  updateStaffValidator,
  validate,
  updateStaff,
);

router.delete("/:staffId", checkPermission("staff:delete"), deleteStaff);

/**
 * @openapi
 * /branches/{branchId}/staff/{staffId}/permissions:
 *   get:
 *     summary: Get permissions granted to staff member
 *     tags: [Staff Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff permission list
 *   patch:
 *     summary: Update staff permissions
 *     tags: [Staff Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions updated
 */
router.get("/:staffId/permissions", getStaffPermissions);
router.patch("/:staffId/permissions", updateStaffPermissions);

/**
 * @openapi
 * /branches/{branchId}/staff/{staffId}/leaves:
 *   post:
 *     summary: Submit staff leave request
 *     tags: [Staff Leaves]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Leave request submitted
 *   get:
 *     summary: Get staff leave history
 *     tags: [Staff Leaves]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of staff leaves
 */
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

/**
 * @openapi
 * /branches/{branchId}/staff/{staffId}/leaves/{leaveId}/approve:
 *   post:
 *     summary: Approve staff leave request
 *     tags: [Staff Leaves]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leave approved
 */
router.post(
  "/:staffId/leaves/:leaveId/approve",
  checkPermission("staff:update"),
  approveLeaveValidator,
  validate,
  approveLeave,
);

/**
 * @openapi
 * /branches/{branchId}/staff/{staffId}/leaves/{leaveId}/reject:
 *   post:
 *     summary: Reject staff leave request
 *     tags: [Staff Leaves]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leave rejected
 */
router.post(
  "/:staffId/leaves/:leaveId/reject",
  checkPermission("staff:update"),
  rejectLeaveValidator,
  validate,
  rejectLeave,
);

module.exports = router;
