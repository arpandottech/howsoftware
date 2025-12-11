const User = require('../models/User');

// Check for specific permission claim
exports.checkPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            // req.user is set by auth middleware
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Not authorized' });
            }

            // If user has 'ADMIN' role name (legacy or system), allow everything? 
            // Better to rely on permissions array in Role object.
            // We need to ensure req.user.role is populated. The auth middleware needs to populate it, or we do it here.
            // Let's assume auth middleware populates it or we fetch it.

            // Re-fetch to be safe and populate role
            const user = await User.findById(req.user._id).populate('role');

            if (!user || !user.role) {
                return res.status(403).json({ success: false, error: 'No role assigned' });
            }

            // Check if Super Admin (System Role) or specific permission
            // Assuming 'Admin' named role might have all permissions or we check explicitly.
            // Let's check permissions array.

            const hasPermission = user.role.permissions.includes(requiredPermission) || user.role.username === 'Admin'; // Fallback for hardcoded Admin if needed, but better use permissions.

            // Allow if role name is purely 'Admin' (case insensitive) for convenience?
            if (user.role.name && user.role.name.toLowerCase() === 'admin') {
                next();
                return;
            }

            if (user.role.permissions.includes(requiredPermission)) {
                next();
            } else {
                return res.status(403).json({ success: false, error: 'Access denied: Insufficient permissions' });
            }
        } catch (err) {
            next(err);
        }
    };
};

// Simple Admin check
exports.protectAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).populate('role');
        if (user && user.role && user.role.name.toLowerCase() === 'admin') {
            next();
        } else {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }
    } catch (err) {
        next(err);
    }
};
