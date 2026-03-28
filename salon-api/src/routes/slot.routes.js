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

router.use(authenticate);

router.post("/generate", checkPermission("slot:create"), generateSlots);

router.get("/", checkPermission("slot:read"), getSlots);
router.post("/block-check", checkPermission("slot:update"), blockCheck);

router.post("/block-bulk", checkPermission("slot:update"), blockBulk);

router.post("/unblock-bulk", checkPermission("slot:update"), unblockBulk);

router.patch("/:slotId/block", checkPermission("slot:update"), blockSlot);

router.patch("/:slotId/unblock", checkPermission("slot:update"), unblockSlot);

module.exports = router;
