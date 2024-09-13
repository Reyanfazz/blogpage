const User = require('../models/user.model');
const bcryptjs = require('bcryptjs');
const { errorHandler } = require('../utils/error.js');
const jwt = require('jsonwebtoken');


exports.google = async (req, res, next) => {
    const { user_email, displayname, profilePicture } = req.body;
    try {
        // Check if the user exists in the database
        const user = await User.findByEmail(user_email);
        if (user) {
            // If user exists, generate JWT token and send response
            const token = jwt.sign(
                { id: user.ID, isAdmin: user.user_isAdmin }, // Modify ID and isAdmin based on your database structure
                process.env.JWT_SECRET
            );
            const { user_pass, ...rest } = user;
            res
                .status(200)
                .cookie('access_token', token, {
                    httpOnly: true,
                })
                .json(rest);
        } else {
            // If user doesn't exist, generate a random password, hash it, and create a new user
            const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);
            const newUser = {
                displayname,
                user_email,
                user_pass: hashedPassword,
                profilePicture,
                // Add other properties if needed
            };

            // Insert the new user into the database
            await User.create(newUser);

            // Generate JWT token for the new user
            const token = jwt.sign(
                { id: newUser.ID, isAdmin: newUser.user_isAdmin }, // Modify ID and isAdmin based on your database structure
                process.env.JWT_SECRET
            );

            const { user_pass, ...rest } = newUser;
            res
                .status(200)
                .cookie('access_token', token, {
                    httpOnly: true,
                })
                .json(rest);
        }
    } catch (error) {
        next(error);
    }
};
module.exports = exports;
