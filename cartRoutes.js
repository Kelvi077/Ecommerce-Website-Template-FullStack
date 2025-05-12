// cartRoutes.js
const express = require("express");
const router = express.Router();
const connection = require("./db"); // Import your database connection

// Add to cart
router.post("/add-to-cart", (req, res) => {
  const { productId, name, price, image, category, quantity } = req.body;

  // Check if user is logged in
  if (req.session.userId) {
    // First check if the product is already in the cart
    connection.query(
      "SELECT * FROM cart_items WHERE customer_id = ? AND product_id = ?",
      [req.session.userId, productId],
      (err, results) => {
        if (err) {
          console.error("Database error:", err);
          return res.json({
            status: "error",
            message: "Database error",
          });
        }

        if (results.length > 0) {
          // Product exists in cart, update quantity
          const newQuantity = results[0].quantity + parseInt(quantity);

          connection.query(
            "UPDATE cart_items SET quantity = ? WHERE id = ?",
            [newQuantity, results[0].id],
            (err) => {
              if (err) {
                console.error("Error updating cart:", err);
                return res.json({
                  status: "error",
                  message: "Error updating cart",
                });
              }

              res.json({
                status: "success",
                message: "Cart updated successfully",
              });
            }
          );
        } else {
          // Product doesn't exist in cart, add new item
          connection.query(
            `INSERT INTO cart_items 
                        (customer_id, product_id, product_name, price, quantity, cart_image, category)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              req.session.userId,
              productId,
              name,
              price,
              quantity,
              image,
              category,
            ],
            (err) => {
              if (err) {
                console.error("Error adding to cart:", err);
                return res.json({
                  status: "error",
                  message: "Error adding to cart",
                });
              }

              res.json({
                status: "success",
                message: "Product added to cart successfully",
              });
            }
          );
        }
      }
    );
  } else {
    // User not logged in, store in session
    if (!req.session.cart) {
      req.session.cart = [];
    }

    // Check if product already exists in session cart
    const existingItemIndex = req.session.cart.findIndex(
      (item) => item.productId === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity if product exists
      req.session.cart[existingItemIndex].quantity += parseInt(quantity);
    } else {
      // Add new item if it doesn't exist
      req.session.cart.push({
        productId,
        name,
        price,
        image,
        category,
        quantity: parseInt(quantity),
      });
    }

    res.json({
      status: "success",
      message: "Product added to session cart successfully",
    });
  }
});

// Get cart count
router.get("/cart-count", (req, res) => {
  if (req.session.userId) {
    // Get count from database for logged in users
    connection.query(
      "SELECT SUM(quantity) as count FROM cart_items WHERE customer_id = ?",
      [req.session.userId],
      (err, results) => {
        if (err) {
          console.error("Error getting cart count:", err);
          return res.json({
            status: "error",
            message: "Error getting cart count",
            count: 0,
          });
        }

        const count = results[0].count || 0;
        res.json({
          status: "success",
          count: count,
        });
      }
    );
  } else {
    // Get count from session for guests
    let count = 0;
    if (req.session.cart) {
      count = req.session.cart.reduce(
        (total, item) => total + item.quantity,
        0
      );
    }

    res.json({
      status: "success",
      count: count,
    });
  }
});

// Remove from cart
router.post("/remove-from-cart", (req, res) => {
  const { itemId } = req.body;

  if (req.session.userId) {
    // Remove from database for logged in users
    connection.query(
      "DELETE FROM cart_items WHERE id = ? AND customer_id = ?",
      [itemId, req.session.userId],
      (err) => {
        if (err) {
          console.error("Error removing from cart:", err);
          return res.json({
            status: "error",
            message: "Error removing from cart",
          });
        }

        res.json({
          status: "success",
          message: "Item removed from cart",
        });
      }
    );
  } else {
    // Remove from session for guests
    if (req.session.cart) {
      req.session.cart = req.session.cart.filter(
        (item, index) => index !== parseInt(itemId)
      );

      res.json({
        status: "success",
        message: "Item removed from cart",
      });
    } else {
      res.json({
        status: "error",
        message: "Cart not found",
      });
    }
  }
});

// Update cart quantity
router.post("/update-cart", (req, res) => {
  const { itemId, quantity } = req.body;

  if (req.session.userId) {
    // Update in database for logged in users
    connection.query(
      "UPDATE cart_items SET quantity = ? WHERE id = ? AND customer_id = ?",
      [quantity, itemId, req.session.userId],
      (err) => {
        if (err) {
          console.error("Error updating cart:", err);
          return res.json({
            status: "error",
            message: "Error updating cart",
          });
        }

        res.json({
          status: "success",
          message: "Cart updated successfully",
        });
      }
    );
  } else {
    // Update in session for guests
    if (req.session.cart && req.session.cart[itemId]) {
      req.session.cart[itemId].quantity = parseInt(quantity);

      res.json({
        status: "success",
        message: "Cart updated successfully",
      });
    } else {
      res.json({
        status: "error",
        message: "Item not found in cart",
      });
    }
  }
});

module.exports = router;
