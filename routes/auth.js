const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/auth.js');
const { guestMiddleware } = require('../middleware/middlware.js');

router.post('/register', guestMiddleware, register);
router.post('/login', guestMiddleware, login);

module.exports = router;
