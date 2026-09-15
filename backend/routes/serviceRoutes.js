const express = require("express");

const router = express.Router();

const authenticateUser = require("../middleware/authMiddleware");
const authorizeAdmin = require("../middleware/adminMiddleware");

const {
    createService,
    getAllServices,
    getServiceById,
    updateService,
    deleteService
} = require("../controllers/serviceController");


// =========================================
// PUBLIC ROUTES
// =========================================

// Get all active services
router.get("/", getAllServices);

// Get one active service
router.get("/:id", getServiceById);


// =========================================
// ADMIN ROUTES
// =========================================

// Create service
router.post(
    "/",
    authenticateUser,
    authorizeAdmin,
    createService
);

// Update service
router.put(
    "/:id",
    authenticateUser,
    authorizeAdmin,
    updateService
);

// Delete/deactivate service
router.delete(
    "/:id",
    authenticateUser,
    authorizeAdmin,
    deleteService
);


module.exports = router;