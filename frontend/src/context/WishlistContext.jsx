
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const WishlistContext = createContext();

const WISHLIST_STORAGE_KEY = "zovia-wishlist";

const readWishlist = () => {
  try {
    const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);

    if (!saved) return [];

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item) => item && item.id != null
    );
  } catch {
    return [];
  }
};

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState(readWishlist);

  // SAVE WISHLIST WHENEVER IT CHANGES
  useEffect(() => {
    try {
      localStorage.setItem(
        WISHLIST_STORAGE_KEY,
        JSON.stringify(wishlistItems)
      );
    } catch (error) {
      console.error("Unable to save wishlist:", error);
    }
  }, [wishlistItems]);

  // ADD PRODUCT TO WISHLIST
  const addToWishlist = (product) => {
    if (!product || product.id == null) return;

    setWishlistItems((currentItems) => {
      const alreadyExists = currentItems.some(
        (item) => String(item.id) === String(product.id)
      );

      if (alreadyExists) {
        return currentItems;
      }

      return [...currentItems, product];
    });
  };

  // REMOVE PRODUCT FROM WISHLIST
  const removeFromWishlist = (productId) => {
    setWishlistItems((currentItems) =>
      currentItems.filter(
        (item) => String(item.id) !== String(productId)
      )
    );
  };

  // CHECK WHETHER PRODUCT IS IN WISHLIST
  const isInWishlist = (productId) =>
    wishlistItems.some(
      (item) => String(item.id) === String(productId)
    );

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
