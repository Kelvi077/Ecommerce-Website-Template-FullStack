// Database-connected checkout functionality
document.addEventListener("DOMContentLoaded", function () {
  // Elements
  const checkoutModal = document.querySelector(".checkout-modal");
  const checkoutBtn = document.getElementById("checkout-btn");
  const closeCheckoutModal = document.querySelector(".close-checkout-modal");
  const cancelCheckoutBtn = document.getElementById("cancel-checkout-btn");
  const checkoutForm = document.getElementById("checkout-form");
  const successModal = document.querySelector(".success-modal");
  const closeSuccessModal = document.querySelector(".close-success-modal");

  // Card input formatting and validation
  const cardNumberInput = document.getElementById("cardNumber");
  const expiryDateInput = document.getElementById("expiryDate");
  const cvvInput = document.getElementById("cvv");
  const cardBrandIcon = document.getElementById("card-brand-icon");
  const paymentErrors = document.getElementById("payment-errors");

  // Card type patterns
  const cardPatterns = {
    visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
    mastercard: /^5[1-5][0-9]{14}$/,
    amex: /^3[47][0-9]{13}$/,
    discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
  };

  // Open checkout modal
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", function () {
      // Copy the cart summary values to the checkout modal
      document.getElementById("checkout-subtotal").textContent =
        document.getElementById("cart-subtotal").textContent;
      document.getElementById("checkout-shipping").textContent =
        document.getElementById("cart-shipping").textContent;
      document.getElementById("checkout-tax").textContent =
        document.getElementById("cart-tax").textContent;
      document.getElementById("checkout-total").textContent =
        document.getElementById("cart-total").textContent;

      // FIXED: Check if cart has items by examining the cart-items-container
      // instead of relying only on localStorage
      const cartItemsContainer = document.getElementById(
        "cart-items-container"
      );
      const emptyCartMessage = cartItemsContainer.querySelector(
        ".empty-cart-message"
      );

      // If there's no empty cart message, we have items
      if (!emptyCartMessage) {
        checkoutModal.style.display = "flex";
      } else {
        alert("Your cart is empty. Please add products before checkout.");
      }
    });
  }

  // Close checkout modal
  if (closeCheckoutModal) {
    closeCheckoutModal.addEventListener("click", function () {
      closeCheckoutModalHandler();
    });
  }

  // Cancel checkout button
  if (cancelCheckoutBtn) {
    cancelCheckoutBtn.addEventListener("click", function () {
      closeCheckoutModalHandler();
    });
  }

  function closeCheckoutModalHandler() {
    checkoutModal.style.display = "none";
    paymentErrors.textContent = "";
    checkoutForm.reset();
  }

  // Close success modal
  if (closeSuccessModal) {
    closeSuccessModal.addEventListener("click", function () {
      successModal.style.display = "none";
    });
  }

  // Format card number with spaces (e.g., 4242 4242 4242 4242)
  if (cardNumberInput) {
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

      // Detect card type
      const cardNumber = value.replace(/\s+/g, "");
      detectCardType(cardNumber);
    });
  }

  // Format expiry date (MM/YY)
  if (expiryDateInput) {
    expiryDateInput.addEventListener("input", function (e) {
      let value = e.target.value.replace(/[^0-9]/g, "");

      if (value.length > 2) {
        value = value.substring(0, 2) + "/" + value.substring(2, 4);
      }

      e.target.value = value;
    });
  }

  // Detect and show card type
  function detectCardType(cardNumber) {
    let brandImage = "/img/generic-card.svg"; // Default generic card

    if (cardPatterns.visa.test(cardNumber)) {
      brandImage = "/img/visa.svg";
    } else if (cardPatterns.mastercard.test(cardNumber)) {
      brandImage = "/img/mastercard.svg";
    } else if (cardPatterns.amex.test(cardNumber)) {
      brandImage = "/img/amex.svg";
    } else if (cardPatterns.discover.test(cardNumber)) {
      brandImage = "/img/discover.svg";
    }

    cardBrandIcon.src = brandImage;
  }

  // Helper function to detect card type and return string representation
  function detectCardTypeString(cardNumber) {
    if (cardPatterns.visa.test(cardNumber)) {
      return "visa";
    } else if (cardPatterns.mastercard.test(cardNumber)) {
      return "mastercard";
    } else if (cardPatterns.amex.test(cardNumber)) {
      return "amex";
    } else if (cardPatterns.discover.test(cardNumber)) {
      return "discover";
    } else {
      return "unknown";
    }
  }

  // Validate form fields
  function validateForm() {
    // Get form values
    const cardNumber = cardNumberInput.value.replace(/\s+/g, "");
    const expiryDate = expiryDateInput.value;
    const cvv = cvvInput.value;

    // Validate card number (Luhn algorithm)
    if (!isValidCardNumber(cardNumber)) {
      paymentErrors.textContent = "Please enter a valid card number.";
      return false;
    }

    // Validate expiry date
    if (!isValidExpiryDate(expiryDate)) {
      paymentErrors.textContent = "Please enter a valid expiry date (MM/YY).";
      return false;
    }

    // Validate CVV
    if (!/^\d{3,4}$/.test(cvv)) {
      paymentErrors.textContent = "Please enter a valid CVV code.";
      return false;
    }

    return true;
  }

  // Validate card number using Luhn algorithm
  function isValidCardNumber(cardNumber) {
    if (!/^\d{13,19}$/.test(cardNumber)) {
      return false;
    }

    let sum = 0;
    let shouldDouble = false;

    // Loop through values starting from the rightmost digit
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i));

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  }

  // Validate expiry date
  function isValidExpiryDate(expiryDate) {
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      return false;
    }

    const [month, year] = expiryDate.split("/");
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100; // Get last 2 digits
    const currentMonth = currentDate.getMonth() + 1; // 1-12

    const expMonth = parseInt(month);
    const expYear = parseInt(year);

    // Check if month is valid
    if (expMonth < 1 || expMonth > 12) {
      return false;
    }

    // Check if card is expired
    if (
      expYear < currentYear ||
      (expYear === currentYear && expMonth < currentMonth)
    ) {
      return false;
    }

    return true;
  }

  // Function to generate a unique order ID
  function generateOrderId() {
    return (
      "ORD-" +
      Date.now().toString().slice(-6) +
      "-" +
      Math.floor(Math.random() * 1000)
    );
  }

  // FIXED: Get cart items using DOM instead of localStorage
  function getCartItems() {
    // Try to get cart items from localStorage first
    const localStorageItems =
      JSON.parse(localStorage.getItem("cartItems")) || [];

    // If localStorage has items, return those
    if (localStorageItems.length > 0) {
      return localStorageItems;
    }

    // If localStorage is empty, try to extract items from the DOM
    const cartItemsContainer = document.getElementById("cart-items-container");
    if (!cartItemsContainer) return [];

    const cartItemElements = cartItemsContainer.querySelectorAll(".cart-item");
    const items = [];

    cartItemElements.forEach((item) => {
      const id = item.getAttribute("data-id");
      const productName = item.querySelector(
        ".cart-item-details h3"
      ).textContent;
      const category = item.querySelector(".cart-item-details p").textContent;
      const priceText =
        item.querySelector(".cart-item-price").textContent ||
        item.querySelector(".cart-item-total").textContent;
      const price = parseFloat(priceText.replace("$", "")) || 0;
      const quantity =
        parseInt(item.querySelector(".quantity-value").value) || 1;
      const imgElement = item.querySelector(".cart-item-image");
      const cart_image = imgElement ? imgElement.src : "";

      items.push({
        id,
        product_name: productName,
        category,
        price,
        quantity,
        cart_image,
      });
    });

    // Update localStorage with the DOM items for future use
    if (items.length > 0) {
      localStorage.setItem("cartItems", JSON.stringify(items));
    }

    return items;
  }

  // Calculate cart totals
  function calculateCartTotals() {
    // Get values from the cart summary section
    const subtotal = document.getElementById("cart-subtotal").textContent;
    const shipping = document.getElementById("cart-shipping").textContent;
    const tax = document.getElementById("cart-tax").textContent;
    const total = document.getElementById("cart-total").textContent;

    return {
      subtotal: subtotal,
      shipping: shipping,
      tax: tax,
      total: total,
    };
  }

  // Clear cart and update display
  function clearCart() {
    localStorage.removeItem("cartItems");
    localStorage.removeItem("activePromoCode");
    updateCartDisplay();
  }

  // Update cart display
  function updateCartDisplay() {
    const cartItems = getCartItems();
    const cartCountElements = document.querySelectorAll(".cart-count");

    // Update cart count
    cartCountElements.forEach((element) => {
      element.textContent = cartItems.length;
    });

    // Update cart items container
    const cartItemsContainer = document.getElementById("cart-items-container");
    if (cartItemsContainer) {
      if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = `
                    <div class="empty-cart-message">
                        <i class="fas fa-shopping-cart"></i>
                        <p>Your cart is empty</p>
                        <a href="/products" class="continue-shopping-btn">Continue Shopping</a>
                    </div>
                `;

        // Reset totals
        document.getElementById("cart-subtotal").textContent = "$0.00";
        document.getElementById("cart-shipping").textContent = "$0.00";
        document.getElementById("cart-tax").textContent = "$0.00";
        document.getElementById("cart-total").textContent = "$0.00";
      }
    }
  }

  // Process checkout and send order data to database
  async function processCheckoutToDatabase(orderData) {
    try {
      // Send order data to server endpoint
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error processing order");
      }

      const data = await response.json();

      // Send email receipt after successful order processing
      if (data.success) {
        await sendOrderReceiptEmail(orderData);
      }

      return {
        success: true,
        orderId: data.orderId,
        message: data.message,
      };
    } catch (error) {
      console.error("Error saving order to database:", error);
      return {
        success: false,
        message:
          error.message || "Failed to process your order. Please try again.",
      };
    }
  }

  // Send order receipt email
  async function sendOrderReceiptEmail(orderData) {
    try {
      console.log("🛒 Sending receipt email for order:", orderData.id);
      console.log("🛒 Customer email:", orderData.customer.email);

      const emailData = {
        orderId: orderData.id,
        customerEmail: orderData.customer.email,
        customerName: `${orderData.customer.firstName} ${orderData.customer.lastName}`,
        orderItems: orderData.items,
        orderTotals: orderData.totals,
        orderDate: orderData.date,
        shippingAddress: {
          address: orderData.customer.address,
          city: orderData.customer.city,
          postalCode: orderData.customer.postalCode,
          country: orderData.customer.country,
        },
      };

      console.log(
        "🛒 Email data being sent:",
        JSON.stringify(emailData, null, 2)
      );

      const response = await fetch("/api/send-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      });

      console.log("🛒 API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("🛒 Error sending receipt:", errorData.message);
        // We don't want to fail the order if only the email fails
        return { success: false };
      }

      const data = await response.json();
      console.log("🛒 Receipt email result:", data);
      return { success: true };
    } catch (error) {
      console.error("🛒 Error sending receipt email:", error);
      // We don't want to fail the order if only the email fails
      return { success: false };
    }
  }

  // Database checkout handler
  async function handleCheckoutDatabase(e) {
    e.preventDefault();

    // Show loading state
    const placeOrderBtn = document.getElementById("place-order-btn");
    const originalBtnText = placeOrderBtn.textContent;
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = "Processing...";

    // Clear previous errors
    const paymentErrors = document.getElementById("payment-errors");
    paymentErrors.textContent = "";

    // Form validation
    if (!validateForm()) {
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = originalBtnText;
      return;
    }

    // Get cart items and totals
    const cartItems = getCartItems();
    const cartTotals = calculateCartTotals();

    // FIXED: Double-check we have items
    if (!cartItems || cartItems.length === 0) {
      paymentErrors.textContent =
        "Your cart appears to be empty. Please add items before checkout.";
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = originalBtnText;
      return;
    }

    // Create order object with all customer and payment info
    const order = {
      id: generateOrderId(),
      date: new Date().toISOString(),
      customer: {
        firstName: document.getElementById("firstName").value,
        lastName: document.getElementById("lastName").value,
        email: document.getElementById("email").value,
        address: document.getElementById("address").value,
        city: document.getElementById("city").value,
        postalCode: document.getElementById("postalCode").value,
        country: document.getElementById("country").value,
      },
      payment: {
        // Note: In a real system, you would use a payment processor
        // and would NOT send full card details to your server
        cardLast4: document
          .getElementById("cardNumber")
          .value.replace(/\s+/g, "")
          .slice(-4),
        cardType: detectCardTypeString(
          document.getElementById("cardNumber").value.replace(/\s+/g, "")
        ),
        cardHolder: document.getElementById("cardName").value,
      },
      items: cartItems,
      totals: {
        subtotal: cartTotals.subtotal,
        discount: cartTotals.discount || "$0.00",
        shipping: cartTotals.shipping,
        tax: cartTotals.tax,
        total: cartTotals.total,
      },
      status: "pending",
      promoCode: localStorage.getItem("activePromoCode") || null,
    };

    // Process the order
    const result = await processCheckoutToDatabase(order);

    if (result.success) {
      // Clear cart after successful order
      clearCart();

      // Hide checkout modal
      document.querySelector(".checkout-modal").style.display = "none";

      // Show success modal with order ID
      const successModal = document.querySelector(".success-modal");
      const successMessage = successModal.querySelector("p");
      successMessage.innerHTML = `Thank you for your purchase. Your order <strong>#${result.orderId}</strong> has been received and is being processed.<br>Order confirmation has been sent to your email.`;
      successModal.style.display = "flex";
    } else {
      // Show error message
      paymentErrors.textContent = result.message;
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = originalBtnText;
    }
  }

  // Add event listener for checkout form
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", handleCheckoutDatabase);
  }
});
