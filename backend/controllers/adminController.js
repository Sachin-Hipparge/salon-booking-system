const db = require("../config/db");



/* =========================================================
   ADMIN DASHBOARD
========================================================= */

const getDashboard = (req, res, next) => {

    const sql = `
        SELECT

            (
                SELECT COUNT(*)
                FROM users
                WHERE role = 'CUSTOMER'
            ) AS total_customers,

            (
                SELECT COUNT(*)
                FROM users
                WHERE role = 'STAFF'
            ) AS total_staff,

            (
                SELECT COUNT(*)
                FROM services
            ) AS total_services,

            (
                SELECT COUNT(*)
                FROM appointments
            ) AS total_appointments,

            (
                SELECT COUNT(*)
                FROM appointments
                WHERE status = 'COMPLETED'
            ) AS completed_appointments,

            (
                SELECT COUNT(*)
                FROM appointments
                WHERE status = 'CANCELLED'
            ) AS cancelled_appointments,

            (
                SELECT COUNT(*)
                FROM appointments
                WHERE status = 'BOOKED'
            ) AS booked_appointments,

            (
                SELECT COALESCE(SUM(amount), 0)
                FROM payments
                WHERE status = 'SUCCESS'
            ) AS total_revenue
    `;


    db.execute(
        sql,
        (err, results) => {

            if (err) {

                return next(err);

            }


            return res.status(200).json({

                message:
                    "Admin dashboard data fetched successfully",

                dashboard:
                    results[0]

            });

        }
    );

};



/* =========================================================
   GET ALL APPOINTMENTS
========================================================= */

const getAllAppointments = (req, res, next) => {

    const sql = `
        SELECT

            a.id,

            u.name AS customer_name,

            su.name AS staff_name,

            s.name AS service_name,

            /* Keep appointment date as plain YYYY-MM-DD */
            DATE_FORMAT(
                a.appointment_date,
                '%Y-%m-%d'
            ) AS appointment_date,

            a.start_time,

            a.end_time,

            a.status,

            a.payment_status,

            a.payment_id,

            a.created_at

        FROM appointments a

        JOIN users u
            ON a.user_id = u.id

        JOIN staff st
            ON a.staff_id = st.id

        JOIN users su
            ON st.user_id = su.id

        JOIN services s
            ON a.service_id = s.id

        ORDER BY
            a.appointment_date DESC,
            a.start_time DESC
    `;


    db.execute(
        sql,
        (err, appointments) => {

            if (err) {

                return next(err);

            }


            return res.status(200).json({

                message:
                    "Appointments fetched successfully",

                appointments

            });

        }
    );

};



/* =========================================================
   UPDATE APPOINTMENT STATUS
========================================================= */

const updateAppointmentStatus = (req, res, next) => {

    const { appointmentId } = req.params;

    const { status } = req.body;


    const allowedStatuses = [

        "BOOKED",

        "COMPLETED",

        "CANCELLED",

        "RESCHEDULED"

    ];


    if (!status) {

        return res.status(400).json({

            message:
                "Status is required"

        });

    }


    if (!allowedStatuses.includes(status)) {

        return res.status(400).json({

            message:
                "Invalid status. Allowed values: BOOKED, COMPLETED, CANCELLED, RESCHEDULED"

        });

    }


    const checkSql = `
        SELECT id
        FROM appointments
        WHERE id = ?
    `;


    db.execute(
        checkSql,
        [appointmentId],
        (err, appointments) => {

            if (err) {

                return next(err);

            }


            if (appointments.length === 0) {

                return res.status(404).json({

                    message:
                        "Appointment not found"

                });

            }


            const updateSql = `
                UPDATE appointments
                SET status = ?
                WHERE id = ?
            `;


            db.execute(
                updateSql,
                [status, appointmentId],
                (err) => {

                    if (err) {

                        return next(err);

                    }


                    return res.status(200).json({

                        message:
                            "Appointment status updated successfully",

                        appointmentId:
                            Number(appointmentId),

                        status

                    });

                }
            );

        }
    );

};



/* =========================================================
   GET ALL USERS
========================================================= */

const getAllUsers = (req, res, next) => {

    const sql = `
        SELECT
            id,
            name,
            email,
            phone,
            role,
            created_at
        FROM users
        ORDER BY created_at DESC
    `;


    db.execute(
        sql,
        (err, users) => {

            if (err) {

                return next(err);

            }


            return res.status(200).json({

                message:
                    "Users fetched successfully",

                users

            });

        }
    );

};



/* =========================================================
   GET ALL SERVICES
========================================================= */

