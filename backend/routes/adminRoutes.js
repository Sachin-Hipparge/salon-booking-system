const express = require("express");

const router = express.Router();

const {
    getDashboard,
    getAllAppointments,
    updateAppointmentStatus,
    getAllUsers,
    getAllServices,
    updateServiceStatus,
    getAllPayments,
    getAllReviews,
    getAllStaff
} = require("../controllers/adminController");

const authenticateUser = require("../middleware/authMiddleware");
const authorizeAdmin = require("../middleware/adminMiddleware");


// ==========================================
// DASHBOARD
// ==========================================

router.get(
    "/dashboard",
    authenticateUser,
    authorizeAdmin,
    getDashboard
);


// ==========================================
// APPOINTMENTS
// ==========================================

router.get(
    "/appointments",
    authenticateUser,
    authorizeAdmin,
    getAllAppointments
);

router.put(
    "/appointments/:appointmentId/status",
    authenticateUser,
    authorizeAdmin,
    updateAppointmentStatus
);


// ==========================================
// USERS
// ==========================================

router.get(
    "/users",
    authenticateUser,
    authorizeAdmin,
    getAllUsers
);


// ==========================================
// SERVICES
// ==========================================

router.get(
    "/services",
    authenticateUser,
    authorizeAdmin,
    getAllServices
);

router.put(
    "/services/:serviceId/status",
    authenticateUser,
    authorizeAdmin,
    updateServiceStatus
);


// ==========================================
// PAYMENTS
// ==========================================

router.get(
    "/payments",
    authenticateUser,
    authorizeAdmin,
    getAllPayments
);


// ==========================================
// REVIEWS
// ==========================================

router.get(
    "/reviews",
    authenticateUser,
    authorizeAdmin,
    getAllReviews
);


// ==========================================
// STAFF
// ==========================================

router.get(
    "/staff",
    authenticateUser,
    authorizeAdmin,
    getAllStaff
);


// ==========================================
// ADMIN TEST
// ==========================================

router.get(
    "/test",
    authenticateUser,
    authorizeAdmin,
    (req, res) => {

        res.json({
            message: "Admin access granted"
        });

    }
);


module.exports = router;