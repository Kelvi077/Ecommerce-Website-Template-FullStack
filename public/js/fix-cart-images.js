/**
 * This utility script will fix image paths in the cart_items table
 * Run it once to correct all existing cart item image paths
 */

const connection = require("./db");

console.log("Starting cart image path fix utility...");

// First, let's get all cart items with potentially incorrect image paths
connection.query(
  `SELECT ci.id, ci.cart_image, p.image as product_image 
   FROM cart_items ci 
   LEFT JOIN products p ON ci.product_id = p.id`,
  (err, results) => {
    if (err) {
      console.error("Error fetching cart items:", err);
      process.exit(1);
    }

    console.log(`Found ${results.length} cart items to check...`);
    let updateCount = 0;

    // Process each cart item
    results.forEach(item => {
      let needsUpdate = false;
      let newImagePath = item.cart_image;

      // If cart_image is null or empty, use product image
      if (!item.cart_image && item.product_image) {
        newImagePath = item.product_image;
        needsUpdate = true;
      }

      // If cart_image doesn't have the proper format (missing /images/ prefix and not starting with /)
      if (newImagePath && !newImagePath.includes('/images/') && !newImagePath.startsWith('/')) {
        newImagePath = `/images/${newImagePath}`;
        needsUpdate = true;
      }

      // Update the cart item if needed
      if (needsUpdate) {
        connection.query(
          "UPDATE cart_items SET cart_image = ? WHERE id = ?",
          [newImagePath, item.id],
          (updateErr) => {
            if (updateErr) {
              console.error(`Error updating cart item ${item.id}:`, updateErr);
            } else {
              updateCount++;
              console.log(`Updated item ${item.id}: ${item.cart_image} -> ${newImagePath}`);
            }

            // If this is the last item, close connection
            if (updateCount === results.length) {
              console.log(`Fixed ${updateCount} cart item image paths`);
              connection.end();
            }
          }
        );
      } else {
        console.log(`Item ${item.id}: No update needed for ${item.cart_image}`);
      }
    });

    // If no updates were needed, close connection
    if (results.length === 0 || results.every(item => !(!item.cart_image || 
        (!item.cart_image.includes('/images/') && !item.cart_image.startsWith('/'))))) {
      console.log("No cart item image paths needed fixing");
      connection.end();
    }
  }
);