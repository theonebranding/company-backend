import Employee from '../models/employeeSchema.js';

export const updateEmployee = async (req, res) => {
    try {
        const { _id } = req.user;

        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Unauthorized: Invalid or missing token' });
        }

        const updateFields = req.body;
        if (!updateFields) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        const restrictedFields = ['otp', 'otpExpires', 'role', '_id', 'isVerified', 'createdAt' , 'salary'];
        const updates = Object.keys(updateFields).reduce((acc, field) => {
            if (!restrictedFields.includes(field)) {
                acc[field] = updateFields[field];
            }
            return acc;
        }, {});

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }

        const updatedEmployee = await Employee.findByIdAndUpdate(
            _id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-isVerified -otp -otpExpires -createdAt -updatedAt -role -password');

        if (!updatedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json({
            message: 'Employee data updated successfully',
            employee: updatedEmployee,
        });
    } catch (err) {
        res.status(500).json({ message: 'Error updating employee data', error: err.message });
    }
};


// Get All Employees
export const getAllEmployees = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; 
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Fetch employees with pagination
        const employees = await Employee.find()
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }) 
            .select('-password -role -otp -otpExpires -isVerified -createdAt -updatedAt -__v -salary') 
            .lean();


        // Get total count of employees for pagination meta
        const totalEmployees = await Employee.countDocuments();

        res.status(200).json({
            message: 'Employee list fetched successfully',
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalEmployees / limit),
                totalEmployees,
                limit,
            },
            employees,
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching employee list', error: err.message });
    }
};

// Get my profile employee
export const getMyProfile = async (req, res) => {
    try {
        const { _id } = req.user;

        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Unauthorized: Invalid or missing token' });
        }

        const employee = await Employee.findById(_id).select('-password -isVerified -otp -otpExpires -role -createdAt -updatedAt -__v -salary');

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json({ message: 'Employee profile fetched successfully', employee });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching employee profile', error: err.message });
    }
}


// Find employee by id, phoneNumber, name or email
export const getEmployee = async (req, res) => {
    try {
        const { id, email, phoneNumber, name } = req.query;

        // Validate query parameters
        if (!id && !email && !phoneNumber && !name) {
            return res.status(400).json({
                message: 'Please provide at least one of the following: id, email, phoneNumber, or name',
            });
        }

        // Construct a dynamic query object
        const query = {
            $or: [
                id ? { _id: id } : null,
                email ? { email } : null,
                phoneNumber ? { phoneNumber } : null,
                name ? { name: { $regex: name, $options: 'i' } } : null, // Partial case-insensitive match for name
            ].filter(Boolean), // Remove null values
        };

        // Find employee
        const employee = await Employee.findOne(query).select('-password -role -otp -otpExpires');

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json({ message: 'Employee fetched successfully', employee });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching employee', error: err.message });
    }
};

// api to add predefined checkin time for employee
export const addPredefinedCheckInTime = async(req, res) => {
    try{
        const { id } = req.params; 
        if (!id) {
            return res.status(401).json({ message: 'Unauthorized: INo employee id' });
        }

        const employee = await Employee.findById(id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        employee.predefinedCheckInTime = req.body.predefinedCheckInTime;
        await employee.save();

        res.status(200).json({ message: 'Predefined check-in time added successfully', employee });
    }catch(err){
        res.status(500).json({ message: 'Error adding predefined check-in time', error: err.message });
    }
}