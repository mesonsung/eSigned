const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/activate', authController.activateAccount);
router.post('/resend-activation', authController.resendActivationCode);
router.post('/update-admin-password', authController.updateAdminPassword);

module.exports = router;
