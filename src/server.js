const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json()); // Body parser
app.use(cors());
app.use(helmet());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Routes
const authRoutes = require('./routes/authRoutes');
const pricingRoutes = require('./routes/pricingRoutes');
const pricingSettingsRoutes = require('./routes/pricingSettingsRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const roleRoutes = require('./routes/roleRoutes'); // New Route

app.use('/api/auth', authRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/settings/pricing', pricingSettingsRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/finance', require('./routes/financeRoutes'));
app.use('/api/roles', roleRoutes); // Mount Role Routes




// Base route for testing
app.get('/', (req, res) => {
    res.json({ message: 'Photography Studio Booking API is running' });
});

// Error Handler (must be last middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'production'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});
