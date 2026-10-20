# ZOVIA — Style. Shop. Simplified.

ZOVIA is a full-stack e-commerce website designed to provide a smooth and elegant online shopping experience. Customers can explore products, manage their wishlist and cart, place orders, and track their purchases. The platform also includes dedicated seller and admin dashboards for managing products and store operations.

## ✨ Features

### 🛍️ Customer
- Browse and search products by category.
- View product details and prices.
- Add products to the cart and wishlist.
- Register and log in to an account.
- Place orders and view order history.
- Track order status.
- View product reviews and offers.

### 🏪 Seller
- Seller registration and login.
- Add, view, and manage products.
- Set product prices, stock, images, and descriptions.
- Manage seller product listings.

### 🛡️ Admin
- Dedicated admin login and dashboard.
- Manage products, sellers, and customers.
- View store information and orders.
- Support centralized store management.

## 🧰 Tech Stack

**Frontend**
- React.js
- Vite
- JavaScript
- HTML5
- CSS3
- React Router

**Backend**
- Node.js
- Express.js
- REST API

**Database**
- MongoDB
- Mongoose

## 📁 Project Structure

```text
ZOVIA/
├── backend/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── context/
│   │   ├── data/
│   │   └── pages/
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## ⚙️ Installation and Setup

### Prerequisites
- Node.js and npm
- MongoDB Atlas account or a local MongoDB instance
- Git

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd ZOVIA
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your repository's actual URL.

### 2. Configure the Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder and configure the environment variables required by your backend, such as your MongoDB connection string and JWT secret.

**Never upload `.env` or share your credentials publicly.**

### 3. Start the Backend

```bash
npm run dev
```

If your backend does not have a `dev` script, use the start command configured in `backend/package.json`.

### 4. Configure and Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite, usually `http://localhost:5173`.

## 🔐 Security

- Keep environment variables and credentials private.
- Store secrets in environment variables.
- Use appropriate authentication and authorization for customer, seller, and admin routes.
- Never commit passwords, API keys, database URIs, or tokens.

## 🚀 Deployment

ZOVIA can be deployed using:
- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

Configure production environment variables and the deployed backend API URL before launching the website.

## 🎯 Project Goal

To build a modern, responsive, and user-friendly e-commerce platform with separate customer, seller, and administrator experiences.

---

**ZOVIA — Style. Shop. Simplified.**

*Built with React, Node.js, Express, and MongoDB.*
