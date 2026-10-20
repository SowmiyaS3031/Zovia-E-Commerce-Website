const products = [
  {
  id: 1,
  name: "Classical Oversized T-Shirt",
  category: "fashion",
  price: 1299,
  rating: 4.8,
  collection: "new",
  image:
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85",
},
  {
    id: 2,
    name: "Premium Cotton Dress",
    category: "fashion",
    price: 2199,
    rating: 4.8,
    collection: "bestsellers",
    image:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 3,
    name: "Minimal Casual Top",
    category: "fashion",
    price: 999,
    rating: 4.5,
    collection: "everyday",
    image:
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=800&q=85",
  },
  {
  id: 4,
  name: "Elegant Summer Dress",
  category: "fashion",
  price: 1899,
  rating: 4.6,
  collection: "new",
  image:
    "https://www.rihoas.com/cdn/shop/articles/women_s-woven-polyester-midi-dresses-dresses-59irdb_471655ce-21e9-4d06-8ca6-597125787338.jpg?v=1782982384&width=1400",
},

  {
    id: 5,
    name: "Matte Nude Lipstick",
    category: "makeup",
    price: 699,
    rating: 4.8,
    collection: "bestsellers",
    image:
      "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 6,
    name: "Glow Foundation",
    category: "makeup",
    price: 1299,
    rating: 4.7,
    collection: "new",
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 7,
    name: "Luxury Makeup Set",
    category: "makeup",
    price: 2499,
    rating: 4.9,
    collection: "bestsellers",
    image:
      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 8,
    name: "Soft Blush Palette",
    category: "makeup",
    price: 899,
    rating: 4.6,
    collection: "everyday",
    image:
      "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=800&q=85",
  },

  {
    id: 9,
    name: "Hydrating Face Serum",
    category: "skincare",
    price: 1199,
    rating: 4.8,
    collection: "bestsellers",
    image:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 10,
    name: "Daily Moisturizer",
    category: "skincare",
    price: 899,
    rating: 4.6,
    collection: "everyday",
    image:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 11,
    name: "Vitamin C Face Cream",
    category: "skincare",
    price: 1399,
    rating: 4.7,
    collection: "new",
    image:
      "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 12,
    name: "Gentle Cleansing Foam",
    category: "skincare",
    price: 749,
    rating: 4.5,
    collection: "everyday",
    image:
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=800&q=85",
  },

  {
    id: 13,
    name: "Classic White Sneakers",
    category: "shoes",
    price: 2299,
    rating: 4.8,
    collection: "bestsellers",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 14,
    name: "Minimal Running Shoes",
    category: "shoes",
    price: 2799,
    rating: 4.7,
    collection: "new",
    image:
      "https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 15,
    name: "Classic Leather Boots",
    category: "shoes",
    price: 3299,
    rating: 4.7,
    collection: "new",
    image:
      "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 16,
    name: "Elegant Heels",
    category: "shoes",
    price: 2499,
    rating: 4.6,
    collection: "bestsellers",
    image:
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=85",
  },

  {
    id: 17,
    name: "Classic Shoulder Bag",
    category: "bags",
    price: 1999,
    rating: 4.8,
    collection: "bestsellers",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 18,
    name: "Premium Tote Bag",
    category: "bags",
    price: 2299,
    rating: 4.7,
    collection: "new",
    image:
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 19,
    name: "Mini Crossbody Bag",
    category: "bags",
    price: 1499,
    rating: 4.6,
    collection: "everyday",
    image:
      "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 20,
    name: "Elegant Evening Bag",
    category: "bags",
    price: 1799,
    rating: 4.5,
    collection: "new",
    image:
      "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=800&q=85",
  },

  {
    id: 21,
    name: "Minimal Gold Necklace",
    category: "jewellery",
    price: 1599,
    rating: 4.8,
    collection: "new",
    image:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 22,
    name: "Pearl Earrings",
    category: "jewellery",
    price: 899,
    rating: 4.7,
    collection: "bestsellers",
    image:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 23,
    name: "Elegant Bracelet",
    category: "jewellery",
    price: 1099,
    rating: 4.6,
    collection: "everyday",
    image:
      "https://images.unsplash.com/photo-1619119069152-a2b331eb392a?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 24,
    name: "Classic Gold Ring",
    category: "jewellery",
    price: 1299,
    rating: 4.8,
    collection: "bestsellers",
    image:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=85",
  },

  {
    id: 25,
    name: "Classic Silver Watch",
    category: "watches",
    price: 2999,
    rating: 4.7,
    collection: "bestsellers",
    image:
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 26,
    name: "Luxury Black Watch",
    category: "watches",
    price: 3999,
    rating: 4.9,
    collection: "new",
    image:
      
  "https://images.unsplash.com/photo-1749831754129-3a84b9fdeb87?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 27,
    name: "Minimal Leather Watch",
    category: "watches",
    price: 2499,
    rating: 4.6,
    collection: "everyday",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=85",
  },

  {
    id: 28,
    name: "Rose Bloom Perfume",
    category: "perfumes",
    price: 1899,
    rating: 4.8,
    collection: "bestsellers",
    image:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 29,
    name: "Luxury Oud Perfume",
    category: "perfumes",
    price: 2499,
    rating: 4.9,
    collection: "new",
    image:
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 30,
    name: "Fresh Citrus Perfume",
    category: "perfumes",
    price: 1599,
    rating: 4.6,
    collection: "everyday",
    image:
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=85",
  },
];

export default products;