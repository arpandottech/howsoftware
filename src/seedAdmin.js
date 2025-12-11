const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Role = require('./models/Role'); // Import Role
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const seedAdmin = async () => {
    try {
        // 1. Ensure Admin Role Exists
        let adminRole = await Role.findOne({ name: 'Admin' });

        const allPermissions = [
            'MODULE_DASHBOARD',
            'MODULE_BOOKINGS',
            'MODULE_EXPENSES',
            'MODULE_FINANCE',
            'MODULE_SETTINGS',
            'ACTION_MANAGE_USERS',
            'ACTION_MANAGE_ROLES'
        ];

        if (!adminRole) {
            console.log('Creating Admin Role...');
            adminRole = await Role.create({
                name: 'Admin',
                description: 'System Administrator with full access',
                permissions: allPermissions,
                isSystem: true
            });
        } else {
            console.log('Updating Admin Role permissions...');
            adminRole.permissions = allPermissions;
            await adminRole.save();
        }

        // 2. Find or Create Admin User
        const email = 'admin@example.com';
        let user = await User.findOne({ email });

        if (user) {
            console.log(`Updating User ${email} to Admin Role...`);
            user.role = adminRole._id;
            await user.save();
        } else {
            console.log(`Creating new Admin User ${email}...`);
            user = await User.create({
                name: 'System',
                surname: 'Admin',
                email: email,
                passwordHash: '123456', // Default password, model will hash it
                role: adminRole._id
            });
        }

        console.log('Admin Permissions Granted Successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
