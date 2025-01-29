import express from 'express';
import { register, login, confirmRegistration, refreshAccessToken, logout, forgotPassword, resetPassword, verifyOtp } from '../controllers/authController.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/register',   register);
router.post('/confirm-registration',   confirmRegistration);
router.post('/login',   login);

router.post('/forgot-password',   forgotPassword);
router.post('/verify-otp',   verifyOtp);
router.post('/reset-password',   resetPassword);

router.post('/refresh-token',   refreshAccessToken);
router.post('/logout', verifyToken,  logout);

export default router;
