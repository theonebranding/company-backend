import express from 'express';
import { getAllEmployees, getEmployee, updateEmployee, getMyProfile, addPredefinedCheckInTime } from '../controllers/employeeController.js';
import verifyToken from '../middleware/verifyToken.js';
import checkRole from '../middleware/checkRole.js';

const router = express.Router();

// Admin-only endpoint to fetch all employees with pagination
router.get('/all', verifyToken, checkRole(['admin']), getAllEmployees);

router.get('/find', verifyToken, checkRole(['admin', 'employee']), getEmployee);

router.patch('/update', verifyToken, checkRole(['employee']), updateEmployee);

router.get('/my-profile', verifyToken, checkRole(['employee']),  getMyProfile);

router.patch('/add-checkin-time/:id?', verifyToken, checkRole(['admin']), addPredefinedCheckInTime);

export default router;