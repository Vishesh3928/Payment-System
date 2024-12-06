import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const Header = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    supplier_name: "",
    supplier_phone: "",
    total_amount: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Toggle notification dropdown
  const toggleNotifications = () => {
    setIsNotificationsOpen((prev) => !prev);
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Open modal
  const handleOpenModal = () => {
    setIsModalOpen(true);
    setError(null);
    setSuccessMessage(null);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      supplier_name: "",
      supplier_phone: "",
      total_amount: "",
      description: "",
    });
    setError(null);
    setSuccessMessage(null);
  };

  // Fetch initial notifications
  const fetchInitialNotifications = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No authentication token found");
        return;
      }
  
      const response = await axios.get("http://localhost:5000/api/notification/fetch", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (response.data.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error("Failed to fetch initial notifications:", error);
    }
  };
  
  // Define connectWebSocket outside the useEffect
  const connectWebSocket = () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("No authentication token found");
      return;
    }
  
    const wsUrl = `ws://localhost:5000/?token=${encodeURIComponent(token)}&t=${Date.now()}`;
    const newSocket = new WebSocket(wsUrl);
  
    newSocket.onopen = () => {
      console.log("WebSocket connection established");
      setSocket(newSocket);
    };
  
    newSocket.onmessage = (event) => {
      console.log("Received WebSocket message:", event.data);
      try {
        const newNotification = JSON.parse(event.data);
        setNotifications((prevNotifications) => [newNotification, ...prevNotifications]);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
  
    newSocket.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };
  
    newSocket.onclose = () => {
      console.log("WebSocket disconnected. Reconnecting...");
      setTimeout(connectWebSocket, 5000); // Reconnect after 5 seconds
    };
  };
  
  useEffect(() => {
    // Fetch initial notifications once when the component mounts
    fetchInitialNotifications();
  
    // Establish WebSocket connection
    connectWebSocket();
  
    // Cleanup function for WebSocket
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem("authToken"); // Get token from localStorage

      // Step 1: Create the order
      const createOrderResponse = await axios.post(
        "http://localhost:5000/api/order",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { order_id: orderId, supplier_id: supplierId } = createOrderResponse.data.order;

      if (!orderId) {
        throw new Error("Order ID not received from the server");
      }
      setSuccessMessage("Order created successfully!");

      // Step 2: Call the createNotif endpoint to send a notification
      const notifData = {
        buttonAction: "orderCreated",
        metadata: {
          order_id: orderId,
          user_id: supplierId,
          amount: formData.total_amount,
        },
      };

      await axios.post("http://localhost:5000/api/notification/send", notifData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccessMessage("Order created, and notification sent successfully!");
      setTimeout(() => handleCloseModal(), 2000); // Close modal after 2 seconds
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create order or send notification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen">
      {/* Header Section */}
      <div className="flex items-center justify-between bg-gray-800 text-white px-6 py-4 shadow-md">
        <h1 className="text-lg font-semibold">Dashboard</h1>

        {/* Notification Bell Icon */}
        <div className="relative">
          <button onClick={toggleNotifications} className="bg-transparent text-white px-4 py-2">
            <i className="fas fa-bell text-2xl"></i>
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1">
                {notifications.length}
              </span>
            )}
          </button>
          {isNotificationsOpen && (
            <div className="absolute right-0 bg-white shadow-lg rounded-lg w-64 mt-2 z-10">
              <ul className="max-h-60 overflow-y-auto p-2">
                {notifications.length > 0 ? (
                  notifications.map((notif, index) => (
                    <li key={index} className="p-2 border-b text-sm text-gray-700">
                      {notif.message}
                      <span className="text-xs text-gray-500 block">
                        {new Date(notif.created_at).toLocaleString()}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="p-2 text-sm text-gray-500">No new notifications</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <button
          onClick={handleOpenModal}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow"
        >
          Create Order
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4 text-gray-700">Create Order</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Supplier Name</label>
                <input
                  type="text"
                  name="supplier_name"
                  value={formData.supplier_name}
                  onChange={handleChange}
                  required
                  className="w-full mt-1 px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Supplier Phone</label>
                <input
                  type="text"
                  name="supplier_phone"
                  value={formData.supplier_phone}
                  onChange={handleChange}
                  required
                  className="w-full mt-1 px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Total Amount</label>
                <input
                  type="number"
                  name="total_amount"
                  value={formData.total_amount}
                  onChange={handleChange}
                  required
                  className="w-full mt-1 px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className="w-full mt-1 px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
              {successMessage && <p className="text-green-500 text-sm">{successMessage}</p>}

              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg w-full"
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