const getAllServices = (req, res, next) => {

    const sql = `
        SELECT
            id,
            name,
            description,
            duration,
            price,
            status,
            created_at,
            updated_at
        FROM services
        ORDER BY created_at DESC
    `;


    db.execute(
        sql,
        (err, services) => {

            if (err) {

                return next(err);

            }


            return res.status(200).json({

                message:
                    "Services fetched successfully",

                services

            });

        }
    );

};



/* =========================================================
   ACTIVATE / DEACTIVATE SERVICE
========================================================= */

const updateServiceStatus = (req, res, next) => {

    const { serviceId } = req.params;

    const { status } = req.body;


    if (!status) {

        return res.status(400).json({

            message:
                "Status is required"

        });

    }


    if (!["ACTIVE", "INACTIVE"].includes(status)) {

        return res.status(400).json({

            message:
                "Invalid status. Allowed values: ACTIVE, INACTIVE"

        });

    }


    const checkSql = `
        SELECT id
        FROM services
        WHERE id = ?
    `;


    db.execute(
        checkSql,
        [serviceId],
        (err, services) => {

            if (err) {

                return next(err);

            }


            if (services.length === 0) {

                return res.status(404).json({

                    message:
                        "Service not found"

                });

            }


            const updateSql = `
                UPDATE services
                SET status = ?
                WHERE id = ?
            `;


            db.execute(
                updateSql,
                [status, serviceId],
                (err) => {

                    if (err) {

                        return next(err);

                    }


                    return res.status(200).json({

                        message:
                            "Service status updated successfully",

                        serviceId:
                            Number(serviceId),

                        status

                    });

                }
            );

        }
    );

};



/* =========================================================
   GET ALL PAYMENTS
========================================================= */

const getAllPayments = (req, res, next) => {

    const sql = `
        SELECT
            p.id,
            p.appointment_id,
            u.name AS customer_name,
            s.name AS service_name,
            p.payment_gateway,
            p.transaction_id,
            p.amount,
            p.status,
            p.created_at

        FROM payments p

        JOIN appointments a
            ON p.appointment_id = a.id

        JOIN users u
            ON a.user_id = u.id

        JOIN services s
            ON a.service_id = s.id

        ORDER BY
            p.created_at DESC
    `;


    db.execute(
        sql,
        (err, payments) => {

            if (err) {

                return next(err);

            }


            return res.status(200).json({

                message:
                    "Payments fetched successfully",

                payments

            });

        }
    );

};



/* =========================================================
   GET ALL REVIEWS
========================================================= */

const getAllReviews = (req, res, next) => {

    const sql = `
        SELECT
            r.id,
            r.rating,
            r.comment,
            r.staff_response,
            u.name AS customer_name,
            s.name AS service_name,
            su.name AS staff_name,
            r.created_at

        FROM reviews r

        JOIN users u
            ON r.user_id = u.id

        JOIN services s
            ON r.service_id = s.id

        JOIN staff st
            ON r.staff_id = st.id

        JOIN users su
            ON st.user_id = su.id

        ORDER BY
            r.created_at DESC
    `;


    db.execute(
        sql,
        (err, reviews) => {

            if (err) {

                return next(err);

            }


            return res.status(200).json({

                message:
                    "Reviews fetched successfully",

                reviews

            });

        }
    );

};



/* =========================================================
   GET ALL STAFF
========================================================= */

const getAllStaff = (req, res, next) => {

    const sql = `
        SELECT

            st.id AS staff_id,

            u.id AS user_id,

            u.name,

            u.email,

            u.phone,

            st.specialization,

            st.bio,

            st.status,

            GROUP_CONCAT(
                s.name
                SEPARATOR ', '
            ) AS services

        FROM staff st

        JOIN users u
            ON st.user_id = u.id

        LEFT JOIN staff_services ss
            ON st.id = ss.staff_id

        LEFT JOIN services s
            ON ss.service_id = s.id

        GROUP BY

            st.id,

            u.id,

            u.name,

            u.email,

            u.phone,

            st.specialization,

            st.bio,

            st.status

        ORDER BY
            u.name
    `;


    db.execute(
        sql,
        (err, staff) => {

            if (err) {

                return next(err);

            }


            return res.status(200).json({

                message:
                    "Staff fetched successfully",

                staff

            });

        }
    );

};



/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

    getDashboard,

    getAllAppointments,

    updateAppointmentStatus,

    getAllUsers,

    getAllServices,

    updateServiceStatus,

    getAllPayments,

    getAllReviews,

    getAllStaff

};