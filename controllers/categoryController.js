const Category = require('../models/Category');
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/errorHandler');

// Tüm kategorileri listele
const getAllCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find({ isActive: true })
        .select('key displayName source totalProducts lastScrapedAt')
        .sort({ displayName: 1 })
        .lean();
    
    res.json({
        success: true,
        categories: categories,
        count: categories.length
    });
});

// Belirli kategori verisini getir
const getCategoryData = asyncHandler(async (req, res) => {
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
});

// İstatistikler endpoint'i
const getStats = asyncHandler(async (req, res) => {
    const [totalProducts, totalCategories, productsByCategory, productsBySource, averagePrices] = await Promise.all([
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
        ])
    ]);

    res.json({
        success: true,
        stats: {
            totalProducts,
            totalCategories,
            productsByCategory,
            productsBySource,
            averagePrices
        }
    });
});

module.exports = {
    getAllCategories,
    getCategoryData,
    getStats
};