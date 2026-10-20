const mongoose = require("mongoose");
const path = require("path");
const { pathToFileURL } = require("url");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const Product = require("../models/Product");

async function migrateProducts() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI missing in backend/.env");
    }

    // Read the existing 30 products from the frontend data file.
    const productsFile = path.resolve(
      __dirname,
      "../../frontend/src/data/products.js"
    );

    const importedModule = await import(
      pathToFileURL(productsFile).href
    );

    const products = importedModule.default;

    if (!Array.isArray(products) || products.length === 0) {
      throw new Error("No products found in frontend products.js");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected.");
    console.log(`Found ${products.length} static products.`);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of products) {
      const filter = {
        name: item.name.trim(),
        category: item.category.trim(),
        sellerId: { $in: ["", null] },
      };

      const existingProduct = await Product.findOne(filter);

      if (existingProduct) {
        // Refresh static product details without changing stock or seller data.
        existingProduct.price = Number(item.price);
        existingProduct.image = item.image || "";
        existingProduct.rating = Number(item.rating || 0);
        existingProduct.collection = item.collection || "everyday";

        await existingProduct.save();

        updated++;
        console.log(`Updated: ${item.name}`);
      } else {
        // Do not overwrite or claim a seller-owned product.
        const sameNameAndCategory = await Product.findOne({
          name: item.name.trim(),
          category: item.category.trim(),
        });

        if (sameNameAndCategory) {
          skipped++;
          console.log(`Skipped existing product: ${item.name}`);
          continue;
        }

        await Product.create({
          name: item.name.trim(),
          category: item.category.trim(),
          price: Number(item.price),
          image: item.image || "",
          description: "",
          stock: 0,
          rating: Number(item.rating || 0),
          collection: item.collection || "everyday",
          sellerId: "",
        });

        inserted++;
        console.log(`Inserted: ${item.name}`);
      }
    }

    console.log("\n--- ZOVIA Migration Summary ---");
    console.log(`New products inserted: ${inserted}`);
    console.log(`Existing products updated: ${updated}`);
    console.log(`Products skipped: ${skipped}`);
    console.log("Migration completed.");
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

migrateProducts();