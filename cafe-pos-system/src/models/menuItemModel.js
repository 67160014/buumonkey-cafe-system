const pool = require("../config/db");

async function findById(menuId, branchId) {
  const [rows] = await pool.query(
    `SELECT menu_id, branch_id, name, price, stock_quantity
     FROM menu_item
     WHERE menu_id = ? AND branch_id = ?`,
    [menuId, branchId],
  );

  return rows[0] || null;
}

async function findManyForStockCheck(menuIds, branchId) {
  if (menuIds.length === 0) return [];
  const [rows] = await pool.query(
    `SELECT menu_id, branch_id, name, price, stock_quantity
     FROM menu_item
     WHERE menu_id IN (?) AND branch_id = ?`,
    [menuIds, branchId],
  );

  return rows;
}

async function deductStock(menuId, quantity, branchId) {
  const [result] = await pool.query(
    `UPDATE menu_item
     SET stock_quantity = stock_quantity - ?
     WHERE menu_id = ? AND branch_id = ? AND stock_quantity >= ?`,
    [quantity, menuId, branchId, quantity],
  );
  if (result.affectedRows === 0) {
    throw new Error(`Insufficient stock for menu item ${menuId}`);
  }
}

exports.findAllByBranch = async (branchId) => {
  const [rows] = await pool.query(
    "SELECT * FROM menu_item WHERE branch_id = ?",
    [branchId],
  );
  return rows;
};

exports.findByIdAndBranch = async (menuId, branchId) => {
  const [rows] = await pool.query(
    `SELECT menu_id, branch_id, name, price, stock_quantity
     FROM menu_item
     WHERE menu_id = ? AND branch_id = ?`,
    [menuId, branchId],
  );
  return rows[0] || null;
};

exports.create = async (menuId, branchId, name, price, stockQuantity) => {
  await pool.query(
    `INSERT INTO menu_item (menu_id, branch_id, name, price, stock_quantity)
      VALUES (?, ?, ?, ?, ?)`,
    [menuId, branchId, name, price, stockQuantity],
  );
  return menuId;
};

exports.updateFields = async (menuId, branchId, { name, price, stockQuantity }) => {
  const [result] = await pool.query(
    `UPDATE menu_item
     SET name = COALESCE(?, name),
          price = COALESCE(?, price),
          stock_quantity = COALESCE(?, stock_quantity)
      WHERE menu_id = ? AND branch_id = ?`,
    [name, price, stockQuantity, menuId, branchId],
  );

  return result.affectedRows > 0;
};

exports.remove = async (menuId, branchId) => {
  const [result] = await pool.query(
    `DELETE FROM menu_item
      WHERE menu_id = ? AND branch_id = ?`,
    [menuId, branchId],
  );
  
  return result.affectedRows > 0;
};

module.exports = {
  findById,
  findManyForStockCheck,
  deductStock,
  findAllByBranch: exports.findAllByBranch,
  findByIdAndBranch: exports.findByIdAndBranch,
  create: exports.create,
  updateFields: exports.updateFields,
  remove: exports.remove,
};
