const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const connection = require("./db"); // Import the connection from db.js
const multer = require("multer");
const path = require("path");
const session = require("express-session");
const nodemailer = require("nodemailer");
const cookieParser = require("cookie-parser");
// Removed csrf require

// SECURITY: Add helmet for setting secure HTTP headers
const helmet = require("helmet");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        // Allow inline scripts and styles for convenience (consider removing for production)
        "script-src": [
          "'self'",
          "'unsafe-inline'",
          "https://cdnjs.cloudflare.com",
        ],
        "style-src": [
          "'self'",
          "'unsafe-inline'",
          "https://cdnjs.cloudflare.com",
        ],
      },
    },
  })
);

// SECURITY: Add rate limiting to prevent brute force attacks
const rateLimit = require("express-rate-limit");
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per window
  message: "Too many login attempts, please try again after 15 minutes",
});

// SECURITY: Add CORS configuration to restrict which domains can access your API
const cors = require("cors");
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*", // In production, replace with your actual domain
    credentials: true, // Allow cookies to be sent with requests
  })
);

// Import the routes
const cartRoutes = require("./cartRoutes");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const receiptRoutes = require("./receipt");

// Register view engine
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// SECURITY: Improved session configuration
// First, set up cookieParser with your session secret
const sessionSecret = process.env.SESSION_SECRET || "your-fallback-secret";
app.use(cookieParser(sessionSecret));

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false, // Changed to false to comply with GDPR
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      httpOnly: true, // SECURITY: Prevents JavaScript access to cookies
      sameSite: "lax", // SECURITY: Provides some CSRF protection
      // Enable the secure flag in production (requires HTTPS)
      secure: process.env.NODE_ENV === "production",
    },
  })
);
// Use the routes
app.use("/api", cartRoutes);

// Apply rate limiting to auth routes
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", receiptRoutes);

app.get("/", (req, res) => {
  connection.query("SELECT * FROM products", (err, results) => {
    if (err) {
      console.error("Error fetching products:", err);
      return res.render("index", {
        title: "Home",
        products: [],
        user: req.session.userId ? { name: req.session.name } : null,
      });
    }
    res.render("index", {
      path: req.path,
      title: "Home",
      products: results,
      user: req.session.userId ? { name: req.session.name } : null,
    });
  });
});

app.get("/about", (req, res) => {
  res.render("about", {
    path: req.path,
    title: "About",
    user: req.session.userId ? { name: req.session.name } : null,
  });
});

app.get("/login", (req, res) => {
  // If already logged in, redirect to home
  if (req.session.userId) {
    return res.redirect("/");
  }
  res.render("login", {
    path: req.path,
    title: "Login",
    user: null,
  });
});

app.get("/contact", (req, res) => {
  res.render("contact", {
    path: req.path,
    title: "Contact",
    user: req.session.userId ? { name: req.session.name } : null,
  });
});

