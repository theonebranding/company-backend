import mongoose from 'mongoose';
import Salary from '../models/salarySchema.js';
import Employee from '../models/employeeSchema.js';
import Attendance from '../models/attendanceSchema.js';

export const addSalary = async (req, res) => {
    try {        

        const { employeeId, baseSalary=0, bonuses = 0, deductions = 0 } = req.body;

        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({ message: 'Invalid employee ID format' });
        }

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // const totalSalary = baseSalary + bonuses - deductions;

        const salary = new Salary({
            employee: employeeId,
            employeeName: employee.name,
            employeeEmail: employee.email,
            baseSalary,
            bonuses,
            deductions,
            totalSalary,
        });

        await salary.save();

        res.status(201).json({ message: 'Salary added successfully', salary });
    } catch (err) {
        res.status(500).json({ message: 'Error adding salary', error: err.message });
    }
};

// Get all salaries
export const getAllSalaries = async (req, res) => {
    try {
        const salaries = await Salary.find().populate('employee', 'name email').sort({ paymentDate: -1 });
        res.status(200).json({ message: 'Salaries fetched successfully', salaries });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching salaries', error: err.message });
    }
};

// Get salary by ID
export const getSalaryByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;

        const salaries = await Salary.find({ employee: employeeId }).sort({ paymentDate: -1 });
        if (!salaries || salaries.length === 0) {
            return res.status(404).json({ message: 'No salary records found for this employee' });
        }

        res.status(200).json({ message: 'Salaries fetched successfully', salaries });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching salaries', error: err.message });
    }
};

// Update salary by ID
export const updateSalary = async (req, res) => {
    try {
        const { salaryId } = req.params;
        const { baseSalary, bonuses, deductions } = req.body;

        const salary = await Salary.findById(salaryId);
        if (!salary) {
            return res.status(404).json({ message: 'Salary record not found' });
        }

        salary.baseSalary = baseSalary || salary.baseSalary;
        salary.bonuses = bonuses || salary.bonuses;
        salary.deductions = deductions || salary.deductions;
        salary.totalSalary = salary.baseSalary + salary.bonuses - salary.deductions;

        await salary.save();

        res.status(200).json({ message: 'Salary updated successfully', salary });
    } catch (err) {
        res.status(500).json({ message: 'Error updating salary', error: err.message });
    }
};

// Delete salary by ID
export const deleteSalary = async (req, res) => {
    try {
        const { salaryId } = req.params;

        const salary = await Salary.findByIdAndDelete(salaryId);
        if (!salary) {
            return res.status(404).json({ message: 'Salary record not found' });
        }

        res.status(200).json({ message: 'Salary record deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting salary', error: err.message });
    }
};

// Get salary deductions
export const getSalaryDeductions = async (req, res) => {
    try {
        const { salaryId } = req.params;

        const salary = await Salary.findById(salaryId);
        if (!salary) {
            return res.status(404).json({ message: 'Salary record not found' });
        }

        res.status(200).json({
            message: 'Salary deductions fetched successfully',
            deductions: {
                lateComingDeductions: salary.lateComingDeductions,
                absenceDeductions: salary.absenceDeductions,
                totalDeductions: salary.deductions,
            },
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching salary deductions', error: err.message });
    }
};


// Add salary with deductions
export const addSalaryWithDeductions = async (req, res) => {
    try {
        const { employeeId, baseSalary, bonuses = 0, workingDaysInMonth } = req.body;

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Fetch attendance for the current month
        const startDate = new Date(new Date().setDate(1));
        const endDate = new Date(new Date().setMonth(new Date().getMonth() + 1, 0));

        const attendances = await Attendance.find({
            employee: employeeId,
            date: { $gte: startDate, $lte: endDate },
        });

        // Calculate late-coming and absence deductions
        let lateComingDeductions = 0;
        let absences = workingDaysInMonth - attendances.length;

        attendances.forEach((record) => {
            if (record.checkInTime) {
                const checkInHour = new Date(record.checkInTime).getHours();
                const lateBy = Math.max(0, checkInHour - 9); // Assuming 9 AM is the start time
                lateComingDeductions += lateBy * 10; // Deduct $10 per hour late
            }
        });

        const absenceDeductions = (baseSalary / workingDaysInMonth) * absences;
        const totalDeductions = lateComingDeductions + absenceDeductions;

        const totalSalary = baseSalary + bonuses - totalDeductions;

        const salary = new Salary({
            employee: employeeId,
            employeeName: employee.name,
            employeeEmail: employee.email,
            baseSalary,
            bonuses,
            deductions: totalDeductions,
            lateComingDeductions,
            absenceDeductions,
            totalSalary,
        });

        await salary.save();

        res.status(201).json({ message: 'Salary with deductions added successfully', salary });
    } catch (err) {
        res.status(500).json({ message: 'Error adding salary with deductions', error: err.message });
    }
};

