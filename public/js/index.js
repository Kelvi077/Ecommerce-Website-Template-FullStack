document.addEventListener("DOMContentLoaded", function () {
  // Mobile Menu Toggle
  initMobileMenu();

  // Hero Slider
  initSlider();

  // Product Card Actions (Quick View & Add to Cart)
  setupProductActions();

  // Form Submission
  setupFormSubmission();

  // Initialize cart count on page load
  updateCartCount();

  // Check user authentication status
  checkAuthStatus();
});

// Check if user is logged in
let userLoggedIn = false;

function checkAuthStatus() {
  fetch("/api/auth/check")
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        userLoggedIn = data.loggedIn;

        // Update login/account link in header if needed
        updateHeaderLoginState(data.loggedIn, data.user);
      }
    })
    .catch((error) => {
      console.error("Error checking auth status:", error);
    });
}

// Update header to show "Account" instead of "Login" if user is logged in
function updateHeaderLoginState(isLoggedIn, user) {
  const accountText = document.querySelector(".account-text");
  const mobileLoginLink = document.querySelector(".mobile-menu li a[href='/login']");
  
  if (accountText && isLoggedIn && user) {
    // Update desktop menu
    accountText.textContent = "My Account";
    accountText.parentElement.href = "/profile";
    
    // Update mobile menu
    if (mobileLoginLink) {
      mobileLoginLink.innerHTML = '<i class="fas fa-user"></i> My Account';
      mobileLoginLink.href = "/profile";
    }
  }
}

// Mobile Menu Functionality
function initMobileMenu() {
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const mobileMenu = document.querySelector(".mobile-menu");

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", function () {
      mobileMenu.classList.toggle("active");
      document.body.style.overflow = mobileMenu.classList.contains("active")
        ? "hidden"
        : "";
    });
  }

  // Close mobile menu when clicking outside
  document.addEventListener("click", function (event) {
    if (
      mobileMenu &&
      mobileMenu.classList.contains("active") &&
      !mobileMenu.contains(event.target) &&
      !mobileMenuBtn.contains(event.target)
    ) {
      mobileMenu.classList.remove("active");
      document.body.style.overflow = "";
    }
  });
}

// Hero Slider Functionality
function initSlider() {
  const slides = document.querySelectorAll(".slide");
  const dots = document.querySelectorAll(".dot");
  const prevBtn = document.querySelector(".prev-btn");
  const nextBtn = document.querySelector(".next-btn");

  if (!slides.length) return;

  let currentSlide = 0;
  let slideInterval;

  // Start automatic slider
  startSlideInterval();

  // Function to start the slider interval
  function startSlideInterval() {
    slideInterval = setInterval(() => {
      moveToNextSlide();
    }, 5000);
  }

  // Reset interval when manually changing slides
  function resetInterval() {
    clearInterval(slideInterval);
    startSlideInterval();
  }

  // Move to a specific slide
  function moveToSlide(index) {
    // Remove active class from all slides
    slides.forEach((slide) => {
      slide.classList.remove("active");
    });

    // Remove active class from all dots
    dots.forEach((dot) => {
      dot.classList.remove("active");
    });

    // Set active slide and dot
    slides[index].classList.add("active");
    dots[index].classList.add("active");

    currentSlide = index;
  }

  // Move to the next slide
  function moveToNextSlide() {
    const next = (currentSlide + 1) % slides.length;
    moveToSlide(next);
  }

  // Move to the previous slide
  function moveToPrevSlide() {
    const prev = (currentSlide - 1 + slides.length) % slides.length;
    moveToSlide(prev);
  }

  // Event listeners for slider controls
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      moveToPrevSlide();
      resetInterval();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      moveToNextSlide();
      resetInterval();
    });
  }

  // Event listeners for dots
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      moveToSlide(index);
      resetInterval();
    });
  });

  // Pause slider on hover
  const heroSlider = document.querySelector(".hero-slider");
  if (heroSlider) {
    heroSlider.addEventListener("mouseenter", () => {
      clearInterval(slideInterval);
    });

    heroSlider.addEventListener("mouseleave", () => {
      startSlideInterval();
    });
  }
}

// Setup Product Actions (Quick View & Add to Cart)
function setupProductActions() {
  setupQuickView();
  setupAddToCart();
}

// Add to Cart Functionality
function setupAddToCart() {
  const addToCartBtns = document.querySelectorAll(".add-to-cart-btn");

  addToCartBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      // Check if user is logged in before proceeding
      if (!userLoggedIn) {
        // Save current page URL for redirect after login
        const currentPage = window.location.pathname + window.location.search;
        redirectToLogin(currentPage);
        return;
      }

      const productId = this.getAttribute("data-id");

      if (this.hasAttribute("disabled")) {
        alert("Sorry, this product is out of stock.");
        return;
      }

      // Get product details from DOM
      const product = this.closest(".product-card");
      const name = product.querySelector(".product-title").textContent;
      const priceEl = product.querySelector(".product-price");
      const price = product.hasAttribute("data-price")
        ? parseFloat(product.getAttribute("data-price"))
        : parseFloat(priceEl.textContent.replace(/[^0-9.]/g, ""));
      const image = product
        .querySelector(".product-image img")
        .src.split("/")
        .pop();
      const category = product.querySelector(".product-category").textContent;

      // Add to cart via API
      addToCart(productId, name, price, image, category, 1);
      animateAddToCart(this);
    });
  });
}

