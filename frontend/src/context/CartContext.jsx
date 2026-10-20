
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

const getCartStorageKey = (user) => {
  const customerId = user?.id || user?._id || user?.email;

  return customerId
    ? `zovia-cart:${String(customerId).toLowerCase()}`
    : "zovia-cart:guest";
};

const readCart = (storageKey) => {
  try {
    const saved = localStorage.getItem(storageKey);

    if (!saved) return [];

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item && item.id != null)
      .map((item) => ({
        ...item,
        quantity: Math.max(1, Number(item.quantity) || 1),
        price: Math.max(0, Number(item.price) || 0),
      }));
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const { user } = useAuth();

  const storageKey = getCartStorageKey(user);

  const [cartItems, setCartItems] = useState([]);
  const [loadedKey, setLoadedKey] = useState(null);

  // Load the correct cart whenever the customer changes.
  useEffect(() => {
    const savedItems = readCart(storageKey);

    setCartItems(savedItems);
    setLoadedKey(storageKey);
  }, [storageKey]);

  // Save only after the correct customer's cart has loaded.
  useEffect(() => {
    if (loadedKey !== storageKey) return;

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(cartItems)
      );
    } catch (error) {
      console.error("Unable to save cart:", error);
    }
  }, [cartItems, loadedKey, storageKey]);

  // Hide the previous customer's cart while switching accounts.
  const isCartReady = loadedKey === storageKey;
  const visibleCartItems = isCartReady ? cartItems : [];

  // ADD PRODUCT
  const addToCart = (product) => {
    if (!isCartReady || !product || product.id == null) return;

    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => String(item.id) === String(product.id)
      );

      if (existingItem) {
        return currentItems.map((item) =>
          String(item.id) === String(product.id)
            ? {
                ...item,
                quantity: (Number(item.quantity) || 1) + 1,
              }
            : item
        );
      }

      return [
        ...currentItems,
        {
          ...product,
          price: Math.max(0, Number(product.price) || 0),
          quantity: 1,
        },
      ];
    });
  };

  // REMOVE PRODUCT
  const removeFromCart = (productId) => {
    if (!isCartReady) return;

    setCartItems((currentItems) =>
      currentItems.filter(
        (item) => String(item.id) !== String(productId)
      )
    );
  };

  // INCREASE QUANTITY
  const increaseQuantity = (productId) => {
    if (!isCartReady) return;

    setCartItems((currentItems) =>
      currentItems.map((item) =>
        String(item.id) === String(productId)
          ? {
              ...item,
              quantity: (Number(item.quantity) || 1) + 1,
            }
          : item
      )
    );
  };

  // DECREASE QUANTITY
  const decreaseQuantity = (productId) => {
    if (!isCartReady) return;

    setCartItems((currentItems) =>
      currentItems
        .map((item) =>
          String(item.id) === String(productId)
            ? {
                ...item,
                quantity: (Number(item.quantity) || 1) - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const cartCount = visibleCartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = visibleCartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems: visibleCartItems,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
