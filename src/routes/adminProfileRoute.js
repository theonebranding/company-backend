import express from 'express';
import {updateAdminProfile, getAdminProfile } from "../controllers/adminController.js";
import verifyToken from "../middleware/verifyToken.js";
import checkRole from "../middleware/checkRole.js";

const router = express.Router();

router.get('/get-profile', verifyToken, checkRole(['admin']), getAdminProfile); // Fetch admin profile
router.patch('/update-profile', verifyToken, checkRole(['admin']), updateAdminProfile); // Update admin profile

export default router;