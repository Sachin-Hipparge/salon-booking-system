const express = require("express");

const router = express.Router();

const authenticateUser = require("../middleware/authMiddleware");
const authorizeAdmin = require("../middleware/adminMiddleware");

const {
    createStaff,
    getAllStaff,
    getStaffById,
    updateStaff,
    deleteStaff,
    assignServiceToStaff,
    getStaffServices,
    removeServiceFromStaff,
    getStaffByService
} = require("../controllers/staffController");


// =========================================
// PUBLIC ROUTES
// =========================================

// Get all active staff
router.get("/", getAllStaff);

router.get(
    "/service/:serviceId",
    authenticateUser,
    getStaffByService
);

// Get one staff member
router.get("/:id", getStaffById);

// Get services assigned to staff
router.get("/:staffId/services", getStaffServices);


// =========================================
// ADMIN ROUTES
// =========================================

// Create staff
router.post(
    "/",
    authenticateUser,
    authorizeAdmin,
    createStaff
);

// Update staff
router.put(
    "/:id",
    authenticateUser,
    authorizeAdmin,
    updateStaff
);

// Delete/deactivate staff
router.delete(
    "/:id",
    authenticateUser,
    authorizeAdmin,
    deleteStaff
);

// Assign service to staff
router.post(
    "/:staffId/services",
    authenticateUser,
    authorizeAdmin,
    assignServiceToStaff
);

// Remove service from staff
router.delete(
    "/:staffId/services/:serviceId",
    authenticateUser,
    authorizeAdmin,
    removeServiceFromStaff
);




module.exports = router;