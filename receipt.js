const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

// API endpoint for sending order receipt emails
router.post("/send-receipt", (req, res) => {
  console.log("📧 Receipt email request received:", req.body);

  const {
    orderId,
    customerEmail,
    customerName,
    orderItems,
    orderTotals,
    orderDate,
    shippingAddress,
  } = req.body;

  console.log("📧 Customer email:", customerEmail);

  if (!orderId || !customerEmail || !orderItems || !orderTotals) {
    console.error("📧 Missing required order information:", {
      hasOrderId: !!orderId,
      hasEmail: !!customerEmail,
      hasItems: !!orderItems,
      hasTotals: !!orderTotals,
    });
    return res.status(400).json({
      success: false,
      message: "Missing required order information",
    });
  }

  // Format order date nicely
  const formattedDate = new Date(orderDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Format currency
  const formatCurrency = (value) => {
    if (typeof value === "string" && value.startsWith("$")) {
      return value;
    }
    return `$${parseFloat(value).toFixed(2)}`;
  };

  // Generate the HTML for the items table
  let itemsHtml = "";
  orderItems.forEach((item) => {
    itemsHtml += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product_name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.price)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
      </tr>
    `;
  });

  // Create email HTML template
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Receipt</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          padding: 20px 0;
          background-color: #f7f7f7;
        }
        .order-info {
          margin: 20px 0;
          padding: 15px;
          background-color: #f9f9f9;
          border-radius: 5px;
        }
        .order-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        .order-table th {
          background-color: #f3f3f3;
          padding: 10px;
          text-align: left;
        }
        .total-row {
          font-weight: bold;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #777;
          border-top: 1px solid #eee;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Thank You for Your Order!</h1>
        <p>Order #${orderId}</p>
      </div>
      
      <div class="order-info">
        <h2>Order Details</h2>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Name:</strong> ${customerName}</p>
        <p><strong>Email:</strong> ${customerEmail}</p>
        <h3>Shipping Address:</h3>
        <p>
          ${shippingAddress.address}<br>
          ${shippingAddress.city}, ${shippingAddress.postalCode}<br>
          ${shippingAddress.country}
        </p>
      </div>

      <h2>Order Summary</h2>
      <table class="order-table">
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="text-align: right; padding: 10px;"><strong>Subtotal:</strong></td>
            <td style="text-align: right; padding: 10px;">${orderTotals.subtotal}</td>
          </tr>
          <tr>
            <td colspan="3" style="text-align: right; padding: 10px;"><strong>Shipping:</strong></td>
            <td style="text-align: right; padding: 10px;">${orderTotals.shipping}</td>
          </tr>
          <tr>
            <td colspan="3" style="text-align: right; padding: 10px;"><strong>Tax:</strong></td>
            <td style="text-align: right; padding: 10px;">${orderTotals.tax}</td>
          </tr>
          <tr class="total-row">
            <td colspan="3" style="text-align: right; padding: 10px; font-size: 18px;"><strong>Total:</strong></td>
            <td style="text-align: right; padding: 10px; font-size: 18px;">${orderTotals.total}</td>
          </tr>
        </tfoot>
      </table>

      <div class="footer">
        <p>Thank you for shopping with us! If you have any questions about your order, please contact our customer service at support@example.com</p>
        <p>© ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  // Plain text version for email clients that don't support HTML
  const emailText = `
    Order Receipt
    =============
    
    Thank you for your order #${orderId}!
    
    Date: ${formattedDate}
    Name: ${customerName}
    Email: ${customerEmail}
    
    Shipping Address:
    ${shippingAddress.address}
    ${shippingAddress.city}, ${shippingAddress.postalCode}
    ${shippingAddress.country}
    
    Order Summary:
    ${orderItems
      .map(
        (item) =>
          `${item.product_name} x${item.quantity} - ${formatCurrency(item.price * item.quantity)}`
      )
      .join("\n")}
    
    Subtotal: ${orderTotals.subtotal}
    Shipping: ${orderTotals.shipping}
    Tax: ${orderTotals.tax}
    Total: ${orderTotals.total}
    
    Thank you for shopping with us! If you have any questions about your order, please contact our customer service at support@example.com
  `;

  // Create nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  console.log("📧 Email credentials:", {
    user: process.env.EMAIL_USER ? "Set" : "Not set",
    pass: process.env.EMAIL_PASS ? "Set" : "Not set",
  });

  const mailOptions = {
    from: `"Your Store" <${process.env.EMAIL_USER}>`,
    to: customerEmail,
    subject: `Order Confirmation #${orderId}`,
    text: emailText,
    html: emailHtml,
  };

  console.log("📧 Sending email to:", customerEmail);

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("📧 Error sending receipt email:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to send receipt email",
      });
    }

    console.log("Receipt email sent successfully:", info.response);

    // Optionally, save the email sending record to the database
    const emailRecord = {
      orderId,
      customerEmail,
      dateSent: new Date().toISOString(),
      emailType: "receipt",
      status: "sent",
    };

    // You could save this to a emails_sent table if needed
    // connection.query('INSERT INTO emails_sent SET ?', emailRecord, ...)

    res.json({
      success: true,
      message: "Receipt email sent successfully",
    });
  });
});

module.exports = router;
