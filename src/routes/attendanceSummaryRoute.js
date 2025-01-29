import express from 'express';
import {    
    getDailyAttendance,
    getMonthlyAttendance,
    getAbsenteeList,
    getPresentList,
    getEmployeeAbsenteeList,
    getEmployeeHalfDays
} from '../controllers/attendanceSummaryController.js';
import verifyToken from '../middleware/verifyToken.js';
import checkRole from '../middleware/checkRole.js';

const router = express.Router();

router.get('/date', verifyToken, checkRole(['admin']),  getDailyAttendance);
router.get('/monthly', verifyToken, checkRole(['admin', 'employee']), getMonthlyAttendance);
router.get('/absentee-list', verifyToken, checkRole(['admin']),   getAbsenteeList);
router.get('/present-list', verifyToken, checkRole(['admin']), getPresentList);
router.get('/employee-absentee-list', verifyToken, checkRole(['admin']), getEmployeeAbsenteeList);
router.get('/employee-halfdays-list', verifyToken, checkRole(['admin']), getEmployeeHalfDays);


export default router;