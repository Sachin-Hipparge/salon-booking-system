const db = require("../config/db");

// =========================================
// CREATE SERVICE
// Admin only
// =========================================

const createService = (req, res) => {
    const { name, description, duration, price } = req.body;

    if (!name || duration === undefined || price === undefined) {
        return res.status(400).json({
            message: "Name, duration and price are required"
        });
    }

    if (Number(duration) <= 0) {
        return res.status(400).json({
            message: "Duration must be greater than 0"
        });
    }

    if (Number(price) < 0) {
        return res.status(400).json({
            message: "Price cannot be negative"
        });
    }

    const query = `
        INSERT INTO services
        (name, description, duration, price)
        VALUES (?, ?, ?, ?)
    `;

    db.execute(
        query,
        [
            name,
            description || null,
            duration,
            price
        ],
        (err, result) => {
            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Failed to create service"
                });
            }

            return res.status(201).json({
                message: "Service created successfully",
                serviceId: result.insertId
            });
        }
    );
};


// =========================================
// GET ALL ACTIVE SERVICES
// Public
// =========================================

const getAllServices = (req, res) => {
    const query = `
        SELECT
            id,
            name,
            description,
            duration,
            price,
            status
        FROM services
        WHERE status = 'ACTIVE'
        ORDER BY id DESC
    `;

    db.execute(query, (err, results) => {
        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Failed to fetch services"
            });
        }

        return res.status(200).json({
            services: results
        });
    });
};


// =========================================
// GET SERVICE BY ID
// Public
// =========================================

const getServiceById = (req, res) => {
    const { id } = req.params;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({
            message: "Invalid service ID"
        });
    }

    const query = `
        SELECT
            id,
            name,
            description,
            duration,
            price,
            status
        FROM services
        WHERE id = ? AND status = 'ACTIVE'
    `;

    db.execute(query, [id], (err, results) => {
        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Failed to fetch service"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Service not found"
            });
        }

        return res.status(200).json({
            service: results[0]
        });
    });
};


// =========================================
// UPDATE SERVICE
// Admin only
// =========================================

const updateService = (req, res) => {
    const { id } = req.params;
    const {
        name,
        description,
        duration,
        price,
        status
    } = req.body;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({
            message: "Invalid service ID"
        });
    }

    if (!name || duration === undefined || price === undefined) {
        return res.status(400).json({
            message: "Name, duration and price are required"
        });
    }

    if (Number(duration) <= 0) {
        return res.status(400).json({
            message: "Duration must be greater than 0"
        });
    }

    if (Number(price) < 0) {
        return res.status(400).json({
            message: "Price cannot be negative"
        });
    }

    if (status && !["ACTIVE", "INACTIVE"].includes(status)) {
        return res.status(400).json({
            message: "Invalid service status"
        });
    }

    const query = `
        UPDATE services
        SET
            name = ?,
            description = ?,
            duration = ?,
            price = ?,
            status = ?
        WHERE id = ?
    `;

    db.execute(
        query,
        [
            name,
            description || null,
            duration,
            price,
            status || "ACTIVE",
            id
        ],
        (err, result) => {
            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Failed to update service"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Service not found"
                });
            }

            return res.status(200).json({
                message: "Service updated successfully"
            });
        }
    );
};


// =========================================
// DELETE SERVICE
// Admin only
//
// We do NOT physically delete the service.
// We mark it INACTIVE instead.
// =========================================

const deleteService = (req, res) => {
    const { id } = req.params;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({
            message: "Invalid service ID"
        });
    }

    const query = `
        UPDATE services
        SET status = 'INACTIVE'
        WHERE id = ?
    `;

    db.execute(query, [id], (err, result) => {
        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Failed to delete service"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Service not found"
            });
        }

        return res.status(200).json({
            message: "Service deleted successfully"
        });
    });
};


module.exports = {
    createService,
    getAllServices,
    getServiceById,
    updateService,
    deleteService
};