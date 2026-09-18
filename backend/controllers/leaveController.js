const db = require("../config/db");


/* =========================================================
   STAFF - APPLY FOR LEAVE
========================================================= */

const applyLeave = (req, res) => {

    const userId = req.user.id;

    const {
        leave_date,
        start_time,
        end_time,
        reason
    } = req.body;


    if (!leave_date || !start_time || !end_time) {

        return res.status(400).json({
            message: "Leave date, start time and end time are required"
        });

    }


    if (start_time >= end_time) {

        return res.status(400).json({
            message: "Start time must be before end time"
        });

    }


    /* Find staff record */

    const staffSql = `
        SELECT id, status
        FROM staff
        WHERE user_id = ?
    `;


    db.execute(
        staffSql,
        [userId],
        (err, staffResults) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    message: "Database error"
                });

            }


            if (staffResults.length === 0) {

                return res.status(404).json({
                    message: "Staff profile not found"
                });

            }


            const staff = staffResults[0];


            if (staff.status !== "ACTIVE") {

                return res.status(400).json({
                    message: "Staff account is inactive"
                });

            }


            const staffId = staff.id;


            /*
               Check whether another pending or approved
               leave already exists during this time.
            */

            const overlapSql = `
                SELECT id
                FROM staff_leaves
                WHERE staff_id = ?
                AND leave_date = ?
                AND status IN ('PENDING', 'APPROVED')
                AND start_time < ?
                AND end_time > ?
            `;


            db.execute(
                overlapSql,
                [
                    staffId,
                    leave_date,
                    end_time,
                    start_time
                ],
                (err, overlapResults) => {

                    if (err) {

                        console.error(err);

                        return res.status(500).json({
                            message: "Database error"
                        });

                    }


                    if (overlapResults.length > 0) {

                        return res.status(409).json({
                            message: "You already have a leave request during this time"
                        });

                    }


                    /* Insert leave */

                    const insertSql = `
                        INSERT INTO staff_leaves
                        (
                            staff_id,
                            leave_date,
                            start_time,
                            end_time,
                            reason,
                            status
                        )
                        VALUES (?, ?, ?, ?, ?, 'PENDING')
                    `;


                    db.execute(
                        insertSql,
                        [
                            staffId,
                            leave_date,
                            start_time,
                            end_time,
                            reason || null
                        ],
                        (err, result) => {

                            if (err) {

                                console.error(err);

                                return res.status(500).json({
                                    message: "Failed to apply for leave"
                                });

                            }


                            return res.status(201).json({

                                message: "Leave request submitted successfully",

                                leaveId: result.insertId

                            });

                        }
                    );

                }
            );

        }
    );

};


/* =========================================================
   STAFF - GET MY LEAVES
========================================================= */

const getMyLeaves = (req, res) => {

    const userId = req.user.id;


    const sql = `
        SELECT
            sl.id,
            sl.staff_id,

            /* Return date as plain YYYY-MM-DD string */
            DATE_FORMAT(sl.leave_date, '%Y-%m-%d') AS leave_date,

            sl.start_time,
            sl.end_time,
            sl.reason,
            sl.status,
            sl.created_at,
            sl.updated_at

        FROM staff_leaves sl

        JOIN staff s
            ON sl.staff_id = s.id

        WHERE s.user_id = ?

        ORDER BY
            sl.leave_date DESC,
            sl.start_time DESC
    `;


    db.execute(
        sql,
        [userId],
        (err, results) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    message: "Database error"
                });

            }


            return res.status(200).json({
                leaves: results
            });

        }
    );

};


/* =========================================================
   ADMIN - GET ALL LEAVES
========================================================= */

const getAllLeaves = (req, res) => {

    const sql = `
        SELECT
            sl.id,
            sl.staff_id,

            /* Return date as plain YYYY-MM-DD string */
            DATE_FORMAT(sl.leave_date, '%Y-%m-%d') AS leave_date,

            sl.start_time,
            sl.end_time,
            sl.reason,
            sl.status,
            sl.created_at,
            sl.updated_at,

            u.name AS staff_name,
            u.email AS staff_email,
            u.phone AS staff_phone

        FROM staff_leaves sl

        JOIN staff s
            ON sl.staff_id = s.id

        JOIN users u
            ON s.user_id = u.id

        ORDER BY
            sl.leave_date DESC,
            sl.start_time DESC
    `;


    db.execute(
        sql,
        [],
        (err, results) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    message: "Database error"
                });

            }


            return res.status(200).json({
                leaves: results
            });

        }
    );

};


/* =========================================================
   ADMIN - APPROVE / REJECT / CANCEL LEAVE
========================================================= */