// Redirect to login page with return URL
function redirectToLogin(returnUrl) {
  window.location.href = `/login?redirect=${encodeURIComponent(returnUrl || window.location.pathname)}`;
}

/**
 * Add item to cart using server API
 * @param {string} productId - The product ID
 * @param {string} name - The product name
 * @param {number} price - The product price
 * @param {string} image - The product image filename
 * @param {string} category - The product category
 * @param {number} quantity - The quantity to add
 */
function addToCart(productId, name, price, image, category, quantity) {
  // First check login status again (in case it changed)
  if (!userLoggedIn) {
    redirectToLogin();
    return;
  }

  // Prepare the data for the API call
  const cartData = {
    productId: productId,
    name: name,
    price: price,
    image: image,
    category: category,
    quantity: quantity,
  };

  // Send POST request to add-to-cart API endpoint
  fetch("/api/add-to-cart", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cartData),
  })
    .then((response) => {
      // Check if response redirects to login page (status 401 or 302)
      if (response.status === 401 || response.status === 302) {
        redirectToLogin();
        throw new Error("Login required");
      }
      return response.json();
    })
    .then((data) => {
      if (data.status === "success") {
        // If successful, update the cart count and show notification
        updateCartCount();
        showCartNotification();
      } else if (data.status === "auth_required") {
        // Redirect to login if server indicates authentication is required
        redirectToLogin();
      } else {
        console.error("Error adding to cart:", data.message);
        alert(
          "There was an error adding this item to your cart. Please try again."
        );
      }
    })
    .catch((error) => {
      if (error.message !== "Login required") {
        console.error("Error adding to cart:", error);
        alert(
          "There was an error adding this item to your cart. Please try again."
        );
      }
    });
}

// Animation for adding to cart
function animateAddToCart(button) {
  // Visual feedback animation
  button.classList.add("added");
  button.textContent = "Added to Cart!";

  setTimeout(() => {
    button.classList.remove("added");
    button.textContent = "Add to Cart";
  }, 1500);
}

// Show cart notification with view cart link
function showCartNotification() {
  const notification = document.querySelector(".cart-notification");
  if (!notification) {
    // Create notification if it doesn't exist
    const newNotification = document.createElement("div");
    newNotification.classList.add("cart-notification");
    newNotification.innerHTML = `
      <p>Item added to cart! 
        <a href="/cart" class="view-cart-link">View Cart</a>
      </p>
    `;
    document.body.appendChild(newNotification);

    setTimeout(() => {
      newNotification.classList.add("show");
    }, 100);

    setTimeout(() => {
      newNotification.classList.remove("show");
    }, 3000);
  } else {
    // Update existing notification
    notification.innerHTML = `
      <p>Item added to cart! 
        <a href="/cart" class="view-cart-link">View Cart</a>
      </p>
    `;
    notification.classList.add("show");

    setTimeout(() => {
      notification.classList.remove("show");
    }, 3000);
  }
}

// Update cart count display by fetching from server
function updateCartCount() {
  // Fetch cart count from the server
  fetch("/api/cart-count")
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        // Update all cart count elements
        const cartCountElements = document.querySelectorAll(".cart-count");
        cartCountElements.forEach((element) => {
          element.textContent = data.count;
        });
      } else {
        console.error("Error fetching cart count:", data.message);
      }
    })
    .catch((error) => {
      console.error("Error fetching cart count:", error);
    });
}

