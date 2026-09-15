const db = require("../config/db");


// CREATE REVIEW
const createReview = (req, res, next) => {

    const { appointmentId, rating, comment } = req.body;
    const userId = req.user.id;

    if (!appointmentId || !rating) {
        return res.status(400).json({
            message: "Appointment ID and rating are required"
        });
    }

    if (rating < 1 || rating > 5) {
        return res.status(400).json({
            message: "Rating must be between 1 and 5"
        });
    }

    const appointmentSql = `
        SELECT
            id,
            user_id,
            service_id,
            staff_id,
            status
        FROM appointments
        WHERE id = ?
    `;

    db.execute(
        appointmentSql,
        [appointmentId],
        (err, appointments) => {

            if (err) {
                return next(err);
            }

            if (appointments.length === 0) {
                return res.status(404).json({
                    message: "Appointment not found"
                });
            }

            const appointment = appointments[0];

            if (appointment.user_id !== userId) {
                return res.status(403).json({
                    message:
                        "You are not allowed to review this appointment"
                });
            }

            if (appointment.status !== "COMPLETED") {
                return res.status(400).json({
                    message:
                        "Review can only be submitted for a completed appointment"
                });
            }

            const checkReviewSql = `
                SELECT id
                FROM reviews
                WHERE appointment_id = ?
            `;

            db.execute(
                checkReviewSql,
                [appointmentId],
                (err, reviews) => {

                    if (err) {
                        return next(err);
                    }

                    if (reviews.length > 0) {
                        return res.status(400).json({
                            message:
                                "You have already reviewed this appointment"
                        });
                    }

                    const insertReviewSql = `
                        INSERT INTO reviews
                        (
                            user_id,
                            appointment_id,
                            service_id,
                            staff_id,
                            rating,
                            comment
                        )
                        VALUES (?, ?, ?, ?, ?, ?)
                    `;

                    db.execute(
                        insertReviewSql,
                        [
                            userId,
                            appointmentId,
                            appointment.service_id,
                            appointment.staff_id,
                            rating,
                            comment || null
                        ],
                        (err, result) => {

                            if (err) {
                                return next(err);
                            }

                            return res.status(201).json({
                                message:
                                    "Review submitted successfully",
                                reviewId: result.insertId
                            });
                        }
                    );
                }
            );
        }
    );
};


// GET REVIEWS BY SERVICE
const getReviewsByService = (req, res, next) => {

    const { serviceId } = req.params;

    const sql = `
        SELECT
            r.id,
            r.rating,
            r.comment,
            r.staff_response,
            r.created_at,
            u.name AS customer_name
        FROM reviews r
        JOIN users u
            ON r.user_id = u.id
        WHERE r.service_id = ?
        ORDER BY r.created_at DESC
    `;

    db.execute(
        sql,
        [serviceId],
        (err, reviews) => {

            if (err) {
                return next(err);
            }

            return res.status(200).json({
                reviews
            });
        }
    );
};


// STAFF REPLY TO REVIEW
const respondToReview = (req, res, next) => {

    const { reviewId } = req.params;
    const { response } = req.body;

    const staffUserId = req.user.id;

    if (!response) {
        return res.status(400).json({
            message: "Response is required"
        });
    }

    const reviewSql = `
        SELECT
            r.id,
            r.staff_id
        FROM reviews r
        WHERE r.id = ?
    `;

    db.execute(
        reviewSql,
        [reviewId],
        (err, reviews) => {

            if (err) {
                return next(err);
            }

            if (reviews.length === 0) {
                return res.status(404).json({
                    message: "Review not found"
                });
            }

            const review = reviews[0];

            const staffSql = `
                SELECT id
                FROM staff
                WHERE id = ?
                AND user_id = ?
            `;

            db.execute(
                staffSql,
                [review.staff_id, staffUserId],
                (err, staff) => {

                    if (err) {
                        return next(err);
                    }

                    if (staff.length === 0) {
                        return res.status(403).json({
                            message:
                                "You are not allowed to respond to this review"
                        });
                    }

                    const updateSql = `
                        UPDATE reviews
                        SET staff_response = ?
                        WHERE id = ?
                    `;

                    db.execute(
                        updateSql,
                        [response, reviewId],
                        (err) => {

                            if (err) {
                                return next(err);
                            }

                            return res.status(200).json({
                                message:
                                    "Response added successfully"
                            });
                        }
                    );
                }
            );
        }
    );
};

// GET REVIEWS FOR LOGGED-IN STAFF
const getStaffReviews = (req, res) => {
    const userId = req.user.id;

    // Find the staff record belonging to the logged-in user
    const staffSql = `
        SELECT id
        FROM staff
        WHERE user_id = ?
    `;

    db.execute(staffSql, [userId], (err, staffResult) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err
            });
        }

        if (staffResult.length === 0) {
            return res.status(404).json({
                message: "Staff profile not found"
            });
        }

        const staffId = staffResult[0].id;

        const reviewSql = `
            SELECT
                r.id,
                r.rating,
                r.comment,
                r.staff_response,
                r.created_at,
                u.name AS customer_name,
                s.name AS service_name,
                r.appointment_id
            FROM reviews r
            JOIN users u
                ON r.user_id = u.id
            JOIN services s
                ON r.service_id = s.id
            WHERE r.staff_id = ?
            ORDER BY r.created_at DESC
        `;

        db.execute(reviewSql, [staffId], (err, reviews) => {
            if (err) {
                return res.status(500).json({
                    message: "Database error",
                    error: err
                });
            }

            res.status(200).json(reviews);
        });
    });
};

module.exports = {
    createReview,
    getReviewsByService,
    respondToReview,
    getStaffReviews
};