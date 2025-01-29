const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        try {
            const { role } = req.user; // Assuming req.user is populated by verifyToken middleware

            if (!allowedRoles.includes(role)) {
                return res.status(403).json({ message: 'Access denied. You do not have the required permissions.' });
            }

            next();
        } catch (err) {
            res.status(500).json({ message: 'Error verifying role', error: err.message });
        }
    };
};

export default checkRole;
