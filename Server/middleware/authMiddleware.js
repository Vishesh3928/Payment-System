const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Get the token from Authorization header

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, "12352452fjsdh"); // Use the same secret key as used during signing
    req.user = decoded; // Attach the decoded token data to the request object
    next(); // Proceed to the next middleware/route handler
  } catch (error) {
    console.error('Invalid token:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};
function getUserIdFromToken(token){
  const decoded = jwt.verify(token, "12352452fjsdh"); // Use the same secret key as used during signing
    req.user = decoded;
    console.log(user_id);
    return req.user_id
}
module.exports = {authenticateToken,getUserIdFromToken};
