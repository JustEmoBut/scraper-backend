const mongoose = require('mongoose');

// Global connection cache for serverless functions
let cachedConnection = null;

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is not defined');
        }
        
        // Check if already connected
        if (mongoose.connection.readyState === 1) {
            console.log('Using existing MongoDB connection');
            return mongoose.connection;
        }
        
        // If connecting, wait for it
        if (mongoose.connection.readyState === 2) {
            console.log('MongoDB connection in progress, waiting...');
            return new Promise((resolve, reject) => {
                mongoose.connection.once('connected', () => resolve(mongoose.connection));
                mongoose.connection.once('error', reject);
                setTimeout(() => reject(new Error('Connection timeout')), 30000);
            });
        }
        
        console.log('Creating new MongoDB connection...');
        console.log('MongoDB URI format check:', process.env.MONGODB_URI ? 
            process.env.MONGODB_URI.substring(0, 30) + '...' : 'Not Set');
        
        // Try minimal connection first for SSL issues
        let conn;
        try {
            console.log('Attempting minimal MongoDB connection...');
            conn = await mongoose.connect(process.env.MONGODB_URI, {
                bufferCommands: false, // Critical for serverless
                maxPoolSize: 1, // Minimal pool for serverless
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 30000
            });
        } catch (minimalError) {
            console.log('Minimal connection failed, trying full options:', minimalError.message);
            conn = await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 30000,
                socketTimeoutMS: 60000,
                maxPoolSize: 10,
                maxIdleTimeMS: 30000,
                bufferCommands: false, // Critical for serverless
                // SSL/TLS settings for Vercel serverless
                ssl: true,
                sslValidate: true,
                retryWrites: true,
                w: 'majority'
            });
        }

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Cache the connection
        cachedConnection = conn;
        return conn;
    } catch (error) {
        console.error(`Database connection error: ${error.message}`);
        console.error('MongoDB URI status:', process.env.MONGODB_URI ? 'Set' : 'Not Set');
        
        // Reset cached connection on error
        cachedConnection = null;
        
        // Don't exit process in serverless environment
        if (process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
        throw error;
    }
};

const disconnectDB = async () => {
    try {
        await mongoose.disconnect();
        console.log('MongoDB Disconnected');
    } catch (error) {
        console.error(`Database disconnection error: ${error.message}`);
    }
};

module.exports = { connectDB, disconnectDB };