// Site yönetimi utilities
const fs = require('fs');
const path = require('path');

class SiteManager {
    constructor() {
        this.sitesDir = path.join(__dirname, 'sites');
    }

    // Yeni site ekleme
    addSite(siteName, siteConfig) {
        const filePath = path.join(this.sitesDir, `${siteName}.js`);
        const content = `// ${siteConfig.info.name} konfigürasyonu
module.exports = ${JSON.stringify(siteConfig, null, 4).replace(/"/g, "'")};`;
        
        fs.writeFileSync(filePath, content);
        console.log(`✅ ${siteName} sitesi eklendi: ${filePath}`);
    }

    // Mevcut siteleri listele
    listSites() {
        const files = fs.readdirSync(this.sitesDir);
        return files
            .filter(file => file.endsWith('.js'))
            .map(file => file.replace('.js', ''));
    }

    // Site bilgilerini getir
    getSiteInfo(siteName) {
        try {
            const site = require(`./sites/${siteName}`);
            return {
                name: siteName,
                info: site.info,
                categoriesCount: Object.keys(site.categories).length,
                categories: Object.keys(site.categories)
            };
        } catch (error) {
            return null;
        }
    }

    // Tüm site bilgilerini getir
    getAllSitesInfo() {
        const sites = this.listSites();
        return sites.map(siteName => this.getSiteInfo(siteName)).filter(Boolean);
    }
}

module.exports = new SiteManager();
