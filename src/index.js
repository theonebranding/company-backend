import express from 'express';
import dotenv from './config/dotenv.js'
import connectDB from './config/db.js';

import bodyParser from 'body-parser';
import cookieParser from "cookie-parser";
import cors from 'cors';

import authRoute from "./routes/authRoute.js";
import attendanceRoute from "./routes/attendanceRoute.js";
import employeeRoute from "./routes/employeeRoute.js";
import attendanceSummaryRoute from "./routes/attendanceSummaryRoute.js";
import holidayRoute from "./routes/holidayRoute.js";
import adminProfileRoute from "./routes/adminProfileRoute.js";
import leaveRoute from "./routes/leaveRoute.js";
import lateCheckInRoute from "./routes/lateCheckInRoute.js";
import salaryRoute from "./routes/salaryRoute.js";

dotenv();
const app = express();
const PORT = process.env.PORT || 8000;

const corsOptions = {
  origin: "https://company.theonebranding.com",
  // origin: true,
  credentials: true,
};

// Middleware
app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

// Connect to MongoDB
connectDB();

// Home Route
app.get('/', (req, res) => {
    res.send('Welcome to the Home Route, API is working :-)');
});

// Routes
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/attendance', attendanceRoute);
app.use('/api/v1/employee', employeeRoute);
app.use('/api/v1/attendance-summary', attendanceSummaryRoute);
app.use('/api/v1/holidays', holidayRoute);
app.use('/api/v1/adminProfile', adminProfileRoute);
app.use('/api/v1/leaves', leaveRoute);
app.use('/api/v1/late-checkins', lateCheckInRoute);
app.use('/api/v1/salary', salaryRoute);

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});
