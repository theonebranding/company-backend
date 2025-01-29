import mongoose from 'mongoose';

const lateCheckInSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    employeeEmail: { type: String, required: true },
    date: { type: Date, required: true },
    lateByMinutes: { type: Number, required: true }, // Minutes late
    predefinedCheckInTime: { type: String, required: true }, // Predefined time
    actualCheckInTime: { type: Date, required: true }, // Actual time of check-in
}, { timestamps: true });

const LateCheckIn = mongoose.model('LateCheckIn', lateCheckInSchema);
export default LateCheckIn;