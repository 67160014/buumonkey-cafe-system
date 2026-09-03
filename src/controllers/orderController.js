const orderModel = require("../models/orderModel");
const { Order } = require("../models/Order");

const VALID_PAYMENT_METHODS = ["cash", "credit", "qr"];

exports.createOrder = async (req, res) => {
  try {
    const { items, paymentMethod } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: "ต้องมีรายการสินค้าอย่างน้อย 1 รายการ" });
    }

    const hasInvalidItem = items.some((item) => {
      if (!item || typeof item !== "object") {
        return true;
      }

      return typeof item.name !== "string" || item.name.trim() === "";
    });

    if (hasInvalidItem) {
      return res.status(400).json({
        error: "ต้องระบุชื่อสินค้าให้ครบทุกรายการ",
      });
    }

    const hasInvalidPrice = items.some(
      (item) => !Number.isFinite(item.price) || item.price <= 0,
    );

    if (hasInvalidPrice) {
      return res.status(400).json({ error: "price ต้องมากกว่า 0" });
    }

    const hasInvalidQuantity = items.some(
      (item) => !Number.isInteger(item.quantity) || item.quantity <= 0,
    );

    if (hasInvalidQuantity) {
      return res.status(400).json({ error: "quantity ต้องมากกว่า 0" });
    }

    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return res
        .status(400)
        .json({ error: "paymentMethod ไม่ถูกต้องหรือไม่ได้ระบุ" });
    }

    const order = new Order(paymentMethod);
    items.forEach((item) => order.addItem(item, item.quantity));
    if (!order.submit()) {
      return res.status(400).json({ error: "ต้องมีรายการสินค้าอย่างน้อย 1 รายการ" });
    }

    const totalAmount = order.calculateTotal();

    const orderId = await orderModel.create(paymentMethod, totalAmount);

    res.status(201).json({
      orderId,
      totalAmount,
      paymentMethod,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await orderModel.findAll();
    return res.json(orders);
  } catch (err) {
    console.error("getAllOrders error:", err && err.stack ? err.stack : err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงออเดอร์" });
  }
};
