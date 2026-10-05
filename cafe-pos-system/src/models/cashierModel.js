const pool = require("../config/db");

async function findById(cashierId) {
  const [rows] = await pool.query(
    `SELECT cashier_id, branch_id, name
     FROM cashier
     WHERE cashier_id = ?`,
    [cashierId],
  );

  return rows[0] || null;
}

async function findAll() {
  const [rows] = await pool.query(
    `SELECT cashier_id, name
     FROM cashier
     ORDER BY cashier_id`,
  );

  return rows;
}

async function create({ cashierId, name }) {
  await pool.query(
    `INSERT INTO cashier (cashier_id, name)
     VALUES (?, ?)`,
    [cashierId, name],
  );

  return findById(cashierId);
}

module.exports = { findById, findAll, create };
