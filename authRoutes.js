// authRoutes.js
const express = require('express');
const router = express.Router();
const connection = require('./db'); // Import your database connection
const bcrypt = require('bcrypt');

// Login endpoint
router.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
        return res.json({ 
            status: 'error', 
            message: 'Please provide both email and password' 
        });
    }
    
    try {
        // Find user by email
        connection.query(
            'SELECT * FROM customers WHERE email = ?', 
            [email], 
            async (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.json({ 
                        status: 'error', 
                        message: 'An error occurred during login' 
                    });
                }
                
                // Check if user exists
                if (results.length === 0) {
                    return res.json({ 
                        status: 'error', 
                        message: 'Invalid email or password' 
                    });
                }
                
                const user = results[0];
                
                // Compare password
                const match = await bcrypt.compare(password, user.password);
                
                if (match) {
                    // Store user info in session
                    req.session.userId = user.id;
                    req.session.email = user.email;
                    req.session.name = user.name;
                    
                    // If there's a session cart, transfer it to the database
                    if (req.session.cart && req.session.cart.length > 0) {
                        transferSessionCartToDatabase(req.session.cart, user.id, () => {
                            // Clear session cart after transfer
                            req.session.cart = [];
                        });
                    }
                    
                    return res.json({ 
                        status: 'success', 
                        message: 'Login successful' 
                    });
                } else {
                    return res.json({ 
                        status: 'error', 
                        message: 'Invalid email or password' 
                    });
                }
            }
        );
    } catch (error) {
        console.error('Login error:', error);
        return res.json({ 
            status: 'error', 
            message: 'An error occurred during login' 
        });
    }
});

// Register endpoint
router.post('/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
        return res.json({ 
            status: 'error', 
            message: 'Please fill in all required fields' 
        });
    }
    
    try {
        // Check if email already exists
        connection.query(
            'SELECT * FROM customers WHERE email = ?', 
            [email], 
            async (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.json({ 
                        status: 'error', 
                        message: 'An error occurred during registration' 
                    });
                }
                
                if (results.length > 0) {
                    return res.json({ 
                        status: 'error', 
                        message: 'Email already in use' 
                    });
                }
                
                // Hash password
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);
                
                // Insert new user
                connection.query(
                    'INSERT INTO customers (name, email, password, created_at) VALUES (?, ?, ?, NOW())',
                    [name, email, hashedPassword],
                    (err, result) => {
                        if (err) {
                            console.error('Registration error:', err);
                            return res.json({ 
                                status: 'error', 
                                message: 'An error occurred during registration' 
                            });
                        }
                        
                        return res.json({ 
                            status: 'success', 
                            message: 'Registration successful' 
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return res.json({ 
            status: 'error', 
            message: 'An error occurred during registration' 
        });
    }
});

// Logout endpoint
router.get('/auth/logout', (req, res) => {
    // Destroy session
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.json({ 
                status: 'error', 
                message: 'An error occurred during logout' 
            });
        }
        
        return res.json({ 
            status: 'success', 
            message: 'Logout successful' 
        });
    });
});

// Check if user is logged in
router.get('/auth/check', (req, res) => {
    if (req.session.userId) {
        res.json({ 
            status: 'success', 
            loggedIn: true, 
            user: {
                id: req.session.userId,
                name: req.session.name,
                email: req.session.email
            }
        });
    } else {
        res.json({ 
            status: 'success', 
            loggedIn: false 
        });
    }
});

// Helper function to transfer session cart to database
function transferSessionCartToDatabase(sessionCart, userId, callback) {
    if (!sessionCart || sessionCart.length === 0) {
        if (callback) callback();
        return;
    }
    
    // Process each cart item
    let processedItems = 0;
    
    sessionCart.forEach(item => {
        // Check if product already exists in user's cart
        connection.query(
            'SELECT * FROM cart_items WHERE customer_id = ? AND product_id = ?',
            [userId, item.productId],
            (err, results) => {
                if (err) {
                    console.error('Error checking cart during transfer:', err);
                    processedItems++;
                    if (processedItems === sessionCart.length && callback) callback();
                    return;
                }
                
                if (results.length > 0) {
                    // Update quantity if product exists
                    const newQuantity = results[0].quantity + item.quantity;
                    
                    connection.query(
                        'UPDATE cart_items SET quantity = ? WHERE id = ?',
                        [newQuantity, results[0].id],
                        (err) => {
                            if (err) {
                                console.error('Error updating cart during transfer:', err);
                            }
                            
                            processedItems++;
                            if (processedItems === sessionCart.length && callback) callback();
                        }
                    );
                } else {
                    // Insert new item if it doesn't exist
                    connection.query(
                        `INSERT INTO cart_items 
                        (customer_id, product_id, product_name, price, quantity, cart_image, category)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [userId, item.productId, item.name, item.price, item.quantity, item.image, item.category],
                        (err) => {
                            if (err) {
                                console.error('Error adding to cart during transfer:', err);
                            }
                            
                            processedItems++;
                            if (processedItems === sessionCart.length && callback) callback();
                        }
                    );
                }
            }
        );
    });
}

module.exports = router;