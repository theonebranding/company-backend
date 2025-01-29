import express from 'express';
import { getPredefinedHolidays, selectHolidays, getSelectedHolidays, addPredefinedHoliday, deletePredefinedHoliday, deleteCustomHoliday } from '../controllers/holidayController.js';
import verifyToken from '../middleware/verifyToken.js';
import checkRole from '../middleware/checkRole.js';

const router = express.Router();

router.post('/add-predefined-holidays',  addPredefinedHoliday); // Add predefined holidays
router.get('/predefined',  getPredefinedHolidays); // Fetch predefined holidays
router.delete('/delete-predefined-holidays/:holidayId',  deletePredefinedHoliday); // Delete predefined holiday
router.post('/select', verifyToken,  selectHolidays); // Select holidays (max 10 including custom)
router.get('/selected/:id?', verifyToken, checkRole(['admin', 'employee']), getSelectedHolidays); // Fetch selected holidays
router.delete('/delete-custom-holidays/:holidayId', verifyToken,  deleteCustomHoliday); // Delete custom holiday

export default router;
