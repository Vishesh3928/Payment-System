const { Pool } = require('pg');
const pool = require('../config/db');

const fetchUserProfile = async (req, res) => {
    const { id } = req.user; // Extract user ID from request body
    try {
      // Query the database for user details
      const userCheck = await pool.query('SELECT * FROM users WHERE user_id = $1', [id]);
  
      // Check if the user was found
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Return the user details if found
      const user = userCheck.rows[0]; // Get the first user (there should be only one)
      return res.status(200).json({
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        phone_number: user.phone_number,
        // Add any other fields you want to include in the profile response
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return res.status(500).json({ message: 'Server error' });
    }
};

const updateStatus = async(req,res)=>{
  const {id} = req.params;
  const{status} = req.body;

  try {
    // Validate status
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    // Update order in the database
    const updatedOrder = await pool.query(
      "UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *",
      [status, id]
    );

    if (updatedOrder.rowCount === 0) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.status(200).json({ order: updatedOrder.rows[0] });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Failed to update order status." });
  }
}

const getSuppliers = async (req,res) =>{
  try {
    const{ id ,role } = req.user;
    if(role!="Vendor"){
      return res.status(404).json({ message: 'You are not a vendor' });

    }
    const vendorId = id; 
    const result = await pool.query(
      `SELECT DISTINCT u.user_id AS supplier_id, 
                      u.username AS supplier_name, 
                      u.email AS supplier_email
       FROM Orders o
       JOIN Users u ON o.supplier_id = u.user_id
       WHERE o.vendor_id = $1`,
      [vendorId] 
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No suppliers found. Start an Order ' });
    }
    res.status(200).json({ suppliers: result.rows });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getVendors = async (req, res) => {
  try {
    const { id, role } = req.user;

    // Check if the user is a Supplier
    if (role !== "Supplier") {
      return res.status(403).json({ message: "You are not a supplier" });
    }

    const supplierId = id;

    // Query to get the list of vendors with ongoing orders
    const result = await pool.query(
      `SELECT DISTINCT u.user_id AS vendor_id,
                      u.username AS vendor_name,
                      u.email AS vendor_email
       FROM Orders o
       JOIN Users u ON o.vendor_id = u.user_id
       WHERE o.supplier_id = $1`,
      [supplierId]
    );

    // If no vendors are found
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No vendors found. Start an Order" });
    }

    // Return the list of vendors
    res.status(200).json({ vendors: result.rows });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//order creation only for vendor
const createOrder = async (req, res) => {
  const{id} = req.user;
  const { supplier_name, supplier_phone, total_amount, description } = req.body;
  const vendor_id = id;

  // Validate the required fields
  if (!vendor_id || !supplier_name || !supplier_phone || !total_amount) {
    return res.status(400).json({ message: 'Vendor ID, Supplier Name, Supplier Phone, and Total Amount are required.' });
  }

  try {
    // Fetch the supplier_id using the supplier's name and phone number
    const supplierResult = await pool.query(
      `SELECT user_id FROM users WHERE username = $1 AND phone_number = $2 AND role = 'Supplier' 
      LIMIT 1`,
      [supplier_name, supplier_phone]
    );

    if (supplierResult.rows.length === 0) {
      return res.status(404).json({ message: 'Supplier not found. Please check the name and phone number.' });
    }

    const supplier_id = supplierResult.rows[0].user_id;

    // Insert the new order into the Orders table
    const orderResult = await pool.query(
      `INSERT INTO Orders (vendor_id, supplier_id, total_amount, remaining_amount, description)
       VALUES ($1, $2, $3, $3, $4)
       RETURNING *`,
      [vendor_id, supplier_id, total_amount, description]
    );

    // Return the created order
    res.status(201).json({ order: orderResult.rows[0] });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAllOrders = async (req, res) => {
  const { id, role } = req.user; // Assuming `req.user` contains authenticated user details

  try {
    let query = '';
    let values = [];

    if (role === 'Vendor') {
      // Query for vendors: Fetch orders where the user is the vendor
      query = `
        SELECT o.order_id, o.supplier_id, u.username AS supplier_name, o.total_amount, o.description, o.status, o.created_at,o.remaining_amount
        FROM orders o
        JOIN users u ON o.supplier_id = u.user_id
        WHERE o.vendor_id = $1
        ORDER BY o.created_at DESC
      `;
      values = [id];
    } else if (role === 'Supplier') {
      // Query for suppliers: Fetch orders where the user is the supplier
      query = `
        SELECT o.order_id, o.vendor_id, u.username AS vendor_name, o.total_amount, o.description, o.status, o.created_at,o.remaining_amount
        FROM Orders o
        JOIN Users u ON o.vendor_id = u.user_id
        WHERE o.supplier_id = $1
        ORDER BY o.created_at DESC
      `;
      values = [id];
    } else {
      // Invalid role
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Execute the query
    // console.log('Executing query:', query);
    // console.log('Values:', values);

    const result = await pool.query(query, values);

    // Return the orders
    res.status(200).json({ orders: result.rows });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const filterOrders = async (req, res) => {
  try {
    const { filterId } = req.body; // Extract ID (vendor or supplier) from the request body
    const { role, id } = req.user; // Extract user role and current user ID

    // Validate the role and filter based on the user's role
    if (role === "Vendor") {
      // Ensure a supplier ID is provided
      if (!filterId) {
        return res.status(400).json({
          message: "Please provide a supplier ID to filter orders.",
        });
      }
      // console.log(user_id,id)
      // Query to filter orders for a vendor based on the supplier ID
      const result = await pool.query(
        `SELECT o.order_id, 
                o.total_amount, 
                o.description, 
                o.status, 
                o.created_at, 
                u.user_id AS supplier_id, 
                u.username AS supplier_name 
         FROM Orders o
         JOIN Users u ON o.supplier_id = u.user_id
         WHERE o.vendor_id = $1 AND o.supplier_id = $2`,
        [id, filterId] // Filter orders by current vendor's ID and provided supplier ID
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "No orders found for the selected supplier.",
        });
      }

      return res.status(200).json({ orders: result.rows });
    } else if (role === "Supplier") {
      // Ensure a vendor ID is provided
      if (!filterId) {
        return res.status(400).json({
          message: "Please provide a vendor ID to filter orders.",
        });
      }

      // Query to filter orders for a supplier based on the vendor ID
      const result = await pool.query(
        `SELECT o.order_id, 
                o.total_amount, 
                o.description, 
                o.status, 
                o.created_at, 
                u.user_id AS vendor_id, 
                u.username AS vendor_name 
         FROM Orders o
         JOIN Users u ON o.vendor_id = u.user_id
         WHERE o.supplier_id = $1 AND o.vendor_id = $2`,
        [id, filterId] // Filter orders by current supplier's ID and provided vendor ID
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "No orders found for the selected vendor.",
        });
      }

      return res.status(200).json({ orders: result.rows });
    } else {
      // If the user's role is not valid
      return res.status(403).json({ message: "Unauthorized role." });
    }
  } catch (error) {
    console.error("Error filtering orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const paymentRequest = async(req ,res) =>{
  try {
    const { order_id, amount } = req.body;
    const userId = req.user.id; // Vendor making the payment
    // console.log(order_id,amount,userId);
    // Step 1: Validate the order exists
    const order = await pool.query("SELECT * FROM Orders WHERE order_id = $1", [
      order_id,
    ]);
    if (order.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }
    // Step 2: Ensure amount is less than the total amount of the order
    const remaining_amount = order.rows[0].remaining_amount;

    // if (amount > remaining_amount) {
    //   return res
    //     .status(400)
    //     .json({ message: "Amount must be less than the remaining order amount" });
    // }

    // Step 3: Insert payment request into Payments table
    const payment = await pool.query(
      `INSERT INTO Payments (order_id, paid_by, amount)
       VALUES ($1, $2, $3) RETURNING *`,
      [order_id, userId, amount]
    );

    res.status(201).json(payment.rows[0]);
  } catch (error) {
    console.error("Error creating payment request:", error);
    res.status(500).json({ message: "Server error" });
  }
}
const getPendingPayments=async(req,res)=>{
  try{
    const payments = await pool.query("SELECT * FROM payments WHERE status = 'pending'");
    res.status(200).json({payments:payments.rows});
  }catch(error){
    console.error("Error fetching pending payments:", error);
    res.status(500).json({ message: "Server error" });
  }
}
const paymentConfirm = async (req, res) => {
  try {
    const { payment_id } = req.params;

    // Step 1: Validate the payment exists
    const payment = await pool.query(
      "SELECT * FROM Payments WHERE payment_id = $1",
      [payment_id]
    );
    if (payment.rows.length === 0) {
      return res.status(404).json({ message: "Payment request not found" });
    }

    // Step 2: Check if the payment is already confirmed
    if (payment.rows[0].status === "confirmed") {
      return res
        .status(400)
        .json({ message: "Payment request is already confirmed" });
    }

    // Step 3: Get the associated order details to update remaining_amount
    const order = await pool.query(
      "SELECT * FROM Orders WHERE order_id = $1",
      [payment.rows[0].order_id]
    );
    if (order.rows.length === 0) {
      return res.status(404).json({ message: "Associated order not found" });
    }

    const { total_amount, remaining_amount } = order.rows[0];
    const { amount } = payment.rows[0];

    // Step 4: Check if the payment amount is less than or equal to the remaining amount


    // Step 5: Update the payment status to 'confirmed' and set confirmed_at timestamp
    const updatedPayment = await pool.query(
      `UPDATE Payments
       SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP
       WHERE payment_id = $1
       RETURNING *`,
      [payment_id]
    );

    // Step 6: Deduct the payment amount from the remaining_amount in Orders table
    const updatedOrder = await pool.query(
      `UPDATE Orders
       SET remaining_amount = remaining_amount - $1
       WHERE order_id = $2
       RETURNING *`,
      [amount, payment.rows[0].order_id]
    );

    // Step 7: Return the updated payment and order details
    res.status(200).json({
      payment: updatedPayment.rows[0],
      order: updatedOrder.rows[0],
    });
  } catch (error) {
    console.error("Error confirming payment request:", error);
    res.status(500).json({ message: "Server error" });
  }
};





module.exports = { fetchUserProfile,getSuppliers,createOrder,getAllOrders,getVendors,filterOrders,updateStatus,paymentConfirm,paymentRequest,getPendingPayments};
  