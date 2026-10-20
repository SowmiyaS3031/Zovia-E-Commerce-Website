
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomInt } = require("crypto");
const User = require("../models/User");

const router = express.Router();

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
      ...(user.role === "seller" ? { sellerId: user.sellerId } : {}),
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function safeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    ...(user.role === "seller" ? { sellerId: user.sellerId } : {}),
  };
}

async function generateSellerId() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const sellerId = `ZOVIA-SLR-${randomInt(1000, 10000)}`;

    if (!(await User.exists({ sellerId }))) {
      return sellerId;
    }
  }

  throw new Error("Could not generate seller ID");
}

// CUSTOMER REGISTRATION
router.post("/customer/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !validEmail(email.trim()) ||
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 72
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid name and email. Password must be 8–72 characters.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Authentication is not configured",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
      role: "customer",
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token: createToken(user),
      user: safeUser(user),
    });
  } catch (error) {
    console.error("Customer registration error:", error.message);

    return res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message:
        error.code === 11000
          ? "An account with this email already exists"
          : "Customer registration failed",
    });
  }
});

// SELLER REGISTRATION
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      shopName,
      phone,
      shopAddress,
      businessCategory,
    } = req.body || {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !validEmail(email.trim()) ||
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 72 ||
      typeof shopName !== "string" ||
      !shopName.trim() ||
      typeof phone !== "string" ||
      !/^\d{10}$/.test(phone.trim()) ||
      typeof shopAddress !== "string" ||
      !shopAddress.trim() ||
      typeof businessCategory !== "string" ||
      !businessCategory.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid shop, owner, contact and account details.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Authentication is not configured",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const sellerId = await generateSellerId();

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
      role: "seller",
      sellerId,
      shopName: shopName.trim(),
      phone: phone.trim(),
      shopAddress: shopAddress.trim(),
      businessCategory: businessCategory.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Seller account created successfully",
      seller: {
        ...safeUser(user),
        shopName: user.shopName,
        phone: user.phone,
        shopAddress: user.shopAddress,
        businessCategory: user.businessCategory,
      },
    });
  } catch (error) {
    console.error("Seller registration error:", error.message);

    return res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message:
        error.code === 11000
          ? "An account with this email or seller ID already exists"
          : "Seller registration failed. Check the server logs.",
    });
  }
});

// CUSTOMER LOGIN — customers and sellers
router.post("/customer/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Authentication is not configured",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      role: { $in: ["customer", "seller"] },
    }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: createToken(user),
      expiresIn: "7d",
      user: safeUser(user),
    });
  } catch (error) {
    console.error("Customer login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Customer login failed",
    });
  }
});

// SELLER LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Authentication is not configured",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      role: "seller",
    }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid seller email or password",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: createToken(user),
      expiresIn: "7d",
      seller: safeUser(user),
    });
  } catch (error) {
    console.error("Seller login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Seller login failed",
    });
  }
});

module.exports = router;
