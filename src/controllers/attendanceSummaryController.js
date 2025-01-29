import Attendance from '../models/attendanceSchema.js';
import Employee from '../models/employeeSchema.js';
import SelectedHoliday from '../models/selectedHolidaySchema.js';
import Salary from '../models/salarySchema.js';
import mongoose from 'mongoose';

// Get Daily Attendance
export const getDailyAttendance = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'Date is required' });

        const formattedDate = new Date(date).toISOString().split('T')[0];

        const summary = await Attendance.aggregate([
            { $match: { date: new Date(formattedDate) } },
            {
                $lookup: {
                    from: 'employees',
                    localField: 'employee',
                    foreignField: '_id',
                    as: 'employeeDetails',
                },
            },
            { $unwind: '$employeeDetails' },
            {
                $project: {
                    employeeName: '$employeeDetails.name',
                    employeeEmail: '$employeeDetails.email',
                    checkInTime: 1,
                    checkOutTime: 1,
                    totalRecessDuration: 1,
                    currentStatus: 1,
                    lateCheckIn: 1,
                    workHours: {
                        $cond: {
                            if: { $and: ['$checkOutTime', '$checkInTime'] },
                            then: {
                                $subtract: [
                                    { $subtract: ['$checkOutTime', '$checkInTime'] },
                                    '$totalRecessDuration',
                                ],
                            },
                            else: null,
                        },
                    },
                },
            },
        ]);

        res.status(200).json({
            message: 'Daily attendance fetched successfully',
            summary,
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching daily attendance', error: err.message });
    }
};

// Get Monthly Attendance
export const getMonthlyAttendance = async (req, res) => {
    try {
        const { employeeId, month, year } = req.query;

        if (!employeeId || !month || !year) {
            return res.status(400).json({ message: 'Employee ID, month, and year are required' });
        }

        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({ message: 'Invalid Employee ID' });
        }

        const startDate = new Date(`${year}-${month}-01`);
        const endDate = new Date(new Date(startDate).setMonth(startDate.getMonth() + 1));

        // Use new ObjectId creation
        const records = await Attendance.find({
            employee: new mongoose.Types.ObjectId(employeeId),
            date: { $gte: startDate, $lt: endDate },
        }).sort({ date: 1 });

        const totalWorkHours = records.reduce((total, record) => {
            const workHours = record.checkOutTime && record.checkInTime
                ? record.checkOutTime - record.checkInTime - (record.totalRecessDuration || 0)
                : 0;
            return total + workHours;
        }, 0);

        res.status(200).json({
            message: 'Monthly attendance fetched successfully',
            totalWorkHours: `${Math.floor(totalWorkHours / 60000)} minutes`,
            records,
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching monthly attendance', error: err.message });
    }
};

// Get Absentee List
export const getAbsenteeList = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start date and end date are required' });
        }

        // Parse dates in dd-mm-yyyy format
        const parseDate = (dateStr) => {
            const [day, month, year] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day); // Month is zero-indexed in JavaScript
        };

        const start = parseDate(startDate);
        const end = parseDate(endDate);

        // Validate parsed dates
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: 'Invalid date format. Use dd-mm-yyyy.' });
        }

        // Adjust end date to include the entire day
        end.setHours(23, 59, 59, 999);


        const allEmployees = await Employee.find({}, '_id name email');
        const attendanceRecords = await Attendance.find({
            date: { $gte: new Date(start), $lte: new Date(end) },
        });

        const presentEmployeeIds = new Set(attendanceRecords.map(record => record.employee.toString()));
        const absentEmployees = allEmployees.filter(emp => !presentEmployeeIds.has(emp._id.toString()));

        res.status(200).json({
            message: 'Absentee list fetched successfully',
            absentEmployees,
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching absentee list', error: err.message });
    }
};

