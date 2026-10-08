const menuItemModel = require("../models/menuItemModel");

function isNonNegativeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

exports.listMenu = async (req, res) => {
  const { branchId } = req.params;
  if (!branchId.trim()) {
    return res.status(400).json({ error: "ต้องระบุ branchId" });
  }

  try {
    return res.json(await menuItemModel.findAllByBranch(branchId));
  } catch (error) {
    console.error("listMenu error:", error);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงรายการเมนู" });
  }
};

exports.getMenuItem = async (req, res) => {
  const { branchId, menuId } = req.query;
  if (!branchId || !menuId) {
    return res.status(400).json({ error: "ต้องระบุ branchId และ menuId" });
  }

  try {
    const menuItem = await menuItemModel.findByIdAndBranch(menuId, branchId);
    if (!menuItem) {
      return res.status(404).json({ error: `ไม่พบเมนู id ${menuId} ในสาขานี้` });
    }
    return res.json(menuItem);
  } catch (error) {
    console.error("getMenuItem error:", error);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลเมนู" });
  }
};

exports.createMenuItem = async (req, res) => {
  const { menuId, branchId, name, price, stockQuantity } = req.body;
  if (
    typeof menuId !== "string" ||
    !menuId.trim() ||
    typeof branchId !== "string" ||
    !branchId.trim() ||
    typeof name !== "string" ||
    !name.trim() ||
    !isNonNegativeNumber(price) ||
    !Number.isInteger(stockQuantity) ||
    stockQuantity < 0
  ) {
    return res.status(400).json({
      error: "ต้องระบุ menuId, branchId, name, price และ stockQuantity ให้ถูกต้อง",
    });
  }

  try {
    const menuItem = await menuItemModel.create(
      menuId.trim(),
      branchId.trim(),
      name.trim(),
      price,
      stockQuantity,
    );
    return res.status(201).json({ menuId: menuItem });
  } catch (error) {
    console.error("createMenuItem error:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: `รหัสเมนู ${menuId.trim()} มีอยู่แล้ว` });
    }
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ error: `ไม่พบสาขา ${branchId.trim()}` });
    }
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในการสร้างเมนู" });
  }
};

exports.updateMenuItem = async (req, res) => {
  const { branchId, name, price, stockQuantity } = req.body;
  if (typeof branchId !== "string" || !branchId.trim()) {
    return res.status(400).json({ error: "ต้องระบุ branchId" });
  }
  if (
    name === undefined &&
    price === undefined &&
    stockQuantity === undefined
  ) {
    return res.status(400).json({ error: "ต้องระบุข้อมูลที่ต้องการแก้ไขอย่างน้อย 1 รายการ" });
  }
  if (name !== undefined && (typeof name !== "string" || !name.trim())) {
    return res.status(400).json({ error: "name ต้องเป็นข้อความที่ไม่ว่าง" });
  }
  if (price !== undefined && !isNonNegativeNumber(price)) {
    return res.status(400).json({ error: "price ต้องเป็นตัวเลขที่ไม่ติดลบ" });
  }
  if (
    stockQuantity !== undefined &&
    (!Number.isInteger(stockQuantity) || stockQuantity < 0)
  ) {
    return res.status(400).json({ error: "stockQuantity ต้องเป็นจำนวนเต็มที่ไม่ติดลบ" });
  }

  try {
    const updated = await menuItemModel.updateFields(
      req.params.menuId,
      branchId.trim(),
      { name: name?.trim(), price, stockQuantity },
    );
    if (!updated) {
      return res.status(404).json({
        error: `ไม่พบเมนู id ${req.params.menuId} ในสาขานี้`,
      });
    }
    return res.json({ updated: true });
  } catch (error) {
    console.error("updateMenuItem error:", error);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในการแก้ไขเมนู" });
  }
};

exports.deleteMenuItem = async (req, res) => {
  const { branchId } = req.query;
  if (typeof branchId !== "string" || !branchId.trim()) {
    return res.status(400).json({ error: "ต้องระบุ branchId" });
  }

  try {
    const deleted = await menuItemModel.remove(
      req.params.menuId,
      branchId.trim(),
    );
    if (!deleted) {
      return res.status(404).json({
        error: `ไม่พบเมนู id ${req.params.menuId} ในสาขานี้`,
      });
    }
    return res.json({ deleted: true });
  } catch (error) {
    console.error("deleteMenuItem error:", error);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในการลบเมนู" });
  }
};
