import jwt from 'jsonwebtoken';

export const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { _id: user._id, email: user.email, role: user.role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '6h' } // Access Token expires in 6 hours
    );

    const refreshToken = jwt.sign(
        { _id: user._id, email: user.email },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' } // Refresh Token expires in 7 days
    );

    return { accessToken, refreshToken };
};
