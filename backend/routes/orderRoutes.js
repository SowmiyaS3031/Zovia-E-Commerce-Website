
const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const {
  authenticateToken,
  allowRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

const ALLOWED_STATUSES = [
  "Confirmed",
  "Packed",
  "Shipped",
  "Dispatched",
  "Out for Delivery",
  "Delivered",
];

const CANCELLABLE_STATUSES = [
  "Order Placed",
  "Confirmed",
  "Packed",
];

const isValidObjectId = (id) => mongoose.isValidObjectId(id);

// CUSTOMER: CREATE ORDER AND REDUCE STOCK
router.post(
  "/",
  authenticateToken,
  allowRoles("customer"),
  async (req, res) => {
    const session = await mongoose.startSession();

    try {
      const { items, address, paymentMethod } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Order must contain at least one product",
        });
      }

      if (!address || typeof address !== "object" || Array.isArray(address)) {
        return res.status(400).json({
          success: false,
          message: "A valid delivery address is required",
        });
      }

      if (
        typeof paymentMethod !== "string" ||
        !paymentMethod.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Please select a payment method",
        });
      }

      const quantities = new Map();

      for (const item of items) {
        const productId = String(
          item?.productId || item?.id || item?._id || ""
        );
        const quantity = Number(item?.quantity ?? 1);

        if (
          !isValidObjectId(productId) ||
          !Number.isSafeInteger(quantity) ||
          quantity < 1
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid product ID or quantity",
          });
        }

        const combined = (quantities.get(productId) || 0) + quantity;

        if (!Number.isSafeInteger(combined)) {
          return res.status(400).json({
            success: false,
            message: "Product quantity is too large",
          });
        }

        quantities.set(productId, combined);
      }

      const normalizedItems = [];
      let total = 0;

      for (const [productId, quantity] of quantities) {
        const product = await Product.findById(productId).lean();

        if (!product) {
          return res.status(404).json({
            success: false,
            message: "One or more products could not be found",
          });
        }

        const price = Number(product.price);
        const stock = Number(product.stock);

        if (!Number.isFinite(price) || price < 0) {
          return res.status(400).json({
            success: false,
            message: `Invalid price for ${product.name}`,
          });
        }

        if (!Number.isInteger(stock) || stock < quantity) {
          return res.status(409).json({
            success: false,
            message: `Insufficient stock for ${product.name}. Available: ${Number.isInteger(stock) ? stock : 0}`,
          });
        }

     normalizedItems.push({
  productId: String(product._id),
  name: product.name,
  price,
  quantity,
  image: product.image || "",
  category: product.category || "",
  sellerId: product.sellerId || "",
});   total += price * quantity;
      }

      if (!Number.isFinite(total)) {
        return res.status(400).json({
          success: false,
          message: "Order total is invalid",
        });
      }

      let createdOrder;

      await session.withTransaction(async () => {
        // Recheck and decrement stock atomically within the transaction.
        for (const item of normalizedItems) {
          const updatedProduct = await Product.findOneAndUpdate(
            {
              _id: item.productId,
              stock: { $gte: item.quantity },
            },
            {
              $inc: { stock: -item.quantity },
            },
            {
              new: true,
              runValidators: true,
              session,
            }
          );

          if (!updatedProduct) {
            const error = new Error("INSUFFICIENT_STOCK");
            error.productName = item.name;
            throw error;
          }
        }

        const created = await Order.create(
          [
            {
              customerId: req.user.userId,
              items: normalizedItems,
              total,
              address,
              paymentMethod: paymentMethod.trim(),
              status: "Order Placed",
            },
          ],
          { session }
        );

        createdOrder = created[0];
      });

      return res.status(201).json({
        success: true,
        message: "Order created successfully",
        order: createdOrder,
      });
    } catch (error) {
      if (error.message === "INSUFFICIENT_STOCK") {
        return res.status(409).json({
          success: false,
          message: `${error.productName || "A product"} is out of stock. Refresh the shop and try again.`,
        });
      }

      console.error("Create order error:", error);

      return res.status(500).json({
        success: false,
        message:
          "Failed to create the order. Please try again.",
      });
    } finally {
      await session.endSession();
    }
  }
);

// CUSTOMER: VIEW ONLY THEIR OWN ORDERS
router.get(
  "/mine",
  authenticateToken,
  allowRoles("customer"),
  async (req, res) => {
    try {
      const orders = await Order.find({
        customerId: req.user.userId,
      }).sort({ createdAt: -1 });

      return res.json({
        success: true,
        count: orders.length,
        orders,
      });
    } catch (error) {
      console.error("Fetch customer orders error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch your orders",
      });
    }
  }
);

