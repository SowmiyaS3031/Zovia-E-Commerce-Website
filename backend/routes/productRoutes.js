
const Order = require("../models/Order");
const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const {
  authenticateToken,
  allowRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

// GET all products for the public shop
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    const deliveredOrders = await Order.find({
      status: "Delivered",
    }).select("items");

    const salesCounts = new Map();

    for (const order of deliveredOrders) {
      for (const item of order.items) {
        const productId = String(item.productId);

        salesCounts.set(
          productId,
          (salesCounts.get(productId) || 0) + item.quantity
        );
      }
    }

    const now = Date.now();

    const productsWithBadges = products.map((product) => {
      const productId = product._id.toString();
      const ageInDays =
        (now - new Date(product.createdAt).getTime()) /
        (1000 * 60 * 60 * 24);

      const deliveredQuantity = salesCounts.get(productId) || 0;

      return {
        ...product.toObject(),
        isNew: ageInDays >= 0 && ageInDays <= 30,
        isBestSeller: deliveredQuantity >= 20,
        isPopular: false,
        deliveredQuantity,
      };
    });

    res.status(200).json({
      success: true,
      count: productsWithBadges.length,
      products: productsWithBadges,
    });
  } catch (error) {
    console.error("Fetch products error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
});

// GET products belonging to the logged-in seller
router.get(
  "/mine",
  authenticateToken,
  allowRoles("seller"),
  async (req, res) => {
    try {
      const products = await Product.find({
        sellerId: req.user.sellerId,
      }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        count: products.length,
        products,
      });
    } catch (error) {
      console.error("Fetch seller products error:", error.message);

      res.status(500).json({
        success: false,
        message: "Failed to fetch your products",
      });
    }
  }
);

// ADD STOCK - sellers can update only their own products
router.patch(
  "/:id/stock",
  authenticateToken,
  allowRoles("seller"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const quantity = req.body?.quantity;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID",
        });
      }

      if (
        !Number.isSafeInteger(quantity) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be a positive whole number",
        });
      }

      // Atomic increment prevents overwriting concurrent stock changes.
      const product = await Product.findOneAndUpdate(
        {
          _id: id,
          sellerId: req.user.sellerId,
        },
        {
          $inc: { stock: quantity },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found in your shop",
        });
      }

      res.status(200).json({
        success: true,
        message: "Stock added successfully",
        product,
      });
    } catch (error) {
      console.error("Add stock error:", error.message);

      res.status(500).json({
        success: false,
        message: "Failed to add stock",
      });
    }
  }
);

// GET one product for product details
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Fetch product error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
});

// CREATE product - sellers only
router.post(
  "/",
  authenticateToken,
  allowRoles("seller"),
  async (req, res) => {
    try {
      const { name, category, price, image, description, stock } = req.body;

      if (
        typeof name !== "string" ||
        !name.trim() ||
        typeof category !== "string" ||
        !category.trim() ||
        price === undefined ||
        price === "" ||
        !Number.isFinite(Number(price)) ||
        Number(price) <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Valid name, category and price are required",
        });
      }

      if (
        stock === undefined ||
        !Number.isInteger(Number(stock)) ||
        Number(stock) < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Stock must be a non-negative integer",
        });
      }

      const product = await Product.create({
        name: name.trim(),
        category: category.trim(),
        price: Number(price),
        image: typeof image === "string" ? image.trim() : "",
        description:
          typeof description === "string" ? description.trim() : "",
        stock: Number(stock),
        sellerId: req.user.sellerId,
      });

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        product,
      });
    } catch (error) {
      console.error("Create product error:", error.message);

      res.status(500).json({
        success: false,
        message: "Failed to create product",
      });
    }
  }
);

// DELETE a product owned by the logged-in seller
router.delete(
  "/:id",
  authenticateToken,
  allowRoles("seller"),
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID",
        });
      }

      const product = await Product.findOneAndDelete({
        _id: req.params.id,
        sellerId: req.user.sellerId,
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found in your shop",
        });
      }

      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error) {
      console.error("Delete product error:", error.message);

      res.status(500).json({
        success: false,
        message: "Failed to delete product",
      });
    }
  }
);

module.exports = router;
