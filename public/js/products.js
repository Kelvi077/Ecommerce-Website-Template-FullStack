document.addEventListener("DOMContentLoaded", function () {
  // Mobile menu functionality
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const mobileMenu = document.querySelector(".mobile-menu");

  mobileMenuBtn.addEventListener("click", function () {
    mobileMenu.classList.toggle("active");
  });

  // Close mobile menu when clicking outside
  document.addEventListener("click", function (event) {
    if (
      !event.target.closest(".mobile-menu") &&
      !event.target.closest(".mobile-menu-btn")
    ) {
      mobileMenu.classList.remove("active");
    }
  });

  // Product filtering functionality
  const productCards = document.querySelectorAll(".product-card");
  const categoryFilter = document.getElementById("category-filter");
  const priceFilter = document.getElementById("price-filter");
  const sortFilter = document.getElementById("sort-filter");
  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-btn");

  // Tab navigation
  const tabButtons = document.querySelectorAll(".tab-btn");
  const productSections = document.querySelectorAll(".product-section");

  // Unified tab button functionality
  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const target = this.getAttribute("data-target");

      // Update active tab
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");

      // Show all sections or filter to specific section
      if (target === "all") {
        productSections.forEach((section) => {
          section.style.display = "block";
        });
      } else {
        productSections.forEach((section) => {
          if (section.id === target.toLowerCase()) {
            section.style.display = "block";
          } else {
            section.style.display = "none";
          }
        });
      }

      // Reset other filters to match
      categoryFilter.value = target === "all" ? "all" : target.toLowerCase();
      filterProducts();
    });
  });

  // Filter products based on selected options
  function filterProducts() {
    const categoryValue = categoryFilter.value.toLowerCase();
    const priceValue = priceFilter.value;
    const searchValue = searchInput.value.toLowerCase();

    productCards.forEach((card) => {
      const category = card.getAttribute("data-category").toLowerCase();
      const price = parseFloat(card.getAttribute("data-price"));
      const title = card
        .querySelector(".product-title")
        .textContent.toLowerCase();

      // Case-insensitive category matching
      let categoryMatch = categoryValue === "all" || category.includes(categoryValue);
      let priceMatch = true;

      // Price range filtering
      if (priceValue === "under-500") {
        priceMatch = price < 500;
      } else if (priceValue === "500-1000") {
        priceMatch = price >= 500 && price <= 1000;
      } else if (priceValue === "1000-2000") {
        priceMatch = price > 1000 && price <= 2000;
      } else if (priceValue === "over-2000") {
        priceMatch = price > 2000;
      }

      // Search text filtering
      const searchMatch = title.includes(searchValue);

      // Show/hide product based on all filters
      if (categoryMatch && priceMatch && searchMatch) {
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
    });
  }

  // Event listeners for filters
  categoryFilter.addEventListener("change", filterProducts);
  priceFilter.addEventListener("change", filterProducts);
  searchBtn.addEventListener("click", filterProducts);
  searchInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      filterProducts();
    }
  });

  // Sort products functionality
  sortFilter.addEventListener("change", function () {
    const sortValue = this.value;
    const productsGrids = document.querySelectorAll(".products-grid");

    productsGrids.forEach((grid) => {
      const products = Array.from(grid.querySelectorAll(".product-card"));

      products.sort((a, b) => {
        if (sortValue === "price-low") {
          return (
            parseFloat(a.getAttribute("data-price")) -
            parseFloat(b.getAttribute("data-price"))
          );
        } else if (sortValue === "price-high") {
          return (
            parseFloat(b.getAttribute("data-price")) -
            parseFloat(a.getAttribute("data-price"))
          );
        } else {
          // For 'featured' and 'newest', just return to original order
          return 0;
        }
      });

      // Remove all products
      products.forEach((product) => product.remove());

      // Re-append in sorted order
      products.forEach((product) => grid.appendChild(product));
    });
  });

  // Quick view functionality
  const quickViewBtns = document.querySelectorAll(".quick-view-btn");
  const quickViewModal = document.querySelector(".quick-view-modal");
  const closeModal = document.querySelector(".close-modal");
  const modalContent = document.querySelector(".modal-product-content");

  quickViewBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const productId = this.getAttribute("data-id");
      const product = this.closest(".product-card");
      const productTitle = product.querySelector(".product-title").textContent;
      const productCategory =
        product.querySelector(".product-category").textContent;
      const productPrice = product.querySelector(".product-price").innerHTML;
      const productImage = product.querySelector(".product-image img").src;
      // Get product description from the hidden div
      const productDescription = product.querySelector(
        ".product-description"
      ).textContent;

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
                data-price="${parseFloat(productPrice.replace('$', ''))}"
                data-image="${productImage.split('/').pop()}"
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

  // Close modal functionality
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

  // Add to cart functionality
  const addToCartBtns = document.querySelectorAll(".add-to-cart-btn");

  addToCartBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      // Extract data attributes from the button
      const productId = this.getAttribute("data-id");
      const name = this.getAttribute("data-name");
      const price = parseFloat(this.getAttribute("data-price"));
      const image = this.getAttribute("data-image");
      const category = this.getAttribute("data-category");
      
      // Call addToCart with extracted data and default quantity of 1
      addToCart(productId, name, price, image, category, 1);
    });
  });

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
    // Prepare the data for the API call
    const cartData = {
      productId: productId,
      name: name,
      price: price,
      image: image,
      category: category,
      quantity: quantity
    };
    
    // Send POST request to add-to-cart API endpoint
    fetch('/api/add-to-cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cartData)
    })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        // If successful, update the cart count and show notification
        updateCartCount();
        showCartNotification();
      } else {
        console.error('Error adding to cart:', data.message);
        alert('There was an error adding this item to your cart. Please try again.');
      }
    })
    .catch(error => {
      console.error('Error adding to cart:', error);
      alert('There was an error adding this item to your cart. Please try again.');
    });
  }

  /**
   * Update the cart count in the header by fetching from server
   */
  function updateCartCount() {
    // Fetch cart count from the server
    fetch('/api/cart-count')
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          // Update all cart count elements
          const cartCountElements = document.querySelectorAll(".cart-count");
          cartCountElements.forEach((element) => {
            element.textContent = data.count;
          });
        } else {
          console.error('Error fetching cart count:', data.message);
        }
      })
      .catch(error => {
        console.error('Error fetching cart count:', error);
      });
  }

  /**
   * Show notification that item was added to cart
   */
  function showCartNotification() {
    const notification = document.querySelector(".cart-notification");
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

  // Initialize cart count on page load
  updateCartCount();

  // Subscribe form functionality
  const subscribeForm = document.querySelector(".subscribe-form");

  subscribeForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const emailInput = this.querySelector('input[type="email"]');
    const email = emailInput.value;

    // Simple validation
    if (email) {
      alert(`Thank you for subscribing with: ${email}`);
      emailInput.value = "";
    }
  });
});