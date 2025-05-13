// Modified cart.js script to handle image paths properly

// Global variables
let currentItemToRemove = null;
const TAX_RATE = 0.07; // 7% tax
const FREE_SHIPPING_THRESHOLD = 150; // Free shipping for orders over $150
const SHIPPING_COST = 15; // $15 shipping fee
const PROMO_CODES = {
  WELCOME10: 0.1, // 10% off
  SPRING25: 0.25, // 25% off
  FREESHIP: "free-shipping", // Free shipping
};

// Initialize cart on page load
document.addEventListener("DOMContentLoaded", () => {
  // No need to load cart from local storage as it's now managed by the server
  setupEventListeners();
  updateCartCount(); // Update the cart count based on server data
  updateCartItemPrices(); // Update individual prices
  ensureImagesLoaded(); // Make sure images are loaded properly
});

// Check for broken images and replace them with placeholders
function ensureImagesLoaded() {
  const cartItemImages = document.querySelectorAll(".cart-item-image");

  cartItemImages.forEach((img) => {
    // Add error handler for broken images
    img.onerror = function () {
      this.src = "/images/placeholder.jpg";
      console.log("Image failed to load, replaced with placeholder:", this.alt);
    };

    // If image src is empty or doesn't point to a valid location
    if (
      !img.src ||
      (img.src &&
        !img.src.includes("/images/") &&
        !img.src.startsWith("http") &&
        !img.src.startsWith("/"))
    ) {
      const itemContainer = img.closest(".cart-item");
      if (itemContainer) {
        const itemId = itemContainer.getAttribute("data-id");

        // Try to get product ID if available
        let productId = null;
        const productElement = itemContainer.querySelector("[data-product-id]");
        if (productElement) {
          productId = productElement.getAttribute("data-product-id");
        }

        if (productId) {
          // Use product ID to fetch the correct image path
          fetch(`/api/product-image/${productId}`)
            .then((response) => response.json())
            .then((data) => {
              if (data.status === "success" && data.imagePath) {
                img.src = data.imagePath;
              } else {
                img.src = "/images/placeholder.jpg";
              }
            })
            .catch(() => {
              img.src = "/images/placeholder.jpg";
            });
        } else {
          // Just try adding /images/ prefix as a fallback
          const productName = img.alt;
          if (img.src && !img.src.includes("/images/")) {
            const filename = img.src.split("/").pop();
            img.src = `/images/${filename}`;
          } else {
            img.src = "/images/placeholder.jpg";
          }
        }
      } else {
        img.src = "/images/placeholder.jpg";
      }
    }
  });
}

// Fetch cart count from the server
function updateCartCount() {
  // Fetch cart count from the server API
  fetch("/api/cart-count")
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        const cartCountElements = document.querySelectorAll(".cart-count");
        cartCountElements.forEach((element) => {
          element.textContent = data.count;
        });
      }
    })
    .catch((error) => {
      console.error("Error fetching cart count:", error);
    });
}

// Set up event listeners
function setupEventListeners() {
  // Event delegation for cart item interactions
  document.addEventListener("click", (e) => {
    // Increment quantity button
    if (e.target.classList.contains("increment")) {
      const itemId = e.target.getAttribute("data-id");
      incrementQuantity(itemId);
    }

    // Decrement quantity button
    if (e.target.classList.contains("decrement")) {
      const itemId = e.target.getAttribute("data-id");
      decrementQuantity(itemId);
    }

    // Remove item button
    if (e.target.closest(".cart-item-remove")) {
      const removeBtn = e.target.closest(".cart-item-remove");
      const itemId = removeBtn.getAttribute("data-id");
      showRemoveConfirmation(itemId);
    }
  });

  // Apply promo code button
  const applyPromoBtn = document.getElementById("apply-promo-btn");
  if (applyPromoBtn) {
    applyPromoBtn.addEventListener("click", applyPromoCode);
  }

  // Checkout button
  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", showCheckoutModal);
  }

  // Confirmation modal buttons
  const cancelRemoveBtn = document.getElementById("cancel-remove");
  if (cancelRemoveBtn) {
    cancelRemoveBtn.addEventListener("click", hideRemoveConfirmation);
  }

  const confirmRemoveBtn = document.getElementById("confirm-remove");
  if (confirmRemoveBtn) {
    confirmRemoveBtn.addEventListener("click", removeCartItem);
  }

  // Close modal buttons
  const closeModalButtons = document.querySelectorAll(
    ".close-modal, .close-checkout-modal, .close-success-modal"
  );
  closeModalButtons.forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelector(".confirmation-modal").style.display = "none";
      document.querySelector(".checkout-modal").style.display = "none";
      document.querySelector(".success-modal").style.display = "none";
    });
  });

  // Checkout form submission
  const checkoutForm = document.getElementById("checkout-form");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", handleCheckout);
  }
}

