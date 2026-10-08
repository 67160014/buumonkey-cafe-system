const orderModel = require("../models/orderModel");

const VALID_PAYMENT_METHODS = ["cash", "qr"];

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
    const result = await orderModel.createWithItems({
      branchId: branchId.trim(),
      cashierId: cashierId.trim(),
      paymentMethod,
      orderDate,
      items: items.map((item) => ({ ...item, menuId: item.menuId.trim() })),
    });

    return res.status(201).json({
      orderId: result.orderId,
      totalAmount: result.totalAmount,
      lowStockMenuIds: result.lowStockMenuIds,
    });
  } catch (error) {
    console.error("createOrder error:", error);
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
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

exports.getReceipt = async (req, res) => {
  const orderId = Number(req.params.orderId);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ error: "orderId ต้องเป็นจำนวนเต็มบวก" });
  }

  try {
    const receipt = await orderModel.findReceipt(orderId);
    if (!receipt) {
      return res.status(404).json({ error: "ไม่พบออเดอร์สำหรับออกใบเสร็จ" });
    }
    return res.json(receipt);
  } catch (error) {
    console.error("getReceipt error:", error);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในการสร้างใบเสร็จ" });
  }
};
