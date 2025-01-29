import Admin from "../models/adminSchema.js";

// Update Admin Profile
export const updateAdminProfile = async (req, res) => {
    try {
        const { _id } = req.user;
        const updateFields = req.body;

        if (!updateFields || Object.keys(updateFields).length === 0) {
            return res.status(400).json({ message: "No fields to update" });
        }

        const restrictedFields = ["otp", "otpExpires", "role", "_id", "isVerified", "createdAt"];
        const updates = Object.keys(updateFields).reduce((acc, field) => {
            if (!restrictedFields.includes(field)) {
                acc[field] = updateFields[field];
            }
            return acc;
        }, {});

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No valid fields to update" });
        }

        const updatedAdmin = await Admin.findByIdAndUpdate(
            _id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select("-isVerified -otp -otpExpires -createdAt -updatedAt -role -password");

        if (!updatedAdmin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        res.status(200).json({
            message: "Admin data updated successfully",
            admin: updatedAdmin,
        });
    } catch (err) {
        res.status(500).json({ message: "Error updating admin data", error: err.message });
    }
};

// Get Admin Profile
export const getAdminProfile = async (req, res) => {
    try {
        const { _id } = req.user;

        const admin = await Admin.findById(_id).select(
            "-isVerified -otp -otpExpires -createdAt -updatedAt -role -password"
        );

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        res.status(200).json({
            message: "Admin data fetched successfully",
            admin,
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching admin data", error: err.message });
    }
};

