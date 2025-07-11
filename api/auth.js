const express = require('express');
const cors = require('cors');
const { connectDB } = require('../config/database');
const AdminUser = require('../models/AdminUser');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// MongoDB connection helper for serverless
const ensureConnection = async () => {
    const mongoose = require('mongoose');
    
    if (mongoose.connection.readyState === 1) {
        return; // Already connected
    }
    
    if (mongoose.connection.readyState === 2) {
        // Connecting, wait for it
        return new Promise((resolve, reject) => {
            mongoose.connection.once('connected', resolve);
            mongoose.connection.once('error', reject);
        });
    }
    
    // Not connected, connect now
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI not found in environment variables');
    }
    
    await connectDB();
};

// Debug endpoint to check setup
app.get('/api/auth/debug', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        
        // Test connection
        await ensureConnection();
        
        res.json({
            success: true,
            environment: {
                NODE_ENV: process.env.NODE_ENV,
                MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not Set',
                JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not Set',
            },
            database: {
                connected: mongoose.connection.readyState === 1,
                readyState: mongoose.connection.readyState,
                host: mongoose.connection.host || 'unknown'
            },
            dependencies: {
                mongoose: mongoose.version,
                jwt: require('jsonwebtoken').version,
                bcrypt: require('bcryptjs').version
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Debug failed: ' + error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'https://localhost:3000'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json());

// JWT token generation
const generateToken = (userId) => {
    return jwt.sign(
        { userId, type: 'admin' },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

// JWT token verification middleware
const authenticateToken = async (req, res, next) => {
    try {
        // Ensure database connection first
        await ensureConnection();
        
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access token required',
                code: 'NO_TOKEN'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        const user = await AdminUser.findById(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or inactive user',
                code: 'INVALID_USER'
            });
        }

        req.user = {
            id: user._id,
            username: user.username,
            role: user.role
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired',
                code: 'TOKEN_EXPIRED'
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token',
                code: 'INVALID_TOKEN'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Authentication error',
            code: 'AUTH_ERROR'
        });
    }
};

// Test endpoint
app.get('/api/auth/test', (req, res) => {
    res.json({
        success: true,
        message: 'Auth endpoint is working',
        timestamp: new Date().toISOString()
    });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        // Ensure database connection first
        await ensureConnection();
        
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username and password are required',
                code: 'MISSING_CREDENTIALS'
            });
        }

        const user = await AdminUser.findOne({ 
            username: username.toLowerCase().trim(),
            isActive: true 
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }

        await user.updateLastLogin();
        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    role: user.role,
                    lastLogin: user.lastLogin
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Register endpoint (for first admin user)
app.post('/api/auth/register', async (req, res) => {
    try {
        console.log('Register attempt started');
        console.log('Request body:', req.body);
        
        // Ensure database connection first
        console.log('Ensuring database connection...');
        await ensureConnection();
        console.log('Database connection established');
        
        const { username, password, email, role = 'admin' } = req.body;

        if (!username || !password) {
            console.log('Missing fields error');
            return res.status(400).json({
                success: false,
                error: 'Username and password are required',
                code: 'MISSING_FIELDS'
            });
        }

        if (password.length < 8) {
            console.log('Weak password error');
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 8 characters',
                code: 'WEAK_PASSWORD'
            });
        }

        console.log('Checking user count...');
        // Check if this is the first user
        const userCount = await AdminUser.countDocuments();
        console.log('User count:', userCount);
        const isFirstUser = userCount === 0;

        // If not first user and no authenticated user, deny
        if (!isFirstUser && !req.user) {
            console.log('Registration closed error');
            return res.status(403).json({
                success: false,
                error: 'Registration not allowed',
                code: 'REGISTRATION_CLOSED'
            });
        }

        console.log('Checking existing user...');
        const existingUser = await AdminUser.findOne({ 
            username: username.toLowerCase().trim() 
        });

        if (existingUser) {
            console.log('Username exists error');
            return res.status(400).json({
                success: false,
                error: 'Username already exists',
                code: 'USERNAME_EXISTS'
            });
        }

        console.log('Creating new user...');
        const newUser = new AdminUser({
            username: username.toLowerCase().trim(),
            password,
            email: email ? email.toLowerCase().trim() : undefined,
            role: isFirstUser ? 'super_admin' : role
        });

        console.log('Saving user to database...');
        await newUser.save();
        console.log('User saved successfully');

        res.status(201).json({
            success: true,
            message: 'Admin user created successfully',
            data: {
                user: {
                    id: newUser._id,
                    username: newUser.username,
                    email: newUser.email,
                    role: newUser.role,
                    createdAt: newUser.createdAt
                }
            }
        });

    } catch (error) {
        console.error('Register error details:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Full error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Username already exists',
                code: 'USERNAME_EXISTS'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Internal server error: ' + error.message,
            code: 'SERVER_ERROR',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Token verification endpoint
app.get('/api/auth/verify', authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Token is valid',
            data: {
                user: req.user
            }
        });
    } catch (error) {
        console.error('Verify token error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Profile endpoint
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        await ensureConnection();
        const user = await AdminUser.findById(req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    lastLogin: user.lastLogin,
                    createdAt: user.createdAt
                }
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Change password endpoint
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
    try {
        await ensureConnection();
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Current and new password are required',
                code: 'MISSING_FIELDS'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 8 characters',
                code: 'WEAK_PASSWORD'
            });
        }

        const user = await AdminUser.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                error: 'Current password is incorrect',
                code: 'INVALID_CURRENT_PASSWORD'
            });
        }

        await user.changePassword(newPassword);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Error handling
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Auth endpoint not found',
        path: req.originalUrl,
        method: req.method
    });
});

app.use((err, req, res, next) => {
    console.error('Auth error:', err);
    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

module.exports = app;