document.addEventListener("DOMContentLoaded", function () {
  // Sidebar toggle functionality
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("sidebar");

  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", function () {
      sidebar.classList.toggle("collapsed");
    });
  }

  // Delete product functionality
  const deleteButtons = document.querySelectorAll(".delete-btn");

  deleteButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const productId = this.getAttribute("data-id");

      if (confirm("Are you sure you want to delete this product?")) {
        // Create and submit form
        fetch(`/admin/products/delete/${productId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
        })
          .then((response) => {
            if (response.ok) {
              // Remove the row from the table
              const row = this.closest("tr");
              row.parentNode.removeChild(row);
              showNotification("Product deleted successfully", "success");
              updateProductCount();
            } else {
              showNotification("Error deleting product", "error");
            }
          })
          .catch((error) => {
            console.error("Delete error:", error);
            showNotification("Error deleting product", "error");
          });
      }
    });
  });

  // Update total product count
  function updateProductCount() {
    const productRows = document.querySelectorAll(
      ".category-table tbody tr:not(.no-products)"
    );
    const totalProductCount = document.getElementById("total-product-count");

    if (totalProductCount) {
      totalProductCount.textContent = productRows.length;
    }
  }

  // Initialize product count on page load
  updateProductCount();

  // Notification function
  function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Add to document
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
});