// absentee list of a specific employee and then deduction
export const getEmployeeAbsenteeList = async (req, res) => {
    try {
        const { startDate, endDate, employeeId } = req.query;
        if (!employeeId) {
            return res.status(400).json({ message: 'Employee ID is required' });
        }
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start date and end date are required' });
        }

        // First fetch the employee details
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Fetch salary information for the employee
        const salary = await Salary.findOne({ employee: employeeId });
        if (!salary) {
            return res.status(404).json({ message: 'Salary information not found for employee' });
        }

        // Parse dates in dd-mm-yyyy format
        const parseDate = (dateStr) => {
            const [day, month, year] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day, 0, 0, 0, 0);
        };

        const start = parseDate(startDate);
        const end = parseDate(endDate);

        // Validate parsed dates
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: 'Invalid date format. Use dd-mm-yyyy.' });
        }

        // Get current date at start of day for consistent comparison
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        // Adjust end date to be either the requested end date or current date, whichever is earlier
        const effectiveEndDate = new Date(Math.min(end.getTime(), currentDate.getTime()));
        effectiveEndDate.setHours(23, 59, 59, 999);

        // Calculate total days in the month
        const totalDaysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();

        // Calculate daily salary using salary from salary schema
        const dailySalary = salary.baseSalary / totalDaysInMonth;

        // Helper function to format date to YYYY-MM-DD for comparison
        const formatDateForComparison = (date) => {
            return date.toISOString().split('T')[0];
        };

        // Generate all valid working dates excluding Sundays
        const getWorkingDates = (start, end) => {
            const dates = [];
            const current = new Date(start);
            while (current <= end) {
                if (current.getDay() !== 0) { // Exclude Sundays
                    dates.push(new Date(current));
                }
                current.setDate(current.getDate() + 1);
            }
            return dates;
        };

        const workingDates = getWorkingDates(start, effectiveEndDate);

        // Fetch employee-specific holidays
        const selectedHolidayData = await SelectedHoliday.findOne({ employee: employeeId });
        
        // Create a Set of holiday dates in YYYY-MM-DD format
        const holidayDatesSet = new Set(
            selectedHolidayData
                ? selectedHolidayData.selectedHolidays.map(holiday => 
                    formatDateForComparison(new Date(holiday.date))
                  )
                : []
        );

        // Fetch attendance records
        const attendanceRecords = await Attendance.find({
            employee: employeeId,
            date: { $gte: start, $lte: effectiveEndDate },
        });

        // Create attendance status map
        const attendanceStatusMap = new Map();
        
        // Process attendance records
        attendanceRecords.forEach(record => {
            const formattedDate = formatDateForComparison(record.date);
            const hasCheckin = record.checkInTime !== undefined && record.checkInTime !== null;            
            
            if (hasCheckin) {
                attendanceStatusMap.set(formattedDate, true);
            }
        });

        // Calculate absent dates
        const absentDates = workingDates.filter(date => {
            const formattedDate = formatDateForComparison(date);
            return !attendanceStatusMap.has(formattedDate) && 
                   !holidayDatesSet.has(formattedDate);
        });

        // Format absent dates
        const formattedAbsentDates = absentDates.map(date => ({
            date: date,
            formattedDate: date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            })
        }));

        // Calculate total deduction
        const totalAbsents = formattedAbsentDates.length;
        const totalDeduction = totalAbsents * dailySalary;

        res.status(200).json({
            message: 'Absentee list and deductions fetched successfully',
            employeeId,
            employeeName: employee.name,
            baseSalary: salary.baseSalary,
            dailySalary: dailySalary.toFixed(2),
            totalDaysInMonth,
            totalAbsents,
            totalDeduction: totalDeduction.toFixed(2),
            absentDates: formattedAbsentDates,
        });

    } catch (err) {
        console.error('Error in getEmployeeAbsenteeList:', err);
        res.status(500).json({ message: 'Error fetching absentee list', error: err.message });
    }
};


