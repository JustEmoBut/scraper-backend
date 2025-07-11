const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/errorHandler');

// Tüm ürünleri getir (pagination ile)
const getAllProducts = asyncHandler(async (req, res) => {
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
});

// Fiyat aralığına göre ürünleri getir
const getProductsByPriceRange = asyncHandler(async (req, res) => {
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
});

// Brand'e göre ürünleri getir
const getProductsByBrand = asyncHandler(async (req, res) => {
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
});

// Ürün fiyat geçmişi
const getProductPriceHistory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const product = await Product.findById(id).lean();
    
    if (!product) {
        return res.status(404).json({
            success: false,
            error: 'Ürün bulunamadı'
        });
    }

    // Paralel sorgular
    const [similarProducts, categoryStats] = await Promise.all([
        // Aynı kategoride benzer ürünler bul
        Product.find({
            category: product.category,
            isActive: true,
            _id: { $ne: product._id }
        })
        .sort({ currentPrice: 1 })
        .limit(5)
        .select('name currentPrice source brand')
        .lean(),

        // Kategori fiyat istatistikleri
        Product.aggregate([
            { 
                $match: { 
                    category: product.category, 
                    isActive: true 
                } 
            },
            {
                $group: {
                    _id: null,
                    avgPrice: { $avg: '$currentPrice' },
                    minPrice: { $min: '$currentPrice' },
                    maxPrice: { $max: '$currentPrice' },
                    totalProducts: { $sum: 1 }
                }
            }
        ])
    ]);

    const categoryAvg = categoryStats[0]?.avgPrice || product.currentPrice;
    const pricePosition = product.currentPrice > categoryAvg ? 'ortalamanın üstünde' : 'ortalamanın altında';
    const pricePercentile = categoryStats[0] ? 
        ((product.currentPrice - categoryStats[0].minPrice) / 
         (categoryStats[0].maxPrice - categoryStats[0].minPrice)) * 100 : 50;

    res.json({
        success: true,
        product: {
            id: product._id,
            name: product.name,
            category: product.category,
            source: product.source,
            currentPrice: product.currentPrice,
            availability: product.availability,
            scrapedAt: product.scrapedAt
        },
        priceHistory: product.priceHistory || [],
        analysis: {
            categoryAverage: Math.round(categoryAvg),
            pricePosition: pricePosition,
            pricePercentile: Math.round(pricePercentile),
            categoryStats: categoryStats[0] || null,
            similarProducts: similarProducts
        },
        note: "Fiyat geçmişi için yeni scraping gerekli - Şu anda kategori karşılaştırması gösteriliyor"
    });
});

module.exports = {
    getAllProducts,
    getProductsByPriceRange,
    getProductsByBrand,
    getProductPriceHistory
};