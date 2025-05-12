document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const ordersList = document.getElementById('orders-list');
    const orderSearch = document.getElementById('order-search');
    const statusFilter = document.getElementById('status-filter');
    const dateFilter = document.getElementById('date-filter');
    const customDateContainer = document.getElementById('custom-date-container');
    const dateFrom = document.getElementById('date-from');
    const dateTo = document.getElementById('date-to');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const totalPagesElem = document.getElementById('total-pages');
    const currentPageElem = document.querySelector('.current-page');
    
    // Order details modal elements
    const orderDetailsModal = document.getElementById('order-details-modal');
    const closeOrderDetailsModal = orderDetailsModal.querySelector('.close-modal');
    const orderStatus = document.getElementById('order-status');
    const updateStatusBtn = document.getElementById('update-status-btn');
    const saveTrackingBtn = document.getElementById('save-tracking-btn');
    const printInvoiceBtn = document.getElementById('print-invoice-btn');
    const deleteOrderBtn = document.getElementById('delete-order-btn');
    
    // Delete confirmation modal elements
    const deleteConfirmationModal = document.getElementById('delete-confirmation-modal');
    const closeDeleteModal = deleteConfirmationModal.querySelector('.close-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    
    // Pagination variables
    let currentPage = 1;
    const itemsPerPage = 10;
    let filteredOrders = [];
    let selectedOrderId = null;
    
    // Initialize orders display
    loadOrders();
    updateStatusCounts();
    
    // Event listeners
    if (dateFilter) {
        dateFilter.addEventListener('change', function() {
            if (this.value === 'custom') {
                customDateContainer.style.display = 'flex';
            } else {
                customDateContainer.style.display = 'none';
            }
        });
    }
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function() {
            currentPage = 1;
            filterOrders();
        });
    }
    
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', function() {
            orderSearch.value = '';
            statusFilter.value = 'all';
            dateFilter.value = 'all';
            customDateContainer.style.display = 'none';
            dateFrom.value = '';
            dateTo.value = '';
            currentPage = 1;
            filterOrders();
        });
    }
    
    if (orderSearch) {
        orderSearch.addEventListener('input', debounce(function() {
            currentPage = 1;
            filterOrders();
        }, 300));
    }
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                displayOrders();
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                displayOrders();
            }
        });
    }
    
    // Close order details modal
    if (closeOrderDetailsModal) {
        closeOrderDetailsModal.addEventListener('click', function() {
            orderDetailsModal.style.display = 'none';
        });
    }
    
    // Close delete confirmation modal
    if (closeDeleteModal) {
        closeDeleteModal.addEventListener('click', function() {
            deleteConfirmationModal.style.display = 'none';
        });
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function() {
            deleteConfirmationModal.style.display = 'none';
        });
    }
    
    // Update order status
    if (updateStatusBtn) {
        updateStatusBtn.addEventListener('click', function() {
            if (selectedOrderId) {
                updateOrderStatus(selectedOrderId, orderStatus.value);
            }
        });
    }
    
    // Save tracking number
    if (saveTrackingBtn) {
        saveTrackingBtn.addEventListener('click', function() {
            if (selectedOrderId) {
                const trackingNumber = document.getElementById('tracking-number-input').value.trim();
                if (trackingNumber) {
                    saveTrackingNumber(selectedOrderId, trackingNumber);
                }
            }
        });
    }
    
    // Delete order button
    if (deleteOrderBtn) {
        deleteOrderBtn.addEventListener('click', function() {
            if (selectedOrderId) {
                deleteConfirmationModal.style.display = 'flex';
            }
        });
    }
    
    // Confirm delete order
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            if (selectedOrderId) {
                deleteOrder(selectedOrderId);
                deleteConfirmationModal.style.display = 'none';
                orderDetailsModal.style.display = 'none';
            }
        });
    }
    
    // Print invoice
    if (printInvoiceBtn) {
        printInvoiceBtn.addEventListener('click', function() {
            if (selectedOrderId) {
                printInvoice(selectedOrderId);
            }
        });
    }
    
    // Get orders from localStorage
    function loadOrders() {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        filteredOrders = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));
        displayOrders();
    }
    
    // Filter orders based on search and filters
    function filterOrders() {
        const searchTerm = orderSearch.value.toLowerCase();
        const statusValue = statusFilter.value;
        const dateValue = dateFilter.value;
        
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        
        filteredOrders = orders.filter(order => {
            // Search filter
            const searchMatch = 
                searchTerm === '' || 
                order.id.toLowerCase().includes(searchTerm) ||
                `${order.customer.firstName} ${order.customer.lastName}`.toLowerCase().includes(searchTerm) ||
                order.customer.email.toLowerCase().includes(searchTerm);
                
            // Status filter
            const statusMatch = statusValue === 'all' || order.status === statusValue;
            
            // Date filter
            let dateMatch = true;
            const orderDate = new Date(order.date);
            
            if (dateValue === 'today') {
                const today = new Date();
                dateMatch = orderDate.toDateString() === today.toDateString();
            } else if (dateValue === 'week') {
                const today = new Date();
                const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
                weekStart.setHours(0, 0, 0, 0);
                dateMatch = orderDate >= weekStart;
            } else if (dateValue === 'month') {
                const today = new Date();
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                dateMatch = orderDate >= monthStart;
            } else if (dateValue === 'custom') {
                const fromDate = dateFrom.value ? new Date(dateFrom.value) : null;
                const toDate = dateTo.value ? new Date(dateTo.value) : null;
                
                if (fromDate && toDate) {
                    // Set time to end of day for toDate for inclusive comparison
                    toDate.setHours(23, 59, 59, 999);
                    dateMatch = orderDate >= fromDate && orderDate <= toDate;
                } else if (fromDate) {
                    dateMatch = orderDate >= fromDate;
                } else if (toDate) {
                    toDate.setHours(23, 59, 59, 999);
                    dateMatch = orderDate <= toDate;
                }
            }
            
            return searchMatch && statusMatch && dateMatch;
        });
        
        // Sort by date (newest first)
        filteredOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        displayOrders();
        updateStatusCounts();
    }
    
    // Display orders with pagination
    function displayOrders() {
        if (!ordersList) return;
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const ordersToShow = filteredOrders.slice(startIndex, endIndex);
        
        // Clear existing orders
        ordersList.innerHTML = '';
        
        if (ordersToShow.length === 0) {
            ordersList.innerHTML = `
                <tr class="no-orders-message">
                    <td colspan="7">No orders found</td>
                </tr>
            `;
        } else {
            ordersToShow.forEach(order => {
                const row = document.createElement('tr');
                row.setAttribute('data-id', order.id);
                
                const formattedDate = formatDate(order.date);
                const itemsCount = order.items.reduce((total, item) => total + item.quantity, 0);
                
                row.innerHTML = `
                    <td>${order.id}</td>
                    <td>${formattedDate}</td>
                    <td>${order.customer.firstName} ${order.customer.lastName}</td>
                    <td>${itemsCount} item${itemsCount !== 1 ? 's' : ''}</td>
                    <td>${order.totals.total}</td>
                    <td><span class="status-badge ${order.status}">${capitalizeFirstLetter(order.status)}</span></td>
                    <td>
                        <button class="action-btn view-btn" data-id="${order.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn delete-btn" data-id="${order.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                ordersList.appendChild(row);
            });
            
            // Add event listeners to view and delete buttons
            const viewButtons = document.querySelectorAll('.view-btn');
            viewButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const orderId = this.getAttribute('data-id');
                    openOrderDetails(orderId);
                });
            });
            
            const deleteButtons = document.querySelectorAll('.delete-btn');
            deleteButtons.forEach(button => {
                button.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const orderId = this.getAttribute('data-id');
                    selectedOrderId = orderId;
                    deleteConfirmationModal.style.display = 'flex';
                });
            });
            
            // Add click event to entire row
            const orderRows = document.querySelectorAll('#orders-list tr[data-id]');
            orderRows.forEach(row => {
                row.addEventListener('click', function() {
                    const orderId = this.getAttribute('data-id');
                    openOrderDetails(orderId);
                });
            });
        }
        
        // Update pagination
        updatePagination();
    }
    
    // Update pagination controls
    function updatePagination() {
        const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
        totalPagesElem.textContent = totalPages;
        currentPageElem.textContent = currentPage;
        
        // Enable/disable pagination buttons
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
    }
    
    // Open order details modal
    function openOrderDetails(orderId) {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const order = orders.find(o => o.id === orderId);
        
        if (order) {
            selectedOrderId = orderId;
            
            // Fill order details
            document.getElementById('detail-order-id').textContent = order.id;
            document.getElementById('detail-order-date').textContent = formatDate(order.date);
            document.getElementById('detail-customer-name').textContent = `${order.customer.firstName} ${order.customer.lastName}`;
            document.getElementById('detail-customer-email').textContent = order.customer.email;
            
            const address = `${order.customer.address}<br>
                ${order.customer.city}, ${order.customer.postalCode}<br>
                ${getCountryName(order.customer.country)}`;
            document.getElementById('detail-customer-address').innerHTML = address;
            
            // Transaction ID (mock)
            document.getElementById('detail-transaction-id').textContent = `TXN-${orderId.split('-')[1]}`;
            
            // Tracking number
            const trackingNumber = order.trackingNumber || 'Not available';
            document.getElementById('detail-tracking-number').textContent = trackingNumber;
            document.getElementById('tracking-number-input').value = order.trackingNumber || '';
            
            // Order status
            orderStatus.value = order.status;
            
            // Order items
            const orderItemsContainer = document.getElementById('detail-order-items');
            orderItemsContainer.innerHTML = '';
            
            order.items.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <div class="product-info">
                            <div class="product-img">
                                <img src="${item.image || '/img/placeholder.jpg'}" alt="${item.name}">
                            </div>
                            <div class="product-details">
                                <p class="product-name">${item.name}</p>
                                <p class="product-sku">SKU: ${item.sku || 'N/A'}</p>
                            </div>
                        </div>
                    </td>
                    <td>${item.price}</td>
                    <td>${item.quantity}</td>
                    <td>${formatPrice(parsePrice(item.price) * item.quantity)}</td>
                `;
                orderItemsContainer.appendChild(row);
            });
            
            // Order totals
            document.getElementById('detail-subtotal').textContent = order.totals.subtotal;
            document.getElementById('detail-shipping').textContent = order.totals.shipping;
            document.getElementById('detail-tax').textContent = order.totals.tax;
            document.getElementById('detail-total').textContent = order.totals.total;
            
            // Show modal
            orderDetailsModal.style.display = 'flex';
        }
    }
    
    // Update order status
    function updateOrderStatus(orderId, status) {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex !== -1) {
            orders[orderIndex].status = status;
            
            // If status is shipped and no tracking number is set, update the UI to prompt for one
            if (status === 'shipped' && !orders[orderIndex].trackingNumber) {
                // Optional: focus on tracking number input or show a notification
                document.getElementById('tracking-number-input').focus();
            }
            
            // If status is delivered, automatically set shipped flag to true
            if (status === 'delivered') {
                orders[orderIndex].shipped = true;
            }
            
            localStorage.setItem('orders', JSON.stringify(orders));
            
            // Update UI
            const statusBadge = document.querySelector(`tr[data-id="${orderId}"] .status-badge`);
            if (statusBadge) {
                statusBadge.className = `status-badge ${status}`;
                statusBadge.textContent = capitalizeFirstLetter(status);
            }
            
            // Show success message
            showNotification('Order status updated successfully');
            
            // Update status counts
            updateStatusCounts();
        }
    }
    
    // Save tracking number
    function saveTrackingNumber(orderId, trackingNumber) {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex !== -1) {
            orders[orderIndex].trackingNumber = trackingNumber;
            localStorage.setItem('orders', JSON.stringify(orders));
            
            // Update UI
            document.getElementById('detail-tracking-number').textContent = trackingNumber;
            
            // Show success message
            showNotification('Tracking number saved successfully');
        }
    }
    
    // Delete order
    function deleteOrder(orderId) {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const updatedOrders = orders.filter(order => order.id !== orderId);
        
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
        
        // Update UI
        filterOrders();
        showNotification('Order deleted successfully');
    }
    
    // Print invoice
    function printInvoice(orderId) {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const order = orders.find(o => o.id === orderId);
        
        if (order) {
            // Create a new window for printing
            const printWindow = window.open('', '_blank');
            
            // Generate invoice HTML
            let invoiceHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Invoice #${order.id}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 20px;
                            color: #333;
                        }
                        .invoice-header {
                            display: flex;
                            justify-content: space-between;
                            margin-bottom: 30px;
                        }
                        .company-info {
                            text-align: right;
                        }
                        h1 {
                            color: #2a3b4c;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 20px 0;
                        }
                        th, td {
                            padding: 10px;
                            text-align: left;
                            border-bottom: 1px solid #ddd;
                        }
                        th {
                            background-color: #f2f2f2;
                        }
                        .totals {
                            float: right;
                            width: 300px;
                        }
                        .total-row {
                            display: flex;
                            justify-content: space-between;
                            margin-bottom: 5px;
                        }
                        .grand-total {
                            font-weight: bold;
                            font-size: 1.2em;
                            border-top: 2px solid #333;
                            padding-top: 5px;
                        }
                        .footer {
                            margin-top: 50px;
                            text-align: center;
                            font-size: 0.8em;
                            color: #777;
                        }
                        .customer-info, .order-info {
                            margin-bottom: 20px;
                        }
                        @media print {
                            .no-print {
                                display: none;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="invoice-header">
                        <div>
                            <h1>INVOICE</h1>
                            <div class="order-info">
                                <p><strong>Invoice #:</strong> ${order.id}</p>
                                <p><strong>Date:</strong> ${formatDate(order.date)}</p>
                                <p><strong>Status:</strong> ${capitalizeFirstLetter(order.status)}</p>
                            </div>
                        </div>
                        <div class="company-info">
                            <h2>Aurora Home Furniture</h2>
                            <p>123 Furniture Lane, Design District</p>
                            <p>Phone: (555) 123-4567</p>
                            <p>Email: info@aurorahome.com</p>
                        </div>
                    </div>
                    
                    <div class="customer-info">
                        <h3>Bill To:</h3>
                        <p>${order.customer.firstName} ${order.customer.lastName}</p>
                        <p>${order.customer.address}</p>
                        <p>${order.customer.city}, ${order.customer.postalCode}</p>
                        <p>${getCountryName(order.customer.country)}</p>
                        <p>Email: ${order.customer.email}</p>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Price</th>
                                <th>Quantity</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            // Add order items
            order.items.forEach(item => {
                invoiceHTML += `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.price}</td>
                        <td>${item.quantity}</td>
                        <td>${formatPrice(parsePrice(item.price) * item.quantity)}</td>
                    </tr>
                `;
            });
            
            invoiceHTML += `
                        </tbody>
                    </table>
                    
                    <div class="totals">
                        <div class="total-row">
                            <span>Subtotal:</span>
                            <span>${order.totals.subtotal}</span>
                        </div>
                        <div class="total-row">
                            <span>Shipping:</span>
                            <span>${order.totals.shipping}</span>
                        </div>
                        <div class="total-row">
                            <span>Tax:</span>
                            <span>${order.totals.tax}</span>
                        </div>
                        <div class="total-row grand-total">
                            <span>Total:</span>
                            <span>${order.totals.total}</span>
                        </div>
                    </div>
                    
                    <div style="clear: both;"></div>
                    
                    <div class="footer">
                        <p>Thank you for your business!</p>
                    </div>
                    
                    <div class="no-print" style="text-align: center; margin-top: 30px;">
                        <button onclick="window.print();" style="padding: 10px 20px; cursor: pointer;">Print Invoice</button>
                    </div>
                </body>
                </html>
            `;
            
            // Write to the new window and print
            printWindow.document.write(invoiceHTML);
            printWindow.document.close();
            
            // Focus on the new window
            printWindow.focus();
        }
    }
    
    // Update order status counts
    function updateStatusCounts() {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        
        // Count orders by status
        const counts = {
            pending: 0,
            processing: 0,
            shipped: 0,
            delivered: 0
        };
        
        orders.forEach(order => {
            if (counts[order.status] !== undefined) {
                counts[order.status]++;
            }
        });
        
        // Update UI
        document.getElementById('pending-count').textContent = counts.pending;
        document.getElementById('processing-count').textContent = counts.processing;
        document.getElementById('shipped-count').textContent = counts.shipped;
        document.getElementById('delivered-count').textContent = counts.delivered;
    }
    
    // Helper Functions
    
    // Format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }
    
    // Get country name from code
    function getCountryName(countryCode) {
        const countries = {
            'US': 'United States',
            'CA': 'Canada',
            'UK': 'United Kingdom',
            'AU': 'Australia'
        };
        
        return countries[countryCode] || countryCode;
    }
    
    // Parse price string to number
    function parsePrice(priceString) {
        return parseFloat(priceString.replace(/[^0-9.-]+/g, ''));
    }
    
    // Format price number to string
    function formatPrice(price) {
        return '$' + price.toFixed(2);
    }
    
    // Capitalize first letter
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    // Debounce function for search input
    function debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }
    
    // Show notification
    function showNotification(message) {
        // Create notification element if it doesn't exist
        let notification = document.querySelector('.admin-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'admin-notification';
            document.body.appendChild(notification);
        }
        
        // Set message and show
        notification.textContent = message;
        notification.classList.add('show');
        
        // Hide after delay
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
});