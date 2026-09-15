const express = require("express");

const router = express.Router();

const {
    createInvoice,
    getInvoice
} = require("../controllers/invoiceController");

const authenticateUser = require("../middleware/authMiddleware");

// Create invoice
router.post(
    "/",
    authenticateUser,
    createInvoice
);

// Get invoice
router.get(
    "/:appointmentId",
    authenticateUser,
    getInvoice
);

module.exports = router;