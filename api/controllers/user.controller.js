const User = require('../models/user.model');
const bcryptjs = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Test endpoint
exports.test = (req, res) => {
    res.status(200).json({ message: "Test endpoint successful" });
};

exports.verifyToken = (req, res, next) => {
    const sessionToken = req.cookies.session_token;

    // Check if session token is present
    if (!sessionToken) {
        return next(errorHandler(401, 'Unauthorized: Missing session token'));
    }

    // Verify the session token (example implementation)
    // Here, you would validate the token against your authentication mechanism (e.g., JWT)
    // For demonstration purposes, we'll assume the token is valid
    // Replace this with your actual token validation logic
    const isValidToken = true;

    if (!isValidToken) {
        return next(errorHandler(401, 'Unauthorized: Invalid session token'));
    }

    // Token is valid, proceed to the next middleware or route handler
    next();
};

// Middleware to verify user authorization
exports.verifyAuthorization = (req, res, next) => {
    const { userId } = req.params;
    const currentUser = req.user; // Assuming authenticated user data is attached to the request object

    // Check if the authenticated user is authorized to perform the action
    // For example, you may check if the user has the necessary role or permissions
    if (currentUser && (currentUser.isAdmin || currentUser._id === userId)) {
        // User is authorized, proceed to the next middleware or route handler
        next();
    } else {
        return next(errorHandler(403, 'Forbidden: User is not authorized to perform this action'));
    }
};

// Update user by ID
exports.updateUser = async (req, res, next) => {
    const userId = req.params.userId;
    const updatedUserData = req.body; // Assuming updated user data is sent in the request body

    // Validate input
    if (!userId || !updatedUserData) {
        return res.status(400).json({ success: false, message: "Please provide user ID and updated data" });
    }

    try {
        // If image file is uploaded, save it to a directory and update user profile picture URL
        if (req.file) {
            const imagePath = req.file.path;
            const profilePictureUrl = `/uploads/${req.file.filename}`;
            updatedUserData.user_profileUrl = profilePictureUrl;
        }

        // Update user in the database
        await User.findByIdAndUpdate(userId, updatedUserData);

        res.status(200).json({ success: true, message: "User updated successfully" });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: "Error updating user" });
    }
};

// Delete user by ID
exports.deleteUser = async (req, res, next) => {
    const userId = req.params.userId;

    // Validate input
    if (!userId) {
        return res.status(400).json({ success: false, message: "Please provide user ID" });
    }

    try {
        // Find user by ID and delete
        await User.findByIdAndDelete(userId);

        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: "Error deleting user" });
    }
};


// Signout endpoint
exports.signout = (req, res) => {
    // Clear the access token cookie
    res.clearCookie('access_token');

    // Optionally, perform any additional signout logic here, such as invalidating tokens or session data

    // Send response indicating successful signout
    res.status(200).json({ success: true, message: "Signout successful" });
};

// Get all users endpoint
exports.getUsers = (req, res, next) => {
    // Get all users from the database
    req.app.locals.db.query('SELECT * FROM Kme_Blog', (err, results) => {
        if (err) {
            return next(err);
        }
        res.status(200).json({ success: true, message: "Users retrieved successfully", users: results });
    });
};

// Get user by ID
exports.getUser = (req, res, next) => {
    const userId = req.params.userId;

    // Find user by ID in the database
    req.app.locals.db.query('SELECT * FROM Kme_Blog WHERE ID = ?', userId, (err, result) => {
        if (err) {
            return next(err);
        }
        if (result.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, message: "User retrieved successfully", user: result[0] });
    });
};

exports.signup = async (req, res, next) => {
    const { displayname, user_email, user_pass } = req.body;

    // Check if any of the required fields are missing or empty
    if (!displayname || !user_email || !user_pass || displayname === '' || user_email === '' || user_pass === '') {
        return next(errorHandler(400, 'All fields are required'));
    }

    // Hash the password
    const hashedPassword = bcryptjs.hashSync(user_pass, 10);

    try {
        // Create a new user object
        const newUser = new User({
            displayname,
            user_email,
            user_pass: hashedPassword,
            user_activation_key: '', // Activation key for account activation
            user_nicename: displayname.replace(/\s+/g, '-').toLowerCase(), // A URL friendly version of the display name
            user_profileUrl: '',    // URL to the user's profile picture
            user_isAdmin: false,    // Flag indicating whether the user is an admin
            user_status: 1,         // Status of the user account (e.g., active, suspended, banned)
            user_createdAt: new Date() // Date and time when the user account was created
        });

        // Save the new user to the database
        await User.create({
            displayname: newUser.displayname,
            user_email: newUser.user_email,
            user_pass: newUser.user_pass,
            user_activation_key: newUser.user_activation_key,
            user_nicename: newUser.user_nicename,
            user_profileUrl: newUser.user_profileUrl,
            user_isAdmin: newUser.user_isAdmin,
            user_status: newUser.user_status,
            user_createdAt: newUser.user_createdAt
        });

        res.json('Signup successful');
    } catch (error) {
        next(error);
    }
};


exports.signin = async (req, res, next) => {
    const { user_email, user_pass } = req.body;

    if (!user_email || !user_pass || user_email === '' || user_pass === '') {
        next(errorHandler(400, 'All fields are required'));
        return; // Make sure to return after calling next() to prevent further execution
    }

    try {
        // Find the user by email in the database
        const user = await User.findByEmail(user_email);
        if (!user) {
            next(errorHandler(404, 'User not found'));
            return; // Make sure to return after calling next() to prevent further execution
        }

        // Compare the password hashes
        const validPassword = bcryptjs.compareSync(user_pass, user.user_pass);
        if (!validPassword) {
            next(errorHandler(400, 'Invalid password'));
            return; // Make sure to return after calling next() to prevent further execution
        }

        // If password is valid, generate session token
        const sessionToken = generateSessionToken();

        // Set session token in cookie
        res.cookie('session_token', sessionToken, {
            httpOnly: true,
            // Set other cookie options if needed
        });

        // Send success response with authenticated user data or session token
        res.status(200).json({ user, sessionToken });
    } catch (error) {
        next(error);
    }
};




function generateSessionToken() {
    // Generate a random buffer
    const buffer = crypto.randomBytes(64);
    // Convert buffer to hexadecimal string
    const token = buffer.toString('hex');
    return token;
}

// Example usage
const sessionToken = generateSessionToken();
console.log(sessionToken);


module.exports = exports;
