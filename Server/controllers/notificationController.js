const { Pool } = require('pg');
const pool = require('../config/db');
const  {broadcastNotification}  = require('../websocketHelper');  // Import the broadcastNotification function

const createNotification = async (req, res) => {
  try {
    const { user_id, type, message, data } = req.notification; // Ensure you're using req.body for data
    console.log(user_id);
    console.log(type);
    console.log(message);

    // Validate required fields
    if (!user_id || !type || !message) {
      return res.status(400).json({ error: "user_id, type, and message are required." });
    }

    // Create notification in the database
    const query = `
      INSERT INTO notifications (user_id, type, message, data, is_read)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [user_id, type, message, data, false]; // Default metadata to null
    const result = await pool.query(query, values);

    // Broadcast notification to the user over WebSocket
    const notification = {
      type,
      message,
      data,
    };
    broadcastNotification(user_id, notification); // Send the notification to the user

    res.status(201).json({ success: true, notification: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create notification." });
  }
};

const fetchNotifications = async (req, res) => {
  try {
    const { id } = req.user;

    const result = await pool.query(
      `
      SELECT message, created_at 
      FROM notifications 
      WHERE user_id = $1
      ORDER BY created_at DESC;
      `,
      [id]
    );

    res.status(200).json({
      success: true,
      notifications: result.rows,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
    });
  }
};

module.exports = { createNotification, fetchNotifications };
