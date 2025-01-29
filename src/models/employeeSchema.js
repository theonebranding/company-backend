import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phoneNumber: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, default: 'employee' },   
    dateofBirth: { type: Date },
    // professional info
    jobRole: { type: String },
    joinedDate: { type: Date },
    serviceTime: { type: String },
    // identification info    
    aadharNumber: { type: String },
    panNumber: { type: String },
    licenseInfo: { type: String },
    // Bank info
    bankName: { type: String },
    branchName: { type: String },
    bankAccountNumber: { type: String },        
    ifscCode: { type: String },
    // address info
    address: { type: String },
    state: { type: String },
    city: { type: String },
    district: { type: String },    
    pinCode: { type: String },   
    // predefined Checkin time
    predefinedCheckInTime: { type: String, default: '10:00' },
    // email verification
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpires: { type: Date },
}, { timestamps: true });

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;