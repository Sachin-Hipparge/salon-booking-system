const express = require("express");

const router = express.Router();

const {
    createPaymentOrder,
    verifyPayment
} = require("../controllers/paymentController");

const authenticateUser = require("../middleware/authMiddleware");


// Create Razorpay order
router.post(
    "/create-order",
    authenticateUser,
    createPaymentOrder
);


// Verify Razorpay payment
router.post(
    "/verify",
    authenticateUser,
    verifyPayment
);


module.exports = router;