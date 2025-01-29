import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Admin from '../models/adminSchema.js';
import Employee from '../models/employeeSchema.js';
import { 
    sendOtpEmail,
    sendRegistrationSuccessEmail,
    sendResetPasswordEmail,
    sendResetPasswordSuccessEmail 
} from '../services/emailService.js';
import { generateTokens } from '../utils/tokenutils.js';

// Register User with OTP
export const register = async (req, res) => {
    let { name, phoneNumber, email, password, role } = req.body;

    // Validate request
    if (!name || !phoneNumber || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Set default role to 'employee'
    if (!role) {
        role = 'employee';
    }

    if (!['admin', 'employee'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        // console.log('Generated OTP:', otp);
        const hashedOtp = await bcrypt.hash(otp, salt);
        const otpExpires = Date.now() + 15 * 60 * 1000; // OTP expires in 15 minutes

        let newUser;

        if (role === 'admin') {
            newUser = new Admin({
                email,
                password: hashedPassword,
                name,
                phoneNumber,
                otp: hashedOtp,
                otpExpires,
            });
        } else {
            newUser = new Employee({
                email,
                password: hashedPassword,
                name,
                phoneNumber,
                otp: hashedOtp,
                otpExpires,
            });
        }

        await newUser.save();

        // Send OTP via email
        await sendOtpEmail(
            email,
            'Confirm Your Registration for The One Branding',
            `${otp}`
        );

        return res.status(201).json({ message: 'Email sent. Please verify your OTP.' });
    } catch (err) {
    console.error('Error details:', err); // Log full error
    res.status(500).json({ message: 'Error registering user!', error: err.message || err });
    }
};

// Confirm Registration with OTP
export const confirmRegistration = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    try {
        const user = await Admin.findOne({ email }) || await Employee.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Check if OTP is expired
        if (user.otpExpires < Date.now()) {
            // Delete user if OTP expires
            await (user.role === 'admin' ? Admin : Employee).deleteOne({ email });
            return res.status(400).json({ message: 'OTP has expired. Registration failed.' });
        }

        // Validate the entered OTP
        const isOtpValid = await bcrypt.compare(otp, user.otp);
        if (!isOtpValid) {
            // Delete user if OTP is invalid
            await (user.role === 'admin' ? Admin : Employee).deleteOne({ email });
            return res.status(400).json({ message: 'Invalid OTP. Registration failed.' });
        }

        // Clear OTP after successful verification
        user.otp = null;
        user.otpExpires = null;
        user.isVerified = true;
        await user.save();

        // Send confirmation email
        await sendRegistrationSuccessEmail(
            email,
            'Registration Confirmed for The One Branding',
            'Your registration has been confirmed. You can now log in.'
        );

        return res.status(200).json({ message: 'Registration confirmed successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error verifying OTP', error: err });
    }
};

// Login User
export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email in both Admin and Employee collections
        const user =  await Employee.findOne({ email }) || await Admin.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Validate password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ message: 'Invalid credentials' });

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Set Refresh Token in an HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'Strict', // Prevent CSRF
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // Return user details along with tokens
        res.status(200).json({
            message: 'Login successful',            
            role: user.role,
            _id: user._id,
            email: user.email,
            token: accessToken            
        });
    } catch (err) {
        console.error("Error logging in:", err);
        res.status(500).json({ message: 'Error logging in', error: err.message });
    }
};



// refresh access token
export const refreshAccessToken = async (req, res) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) return res.status(401).json({ message: 'Refresh Token is required' });

    try {
        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Fetch the user to ensure they still exist
        const user = await Admin.findById(payload._id) || await Employee.findById(payload._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Generate a new Access Token
        const accessToken = jwt.sign(
            { _id: user._id, email: user.email, role: user.role },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '30m' }
        );

        res.status(200).json({ accessToken });
    } catch (err) {
        res.status(403).json({ message: 'Invalid or expired Refresh Token', error: err.message });
    }
};

// Logout
export const logout = (req, res) => {
    try {
        // Clear the refresh token cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Secure in production
            sameSite: 'Strict', // Protect against CSRF
        });

        res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error logging out', error: err.message });
    }
};

// Reset Password with OTP
export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
        const user = await Admin.findOne({ email }) || await Employee.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Generate OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);

        user.otp = hashedOtp;
        user.otpExpires = Date.now() + 15 * 60 * 1000; // OTP expires in 15 minutes
        await user.save();

        // Send OTP via email
        await sendResetPasswordEmail(
            email,
            'Reset Your Password for The One Branding',
            `${otp}`
        );

        return res.status(200).json({ message: 'Email sent. Please verify your OTP.' });
    } catch (err) {
        res.status(500).json({ message: 'Error resetting password', error: err });
    }
};

// Verify OTP for Password Reset
export const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    try {
        const user = await Admin.findOne({ email }) || await Employee.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Check if OTP is expired
        if (user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        // Validate the entered OTP
        const isOtpValid = await bcrypt.compare(otp, user.otp);
        if (!isOtpValid) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Clear OTP after successful verification
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        return res.status(200).json({ message: 'OTP verified successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error verifying OTP', error: err });
    }
};

// Set New Password After OTP Verification
export const resetPassword = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await Admin.findOne({ email }) || await Employee.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Update the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user.password = hashedPassword;
        await user.save();        

        // Notify the user
        await sendResetPasswordSuccessEmail(
            email,
            'Password Changed Successfully for The One Branding',
            'Your password has been successfully changed. If this was not you, please contact support immediately.'
        );

        return res.status(200).json({ message: 'Password reset successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error resetting password', error: err });
    }
};
