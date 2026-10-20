import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const categories = [
    {
      name: "Fashion",
      image:
        "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Makeup",
      image:
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Skincare",
      image:
        "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Shoes",
      image:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Bags",
      image:
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Jewellery",
      image:
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Watches",
      image:
        "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Perfumes",
      image:
        "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80",
    },
  ];

  const featuredProducts = [
    {
      id: 1,
      name: "Satin Evening Dress",
      category: "Fashion",
      price: 2499,
      rating: 4.8,
      image:
        "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 2,
      name: "Luxury Matte Lipstick",
      category: "Makeup",
      price: 799,
      rating: 4.9,
      image:
        "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 3,
      name: "Hydrating Face Serum",
      category: "Skincare",
      price: 1199,
      rating: 4.7,
      image:
        "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 4,
      name: "Classic White Sneakers",
      category: "Shoes",
      price: 2299,
      rating: 4.9,
      image:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 5,
      name: "Premium Shoulder Bag",
      category: "Bags",
      price: 1899,
      rating: 4.8,
      image:
        "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 6,
      name: "Minimal Gold Watch",
      category: "Watches",
      price: 2999,
      rating: 4.6,
      image:
        "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
    },
  ];

  const collections = [
    {
      number: "01",
      title: "New Arrivals",
      text: "Fresh styles that just landed.",
      image:
        "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80",
      action: () => navigate("/shop?collection=new"),
    },
    {
      number: "02",
      title: "Best Sellers",
      text: "The pieces everyone is loving.",
      image:
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
      action: () => navigate("/shop?collection=bestsellers"),
    },
    {
      number: "03",
      title: "Everyday Essentials",
      text: "Made for your everyday moments.",
      image:
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
      action: () => navigate("/shop?collection=everyday"),
    },
  ];

  const handleSubscribe = (event) => {
    event.preventDefault();

    if (!email.trim()) {
      alert("Please enter your email address.");
      return;
    }

    alert("Thank you for subscribing to ZOVIA!");
    setEmail("");
  };

  return (
    <div className="home-page">

      {/* NAVBAR */}

      <nav className="home-navbar">

        <div
          className="home-logo"
          onClick={() => navigate("/")}
        >
          ZOVIA
        </div>

        <div className="home-links">

          <span
            className="active-link"
            onClick={() => navigate("/home")}
          >
            Home
          </span>

          <span onClick={() => navigate("/shop")}>
            Shop
          </span>

          <span
            onClick={() =>
              navigate("/shop?collection=collections")
            }
          >
            Collections
          </span>

          <span
            onClick={() =>
              document
                .getElementById("categories")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            Categories
          </span>

        </div>

        <div className="home-actions">

          <button
            className="nav-icon"
            onClick={() => navigate("/shop")}
            aria-label="Search"
          >
            ⌕
          </button>

          <button
            className="nav-icon"
            onClick={() => navigate("/wishlist")}
            aria-label="Wishlist"
          >
            ♡
          </button>

          <button
            className="nav-icon cart-nav"
            onClick={() => navigate("/cart")}
            aria-label="Cart"
          >
            🛒
            <span className="nav-cart-count">0</span>
          </button>

        </div>

      </nav>


      {/* HERO */}

      <section className="hero-section">

        <div className="hero-content">

          <span className="hero-label">
            ZOVIA · NEW SEASON 2026
          </span>

          <h1>
            Style that
            <br />
            <span>feels like you.</span>
          </h1>

          <p>
            Discover fashion, beauty, lifestyle and
            everyday essentials — thoughtfully curated
            for the way you live.
          </p>

          <div className="hero-buttons">

            <button
              className="primary-button"
              onClick={() => navigate("/shop")}
            >
              Shop Now
              <span>→</span>
            </button>

            <button
              className="outline-button"
              onClick={() =>
                document
                  .getElementById("categories")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >
              Explore Categories
            </button>

          </div>

          <div className="hero-stats">

            <div>
              <strong>10K+</strong>
              <span>Happy Customers</span>
            </div>

            <div>
              <strong>500+</strong>
              <span>Curated Products</span>
            </div>

            <div>
              <strong>4.8★</strong>
              <span>Average Rating</span>
            </div>

          </div>

        </div>


        <div className="hero-visual">

          <div className="hero-main-image">

            <img
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=85"
              alt="ZOVIA Fashion Collection"
            />

          </div>

          <div className="hero-floating-card">

            <span>CURATED FOR YOU</span>

            <strong>
              Discover your
              <br />
              everyday style.
            </strong>

            <button
              onClick={() => navigate("/shop")}
            >
              Explore →
            </button>

          </div>

          <div className="hero-circle-text">
            ZOVIA · SHOP · DISCOVER · REPEAT ·
          </div>

        </div>

      </section>


      {/* CATEGORY SECTION */}

      <section
        id="categories"
        className="categories-section"
      >

        <div className="section-heading">

          <div>
            <span>
              SHOP BY CATEGORY
            </span>

            <h2>
              Everything you love.
            </h2>
          </div>

          <button
            onClick={() => navigate("/shop")}
          >
            View All Categories →
          </button>

        </div>


        <div className="category-grid">

          {categories.map((category) => (

            <div
              className="category-card"
              key={category.name}
              onClick={() =>
                navigate(
                  `/shop?category=${category.name.toLowerCase()}`
                )
              }
            >

              <div className="category-image">

                <img
                  src={category.image}
                  alt={category.name}
                />

                <div className="category-number">
                  {String(
                    categories.indexOf(category) + 1
                  ).padStart(2, "0")}
                </div>

                <div className="category-arrow">
                  →
                </div>

              </div>

              <div className="category-card-info">

                <h3>
                  {category.name}
                </h3>

                <span>
                  Explore collection
                </span>

              </div>

            </div>

          ))}

        </div>

      </section>


      {/* COLLECTIONS */}

      <section className="collections-section">

        <div className="section-heading">

          <div>
            <span>
              ZOVIA COLLECTIONS
            </span>

            <h2>
              Made for every version of you.
            </h2>
          </div>

        </div>


        <div className="collections-grid">

          {collections.map((collection) => (

            <div
              className="collection-card"
              key={collection.number}
              onClick={collection.action}
            >

              <img
                src={collection.image}
                alt={collection.title}
              />

              <div className="collection-overlay">

                <span>
                  {collection.number}
                </span>

                <h3>
                  {collection.title}
                </h3>

                <p>
                  {collection.text}
                </p>

                <button>
                  Shop Collection →
                </button>

              </div>

            </div>

          ))}

        </div>

      </section>


      {/* FEATURED PRODUCTS */}

      <section className="featured-products-section">

        <div className="section-heading">

          <div>
            <span>
              ZOVIA PICKS
            </span>

            <h2>
              Trending right now.
            </h2>
          </div>

          <button
            onClick={() => navigate("/shop")}
          >
            Shop All Products →
          </button>

        </div>


        <div className="product-slider">

          <div className="product-track">

            {[...featuredProducts, ...featuredProducts].map(
              (product, index) => (

                <div
                  className="home-product-card"
                  key={`${product.id}-${index}`}
                  onClick={() =>
                    navigate(
                      `/product/${product.id}`
                    )
                  }
                >

                  <div className="home-product-image">

                    <img
                      src={product.image}
                      alt={product.name}
                    />

                    <button
                      className="home-product-heart"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate("/wishlist");
                      }}
                    >
                      ♡
                    </button>

                    <span className="quick-view">
                      Quick View →
                    </span>

                  </div>

                  <div className="home-product-info">

                    <span>
                      {product.category}
                    </span>

                    <h3>
                      {product.name}
                    </h3>

                    <div className="product-price-row">

                      <strong>
                        ₹
                        {product.price.toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                      <small>
                        ⭐ {product.rating}
                      </small>

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        </div>

      </section>


      {/* PROMO BANNER */}

      <section className="promo-section">

        <div className="promo-content">

          <span>
            ZOVIA BEAUTY EDIT
          </span>

          <h2>
            Your beauty routine,
            <br />
            but better.
          </h2>

          <p>
            Discover makeup and skincare essentials
            selected to make your routine effortless.
          </p>

          <button
            onClick={() =>
              navigate("/shop?category=makeup")
            }
          >
            Shop Beauty →
          </button>

        </div>

        <div className="promo-image">

          <img
            src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=85"
            alt="ZOVIA Beauty"
          />

        </div>

      </section>


      {/* NEWSLETTER */}

      <section className="newsletter-section">

        <div className="newsletter-content">

          <span>
            JOIN THE ZOVIA WORLD
          </span>

          <h2>
            A little inspiration,
            <br />
            straight to your inbox.
          </h2>

          <p>
            Get first access to new arrivals,
            exclusive offers and curated edits.
          </p>

        </div>

        <form
          className="newsletter-form"
          onSubmit={handleSubscribe}
        >

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="Enter your email address"
          />

          <button type="submit">
            Subscribe →
          </button>

        </form>

      </section>


      {/* FOOTER */}

      <footer className="footer">

        <div className="footer-brand">

          <h2>
            ZOVIA
          </h2>

          <p>
            Fashion. Beauty. Lifestyle.
            <br />
            Everything you love, in one place.
          </p>

          <div className="social-links">
            <span>Instagram</span>
            <span>Facebook</span>
            <span>Pinterest</span>
          </div>

        </div>


        <div className="footer-column">

          <h4>
            SHOP
          </h4>

          <span onClick={() => navigate("/shop")}>
            All Products
          </span>

          <span
            onClick={() =>
              navigate("/shop?collection=new")
            }
          >
            New Arrivals
          </span>

          <span
            onClick={() =>
              navigate("/shop?collection=bestsellers")
            }
          >
            Best Sellers
          </span>

          <span
            onClick={() =>
              navigate("/shop?collection=everyday")
            }
          >
            Everyday
          </span>

        </div>


        <div className="footer-column">

          <h4>
            CATEGORIES
          </h4>

          <span
            onClick={() =>
              navigate("/shop?category=fashion")
            }
          >
            Fashion
          </span>

          <span
            onClick={() =>
              navigate("/shop?category=makeup")
            }
          >
            Makeup
          </span>

          <span
            onClick={() =>
              navigate("/shop?category=skincare")
            }
          >
            Skincare
          </span>

          <span
            onClick={() =>
              navigate("/shop?category=shoes")
            }
          >
            Shoes
          </span>

        </div>


        <div className="footer-column">

          <h4>
            HELP
          </h4>

          <span>
            Contact Us
          </span>

          <span>
            Shipping & Delivery
          </span>

          <span>
            Returns
          </span>

          <span>
            Privacy Policy
          </span>

        </div>


        <div className="footer-bottom">

          <span>
            © 2026 ZOVIA. All rights reserved.
          </span>

          <span>
            Crafted for modern living.
          </span>

        </div>

      </footer>

    </div>
  );
}

export default Home;