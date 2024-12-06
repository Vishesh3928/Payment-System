const { Pool } = require('pg');
const pool = require('../config/db');
const createNotificationMiddleware = async (req, res, next) => {
    try {
      const { buttonAction, metadata } = req.body; // Metadata contains payment_id, order_id, and amount
  
      // Define notification templates
      const notificationMap = {
        PaymentRequest: {
          message: "{username} sent request of Rs. {amount} for Order ID: {order_id}.",
          type: "payment",
        },
        acceptPayment: {
          message: "Payment of Rs. {amount} has been accepted for Order ID: {order_id} (Payment ID: {payment_id}).",
          type: "payment",
        },
        rejectPayment: {
          message: "Payment of Rs. {amount} has been rejected for Order ID: {order_id} (Payment ID: {payment_id}).",
          type: "payment",
        },
        orderCreated: {
          message: "A new order has been created with Order ID: {order_id}.",
          type: "order",
        },
        orderAccepted: {
            message: "Your order of amount: {amount} with orderID: {order_id}. was accepted",
            type: "order",
          },
        orderRejected: {
            message: "Your order of amount: {amount} with orderID: {order_id}. was rejected",
            type: "order",
          },
        orderCompleted: {
          message: "Order ID: {order_id} has been marked as completed.",
          type: "order",
        },
      };
  
      // Validate the buttonAction
      if (!notificationMap[buttonAction]) {
        console.log("Invalid button action");
        return res.status(400).json({ error: "Invalid button action" });
      }
  
      // Get the template and type for the notification
      const { message, type } = notificationMap[buttonAction];
  
      // Ensure the required metadata fields are provided
      if (
        (buttonAction.includes("Payment") &&
          (!metadata?.payment_id || !metadata?.order_id || !metadata?.amount)) || // Require payment_id, order_id, and amount for payment notifications
        (buttonAction.includes("order") && !metadata?.order_id) // Require order_id for order notifications
      ) {
        console.log(metadata.payment_id , metadata.order_id , metadata.amount)
        console.log(`Missing required metadata for ${buttonAction}`);
        return res.status(400).json({
          error: `Missing required metadata for ${buttonAction}.`,
        });
      }
  
      // Fetch supplier_id and username when buttonAction is "PaymentRequest"
      if (buttonAction === "PaymentRequest") {
        // Query orders table to get supplier_id
        const orderResult = await pool.query(
            `SELECT supplier_id FROM orders WHERE order_id = $1`,
            [metadata.order_id]
        )  
        if (orderResult.rows.length === 0) {
          return res.status(400).json({ error: "Order not found" });
        }
  
        const supplier_id = orderResult.rows[0].supplier_id;
  
        // Query user table to get username for sender
        const userResult = await pool.query(
            `SELECT username FROM users WHERE user_id = $1`,
            [metadata.sender_id]
        )  
  
        if (userResult.rows.length === 0) {
          return res.status(400).json({ error: "Sender not found" });
        }
  
        const username = userResult.rows[0].username;
  
        // Replace placeholders in the message template with actual metadata values
        const notificationMessage = message
          .replace("{amount}", metadata.amount)
          .replace("{order_id}", metadata.order_id)
          .replace("{payment_id}", metadata.payment_id)
          .replace("{username}", username);
  
        // Attach notification data to the request object
        req.notification = {
          user_id: supplier_id, // Send notification to supplier
          message: notificationMessage,
          type,
          data: metadata, // Store the metadata (e.g., payment_id, order_id, amount)
        };
      } else {
        // For other actions, use the existing message template
        const notificationMessage = message
          .replace("{amount}", metadata.amount)
          .replace("{order_id}", metadata.order_id)
          .replace("{payment_id}", metadata.payment_id);
  
        req.notification = {
          user_id: metadata.user_id, // Default user_id from metadata
          message: notificationMessage,
          type,
          data: metadata, // Store the metadata (e.g., payment_id, order_id, amount)
        };
      }
  
      next(); // Proceed to the endpoint
    } catch (error) {
      console.error("Error in createNotificationMiddleware:", error);
      res.status(500).json({ error: "Failed to process notification middleware." });
    }
  };
  
  module.exports = createNotificationMiddleware;