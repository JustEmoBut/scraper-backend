const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    getAllSpecifications,
    getSpecificationById,
    createSpecification,
    updateSpecification,
    deleteSpecification,
    getSpecificationTemplates,
    matchProductWithSpecification,
    findSpecificationsByProduct,
    searchSpecifications,
    getUnmatchedProducts,
    getSpecificationCoverage,
    rematchSpecifications,
    rematchAllSpecifications
} = require('../controllers/specificationController');

// Public routes - herkes erişebilir
router.get('/', getAllSpecifications);
router.get('/search', searchSpecifications);
router.get('/unmatched', getUnmatchedProducts);
router.get('/coverage', getSpecificationCoverage);
router.get('/templates', getSpecificationTemplates);
router.get('/templates/:category', getSpecificationTemplates);
router.get('/product/:productId', findSpecificationsByProduct);
router.get('/:id', getSpecificationById);

// Protected routes - sadece admin erişebilir
router.post('/', authenticateToken, createSpecification);
router.put('/:id', authenticateToken, updateSpecification);
router.delete('/:id', authenticateToken, deleteSpecification);
router.post('/match/:productId', authenticateToken, matchProductWithSpecification);
router.post('/rematch/:specificationId', authenticateToken, rematchSpecifications);
router.post('/rematch-all', authenticateToken, rematchAllSpecifications);

module.exports = router;