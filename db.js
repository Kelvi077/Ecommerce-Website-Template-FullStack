// Load environment variables from .env file (optional but secure)
require('dotenv').config();

// Import the mysql2 package
const mysql = require('mysql2');

// Create a connection to the MySQL database
const connection = mysql.createConnection({
  host: process.env.DB_HOST,       // Your MySQL host (usually localhost)
  user: process.env.DB_USER,       // Your MySQL username
  password: process.env.DB_PASS,   // Your MySQL password
  database: process.env.DB_NAME    // The database name you want to connect to
});

// Connect to the database and check for errors
connection.connect((err) => {
  if (err) {
    console.error('❌ Error connecting to MySQL:', err.message);
    return;
  }
  console.log('✅ Connected to MySQL!');
});

// Export the connection so other files (like app.js) can use it
module.exports = connection;
