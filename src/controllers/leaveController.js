import mongoose from 'mongoose';
import Leave from '../models/leaveSchema.js';
import {sendLeaveRequestEmail, sendLeaveStatusEmail} from '../services/emailService.js';

export const createLeave = async (req, res) => {
    try {
        const { reason, startDate, endDate } = req.body;
        const { _id: employeeId, email: employeeEmail } = req.user;

        if (!reason || !startDate || !endDate) {
            return res.status(400).json({ message: 'Reason, start date, and end date are required' });
        }

        const leave = new Leave({
            employee: employeeId,
            employeeEmail,
            reason,
            startDate,
            endDate,
        });

        await leave.save();

        // Send email to admin for leave request
        await sendLeaveRequestEmail(
            employeeEmail,
            reason,
            startDate,
            endDate,
        )
        console.log("Email sent to admin for leave request");

        res.status(201).json({ message: 'Leave created successfully', leave });
    } catch (err) {
        res.status(500).json({ message: 'Error creating leave', error: err.message });
    }
};

export const getAllLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find().populate('employee', 'email'); // Populate employee details
        res.status(200).json({ message: 'Leaves fetched successfully', leaves });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching leaves', error: err.message });
    }
};

// Employee - Get My Leaves
export const getMyLeaves = async (req, res) => {
    try {
        const employeeId = req.params.id || req.user._id;

        // Validate if employeeId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({ message: 'Invalid employee ID format' });
        }

        const leaves = await Leave.find({ employee: employeeId });
        res.status(200).json({ message: 'Leaves fetched successfully', leaves });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching leaves', error: err.message });
    }
};

// Admin - Update Leave Status
export const updateLeaveStatus = async (req, res) => {
    try {
        const { leaveId } = req.params;
        const { status } = req.body;

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const leave = await Leave.findByIdAndUpdate(
            leaveId,
            { status },
            { new: true, runValidators: true }
        );

        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        }
        
        if(status === 'approved' || status === 'rejected') {
        // Send email to employee for leave approval/rejection
        await sendLeaveStatusEmail(
            leave.employeeEmail,
            leave.reason,
            leave.startDate,
            leave.endDate,
            leave.status
        );
        }        

        res.status(200).json({ message: 'Leave status updated successfully', leave });
    } catch (err) {
        res.status(500).json({ message: 'Error updating leave status', error: err.message });
    }
};

// Admin - Delete Leave
export const deleteLeave = async (req, res) => {
    try{
        const { leaveId } = req.params;

        const leave = await Leave.findByIdAndDelete(leaveId);
        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        } 

        res.status(200).json({ message: 'Leave deleted successfully', leave });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting leave', error: err.message });

    }
}