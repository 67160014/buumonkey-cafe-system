const pool = require("../config/db");

async function findById(orderId) {
  const [rows] = await pool.query(
    `SELECT order_id, cashier_id, order_date, payment_method
     FROM orders
     WHERE order_id = ?`,
    [orderId],
  );

  return rows[0] || null;
}

async function findItems(orderId) {
  const [rows] = await pool.query(
    `SELECT oi.order_item_id, oi.order_id, oi.menu_id,
            mi.name AS menu_name, oi.quantity, oi.unit_price,
            (oi.quantity * oi.unit_price) AS subtotal
     FROM order_item oi
     JOIN menu_item mi ON mi.menu_id = oi.menu_id
     WHERE oi.order_id = ?
     ORDER BY oi.order_item_id`,
    [orderId],
  );

  return rows;
}

async function getTotal(orderId) {
  const [rows] = await pool.query(
    `SELECT COALESCE(SUM(quantity * unit_price), 0) AS total
     FROM order_item
     WHERE order_id = ?`,
    [orderId],
  );

  return Number(rows[0].total);
}

async function findWithItems(orderId) {
  const order = await findById(orderId);
  if (!order) return null;

  return {
    ...order,
    items: await findItems(orderId),
    totalAmount: await getTotal(orderId),
  };
}

async function findAll() {
  const [rows] = await pool.query(
    `SELECT o.order_id, o.cashier_id, o.order_date, o.payment_method,
            COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total_amount
     FROM orders o
     LEFT JOIN order_item oi ON oi.order_id = o.order_id
     GROUP BY o.order_id, o.cashier_id, o.order_date, o.payment_method
     ORDER BY o.order_date DESC, o.order_id DESC`,
  );

  return rows;
}

async function create({ cashierId, orderDate, paymentMethod, items }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [orderResult] = await connection.query(
      `INSERT INTO orders
       (cashier_id, order_date, payment_method)
       VALUES (?, ?, ?)`,
      [cashierId, orderDate, paymentMethod],
    );
    const orderId = orderResult.insertId;

    for (const item of items) {
      const [menuRows] = await connection.query(
        "SELECT price FROM menu_item WHERE menu_id = ?",
        [item.menuId],
      );

      if (menuRows.length === 0) {
        throw new Error(`Menu item ${item.menuId} not found`);
      }

      await connection.query(
        `INSERT INTO order_item (order_id, menu_id, quantity, unit_price)
         VALUES (?, ?, ?, ?)`,
        [orderId, item.menuId, item.quantity, menuRows[0].price],
      );
    }

    await connection.commit();
    return findWithItems(orderId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  findById,
  findAll,
  findItems,
  getTotal,
  findWithItems,
  create,
};
