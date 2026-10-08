const express = require("express");
const pool = require("../config/db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT branch_id, name FROM branch ORDER BY branch_id",
    );
    return res.json(rows);
  } catch (error) {
    console.error("listBranches error:", error);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลสาขา" });
  }
});

router.get("/:branchId/cashiers", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT cashier_id, name FROM cashier WHERE branch_id = ? ORDER BY cashier_id",
      [req.params.branchId],
    );
    return res.json(rows);
  } catch (error) {
    console.error("listBranchCashiers error:", error);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน" });
  }
});

module.exports = router;
