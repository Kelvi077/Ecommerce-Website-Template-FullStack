document.addEventListener("DOMContentLoaded", function () {
  // -------------------- Mobile Menu Functionality --------------------
  // This section handles the mobile menu toggle and closing when clicking outside
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const mobileMenu = document.querySelector(".mobile-menu");

  // Toggle mobile menu when button is clicked
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

  // -------------------- Authentication Tab Switching --------------------
  // This section handles switching between login and register forms
  const tabButtons = document.querySelectorAll(".tab-btn");
  const authForms = document.querySelectorAll(".auth-form");

  // Add click event listener to each tab button
  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Get the target form ID from the data-target attribute
      const target = this.getAttribute("data-target");

      // Remove active class from all tab buttons and add to the clicked one
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");

      // Hide all auth forms
      authForms.forEach((form) => form.classList.remove("active"));

      // Show the target form
      document.getElementById(target).classList.add("active");
    });
  });

  // -------------------- Form Validation Functions --------------------

  /**
   * Validates an email address format
   * @param {string} email - The email address to validate
   * @returns {boolean} - Whether the email format is valid
   */
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Validates password strength requirements
   * @param {string} password - The password to validate
   * @returns {boolean} - Whether the password meets requirements
   */
  function validatePassword(password) {
    // Password must be at least 8 characters with at least one number and one special character
    const re = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    return re.test(password);
  }

  /**
   * Displays an error message in the specified message container
   * @param {string} containerId - ID of the message container
   * @param {string} message - Error message to display
   */
  function showError(containerId, message) {
    const container = document.getElementById(containerId);
    container.textContent = message;
    container.classList.add("error");
    container.style.display = "block";
  }

  /**
   * Displays a success message in the specified message container
   * @param {string} containerId - ID of the message container
   * @param {string} message - Success message to display
   */
  function showSuccess(containerId, message) {
    const container = document.getElementById(containerId);
    container.textContent = message;
    container.classList.remove("error");
    container.classList.add("success");
    container.style.display = "block";
  }

  /**
   * Clears any messages from the specified container
   * @param {string} containerId - ID of the message container to clear
   */
  function clearMessages(containerId) {
    const container = document.getElementById(containerId);
    container.textContent = "";
    container.style.display = "none";
    container.classList.remove("error", "success");
  }

  // -------------------- Login Form Handling --------------------
  const loginForm = document.getElementById("login-form");

  if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();

      // Clear any previous messages
      clearMessages("login-message");

      // Get form input values
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;
      const rememberMe = document.getElementById("remember")?.checked || false;

      // Basic validation
      if (!email || !password) {
        showError("login-message", "Please enter both email and password.");
        return;
      }

      if (!validateEmail(email)) {
        showError("login-message", "Please enter a valid email address.");
        return;
      }

      // Prepare data for sending to the server
      const loginData = {
        email: email,
        password: password,
        remember: rememberMe,
      };

      // Send login request to the server
      fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "success") {
            // Show success message temporarily
            showSuccess("login-message", "Login successful! Redirecting...");

            // Redirect to homepage or previous page after successful login
            setTimeout(() => {
              const redirectUrl =
                new URLSearchParams(window.location.search).get("redirect") ||
                "/";
              window.location.href = redirectUrl;
            }, 1500);
          } else {
            // Show error message from server
            showError(
              "login-message",
              data.message || "Login failed. Please check your credentials."
            );
          }
        })
        .catch((error) => {
          console.error("Login error:", error);
          showError(
            "login-message",
            "An error occurred during login. Please try again."
          );
        });
    });
  }

  // -------------------- Registration Form Handling --------------------
  const registerForm = document.getElementById("register-form");

  if (registerForm) {
    registerForm.addEventListener("submit", function (event) {
      event.preventDefault();

      // Clear any previous messages
      clearMessages("register-message");

      // Get form input values
      const name = document.getElementById("register-name").value.trim();
      const email = document.getElementById("register-email").value.trim();
      const password = document.getElementById("register-password").value;
      const confirmPassword = document.getElementById(
        "register-confirm-password"
      ).value;
      const agreeTerms = document.getElementById("terms").checked;

      // Form validation
      if (!name || !email || !password || !confirmPassword) {
        showError("register-message", "Please fill in all required fields.");
        return;
      }

      if (!validateEmail(email)) {
        showError("register-message", "Please enter a valid email address.");
        return;
      }

      if (!validatePassword(password)) {
        showError(
          "register-message",
          "Password must be at least 8 characters and include a number and a special character."
        );
        return;
      }

      if (password !== confirmPassword) {
        showError("register-message", "Passwords do not match.");
        return;
      }

      if (!agreeTerms) {
        showError(
          "register-message",
          "You must agree to the Terms & Conditions."
        );
        return;
      }

      // Prepare registration data
      const registrationData = {
        name: name,
        email: email,
        password: password,
      };

      // Send registration request to the server
      fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "success") {
            // Show success message
            showSuccess(
              "register-message",
              "Registration successful! You can now log in."
            );

            // Clear the form
            registerForm.reset();

            // Switch to login tab after successful registration (after a slight delay)
            setTimeout(() => {
              document.querySelector('.tab-btn[data-target="login"]').click();
            }, 2000);
          } else {
            // Show error message from server
            showError(
              "register-message",
              data.message || "Registration failed. Please try again."
            );
          }
        })
        .catch((error) => {
          console.error("Registration error:", error);
          showError(
            "register-message",
            "An error occurred during registration. Please try again."
          );
        });
    });
  }

  // Check if user is already logged in
  fetch("/api/auth/check")
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success" && data.loggedIn) {
        // User is logged in, show a message or redirect
        const loginContainer = document.querySelector(".auth-form-container");
        if (loginContainer) {
          loginContainer.innerHTML = `
              <div class="logged-in-message">
                <h2>Welcome back, ${data.user.name}!</h2>
                <p>You are currently logged in.</p>
                <div class="user-actions">
                  <a href="/" class="auth-button">Go to Home</a>
                  <a href="/profile" class="auth-button">My Profile</a>
                  <button id="logout-btn" class="auth-button secondary">Log Out</button>
                </div>
              </div>
            `;

          // Add event listener to logout button
          const logoutBtn = document.getElementById("logout-btn");
          logoutBtn.addEventListener("click", function () {
            fetch("/api/auth/logout")
              .then((response) => response.json())
              .then((data) => {
                if (data.status === "success") {
                  window.location.reload();
                }
              });
          });
        }
      }
    })
    .catch((error) => {
      console.error("Error checking auth status:", error);
    });

  // -------------------- Cart Count Update --------------------
  // Function to update cart count from the server
  function updateCartCount() {
    fetch("/api/cart-count")
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          // Update all cart count elements
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

  // Initialize cart count on page load
  updateCartCount();
});
