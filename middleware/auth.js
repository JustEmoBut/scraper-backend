const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const { connectDB } = require('../config/database');

// JWT Secret - MUST be set in environment variables
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// JWT token oluşturma
const generateToken = (userId) => {
    return jwt.sign(
        { userId, type: 'admin' },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

// MongoDB bağlantısını sağla (serverless için)
const ensureConnection = async () => {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) return;
    
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI not found in environment variables');
    }
    
    await connectDB();
};

// JWT token doğrulama middleware
const authenticateToken = async (req, res, next) => {
    try {
        // MongoDB bağlantısını sağla
        await ensureConnection();
        
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access token required',
                code: 'NO_TOKEN'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Kullanıcının hala aktif olup olmadığını kontrol et
        const user = await AdminUser.findById(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or inactive user',
                code: 'INVALID_USER'
            });
        }

        // Kullanıcı bilgilerini request'e ekle
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

// Admin rolü kontrolü
const requireAdmin = (req, res, next) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
        return res.status(403).json({
            success: false,
            error: 'Admin access required',
            code: 'INSUFFICIENT_PERMISSIONS'
        });
    }
    next();
};

// Super admin rolü kontrolü
const requireSuperAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'super_admin') {
        return res.status(403).json({
            success: false,
            error: 'Super admin access required',
            code: 'INSUFFICIENT_PERMISSIONS'
        });
    }
    next();
};

module.exports = {
    generateToken,
    authenticateToken,
    requireAdmin,
    requireSuperAdmin,
    JWT_SECRET
};