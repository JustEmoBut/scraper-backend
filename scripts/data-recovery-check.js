require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/database');
const Product = require('../models/Product');
const Category = require('../models/Category');

async function checkDataIntegrity() {
    console.log('🔍 VERİ BÜTÜNLÜK KONTROLÜ BAŞLIYOR...\n');
    
    try {
        await connectDB();
        
        // Site bazında kategori durumları
        const sites = ['İnceHesap', 'İtopya', 'Sinerji'];
        const categories = ['islemci', 'ekran-karti', 'anakart', 'ram', 'ssd', 'guc-kaynagi', 'bilgisayar-kasasi'];
        
        let totalIssues = 0;
        let totalProducts = 0;
        
        console.log('📊 SİTE VE KATEGORİ DURUMU:');
        console.log('='[0].repeat(50));
        
        for (const site of sites) {
            console.log(`\n[${site.toUpperCase()}]:`);
            
            let siteTotal = 0;
            let siteIssues = 0;
            
            for (const category of categories) {
                const categoryKey = `${site.toLowerCase().replace('ı', 'i').replace('İ', 'i')}_${category}`;
                
                try {
                    const productCount = await Product.countDocuments({
                        source: site,
                        category: categoryKey,
                        isActive: true
                    });
                    
                    const categoryInfo = await Category.findOne({ key: categoryKey });
                    const lastScraped = categoryInfo?.lastScrapedAt;
                    const daysSinceUpdate = lastScraped ? 
                        Math.floor((new Date() - new Date(lastScraped)) / (1000 * 60 * 60 * 24)) : 'Bilinmiyor';
                    
                    if (productCount === 0) {
                        console.log(`  ❌ ${category}: BOŞ (${daysSinceUpdate} gün önce güncellendi)`);
                        siteIssues++;
                        totalIssues++;
                    } else if (productCount < 10) {
                        console.log(`  ⚠️  ${category}: ${productCount} ürün (DÜŞÜK - ${daysSinceUpdate} gün önce)`);
                        siteIssues++;
                        totalIssues++;
                    } else {
                        console.log(`  ✅ ${category}: ${productCount} ürün (${daysSinceUpdate} gün önce)`);
                    }
                    
                    siteTotal += productCount;
                    totalProducts += productCount;
                    
                } catch (error) {
                    console.log(`  ❌ ${category}: HATA - ${error.message}`);
                    siteIssues++;
                    totalIssues++;
                }
            }
            
            console.log(`  📊 Site toplamı: ${siteTotal} ürün`);
            if (siteIssues > 0) {
                console.log(`  ⚠️  Site sorunları: ${siteIssues} kategori`);
            }
        }
        
        console.log('\n' + '='[0].repeat(50));
        console.log('🎯 GENEL DURUM:');
        console.log(`   • Toplam ürün: ${totalProducts}`);
        console.log(`   • Sorunlu kategori: ${totalIssues}`);
        console.log(`   • Sağlık skoru: ${Math.round((21 - totalIssues) / 21 * 100)}%`);
        
        // En son scraping zamanları
        console.log('\n📅 EN SON SCRAPING ZAMANLARI:');
        console.log('-'[0].repeat(30));
        
        const recentCategories = await Category.find({ isActive: true })
            .sort({ lastScrapedAt: -1 })
            .limit(10)
            .select('key displayName source lastScrapedAt totalProducts');
        
        recentCategories.forEach(cat => {
            const timeDiff = cat.lastScrapedAt ? 
                Math.floor((new Date() - new Date(cat.lastScrapedAt)) / (1000 * 60 * 60)) : 'Bilinmiyor';
            console.log(`  ${cat.source} - ${cat.displayName}: ${timeDiff} saat önce (${cat.totalProducts || 0} ürün)`);
        });
        
        // Öneriler
        console.log('\n💡 ÖNERİLER:');
        console.log('-'[0].repeat(20));
        
        if (totalIssues === 0) {
            console.log('  ✨ Tüm kategoriler sağlıklı görünüyor!');
        } else {
            console.log(`  🔧 ${totalIssues} kategori için tekrar scraping gerekebilir`);
            console.log('  📝 Sorunlu kategoriler için sequential scraper deneyin');
            console.log('  💾 Paralel scraper\'da veri koruması aktif');
        }
        
        if (totalProducts < 2000) {
            console.log('  ⚠️  Toplam ürün sayısı düşük - genel scraping öneriliyor');
        }
        
        console.log('\n🔍 Veri bütünlük kontrolü tamamlandı!');
        
    } catch (error) {
        console.error('❌ Kontrol hatası:', error.message);
    } finally {
        await disconnectDB();
    }
}

// Manual recovery suggestions
async function suggestRecovery() {
    console.log('\n🛠️  KURTARMA ÖNERİLERİ:\n');
    
    console.log('1. PARALEL SCRAPER (Önerilen):');
    console.log('   npm run scrape:parallel');
    console.log('   • Hatalı siteler korunur, başarılı siteler güncellenir');
    console.log('   • Mevcut veriler silinmez');
    console.log('   • 3x daha hızlı\n');
    
    console.log('2. SEQUENTIAL SCRAPER (Güvenli):');
    console.log('   npm run scrape:all');
    console.log('   • Site site sıralı işlem');
    console.log('   • Daha yavaş ama kararlı');
    console.log('   • Her site için ayrı process\n');
    
    console.log('3. TEK KATEGORİ SCRAPING:');
    console.log('   node scraper.js');
    console.log('   • Belirli kategoriyi manuel çalıştır');
    console.log('   • Sorun giderme için ideal\n');
    
    console.log('4. MISSING DATA RECOVERY:');
    console.log('   node scripts/scrape-missing.js');
    console.log('   • Sadece boş kategorileri yeniden scrape eder\n');
}

// Eğer direkt çalıştırılırsa
if (require.main === module) {
    checkDataIntegrity()
        .then(() => suggestRecovery())
        .catch(console.error);
}

module.exports = { checkDataIntegrity, suggestRecovery };