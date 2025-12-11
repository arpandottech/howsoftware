const Role = require('../models/Role');

// @desc    Get all Roles
// @route   GET /api/roles
// @access  Private (Admin?)
exports.getRoles = async (req, res, next) => {
    try {
        const roles = await Role.find({});
        res.status(200).json({ success: true, data: roles });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a Role
// @route   POST /api/roles
// @access  Private (Admin)
exports.createRole = async (req, res, next) => {
    try {
        const { name, description, permissions } = req.body;

        const role = await Role.create({
            name,
            description,
            permissions
        });

        res.status(201).json({ success: true, data: role });
    } catch (err) {
        next(err);
    }
};

// @desc    Update a Role
// @route   PUT /api/roles/:id
// @access  Private (Admin)
exports.updateRole = async (req, res, next) => {
    try {
        const role = await Role.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!role) {
            return res.status(404).json({ success: false, error: 'Role not found' });
        }

        res.status(200).json({ success: true, data: role });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete a Role
// @route   DELETE /api/roles/:id
// @access  Private (Admin)
exports.deleteRole = async (req, res, next) => {
    try {
        const role = await Role.findById(req.params.id);

        if (!role) {
            return res.status(404).json({ success: false, error: 'Role not found' });
        }

        if (role.isSystem) {
            return res.status(400).json({ success: false, error: 'Cannot delete system role' });
        }

        await role.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};
