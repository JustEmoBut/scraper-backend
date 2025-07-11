const express = require('express');
const router = express.Router();
const { 
    getAllProducts, 
    getProductsByPriceRange, 
    getProductsByBrand
} = require('../controllers/productController');
const { validatePagination, validatePriceRange } = require('../middleware/validation');

// Routes
router.get('/', validatePagination, getAllProducts);
router.get('/price-range', validatePriceRange, getProductsByPriceRange);
router.get('/brand/:brand', validatePagination, getProductsByBrand);

module.exports = router;