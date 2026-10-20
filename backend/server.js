
const authRoutes = require("./routes/authRoutes");
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const productRoutes = require("./routes/productRoutes");
const app = express();
const orderRoutes = require("./routes/orderRoutes");
app.use(helmet());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "20kb" }));
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to ZOVIA Backend API",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "ZOVIA backend is running!",
  });
});

app.get("/api/db-health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;

  res.status(connected ? 200 : 503).json({
    success: connected,
    database: connected ? "MongoDB connected" : "MongoDB not connected",
  });
});

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("ZOVIA MongoDB connected successfully!");

    const PORT = process.env.PORT || 5000;
    app.use("/api/products", productRoutes);
    app.use("/api/orders", orderRoutes);

    app.listen(PORT, () => {
      console.log(`ZOVIA backend running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Backend startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
