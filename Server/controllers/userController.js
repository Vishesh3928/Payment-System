// userController.js
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const pool = require('../config/db');
var jwt = require('jsonwebtoken');
// const dotenv = require('dotenv');
// dotenv.config();
// Validation schema
const userSchema = Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().optional().allow(null, ''),
    phone_number: Joi.string().length(10).pattern(/^[0-9]+$/).required(),
    password: Joi.string().min(8).pattern(/^(?=.*[A-Z])(?=.*\d)/).required(),
    // confirm_password: Joi.any()
    //   .valid(Joi.ref('password'))
    //   .required()
    //   .messages({
    //     'any.only': 'Passwords do not match', // Custom error message for mismatch
    //   }),
    role: Joi.string().valid('Vendor', 'Supplier').required(),
  });

const registerUser = async (req, res) => {
  try {
    const { username, email, phone_number, password, role} = req.body;
    console.log(req.body)
    // Validate user input
    const { error } = userSchema.validate(req.body);
    // console.log('Validation error:', error.details[0].message);
    if (error) return res.status(400).json({ message: error.details[0].message });

    // Check if phone number already exists
    const phoneCheck = await pool.query('SELECT * FROM users WHERE phone_number = $1', [phone_number]);
    if (phoneCheck.rows.length > 0) return res.status(400).json({ message: 'Phone number already in use' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into database
    const result = await pool.query(
      'INSERT INTO users (username, email, phone_number, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [username, email, phone_number, hashedPassword, role]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { phone_number, password} = req.body;
    if (!phone_number || !password) {
      return res.status(400).json({ message: 'Phone number and password are required' });
    }
    // const { error } = userSchema.validate(req.body);
    // if (error) return res.status(400).json({ message: error.details[0].message });
 
    // Check if user exists
    const userCheck = await pool.query('SELECT * FROM users WHERE phone_number = $1', [phone_number]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = userCheck.rows[0];

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.user_id, username: user.username, phone_number: user.phone_number, role: user.role },
      "12352452fjsdh", // Use an environment variable for the secret key
      { expiresIn: '1h' } // Token expires in 1 hour
    );  

    // Respond with user details and token
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        phone_number: user.phone_number,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


module.exports = { registerUser ,loginUser};
