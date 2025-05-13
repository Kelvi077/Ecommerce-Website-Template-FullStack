const express = require("express");
const router = express.Router();
const connection = require("./db"); // Import the connection from db.js
const bcrypt = require("bcrypt");

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ status: "error", message: "Not authenticated" });
  }
};

// Get user profile data
router.get("/user/profile", isAuthenticated, (req, res) => {
  connection.query(
    "SELECT id, email, name, address, city, postal_code, country, created_at FROM customers WHERE id = ?",
    [req.session.userId],
    (err, results) => {
      if (err || results.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
        });
      }

      // Format user data for frontend consumption
      const userData = results[0];

      // Parse name to get first and last name
      const nameParts = userData.name ? userData.name.split(" ") : ["", ""];
      const user = {
        id: userData.id,
        email: userData.email,
        first_name: nameParts[0] || "",
        last_name: nameParts.slice(1).join(" ") || "",
        display_name: userData.name,
        address: userData.address,
        city: userData.city,
        postal_code: userData.postal_code,
        country: userData.country,
        created_at: userData.created_at,
      };

      // Get additional stats
      getStats(req.session.userId, (stats) => {
        // Get recent orders for dashboard
        getRecentOrders(req.session.userId, (recentOrders) => {
          res.json({
            status: "success",
            user: user,
            stats: stats,
            recentOrders: recentOrders,
          });
        });
      });
    }
  );
});

// Helper function to get user stats
function getStats(userId, callback) {
  const stats = {
    ordersCount: 0,
    wishlistCount: 0,
    addressesCount: 0,
  };

  // Count orders
  connection.query(
    "SELECT COUNT(*) as count FROM orders WHERE customer_id = ?",
    [userId],
    (err, results) => {
      if (!err && results.length > 0) {
        stats.ordersCount = results[0].count;
      }

      // Count wishlist items
      connection.query(
        "SELECT COUNT(*) as count FROM wishlist WHERE customer_id = ?",
        [userId],
        (err, results) => {
          if (!err && results.length > 0) {
            stats.wishlistCount = results[0].count;
          }

          // Count addresses
          connection.query(
            "SELECT COUNT(*) as count FROM addresses WHERE customer_id = ?",
            [userId],
            (err, results) => {
              if (!err && results.length > 0) {
                stats.addressesCount = results[0].count;
              }

              callback(stats);
            }
          );
        }
      );
    }
  );
}

// Helper function to get recent orders
function getRecentOrders(userId, callback) {
  connection.query(
    `SELECT o.id, o.order_date, o.total, o.status
     FROM orders o
     WHERE o.customer_id = ?
     ORDER BY o.order_date DESC
     LIMIT 3`,
    [userId],
    (err, results) => {
      if (err) {
        console.error("Error fetching recent orders:", err);
        return callback([]);
      }
      callback(results || []);
    }
  );
}

// Get user orders
router.get("/user/orders", isAuthenticated, (req, res) => {
  connection.query(
    `SELECT o.id, o.order_date, o.total, o.status
     FROM orders o
     WHERE o.customer_id = ?
     ORDER BY o.order_date DESC`,
    [req.session.userId],
    (err, ordersResults) => {
      if (err) {
        return res.status(500).json({
          status: "error",
          message: "Failed to fetch orders",
        });
      }

      // For each order, fetch its items
      const orders = [];
      let completedOrders = 0;

      if (ordersResults.length > 0) {
        ordersResults.forEach((order) => {
          connection.query(
            `SELECT oi.product_id, oi.quantity, oi.price, p.name, p.image
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?`,
            [order.id],
            (err, orderItemsResults) => {
              completedOrders++;

              if (!err) {
                orders.push({
                  ...order,
                  items: orderItemsResults || [],
                });
              } else {
                orders.push({
                  ...order,
                  items: [],
                });
              }

              // When all order items are fetched, return the response
              if (completedOrders === ordersResults.length) {
                res.json({
                  status: "success",
                  orders: orders,
                });
              }
            }
          );
        });
      } else {
        res.json({
          status: "success",
          orders: [],
        });
      }
    }
  );
});

// Get user addresses
router.get("/user/addresses", isAuthenticated, (req, res) => {
  connection.query(
    "SELECT * FROM addresses WHERE customer_id = ?",
    [req.session.userId],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          status: "error",
          message: "Failed to fetch addresses",
        });
      }

      res.json({
        status: "success",
        addresses: results || [],
      });
    }
  );
});

