const express = require("express");

const router = express.Router();

const {
    createReview,
    getReviewsByService,
    respondToReview,
    getStaffReviews,
    getMyReviews
} = require("../controllers/reviewController");

const authenticateUser = require("../middleware/authMiddleware");


// Customer creates review
router.post(
    "/",
    authenticateUser,
    createReview
);


// Anyone can view service reviews
router.get(
    "/service/:serviceId",
    getReviewsByService
);


// Staff responds to review
router.put(
    "/:reviewId/respond",
    authenticateUser,
    respondToReview
);

router.get(
    "/my",
    authenticateUser,
    getMyReviews
);

router.get("/staff/my", authenticateUser, getStaffReviews);


module.exports = router;