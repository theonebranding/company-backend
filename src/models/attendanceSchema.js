import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    employeeEmail: { type: String, required: true },
    date: { type: Date, required: true },
    checkInTime: { type: Date, required: true },
    checkOutTime: { type: Date },
    currentStatus: { type: String, default: 'Checked In' },
    recessStartTime: { type: Date },
    recessEndTime: { type: Date },
    lateCheckIn: { type: Boolean, default: false },
    totalRecessDuration: { type: Number, default: 0 }, // Total recess time in milliseconds
    isRecess: { type: Boolean, default: false },
    totalWorkingTime: { type: Number, default: 0 }, // Total working time in milliseconds
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;