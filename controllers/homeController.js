const mongoose = require('mongoose');

// Ana sayfa - API bilgileri
const getApiInfo = (req, res) => {
    const dbStatus = {
        connected: mongoose.connection.readyState === 1,
        state: mongoose.connection.readyState,
        stateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown'
    };
    
    res.json({
        message: 'TechPrice Scraper API - Node.js Backend + Python Scraper',
        version: '6.0.0',
        status: 'running',
        database: {
            type: 'MongoDB Atlas (Cloud)',
            status: dbStatus,
            uri: process.env.MONGODB_URI ? 'configured' : 'not configured'
        },
        deployment: 'Vercel Serverless + Local Development',
        architecture: 'Hybrid: Node.js API + Python Camoufox Scraper',
        endpoints: {
            categories: 'GET /api/categories',
            categoryData: 'GET /api/data/:category',
            search: 'GET /api/search/:category?q=searchTerm',
            searchAll: 'GET /api/search/all?q=searchTerm',
            products: 'GET /api/products',
            productsByPrice: 'GET /api/products/price-range?min=&max=',
            productsByBrand: 'GET /api/products/brand/:brand',
            sites: 'GET /api/sites',
            siteInfo: 'GET /api/sites/:siteName',
            stats: 'GET /api/stats',
            analytics: 'GET /api/analytics/price-trends',
            priceHistory: 'GET /api/products/:id/price-history',
            batchProducts: 'POST /api/batch/products',
            batchCategoryStats: 'POST /api/batch/category-stats',
            batchPriceComparison: 'POST /api/batch/price-comparison'
        },
        features: [
            'JWT Authentication',
            'Admin Panel',
            'Product Specifications Management',
            'Error Handling',
            'Input Validation',
            'MongoDB Integration',
            'Batch Processing',
            'Price Analytics',
            'Python Camoufox Integration'
        ],
        note: 'API + Admin Panel. Scraping işlemleri Python/Camoufox ile yapılır.',
        timestamp: new Date().toISOString()
    });
};

// Debug endpoint for connection troubleshooting
const getDebugInfo = (req, res) => {
    res.json({
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            MONGODB_URI: process.env.MONGODB_URI ? 'Set (hidden)' : 'Not Set',
            VERCEL: process.env.VERCEL || 'Not Set'
        },
        mongoose: {
            version: mongoose.version,
            readyState: mongoose.connection.readyState,
            readyStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
            host: mongoose.connection.host || 'unknown',
            name: mongoose.connection.name || 'unknown'
        },
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
};

// Connection test endpoint
const testConnection = async (req, res) => {
    try {
        console.log('Testing MongoDB connection...');
        const { connectDB } = require('../config/database');
        await connectDB();
        
        res.json({
            success: true,
            message: 'Database connection successful',
            connectionState: mongoose.connection.readyState,
            connectionHost: mongoose.connection.host,
            connectionName: mongoose.connection.name,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Database connection failed',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

module.exports = {
    getApiInfo,
    getDebugInfo,
    testConnection
};