// Display individual prices for cart items
function updateCartItemPrices() {
  const priceElements = document.querySelectorAll(".cart-item-price");
  priceElements.forEach((element) => {
    // Find the price from the corresponding total element
    const cartItem = element.closest(".cart-item");
    if (cartItem) {
      const totalElement = cartItem.querySelector(".cart-item-total");
      if (totalElement) {
        const totalText = totalElement.textContent;
        const totalValue = parseFloat(totalText.replace("$", ""));
        const quantityInput = cartItem.querySelector(".quantity-value");
        if (quantityInput) {
          const quantity = parseInt(quantityInput.value);
          const price = totalValue / quantity;
          element.textContent = `$${price.toFixed(2)}`;
        }
      }
    }
  });
}

// Increment item quantity in the database
function incrementQuantity(itemId) {
  // Get current quantity from the input field
  const quantityInput = document.querySelector(
    `.quantity-value[data-id="${itemId}"]`
  );
  const currentQuantity = parseInt(quantityInput.value) + 1;

  // Send request to update quantity in the database
  fetch(`/api/update-cart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      itemId: itemId,
      quantity: currentQuantity,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        // Refresh the page to update cart items and totals
        window.location.reload();
      } else {
        console.error("Error updating quantity:", data.message);
      }
    })
    .catch((error) => {
      console.error("Error updating quantity:", error);
    });
}

// Decrement item quantity in the database
function decrementQuantity(itemId) {
  // Get current quantity from the input field
  const quantityInput = document.querySelector(
    `.quantity-value[data-id="${itemId}"]`
  );
  const currentQuantity = parseInt(quantityInput.value);

  // Only decrement if quantity is greater than 1
  if (currentQuantity > 1) {
    const newQuantity = currentQuantity - 1;

    // Send request to update quantity in the database
    fetch(`/api/update-cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        itemId: itemId,
        quantity: newQuantity,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          // Refresh the page to update cart items and totals
          window.location.reload();
        } else {
          console.error("Error updating quantity:", data.message);
        }
      })
      .catch((error) => {
        console.error("Error updating quantity:", error);
      });
  }
}

// Show remove confirmation modal
function showRemoveConfirmation(itemId) {
  currentItemToRemove = itemId;
  const modal = document.querySelector(".confirmation-modal");
  modal.style.display = "flex";
}

// Hide remove confirmation modal
function hideRemoveConfirmation() {
  currentItemToRemove = null;
  const modal = document.querySelector(".confirmation-modal");
  modal.style.display = "none";
}

