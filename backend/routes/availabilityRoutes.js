const express = require("express");

const router = express.Router();

const authenticateUser = require("../middleware/authMiddleware");
const authorizeAdmin = require("../middleware/adminMiddleware");

const {
    createAvailability,
    getStaffAvailability,
    updateAvailability,
    deleteAvailability
} = require("../controllers/availabilityController");


// =========================================
// PUBLIC ROUTES
// =========================================

// Get availability of a staff member
router.get(
    "/staff/:staffId",
    getStaffAvailability
);


// =========================================
// ADMIN ROUTES
// =========================================

// Create availability
router.post(
    "/staff/:staffId",
    authenticateUser,
    authorizeAdmin,
    createAvailability
);

// Update availability
router.put(
    "/:id",
    authenticateUser,
    authorizeAdmin,
    updateAvailability
);

// Delete availability
router.delete(
    "/:id",
    authenticateUser,
    authorizeAdmin,
    deleteAvailability
);


module.exports = router;