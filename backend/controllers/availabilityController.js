const db = require("../config/db");


// =========================================
// CREATE AVAILABILITY
// Admin only
// =========================================

const createAvailability = (req, res) => {
    const { staffId } = req.params;

    const {
        day_of_week,
        start_time,
        end_time,
        is_available
    } = req.body;

    if (
        !Number.isInteger(Number(staffId)) ||
        Number(staffId) <= 0
    ) {
        return res.status(400).json({
            message: "Invalid staff ID"
        });
    }

    if (!day_of_week || !start_time || !end_time) {
        return res.status(400).json({
            message: "Day, start time and end time are required"
        });
    }

    const validDays = [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY"
    ];

    if (!validDays.includes(day_of_week)) {
        return res.status(400).json({
            message: "Invalid day of week"
        });
    }

    if (start_time >= end_time) {
        return res.status(400).json({
            message: "End time must be greater than start time"
        });
    }

    const staffQuery = `
        SELECT id
        FROM staff
        WHERE id = ?
          AND status = 'ACTIVE'
    `;

    db.execute(
        staffQuery,
        [staffId],
        (staffErr, staffResults) => {
            if (staffErr) {
                console.error(staffErr);

                return res.status(500).json({
                    message: "Failed to check staff"
                });
            }

            if (staffResults.length === 0) {
                return res.status(404).json({
                    message: "Staff not found"
                });
            }

            // Check whether this day already exists
            const existingQuery = `
                SELECT id
                FROM availability
                WHERE staff_id = ?
                  AND day_of_week = ?
            `;

            db.execute(
                existingQuery,
                [staffId, day_of_week],
                (existingErr, existingResults) => {
                    if (existingErr) {
                        console.error(existingErr);

                        return res.status(500).json({
                            message: "Failed to check existing availability"
                        });
                    }

                    if (existingResults.length > 0) {
                        return res.status(409).json({
                            message: "Availability already exists for this day"
                        });
                    }

                    const insertQuery = `
                        INSERT INTO availability
                        (
                            staff_id,
                            day_of_week,
                            start_time,
                            end_time,
                            is_available
                        )
                        VALUES (?, ?, ?, ?, ?)
                    `;

                    db.execute(
                        insertQuery,
                        [
                            staffId,
                            day_of_week,
                            start_time,
                            end_time,
                            is_available !== undefined
                                ? is_available
                                : true
                        ],
                        (insertErr, result) => {
                            if (insertErr) {
                                console.error(insertErr);

                                return res.status(500).json({
                                    message: "Failed to create availability"
                                });
                            }

                            return res.status(201).json({
                                message: "Availability created successfully",
                                availabilityId: result.insertId
                            });
                        }
                    );
                }
            );
        }
    );
};


// =========================================
// GET STAFF AVAILABILITY
// Public
// =========================================

const getStaffAvailability = (req, res) => {
    const { staffId } = req.params;

    if (
        !Number.isInteger(Number(staffId)) ||
        Number(staffId) <= 0
    ) {
        return res.status(400).json({
            message: "Invalid staff ID"
        });
    }

    const query = `
        SELECT
            id,
            staff_id,
            day_of_week,
            start_time,
            end_time,
            is_available
        FROM availability
        WHERE staff_id = ?
        ORDER BY FIELD(
            day_of_week,
            'MONDAY',
            'TUESDAY',
            'WEDNESDAY',
            'THURSDAY',
            'FRIDAY',
            'SATURDAY',
            'SUNDAY'
        )
    `;

    db.execute(
        query,
        [staffId],
        (err, results) => {
            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Failed to fetch availability"
                });
            }

            return res.status(200).json({
                availability: results
            });
        }
    );
};


// =========================================
// UPDATE AVAILABILITY
// Admin only
// =========================================

const updateAvailability = (req, res) => {
    const { id } = req.params;

    const {
        day_of_week,
        start_time,
        end_time,
        is_available
    } = req.body;

    if (
        !Number.isInteger(Number(id)) ||
        Number(id) <= 0
    ) {
        return res.status(400).json({
            message: "Invalid availability ID"
        });
    }

    if (!day_of_week || !start_time || !end_time) {
        return res.status(400).json({
            message: "Day, start time and end time are required"
        });
    }

    const validDays = [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY"
    ];

    if (!validDays.includes(day_of_week)) {
        return res.status(400).json({
            message: "Invalid day of week"
        });
    }

    if (start_time >= end_time) {
        return res.status(400).json({
            message: "End time must be greater than start time"
        });
    }

    const query = `
        UPDATE availability
        SET
            day_of_week = ?,
            start_time = ?,
            end_time = ?,
            is_available = ?
        WHERE id = ?
    `;

    db.execute(
        query,
        [
            day_of_week,
            start_time,
            end_time,
            is_available !== undefined
                ? is_available
                : true,
            id
        ],
        (err, result) => {
            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Failed to update availability"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Availability not found"
                });
            }

            return res.status(200).json({
                message: "Availability updated successfully"
            });
        }
    );
};


// =========================================
// DELETE AVAILABILITY
// Admin only
// =========================================

const deleteAvailability = (req, res) => {
    const { id } = req.params;

    if (
        !Number.isInteger(Number(id)) ||
        Number(id) <= 0
    ) {
        return res.status(400).json({
            message: "Invalid availability ID"
        });
    }

    const query = `
        DELETE FROM availability
        WHERE id = ?
    `;

    db.execute(
        query,
        [id],
        (err, result) => {
            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Failed to delete availability"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Availability not found"
                });
            }

            return res.status(200).json({
                message: "Availability deleted successfully"
            });
        }
    );
};




module.exports = {
    createAvailability,
    getStaffAvailability,
    updateAvailability,
    deleteAvailability
};