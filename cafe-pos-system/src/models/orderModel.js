const pool = require("../config/db");
const { cupSizes, sweetnessLevels, toppings } = require("../config/orderCustomizations");

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

async function createWithItems({
  branchId,
  cashierId,
  paymentMethod,
  orderDate,
  items,
}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const menuIds = [...new Set(items.map((item) => item.menuId))];
    const [menuRows] = await connection.query(
      `SELECT menu_id, name, price, stock_quantity
       FROM menu_item
       WHERE menu_id IN (?) AND branch_id = ?
       FOR UPDATE`,
      [menuIds, branchId],
    );
    const menuMap = new Map(menuRows.map((row) => [row.menu_id, row]));
    const quantityByMenuId = new Map();

    for (const item of items) {
      quantityByMenuId.set(
        item.menuId,
        (quantityByMenuId.get(item.menuId) || 0) + item.quantity,
      );
    }

    for (const [menuId, quantity] of quantityByMenuId) {
      const menu = menuMap.get(menuId);
      if (!menu) {
        const error = new Error(`ไม่พบเมนู id ${menuId} ในสาขานี้`);
        error.statusCode = 400;
        throw error;
      }
      if (menu.stock_quantity < quantity) {
        const error = new Error(`สต็อกไม่เพียงพอสำหรับเมนู ${menu.name}`);
        error.statusCode = 400;
        throw error;
      }
    }

    const pricedItems = items.map((item) => {
      const menu = menuMap.get(item.menuId);
      const cupSize = cupSizes.find((option) => option.id === item.cupSize);
      const sweetness = sweetnessLevels.find((option) => option.value === item.sweetnessLevel);
      const selectedToppings = item.toppingIds.map((id) => toppings.find((topping) => topping.id === id));
      const basePriceCents = Math.round(Number(menu.price) * 100);
      const extrasCents = Math.round(cupSize.extraPrice * 100)
        + selectedToppings.reduce((sum, topping) => sum + Math.round(topping.price * 100), 0);
      const customizations = {
        basePrice: basePriceCents / 100,
        cupSize: { id: cupSize.id, label: cupSize.label, extraPrice: cupSize.extraPrice },
        sweetness: { value: sweetness.value, label: sweetness.label, percent: sweetness.percent },
        toppings: selectedToppings.map(({ id, name, price }) => ({ id, name, price })),
      };
      return {
        ...item,
        unitPrice: (basePriceCents + extrasCents) / 100,
        customizations,
      };
    });
    const totalAmount = pricedItems.reduce(
      (totalCents, item) => totalCents + Math.round(item.unitPrice * 100) * item.quantity,
      0,
    ) / 100;

    const [orderResult] = await connection.query(
      `INSERT INTO orders
       (branch_id, cashier_id, order_date, payment_method)
       VALUES (?, ?, ?, ?)`,
      [branchId, cashierId, orderDate, paymentMethod],
    );
    const orderId = orderResult.insertId;

    for (const item of pricedItems) {
      await connection.query(
        `INSERT INTO order_item
         (order_id, menu_id, quantity, unit_price, customizations)
         VALUES (?, ?, ?, ?, ?)`,
        [
          orderId,
          item.menuId,
          item.quantity,
          item.unitPrice,
          JSON.stringify(item.customizations),
        ],
      );

      const [stockResult] = await connection.query(
        `UPDATE menu_item
         SET stock_quantity = stock_quantity - ?
         WHERE menu_id = ? AND branch_id = ? AND stock_quantity >= ?`,
        [item.quantity, item.menuId, branchId, item.quantity],
      );
      if (stockResult.affectedRows === 0) {
        throw new Error(`ไม่สามารถตัด stock เมนู ${item.menuId} ได้`);
      }
    }

    await connection.commit();

    const lowStockMenuIds = [...quantityByMenuId]
      .filter(([menuId, quantity]) => (
        menuMap.get(menuId).stock_quantity - quantity < 10
      ))
      .map(([menuId]) => menuId);

    return { orderId, totalAmount, lowStockMenuIds };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function findItems(orderId) {
  const [rows] = await pool.query(
    `SELECT oi.order_item_id, oi.order_id, oi.menu_id,
            oi.quantity, oi.unit_price,
            (oi.quantity * oi.unit_price) AS subtotal
     FROM order_item oi
     WHERE oi.order_id = ?
     ORDER BY oi.order_item_id`,
    [orderId],
  );
  return rows;
}

async function findReceipt(orderId) {
  const [rows] = await pool.query(
    `SELECT o.order_id, o.branch_id, o.cashier_id, o.order_date,
            o.payment_method, b.name AS branch_name, c.name AS cashier_name,
            oi.order_item_id, oi.menu_id,
            mi.name AS menu_name, oi.quantity, oi.unit_price, oi.customizations,
            (oi.quantity * oi.unit_price) AS subtotal
     FROM orders o
     JOIN order_item oi ON oi.order_id = o.order_id
     JOIN menu_item mi ON mi.menu_id = oi.menu_id
     JOIN branch b ON b.branch_id = o.branch_id
     JOIN cashier c ON c.cashier_id = o.cashier_id
     WHERE o.order_id = ?
     ORDER BY oi.order_item_id`,
    [orderId],
  );

  if (rows.length === 0) {
    return null;
  }

  const receipt = {
    orderId: rows[0].order_id,
    branchId: rows[0].branch_id,
    branchName: rows[0].branch_name,
    cashierId: rows[0].cashier_id,
    cashierName: rows[0].cashier_name,
    orderDate: rows[0].order_date,
    paymentMethod: rows[0].payment_method,
    items: rows.map((row) => ({
      orderItemId: row.order_item_id,
      menuId: row.menu_id,
      menuName: row.menu_name,
      quantity: row.quantity,
      unitPrice: row.unit_price,
      subtotal: row.subtotal,
      customizations: typeof row.customizations === "string"
        ? JSON.parse(row.customizations)
        : row.customizations,
    })),
  };
  receipt.totalAmount = receipt.items.reduce(
    (total, item) => total + Number(item.subtotal),
    0,
  );
  return receipt;
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

module.exports = {
  create,
  addItem,
  createWithItems,
  findItems,
  findReceipt,
  findAll,
};
