const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

// Public routes
router.get('/test', authController.test); // Test endpoint
router.post('/login', authController.login);
router.post('/register', authController.createAdmin); // İlk kullanıcı için açık

// Protected routes (authentication gerekli)
router.get('/profile', authenticateToken, authController.getProfile);
router.post('/change-password', authenticateToken, authController.changePassword);
router.get('/verify', authenticateToken, authController.verifyToken);

// Super admin only routes
router.get('/users', authenticateToken, requireSuperAdmin, authController.listAdmins);
router.post('/create-user', authenticateToken, requireSuperAdmin, authController.createAdmin);

module.exports = router;