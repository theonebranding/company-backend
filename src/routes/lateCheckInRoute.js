import express from 'express';
import {    
    getLateCheckInReport,
    getLateCheckIn,
    getLateCheckInDeduction
} from '../controllers/lateCheckInController.js';
import verifyToken from '../middleware/verifyToken.js';
import checkRole from '../middleware/checkRole.js';

const router = express.Router();

// Employee Check-In

// Admin: Late Check-In Report
router.get('/find', verifyToken, checkRole(['admin', 'employee']), getLateCheckInReport);
router.get('/late-check-in', verifyToken, checkRole(['admin']), getLateCheckIn);
router.get('/deduction', verifyToken, checkRole(['admin']), getLateCheckInDeduction);

export default router;