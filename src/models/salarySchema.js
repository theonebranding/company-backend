import mongoose from 'mongoose';

const salarySchema = new mongoose.Schema(
    {
        employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
        employeeName: { type: String, required: true },
        employeeEmail: { type: String, required: true },
        baseSalary: { type: Number, required: true },
        bonuses: { type: Number, default: 0 },
        deductions: { type: Number, default: 0 },
        lateComingDeductions: { type: Number, default: 0 },
        absenceDeductions: { type: Number, default: 0 },
        totalSalary: { type: Number, required: true , default: 0 },
        paymentDate: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

const Salary = mongoose.model('Salary', salarySchema);
export default Salary;
