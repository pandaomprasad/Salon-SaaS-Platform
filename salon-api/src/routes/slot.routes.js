const router = require("express").Router({ mergeParams: true });

const {
  generateSlots,
  getSlots,
  blockSlot,
  unblockSlot,
  blockCheck,
  blockBulk,
  unblockBulk,
} = require("../controllers/slot.controller");

const authenticate = require("../middleware/authenticate");
const checkPermission = require("../middleware/checkPermission");
const { requireBranchScope } = require("../middleware/checkScope");

router.use(authenticate);

router.post("/generate", checkPermission("slot:create"), requireBranchScope, generateSlots);

router.get("/", checkPermission("slot:read"), requireBranchScope, getSlots);
router.post("/block-check", checkPermission("slot:update"), requireBranchScope, blockCheck);

router.post("/block-bulk", checkPermission("slot:update"), requireBranchScope, blockBulk);

router.post("/unblock-bulk", checkPermission("slot:update"), requireBranchScope, unblockBulk);

router.patch("/:slotId/block", checkPermission("slot:update"), requireBranchScope, blockSlot);

router.patch("/:slotId/unblock", checkPermission("slot:update"), requireBranchScope, unblockSlot);

module.exports = router;
