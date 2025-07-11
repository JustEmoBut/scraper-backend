const { connectDB } = require('../config/database');

// MongoDB connection check middleware
const databaseMiddleware = async (req, res, next) => {
    const mongoose = require('mongoose');
    
    // Skip DB check for root endpoint and debug endpoint
    if (req.path === '/' || req.path === '/api/debug' || req.path === '/api/test-connection') {
        return next();
    }
    
    // Try to ensure connection before handling DB requests
    if (mongoose.connection.readyState !== 1) {
        try {
            console.log('Database not connected, attempting to reconnect...');
            await connectDB();
        } catch (error) {
            return res.status(503).json({
                success: false,
                error: 'Database connection failed. Please check MongoDB Atlas connection.',
                details: error.message,
                mongoState: mongoose.connection.readyState,
                mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not Set'
            });
        }
    }
    
    // Final check
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            success: false,
            error: 'Database connection not available. Please check MongoDB Atlas connection.',
            mongoState: mongoose.connection.readyState,
            mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not Set'
        });
    }
    
    next();
};

module.exports = databaseMiddleware;