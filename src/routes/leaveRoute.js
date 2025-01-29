import express from 'express';
import {
    createLeave,
    getAllLeaves,
    updateLeaveStatus,
    getMyLeaves,
    deleteLeave
} from '../controllers/leaveController.js';
import verifyToken from '../middleware/verifyToken.js';
import checkRole from '../middleware/checkRole.js';

const router = express.Router();

// Employee - Create Leave
router.post('/create', verifyToken, checkRole(['employee']), createLeave);

// Employee - Get My Leaves
router.get('/employee-leaves/:id?', verifyToken, checkRole(['employee' , 'admin']), getMyLeaves);

// Admin - View All Leaves
router.get('/get-all', verifyToken, checkRole(['admin']), getAllLeaves);

// Admin - Update Leave Status
router.patch('/update/:leaveId', verifyToken, checkRole(['admin']), updateLeaveStatus);

// Admin - Delete Leave
router.delete('/delete/:leaveId', verifyToken, checkRole(['admin']), deleteLeave);

export default router;
