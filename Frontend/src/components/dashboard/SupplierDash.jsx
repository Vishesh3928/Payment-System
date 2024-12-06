import { useState } from "react";
import Profile from "./Profile";
// import SupplierList from "./SupplierList";
import VendorList from "./VendorList";
import Header from "./Header";
// import Display from "./Display";
import SupplierDisplay from "./SupplierDisplay"
import './dash.css';

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
      <div className="w-1/5 bg-gray-100 flex flex-col ">
        <div className="absolute top-4 left-4">
          <Profile />
        </div>
        <div className="mt-20 flex-1 overflow-y-auto">
          <VendorList 
            onFilterOrders={handleFilterOrders} 
            onResetOrders={handleResetOrders} // Add this prop
          />
        </div>
      </div>
      <div className="w-4/5 bg-white  flex flex-col">
        <div className="h-14 bg-black">
          <Header />
        </div>
        <div className="flex-1 p-4  mt-2">
          <SupplierDisplay
            orders={filteredOrders}
            showAllOrders={showAllOrders}
            isSupplier={true}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;