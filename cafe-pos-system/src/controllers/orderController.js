const orderModel = require("../models/orderModel");
const cashierModel = require("../models/cashierModel");
const menuItemModel = require("../models/menuItemModel");

const VALID_PAYMENT_METHODS = ["cash", "credit", "qr"];

exports.createOrder = async (req, res) => {
  const {
    items,
    paymentMethod,
    cashierId,
    branchId,
    orderDate = new Date(),
  } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "ต้องมีรายการสินค้าอย่างน้อย 1 รายการ" });
  }

  if (
    typeof branchId !== "string" ||
    branchId.trim() === "" ||
    typeof cashierId !== "string" ||
    cashierId.trim() === "" ||
    !VALID_PAYMENT_METHODS.includes(paymentMethod)
  ) {
    return res.status(400).json({
      error: "ต้องระบุ branchId, cashierId และ paymentMethod ที่ถูกต้อง",
    });
  }

  if (items.some((item) => (
    !item ||
    typeof item.menuId !== "string" ||
    item.menuId.trim() === "" ||
    !Number.isInteger(item.quantity) ||
    item.quantity <= 0
  ))) {
    return res.status(400).json({
      error: "ทุกสินค้าต้องมี menuId และ quantity เป็นจำนวนเต็มมากกว่า 0",
    });
  }

  try {
    const quantityByMenuId = new Map();
    for (const item of items) {
      quantityByMenuId.set(
        item.menuId.trim(),
        (quantityByMenuId.get(item.menuId.trim()) || 0) + item.quantity,
      );
    }

    const menuRows = await menuItemModel.findManyForStockCheck(
      [...quantityByMenuId.keys()],
      branchId.trim(),
    );
    const menuMap = new Map(menuRows.map((row) => [row.menu_id, row]));

    for (const [menuId, totalQuantity] of quantityByMenuId) {
      const menu = menuMap.get(menuId);
      if (!menu) {
        return res.status(400).json({ error: `ไม่พบเมนู id ${menuId} ในสาขานี้` });
      }
      if (menu.stock_quantity < totalQuantity) {
        return res.status(400).json({
          error: `สต็อกไม่เพียงพอสำหรับเมนู id ${menuId}`,
        });
      }
    }

    const orderId = await orderModel.create(
      branchId.trim(),
      cashierId.trim(),
      paymentMethod,
      orderDate,
    );

    for (const item of items) {
      const menu = menuMap.get(item.menuId.trim());
      await orderModel.addItem(orderId, item.menuId.trim(), item.quantity, menu.price);
      await menuItemModel.deductStock(item.menuId.trim(), item.quantity, branchId.trim());
    }

    const lowStockMenuIds = [...quantityByMenuId].filter(([menuId, quantity]) => (
      menuMap.get(menuId).stock_quantity - quantity < 10
    )).map(([menuId]) => menuId);

    return res.status(201).json({ orderId, lowStockMenuIds });
  } catch (error) {
    console.error("createOrder error:", error);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในการบันทึกออเดอร์" });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    return res.json(await orderModel.findAll());
  } catch (error) {
    console.error("getAllOrders error:", error);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงออเดอร์" });
  }
};
