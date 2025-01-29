import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema(
    {
        employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
        // employeeName: { type: String, required: true },
        employeeEmail: { type: String, required: true },
        reason: { type: String, required: true },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
    },
    { timestamps: true } // Automatically add createdAt and updatedAt fields
);

const Leave = mongoose.model('Leave', leaveSchema);

export default Leave;
