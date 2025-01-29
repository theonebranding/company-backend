import jwt from 'jsonwebtoken';

const verifyToken = (req, res, next) => {
    const authHeader = req.header('Authorization'); 
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access Denied. Token missing or malformed' });
    }

    const token = authHeader.split(' ')[1]; 
    if (!token) {
        return res.status(401).json({ message: 'Access Denied. Token missing' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_ACCESS_SECRET); 
        req.user = verified; 
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid Token' });
    }
};

export default verifyToken;