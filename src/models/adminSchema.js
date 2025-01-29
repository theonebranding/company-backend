import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin', immutable: true },
    otp: { type: String },
    otpExpires: { type: Date },
    isVerified: { type: Boolean, default: false },
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;