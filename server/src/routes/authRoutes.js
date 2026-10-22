const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

// Public routes with rate limiting
router.post('/register', authLimiter, authController.register);
router.post('/register-send-code', authLimiter, authController.sendRegistrationCode);
router.post('/register-verify-code', authLimiter, authController.verifyRegistrationCode);
router.post('/register-resend-code', authLimiter, authController.resendRegistrationCode);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);

// Protected routes
router.get('/me', auth, authController.getMe);
router.patch('/me', auth, authController.updateProfile);
router.patch('/password', auth, authController.changePassword);

module.exports = router;
