// Remove the first delete button handler that's not sending the DELETE request
// Keep only the second one that correctly communicates with the server

document.addEventListener("DOMContentLoaded", () => {
    // Mobile sidebar toggle
    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebar = document.getElementById("sidebar");
  
    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener("click", function () {
        sidebar.classList.toggle("active");
      });
    }
  
    // Close sidebar when clicking outside of it (on mobile)
    document.addEventListener("click", function (event) {
      if (sidebar && sidebarToggle) {
        const isClickInside =
          sidebar.contains(event.target) || sidebarToggle.contains(event.target);
  
        if (
          !isClickInside &&
          sidebar.classList.contains("active") &&
          window.innerWidth <= 768
        ) {
          sidebar.classList.remove("active");
        }
      }
    });
  
    // Make table rows interactive
    const tableRows = document.querySelectorAll("tbody tr");
    tableRows.forEach((row) => {
      row.addEventListener("click", function (e) {
        // Don't trigger if clicking on buttons
        if (e.target.tagName !== "BUTTON") {
          const currentActive = document.querySelector("tr.active");
          if (currentActive) {
            currentActive.classList.remove("active");
          }
          this.classList.add("active");
        }
      });
    });
  
    // Form submission enhancement
    const productForm = document.querySelector(".product-form form");
    if (productForm) {
      productForm.addEventListener("submit", function (e) {
        // In a real app, you might want to handle form submission with AJAX
        // This is just for demo purposes
        const formData = new FormData(this);
        const name = formData.get("name");
  
        // Show notification after form submission (simulated)
        setTimeout(() => {
          showNotification(`Product "${name}" added successfully!`, "success");
        }, 500);
      });
    }
  
    // Image preview functionality
    const imageInput = document.getElementById("image");
    if (imageInput) {
      imageInput.addEventListener("change", function () {
        const file = this.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function (e) {
            // Create preview if it doesn't exist
            let preview = document.getElementById("imagePreview");
            if (!preview) {
              preview = document.createElement("div");
              preview.id = "imagePreview";
              preview.className = "image-preview";
              imageInput.parentNode.appendChild(preview);
            }
  
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Preview" />
                <button type="button" id="removeImage">×</button>
              `;
  
            document
              .getElementById("removeImage")
              .addEventListener("click", function (e) {
                e.preventDefault();
                imageInput.value = "";
                preview.remove();
              });
          };
          reader.readAsDataURL(file);
        }
      });
    }
  
    // Helper function to show notifications
    function showNotification(message, type = "success") {
      const notification = document.createElement("div");
      notification.className = "notification";
      notification.innerHTML = `<p>${message}</p>`;
  
      // Adjust color based on type
      if (type === "error") {
        notification.style.backgroundColor = "#F44336";
      }
  
      document.body.appendChild(notification);
  
      // Fade in
      setTimeout(() => {
        notification.style.opacity = "1";
      }, 10);
  
      // Fade out and remove after 3 seconds
      setTimeout(() => {
        notification.style.opacity = "0";
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, 3000);
    }
  
    // Check if sidebar should be visible on page load
    function checkSidebarVisibility() {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove("active");
      } else {
        // Force sidebar to be visible on larger screens
        sidebar.style.display = "block";
      }
    }
  
    // Call on page load and when window is resized
    if (sidebar) {
      checkSidebarVisibility();
      window.addEventListener("resize", checkSidebarVisibility);
    }
  
    // FIXED DELETE BUTTON FUNCTIONALITY
    const deleteButtons = document.querySelectorAll(".delete-btn");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const productId = button.getAttribute("data-id");
        const confirmDelete = confirm(
          "Are you sure you want to delete this product?"
        );
        if (!confirmDelete) return;
  
        fetch(`/admin/products/delete/${productId}`, {
          method: "DELETE",
        }).then((res) => {
          if (res.ok) {
            // Show success notification
            showNotification("Product deleted successfully!", "success");
            // Remove the row from the table
            button.closest("tr").remove();
          } else {
            showNotification("Failed to delete product.", "error");
          }
        })
        .catch(error => {
          console.error("Error deleting product:", error);
          showNotification("Error connecting to server.", "error");
        });
      });
    });
  });
  
  // Keep the rest of your frontend code for the store functionality

// DOM Elements
const mobileMenu = document.getElementById('mobile-menu');
const navMenu = document.querySelector('.nav-menu');
const cartIcon = document.getElementById('cart-icon');
const cartSidebar = document.getElementById('cart-sidebar');
const closeCart = document.getElementById('close-cart');
const cartItems = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotalPrice = document.getElementById('cart-total-price');
const featuredProducts = document.getElementById('featured-products');
const allProducts = document.getElementById('all-products');
const loadMoreBtn = document.getElementById('load-more-btn');
const filterBtns = document.querySelectorAll('.filter-btn');
const newsletterForm = document.getElementById('newsletter-form');

// State Management
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let products = [];
let currentPage = 1;
let currentFilter = 'all';
const productsPerPage = 8;

// Toggle Mobile Menu
mobileMenu.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    navMenu.classList.toggle('active');
    
    if (mobileMenu.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
        const bars = mobileMenu.querySelectorAll('.bar');
        bars[0].style.transform = 'rotate(-45deg) translate(-5px, 6px)';
        bars[1].style.opacity = '0';
        bars[2].style.transform = 'rotate(45deg) translate(-5px, -6px)';
    } else {
        document.body.style.overflow = '';
        const bars = mobileMenu.querySelectorAll('.bar');
        bars[0].style.transform = '';
        bars[1].style.opacity = '1';
        bars[2].style.transform = '';
    }
});

// Cart Functionality
cartIcon.addEventListener('click', (e) => {
    e.preventDefault();
    cartSidebar.classList.add('active');
    document.body.style.overflow = 'hidden';
});

closeCart.addEventListener('click', () => {
    cartSidebar.classList.remove('active');
    document.body.style.overflow = '';
});

// Close cart when clicking outside
document.addEventListener('click', (e) => {
    if (cartSidebar.classList.contains('active') && 
        !cartSidebar.contains(e.target) && 
        e.target !== cartIcon && 
        !cartIcon.contains(e.target)) {
        cartSidebar.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Update Cart UI
function updateCart() {
    // Update cart count
    cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
    
    // Update cart items
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
    } else {
        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.classList.add('cart-item');
            cartItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-info">
                    <h4 class="cart-item-title">${item.name}</h4>
                    <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn minus" data-id="${item.id}">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-id="${item.id}">
                        <button class="quantity-btn plus" data-id="${item.id}">+</button>
                    </div>
                </div>
                <div class="remove-item" data-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });
    }
    
    // Update cart total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalPrice.textContent = `$${total.toFixed(2)}`;
    
    // Save cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Add event listeners to cart item buttons
    attachCartItemEvents();
}

// Attach events to cart item buttons
function attachCartItemEvents() {
    // Quantity decrease
    document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const item = cart.find(item => item.id === id);
            if (item && item.quantity > 1) {
                item.quantity--;
                updateCart();
            }
        });
    });
    
    // Quantity increase
    document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const item = cart.find(item => item.id === id);
            if (item) {
                item.quantity++;
                updateCart();
            }
        });
    });
    
    // Quantity input change
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', () => {
            const id = input.dataset.id;
            const value = parseInt(input.value);
            if (value < 1) {
                input.value = 1;
            }
            const item = cart.find(item => item.id === id);
            if (item) {
                item.quantity = parseInt(input.value);
                updateCart();
            }
        });
    });
    
    // Remove item
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            cart = cart.filter(item => item.id !== id);
            updateCart();
        });
    });
}

// Add to Cart Function
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    updateCart();
    
    // Show cart
    cartSidebar.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Display Products with Filtering and Pagination
function displayProducts() {
    // Filter products
    let filteredProducts = products;
    if (currentFilter !== 'all') {
        filteredProducts = products.filter(product => product.category === currentFilter);
    }
    
    // Paginate
    const start = (currentPage - 1) * productsPerPage;
    const end = start + productsPerPage;
    const paginatedProducts = filteredProducts.slice(start, end);
    
    // Clear previous products if it's the first page
    if (currentPage === 1) {
        allProducts.innerHTML = '';
    }
    
    // Display products
    paginatedProducts.forEach(product => {
        const productCard = createProductCard(product);
        allProducts.appendChild(productCard);
    });
    
    // Hide or show load more button
    if (end >= filteredProducts.length) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'inline-block';
    }
}

// Create Product Card
function createProductCard(product) {
    const productCard = document.createElement('div');
    productCard.classList.add('product-card');
    
    productCard.innerHTML = `
        <div class="product-img">
            <img src="${product.image}" alt="${product.name}">
            <div class="product-tags">
                ${product.isNew ? '<span class="product-tag tag-new">New</span>' : ''}
                ${product.isSale ? '<span class="product-tag tag-sale">Sale</span>' : ''}
            </div>
            <div class="quick-view">Quick View</div>
        </div>
        <div class="product-info">
            <div class="product-category">${capitalizeFirstLetter(product.category)}</div>
            <h3 class="product-title">${product.name}</h3>
            <div class="product-price">
                <span class="current-price">$${product.price.toFixed(2)}</span>
                ${product.oldPrice ? `<span class="old-price">$${product.oldPrice.toFixed(2)}</span>` : ''}
            </div>
            <div class="product-rating">
                <div class="stars">
                    ${getStars(product.rating)}
                </div>
                <span class="rating-count">(${product.ratingCount})</span>
            </div>
            <div class="product-buttons">
                <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
                <button class="add-to-wishlist" data-id="${product.id}">
                    <i class="far fa-heart"></i>
                </button>
            </div>
        </div>
    `;
    
    // Add event listener to Add to Cart button
    productCard.querySelector('.add-to-cart').addEventListener('click', () => {
        addToCart(product);
    });
    
    // Add event listener to Quick View button
    productCard.querySelector('.quick-view').addEventListener('click', () => {
        showQuickView(product);
    });
    
    return productCard;
}

// Show Quick View Modal (Placeholder function - would be implemented in a real application)
function showQuickView(product) {
    alert(`Quick view for ${product.name} - This would open a modal in a real application`);
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Admin Access Control (If admin link is clicked)
document.querySelector('.admin-link a').addEventListener('click', (e) => {
    // In a real application, you would check if the user is logged in as admin
    // For demonstration, we'll simulate a login prompt
    const isAdmin = confirm('This area is restricted to administrators. Are you an administrator?');
    
    if (!isAdmin) {
        e.preventDefault();
        alert('Access denied. Please log in as an administrator.');
    }
});

// API communication with admin dashboard (Placeholder function)
function syncWithAdminDashboard() {
    // This function would be used to fetch updated product data from the admin dashboard
    // In a real application, this might involve WebSockets or periodic API calls
    console.log('Syncing with admin dashboard...');
    
    // Example of how you might listen for product updates from the admin dashboard
    window.addEventListener('adminProductUpdate', (event) => {
        // Update the products array with new data
        const updatedProduct = event.detail;
        const index = products.findIndex(p => p.id === updatedProduct.id);
        
        if (index !== -1) {
            products[index] = updatedProduct;
        } else {
            products.push(updatedProduct);
        }
        
        // Refresh displayed products
        displayFeaturedProducts();
        displayProducts();
    });
}

// Initialize Application
window.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateCart();
    syncWithAdminDashboard(); // Uncomment when implementing real admin integration
});



// delete button
document.addEventListener("DOMContentLoaded", () => {
  const deleteButtons = document.querySelectorAll(".delete-btn");

  deleteButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const productId = button.getAttribute("data-id");
      const confirmDelete = confirm(
        "Are you sure you want to delete this product?"
      );
      if (!confirmDelete) return;

      fetch(`/admin/products/delete/${productId}`, {
        method: "DELETE",
      }).then((res) => {
        if (res.ok) {
          window.location.reload(); // Refresh to reflect changes
        } else {
          alert("Failed to delete product.");
        }
      });
    });
  });
});
