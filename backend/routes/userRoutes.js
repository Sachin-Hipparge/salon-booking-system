const express = require("express");
const router = express.Router();

const authenticateUser = require("../middleware/authMiddleware");

const {
    getProfile,
    updateProfile
} = require("../controllers/userController");

router.get(
    "/profile",
    authenticateUser,
    getProfile
);

router.put(
    "/profile",
    authenticateUser,
    updateProfile
);

module.exports = router;