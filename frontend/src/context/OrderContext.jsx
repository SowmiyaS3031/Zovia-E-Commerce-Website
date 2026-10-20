
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const OrderContext = createContext(null);

const API_URL = "http://localhost:5000/api";

const TRACKING_STAGES = [
  "Order Placed",
  "Confirmed",
  "Packed",
  "Shipped",
  "Dispatched",
  "Out for Delivery",
  "Delivered",
];

const readStorage = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

const saveStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};


const getProductId = (item) =>
  String(
    item?.productId?._id ??
      item?.productId?.id ??
      item?.productId ??
      item?.id ??
      item?._id ??
      item?.name ??
      ""
  );

const getDeliveryDate = (days = 3) =>
  new Date(Date.now() + days * 86400000).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

const createCourier = () => ({
  name: "Delhivery",
  trackingId: `DLV${Math.floor(
    100000000 + Math.random() * 900000000
  )}`,
  phone: "1800-103-6354",
});

const readCustomerToken = () => {
  const token = localStorage.getItem("zovia-customer-token");

  if (!token || token === "null" || token === "undefined") {
    return "";
  }

  return token;
};

const normalizeServerOrder = (serverOrder, previousOrder = {}) => {
  const status = serverOrder.status || "Order Placed";

  const createdAt =
    serverOrder.createdAt ||
    previousOrder.createdAt ||
    new Date().toISOString();

  const previousItems = Array.isArray(previousOrder.items)
    ? previousOrder.items
    : [];

  const items = (Array.isArray(serverOrder.items)
    ? serverOrder.items
    : []
  ).map((item) => {
    const productId = String(
      item.productId?._id ??
        item.productId ??
        item._id ??
        item.id ??
        ""
    );

    const previousItem = previousItems.find((oldItem) => {
      const oldId = String(
        oldItem.productId?._id ??
          oldItem.productId ??
          oldItem._id ??
          oldItem.id ??
          ""
      );

      return oldId === productId;
    });

    return {
      ...previousItem,
      ...item,
      productId,
      image:
        item.image ||
        item.imageUrl ||
        item.thumbnail ||
        item.img ||
        previousItem?.image ||
        previousItem?.imageUrl ||
        previousItem?.thumbnail ||
        previousItem?.img ||
        "",
      category: item.category || previousItem?.category || "",
    };
  });

  return {
    ...previousOrder,
    ...serverOrder,
    id: String(serverOrder._id || serverOrder.id),
    items,
    total: Number(serverOrder.total ?? 0),
    status,
    createdAt,
    date: new Date(createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: new Date(createdAt).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    courier: previousOrder.courier || createCourier(),
    deliveryDate: previousOrder.deliveryDate || getDeliveryDate(),
    statusHistory: Array.isArray(previousOrder.statusHistory)
      ? previousOrder.statusHistory
      : [{ status, updatedAt: createdAt }],
  };
};

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState(() => {
    const saved = readStorage("zovia-orders", []);

    return Array.isArray(saved)
      ? saved.map((order) => ({
          ...order,
          id: String(order.id || order._id || ""),
          createdAt: order.createdAt || new Date().toISOString(),
          items: Array.isArray(order.items) ? order.items : [],
          courier: order.courier || createCourier(),
          deliveryDate: order.deliveryDate || getDeliveryDate(),
          status: order.status || "Order Placed",
        }))
      : [];
  });

  const [productReviews, setProductReviews] = useState(() => {
    const saved = readStorage("zovia-product-reviews", []);
    return Array.isArray(saved) ? saved : [];
  });

  useEffect(() => {
    saveStorage("zovia-orders", orders);
  }, [orders]);

  useEffect(() => {
    saveStorage("zovia-product-reviews", productReviews);
  }, [productReviews]);

  // Fetch current customer's orders from MongoDB.
  const refreshOrders = useCallback(async () => {
    const token = readCustomerToken();

    if (!token) {
      return { success: false, message: "Customer login required" };
    }

    try {
      const response = await fetch(`${API_URL}/orders/mine`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        return {
          success: false,
          message: data.message || "Could not refresh orders",
        };
      }

      const previousOrders = readStorage("zovia-orders", []);
      const previousById = new Map(
        (Array.isArray(previousOrders) ? previousOrders : []).map(
          (order) => [
            String(order.id || order._id || ""),
            order,
          ]
        )
      );

      const serverOrders = (Array.isArray(data.orders) ? data.orders : [])
        .map((order) =>
          normalizeServerOrder(
            order,
            previousById.get(String(order._id || order.id)) || {}
          )
        );

      setOrders(serverOrders);

      return { success: true, orders: serverOrders };
    } catch (error) {
      console.error("Refresh orders error:", error);

      return {
        success: false,
        message: "Cannot connect to the order server",
      };
    }
  }, []);

  // Refresh when a customer token is available and periodically
  // so seller status changes can appear in customer tracking.
  useEffect(() => {
    if (!readCustomerToken()) return undefined;

    refreshOrders();

    const intervalId = setInterval(() => {
      refreshOrders();
    }, 15000);

    return () => clearInterval(intervalId);
  }, [refreshOrders]);

  // CREATE ORDER IN MONGODB.
  const placeOrder = async ({
    items,
    total,
    subtotal,
    discount = 0,
    couponCode = "",
    address,
    paymentMethod,
  }) => {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Your order has no products.");
    }

    const token = readCustomerToken();

    if (!token) {
      throw new Error(
        "Customer login token is missing. Please log in again before placing your order."
      );
    }

    const backendItems = items.map((item) => ({
      productId: String(
        item?.productId ?? item?._id ?? item?.id ?? ""
      ),
      quantity: Number(item?.quantity || 1),
    }));

    const invalidItem = backendItems.some(
      (item) =>
        !/^[a-f\d]{24}$/i.test(item.productId) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
    );

    if (invalidItem) {
      throw new Error(
        "A product has an invalid database ID. Refresh the shop, add the product again, and retry."
      );
    }

    if (!address || typeof address !== "object") {
      throw new Error("Please enter your delivery address.");
    }

    if (!paymentMethod) {
      throw new Error("Please select a payment method.");
    }

    let response;

    try {
      response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: backendItems,
          address,
          paymentMethod,
        }),
      });
    } catch {
      throw new Error(
        "Cannot connect to the server. Make sure your backend is running on port 5000."
      );
    }

    const data = await response.json().catch(() => ({}));

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        data.message ||
          "Your login session is invalid or expired. Please log in again."
      );
    }

    if (!response.ok || !data.success || !data.order) {
      throw new Error(
        data.message || "The server could not create your order."
      );
    }

    const serverOrder = data.order;
    const now = new Date();

    const safeSubtotal = Math.max(
      0,
      Number(subtotal ?? total) || 0
    );

    const safeDiscount = Math.min(
      safeSubtotal,
      Math.max(0, Number(discount) || 0)
    );

    const newOrder = normalizeServerOrder(serverOrder, {
      subtotal: safeSubtotal,
      discount: safeDiscount,
      couponCode,
      courier: createCourier(),
      deliveryDate: getDeliveryDate(),
      statusHistory: [
        {
          status: serverOrder.status || "Order Placed",
          updatedAt: now.toISOString(),
        },
      ],
    });

    setOrders((current) => [
      newOrder,
      ...current.filter(
        (item) => String(item.id) !== String(newOrder.id)
      ),
    ]);

    return newOrder;
  };

  // CUSTOMER CANCELLATION: backend owns cancellation and stock restore.
  const cancelOrder = async (orderId) => {
    const token = readCustomerToken();

    if (!token) {
      throw new Error("Please log in again to cancel your order.");
    }

    const order = orders.find(
      (item) =>
        String(item.id) === String(orderId) ||
        String(item._id) === String(orderId)
    );

    if (!order) {
      throw new Error("Order not found.");
    }

    if (
      ["Shipped", "Dispatched", "Out for Delivery", "Delivered", "Cancelled"]
        .includes(order.status)
    ) {
      throw new Error("This order can no longer be cancelled.");
    }

    const response = await fetch(
      `${API_URL}/orders/${encodeURIComponent(orderId)}/cancel`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success || !data.order) {
      throw new Error(data.message || "Failed to cancel order.");
    }

    const updatedOrder = normalizeServerOrder(data.order, order);

    setOrders((current) =>
      current.map((item) =>
        String(item.id) === String(orderId) ||
        String(item._id) === String(orderId)
          ? {
              ...item,
              ...updatedOrder,
              status: "Cancelled",
              statusHistory: [
                ...(item.statusHistory || []),
                {
                  status: "Cancelled",
                  updatedAt: new Date().toISOString(),
                },
              ],
            }
          : item
      )
    );

    return true;
  };

  // Local status helper for existing UI features.
  // Server-backed seller changes should use the seller API.
  const updateOrderStatus = (orderId, nextStatus) => {
    const allowedStatuses = [...TRACKING_STAGES, "Cancelled"];

    if (!allowedStatuses.includes(nextStatus)) return false;

    const order = orders.find(
      (item) =>
        String(item.id) === String(orderId) ||
        String(item._id) === String(orderId)
    );

    if (
      !order ||
      order.status === "Cancelled" ||
      order.status === "Delivered"
    ) {
      return false;
    }

    // Cancellation must go through cancelOrder() instead.
    if (nextStatus === "Cancelled") return false;

    const now = new Date().toISOString();

    setOrders((current) =>
      current.map((item) => {
        if (
          String(item.id) !== String(orderId) &&
          String(item._id) !== String(orderId)
        ) {
          return item;
        }

        return {
          ...item,
          status: nextStatus,
          statusUpdatedAt: now,
          statusHistory: [
            ...(item.statusHistory || []),
            { status: nextStatus, updatedAt: now },
          ],
          ...(nextStatus === "Dispatched" || nextStatus === "Shipped"
            ? { dispatchDate: item.dispatchDate || now }
            : {}),
          ...(nextStatus === "Delivered" ? { deliveredAt: now } : {}),
        };
      })
    );

    return true;
  };

  const updateOrderDispatchDetails = (orderId, details = {}) => {
    const order = orders.find(
      (item) =>
        String(item.id) === String(orderId) ||
        String(item._id) === String(orderId)
    );

    if (
      !order ||
      order.status === "Cancelled" ||
      order.status === "Delivered"
    ) {
      return false;
    }

    setOrders((current) =>
      current.map((item) => {
        if (
          String(item.id) !== String(orderId) &&
          String(item._id) !== String(orderId)
        ) {
          return item;
        }

        return {
          ...item,
          courier: {
            ...(item.courier || createCourier()),
            ...(details.courier || {}),
          },
          ...(details.deliveryDate
            ? { deliveryDate: details.deliveryDate }
            : {}),
          ...(details.dispatchNote !== undefined
            ? { dispatchNote: details.dispatchNote }
            : {}),
        };
      })
    );

    return true;
  };

  const addReview = (
    orderId,
    productId,
    rating,
    comment,
    photos = []
  ) => {
    const order = orders.find(
      (item) =>
        String(item.id) === String(orderId) ||
        String(item._id) === String(orderId)
    );

    if (!order || order.status !== "Delivered") {
      return {
        success: false,
        message: "Only delivered orders can be reviewed.",
      };
    }

    const item = order.items.find(
      (entry) => getProductId(entry) === String(productId)
    );

    if (!item) {
      return {
        success: false,
        message: "This product is not part of the order.",
      };
    }

    const alreadyReviewed = productReviews.some(
      (review) =>
        String(review.orderId) === String(orderId) &&
        String(review.productId) === String(productId)
    );

    if (alreadyReviewed) {
      return {
        success: false,
        message: "You have already reviewed this product.",
      };
    }

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return {
        success: false,
        message: "Please select a rating from 1 to 5.",
      };
    }

    const review = {
      id: `REVIEW-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,
      orderId: String(orderId),
      productId: String(productId),
      productName: item.name || "ZOVIA Product",
      customerName: "ZOVIA Customer",
      rating: numericRating,
      comment: String(comment || "").trim(),
      photos: Array.isArray(photos) ? photos : [],
      submittedAt: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };

    setProductReviews((current) => [...current, review]);

    return { success: true, review };
  };
  const getProductReviews = (productId, productName = "") => {
    const normalize = (value) =>
      String(value ?? "").trim().toLowerCase();

    const normalizeId = (value) => {
      if (value && typeof value === "object") {
        return normalize(value._id ?? value.id ?? value.productId);
      }

      return normalize(value);
    };

    const targetId = normalizeId(productId);
    const targetName = normalize(productName);

    const matchedById = productReviews.filter((review) => {
      const reviewId = normalizeId(review.productId);

      return targetId !== "" && reviewId === targetId;
    });

    if (matchedById.length > 0) {
      return matchedById;
    }

    if (!targetName) {
      return [];
    }

    return productReviews.filter(
      (review) =>
        normalize(review.productName) === targetName
    );
  };
  return (
    <OrderContext.Provider
      value={{
        orders,
        placeOrder,
        cancelOrder,
        refreshOrders,
        updateOrderStatus,
        updateOrderDispatchDetails,
        addReview,
        productReviews,
        getProductReviews,
        trackingStages: TRACKING_STAGES,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);

  if (!context) {
    throw new Error("useOrders must be used inside OrderProvider");
  }

  return context;
}