// Quick View functionality
function setupQuickView() {
  const quickViewBtns = document.querySelectorAll(".quick-view-btn");

  if (quickViewBtns.length === 0) return;

  // Check if modal exists, create if not
  let quickViewModal = document.querySelector(".quick-view-modal");
  if (!quickViewModal) {
    quickViewModal = document.createElement("div");
    quickViewModal.classList.add("quick-view-modal");
    quickViewModal.innerHTML = `
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <div class="modal-product-content">
          <!-- Product details will be loaded here via JavaScript -->
        </div>
      </div>
    `;
    document.body.appendChild(quickViewModal);

    // Add event listener to close modal
    const closeModal = quickViewModal.querySelector(".close-modal");
    closeModal.addEventListener("click", function () {
      quickViewModal.style.display = "none";
      document.body.style.overflow = "auto";
    });

    // Close modal when clicking outside
    window.addEventListener("click", function (event) {
      if (event.target === quickViewModal) {
        quickViewModal.style.display = "none";
        document.body.style.overflow = "auto";
      }
    });
  }

  const modalContent = quickViewModal.querySelector(".modal-product-content");

  quickViewBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const productId = this.getAttribute("data-id");
      const product = this.closest(".product-card");

      // Handle "Check All Products" link case
      if (btn.textContent.includes("Check All Products")) {
        window.location.href = "/products";
        return;
      }

      const productTitle = product.querySelector(".product-title").textContent;
      const productCategory =
        product.querySelector(".product-category").textContent;
      const productPrice = product.querySelector(".product-price").innerHTML;
      const productImage = product.querySelector(".product-image img").src;
      const imageFilename = productImage.split("/").pop();
      const productPriceValue = parseFloat(
        productPrice.replace(/[^0-9.]/g, "")
      );

      // Get product description if available
      let productDescription =
        "View our complete collection for detailed product information.";
      const descriptionElem = product.querySelector(".product-description");
      if (descriptionElem) {
        productDescription = descriptionElem.textContent;
      }

      // Create modal content
      modalContent.innerHTML = `
        <div class="modal-product-image">
          <img src="${productImage}" alt="${productTitle}">
        </div>
        <div class="modal-product-details">
          <h2 class="modal-product-title">${productTitle}</h2>
          <div class="modal-product-price">${productPrice}</div>
          <div class="modal-product-description">
            <p>${productDescription}</p>
          </div>
          <div class="product-quantity">
            <span class="quantity-label">Quantity:</span>
            <div class="quantity-input">
              <button class="quantity-btn decrease">-</button>
              <input type="text" class="quantity-value" value="1" readonly>
              <button class="quantity-btn increase">+</button>
            </div>
          </div>
          <button class="modal-add-to-cart" 
            data-id="${productId}"
            data-name="${productTitle}"
            data-price="${productPriceValue}"
            data-image="${imageFilename}"
            data-category="${productCategory}">
            Add to Cart
          </button>
          <div class="product-meta">
            <div class="meta-item">
              <span class="meta-label">SKU:</span>
              <span class="meta-value">${productId}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Category:</span>
              <span class="meta-value">${productCategory}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Tags:</span>
              <span class="meta-value">Furniture, Home Decor, ${productCategory}</span>
            </div>
          </div>
        </div>
      `;

      // Show modal
      quickViewModal.style.display = "block";
      document.body.style.overflow = "hidden";

      // Add event listeners for quantity buttons
      const decrease = modalContent.querySelector(".decrease");
      const increase = modalContent.querySelector(".increase");
      const quantityInput = modalContent.querySelector(".quantity-value");

      decrease.addEventListener("click", function () {
        let value = parseInt(quantityInput.value);
        if (value > 1) {
          quantityInput.value = value - 1;
        }
      });

      increase.addEventListener("click", function () {
        let value = parseInt(quantityInput.value);
        quantityInput.value = value + 1;
      });

      // Add event listener for modal add to cart button
      const modalAddToCartBtn =
        modalContent.querySelector(".modal-add-to-cart");
      modalAddToCartBtn.addEventListener("click", function () {
        // Check login status before adding to cart
        if (!userLoggedIn) {
          // Save current page URL for redirect after login
          const currentPage = window.location.pathname + window.location.search;
          redirectToLogin(currentPage);
          return;
        }

        // Extract data attributes
        const productId = this.getAttribute("data-id");
        const name = this.getAttribute("data-name");
        const price = parseFloat(this.getAttribute("data-price"));
        const image = this.getAttribute("data-image");
        const category = this.getAttribute("data-category");
        const quantity = parseInt(quantityInput.value);

        // Call addToCart with extracted data
        addToCart(productId, name, price, image, category, quantity);

        quickViewModal.style.display = "none";
        document.body.style.overflow = "auto";
      });
    });
  });
}

// Form Submission
function setupFormSubmission() {
  const subscribeForm = document.querySelector(".subscribe-form");

  if (subscribeForm) {
    subscribeForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const emailInput = this.querySelector('input[type="email"]');
      const email = emailInput.value.trim();

      if (email) {
        // In a real application, this would send the email to a server
        // For demo purposes just show success message
        showSubscribeSuccess(subscribeForm);
        emailInput.value = "";
      }
    });
  }
}

// Show subscription success message
function showSubscribeSuccess(form) {
  // Create success message
  const successMessage = document.createElement("div");
  successMessage.classList.add("subscribe-success");
  successMessage.textContent = "Thank you for subscribing!";
  successMessage.style.color = "#6E493A";
  successMessage.style.marginTop = "10px";
  successMessage.style.fontWeight = "500";

  // Add message after form
  form.parentNode.appendChild(successMessage);

  // Remove message after delay
  setTimeout(() => {
    successMessage.remove();
  }, 3000);
}
