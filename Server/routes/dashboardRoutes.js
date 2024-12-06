const express = require('express');
const {fetchUserProfile,getSuppliers,createOrder,getAllOrders, filterOrders,getVendors,updateStatus,paymentConfirm,paymentRequest,getPendingPayments} = require('../controllers/apiController');
const router = express.Router();
const {authenticateToken}=require('../middleware/authMiddleware');

router.get('/profile',authenticateToken,fetchUserProfile);
router.get('/supplier',authenticateToken,getSuppliers);
router.post('/order',authenticateToken,createOrder);
router.get('/getorders',authenticateToken,getAllOrders);
router.post('/filter',authenticateToken,filterOrders);
router.get('/vendor',authenticateToken,getVendors);
router.patch('/orders/:id',updateStatus)
router.post('/payments',authenticateToken,paymentRequest);
router.patch('/payments/:payment_id/confirm',paymentConfirm);
router.get('/payments/pending',authenticateToken,getPendingPayments);

module.exports = router;