require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/database');
const Product = require('../models/Product');
const Category = require('../models/Category');

async function restoreAllData() {
    console.log('🔧 TÜM SİTELER VERİ KURTARMA İŞLEMİ BAŞLIYOR\n');
    
    try {
        await connectDB();
        
        const sites = ['İnceHesap', 'İtopya', 'Sinerji'];
        let totalRestored = 0;
        let siteResults = {};
        
        console.log('📊 MEVCUT DURUM VE KURTARMA İŞLEMİ:');
        console.log('=' + '='.repeat(50));
        
        for (const site of sites) {
            console.log(`\n[${site.toUpperCase()}] İşleniyor...`);
            
            // Mevcut durum
            const activeCount = await Product.countDocuments({
                source: site,
                isActive: true
            });
            
            const inactiveCount = await Product.countDocuments({
                source: site,
                isActive: false
            });
            
            console.log(`  📊 Mevcut: ${activeCount} aktif, ${inactiveCount} deaktif`);
            
            if (inactiveCount === 0) {
                console.log(`  ✅ ${site} için deaktif ürün yok, atlaniyor`);
                siteResults[site] = {
                    beforeActive: activeCount,
                    beforeInactive: inactiveCount,
                    restored: 0,
                    afterActive: activeCount,
                    afterInactive: inactiveCount
                };
                continue;
            }
            
            // Deaktif ürünleri aktif yap
            console.log(`  🔄 ${inactiveCount} deaktif ürün aktif yapılıyor...`);
            
            const restoreResult = await Product.updateMany(
                {
                    source: site,
                    isActive: false
                },
                {
                    isActive: true,
                    scrapedAt: new Date() // Güncel tarih ver
                }
            );
            
            const restored = restoreResult.modifiedCount;
            totalRestored += restored;
            
            // Yeni durum
            const newActiveCount = await Product.countDocuments({
                source: site,
                isActive: true
            });
            
            const newInactiveCount = await Product.countDocuments({
                source: site,
                isActive: false
            });
            
            console.log(`  ✅ ${restored} ürün restore edildi`);
            console.log(`  📊 Yeni durum: ${newActiveCount} aktif, ${newInactiveCount} deaktif`);
            
            siteResults[site] = {
                beforeActive: activeCount,
                beforeInactive: inactiveCount,
                restored: restored,
                afterActive: newActiveCount,
                afterInactive: newInactiveCount
            };
        }
        
        // Kategori istatistiklerini güncelle
        console.log('\n📊 KATEGORİ İSTATİSTİKLERİNİ GÜNCELLİYOR...');
        
        const allCategories = await Category.find({ isActive: true });
        let updatedCategories = 0;
        
        for (const category of allCategories) {
            const newActiveCount = await Product.countDocuments({
                category: category.key,
                source: category.source,
                isActive: true
            });
            
            if (newActiveCount !== category.totalProducts) {
                await Category.findByIdAndUpdate(category._id, {
                    totalProducts: newActiveCount,
                    lastScrapedAt: new Date()
                });
                updatedCategories++;
            }
        }
        
        console.log(`✅ ${updatedCategories} kategori istatistiği güncellendi`);
        
        // Özet rapor
        console.log('\n' + '='.repeat(50));
        console.log('🎯 GENEL KURTARMA RAPORU:');
        
        sites.forEach(site => {
            const result = siteResults[site];
            console.log(`\n[${site}]:`);
            console.log(`  Önceki: ${result.beforeActive} aktif, ${result.beforeInactive} deaktif`);
            console.log(`  Restore: ${result.restored} ürün`);
            console.log(`  Sonraki: ${result.afterActive} aktif, ${result.afterInactive} deaktif`);
            
            if (result.restored > 0) {
                const improvement = Math.round((result.afterActive - result.beforeActive) / result.beforeActive * 100);
                console.log(`  📈 İyileştirme: +%${improvement}`);
            }
        });
        
        console.log(`\n📊 TOPLAM ÖZET:`);
        console.log(`   • Toplam restore edilen: ${totalRestored} ürün`);
        console.log(`   • Güncellenen kategori: ${updatedCategories}`);
        
        // Final durum kontrol
        const finalStats = {};
        let grandTotalActive = 0;
        
        for (const site of sites) {
            const finalActive = await Product.countDocuments({
                source: site,
                isActive: true
            });
            finalStats[site] = finalActive;
            grandTotalActive += finalActive;
        }
        
        console.log(`   • Toplam aktif ürün: ${grandTotalActive}`);
        
        // Başarı değerlendirmesi
        console.log('\n🎉 KURTARMA SONUCU:');
        
        if (totalRestored === 0) {
            console.log('✨ Tüm veriler zaten sağlıklıydı, kurtarma gerekmedi!');
        } else if (grandTotalActive > 2000) {
            console.log('🎉 TÜM SİTE VERİLERİ BAŞARIYLA KURTARILDI!');
            console.log('💡 Artık frontend\'de tüm ürünler görünecek');
        } else {
            console.log('⚠️  Kurtarma tamamlandı ama ürün sayısı hala düşük');
            console.log('💡 Yeniden scraping öneriliyor: npm run scrape:parallel');
        }
        
        // Site bazında öneriler
        const siteRecommendations = [];
        Object.entries(finalStats).forEach(([site, count]) => {
            if (count < 500) {
                siteRecommendations.push(`${site}: ${count} ürün (düşük)`);
            }
        });
        
        if (siteRecommendations.length > 0) {
            console.log('\n💡 SİTE BAZINDA ÖNERİLER:');
            siteRecommendations.forEach(rec => console.log(`   • ${rec}`));
            console.log('   → Çözüm: npm run scrape:parallel');
        }
        
    } catch (error) {
        console.error('❌ Genel kurtarma hatası:', error.message);
    } finally {
        await disconnectDB();
    }
}

// Eğer direkt çalıştırılırsa
if (require.main === module) {
    restoreAllData().catch(console.error);
}

module.exports = restoreAllData;