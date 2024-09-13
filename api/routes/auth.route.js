const express = require('express');
const { google } = require('../controllers/auth.controller.js');


const router = express.Router();

router.post('/google', google)

module.exports = router;