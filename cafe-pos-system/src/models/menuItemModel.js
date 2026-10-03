const pool = require("../config/db");

async function findById(menuId) {
  const [rows] = await pool.query(
    `SELECT menu_id, name, price
     FROM menu_item
     WHERE menu_id = ?`,
    [menuId],
  );

  return rows[0] || null;
}

async function findAll() {
  const [rows] = await pool.query(
    `SELECT menu_id, name, price
     FROM menu_item
     ORDER BY menu_id`,
  );

  return rows;
}

async function create({ menuId, name, price }) {
  await pool.query(
    `INSERT INTO menu_item (menu_id, name, price)
     VALUES (?, ?, ?)`,
    [menuId, name, price],
  );

  return findById(menuId);
}

async function update(menuId, { name, price }) {
  await pool.query(
    `UPDATE menu_item
     SET name = ?, price = ?
     WHERE menu_id = ?`,
    [name, price, menuId],
  );

  return findById(menuId);
}

async function remove(menuId) {
  const [result] = await pool.query(
    `DELETE FROM menu_item
     WHERE menu_id = ?`,
    [menuId],
  );

  return result.affectedRows > 0;
}

module.exports = { findById, findAll, create, update, remove };
