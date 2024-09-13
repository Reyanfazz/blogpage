const express = require('express');
const {
    signup,
    signin,
    deleteUser,
    getUser,
    getUsers,
    signout,
    test,
    updateUser,
} = require('../controllers/user.controller.js');
const { verifyToken } = require('../utils/verifyUser.js');

const router = express.Router();

router.post('/signup', signup);

router.post('/signin', signin);
// Test endpoint
router.get('/test', test);

// Update user by ID
router.put('/update/:userId', verifyToken, updateUser);

// Delete user by ID
router.delete('/delete/:userId', verifyToken, deleteUser);

// Signout endpoint
router.post('/signout', signout);

// Get all users
router.get('/getusers', verifyToken, getUsers);

// Get user by ID
router.get('/:userId', getUser);

module.exports = router;