// CUSTOMER: CANCEL THEIR OWN ORDER AND RESTORE STOCK
router.patch(
  "/:id/cancel",
  authenticateToken,
  allowRoles("customer"),
  async (req, res) => {
    const session = await mongoose.startSession();

    try {
      if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID",
        });
      }

      let cancelledOrder;

      await session.withTransaction(async () => {
        const order = await Order.findOne({
          _id: req.params.id,
          customerId: req.user.userId,
        }).session(session);

        if (!order) {
          const error = new Error("ORDER_NOT_FOUND");
          throw error;
        }

        if (!CANCELLABLE_STATUSES.includes(order.status)) {
          const error = new Error("ORDER_CANNOT_BE_CANCELLED");
          throw error;
        }

        // Restore stock and cancel the order in the same transaction.
        for (const item of order.items) {
          const restored = await Product.updateOne(
            { _id: item.productId },
            { $inc: { stock: item.quantity } },
            { session }
          );

          if (restored.matchedCount !== 1) {
            throw new Error("PRODUCT_NOT_FOUND");
          }
        }

        order.status = "Cancelled";
        await order.save({ session });

        cancelledOrder = order;
      });

      return res.json({
        success: true,
        message: "Order cancelled and stock restored",
        order: cancelledOrder,
      });
    } catch (error) {
      if (error.message === "ORDER_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      if (error.message === "ORDER_CANNOT_BE_CANCELLED") {
        return res.status(400).json({
          success: false,
          message: "This order can no longer be cancelled",
        });
      }

      console.error("Cancel order error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to cancel order. Please try again.",
      });
    } finally {
      await session.endSession();
    }
  }
);

// SELLER: VIEW ORDERS CONTAINING THEIR PRODUCTS
router.get(
  "/seller/mine",
  authenticateToken,
  allowRoles("seller"),
  async (req, res) => {
    try {
      const sellerId = req.user.sellerId;

      if (!sellerId) {
        return res.status(403).json({
          success: false,
          message: "Seller ID is missing from your login token",
        });
      }

      const orders = await Order.find({
        "items.sellerId": sellerId,
      }).sort({ createdAt: -1 });

      const sellerOrders = orders.map((order) => {
        const sellerItems = order.items.filter(
          (item) => item.sellerId === sellerId
        );

        return {
          ...order.toObject(),
          items: sellerItems,
          sellerTotal: sellerItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          ),
        };
      });

      return res.json({
        success: true,
        count: sellerOrders.length,
        orders: sellerOrders,
      });
    } catch (error) {
      console.error("Fetch seller orders error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch seller orders",
      });
    }
  }
);

// SELLER: UPDATE ORDER STATUS
router.patch(
  "/:id/status",
  authenticateToken,
  allowRoles("seller"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const sellerId = req.user.sellerId;

      if (!sellerId) {
        return res.status(403).json({
          success: false,
          message: "Seller ID is missing from your login token",
        });
      }

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID",
        });
      }

      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order status",
        });
      }

      const order = await Order.findOne({
        _id: id,
        "items.sellerId": sellerId,
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found for your products",
        });
      }

      // This app stores one status for the entire order.
      // Do not allow one seller to update another seller's items.
      const belongsOnlyToThisSeller = order.items.every(
        (item) => item.sellerId === sellerId
      );

      if (!belongsOnlyToThisSeller) {
        return res.status(400).json({
          success: false,
          message:
            "This order contains products from multiple sellers. Separate seller fulfillment is required.",
        });
      }

      if (
        ["Delivered", "Cancelled"].includes(order.status)
      ) {
        return res.status(400).json({
          success: false,
          message: "This order can no longer be updated",
        });
      }

      const nextIndex = ALLOWED_STATUSES.indexOf(status);
      const currentIndex = ALLOWED_STATUSES.indexOf(order.status);

      // Prevent skipping backwards through the fulfillment stages.
      if (
        currentIndex >= 0 &&
        nextIndex !== currentIndex + 1 &&
        nextIndex !== currentIndex
      ) {
        return res.status(400).json({
          success: false,
          message: "Please update the order through the next tracking stage",
        });
      }

      order.status = status;
      await order.save();

      return res.json({
        success: true,
        message: "Order status updated",
        order,
      });
    } catch (error) {
      console.error("Update order status error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to update order status",
      });
    }
  }
);

module.exports = router;
