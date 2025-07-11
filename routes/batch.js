const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');

// Batch ürün verisi çekme (birden fazla kategori)
router.post('/products', async (req, res) => {
    try {
        const { categories, sources, priceRange, limit = 100 } = req.body;
        
        if (!categories || !Array.isArray(categories)) {
            return res.status(400).json({
                success: false,
                error: 'categories array gerekli'
            });
        }

        const filter = { isActive: true };
        
        // Çoklu kategori filtresi
        if (categories.length > 0) {
            filter.category = { $in: categories };
        }
        
        // Çoklu kaynak filtresi
        if (sources && Array.isArray(sources) && sources.length > 0) {
            filter.source = { $in: sources };
        }
        
        // Fiyat aralığı filtresi
        if (priceRange && (priceRange.min || priceRange.max)) {
            filter.currentPrice = {};
            if (priceRange.min) filter.currentPrice.$gte = parseFloat(priceRange.min);
            if (priceRange.max) filter.currentPrice.$lte = parseFloat(priceRange.max);
        }

        // Paralel sorgular
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



module.exports = router;