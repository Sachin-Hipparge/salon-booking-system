const express = require("express");
const router = express.Router();

const authenticateUser = require("../middleware/authMiddleware");

const {
    createAppointment,
    getMyAppointments,
    getStaffAppointments,
    getAppointmentById,
    cancelAppointment,
    rescheduleAppointment
} = require("../controllers/appointmentController");


// Create appointment
router.post(
    "/",
    authenticateUser,
    createAppointment
);


// Get logged-in customer's appointments
router.get(
    "/my",
    authenticateUser,
    getMyAppointments
);


// Get staff appointments
router.get(
    "/staff/:staffId",
    authenticateUser,
    getStaffAppointments
);


// Get appointment by ID
router.get(
    "/:id",
    authenticateUser,
    getAppointmentById
);


// Cancel appointment
router.put(
    "/:id/cancel",
    authenticateUser,
    cancelAppointment
);

router.put(
    "/:id/reschedule",
    authenticateUser,
    rescheduleAppointment
);

module.exports = router;