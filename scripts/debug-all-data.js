require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/database');
const Product = require('../models/Product');
const Category = require('../models/Category');

async function debugAllData() {
    console.log('🔍 TÜM SİTELER VERİ DURUMU KONTROLÜ\n');
    
    try {
        await connectDB();
        
        // Tüm siteler ve kategoriler
        const sites = ['İnceHesap', 'İtopya', 'Sinerji'];
        const categories = ['islemci', 'ekran-karti', 'anakart', 'ram', 'ssd', 'guc-kaynagi', 'bilgisayar-kasasi'];
        
        let grandTotalActive = 0;
        let grandTotalInactive = 0;
        let grandTotalIssues = 0;
        let siteStats = {};
        
        console.log('📊 TÜM SİTELER VE KATEGORİ DURUMU:');
        console.log('=' + '='.repeat(60));
        
        for (const site of sites) {
            console.log(`\n[${site.toUpperCase()}]:`);
            
            let siteActiveTotal = 0;
            let siteInactiveTotal = 0;
            let siteIssues = 0;
            let categoryDetails = [];
            
            for (const category of categories) {
                const categoryKey = `${site.toLowerCase().replace('ı', 'i').replace('İ', 'i').replace('i̇', 'i')}_${category}`;
                
                try {
                    const activeCount = await Product.countDocuments({
                        source: site,
                        category: categoryKey,
                        isActive: true
                    });
                    
                    const inactiveCount = await Product.countDocuments({
                        source: site,
                        category: categoryKey,
                        isActive: false
                    });
                    
                    const totalCount = activeCount + inactiveCount;
                    
                    const categoryInfo = await Category.findOne({ key: categoryKey });
                    const lastScraped = categoryInfo?.lastScrapedAt;
                    const daysSinceUpdate = lastScraped ? 
                        Math.floor((new Date() - new Date(lastScraped)) / (1000 * 60 * 60 * 24)) : 'Bilinmiyor';
                    
                    let status = '✅';
                    let issue = false;
                    
                    if (activeCount === 0) {
                        status = '❌ BOŞ';
                        issue = true;
                    } else if (activeCount < 10) {
                        status = '⚠️ DÜŞÜK';
                        issue = true;
                    } else if (inactiveCount > activeCount * 2) {
                        status = '🔄 DEAKTIF_FAZLA';
                        issue = true;
                    }
                    
                    if (issue) {
                        siteIssues++;
                        grandTotalIssues++;
                    }
                    
                    console.log(`  ${status} ${category}: ${activeCount} aktif, ${inactiveCount} deaktif (${daysSinceUpdate} gün önce)`);
                    
                    categoryDetails.push({
                        category,
                        categoryKey,
                        activeCount,
                        inactiveCount,
                        totalCount,
                        daysSinceUpdate,
                        issue
                    });
                    
                    siteActiveTotal += activeCount;
                    siteInactiveTotal += inactiveCount;
                    
                } catch (error) {
                    console.log(`  ❌ ${category}: HATA - ${error.message}`);
                    siteIssues++;
                    grandTotalIssues++;
                }
            }
            
            grandTotalActive += siteActiveTotal;
            grandTotalInactive += siteInactiveTotal;
            
            // Site özeti
            const siteTotal = siteActiveTotal + siteInactiveTotal;
            const siteHealth = siteIssues === 0 ? 100 : Math.round((7 - siteIssues) / 7 * 100);
            
            console.log(`  📊 Site toplamı: ${siteActiveTotal} aktif, ${siteInactiveTotal} deaktif (${siteTotal} toplam)`);
            if (siteIssues > 0) {
                console.log(`  ⚠️  Site sorunları: ${siteIssues} kategori`);
            }
            console.log(`  💚 Sağlık skoru: %${siteHealth}`);
            
            siteStats[site] = {
                activeCount: siteActiveTotal,
                inactiveCount: siteInactiveTotal,
                totalCount: siteTotal,
                issues: siteIssues,
                health: siteHealth,
                categories: categoryDetails
            };
        }
        
        // Genel durum raporu
        console.log('\n' + '='.repeat(60));
        console.log('🎯 GENEL DURUM RAPORU:');
        console.log(`   • Toplam aktif ürün: ${grandTotalActive}`);
        console.log(`   • Toplam deaktif ürün: ${grandTotalInactive}`);
        console.log(`   • Toplam sorunlu kategori: ${grandTotalIssues}`);
        console.log(`   • Genel sağlık skoru: %${Math.round((21 - grandTotalIssues) / 21 * 100)}`);
        
        // Site karşılaştırması
        console.log('\n📈 SİTE KARŞILAŞTIRMASI:');
        console.log('-'.repeat(50));
        sites.forEach(site => {
            const stats = siteStats[site];
            console.log(`${site.padEnd(12)} : ${stats.activeCount.toString().padStart(4)} aktif | %${stats.health.toString().padStart(3)} sağlık`);
        });
        
        // Kritik sorunlar
        const criticalIssues = [];
        Object.entries(siteStats).forEach(([site, stats]) => {
            if (stats.health < 70) {
                criticalIssues.push(`${site}: %${stats.health} sağlık`);
            }
            if (stats.activeCount < 200) {
                criticalIssues.push(`${site}: ${stats.activeCount} aktif ürün (düşük)`);
            }
            if (stats.inactiveCount > stats.activeCount) {
                criticalIssues.push(`${site}: Deaktif ürün fazla (${stats.inactiveCount}>${stats.activeCount})`);
            }
        });
        
        if (criticalIssues.length > 0) {
            console.log('\n🚨 KRİTİK SORUNLAR:');
            criticalIssues.forEach(issue => console.log(`   • ${issue}`));
        }
        
        // En son scraping zamanları
        console.log('\n📅 EN SON SCRAPING ZAMANLARI (Site bazında):');
        console.log('-'.repeat(40));
        
        for (const site of sites) {
            const siteCategories = await Category.find({ 
                source: site,
                isActive: true 
            }).sort({ lastScrapedAt: -1 }).limit(1);
            
            if (siteCategories.length > 0) {
                const lastCategory = siteCategories[0];
                const timeDiff = lastCategory.lastScrapedAt ? 
                    Math.floor((new Date() - new Date(lastCategory.lastScrapedAt)) / (1000 * 60 * 60)) : 'Bilinmiyor';
                console.log(`  ${site}: ${timeDiff} saat önce`);
            }
        }
        
        // Detaylı sorunlu kategoriler
        const problemCategories = [];
        Object.entries(siteStats).forEach(([site, stats]) => {
            stats.categories.forEach(cat => {
                if (cat.issue) {
                    problemCategories.push({
                        site,
                        category: cat.category,
                        categoryKey: cat.categoryKey,
                        activeCount: cat.activeCount,
                        inactiveCount: cat.inactiveCount,
                        daysSinceUpdate: cat.daysSinceUpdate
                    });
                }
            });
        });
        
        if (problemCategories.length > 0) {
            console.log('\n🔧 SORUNLU KATEGORİLER DETAYİ:');
            console.log('-'.repeat(60));
            problemCategories.forEach(cat => {
                console.log(`  ${cat.site} - ${cat.category}: ${cat.activeCount} aktif, ${cat.inactiveCount} deaktif (${cat.daysSinceUpdate} gün önce)`);
            });
        }
        
        // Çözüm önerileri
        console.log('\n💡 ÇÖZÜM ÖNERİLERİ:');
        console.log('-'.repeat(30));
        
        if (grandTotalIssues === 0) {
            console.log('  ✨ Tüm siteler sağlıklı görünüyor!');
        } else {
            console.log('  🔧 Sorunlu kategoriler için:');
            console.log('     npm run restore:all     # Tüm deaktif ürünleri aktif yap');
            console.log('     npm run fix:all         # Tüm duplicate\'leri temizle');
            console.log('     npm run scrape:parallel # Yeni veri çek');
        }
        
        if (grandTotalActive < 2000) {
            console.log('  ⚠️  Toplam ürün sayısı düşük:');
            console.log('     npm run scrape:parallel # Genel scraping');
        }
        
        const oldSites = sites.filter(site => {
            const stats = siteStats[site];
            return stats.categories.some(cat => 
                cat.daysSinceUpdate !== 'Bilinmiyor' && cat.daysSinceUpdate > 1
            );
        });
        
        if (oldSites.length > 0) {
            console.log(`  📅 Eski verili siteler (${oldSites.join(', ')}):`)
            console.log('     npm run scrape:parallel # Güncel veri çek');
        }
        
        console.log('\n🔍 Tüm siteler veri kontrolü tamamlandı!');
        
    } catch (error) {
        console.error('❌ Genel kontrol hatası:', error.message);
    } finally {
        await disconnectDB();
    }
}

// Eğer direkt çalıştırılırsa
if (require.main === module) {
    debugAllData().catch(console.error);
}

module.exports = debugAllData;