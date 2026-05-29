const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");

const { prisma } = require("@inventory/database");

const authRoutes = require("./modules/auth/auth.route");
const categoryRoutes = require("./modules/category/category.route");
const productRoutes = require("./modules/product/product.route");
const stockRoutes = require("./modules/stock/stock.route");
const supplierRoutes = require("./modules/supplier/supplier.route");
const purchaseRoutes = require("./modules/purchase/purchase.route");
const saleRoutes = require("./modules/sale/sale.route");
const dashboardRoutes = require("./modules/dashboard/dashboard.route");
const auditLogRoutes = require("./modules/audit-log/audit-log.route");


const app = express();

app.use(
  cors({
    origin:
      "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(
  express.urlencoded({
    extended: true
  })
);

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "../uploads")
  )
);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Inventory API Running"
  });
});

app.get("/users", async (req, res) => {

  const users = await prisma.user.findMany();

  res.json(users);

});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/stocks", stockRoutes);
app.use("/api/v1/suppliers", supplierRoutes);
app.use("/api/v1/purchases", purchaseRoutes);
app.use("/api/v1/sales", saleRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/audit-logs", auditLogRoutes);

module.exports = app;