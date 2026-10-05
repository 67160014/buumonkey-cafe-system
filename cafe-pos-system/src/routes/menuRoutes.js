const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menuController");

router.get("/item", menuController.getMenuItem);
router.post("/item", menuController.createMenuItem);
router.put("/item/:menuId", menuController.updateMenuItem);
router.delete("/item/:menuId", menuController.deleteMenuItem);
router.get("/:branchId", menuController.listMenu);

module.exports = router;