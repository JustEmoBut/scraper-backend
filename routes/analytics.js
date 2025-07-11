const express = require('express');
const router = express.Router();
const Product = require('../models/Product');


// Analytics endpoints - Adapted for existing data structure
router.get('/price-trends', async (req, res) => {
    try {
        const { category, source } = req.query;
        
        const filter = { isActive: true };
        if (category) filter.category = category;
        if (source) filter.source = source;
        
        // Kategori bazında fiyat analizi
        const priceAnalysis = await Product.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: { category: '$category', source: '$source' },
                    avgPrice: { $avg: '$currentPrice' },
                    minPrice: { $min: '$currentPrice' },
                    maxPrice: { $max: '$currentPrice' },
                    productCount: { $sum: 1 },
                    products: { 
                        $push: {
                            name: '$name',
                            currentPrice: '$currentPrice',
                            brand: '$brand',
                            availability: '$availability'
                        }
                    }
                }
            },
            { $sort: { avgPrice: -1 } }
        ]);
        
        // Site karşılaştırması
        const siteComparison = await Product.aggregate([
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
        ]);
        
        res.json({
            success: true,
            analysis: {
                priceByCategory: priceAnalysis,
                siteComparison: siteComparison,
                totalAnalyzed: priceAnalysis.reduce((sum, item) => sum + item.productCount, 0)
            },
            note: "Mevcut fiyat verileri analizi - Fiyat değişim trendi için yeni scraping gerekli"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


module.exports = router;