import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useOrders } from "../context/OrderContext";
import "./TrackOrder.css";

const fallbackImage =
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=80";

const getItemId = (item) =>
  String(
    item?.productId?._id ??
      item?.productId ??
      item?.id ??
      item?._id ??
      item?.name ??
      ""
  );

const compressReviewImage = (file) =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please select an image file."));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () =>
      reject(new Error("Could not read this image."));

    reader.onload = () => {
      const image = new Image();

      image.onerror = () =>
        reject(new Error("Invalid image file."));

      image.onload = () => {
        const maxDimension = 900;
        const scale = Math.min(
          1,
          maxDimension / Math.max(image.width, image.height)
        );

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Image processing is unavailable."));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };

      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  });

function TrackOrder() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const {
    orders = [],
    addReview,
    productReviews = [],
    trackingStages = [],
  } = useOrders();

  const order = orders.find(
    (item) => String(item.id) === String(orderId)
  );

  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [photos, setPhotos] = useState({});
  const [uploading, setUploading] = useState({});
  const [messages, setMessages] = useState({});
  const [reviewOpen, setReviewOpen] = useState({});

  if (!order) {
    return (
      <div className="track-not-found">
        <h1>Order Not Found</h1>
        <p>We couldn't find this ZOVIA order.</p>
        <button type="button" onClick={() => navigate("/orders")}>
          ← BACK TO MY ORDERS
        </button>
      </div>
    );
  }

  const currentIndex =
    order.status === "Cancelled"
      ? -1
      : trackingStages.indexOf(order.status);

  const isDelivered = order.status === "Delivered";
  const isCancelled = order.status === "Cancelled";

  const courier = order.courier || {
    name: "Delhivery",
    trackingId: "DLV000000000",
    phone: "1800-103-6354",
  };

  const updateMessage = (productId, message) => {
    setMessages((current) => ({
      ...current,
      [productId]: message,
    }));
  };

  const hasReviewed = (item) => {
    const productId = getItemId(item);

    return productReviews.some(
      (review) =>
        String(review.orderId) === String(order.id) &&
        String(review.productId) === productId
    );
  };

  const getSavedReview = (item) => {
    const productId = getItemId(item);

    return productReviews.find(
      (review) =>
        String(review.orderId) === String(order.id) &&
        String(review.productId) === productId
    );
  };

  const handlePhotoUpload = async (productId, fileList) => {
    const selectedFiles = Array.from(fileList || []);

    if (!selectedFiles.length) return;

    const existingPhotos = photos[productId] || [];
    const remaining = 3 - existingPhotos.length;

    if (remaining <= 0) {
      updateMessage(
        productId,
        "You can upload up to 3 photos per review."
      );
      return;
    }

    const filesToProcess = selectedFiles.slice(0, remaining);

    setUploading((current) => ({
      ...current,
      [productId]: true,
    }));

    updateMessage(
      productId,
      selectedFiles.length > remaining
        ? "Only 3 photos are allowed per review."
        : ""
    );

    try {
      const compressedPhotos = await Promise.all(
        filesToProcess.map(compressReviewImage)
      );

      setPhotos((current) => ({
        ...current,
        [productId]: [
          ...(current[productId] || []),
          ...compressedPhotos,
        ].slice(0, 3),
      }));
    } catch (error) {
      updateMessage(
        productId,
        error.message || "Unable to upload the selected photo."
      );
    } finally {
      setUploading((current) => ({
        ...current,
        [productId]: false,
      }));
    }
  };

  const removePhoto = (productId, photoIndex) => {
    setPhotos((current) => ({
      ...current,
      [productId]: (current[productId] || []).filter(
        (_, index) => index !== photoIndex
      ),
    }));
  };

  const submitProductReview = (item) => {
    const productId = getItemId(item);
    const rating = Number(ratings[productId] || 0);
    const comment = (comments[productId] || "").trim();

    if (hasReviewed(item)) {
      setReviewOpen((current) => ({
        ...current,
        [productId]: false,
      }));
      return;
    }

    if (!rating) {
      updateMessage(productId, "Please select a star rating.");
      return;
    }

    if (!comment) {
      updateMessage(productId, "Please write your review.");
      return;
    }

    if (uploading[productId]) {
      updateMessage(
        productId,
        "Please wait for your photos to finish uploading."
      );
      return;
    }

    try {
      const result = addReview(
        order.id,
        productId,
        rating,
        comment,
        photos[productId] || []
      );

      if (result && typeof result.then === "function") {
        result
          .then((response) => {
            if (response?.success) {
              updateMessage(productId, "");
              setReviewOpen((current) => ({
                ...current,
                [productId]: false,
              }));
            } else {
              updateMessage(
                productId,
                response?.message || "Could not submit your review."
              );
            }
          })
          .catch(() => {
            updateMessage(
              productId,
              "Could not submit your review."
            );
          });

        return;
      }

      if (!result?.success) {
        updateMessage(
          productId,
          result?.message ||
            "Could not submit your review. Please try again."
        );
        return;
      }

      updateMessage(productId, "");
      setReviewOpen((current) => ({
        ...current,
        [productId]: false,
      }));
    } catch {
      updateMessage(
        productId,
        "Could not submit your review. Please try again."
      );
    }
  };

  return (
    <div className="track-page">
      <header className="track-navbar">
        <Link to="/home" className="track-logo">
          ZOVIA
        </Link>

        <nav className="track-nav">
          <Link to="/home">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/orders">My Orders</Link>
          <Link to="/cart">Cart</Link>
        </nav>
      </header>

      <section className="track-hero">
        <span className="track-eyebrow">ORDER TRACKING</span>
        <h1>Track Your Order</h1>
        <p>#{order.id}</p>
      </section>

      {isCancelled ? (
        <section className="cancelled-card">
          <div className="cancelled-icon">×</div>
          <h2>Order Cancelled</h2>
          <p>This order has been cancelled successfully.</p>
          <button type="button" onClick={() => navigate("/orders")}>
            VIEW MY ORDERS
          </button>
        </section>
      ) : (
        <>
          <section className="current-status-card">
            <div className="current-status-left">
              <span className="live-dot" />
              <div>
                <small>CURRENT STATUS</small>
                <h2>{order.status}</h2>
              </div>
            </div>

            <div className="estimated-delivery">
              <small>ESTIMATED DELIVERY</small>
              <strong>{order.deliveryDate || "To be confirmed"}</strong>
            </div>
          </section>

          <section className="tracking-section">
            <div className="section-heading">
              <div>
                <span>DELIVERY JOURNEY</span>
                <h2>Your package is on its way</h2>
              </div>
              <span className="tracking-id-small">
                {courier.trackingId}
              </span>
            </div>

            <div className="timeline">
              {trackingStages.map((stage, index) => {
                const completed = index <= currentIndex;
                const active = index === currentIndex;

                const stageMessages = {
                  "Order Placed":
                    "Your order has been successfully placed with ZOVIA.",
                  Confirmed:
                    "Your order has been confirmed and is being prepared.",
                  Packed:
                    "Your items have been carefully packed and are ready for dispatch.",
                  Shipped:
                    "Your package has left the ZOVIA fulfillment centre.",
                  Dispatched:
                    "Your parcel has been handed over to our courier partner.",
                  "Out for Delivery":
                    "Your courier partner has your parcel and will deliver it shortly.",
                  Delivered:
                    "Your order has been delivered successfully. Enjoy your purchase!",
                };

                return (
                  <div
                    className={`timeline-item ${
                      completed ? "completed" : ""
                    } ${active ? "active" : ""}`}
                    key={stage}
                  >
                    <div className="timeline-marker">
                      {completed ? "✓" : index + 1}
                    </div>

                    <div className="timeline-content">
                      <h3>{stage}</h3>
                      {active && <p>{stageMessages[stage]}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {currentIndex >= 3 && (
            <section className="courier-card">
              <div className="courier-heading">
                <span className="courier-icon">🚚</span>
                <div>
                  <span>COURIER PARTNER</span>
                  <h2>{courier.name}</h2>
                </div>
              </div>

              <div className="courier-grid">
                <div>
                  <small>TRACKING ID</small>
                  <strong>{courier.trackingId}</strong>
                </div>

                <div>
                  <small>COURIER SUPPORT</small>
                  <strong>{courier.phone}</strong>
                </div>

                <div>
                  <small>DELIVERY TO</small>
                  <strong>{order.address?.city || "Your Location"}</strong>
                </div>
              </div>

              <div className="dispatch-message">
                <span>✓</span>
                <div>
                  <strong>
                    {isDelivered
                      ? "Package delivered"
                      : order.status === "Out for Delivery"
                        ? "Out for delivery"
                        : "Parcel dispatched"}
                  </strong>

                  <p>
                    {isDelivered
                      ? "The courier has successfully delivered your ZOVIA package."
                      : order.status === "Out for Delivery"
                        ? "Your package is with the delivery executive and will reach you soon."
                        : "Your parcel has been handed over to the courier partner for delivery."}
                  </p>
                </div>
              </div>
            </section>
          )}

          <section className="order-info-grid">
            <div className="info-card">
              <span>ORDER TOTAL</span>
              <strong>
                ₹{Number(order.total || 0).toLocaleString("en-IN")}
              </strong>
            </div>

            <div className="info-card">
              <span>PAYMENT</span>
              <strong>{order.paymentMethod || "Not specified"}</strong>
            </div>

            <div className="info-card">
              <span>ITEMS</span>
              <strong>
                {(order.items || []).reduce(
                  (sum, item) =>
                    sum + Number(item.quantity || 1),
                  0
                )}
              </strong>
            </div>
          </section>

          <section className="tracked-products">
            <div className="section-heading">
              <div>
                <span>YOUR PURCHASE</span>
                <h2>Items in this order</h2>
                <p>
                  {isDelivered
                    ? "Share your experience with the products you received."
                    : "Your purchased items and order details."}
                </p>
              </div>
            </div>

            <div className="tracked-product-list">
              {(order.items || []).map((item, index) => {
                const productId = getItemId(item);
                const submittedReview = getSavedReview(item);
                const submitted = Boolean(submittedReview);
                const isOpen = Boolean(reviewOpen[productId]);
                const selectedRating = Number(ratings[productId] || 0);
                const productPhotos = photos[productId] || [];

                return (
                  <article
                    className="tracked-product"
                    key={`${productId}-${index}`}
                  >
                    <img
                      src={item.image || fallbackImage}
                      alt={item.name || "ZOVIA product"}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = fallbackImage;
                      }}
                    />

                    <div className="tracked-product-details">
                      <span>{item.category || "fashion"}</span>
                      <h3>{item.name || "ZOVIA Product"}</h3>
                      <p>Quantity: {item.quantity || 1}</p>

                      {isDelivered && (
                        <div className="purchase-review-action">
                          {submitted ? (
                            <button
                              type="button"
                              className="review-submitted-button"
                              disabled
                            >
                              ✓ REVIEW SUBMITTED
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="submit-review-toggle"
                              onClick={() => {
                                setReviewOpen((current) => ({
                                  ...current,
                                  [productId]: !current[productId],
                                }));
                                updateMessage(productId, "");
                              }}
                            >
                              {isOpen
                                ? "CLOSE REVIEW ↑"
                                : "SUBMIT REVIEW ↗"}
                            </button>
                          )}
                        </div>
                      )}

                      {submitted && (
                        <div className="review-success">
                          <div className="review-success-icon">✓</div>
                          <h3>Thank you for your feedback!</h3>

                          <div className="submitted-review-preview">
                            <div className="submitted-stars">
                              {"★".repeat(
                                Number(submittedReview.rating) || 0
                              )}
                              <span>
                                {"★".repeat(
                                  Math.max(
                                    0,
                                    5 -
                                      (Number(submittedReview.rating) || 0)
                                  )
                                )}
                              </span>
                            </div>

                            <p>{submittedReview.comment}</p>

                            {submittedReview.photos?.length > 0 && (
                              <div className="review-photo-grid">
                                {submittedReview.photos.map(
                                  (photo, photoIndex) => (
                                    <img
                                      src={photo}
                                      alt={`Review photo ${photoIndex + 1}`}
                                      key={photoIndex}
                                    />
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {!submitted && isDelivered && isOpen && (
                        <div className="review-box optional-review-form">
                          <label className="review-field-label">
                            Your rating
                          </label>

                          <div className="stars review-rating-buttons">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                type="button"
                                key={star}
                                className={
                                  star <= selectedRating ? "selected" : ""
                                }
                                onClick={() => {
                                  setRatings((current) => ({
                                    ...current,
                                    [productId]: star,
                                  }));
                                  updateMessage(productId, "");
                                }}
                                aria-label={`Rate ${star} out of 5`}
                              >
                                ★
                              </button>
                            ))}
                          </div>

                          <span className="rating-label">
                            {selectedRating === 0
                              ? "Select your rating"
                              : `${selectedRating} out of 5 stars`}
                          </span>

                          <label
                            className="review-field-label"
                            htmlFor={`review-${index}`}
                          >
                            Your review
                          </label>

                          <textarea
                            id={`review-${index}`}
                            value={comments[productId] || ""}
                            onChange={(event) => {
                              setComments((current) => ({
                                ...current,
                                [productId]: event.target.value,
                              }));
                              updateMessage(productId, "");
                            }}
                            placeholder="How was the quality, fit and overall experience?"
                            rows={4}
                            maxLength={1000}
                          />

                          <div className="review-photo-upload">
                            <label
                              className="review-field-label"
                              htmlFor={`photos-${index}`}
                            >
                              Add product photos (optional, up to 3)
                            </label>

                            <input
                              id={`photos-${index}`}
                              type="file"
                              accept="image/*"
                              multiple
                              disabled={
                                productPhotos.length >= 3 ||
                                uploading[productId]
                              }
                              onChange={(event) => {
                                handlePhotoUpload(
                                  productId,
                                  event.target.files
                                );
                                event.target.value = "";
                              }}
                            />

                            <p className="review-upload-hint">
                              Photos are resized before saving.
                            </p>

                            {uploading[productId] && (
                              <p>Processing photos…</p>
                            )}

                            {productPhotos.length > 0 && (
                              <div className="review-photo-grid">
                                {productPhotos.map((photo, photoIndex) => (
                                  <div
                                    className="review-photo-preview"
                                    key={`${productId}-${photoIndex}`}
                                  >
                                    <img
                                      src={photo}
                                      alt={`Review upload ${photoIndex + 1}`}
                                    />

                                    <button
                                      type="button"
                                      onClick={() =>
                                        removePhoto(productId, photoIndex)
                                      }
                                      aria-label="Remove photo"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {messages[productId] && (
                            <p className="review-form-message" role="status">
                              {messages[productId]}
                            </p>
                          )}

                          <button
                            type="button"
                            className="submit-review"
                            disabled={uploading[productId]}
                            onClick={() => submitProductReview(item)}
                          >
                            {uploading[productId]
                              ? "PLEASE WAIT..."
                              : "SUBMIT MY REVIEW →"}
                          </button>
                        </div>
                      )}
                    </div>

                    <strong className="tracked-product-price">
                      ₹
                      {(
                        Number(item.price || 0) *
                        Number(item.quantity || 1)
                      ).toLocaleString("en-IN")}
                    </strong>
                  </article>
                );
              })}
            </div>
          </section>

          <div className="track-actions">
            <Link to="/shop">CONTINUE SHOPPING →</Link>
            <Link to="/orders">← MY ORDERS</Link>
          </div>
        </>
      )}
    </div>
  );
}

export default TrackOrder;