const updateLeaveStatus = (req, res) => {

    const leaveId = req.params.leaveId;

    const { status } = req.body;


    const allowedStatuses = [
        "APPROVED",
        "REJECTED",
        "CANCELLED"
    ];


    if (!allowedStatuses.includes(status)) {

        return res.status(400).json({
            message: "Invalid leave status"
        });

    }


    /* Find leave */

    const findLeaveSql = `
        SELECT
            id,
            staff_id,
            leave_date,
            start_time,
            end_time,
            status
        FROM staff_leaves
        WHERE id = ?
    `;


    db.execute(
        findLeaveSql,
        [leaveId],
        (err, leaveResults) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    message: "Database error"
                });

            }


            if (leaveResults.length === 0) {

                return res.status(404).json({
                    message: "Leave request not found"
                });

            }


            const leave = leaveResults[0];


            /* Already cancelled */

            if (leave.status === "CANCELLED") {

                return res.status(400).json({
                    message: "This leave request has already been cancelled"
                });

            }


            /*
            ====================================================
            IMPORTANT:
            Before APPROVING leave, check existing appointments.
            ====================================================
            */

            if (status === "APPROVED") {

                const appointmentConflictSql = `
                    SELECT
                        a.id,
                        a.appointment_date,
                        a.start_time,
                        a.end_time,
                        a.status,

                        u.name AS customer_name,
                        s.name AS service_name

                    FROM appointments a

                    JOIN users u
                        ON a.user_id = u.id

                    JOIN services s
                        ON a.service_id = s.id

                    WHERE a.staff_id = ?

                    AND a.appointment_date = ?

                    AND a.status IN ('BOOKED', 'RESCHEDULED')

                    AND a.start_time < ?

                    AND a.end_time > ?
                `;


                db.execute(
                    appointmentConflictSql,
                    [
                        leave.staff_id,
                        leave.leave_date,
                        leave.end_time,
                        leave.start_time
                    ],
                    (err, appointmentResults) => {

                        if (err) {

                            console.error(err);

                            return res.status(500).json({
                                message: "Database error while checking appointments"
                            });

                        }


                        /*
                        =========================================
                        CONFLICT FOUND
                        =========================================
                        */

                        if (appointmentResults.length > 0) {

                            return res.status(409).json({

                                message:
                                    "Cannot approve leave because the staff has existing appointments during this time",

                                conflicts:
                                    appointmentResults

                            });

                        }


                        /*
                        =========================================
                        NO CONFLICT → APPROVE
                        =========================================
                        */

                        updateLeaveStatusInDatabase(
                            leaveId,
                            status,
                            res
                        );

                    }
                );

                return;

            }


            /*
            ====================================================
            REJECT / CANCEL
            ====================================================
            */

            updateLeaveStatusInDatabase(
                leaveId,
                status,
                res
            );

        }
    );

};


/* =========================================================
   HELPER - UPDATE LEAVE STATUS
========================================================= */

const updateLeaveStatusInDatabase = (
    leaveId,
    status,
    res
) => {

    const sql = `
        UPDATE staff_leaves
        SET status = ?
        WHERE id = ?
    `;


    db.execute(
        sql,
        [status, leaveId],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    message: "Failed to update leave status"
                });

            }


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    message: "Leave request not found"
                });

            }


            return res.status(200).json({

                message:
                    `Leave request ${status.toLowerCase()} successfully`

            });

        }
    );

};

/* =========================================================
   CUSTOMER - GET APPROVED STAFF LEAVES FOR A DATE
========================================================= */

const getStaffLeavesForDate = (req, res) => {

    const { staffId } = req.params;
    const { date } = req.query;


    if (
        !Number.isInteger(Number(staffId)) ||
        Number(staffId) <= 0
    ) {

        return res.status(400).json({
            message: "Invalid staff ID"
        });

    }


    if (!date) {

        return res.status(400).json({
            message: "Date is required"
        });

    }


    const sql = `
        SELECT
            id,
            staff_id,
            DATE_FORMAT(
                leave_date,
                '%Y-%m-%d'
            ) AS leave_date,
            start_time,
            end_time,
            status
        FROM staff_leaves
        WHERE staff_id = ?
          AND leave_date = ?
          AND status = 'APPROVED'
        ORDER BY start_time ASC
    `;


    db.execute(
        sql,
        [staffId, date],
        (err, results) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    message: "Failed to fetch staff leaves"
                });

            }


            return res.status(200).json({
                leaves: results
            });

        }
    );

};


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
    applyLeave,
    getMyLeaves,
    getAllLeaves,
    updateLeaveStatus,
    getStaffLeavesForDate
};