import mongoose from 'mongoose';

const predefinedHolidaySchema = new mongoose.Schema({
    name: { type: String, required: true },
    date: { type: Date, required: true },
}, { timestamps: true });

const PredefinedHoliday = mongoose.model('PredefinedHoliday', predefinedHolidaySchema);
export default PredefinedHoliday;
