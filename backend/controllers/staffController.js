const db = require("../config/db");
const bcrypt = require("bcryptjs");


// =========================================
// CREATE STAFF
// Admin only
// =========================================

const createStaff = async (req, res) => {
    const {
        name,
        email,
        password,
        phone,
        specialization,
        bio
    } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "Name, email and password are required"
        });
    }

    try {
        const checkQuery = `
            SELECT id
            FROM users
            WHERE email = ?
        `;

        db.execute(
            checkQuery,
            [email],
            async (err, results) => {
                if (err) {
                    console.error(err);

                    return res.status(500).json({
                        message: "Failed to check staff email"
                    });
                }

                if (results.length > 0) {
                    return res.status(409).json({
                        message: "Email already registered"
                    });
                }

                const hashedPassword = await bcrypt.hash(
                    password,
                    10
                );

                const userQuery = `
                    INSERT INTO users
                    (name, email, password, phone, role)
                    VALUES (?, ?, ?, ?, 'STAFF')
                `;

                db.execute(
                    userQuery,
                    [
                        name,
                        email,
                        hashedPassword,
                        phone || null
                    ],
                    (userErr, userResult) => {
                        if (userErr) {
                            console.error(userErr);

                            return res.status(500).json({
                                message: "Failed to create staff user"
                            });
                        }

                        const userId = userResult.insertId;

                        const staffQuery = `
                            INSERT INTO staff
                            (user_id, specialization, bio)
                            VALUES (?, ?, ?)
                        `;

                        db.execute(
                            staffQuery,
                            [
                                userId,
                                specialization || null,
                                bio || null
                            ],
                            (staffErr, staffResult) => {
                                if (staffErr) {
                                    console.error(staffErr);

                                    return res.status(500).json({
                                        message: "Staff user created but staff profile creation failed"
                                    });
                                }

                                return res.status(201).json({
                                    message: "Staff created successfully",
                                    staffId: staffResult.insertId,
                                    userId: userId
                                });
                            }
                        );
                    }
                );
            }
        );

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to create staff"
        });
    }
};


// =========================================
// GET ALL ACTIVE STAFF
// Public
// =========================================

const getAllStaff = (req, res) => {
    const query = `
        SELECT
            s.id,
            s.user_id,
            u.name,
            u.email,
            u.phone,
            s.specialization,
            s.bio,
            s.status
        FROM staff s
        INNER JOIN users u
            ON s.user_id = u.id
        WHERE s.status = 'ACTIVE'
        ORDER BY s.id DESC
    `;

    db.execute(query, (err, results) => {
        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Failed to fetch staff"
            });
        }

        return res.status(200).json({
            staff: results
        });
    });
};


// =========================================
// GET STAFF BY ID
// Public
// =========================================

const getStaffById = (req, res) => {
    const { id } = req.params;

    if (
        !Number.isInteger(Number(id)) ||
        Number(id) <= 0
    ) {
        return res.status(400).json({
            message: "Invalid staff ID"
        });
    }

    const query = `
        SELECT
            s.id,
            s.user_id,
            u.name,
            u.email,
            u.phone,
            s.specialization,
            s.bio,
            s.status
        FROM staff s
        INNER JOIN users u
            ON s.user_id = u.id
        WHERE s.id = ?
          AND s.status = 'ACTIVE'
    `;

    db.execute(query, [id], (err, results) => {
        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Failed to fetch staff"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Staff not found"
            });
        }

        return res.status(200).json({
            staff: results[0]
        });
    });
};


// =========================================
// UPDATE STAFF
// Admin only
// =========================================

const updateStaff = (req, res) => {
    const { id } = req.params;

    const {
        name,
        phone,
        specialization,
        bio,
        status
    } = req.body;

    if (
        !Number.isInteger(Number(id)) ||
        Number(id) <= 0
    ) {
        return res.status(400).json({
            message: "Invalid staff ID"
        });
    }

    if (!name) {
        return res.status(400).json({
            message: "Name is required"
        });
    }

    if (
        status &&
        !["ACTIVE", "INACTIVE"].includes(status)
    ) {
        return res.status(400).json({
            message: "Invalid staff status"
        });
    }

    const findQuery = `
        SELECT user_id
        FROM staff
        WHERE id = ?
    `;

    db.execute(
        findQuery,
        [id],
        (err, results) => {
            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Failed to find staff"
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message: "Staff not found"
                });
            }

            const userId = results[0].user_id;

            const userQuery = `
                UPDATE users
                SET
                    name = ?,
                    phone = ?
                WHERE id = ?
            `;

            db.execute(
                userQuery,
                [
                    name,
                    phone || null,
                    userId
                ],
                (userErr) => {
                    if (userErr) {
                        console.error(userErr);

                        return res.status(500).json({
                            message: "Failed to update staff user"
                        });
                    }

                    const staffQuery = `
                        UPDATE staff
                        SET
                            specialization = ?,
                            bio = ?,
                            status = ?
                        WHERE id = ?
                    `;

                    db.execute(
                        staffQuery,
                        [
                            specialization || null,
                            bio || null,
                            status || "ACTIVE",
                            id
                        ],
                        (staffErr) => {
                            if (staffErr) {
                                console.error(staffErr);

                                return res.status(500).json({
                                    message: "Failed to update staff profile"
                                });
                            }

                            return res.status(200).json({
                                message: "Staff updated successfully"
                            });
                        }
                    );
                }
            );
        }
    );
};


// =========================================
// DELETE / DEACTIVATE STAFF
// Admin only
// =========================================

