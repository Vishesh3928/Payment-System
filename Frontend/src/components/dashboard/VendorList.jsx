import { useState, useEffect } from "react";
import axios from "axios";

function VendorList({ onFilterOrders, onResetOrders }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:5000/api/vendor", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setVendors(response.data.vendors);
      } catch (error) {
        setError("Failed to fetch vendors.");
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, [token]);

  const handleVendorClick = async (vendorId) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/filter",
        { filterId: vendorId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Pass the filtered orders to the parent component
      onFilterOrders(response.data.orders);
    } catch (error) {
      console.error("Error fetching filtered orders:", error);
    }
  };

  if (loading) {
    return <p>Loading vendors...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-2">Vendors</h3>
      <ul className="space-y-2">
        {vendors.map((vendor) => (
          <li
            key={vendor.id}
            className="p-2 bg-gray-200 rounded hover:bg-gray-300 cursor-pointer"
            onClick={() => handleVendorClick(vendor.vendor_id)}
          >
            {vendor.vendor_name}
          </li>
        ))}
      </ul>
      {/* Optional: Add a reset button in the Vendors list */}
      <button 
        onClick={onResetOrders}
        className="mt-4 w-full p-2 bg-gray-300 rounded hover:bg-gray-400"
      >
        All Orders
      </button>
    </div>
  );
}

export default VendorList;
