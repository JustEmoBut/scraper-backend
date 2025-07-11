// Request validation middleware
const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation errors',
            details: errors.array()
        });
    }
    next();
};

// Common validations
const validatePagination = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
];

const validateSearch = [
    query('q').notEmpty().isLength({ min: 2 }).withMessage('Search term must be at least 2 characters'),
    ...validatePagination
];

const validatePriceRange = [
    query('min').optional().isFloat({ min: 0 }).withMessage('Minimum price must be a positive number'),
    query('max').optional().isFloat({ min: 0 }).withMessage('Maximum price must be a positive number'),
    ...validatePagination
];

const validateProductId = [
    param('id').isMongoId().withMessage('Invalid product ID'),
    handleValidationErrors
];

const validateBatchProducts = [
    body('categories').isArray({ min: 1 }).withMessage('Categories must be a non-empty array'),
    body('categories.*').isString().withMessage('Each category must be a string'),
    body('sources').optional().isArray().withMessage('Sources must be an array'),
    body('priceRange.min').optional().isFloat({ min: 0 }).withMessage('Minimum price must be positive'),
    body('priceRange.max').optional().isFloat({ min: 0 }).withMessage('Maximum price must be positive'),
    body('limit').optional().isInt({ min: 1, max: 500 }).withMessage('Limit must be between 1 and 500'),
    handleValidationErrors
];

const validateBatchComparison = [
    body('productNames').isArray({ min: 1, max: 10 }).withMessage('Product names must be an array of 1-10 items'),
    body('productNames.*').isString().isLength({ min: 2 }).withMessage('Each product name must be at least 2 characters'),
    body('categories').optional().isArray().withMessage('Categories must be an array'),
    handleValidationErrors
];

module.exports = {
    validatePagination,
    validateSearch,
    validatePriceRange,
    validateProductId,
    validateBatchProducts,
    validateBatchComparison,
    handleValidationErrors
};