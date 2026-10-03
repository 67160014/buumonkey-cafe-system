const orderModel = require("../models/orderModel");
const cashierModel = require("../models/cashierModel");
const menuItemModel = require("../models/menuItemModel");

const VALID_PAYMENT_METHODS = ["cash", "credit", "qr"];

exports.createOrder = async (req, res) => {
  try {
    const {
      cashierId,
      orderDate = new Date(),
      items,
      paymentMethod,
    } = req.body;

    if (typeof cashierId !== "string" || cashierId.trim() === "") {
      return res.status(400).json({ error: "ต้องระบุ cashierId" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "ต้องมีรายการสินค้าอย่างน้อย 1 รายการ" });
    }

    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ error: "paymentMethod ไม่ถูกต้องหรือไม่ได้ระบุ" });
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

    if (!await cashierModel.findById(cashierId)) {
      return res.status(400).json({ error: `ไม่พบ cashierId: ${cashierId}` });
    }

    for (const item of items) {
      if (!await menuItemModel.findById(item.menuId)) {
        return res.status(400).json({ error: `ไม่พบ menuId: ${item.menuId}` });
      }
    }

    const order = await orderModel.create({
      cashierId: cashierId.trim(),
      orderDate,
      paymentMethod,
      items,
    });

    return res.status(201).json({
      orderId: order.order_id,
      totalAmount: order.totalAmount,
      paymentMethod: order.payment_method,
      items: order.items,
    });
  } catch (error) {
    console.error("createOrder error:", error);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในการบันทึกออเดอร์" });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await orderModel.findAll();
    return res.json(orders);
  } catch (error) {
    console.error("getAllOrders error:", error);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงออเดอร์" });
  }
};