// Remove item from cart in the database
function removeCartItem() {
  if (currentItemToRemove) {
    // Send request to remove item from the database
    fetch(`/api/remove-from-cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        itemId: currentItemToRemove,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          // Refresh the page to update cart items and totals
          window.location.reload();
        } else {
          console.error("Error removing item:", data.message);
        }
      })
      .catch((error) => {
        console.error("Error removing item:", error);
      });

    hideRemoveConfirmation();
  }
}

// Apply promo code
function applyPromoCode() {
  const promoInput = document.getElementById("promo-code-input");
  const promoCode = promoInput.value.trim().toUpperCase();

  // Check if the promo code is valid
  if (PROMO_CODES.hasOwnProperty(promoCode)) {
    // TODO: In the future, store promo codes in the database
    // For now, we'll use a session cookie to remember the promo code
    document.cookie = `promoCode=${promoCode};path=/`;

    promoInput.value = "";

    // Show success message
    const promoDiv = document.querySelector(".promo-code");
    const successMsg = document.createElement("div");
    successMsg.className = "promo-success";
    successMsg.textContent = "Promo code applied successfully!";
    successMsg.style.color = "#2ecc71";
    successMsg.style.marginTop = "5px";
    successMsg.style.fontSize = "14px";

    // Remove existing message if any
    const existingMsg = document.querySelector(".promo-success, .promo-error");
    if (existingMsg) {
      existingMsg.remove();
    }

    promoDiv.appendChild(successMsg);

    // Refresh the page to update totals with the promo code
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } else {
    // Show error message
    const promoDiv = document.querySelector(".promo-code");
    const errorMsg = document.createElement("div");
    errorMsg.className = "promo-error";
    errorMsg.textContent = "Invalid promo code";
    errorMsg.style.color = "#e74c3c";
    errorMsg.style.marginTop = "5px";
    errorMsg.style.fontSize = "14px";

    // Remove existing message if any
    const existingMsg = document.querySelector(".promo-success, .promo-error");
    if (existingMsg) {
      existingMsg.remove();
    }

    promoDiv.appendChild(errorMsg);

    // Remove message after 3 seconds
    setTimeout(() => {
      errorMsg.remove();
    }, 3000);
  }
}

// Show checkout modal
function showCheckoutModal() {
  const cartItemsContainer = document.getElementById("cart-items-container");

  // Check if cart is empty
  if (cartItemsContainer.querySelector(".empty-cart-message")) {
    return;
  }

  const modal = document.querySelector(".checkout-modal");
  modal.style.display = "flex";
}

// Handle checkout form submission
function handleCheckout(e) {
  e.preventDefault();

  // Collect form data
  const formData = {
    firstName: document.getElementById("firstName").value,
    lastName: document.getElementById("lastName").value,
    email: document.getElementById("email").value,
    address: document.getElementById("address").value,
    city: document.getElementById("city").value,
    postalCode: document.getElementById("postalCode").value,
    country: document.getElementById("country").value,
    cardName: document.getElementById("cardName").value,
    cardNumber: document.getElementById("cardNumber").value,
    expiryDate: document.getElementById("expiryDate").value,
    cvv: document.getElementById("cvv").value,
  };

  // Basic validation
  const requiredFields = Object.keys(formData);
  let isValid = true;

  requiredFields.forEach((field) => {
    if (!formData[field]) {
      isValid = false;
      // Add error highlighting to empty fields
      document.getElementById(field).classList.add("error");
    } else {
      document.getElementById(field).classList.remove("error");
    }
  });

  if (!isValid) {
    document.getElementById("payment-errors").textContent =
      "Please fill in all required fields";
    return;
  }

  // TODO: In a real app, you would send this data to your server to process the order
  // For this example, we'll just show the success modal

  // Hide checkout modal
  document.querySelector(".checkout-modal").style.display = "none";

  // Show success modal
  document.querySelector(".success-modal").style.display = "flex";

  // Clear cart after successful order - in a real app, this would be done on the server
  // For now, we'll simulate it by making a request to clear the cart
  // This would typically be part of the order processing logic on the server
}

// Additional card validation and formatting functions for checkout
document.addEventListener("DOMContentLoaded", function () {
  const cardNumberInput = document.getElementById("cardNumber");
  const expiryDateInput = document.getElementById("expiryDate");

  if (cardNumberInput) {
    // Format card number as user types (add spaces every 4 digits)
    cardNumberInput.addEventListener("input", function (e) {
      let value = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
      let formattedValue = "";

      for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) {
          formattedValue += " ";
        }
        formattedValue += value[i];
      }

      e.target.value = formattedValue;
    });
  }

  if (expiryDateInput) {
    // Format expiry date as MM/YY
    expiryDateInput.addEventListener("input", function (e) {
      let value = e.target.value.replace(/[^0-9]/gi, "");

      if (value.length > 2) {
        e.target.value = value.slice(0, 2) + "/" + value.slice(2);
      }
    });
  }
});
