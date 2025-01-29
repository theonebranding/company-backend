import LateCheckIn from '../models/lateCheckInSchema.js';
import Salary from '../models/salarySchema.js';


// get lateCheckins
export const getLateCheckIn = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const filter = {};
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        filter.lateCheckIn = true;

        const lateCheckIns = await Attendance.find(filter).populate('employee', 'name email');

        res.status(200).json({ message: 'Late check-ins fetched successfully', lateCheckIns });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching late check-ins', error: err.message });
    }
};

// get late check by employee ID and date
export const getLateCheckInReport = async (req, res) => {
    try {
        const { startDate, endDate, employeeId } = req.query;

        const filter = {};
        if (employeeId) filter.employee = employeeId;
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        const lateCheckIns = await LateCheckIn.find(filter).populate('employee', 'name email').sort({ date: -1 });

        res.status(200).json({
            message: 'Late check-in report fetched successfully',
            lateCheckIns,
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching late check-in report', error: err.message });
    }
};

// late check-in deduction from salary
export const getLateCheckInDeduction = async (req, res) => {
    try {
        const { employeeId, month, year } = req.query;

        if (!employeeId || !month || !year) {
            return res.status(400).json({
                message: 'employeeId, month, and year are required',
            });
        }

        // Calculate the start and end of the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        // Fetch late check-ins for the given employee and month
        const lateCheckIns = await LateCheckIn.find({
            employee: employeeId,
            date: { $gte: startDate, $lte: endDate },
            lateByMinutes: { $gt: 0 },
        }).sort({ date: 1 });

        const totalLateCheckIns = lateCheckIns.length;

        // Fetch employee's salary details
        const salaryData = await Salary.findOne({ employee: employeeId });
        if (!salaryData) {
            return res.status(404).json({
                message: 'Salary details not found for the given employeeId',
            });
        }

        const monthlySalary = salaryData.baseSalary;
        const daysInMonth = new Date(year, month, 0).getDate();
        const dailySalary = monthlySalary / daysInMonth;

        // Calculate deductions: 5 late check-ins = 1 half-day deduction
        const deductionUnits = Math.floor(totalLateCheckIns / 5) * 0.5;
        const totalDeduction = deductionUnits * dailySalary;

        // Calculate final salary
        const finalSalary = monthlySalary - totalDeduction;

        // Response
        res.status(200).json({
            message: 'Late check-in deduction calculated successfully',
            lateCheckInDetails: lateCheckIns,
            totalLateCheckIns,
            monthlySalary,
            dailySalary,
            deductionUnits,
            totalDeduction,
            finalSalary,
        });
    } catch (err) {
        res.status(500).json({
            message: 'Error calculating late check-in deduction',
            error: err.message,
        });
    }
};