const deleteStaff = (req, res) => {
    const { id } = req.params;

    if (
        !Number.isInteger(Number(id)) ||
        Number(id) <= 0
    ) {
        return res.status(400).json({
            message: "Invalid staff ID"
        });
    }

    const query = `
        UPDATE staff
        SET status = 'INACTIVE'
        WHERE id = ?
    `;

    db.execute(
        query,
        [id],
        (err, result) => {
            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Failed to delete staff"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Staff not found"
                });
            }

            return res.status(200).json({
                message: "Staff deleted successfully"
            });
        }
    );
};


// =========================================
// ASSIGN SERVICE TO STAFF
// Admin only
// =========================================

const assignServiceToStaff = (req, res) => {
    const { staffId } = req.params;
    const { serviceId } = req.body;

    if (
        !Number.isInteger(Number(staffId)) ||
        Number(staffId) <= 0
    ) {
        return res.status(400).json({
            message: "Invalid staff ID"
        });
    }

    if (
        !Number.isInteger(Number(serviceId)) ||
        Number(serviceId) <= 0
    ) {
        return res.status(400).json({
            message: "Invalid service ID"
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

            const serviceQuery = `
                SELECT id
                FROM services
                WHERE id = ?
                  AND status = 'ACTIVE'
            `;

            db.execute(
                serviceQuery,
                [serviceId],
                (serviceErr, serviceResults) => {
                    if (serviceErr) {
                        console.error(serviceErr);

                        return res.status(500).json({
                            message: "Failed to check service"
                        });
                    }

                    if (serviceResults.length === 0) {
                        return res.status(404).json({
                            message: "Service not found"
                        });
                    }

                    const insertQuery = `
                        INSERT INTO staff_services
                        (staff_id, service_id)
                        VALUES (?, ?)
                    `;

                    db.execute(
                        insertQuery,
                        [staffId, serviceId],
                        (insertErr) => {
                            if (insertErr) {

                                if (
                                    insertErr.code ===
                                    "ER_DUP_ENTRY"
                                ) {
                                    return res.status(409).json({
                                        message: "Service already assigned to this staff member"
                                    });
                                }

                                console.error(insertErr);

                                return res.status(500).json({
                                    message: "Failed to assign service"
                                });
                            }

                            return res.status(201).json({
                                message: "Service assigned to staff successfully"
                            });
                        }
                    );
                }
            );
        }
    );
};


// =========================================
// GET SERVICES ASSIGNED TO STAFF
// Public
// =========================================

const getStaffServices = (req, res) => {
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
            s.id,
            s.name,
            s.description,
            s.duration,
            s.price,
            s.status
        FROM services s
        INNER JOIN staff_services ss
            ON s.id = ss.service_id
        WHERE ss.staff_id = ?
          AND s.status = 'ACTIVE'
        ORDER BY s.id DESC
    `;

    db.execute(
        query,
        [staffId],
        (err, results) => {
            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Failed to fetch staff services"
                });
            }

            return res.status(200).json({
                services: results
            });
        }
    );
};


// =========================================
// REMOVE SERVICE FROM STAFF
// Admin only
// =========================================

const removeServiceFromStaff = (req, res) => {
    const {
        staffId,
        serviceId
    } = req.params;

    if (
        !Number.isInteger(Number(staffId)) ||
        Number(staffId) <= 0
    ) {
        return res.status(400).json({
            message: "Invalid staff ID"
        });
    }

    if (
        !Number.isInteger(Number(serviceId)) ||
        Number(serviceId) <= 0
    ) {
        return res.status(400).json({
            message: "Invalid service ID"
        });
    }

    const query = `
        DELETE FROM staff_services
        WHERE staff_id = ?
          AND service_id = ?
    `;

    db.execute(
        query,
        [staffId, serviceId],
        (err, result) => {
            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Failed to remove service from staff"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Service assignment not found"
                });
            }

            return res.status(200).json({
                message: "Service removed from staff successfully"
            });
        }
    );
};

// GET STAFF BY SERVICE
const getStaffByService = (req, res) => {
    const serviceId = req.params.serviceId;

    if (!serviceId) {
        return res.status(400).json({
            message: "Service ID is required"
        });
    }

    const sql = `
        SELECT
            st.id,
            st.user_id,
            u.name,
            u.email,
            st.specialization,
            st.bio,
            st.status
        FROM staff st
        JOIN users u
            ON st.user_id = u.id
        JOIN staff_services ss
            ON st.id = ss.staff_id
        WHERE ss.service_id = ?
        AND st.status = 'ACTIVE'
        AND u.role = 'STAFF'
        ORDER BY u.name ASC
    `;

    db.execute(
        sql,
        [serviceId],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    message: "Database error",
                    error: err
                });
            }

            return res.status(200).json(result);
        }
    );
};

// =========================================
// GET MY STAFF PROFILE
// Logged-in staff only
// =========================================

const getMyStaffProfile = (req, res) => {

    const userId = req.user.id;

    const query = `
        SELECT
            s.id AS staff_id,
            s.user_id,
            u.name,
            u.email,
            u.phone,
            s.specialization,
            s.bio,
            s.status
        FROM staff s
        INNER JOIN users u
            ON s.user_id = u.id
        WHERE s.user_id = ?
          AND u.role = 'STAFF'
    `;

    db.execute(
        query,
        [userId],
        (err, results) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Failed to fetch staff profile"
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message: "Staff profile not found"
                });
            }

            return res.status(200).json({
                staff: results[0]
            });
        }
    );
};

// =========================================
// EXPORT CONTROLLERS
// =========================================

module.exports = {
    createStaff,
    getAllStaff,
    getStaffById,
    updateStaff,
    deleteStaff,
    assignServiceToStaff,
    getStaffServices,
    removeServiceFromStaff,
    getStaffByService,
    getMyStaffProfile
};