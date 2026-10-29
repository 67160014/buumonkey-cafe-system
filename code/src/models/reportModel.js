const pool = require("../config/db");

function buildSalesFilter({ branchId, startDate, endDate }) {
  const conditions = ["o.payment_method IN ('cash', 'qr')"];
  const params = [];

  if (branchId) {
    conditions.push("o.branch_id = ?");
    params.push(branchId);
  }
  if (startDate) {
    conditions.push("o.order_date >= ?");
    params.push(`${startDate} 00:00:00`);
  }
  if (endDate) {
    conditions.push("o.order_date < DATE_ADD(?, INTERVAL 1 DAY)");
    params.push(`${endDate} 00:00:00`);
  }

  return {
    clause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}

async function getSalesSummary(filters) {
  const { clause, params } = buildSalesFilter(filters);
  const [rows] = await pool.query(
    `SELECT
       COUNT(DISTINCT o.order_id) AS order_count,
       COALESCE(SUM(oi.quantity), 0) AS item_quantity,
       COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total_sales
     FROM orders o
     JOIN order_item oi ON 
          oi.order_id = o.order_id
     ${clause}`,
    params,
  );

  const [items] = await pool.query(
    `SELECT
       o.branch_id,
       oi.menu_id,
       mi.name AS menu_name,
       SUM(oi.quantity) AS quantity_sold,
       SUM(oi.quantity * oi.unit_price) AS sales_amount,
       COUNT(DISTINCT o.order_id) AS order_count
     FROM orders o
     JOIN order_item oi ON 
          oi.order_id = o.order_id
     JOIN menu_item mi ON mi.menu_id = oi.menu_id
     ${clause}
     GROUP BY o.branch_id, 
              oi.menu_id, mi.name
     ORDER BY sales_amount DESC, quantity_sold DESC, mi.name ASC`,
    params,
  );

  return {
    summary: rows[0],
    items,
  };
}

module.exports = { getSalesSummary };
