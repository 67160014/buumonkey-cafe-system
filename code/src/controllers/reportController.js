const reportModel = require("../models/reportModel");

function isDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

exports.getSalesSummary = async (req, res) => {
  const { branchId, startDate, endDate } = req.query;

  if (
    (branchId !== undefined && (typeof branchId !== "string" || !branchId.trim()))
    || (startDate !== undefined && (typeof startDate !== "string" || !isDate(startDate)))
    || (endDate !== undefined && (typeof endDate !== "string" || !isDate(endDate)))
  ) {
    return res.status(400).json({
      error: "branchId, startDate และ endDate ต้องอยู่ในรูปแบบที่ถูกต้อง",
    });
  }

  if (startDate && endDate && startDate > endDate) {
    return res.status(400).json({
      error: "startDate ต้องไม่มากกว่า endDate",
    });
  }

  try {
    const result = await reportModel.getSalesSummary({
      branchId: branchId?.trim(),
      startDate,
      endDate,
    });
    return res.json({
      filters: {
        branchId: branchId?.trim() || null,
        startDate: startDate || null,
        endDate: endDate || null,
      },
      ...result,
    });
  } catch (error) {
    console.error("getSalesSummary error:", error);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในการสร้างรายงานยอดขาย" });
  }
};