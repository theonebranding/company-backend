import express from 'express';
import { checkIn, checkOut, startRecess, endRecess, updateAttendance, getCurrentStatus } from '../controllers/attendanceController.js'
import verifyToken from '../middleware/verifyToken.js';
import checkRole from '../middleware/checkRole.js';

const router = express.Router();

router.post('/checkin', verifyToken, checkIn); // Check-In Route
router.post('/checkout', verifyToken, checkOut); // Check-Out Route
router.post('/start-recess', verifyToken, startRecess); // Start Recess Route
router.post('/end-recess', verifyToken, endRecess); // End Recess Route
router.put('/update-attendance', verifyToken, checkRole(['admin']), updateAttendance); // Update Attendance Route
router.get('/status', verifyToken, getCurrentStatus); // Get Current Status Route

export default router;