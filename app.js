const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const connection = require("./db"); // Import the connection from db.js
const multer = require("multer");
const path = require("path");
const session = require("express-session");
const nodemailer = require("nodemailer");

// Import the routes
const cartRoutes = require('./cartRoutes');
const authRoutes = require('./authRoutes'); // Make sure to import this

// Register view engine
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Log in sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key', // Fallback for development
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hours
  })
);

// Use the routes
app.use('/api', cartRoutes);
app.use('/api', authRoutes); // Add auth routes

// Main routes
app.get("/", (req, res) => {
  connection.query("SELECT * FROM products", (err, results) => {
    if (err) {
      console.error("Error fetching products:", err);
      return res.render("index", {
        title: "Home",
        products: [],
        user: req.session.userId ? { name: req.session.name } : null
      });
    }
    res.render("index", {
      title: "Home",
      products: results,
      user: req.session.userId ? { name: req.session.name } : null
    });
  });
});

app.get("/about", (req, res) => {
  res.render("about", { 
    title: "About",
    user: req.session.userId ? { name: req.session.name } : null
  });
});

app.get("/login", (req, res) => {
  // If already logged in, redirect to home
  if (req.session.userId) {
    return res.redirect('/');
  }
  res.render("login", { 
    title: "Login",
    user: null
  });
});

app.get("/contact", (req, res) => {
  res.render("contact", { 
    title: "Contact",
    user: req.session.userId ? { name: req.session.name } : null
  });
});

app.get("/cart", (req, res) => {
  // Get cart items based on whether user is logged in
  if (req.session.userId) {
    // Get from database if logged in
    connection.query(
      "SELECT * FROM cart_items WHERE customer_id = ?", 
      [req.session.userId], 
      (err, cartItems) => {
        if (err) {
          console.error("Error fetching cart items:", err);
          return res.render("cart", { 
            title: "Cart",
            cartItems: [],
            user: { name: req.session.name }
          });
        }
        
        res.render("cart", { 
          title: "Cart",
          cartItems: cartItems,
          user: { name: req.session.name }
        });
      }
    );
  } else {
    // Use session cart if not logged in
    const sessionCart = req.session.cart || [];
    res.render("cart", { 
      title: "Cart",
      cartItems: sessionCart,
      user: null
    });
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
        title: "My Profile",
        user: user
      });
    }
  );
});

// Show admin login page
app.get("/admin/login", (req, res) => {
  res.render("admin-login", { title: "Admin Login" });
});

// Admin dashboard page
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
  res.render("admin-dashboard-products", { title: "Admin products" });
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

// Admin login route
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    req.session.loggedIn = true;
    res.redirect("/admin/dashboard");
  } else {
    res.send("Invalid username or password");
  }
});

// Set up file storage using multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images"); // Upload images to 'public/images' folder
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // Get file extension
    cb(null, Date.now() + ext); // Use current timestamp as filename
  },
});

// Initialize multer with storage configuration
const upload = multer({ storage });

// Handle product image upload and saving new product to the database
app.post("/admin/products/add", upload.single("image"), (req, res) => {
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

// Handle product deletion
app.delete("/admin/products/delete/:id", (req, res) => {
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
        user: req.session.userId ? { name: req.session.name } : null
      });
    }
    res.render("products", {
      title: "Products",
      products: results,
      user: req.session.userId ? { name: req.session.name } : null
    });
  });
});

// contact email nodemailer
app.post("/contact", (req, res) => {
  console.log("Contact form submission received:", req.body);

  // Check if required fields are present
  if (!req.body.name || !req.body.email || !req.body.message) {
    console.log("Missing required fields in form submission");
    return res.send("error");
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
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});