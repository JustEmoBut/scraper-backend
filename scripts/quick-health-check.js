require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/database');
const Product = require('../models/Product');
const Category = require('../models/Category');

async function quickHealthCheck() {
    console.log('⚡ HIZLI SAĞLIK KONTROLÜ\n');
    
    try {
        await connectDB();
        
        const sites = ['İnceHesap', 'İtopya', 'Sinerji'];
        
        console.log('📊 HIZLI DURUM RAPORU:');
        console.log('=' + '='.repeat(30));
        
        // Hızlı site özeti
        for (const site of sites) {
            const activeCount = await Product.countDocuments({
                source: site,
                isActive: true
            });
            
            const inactiveCount = await Product.countDocuments({
                source: site,
                isActive: false
            });
            
            let status = '✅ İYİ';
            const issues = [];
            
            if (activeCount === 0) {
                status = '❌ KRİTİK';
                issues.push('Hiç aktif ürün yok');
            } else if (activeCount < 200) {
                status = '⚠️ DÜŞÜK';
                issues.push('Az ürün var');
            }
            
            if (inactiveCount > activeCount) {
                status = '🔄 SORUN';
                issues.push('Deaktif ürün fazla');
            }
            
            console.log(`${site.padEnd(12)}: ${status} (${activeCount} aktif, ${inactiveCount} deaktif)`);
            if (issues.length > 0) {
                console.log(`${''.padEnd(15)}└─ ${issues.join(', ')}`);
            }
        }
        
        // Toplam durum
        const totalActive = await Product.countDocuments({ isActive: true });
        const totalInactive = await Product.countDocuments({ isActive: false });
        const totalCategories = await Category.countDocuments({ isActive: true });
        
        console.log('\n📈 GENEL DURUM:');
        console.log(`   Toplam aktif ürün: ${totalActive}`);
        console.log(`   Toplam deaktif ürün: ${totalInactive}`);
        console.log(`   Toplam kategori: ${totalCategories}`);
        
        // Hızlı sağlık skoru
        let healthScore = 100;
        if (totalActive < 1000) healthScore -= 30;
        if (totalActive < 2000) healthScore -= 20;
        if (totalInactive > totalActive) healthScore -= 25;
        if (totalCategories < 21) healthScore -= 15;
        
        healthScore = Math.max(0, healthScore);
        
        console.log(`   Sağlık skoru: %${healthScore}`);
        
        // Hızlı öneriler
        console.log('\n💡 HIZLI ÖNERİLER:');
        
        if (healthScore >= 90) {
            console.log('   ✨ Herşey yolunda! Düzenli scraping yapmaya devam edin.');
        } else if (healthScore >= 70) {
            console.log('   🔧 Küçük sorunlar var:');
            if (totalInactive > totalActive) {
                console.log('      → npm run restore:all (deaktif ürünleri aktif yap)');
            }
            console.log('      → npm run scrape:parallel (yeni veri çek)');
        } else if (healthScore >= 50) {
            console.log('   ⚠️  Ciddi sorunlar var:');
            console.log('      → npm run debug:all (detaylı kontrol)');
            console.log('      → npm run restore:all (veri kurtarma)');
            console.log('      → npm run fix:all (duplicate temizle)');
        } else {
            console.log('   🚨 KRİTİK SORUNLAR VAR:');
            console.log('      → npm run debug:all (ne olduğunu anla)');
            console.log('      → npm run restore:all (acil kurtarma)');
            console.log('      → npm run scrape:parallel (yeniden scraping)');
        }
        
        // Son scraping zamanı kontrol
        const lastCategory = await Category.findOne({ isActive: true })
            .sort({ lastScrapedAt: -1 });
        
        if (lastCategory && lastCategory.lastScrapedAt) {
            const hoursSince = Math.floor((new Date() - new Date(lastCategory.lastScrapedAt)) / (1000 * 60 * 60));
            
            console.log(`\n⏰ EN SON SCRAPING: ${hoursSince} saat önce`);
            
            if (hoursSince > 24) {
                console.log('   ⚠️  24 saatten eski! Yeni scraping öneriliyor.');
            } else if (hoursSince > 6) {
                console.log('   💡 6 saatten eski, yeni scraping düşünülebilir.');
            } else {
                console.log('   ✅ Güncel veriler mevcut.');
            }
        }
        
        console.log('\n⚡ Hızlı kontrol tamamlandı!');
        console.log('📋 Detaylı kontrol için: npm run debug:all');
        
    } catch (error) {
        console.error('❌ Hızlı kontrol hatası:', error.message);
    } finally {
        await disconnectDB();
    }
}

// Eğer direkt çalıştırılırsa
if (require.main === module) {
    quickHealthCheck().catch(console.error);
}

module.exports = quickHealthCheck;