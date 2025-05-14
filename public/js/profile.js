// Modified profile.js file to match your database structure
document.addEventListener("DOMContentLoaded", () => {
  // Mobile menu toggle
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const mobileMenu = document.querySelector(".mobile-menu");

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("active");
    });
  }

  // Profile navigation functionality
  const profileNavLinks = document.querySelectorAll(
    ".profile-nav a[data-section]"
  );
  const profileSections = document.querySelectorAll(".profile-section");

  profileNavLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      // Remove active class from all links and sections
      profileNavLinks.forEach((item) => item.classList.remove("active"));
      profileSections.forEach((section) => section.classList.remove("active"));

      // Add active class to clicked link
      link.classList.add("active");

      // Show the corresponding section
      const sectionId = link.getAttribute("data-section");
      document.getElementById(sectionId).classList.add("active");

      // Update URL hash without scrolling
      history.pushState(null, null, link.getAttribute("href"));
    });
  });

  // Handle hash changes for direct links
  function handleHash() {
    const hash = window.location.hash;
    if (hash) {
      const targetLink = document.querySelector(
        `.profile-nav a[href="${hash}"]`
      );
      if (targetLink) {
        targetLink.click();
      }
    }
  }

  // Check hash on page load
  handleHash();

  // Listen for hash changes
  window.addEventListener("hashchange", handleHash);

  // Notification system
  const notification = document.getElementById("notification");
  const notificationMessage = document.getElementById("notification-message");

  function showNotification(message, isError = false) {
    notificationMessage.textContent = message;
    notification.classList.add("active");

    if (isError) {
      notification.classList.add("error");
    } else {
      notification.classList.remove("error");
    }

    setTimeout(() => {
      notification.classList.remove("active");
      notification.classList.remove("error");
    }, 3000);
  }

  // Load user data
  async function loadUserData() {
    try {
      const response = await fetch("/api/user/profile");
      const data = await response.json();

      if (data.status === "success") {
        const user = data.user;

        // Update user info in sidebar
        document.getElementById("username").textContent =
          `${user.first_name} ${user.last_name}`;
        document.getElementById("user-email").textContent = user.email;
        document.getElementById("greeting-name").textContent = user.first_name;

        // Fill in account details form
        document.getElementById("first-name").value = user.first_name || "";
        document.getElementById("last-name").value = user.last_name || "";
        document.getElementById("display-name").value =
          user.display_name || `${user.first_name} ${user.last_name}`;
        document.getElementById("email").value = user.email || "";

        // Update dashboard stats
        if (data.stats) {
          document.getElementById("orders-count").textContent =
            data.stats.ordersCount || 0;
          document.getElementById("wishlist-count").textContent =
            data.stats.wishlistCount || 0;
          document.getElementById("addresses-count").textContent =
            data.stats.addressesCount || 0;
        }
      } else {
        showNotification("Failed to load user data", true);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      showNotification("Failed to load user data", true);
    }
  }

  // Load orders (unchanged)
  async function loadOrders() {
    try {
      const response = await fetch("/api/user/orders");
      const data = await response.json();

      const ordersList = document.getElementById("orders-list");
      const dashboardOrders = document.getElementById(
        "dashboard-recent-orders"
      );

      if (data.status === "success" && data.orders.length > 0) {
        // Sort orders by date (newest first)
        const sortedOrders = data.orders.sort(
          (a, b) => new Date(b.order_date) - new Date(a.order_date)
        );

        // Create HTML for all orders
        const ordersHTML = sortedOrders
          .map(
            (order) => `
                    <div class="order-item">
                        <div class="order-header">
                            <div class="order-id">
                                <h4>Order #${order.id}</h4>
                                <p class="order-date">${new Date(order.order_date).toLocaleDateString()}</p>
                            </div>
                            <div class="order-status ${order.status.toLowerCase()}">
                                <span>${order.status}</span>
                            </div>
                        </div>
                        <div class="order-details">
                            <div class="order-items">
                                <p><strong>Items:</strong> ${order.items.length}</p>
                                <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
                            </div>
                            <a href="#" class="btn-sm view-order" data-id="${order.id}">View Details</a>
                        </div>
                    </div>
                `
          )
          .join("");

        ordersList.innerHTML = ordersHTML;

        // Show only 3 recent orders in dashboard
        const recentOrdersHTML = sortedOrders
          .slice(0, 3)
          .map(
            (order) => `
                    <div class="recent-order-item">
                        <div class="order-info">
                            <p class="order-id">Order #${order.id}</p>
                            <p class="order-date">${new Date(order.order_date).toLocaleDateString()}</p>
                        </div>
                        <div class="order-status ${order.status.toLowerCase()}">
                            <span>${order.status}</span>
                        </div>
                        <p class="order-total">$${order.total.toFixed(2)}</p>
                    </div>
                `
          )
          .join("");

        dashboardOrders.innerHTML = recentOrdersHTML;

        // Add event listeners for view order buttons
        document.querySelectorAll(".view-order").forEach((button) => {
          button.addEventListener("click", (e) => {
            e.preventDefault();
            const orderId = button.getAttribute("data-id");
            viewOrderDetails(orderId);
          });
        });
      } else {
        ordersList.innerHTML = '<p class="no-data">You have no orders yet.</p>';
        dashboardOrders.innerHTML =
          '<p class="no-data">You have no recent orders.</p>';
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      document.getElementById("orders-list").innerHTML =
        '<p class="error-message">Failed to load orders. Please try again later.</p>';
      document.getElementById("dashboard-recent-orders").innerHTML =
        '<p class="error-message">Failed to load recent orders.</p>';
    }
  }

  // View order details modal
  function viewOrderDetails(orderId) {
    // Implementation for viewing order details
    console.log(`Viewing order details for order #${orderId}`);
    // This would typically open a modal with detailed order information
  }

  // Load addresses - UPDATED FOR NEW SCHEMA
  async function loadAddresses() {
    try {
      const response = await fetch("/api/user/addresses");
      const data = await response.json();

      const addressesList = document.getElementById("addresses-list");

      if (data.status === "success" && data.addresses.length > 0) {
        const addressesHTML = data.addresses
          .map(
            (address) => `
                    <div class="address-card${address.is_default ? " default" : ""}">
                        ${address.is_default ? '<div class="default-badge">Default</div>' : ""}
                        <h4>${address.name || "My Address"}</h4>
                        <p>${address.address || ""}</p>
                        <p>${address.city || ""}${address.city && address.postal_code ? ", " : ""}${address.postal_code || ""}</p>
                        <p>${address.country || ""}</p>
                        <div class="address-actions">
                            <button class="btn-sm edit-address" data-id="${address.id}">Edit</button>
                            <button class="btn-sm delete-address" data-id="${address.id}">Delete</button>
                            ${!address.is_default ? `<button class="btn-sm set-default-address" data-id="${address.id}">Set as Default</button>` : ""}
                        </div>
                    </div>
                `
          )
          .join("");

        addressesList.innerHTML = addressesHTML;

        // Add event listeners for address actions
        document.querySelectorAll(".edit-address").forEach((button) => {
          button.addEventListener("click", () => {
            const addressId = button.getAttribute("data-id");
            editAddress(addressId);
          });
        });

        document.querySelectorAll(".delete-address").forEach((button) => {
          button.addEventListener("click", () => {
            const addressId = button.getAttribute("data-id");
            deleteAddress(addressId);
          });
        });

        document.querySelectorAll(".set-default-address").forEach((button) => {
          button.addEventListener("click", () => {
            const addressId = button.getAttribute("data-id");
            setDefaultAddress(addressId);
          });
        });
      } else {
        addressesList.innerHTML =
          '<p class="no-data">You have no saved addresses.</p>';
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
      document.getElementById("addresses-list").innerHTML =
        '<p class="error-message">Failed to load addresses. Please try again later.</p>';
    }
  }

  // Handle address actions
  function editAddress(addressId) {
    // Get the specific address data to populate the form
    fetch(`/api/user/address/${addressId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          const address = data.address;

          // Populate the address form
          document.getElementById("address-name").value = address.name || "";
          document.getElementById("address").value = address.address || "";
          document.getElementById("city").value = address.city || "";
          document.getElementById("postal-code").value =
            address.postal_code || "";
          document.getElementById("country").value = address.country || "";
          document.getElementById("default-address").checked =
            address.is_default || false;

          // Change the form action to update instead of add
          const addressForm = document.getElementById("address-form");
          addressForm.dataset.mode = "edit";
          addressForm.dataset.addressId = addressId;

          // Change button text
          const submitButton = addressForm.querySelector(
            'button[type="submit"]'
          );
          submitButton.textContent = "Update Address";

          // Scroll to the form
          document
            .querySelector(".add-address")
            .scrollIntoView({ behavior: "smooth" });
        } else {
          showNotification("Failed to load address details", true);
        }
      })
      .catch((error) => {
        console.error("Error loading address details:", error);
        showNotification("Failed to load address details", true);
      });
  }

  function deleteAddress(addressId) {
    if (confirm("Are you sure you want to delete this address?")) {
      fetch(`/api/user/address/${addressId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "success") {
            showNotification("Address deleted successfully");
            loadAddresses(); // Reload addresses

            // Update address count in dashboard
            const currentCount = parseInt(
              document.getElementById("addresses-count").textContent || "0"
            );
            document.getElementById("addresses-count").textContent = Math.max(
              0,
              currentCount - 1
            );
          } else {
            showNotification("Failed to delete address", true);
          }
        })
        .catch((error) => {
          console.error("Error deleting address:", error);
          showNotification("Failed to delete address", true);
        });
    }
  }

  function setDefaultAddress(addressId) {
    fetch(`/api/user/address/${addressId}/default`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          showNotification("Default address updated");
          loadAddresses(); // Reload addresses
        } else {
          showNotification("Failed to update default address", true);
        }
      })
      .catch((error) => {
        console.error("Error updating default address:", error);
        showNotification("Failed to update default address", true);
      });
  }

  // Load wishlist (unchanged)
  async function loadWishlist() {
    try {
      const response = await fetch("/api/user/wishlist");
      const data = await response.json();

      const wishlistProducts = document.getElementById("wishlist-products");

      if (data.status === "success" && data.wishlist.length > 0) {
        const wishlistHTML = data.wishlist
          .map(
            (item) => `
                    <div class="wishlist-product">
                        <div class="product-image">
                            <img src="${item.image && item.image.startsWith("/") ? item.image : "/images/" + item.image}" alt="${item.name}">
                        </div>
                        <div class="product-details">
                            <h4>${item.name}</h4>
                            <p class="price">$${item.price.toFixed(2)}</p>
                            <div class="wishlist-actions">
                                <button class="btn-sm add-to-cart" data-id="${item.id}">Add to Cart</button>
                                <button class="btn-sm remove-from-wishlist" data-id="${item.id}">Remove</button>
                            </div>
                        </div>
                    </div>
                `
          )
          .join("");

        wishlistProducts.innerHTML = wishlistHTML;

        // Add event listeners for wishlist actions
        document.querySelectorAll(".add-to-cart").forEach((button) => {
          button.addEventListener("click", () => {
            const productId = button.getAttribute("data-id");
            addToCart(productId);
          });
        });

        document.querySelectorAll(".remove-from-wishlist").forEach((button) => {
          button.addEventListener("click", () => {
            const productId = button.getAttribute("data-id");
            removeFromWishlist(productId);
          });
        });
      } else {
        wishlistProducts.innerHTML =
          '<p class="no-data">Your wishlist is empty.</p>';
      }
    } catch (error) {
      console.error("Error loading wishlist:", error);
      document.getElementById("wishlist-products").innerHTML =
        '<p class="error-message">Failed to load wishlist. Please try again later.</p>';
    }
  }

  // Handle wishlist actions (unchanged)
  function addToCart(productId) {
    fetch("/api/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: productId,
        quantity: 1,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          showNotification("Product added to cart");
          // Update cart count in header if needed
          if (data.cartCount) {
            document.querySelectorAll(".cart-count").forEach((el) => {
              el.textContent = data.cartCount;
            });
          }
        } else {
          showNotification("Failed to add product to cart", true);
        }
      })
      .catch((error) => {
        console.error("Error adding to cart:", error);
        showNotification("Failed to add product to cart", true);
      });
  }

  function removeFromWishlist(productId) {
    fetch(`/api/user/wishlist/${productId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          showNotification("Product removed from wishlist");
          loadWishlist(); // Reload wishlist

          // Update wishlist count in dashboard
          const currentCount = parseInt(
            document.getElementById("wishlist-count").textContent || "0"
          );
          document.getElementById("wishlist-count").textContent = Math.max(
            0,
            currentCount - 1
          );
        } else {
          showNotification("Failed to remove product from wishlist", true);
        }
      })
      .catch((error) => {
        console.error("Error removing from wishlist:", error);
        showNotification("Failed to remove product from wishlist", true);
      });
  }

  // Handle form submissions - UPDATED FOR NEW SCHEMA
  const addressForm = document.getElementById("address-form");
  if (addressForm) {
    addressForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const formData = {
        name: document.getElementById("address-name").value,
        address: document.getElementById("address").value,
        city: document.getElementById("city").value,
        postal_code: document.getElementById("postal-code").value,
        country: document.getElementById("country").value,
        is_default: document.getElementById("default-address").checked,
      };

      // Check if we're in edit mode
      const isEditMode = addressForm.dataset.mode === "edit";
      const addressId = addressForm.dataset.addressId;

      let url = "/api/user/address/add";
      let method = "POST";

      if (isEditMode) {
        url = `/api/user/address/${addressId}/update`;
        method = "PUT";
      }

      fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "success") {
            showNotification(
              isEditMode
                ? "Address updated successfully"
                : "Address added successfully"
            );
            addressForm.reset();

            // Reset form to add mode
            if (isEditMode) {
              addressForm.dataset.mode = "add";
              delete addressForm.dataset.addressId;

              // Reset button text
              const submitButton = addressForm.querySelector(
                'button[type="submit"]'
              );
              submitButton.textContent = "Save Address";
            }

            loadAddresses(); // Reload addresses

            // Update address count in dashboard (only if adding new)
            if (!isEditMode) {
              const currentCount = parseInt(
                document.getElementById("addresses-count").textContent || "0"
              );
              document.getElementById("addresses-count").textContent =
                currentCount + 1;
            }
          } else {
            showNotification(
              `Failed to ${isEditMode ? "update" : "add"} address`,
              true
            );
          }
        })
        .catch((error) => {
          console.error(
            `Error ${isEditMode ? "updating" : "adding"} address:`,
            error
          );
          showNotification(
            `Failed to ${isEditMode ? "update" : "add"} address`,
            true
          );
        });
    });
  }

  // Account form handling (unchanged)
  const accountForm = document.getElementById("account-form");
  if (accountForm) {
    accountForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const formData = {
        first_name: document.getElementById("first-name").value,
        last_name: document.getElementById("last-name").value,
        display_name: document.getElementById("display-name").value,
        email: document.getElementById("email").value,
      };

      const currentPassword = document.getElementById("current-password").value;
      const newPassword = document.getElementById("new-password").value;
      const confirmPassword = document.getElementById("confirm-password").value;

      // Add password fields only if user is trying to change password
      if (currentPassword && newPassword) {
        if (newPassword !== confirmPassword) {
          showNotification("New passwords do not match", true);
          return;
        }

        formData.current_password = currentPassword;
        formData.new_password = newPassword;
      }

      fetch("/api/user/account/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "success") {
            showNotification("Account details updated successfully");

            // Clear password fields
            document.getElementById("current-password").value = "";
            document.getElementById("new-password").value = "";
            document.getElementById("confirm-password").value = "";

            // Update user info in sidebar
            document.getElementById("username").textContent =
              `${formData.first_name} ${formData.last_name}`;
            document.getElementById("user-email").textContent = formData.email;
            document.getElementById("greeting-name").textContent =
              formData.first_name;
          } else {
            showNotification(
              data.message || "Failed to update account details",
              true
            );
          }
        })
        .catch((error) => {
          console.error("Error updating account details:", error);
          showNotification("Failed to update account details", true);
        });
    });
  }

  // Initialize data loading
  loadUserData();
  loadOrders();
  loadAddresses();
  loadWishlist();
});
