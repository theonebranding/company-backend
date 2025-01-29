import mongoose from 'mongoose';
import SelectedHoliday from '../models/selectedHolidaySchema.js';
import PredefinedHoliday from '../models/predefinedHolidaySchema.js';

// Add Predefined Holidays
export const addPredefinedHoliday = async (req, res) => {
    try {
        const { holidays } = req.body;

        if (!holidays || !Array.isArray(holidays)) {
            return res.status(400).json({ message: 'Invalid input. Expected an array of holidays.' });
        }

        const addedHolidays = [];

        for (const holiday of holidays) {
            const { name, date } = holiday;

            if (!name || !date) {
                return res.status(400).json({ message: 'Holiday name and date are required.' });
            }

            // Check if the holiday already exists
            const existingHoliday = await PredefinedHoliday.findOne({ name, date });

            if (existingHoliday) {
                continue; // Skip adding duplicate holidays
            }

            // Save the new holiday
            const newHoliday = new PredefinedHoliday({ name, date });
            await newHoliday.save();
            addedHolidays.push(newHoliday);
        }

        res.status(201).json({
            message: 'Predefined holidays added successfully',
            holidays: addedHolidays,
        });
    } catch (err) {
        res.status(500).json({ message: 'Error adding predefined holidays', error: err.message });
    }
};

// Fetch Predefined Holidays
export const getPredefinedHolidays = async (req, res) => {
    try {
        const holidays = await PredefinedHoliday.find().sort({ date: 1 });
        res.status(200).json({ message: 'Predefined holidays fetched successfully', holidays });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching predefined holidays', error: err.message });
    }
};


// delete predefined holiday
export const deletePredefinedHoliday = async (req, res) => {
    try {
        const { holidayId } = req.params;

        if (!holidayId) {
            return res.status(400).json({ message: 'Holiday ID is required' });
        }

        const deletedHoliday = await PredefinedHoliday.findByIdAndDelete(holidayId);

        if (!deletedHoliday) {
            return res.status(404).json({ message: 'Predefined holiday not found' });
        }

        res.status(200).json({
            message: 'Predefined holiday deleted successfully',
            holiday: deletedHoliday,
        });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting predefined holiday', error: err.message });
    }
};


// select employee holidays
export const selectHolidays = async (req, res) => {
    try {
        const { selectedHolidays } = req.body;
        const { _id: employeeId } = req.user; // Employee ID from token

        if (!selectedHolidays || !Array.isArray(selectedHolidays)) {
            return res.status(400).json({ message: 'Invalid data. Expected an array of holidays.' });
        }

        if (selectedHolidays.length > 10) {
            return res.status(400).json({ message: 'You can select a maximum of 10 holidays.' });
        }

        // Save selected holidays
        const updatedHolidays = await SelectedHoliday.findOneAndUpdate(
            { employee: employeeId },
            { selectedHolidays },
            { new: true, upsert: true } // Create new record if not existing
        );

        res.status(201).json({
            message: 'Holidays selected successfully',
            selectedHolidays: updatedHolidays.selectedHolidays,
        });
    } catch (err) {
        res.status(500).json({ message: 'Error selecting holidays', error: err.message });
    }
};

// fetch employee selected holidays
export const getSelectedHolidays = async (req, res) => {
    try {
        const employeeId = req.params.id || req.user._id; // Use param 'id' or fallback to authenticated user's ID

        // Validate if employeeId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({ message: 'Invalid employee ID format' });
        }

        const holidays = await SelectedHoliday.findOne({ employee: employeeId });

        if (!holidays) {
            return res.status(404).json({ message: 'No selected holidays found for this employee' });
        }

        res.status(200).json({
            message: 'Selected holidays fetched successfully',
            holidays: holidays.selectedHolidays,
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching selected holidays', error: err.message });
    }
};



// delete custom holiday
export const deleteCustomHoliday = async (req, res) => {
    try {
        const { holidayId } = req.params;
        const { _id: employeeId } = req.user; // Employee ID from token

        if (!holidayId) {
            return res.status(400).json({ message: 'Holiday ID is required' });
        }

        const employeeHolidays = await SelectedHoliday.findOne({ employee: employeeId });

        if (!employeeHolidays) {
            return res.status(404).json({ message: 'No selected holidays found for this employee' });
        }

        // Filter out the holiday to delete
        const updatedHolidays = employeeHolidays.selectedHolidays.filter(
            holiday => holiday._id.toString() !== holidayId
        );

        // Save the updated holidays
        employeeHolidays.selectedHolidays = updatedHolidays;
        await employeeHolidays.save();

        res.status(200).json({
            message: 'Custom holiday deleted successfully',
            holidays: employeeHolidays.selectedHolidays,
        });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting custom holiday', error: err.message });
    }
};
