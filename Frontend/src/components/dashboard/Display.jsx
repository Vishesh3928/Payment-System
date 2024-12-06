import { useState, useEffect } from "react";
import axios from "axios";
import PropTypes from "prop-types";

function Display({ orders, showAllOrders, isSupplier }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null); // Track the order for which the modal is open
  const [amountToPay, setAmountToPay] = useState(""); // Amount entered by user
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    if (showAllOrders) {
      const fetchAllOrders = async () => {
        try {
          setLoading(true);
          const response = await axios.get(
            "http://localhost:5000/api/getorders",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setAllOrders(response.data.orders);
        } catch (error) {
          setError("Failed to fetch orders.");
        } finally {
          setLoading(false);
        }
      };
      fetchAllOrders();
    }
  }, [showAllOrders, token]);

  const handleOpenModal = (order) => {
    setSelectedOrder(order); // Set the selected order
    setAmountToPay(""); // Reset the input field
    setIsModalOpen(true);
  };

  const handleSendPaymentRequest = async () => {
    if (!amountToPay || isNaN(amountToPay) || amountToPay <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
  
    try {
      // Send payment request logic (can be an API call)
      const response = await axios.post(
        `http://localhost:5000/api/payments`,
        {
          order_id: selectedOrder.order_id,
          amount: amountToPay,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (response.status === 201) {
        alert("Payment request sent successfully.");
  
        // Send notification after successful payment request
        const paymentData = response.data;
        const notificationPayload = {
          buttonAction: "PaymentRequest",
          metadata: {
            payment_id: paymentData.payment_id,
            order_id: paymentData.order_id,
            amount: paymentData.amount,
            sender_id: paymentData.paid_by, // Assuming this field is present in the payment response
          },
        };
  
        // Call the notification endpoint
        const notificationResponse = await axios.post(
          `http://localhost:5000/api/notification/send`,
          notificationPayload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        if (notificationResponse.status === 201) {
          console.log("Notification sent successfully.");
        } else {
          console.error("Failed to send notification.");
        }
  
        setIsModalOpen(false); // Close the modal after sending the payment request
      }
    } catch (error) {
      console.error("Failed to send payment request:", error);
      alert("Failed to send payment request.");
    }
  };
  


  if (loading) {
    return <p>Loading orders...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  const displayOrders = showAllOrders ? allOrders : orders;

  return (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-xl font-bold mb-4">
        {showAllOrders ? "All Orders" : "Filtered Orders"}
      </h3>
      {displayOrders.length === 0 ? (
        <p className="text-gray-500">No orders found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayOrders.map((order) => (
            <div
              key={order.order_id}
              className="p-4 bg-white rounded-lg shadow-md hover:shadow-xl transition-all"
            >
              {/* Order details */}
              <h4 className="text-lg font-semibold text-gray-800">
                {order.supplier_name}
              </h4>
              <p className="text-sm text-gray-600">
                <strong>Order ID:</strong> {order.order_id}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Total Amount:</strong> ${order.total_amount}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Remaining Amount:</strong> ${order.remaining_amount}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Description:</strong> {order.description}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Status:</strong>{" "}
                <span
                  className={
                    order.status === "pending"
                      ? "text-yellow-500"
                      : order.status === "accepted"
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  {order.status}
                </span>
              </p>
              <p className="text-sm text-gray-400">
                <strong>Created At:</strong>{" "}
                {new Date(order.created_at).toLocaleDateString()}
              </p>


              {/* Buyer-specific functionality */}
              {!isSupplier && order.status === "accepted" && (
                <div className="mt-4">
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => handleOpenModal(order)}
                  >
                    Pay
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
            <h3 className="text-xl font-semibold mb-4">
              Pay for Order #{selectedOrder.order_id}
            </h3>
            <p>
              <strong>Remaining Amount:</strong> $
              {selectedOrder.remaining_amount}
            </p>
            <div className="mt-4">
              <input
                type="number"
                value={amountToPay}
                onChange={(e) => setAmountToPay(e.target.value)}
                className="px-4 py-2 border rounded w-full"
                placeholder="Enter amount to pay"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded mr-2"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded"
                onClick={handleSendPaymentRequest}
              >
                Send Payment Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Display.propTypes = {
  orders: PropTypes.array.isRequired,
  showAllOrders: PropTypes.bool.isRequired,
  onResetOrders: PropTypes.func.isRequired,
  isSupplier: PropTypes.bool.isRequired,
};

export default Display;
