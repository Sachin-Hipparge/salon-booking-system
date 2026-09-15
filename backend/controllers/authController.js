const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");


const register = (req, res) => {
    const { name, email, password, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
        return res.status(400).json({
            message: "Name, email and password are required"
        });
    }

    // Check whether email already exists
    const checkUserQuery = "SELECT id FROM users WHERE email = ?";

    db.execute(checkUserQuery, [email], (err, results) => {
        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Database error"
            });
        }

        if (results.length > 0) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        // Hash password
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Insert new user
        const insertUserQuery = `
            INSERT INTO users (name, email, password, phone)
            VALUES (?, ?, ?, ?)
        `;

        db.execute(
            insertUserQuery,
            [name, email, hashedPassword, phone || null],
            (err, result) => {
                if (err) {
                    console.error(err);

                    return res.status(500).json({
                        message: "Failed to register user"
                    });
                }

                return res.status(201).json({
                    message: "User registered successfully",
                    userId: result.insertId
                });
            }
        );
    });
};

const login = (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    // Find user by email
    const query = "SELECT * FROM users WHERE email = ?";

    db.execute(query, [email], (err, results) => {
        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Database error"
            });
        }

        // User not found
        if (results.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = results[0];

        // Compare entered password with hashed password
        const passwordMatch = bcrypt.compareSync(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Password is correct
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        return res.status(200).json({
            message: "Login successful",
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    });
};

module.exports = {
    register,
    login
};