const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB - Required for operation
connectDB().catch(err => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
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

// Static files middleware - Admin panel'i serve et
app.use(express.static('public'));

// MongoDB connection check middleware
app.use(async (req, res, next) => {
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
});


// Ana sayfa - API bilgileri
app.get('/', (_, res) => {
    const mongoose = require('mongoose');
    const dbStatus = {
        connected: mongoose.connection.readyState === 1,
        state: mongoose.connection.readyState,
        stateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown'
    };
    
    res.json({
        message: 'TechPrice Scraper API - Local Development v6.0',
        version: '6.0.0',
        status: 'running',
        database: {
            type: 'MongoDB Atlas (Cloud)',
            status: dbStatus,
            uri: process.env.MONGODB_URI ? 'configured' : 'not configured'
        },
        deployment: 'Local Development',
        adminPanel: 'http://localhost:3000/index.html',
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
            stats: 'GET /api/stats'
        },
        note: 'Bu sadece okuma API\'sidir. Scraping işlemleri Python/Camoufox ile yapılır.',
        timestamp: new Date().toISOString()
    });
});

// Test connection endpoint for admin panel
app.get('/api/test-connection', (_, res) => {
    const mongoose = require('mongoose');
    
    const dbState = mongoose.connection.readyState;
    const isConnected = dbState === 1;
    
    res.json({
        success: isConnected,
        database: {
            connected: isConnected,
            state: dbState,
            stateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown',
            host: mongoose.connection.host || 'not connected',
            name: mongoose.connection.name || 'not connected'
        },
        timestamp: new Date().toISOString()
    });
});

// Debug endpoint for connection troubleshooting
app.get('/api/debug', (_, res) => {
    const mongoose = require('mongoose');
    res.json({
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            MONGODB_URI: process.env.MONGODB_URI ? 'Set (hidden)' : 'Not Set',
            PORT: PORT
        },
        mongoose: {
            version: mongoose.version,
            readyState: mongoose.connection.readyState,
            readyStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
            host: mongoose.connection.host || 'unknown',
            name: mongoose.connection.name || 'unknown'
        },
        timestamp: new Date().toISOString()
    });
});



// Import routes
const categoriesRouter = require('./routes/categories');
const productsRouter = require('./routes/products');
const searchRouter = require('./routes/search');
const sitesRouter = require('./routes/sites');
const analyticsRouter = require('./routes/analytics');
const batchRouter = require('./routes/batch');
const authRouter = require('./routes/auth');
const specificationsRouter = require('./routes/specifications');

// Import stats controller
const { getStats } = require('./controllers/categoryController');

// Use routes
app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api', productsRouter);
app.use('/api/search', searchRouter);
app.use('/api/sites', sitesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/batch', batchRouter);
app.use('/api/specifications', specificationsRouter);

// Mount stats endpoint separately
app.get('/api/stats', getStats);






// Error handling
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
    });
});

app.use((err, _req, res, _next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`🚀 TechPrice API Server running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}`);
    console.log(`🎯 Admin Panel: http://localhost:${PORT}`);
    console.log(`💾 Database: MongoDB Atlas (Cloud)`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⚡ Architecture: Node.js API + Python/Camoufox Scraper`);
    console.log(`📊 Kategoriler: İşlemci, Ekran Kartı, Anakart, RAM, SSD, Güç Kaynağı, Bilgisayar Kasası`);
    console.log(`⚡ Siteler: İnceHesap, İtopya, Sinerji`);
    console.log('=====================================');
});