import { useState, useEffect } from "react";
import axios from "axios";

function SupplierList({ onFilterOrders, onResetOrders }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:5000/api/supplier", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // console.log(response.data.suppliers)
        setSuppliers(response.data.suppliers);
      } catch (error) {
        setError("Failed to fetch suppliers.");
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, [token]);

  const handleSupplierClick = async (filterId) => {
    try {
      // console.log(supplierId);
      const response = await axios.post(
        "http://localhost:5000/api/filter",
        { filterId },
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
    return <p>Loading suppliers...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-2">Suppliers</h3>
      <ul className="space-y-2">
        {suppliers.map((supplier) => (
          <li
            key={supplier.id}
            className="p-2 bg-gray-200 rounded hover:bg-gray-300 cursor-pointer"
            onClick={() => handleSupplierClick(supplier.supplier_id)}
          >
            {supplier.supplier_name}
          </li>
        ))}
      </ul>
      {/* Optional: Add a reset button in the Suppliers list */}
      <button 
        onClick={onResetOrders}
        className="mt-4 w-full p-2 bg-gray-300 rounded hover:bg-gray-400"
      >
        All Orders
      </button>
    </div>
  );
}

export default SupplierList;