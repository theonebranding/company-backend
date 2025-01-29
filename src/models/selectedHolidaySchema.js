import mongoose from 'mongoose';

const selectedHolidaySchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    selectedHolidays: [{
        name: { type: String, required: true },
        date: { type: Date, required: true },
        isCustom: { type: Boolean, default: false }, // Indicates custom holidays
    }],
}, { timestamps: true });

const SelectedHoliday = mongoose.model('SelectedHoliday', selectedHolidaySchema);
export default SelectedHoliday;