app.get("/cart", (req, res) => {
  // Get cart items based on whether user is logged in
  if (req.session.userId) {
    // Get from database if logged in
    connection.query(
      `SELECT ci.*, 
      IFNULL(ci.cart_image, p.image) as cart_image 
      FROM cart_items ci 
      LEFT JOIN products p ON ci.product_id = p.id 
      WHERE ci.customer_id = ?`,
      [req.session.userId],
      (err, cartItems) => {
        if (err) {
          console.error("Error fetching cart items:", err);
          return res.render("cart", {
            title: "Cart",
            cartItems: [],
            user: { name: req.session.name },
          });
        }

        // Process cart items to ensure image paths are correct
        cartItems = cartItems.map((item) => {
          // Normalize image path
          if (item.cart_image) {
            // If image path doesn't include /images/ and doesn't start with /
            if (
              !item.cart_image.includes("/images/") &&
              !item.cart_image.startsWith("/")
            ) {
              item.cart_image = `/images/${item.cart_image}`;
            }
          } else {
            // Fallback to placeholder
            item.cart_image = "/images/placeholder.jpg";
          }
          return item;
        });

        res.render("cart", {
          path: req.path,
          title: "Cart",
          cartItems: cartItems,
          user: { name: req.session.name },
        });
      }
    );
  } else {
    // Use session cart if not logged in
    let sessionCart = req.session.cart || [];

    // If session cart has items but no proper image paths, let's fetch them
    if (sessionCart.length > 0) {
      // Get all product IDs from the cart
      const productIds = sessionCart.map((item) => item.productId);

      if (productIds.length > 0) {
        connection.query(
          "SELECT id, image FROM products WHERE id IN (?)",
          [productIds],
          (err, products) => {
            if (err) {
              console.error("Error fetching product images:", err);
              return res.render("cart", {
                title: "Cart",
                cartItems: sessionCart,
                user: null,
              });
            }

            // Create a map of product IDs to image paths
            const productImages = {};
            products.forEach((product) => {
              productImages[product.id] = `/images/${product.image}`;
            });

            // Update cart items with proper image paths
            sessionCart = sessionCart.map((item, index) => {
              // Add id if not present (needed for removing items)
              if (!item.id) {
                item.id = index;
              }

              // Ensure product_name is set for consistency with DB cart
              if (!item.product_name && item.name) {
                item.product_name = item.name;
              }

              // Fix image path
              if (productImages[item.productId]) {
                item.cart_image = productImages[item.productId];
              } else if (item.image) {
                // If item has an image property but no path correction
                if (
                  !item.image.includes("/images/") &&
                  !item.image.startsWith("/")
                ) {
                  item.cart_image = `/images/${item.image}`;
                } else {
                  item.cart_image = item.image;
                }
              } else {
                item.cart_image = "/images/placeholder.jpg";
              }

              return item;
            });

            req.session.cart = sessionCart;
            res.render("cart", {
              path: req.path,
              title: "Cart",
              cartItems: sessionCart,
              user: null,
            });
          }
        );
      } else {
        res.render("cart", {
          path: req.path,
          title: "Cart",
          cartItems: sessionCart,
          user: null,
        });
      }
    } else {
      res.render("cart", {
        path: req.path,
        title: "Cart",
        cartItems: sessionCart,
        user: null,
      });
    }
  }
});

// Profile page for logged-in users
app.get("/profile", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login?redirect=/profile");
  }

  connection.query(
    "SELECT * FROM customers WHERE id = ?",
    [req.session.userId],
    (err, results) => {
      if (err || results.length === 0) {
        console.error("Error fetching user profile:", err);
        return res.redirect("/");
      }

      const user = results[0];
      res.render("profile", {
        path: req.path,
        title: "My Profile",
        user: user,
      });
    }
  );
});

// Show admin login page
app.get("/admin/login", (req, res) => {
  res.render("admin-login", {
    title: "Admin Login",
  });
});

app.post("/admin/login", authLimiter, (req, res) => {
  const { username, password } = req.body;

  // SECURITY: Use constant-time comparison to prevent timing attacks
  const safeCompare = (a, b) => {
    if (typeof a !== "string" || typeof b !== "string") {
      return false;
    }

    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  };

  if (
    safeCompare(username, process.env.ADMIN_USERNAME) &&
    safeCompare(password, process.env.ADMIN_PASSWORD)
  ) {
    req.session.loggedIn = true;
    res.redirect("/admin/dashboard");
  } else {
    res.send("Invalid username or password");
  }
});

app.get("/admin/dashboard", (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect("/admin/login");
  }

  // Fetch and render dashboard if logged in
  connection.query("SELECT * FROM products", (err, results) => {
    if (err) {
      console.error("Error fetching products:", err);
      return res.status(500).send("Database error");
    }
    res.render("admin-dashboard", {
      title: "Admin Dashboard",
      products: results,
    });
  });
});

app.get("/admin/orders", (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect("/admin/login");
  }

  // Fetch and render dashboard if logged in
  connection.query("SELECT * FROM products", (err, results) => {
    if (err) {
      console.error("Error fetching products:", err);
      return res.status(500).send("Database error");
    }
    res.render("admin-orders", {
      title: "Admin Orders",
      products: results,
    });
  });
});

app.get("/admin/dashboard/products", (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect("/admin/login");
  }
  res.render("admin-dashboard-products", {
    title: "Admin products",
  });
});

// Admin logout
app.get("/admin/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Error logging out");
    }
    res.redirect("/");
  });
});

