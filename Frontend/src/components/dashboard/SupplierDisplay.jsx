import { useState, useEffect } from "react";
import axios from "axios";
import PropTypes from "prop-types";

function SupplierDisplay({ orders, showAllOrders, isSupplier }) {
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false); // To track if the status is being updated
  const [pendingPayments, setPendingPayments] = useState([]);
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

  useEffect(() => {
    if (isSupplier) {
      const fetchPendingPayments = async () => {
        try {
          setLoading(true);
          const response = await axios.get(
            "http://localhost:5000/api/payments/pending",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setPendingPayments(response.data.payments);
        } catch (error) {
          setError("Failed to fetch pending payments.");
        } finally {
          setLoading(false);
        }
      };
      fetchPendingPayments();
    }
  }, [isSupplier, token]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdating(true);
  
      // Update the order status
      const response = await axios.patch(
        `http://localhost:5000/api/orders/${orderId}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      // Check if the order status was updated successfully
      if (response.status === 200) {
        const updatedOrder = response.data.order;
  
        // Update the UI after successful status update
        if (showAllOrders) {
          setAllOrders((prevOrders) =>
            prevOrders.map((order) =>
              order.order_id === orderId
                ? { ...order, status: newStatus }
                : order
            )
          );
        } else {
          orders.map((order) =>
            order.order_id === orderId ? { ...order, status: newStatus } : order
          );
        }
  
        // Prepare data for the notification API
        const buttonAction =
          newStatus === "accepted" ? "orderAccepted" : "orderRejected";
        const notificationData = {
          buttonAction,
          metadata: {
            user_id: updatedOrder.vendor_id,
            amount: updatedOrder.total_amount,
            order_id: updatedOrder.order_id,
          },
        };
  
        // Call the notification API
        await sendNotification(notificationData);
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
      alert("Failed to update order status.");
    } finally {
      setUpdating(false);
    }
  };

  const handleAcceptPayment = async (payment_id , buttonAction) => {
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/payments/${payment_id}/confirm`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response.status)
      if (response.status === 200) {
        const { payment, order } = response.data;
  
        alert("Payment accepted successfully.");
  
        // Remove the payment from the pending payments array
        setPendingPayments((prevPayments) =>
          prevPayments.filter((payment) => payment.payment_id !== payment_id)
        );
        const notificationData = {
            buttonAction: buttonAction,
            metadata:{
            user_id: payment.paid_by,
            amount:payment.amount,
            order_id: order.order_id,
            payment_id:payment.payment_id,
            }
            
          };
        // Call the notification API with the required metadata
        await sendNotification(notificationData);
      }
    } catch (error) {
      console.error("Failed to accept payment:", error);
      alert("Failed to accept payment.");
    }
  };
  
  const sendNotification = async (notificationData) => {
    try {
  
      const response = await axios.post(
        "http://localhost:5000/api/notification/send",
        notificationData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (response.status === 200) {
        console.log("Notification sent successfully.");
      } else {
        console.warn("Notification API response status:", response.status);
      }
    } catch (error) {
      console.error("Failed to send notification:", error);
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

              {/* Supplier-specific functionality */}
              {isSupplier && order.status === "pending" && (
                <div className="mt-4">
                  <button
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mr-2"
                    onClick={() =>
                      handleStatusChange(order.order_id, "accepted")
                    }
                  >
                    Accept
                  </button>
                  <button
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    onClick={() =>
                      handleStatusChange(order.order_id, "rejected")
                    }
                  >
                    Reject
                  </button>
                </div>
              )}
              {isSupplier &&
                (() => {
                  // Find the payment for the current order
                  const payment = pendingPayments.find(
                    (payment) =>
                      payment.order_id === order.order_id &&
                      payment.status === "pending"
                  );

                  // Render the button if a matching payment is found
                  if (payment) {
                    return (
                      <button
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mt-2"
                        onClick={() => handleAcceptPayment(payment.payment_id , "acceptPayment")} // Pass payment_id to the function
                      >
                        Accept Payment for Rs {payment.amount}
                      </button>
                    );
                  }

                  return null; // No button if no payment found
                })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

SupplierDisplay.propTypes = {
  orders: PropTypes.array.isRequired,
  showAllOrders: PropTypes.bool.isRequired,
//   onResetOrders: PropTypes.func.isRequired,
  isSupplier: PropTypes.bool.isRequired,
};

export default SupplierDisplay;