// present list of employees
export const getPresentList = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start date and end date are required' });
        }

        // Parse dates in dd-mm-yyyy format
        const parseDate = (dateStr) => {
            const [day, month, year] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day); // Month is zero-indexed in JavaScript
        };

        const start = parseDate(startDate);
        const end = parseDate(endDate);

        // Validate parsed dates
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: 'Invalid date format. Use dd-mm-yyyy.' });
        }

        // Adjust end date to include the entire day
        end.setHours(23, 59, 59, 999);

        const allEmployees = await Employee.find({}, '_id name email');
        const attendanceRecords = await Attendance.find({
            date: { $gte: start, $lte: end },
        });

        const presentEmployeeIds = new Set(attendanceRecords.map(record => record.employee.toString()));
        const presentEmployees = allEmployees.filter(emp => presentEmployeeIds.has(emp._id.toString()));

        res.status(200).json({
            message: 'Present list fetched successfully',
            presentEmployees,
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching present list', error: err.message });
    }
};

export const getEmployeeHalfDays = async (req, res) => {
    try {
        const { startDate, endDate, employeeId } = req.query;
        
        // Input validation
        if (!employeeId) {
            return res.status(400).json({ message: 'Employee ID is required' });
        }
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start date and end date are required' });
        }

        // Parse dates in dd-mm-yyyy format
        const parseDate = (dateStr) => {
            const [day, month, year] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day, 0, 0, 0, 0);
        };

        const start = parseDate(startDate);
        const end = parseDate(endDate);

        // Validate parsed dates
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: 'Invalid date format. Use dd-mm-yyyy.' });
        }

        // Get current date at start of day
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        // Adjust end date to be either the requested end date or current date, whichever is earlier
        const effectiveEndDate = new Date(Math.min(end.getTime(), currentDate.getTime()));
        effectiveEndDate.setHours(23, 59, 59, 999);

        // Fetch employee details
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Fetch attendance records
        const attendanceRecords = await Attendance.find({
            employee: employeeId,
            date: { $gte: start, $lte: effectiveEndDate },
            checkInTime: { $exists: true, $ne: null } // Only get records where check-in exists
        });

        // Process each attendance record to calculate working hours
        const halfDayDetails = attendanceRecords.map(record => {
            const totalMinutes = record.totalWorkingTime || 0;
            const hoursWorked = totalMinutes / 60; // Convert minutes to hours

            // Consider it a half day if worked less than 6 hours
            const isHalfDay = hoursWorked < 6;

            return {
                date: record.date,
                formattedDate: record.date.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }),
                hoursWorked: hoursWorked.toFixed(2),
                isHalfDay: isHalfDay
            };
        });

        // Filter to get only half days
        const halfDays = halfDayDetails.filter(day => day.isHalfDay);

        // Calculate monthly salary for deduction calculation
        const salary = await Salary.findOne({ employee: employeeId });
        if (!salary) {
            return res.status(404).json({ message: 'Salary information not found for employee' });
        }

        // Calculate total days in the month
        const totalDaysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
        const dailySalary = salary.baseSalary / totalDaysInMonth;

        // Calculate deductions
        const totalHalfDays = halfDays.length;
        const totalDeduction = (totalHalfDays * dailySalary) / 2; // Half day = half daily salary

        res.status(200).json({
            message: 'Half days data fetched successfully',
            employeeId,
            employeeName: employee.name,
            baseSalary: salary.baseSalary,
            dailySalary: dailySalary.toFixed(2),
            totalDaysInMonth,
            totalHalfDays,
            totalDeduction: totalDeduction.toFixed(2),
            halfDayDetails: halfDays,
            // Include all attendance records with hours worked for reference
            allAttendanceDetails: halfDayDetails
        });

    } catch (err) {
        console.error('Error in getEmployeeHalfDays:', err);
        res.status(500).json({ message: 'Error fetching half days data', error: err.message });
    }
};
