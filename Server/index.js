const express = require('express');
const http = require('http'); // Required to combine HTTP and WebSocket
const WebSocket = require('ws'); // For WebSocket
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const {getUserIdFromToken}=require('./middleware/authMiddleware')
const url = require("url");
const jwt = require('jsonwebtoken');
const { webSocketClients, broadcastNotification } = require('./websocketHelper');
// Import routes
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Use user-related routes
app.use('/users', userRoutes);
app.use('/api', dashboardRoutes);
app.use('/api/notification', notificationRoutes);

// Create an HTTP server to work with both HTTP and WebSocket
const server = http.createServer(app);

// Create a WebSocket server and attach it to the HTTP server
const wss = new WebSocket.Server({ server });

// Store WebSocket clients
// const webSocketClients = new Map();  // Map to store WebSocket clients

// WebSocket connection event
wss.on("connection", (ws, req) => {
    // More detailed logging
    console.log("New WebSocket connection attempt");

    const fullUrl = `http://${req.headers.host}${req.url}`;
    const parsedUrl = new URL(fullUrl);
    const token = parsedUrl.searchParams.get("token");

    console.log("Connection URL:", fullUrl);
    console.log("Extracted token:", token);

    if (!token) {
        console.error("No token provided in WebSocket request");
        ws.send(JSON.stringify({
            type: 'error',
            message: 'No authentication token provided'
        }));
        
        // Immediate close with a specific error code
        ws.close(4001, "Authentication token is required");
        return;
    }

    try {
        // More robust token verification
        const decoded = jwt.verify(token, "12352452fjsdh");
        const user_id = decoded.id;

        console.log("Authenticated user ID:", user_id);

        // Additional validation
        if (!user_id) {
            console.error("Invalid user ID from token");
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid user ID'
            }));
            ws.close(4002, "Invalid user ID");
            return;
        }

        // Store the WebSocket connection
        webSocketClients.set(user_id.toString(), ws);

        // Ping mechanism to keep connection alive
        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.ping(); // Send ping to keep connection alive
            } else {
                clearInterval(pingInterval);
            }
        }, 30000); // Ping every 30 seconds

        ws.on("pong", () => {
            console.log(`Received pong from user ${user_id}`);
        });

        // More comprehensive error handling
        ws.on("error", (error) => {
            console.error(`Unhandled WebSocket error for user ${user_id}:`, error);
            webSocketClients.delete(user_id.toString());
            ws.close();
        });

        ws.on("close", (code, reason) => {
            console.log(`WebSocket closed for user ${user_id}. Code: ${code}, Reason: ${reason}`);
            webSocketClients.delete(user_id.toString());
            clearInterval(pingInterval);
        });

        // // Send welcome message
        // ws.send(JSON.stringify({ 
        //     type: 'connection', 
        //     message: 'Successfully connected to WebSocket server' 
        // }));
    } catch (error) {
        console.error("Comprehensive token verification error:", {
            message: error.message,
            name: error.name,
            stack: error.stack
        });

        ws.close(4003, "Server-side authentication error");
    }
});



// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
