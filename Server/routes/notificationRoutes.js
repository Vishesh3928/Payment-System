const express = require('express');
const notificationSetter=require('../middleware/notificationSetterMiddleware');
const {authenticateToken}=require('../middleware/authMiddleware');

const router = express.Router();

const{createNotification,fetchNotifications}=require('../controllers/notificationController');


router.post('/send',authenticateToken,notificationSetter,createNotification);
router.get('/fetch',authenticateToken,fetchNotifications);

module.exports=router;
