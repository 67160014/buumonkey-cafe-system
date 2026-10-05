const pool = require("../config/db");

async function create(branchId, cashierId, paymentMethod, orderDate) {
  const [result] = await pool.query(
    `INSERT INTO orders
     (branch_id, cashier_id, order_date, payment_method)
     VALUES (?, ?, ?, ?)`,
    [branchId, cashierId, orderDate, paymentMethod],
  );
  return result.insertId;
}

async function addItem(orderId, menuId, quantity, unitPrice) {
  await pool.query(
    `INSERT INTO order_item (order_id, menu_id, quantity, unit_price)
     VALUES (?, ?, ?, ?)`,
    [orderId, menuId, quantity, unitPrice],
  );
}

async function findAll() {
  const [rows] = await pool.query(
    `SELECT o.order_id, o.branch_id, o.cashier_id, o.order_date,
            o.payment_method,
            COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total_amount
     FROM orders o
     LEFT JOIN order_item oi ON oi.order_id = o.order_id
     GROUP BY o.order_id, o.branch_id, o.cashier_id,
              o.order_date, o.payment_method
     ORDER BY o.order_date DESC, o.order_id DESC`,
  );
  
  return rows;
}

module.exports = { create, addItem, findAll };
