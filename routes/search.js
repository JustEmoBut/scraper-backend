const express = require('express');
const router = express.Router();
const { searchInCategory, searchAllCategories } = require('../controllers/searchController');
const { validateSearch } = require('../middleware/validation');

// Routes
router.get('/all', validateSearch, searchAllCategories);
router.get('/:category', validateSearch, searchInCategory);

module.exports = router;