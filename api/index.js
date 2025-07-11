const express = require('express');
const cors = require('cors');
const { connectDB } = require('../config/database');
const Product = require('../models/Product');
const Category = require('../models/Category');
require('dotenv').config();

const app = express();

// Connect to MongoDB
if (process.env.MONGODB_URI) {
    connectDB().catch(err => {
        console.error('MongoDB connection failed:', err.message);
        console.error('Full error:', err);
    });
} else {
    console.warn('MONGODB_URI not found in environment variables');
}

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'https://localhost:3000'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json());

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

// Ana sayfa
app.get('/', (_, res) => {
    const mongoose = require('mongoose');
    const dbStatus = {
        connected: mongoose.connection.readyState === 1,
        state: mongoose.connection.readyState,
        stateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown'
    };
    
    res.json({
        message: 'TechPrice Scraper API - Hybrid System v6.0',
        version: '6.0.0',
        status: 'running',
        database: {
            type: 'MongoDB Atlas (Cloud)',
            status: dbStatus,
            uri: process.env.MONGODB_URI ? 'configured' : 'not configured'
        },
        deployment: 'Vercel Serverless',
        architecture: 'Node.js API + Python Camoufox Scraper',
        endpoints: {
            categories: 'GET /api/categories',
            products: 'GET /api/products',
            search: 'GET /api/search/:category',
            stats: 'GET /api/stats',
            specifications: 'GET /api/specifications',
            compare: 'POST /api/compare/products',
            sites: 'GET /api/sites',
            auth: 'POST /api/auth/login'
        },
        features: [
            'JWT Authentication',
            'Product Specifications (138+ fields)',
            'Product Comparison System', 
            'Admin Panel Integration',
            'Python Camoufox Scraper'
        ],
        note: 'Hybrid API: Node.js backend + Python scraper',
        timestamp: new Date().toISOString()
    });
});

// API Documentation endpoint - simplified
app.get('/api/docs', (_, res) => {
    res.json({
        title: 'TechPrice API v6.0',
        description: 'Hybrid System: Node.js API + Python Camoufox Scraper',
        version: '6.0.0',
        endpoints: {
            core: [
                'GET /api/categories - List categories',
                'GET /api/products - List products with pagination',
                'GET /api/search/:category - Search within category',
                'GET /api/stats - System statistics'
            ],
            specifications: [
                'GET /api/specifications - List specifications',
                'POST /api/specifications - Create specification (auth)',
                'GET /api/specifications/templates - Get templates'
            ],
            comparison: [
                'POST /api/compare/products - Compare products',
                'GET /api/compare/data - Simple comparison'
            ],
            frontend: [
                'GET /api/frontend/products-with-specs - Products with specs',
                'GET /api/frontend/specifications/:category - Specs by category'
            ],
            auth: [
                'POST /api/auth/login - Admin login',
                'GET /api/auth/verify - Verify token'
            ]
        },
        features: ['JWT Auth', '138+ Specifications', 'Product Comparison', 'Admin Panel'],
        architecture: 'Node.js API + Python Camoufox Scraper'
    });
});

// Debug endpoint for connection troubleshooting
app.get('/api/debug', (_, res) => {
    const mongoose = require('mongoose');
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
        timestamp: new Date().toISOString()
    });
});

