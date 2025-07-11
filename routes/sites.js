const express = require('express');
const router = express.Router();
const siteManager = require('../config/site-manager');

// Site yönetimi endpoint'leri
router.get('/', (req, res) => {
    try {
        const sites = siteManager.getAllSitesInfo();
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
router.get('/:siteName', (req, res) => {
    try {
        const { siteName } = req.params;
        const siteInfo = siteManager.getSiteInfo(siteName);
        
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

module.exports = router;