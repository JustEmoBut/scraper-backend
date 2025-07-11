require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/database');
const Product = require('../models/Product');
const Category = require('../models/Category');

async function fixCategoryMapping() {
    console.log('🔧 KATEGORİ EŞLEME SORUNU DÜZELTİLİYOR\n');
    
    try {
        await connectDB();
        
        // Önce mevcut durumu kontrol et
        console.log('📊 MEVCUT DURUM KONTROLÜ:');
        
        const totalProducts = await Product.countDocuments({ isActive: true });
        const totalCategories = await Category.countDocuments({ isActive: true });
        
        console.log(`   • Toplam aktif ürün: ${totalProducts}`);
        console.log(`   • Toplam kategori kaydı: ${totalCategories}`);
        
        if (totalProducts === 0) {
            console.log('❌ Hiç aktif ürün yok! Önce scraping yapın.');
            await disconnectDB();
            return;
        }
        
        // Mevcut ürünlerden kategori istatistikleri oluştur
        console.log('\n🔄 KATEGORİ İSTATİSTİKLERİ YENİDEN OLUŞTURULUYOR...');
        
        const productStats = await Product.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: { category: '$category', source: '$source' },
                    count: { $sum: 1 },
                    lastScraped: { $max: '$scrapedAt' }
                }
            }
        ]);
        
        let updatedCategories = 0;
        let createdCategories = 0;
        
        for (const stat of productStats) {
            const { category: categoryKey, source } = stat._id;
            const productCount = stat.count;
            const lastScraped = stat.lastScraped;
            
            // Kategori display name'ini çıkar
            const categoryParts = categoryKey.split('_');
            let displayName = categoryParts.length > 1 ? categoryParts[1] : categoryKey;
            
            // Display name'i düzelt
            const displayNameMap = {
                'islemci': 'İşlemci',
                'ekran-karti': 'Ekran Kartı',
                'anakart': 'Anakart',
                'ram': 'RAM',
                'ssd': 'SSD',
                'guc-kaynagi': 'Güç Kaynağı',
                'bilgisayar-kasasi': 'Bilgisayar Kasası'
            };
            
            displayName = displayNameMap[displayName] || displayName;
            
            // Kategori var mı kontrol et
            const existingCategory = await Category.findOne({ key: categoryKey });
            
            if (existingCategory) {
                // Güncelle
                await Category.findByIdAndUpdate(existingCategory._id, {
                    totalProducts: productCount,
                    lastScrapedAt: lastScraped,
                    isActive: true
                });
                updatedCategories++;
                console.log(`  ✅ Güncellendi: ${categoryKey} (${productCount} ürün)`);
            } else {
                // Yeni oluştur
                await Category.create({
                    key: categoryKey,
                    name: categoryKey,
                    displayName: displayName,
                    source: source,
                    url: `https://example.com/${categoryKey}`, // Placeholder
                    totalProducts: productCount,
                    lastScrapedAt: lastScraped,
                    isActive: true
                });
                createdCategories++;
                console.log(`  ➕ Oluşturuldu: ${categoryKey} (${productCount} ürün)`);
            }
        }
        
        // Artık mevcut olmayan kategorileri deaktive et
        console.log('\n🧹 ESKİ KATEGORİLER TEMİZLENİYOR...');
        
        const activeCategories = productStats.map(stat => stat._id.category);
        const deactivateResult = await Category.updateMany(
            {
                key: { $nin: activeCategories },
                isActive: true
            },
            { isActive: false }
        );
        
        if (deactivateResult.modifiedCount > 0) {
            console.log(`  🗑️  ${deactivateResult.modifiedCount} eski kategori deaktive edildi`);
        }
        
        // Sonuç
        console.log('\n✅ KATEGORİ EŞLEME DÜZELTİLDİ!');
        console.log('📊 Özet:');
        console.log(`   • Güncellenen kategori: ${updatedCategories}`);
        console.log(`   • Oluşturulan kategori: ${createdCategories}`);
        console.log(`   • Deaktive edilen: ${deactivateResult.modifiedCount}`);
        
        // Final durum
        const finalCategoryCount = await Category.countDocuments({ isActive: true });
        console.log(`   • Toplam aktif kategori: ${finalCategoryCount}`);
        
        // Site bazında kontrol
        console.log('\n📋 SİTE BAZINDA SON DURUM:');
        const sites = ['İnceHesap', 'İtopya', 'Sinerji'];
        
        for (const site of sites) {
            const siteCategories = await Category.countDocuments({
                source: site,
                isActive: true
            });
            
            const siteProducts = await Product.countDocuments({
                source: site,
                isActive: true
            });
            
            console.log(`   ${site}: ${siteCategories} kategori, ${siteProducts} ürün`);
        }
        
        console.log('\n💡 ÖNERİLER:');
        console.log('   1. Sonucu kontrol edin: npm run debug:all');
        console.log('   2. Hızlı kontrol: npm run health');
        
        if (finalCategoryCount < 15) {
            console.log('   ⚠️  Kategori sayısı düşük, yeniden scraping gerekebilir');
        }
        
    } catch (error) {
        console.error('❌ Kategori düzeltme hatası:', error.message);
    } finally {
        await disconnectDB();
    }
}

if (require.main === module) {
    fixCategoryMapping().catch(console.error);
}

module.exports = fixCategoryMapping;