import { useState } from "react";
import Profile from "./Profile";
import SupplierList from "./SupplierList";
import Header from "./Header";
import Display from "./Display";
import proofile from "./proofile"
function Dashboard() {
  const [filteredOrders, setFilteredOrders] = useState([]); 
  const [showAllOrders, setShowAllOrders] = useState(true); 

  // Callback to handle filtering orders
  const handleFilterOrders = (orders) => {
    setFilteredOrders(orders);
    setShowAllOrders(false);
  };

  // Reset to show all orders
  const handleResetOrders = () => {
    setFilteredOrders([]); // Clear filtered orders
    setShowAllOrders(true); // Explicitly set to show all orders
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-1/5 bg-gray-100 flex flex-col relative">
        {/* Profile Icon */}
        <div className="absolute top-4 left-4">
          <Profile />
        </div>

        {/* Supplier List */}
        <div className="mt-20 flex-1 overflow-y-auto">
          <SupplierList 
            onFilterOrders={handleFilterOrders} 
            onResetOrders={handleResetOrders} // Add this prop
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-4/5 bg-white h-screen flex flex-col">
        {/* Header */}
        <div className="h-14">
          <Header />
        </div>

        {/* Display Section (Orders) */}
        <div className="flex-1 overflow-y-auto p-4">
          <Display
            orders={filteredOrders}
            showAllOrders={showAllOrders}
            onResetOrders={handleResetOrders}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;