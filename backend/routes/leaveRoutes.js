const express = require("express");

const router = express.Router();

const {
    applyLeave,
    getMyLeaves,
    getAllLeaves,
    updateLeaveStatus,
    getStaffLeavesForDate
} = require("../controllers/leaveController");

const authenticateUser = require("../middleware/authMiddleware");
const authorizeAdmin = require("../middleware/adminMiddleware");


// ===============================
// STAFF ROUTES
// ===============================

// Staff applies for leave
router.post(
    "/",
    authenticateUser,
    applyLeave
);


// Staff views own leaves
router.get(
    "/my",
    authenticateUser,
    getMyLeaves
);

// Customer checks approved leaves of selected staff
router.get(
    "/staff/:staffId",
    getStaffLeavesForDate
);

// ===============================
// ADMIN ROUTES
// ===============================

// Admin views all leave requests
router.get(
    "/admin",
    authenticateUser,
    authorizeAdmin,
    getAllLeaves
);


// Admin approves/rejects/cancels leave
router.put(
    "/admin/:leaveId/status",
    authenticateUser,
    authorizeAdmin,
    updateLeaveStatus
);


module.exports = router;