// Connection test endpoint
app.get('/api/test-connection', async (_, res) => {
    try {
        console.log('Testing MongoDB connection...');
        await connectDB();
        
        const mongoose = require('mongoose');
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
});

// Tüm kategorileri listele
app.get('/api/categories', async (_, res) => {
    try {
        const categories = await Category.find({ isActive: true })
            .select('key displayName source totalProducts lastScrapedAt')
            .sort({ displayName: 1 })
            .lean();
        
        res.json({
            success: true,
            categories: categories,
            count: categories.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Belirli kategori verisini getir
app.get('/api/data/:category', async (req, res) => {
    try {
        const { category } = req.params;
        
        const [products, categoryInfo] = await Promise.all([
            Product.find({ 
                category: category, 
                isActive: true 
            })
            .sort({ currentPrice: 1 })
            .lean(),
            
            Category.findOne({ 
                key: category, 
                isActive: true 
            }).lean()
        ]);
        
        if (!categoryInfo) {
            return res.status(404).json({
                success: false,
                error: 'Kategori bulunamadı'
            });
        }
        
        const data = {
            category: categoryInfo.key,
            displayName: categoryInfo.displayName,
            source: categoryInfo.source,
            lastUpdated: categoryInfo.lastScrapedAt,
            totalProducts: products.length,
            products: products
        };
        
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Kategoride arama yap
app.get('/api/search/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const { q } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Arama terimi gerekli (q parametresi)'
            });
        }
        
        const filter = {
            category: category,
            isActive: true,
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { brand: { $regex: q, $options: 'i' } }
            ]
        };
        
        const [results, total] = await Promise.all([
            Product.find(filter)
                .sort({ currentPrice: 1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .lean(),
            Product.countDocuments(filter)
        ]);
        
        res.json({
            success: true,
            category: category,
            searchTerm: q,
            results: results,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalProducts: total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Tüm ürünleri getir (pagination ile)
app.get('/api/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const category = req.query.category;
        const source = req.query.source;
        const sortBy = req.query.sortBy || 'scrapedAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

        const filter = { isActive: true };
        if (category) filter.category = category;
        if (source) filter.source = source;

        const [products, total] = await Promise.all([
            Product.find(filter)
                .sort({ [sortBy]: sortOrder })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .lean(),
            Product.countDocuments(filter)
        ]);

        res.json({
            success: true,
            products,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalProducts: total,
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Fiyat aralığına göre ürünleri getir
app.get('/api/products/price-range', async (req, res) => {
    try {
        const { min, max, category, source } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const filter = { isActive: true };
        
        if (min || max) {
            filter.currentPrice = {};
            if (min) filter.currentPrice.$gte = parseFloat(min);
            if (max) filter.currentPrice.$lte = parseFloat(max);
        }
        
        if (category) filter.category = category;
        if (source) filter.source = source;

        const [products, total] = await Promise.all([
            Product.find(filter)
                .sort({ currentPrice: 1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .lean(),
            Product.countDocuments(filter)
        ]);

        res.json({
            success: true,
            products,
            filter: { min, max, category, source },
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalProducts: total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Brand'e göre ürünleri getir
app.get('/api/products/brand/:brand', async (req, res) => {
    try {
        const { brand } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const category = req.query.category;

        const filter = { 
            isActive: true,
            brand: { $regex: brand, $options: 'i' }
        };
        
        if (category) filter.category = category;

        const [products, total] = await Promise.all([
            Product.find(filter)
                .sort({ currentPrice: 1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .lean(),
            Product.countDocuments(filter)
        ]);

        res.json({
            success: true,
            brand,
            products,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalProducts: total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Tüm kategorilerde arama
app.get('/api/search/all', async (req, res) => {
    try {
        const { q } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Arama terimi gerekli (q parametresi)'
            });
        }

        const filter = {
            isActive: true,
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { brand: { $regex: q, $options: 'i' } }
            ]
        };

        const [products, total, categoryBreakdown] = await Promise.all([
            Product.find(filter)
                .sort({ currentPrice: 1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .lean(),
            Product.countDocuments(filter),
            Product.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: '$category',
                        count: { $sum: 1 },
                        avgPrice: { $avg: '$currentPrice' },
                        minPrice: { $min: '$currentPrice' }
                    }
                },
                { $sort: { count: -1 } }
            ])
        ]);

        res.json({
            success: true,
            searchTerm: q,
            results: products,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalProducts: total
            },
            categoryBreakdown: categoryBreakdown
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// İstatistikler endpoint'i
app.get('/api/stats', async (_, res) => {
    try {
        const [totalProducts, totalCategories, productsByCategory, productsBySource, averagePrices, lastScrapingTimes] = await Promise.all([
            Product.countDocuments({ isActive: true }),
            Category.countDocuments({ isActive: true }),
            Product.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            Product.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$source', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            Product.aggregate([
                { $match: { isActive: true } },
                { $group: { 
                    _id: '$category', 
                    avgPrice: { $avg: '$currentPrice' },
                    minPrice: { $min: '$currentPrice' },
                    maxPrice: { $max: '$currentPrice' }
                }},
                { $sort: { avgPrice: -1 } }
            ]),
            Category.find({ isActive: true })
                .sort({ lastScrapedAt: -1 })
                .limit(10)
                .select('key displayName source lastScrapedAt totalProducts')
                .lean()
        ]);

        // Overall stats hesapla
        const totalSources = productsBySource.length;
        const totalPrice = averagePrices.reduce((sum, cat) => sum + (cat.avgPrice || 0), 0);
        const overallAvgPrice = averagePrices.length > 0 ? totalPrice / averagePrices.length : 0;
        
        res.json({
            success: true,
            stats: {
                totalProducts,
                totalCategories,
                productsByCategory,
                productsBySource,
                averagePrices,
                lastScrapingTimes,
                overall: {
                    totalProducts,
                    totalCategories,
                    totalSources,
                    averagePrice: Math.round(overallAvgPrice),
                    lastUpdated: lastScrapingTimes.length > 0 ? lastScrapingTimes[0].lastScrapedAt : null
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Site yönetimi endpoint'leri - Static data (Python scraper handles sites)
app.get('/api/sites', (_, res) => {
    try {
        const sites = {
            incehesap: { name: 'İnceHesap', baseUrl: 'https://www.incehesap.com', status: 'active' },
            itopya: { name: 'İtopya', baseUrl: 'https://www.itopya.com', status: 'active' },
            sinerji: { name: 'Sinerji', baseUrl: 'https://www.sinerji.gen.tr', status: 'active' }
        };
        res.json({
            success: true,
            sites: sites
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Belirli site bilgisini getir
app.get('/api/sites/:siteName', (req, res) => {
    try {
        const { siteName } = req.params;
        const sites = {
            incehesap: { name: 'İnceHesap', baseUrl: 'https://www.incehesap.com', status: 'active', categories: 7 },
            itopya: { name: 'İtopya', baseUrl: 'https://www.itopya.com', status: 'active', categories: 7 },
            sinerji: { name: 'Sinerji', baseUrl: 'https://www.sinerji.gen.tr', status: 'active', categories: 7 }
        };
        
        const siteInfo = sites[siteName];
        if (!siteInfo) {
            return res.status(404).json({
                success: false,
                error: 'Site bulunamadı'
            });
        }
        
        res.json({
            success: true,
            site: siteInfo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Analytics endpoints
app.get('/api/analytics/price-trends', async (req, res) => {
    try {
        const { category, source } = req.query;
        
        const filter = { isActive: true };
        if (category) filter.category = category;
        if (source) filter.source = source;
        
        const [priceAnalysis, siteComparison] = await Promise.all([
            Product.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: { category: '$category', source: '$source' },
                        avgPrice: { $avg: '$currentPrice' },
                        minPrice: { $min: '$currentPrice' },
                        maxPrice: { $max: '$currentPrice' },
                        productCount: { $sum: 1 }
                    }
                },
                { $sort: { avgPrice: -1 } }
            ]),
            Product.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: '$source',
                        avgPrice: { $avg: '$currentPrice' },
                        minPrice: { $min: '$currentPrice' },
                        maxPrice: { $max: '$currentPrice' },
                        productCount: { $sum: 1 }
                    }
                },
                { $sort: { avgPrice: 1 } }
            ])
        ]);
        
        res.json({
            success: true,
            analysis: {
                priceByCategory: priceAnalysis,
                siteComparison: siteComparison,
                totalAnalyzed: priceAnalysis.reduce((sum, item) => sum + item.productCount, 0)
            },
            note: "Mevcut fiyat verileri analizi"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Batch ürün verisi çekme
app.post('/api/batch/products', async (req, res) => {
    try {
        const { categories, sources, priceRange, limit = 100 } = req.body;
        
        if (!categories || !Array.isArray(categories)) {
            return res.status(400).json({
                success: false,
                error: 'categories array gerekli'
            });
        }

        const filter = { isActive: true };
        
        if (categories.length > 0) {
            filter.category = { $in: categories };
        }
        
        if (sources && Array.isArray(sources) && sources.length > 0) {
            filter.source = { $in: sources };
        }
        
        if (priceRange && (priceRange.min || priceRange.max)) {
            filter.currentPrice = {};
            if (priceRange.min) filter.currentPrice.$gte = parseFloat(priceRange.min);
            if (priceRange.max) filter.currentPrice.$lte = parseFloat(priceRange.max);
        }

        const [products, totalCount, categoryStats] = await Promise.all([
            Product.find(filter)
                .sort({ currentPrice: 1 })
                .limit(limit)
                .lean(),
            Product.countDocuments(filter),
            Product.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: '$category',
                        count: { $sum: 1 },
                        avgPrice: { $avg: '$currentPrice' },
                        minPrice: { $min: '$currentPrice' },
                        maxPrice: { $max: '$currentPrice' }
                    }
                },
                { $sort: { count: -1 } }
            ])
        ]);

        res.json({
            success: true,
            batch: {
                requestedCategories: categories,
                filters: { sources, priceRange, limit },
                products,
                statistics: {
                    totalMatched: totalCount,
                    returned: products.length,
                    categoryBreakdown: categoryStats
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


// Specifications endpoints
const specificationController = require('../controllers/specificationController');
const { authenticateToken } = require('../middleware/auth');


// Specific routes first (before general patterns)
app.get('/api/specifications/search', specificationController.searchSpecifications);
app.get('/api/specifications/unmatched', specificationController.getUnmatchedProducts);
app.get('/api/specifications/coverage', specificationController.getSpecificationCoverage);
app.get('/api/specifications/templates', specificationController.getSpecificationTemplates);
app.get('/api/specifications/templates/:category', specificationController.getSpecificationTemplates);
app.get('/api/specifications/product/:productId', specificationController.findSpecificationsByProduct);
app.post('/api/specifications/rematch/:specificationId', authenticateToken, specificationController.rematchSpecifications);
app.post('/api/specifications/rematch-all', authenticateToken, specificationController.rematchAllSpecifications);
app.post('/api/specifications/rematch-single/:specificationId', authenticateToken, specificationController.rematchSingleSpecification);
app.post('/api/specifications/cleanup-matches', authenticateToken, specificationController.cleanupLowQualityMatches);
app.post('/api/specifications/clear-all-matches', authenticateToken, specificationController.clearAllMatches);

// Manual matching routes (must be before general :id route)
app.get('/api/specifications/:specificationId/potential-matches', authenticateToken, specificationController.findPotentialMatches);
app.post('/api/specifications/:specificationId/add-match/:productId', authenticateToken, specificationController.addProductMatch);
app.delete('/api/specifications/:specificationId/remove-match/:productId', authenticateToken, specificationController.removeProductMatch);

// General routes last (after all specific routes)
app.get('/api/specifications', specificationController.getAllSpecifications);
app.get('/api/specifications/:id', specificationController.getSpecificationById);

// Protected specification routes
app.post('/api/specifications', authenticateToken, specificationController.createSpecification);
app.put('/api/specifications/:id', authenticateToken, specificationController.updateSpecification);
app.delete('/api/specifications/:id', authenticateToken, specificationController.deleteSpecification);
app.post('/api/specifications/match/:productId', authenticateToken, specificationController.matchProductWithSpecification);

// Product comparison endpoints
app.post('/api/compare/products', specificationController.compareProducts);
app.get('/api/compare/data', specificationController.getComparisonData);
app.post('/api/compare/table', specificationController.generateComparisonTable);

// Frontend-specific specification endpoints
app.get('/api/frontend/products-with-specs', specificationController.getProductsWithSpecifications);
app.get('/api/frontend/specifications/:category', specificationController.getSpecificationsByCategory);
app.get('/api/frontend/product/:productId/specifications', specificationController.getProductSpecificationDetails);

// Direct matching data endpoints - public access for external applications
app.get('/api/matching/all', specificationController.getAllMatchingData);
app.get('/api/matching/category/:category', specificationController.getMatchingDataByCategory);
app.post('/api/matching/bulk-create', authenticateToken, specificationController.bulkCreateMatches);
app.get('/api/matching/export', specificationController.exportMatchingData);

// Product name search endpoint - find specifications by product name
app.post('/api/product/find-specifications', specificationController.findSpecificationsByProductName);

// Authentication routes are handled by api/auth.js (see vercel.json rewrites)

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

// Vercel serverless function export
module.exports = app;