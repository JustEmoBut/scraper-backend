const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/errorHandler');

// Kategoride arama yap
const searchInCategory = asyncHandler(async (req, res) => {
    const { category } = req.params;
    const { q } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
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
});

// Tüm kategorilerde arama
const searchAllCategories = asyncHandler(async (req, res) => {
    const { q } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const filter = {
        isActive: true,
        $or: [
            { name: { $regex: q, $options: 'i' } },
            { brand: { $regex: q, $options: 'i' } }
        ]
    };

    const [products, total] = await Promise.all([
        Product.find(filter)
            .sort({ currentPrice: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean(),
        Product.countDocuments(filter)
    ]);

    // Kategori bazında sonuç dağılımı
    const categoryBreakdown = await Product.aggregate([
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
});

module.exports = {
    searchInCategory,
    searchAllCategories
};