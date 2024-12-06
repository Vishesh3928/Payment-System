const client = require('../config/db');  
const crypto = require('crypto');

const generateOtp = async (userId) => {
  // Generate a 6-digit OTP code
  const otpCode = crypto.randomInt(100000, 999999).toString();

  // Set expiration time (e.g., 10 minutes from now)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  try {
    // Insert OTP into the database
    const result = await client.query(
      'INSERT INTO otp (user_id, otp_code, expires_at) VALUES ($1, $2, $3) RETURNING *',
      [userId, otpCode, expiresAt]
    );

    return {
      otpId: result.rows[0].otp_id,
      otpCode,   // Send this to the user's phone in the registerUser function
      expiresAt
    };
  } catch (error) {
    console.error('Error generating OTP:', error);
    throw new Error('Failed to generate OTP');
  }
};

module.exports = generateOtp;
