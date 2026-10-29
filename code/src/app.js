const express = require("express");
const app = express();

app.use(express.json());
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api/")) {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }
  next();
});
app.use(express.static("public"));

const orderRoutes = require("./routes/orderRoutes");
const menuRoutes = require("./routes/menuRoutes");
const reportRoutes = require("./routes/reportRoutes");
const branchRoutes = require("./routes/branchRoutes");

app.use("/api/orders", orderRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/branches", branchRoutes);

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Cafe POS server running on port ${PORT}`);
  });
}

module.exports = app;