// Add new address
router.post("/user/address/add", isAuthenticated, (req, res) => {
  const { name, full_name, street, city, state, zipcode, phone, is_default } =
    req.body;

  // If setting as default, first remove default status from all other addresses
  if (is_default) {
    connection.query(
      "UPDATE addresses SET is_default = 0 WHERE customer_id = ?",
      [req.session.userId],
      (err) => {
        if (err) {
          console.error("Error updating default address status:", err);
        }
        // Continue with adding the new address
        insertAddress();
      }
    );
  } else {
    insertAddress();
  }

  function insertAddress() {
    const sql = `
      INSERT INTO addresses (customer_id, name, full_name, street, city, state, zipcode, phone, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    connection.query(
      sql,
      [
        req.session.userId,
        name,
        full_name,
        street,
        city,
        state,
        zipcode,
        phone,
        is_default ? 1 : 0,
      ],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            status: "error",
            message: "Failed to add address",
          });
        }

        res.json({
          status: "success",
          message: "Address added successfully",
          addressId: result.insertId,
        });
      }
    );
  }
});

// Delete address
router.delete("/user/address/:id", isAuthenticated, (req, res) => {
  const addressId = req.params.id;

  // First check if the address belongs to the logged-in user
  connection.query(
    "SELECT id FROM addresses WHERE id = ? AND customer_id = ?",
    [addressId, req.session.userId],
    (err, results) => {
      if (err || results.length === 0) {
        return res.status(403).json({
          status: "error",
          message: "Address not found or not authorized",
        });
      }

      // Delete the address
      connection.query(
        "DELETE FROM addresses WHERE id = ?",
        [addressId],
        (err) => {
          if (err) {
            return res.status(500).json({
              status: "error",
              message: "Failed to delete address",
            });
          }

          res.json({
            status: "success",
            message: "Address deleted successfully",
          });
        }
      );
    }
  );
});

// Set default address
router.put("/user/address/:id/default", isAuthenticated, (req, res) => {
  const addressId = req.params.id;

  // First check if the address belongs to the logged-in user
  connection.query(
    "SELECT id FROM addresses WHERE id = ? AND customer_id = ?",
    [addressId, req.session.userId],
    (err, results) => {
      if (err || results.length === 0) {
        return res.status(403).json({
          status: "error",
          message: "Address not found or not authorized",
        });
      }

      // First, remove default status from all addresses for this user
      connection.query(
        "UPDATE addresses SET is_default = 0 WHERE customer_id = ?",
        [req.session.userId],
        (err) => {
          if (err) {
            return res.status(500).json({
              status: "error",
              message: "Failed to update default address",
            });
          }

          // Then set the specified address as default
          connection.query(
            "UPDATE addresses SET is_default = 1 WHERE id = ?",
            [addressId],
            (err) => {
              if (err) {
                return res.status(500).json({
                  status: "error",
                  message: "Failed to update default address",
                });
              }

              res.json({
                status: "success",
                message: "Default address updated successfully",
              });
            }
          );
        }
      );
    }
  );
});

// Get user wishlist
router.get("/user/wishlist", isAuthenticated, (req, res) => {
  connection.query(
    `SELECT w.id, p.id as id, p.name, p.price, p.image 
     FROM wishlist w 
     LEFT JOIN products p ON w.product_id = p.id 
     WHERE w.customer_id = ?`,
    [req.session.userId],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          status: "error",
          message: "Failed to fetch wishlist",
        });
      }

      res.json({
        status: "success",
        wishlist: results || [],
      });
    }
  );
});

// Remove item from wishlist
router.delete("/user/wishlist/:id", isAuthenticated, (req, res) => {
  const productId = req.params.id;

  connection.query(
    "DELETE FROM wishlist WHERE product_id = ? AND customer_id = ?",
    [productId, req.session.userId],
    (err) => {
      if (err) {
        return res.status(500).json({
          status: "error",
          message: "Failed to remove item from wishlist",
        });
      }

      res.json({
        status: "success",
        message: "Item removed from wishlist",
      });
    }
  );
});

// Add item to wishlist
router.post("/user/wishlist/add", isAuthenticated, (req, res) => {
  const { productId } = req.body;

  // Check if item already exists in wishlist
  connection.query(
    "SELECT id FROM wishlist WHERE product_id = ? AND customer_id = ?",
    [productId, req.session.userId],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          status: "error",
          message: "Failed to check wishlist",
        });
      }

      if (results.length > 0) {
        return res.json({
          status: "success",
          message: "Item already in wishlist",
        });
      }

      // Add item to wishlist
      connection.query(
        "INSERT INTO wishlist (customer_id, product_id) VALUES (?, ?)",
        [req.session.userId, productId],
        (err) => {
          if (err) {
            return res.status(500).json({
              status: "error",
              message: "Failed to add item to wishlist",
            });
          }

          res.json({
            status: "success",
            message: "Item added to wishlist",
          });
        }
      );
    }
  );
});

// Update account details
router.put("/user/account/update", isAuthenticated, (req, res) => {
  const {
    first_name,
    last_name,
    display_name,
    email,
    current_password,
    new_password,
  } = req.body;

  // Combine first and last name
  const name = `${first_name} ${last_name}`.trim();

  // Start building the SQL query and parameters
  let sql = "UPDATE customers SET name = ?, email = ?";
  let params = [name, email];

  // If password change is requested
  if (current_password && new_password) {
    // First verify current password
    connection.query(
      "SELECT password FROM customers WHERE id = ?",
      [req.session.userId],
      async (err, results) => {
        if (err || results.length === 0) {
          return res.status(404).json({
            status: "error",
            message: "User not found",
          });
        }

        const user = results[0];

        // Verify current password
        const passwordMatch = await bcrypt.compare(
          current_password,
          user.password
        );

        if (!passwordMatch) {
          return res.status(400).json({
            status: "error",
            message: "Current password is incorrect",
          });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(new_password, 10);

        // Update with new password
        connection.query(
          "UPDATE customers SET name = ?, email = ?, password = ? WHERE id = ?",
          [name, email, hashedPassword, req.session.userId],
          (err) => {
            if (err) {
              return res.status(500).json({
                status: "error",
                message: "Failed to update account",
              });
            }

            res.json({
              status: "success",
              message: "Account updated successfully",
            });
          }
        );
      }
    );
  } else {
    // Update without changing password
    connection.query(
      "UPDATE customers SET name = ?, email = ? WHERE id = ?",
      [name, email, req.session.userId],
      (err) => {
        if (err) {
          return res.status(500).json({
            status: "error",
            message: "Failed to update account",
          });
        }

        res.json({
          status: "success",
          message: "Account updated successfully",
        });
      }
    );
  }
});

module.exports = router;
