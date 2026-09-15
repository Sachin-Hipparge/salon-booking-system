const db = require("../config/db");

const getProfile = (req, res) => {
    const userId = req.user.id;

    const query = `
        SELECT id, name, email, phone, role, preferences
        FROM users
        WHERE id = ?
    `;

    db.execute(query, [userId], (err, results) => {
        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Database error"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            user: results[0]
        });
    });
};

const updateProfile = (req, res) => {
    const userId = req.user.id;

    const { name, phone, preferences } = req.body;

    if (!name) {
        return res.status(400).json({
            message: "Name is required"
        });
    }

    const query = `
        UPDATE users
        SET name = ?, phone = ?, preferences = ?
        WHERE id = ?
    `;

    db.execute(
        query,
        [name, phone || null, preferences || null, userId],
        (err, result) => {
            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Failed to update profile"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "User not found"
                });
            }

            return res.status(200).json({
                message: "Profile updated successfully"
            });
        }
    );
};

module.exports = {
    getProfile,
    updateProfile
};