// Set up file storage using multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images"); // Upload images to 'public/images' folder
  },
  filename: (req, file, cb) => {
    // SECURITY: Sanitize filenames to prevent directory traversal attacks
    const sanitizedFilename = path
      .basename(file.originalname)
      .replace(/[^a-zA-Z0-9_.-]/g, "_");
    const ext = path.extname(sanitizedFilename); // Get file extension
    cb(null, Date.now() + ext); // Use current timestamp as filename
  },
});

// SECURITY: Add file validation to multer
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Initialize multer with storage configuration and file filter
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
  },
});

// Handle product image upload and saving new product to the database
app.post("/admin/products/add", upload.single("image"), (req, res) => {
  if (!req.session.loggedIn) {
    return res.status(403).send("Unauthorized");
  }

  const { name, price, category, stock, description } = req.body;
  const image = req.file ? req.file.filename : null;

  const sql = `
    INSERT INTO products (image, name, price, category, stock, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const values = [image, name, price, category, stock, description];

  connection.query(sql, values, (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send("Database error");
    }
    res.redirect("/admin/dashboard");
  });
});

app.post("/admin/products/delete/:id", (req, res) => {
  // SECURITY: Check admin authentication
  if (!req.session.loggedIn) {
    return res.status(403).send("Unauthorized");
  }

  const productId = req.params.id;

  connection.query(
    "DELETE FROM products WHERE id = ?",
    [productId],
    (err, result) => {
      if (err) {
        console.error("Error deleting product:", err);
        return res.status(500).send("Database error");
      }
      res.status(200).send("Product deleted successfully");
    }
  );
});

// products
app.get("/products", (req, res) => {
  connection.query("SELECT * FROM products", (err, results) => {
    if (err) {
      console.error("Error fetching products:", err);
      return res.render("products", {
        title: "Products",
        products: [],
        user: req.session.userId ? { name: req.session.name } : null,
      });
    }
    res.render("products", {
      path: req.path,
      title: "Products",
      products: results,
      user: req.session.userId ? { name: req.session.name } : null,
    });
  });
});

// SECURITY: Add input validation for contact form
const { check, validationResult } = require("express-validator");

// Contact form with validation
app.post(
  "/contact",
  [
    check("name").trim().notEmpty().withMessage("Name is required"),
    check("email").isEmail().withMessage("Valid email is required"),
    check("message").trim().notEmpty().withMessage("Message is required"),
    // Sanitize inputs
    check("name").escape(),
    check("email").normalizeEmail(),
    check("subject").escape(),
    check("message").escape(),
  ],
  (req, res) => {
    console.log("Contact form submission received:", req.body);

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send("Invalid form data");
    }

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Aurora Home" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Your email as the receiver
      subject: `Message from ${req.body.name} (${req.body.email}): ${req.body.subject}`,
      text: `
Name: ${req.body.name}
Email: ${req.body.email}
Subject: ${req.body.subject}

Message:
${req.body.message}
    `,
      replyTo: req.body.email, // This lets you reply directly to the sender
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Email sending error:", error);
        res.send("error");
      } else {
        console.log("Email sent successfully:", info.response);
        res.send("success");
      }
    });
  }
);

// API endpoint to fetch product image
app.get("/api/product-image/:id", (req, res) => {
  const productId = req.params.id;

  connection.query(
    "SELECT image FROM products WHERE id = ?",
    [productId],
    (err, results) => {
      if (err || results.length === 0) {
        console.error("Error fetching product image:", err);
        return res.json({
          status: "error",
          message: "Error fetching product image",
          imagePath: "/images/placeholder.jpg",
        });
      }

      const imagePath = results[0].image;
      res.json({
        status: "success",
        imagePath: imagePath.startsWith("/")
          ? imagePath
          : `/images/${imagePath}`,
      });
    }
  );
});

app.get("/logout", (req, res) => {
  // Destroy the session to log the user out
  req.session.destroy((err) => {
    if (err) {
      console.error("Error during logout:", err);
      return res.status(500).send("Error logging out");
    }
    // Redirect to home page after successful logout
    res.redirect("/");
  });
});

// SECURITY: Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Don't expose error details to users
  res.status(500).send("Something went wrong. Please try again later.");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
