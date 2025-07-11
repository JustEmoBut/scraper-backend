require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/database');
const Product = require('../models/Product');
const Category = require('../models/Category');

async function debugCategoryMapping() {
    console.log('🔍 KATEGORİ EŞLEME SORUNU TESPİTİ\n');
    
    try {
        await connectDB();
        
        // Mevcut tüm ürünleri source ve category ile grupla
        console.log('📊 VERİTABANINDAKİ GERÇEK VERİLER:');
        console.log('=' + '='.repeat(50));
        
        const actualProducts = await Product.aggregate([
            { $match: { isActive: true } },
            { 
                $group: {
                    _id: { source: '$source', category: '$category' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.source': 1, '_id.category': 1 } }
        ]);
        
        if (actualProducts.length === 0) {
            console.log('❌ Veritabanında hiç aktif ürün yok!');
            await disconnectDB();
            return;
        }
        
        // Source bazında grupla
        const sourceGroups = {};
        actualProducts.forEach(item => {
            const source = item._id.source;
            if (!sourceGroups[source]) {
                sourceGroups[source] = [];
            }
            sourceGroups[source].push({
                category: item._id.category,
                count: item.count
            });
        });
        
        // Gerçek verileri göster
        Object.entries(sourceGroups).forEach(([source, categories]) => {
            console.log(`\n[${source.toUpperCase()}] - ${categories.length} kategori:`);
            categories.forEach(cat => {
                console.log(`  ✅ ${cat.category}: ${cat.count} ürün`);
            });
            
            const total = categories.reduce((sum, cat) => sum + cat.count, 0);
            console.log(`  📊 Toplam: ${total} ürün`);
        });
        
        // Debug script'inin aradığı kategori formatları
        console.log('\n🔍 DEBUG SCRİPTİNİN ARADIĞI FORMATLAR:');
        console.log('=' + '='.repeat(50));
        
        const sites = ['İnceHesap', 'İtopya', 'Sinerji'];
        const categories = ['islemci', 'ekran-karti', 'anakart', 'ram', 'ssd', 'guc-kaynagi', 'bilgisayar-kasasi'];
        
        for (const site of sites) {
            console.log(`\n[${site}] - Aranan formatlar:`);
            
            for (const category of categories) {
                const categoryKey = `${site.toLowerCase().replace('ı', 'i').replace('İ', 'i')}_${category}`;
                
                // Bu kategori key ile ürün var mı?
                const foundProducts = await Product.countDocuments({
                    source: site,
                    category: categoryKey,
                    isActive: true
                });
                
                if (foundProducts > 0) {
                    console.log(`  ✅ ${categoryKey}: ${foundProducts} ürün`);
                } else {
                    // Alternatif formatları kontrol et
                    const altFormats = [
                        `${site.toLowerCase()}_${category}`,
                        `${site}_${category}`,
                        category,
                        `${site.toLowerCase().replace('ı', 'i')}_${category}`
                    ];
                    
                    let found = false;
                    for (const altFormat of altFormats) {
                        const altCount = await Product.countDocuments({
                            source: site,
                            category: altFormat,
                            isActive: true
                        });
                        
                        if (altCount > 0) {
                            console.log(`  🔄 ${categoryKey} → BULUNAN: ${altFormat} (${altCount} ürün)`);
                            found = true;
                            break;
                        }
                    }
                    
                    if (!found) {
                        console.log(`  ❌ ${categoryKey}: BULUNAMADI`);
                    }
                }
            }
        }
        
        // Tüm benzersiz kategori keylerini listele
        console.log('\n📋 VERİTABANINDAKİ TÜM KATEGORİ KEYLERİ:');
        console.log('-'.repeat(60));
        
        const allCategoryKeys = await Product.distinct('category', { isActive: true });
        allCategoryKeys.sort().forEach(key => {
            console.log(`  ${key}`);
        });
        
        // Source isimleri kontrol
        console.log('\n🏷️  VERİTABANINDAKİ SOURCE İSİMLERİ:');
        console.log('-'.repeat(40));
        
        const allSources = await Product.distinct('source', { isActive: true });
        allSources.forEach(source => {
            console.log(`  "${source}"`);
        });
        
        // Kategori tablosu kontrol
        console.log('\n📊 KATEGORİ TABLOSU DURUMU:');
        console.log('-'.repeat(40));
        
        const categoryRecords = await Category.find({ isActive: true });
        if (categoryRecords.length === 0) {
            console.log('❌ Category tablosunda hiç kayıt yok!');
        } else {
            categoryRecords.forEach(cat => {
                console.log(`  ${cat.source} - ${cat.key}: ${cat.totalProducts || 0} ürün`);
            });
        }
        
        // Çözüm önerileri
        console.log('\n💡 SORUN TESPİTİ VE ÇÖZÜMLERİ:');
        console.log('=' + '='.repeat(40));
        
        if (actualProducts.length > 0 && categoryRecords.length === 0) {
            console.log('🚨 SORUN: Ürünler var ama Category tablosu boş!');
            console.log('🔧 ÇÖZÜM: npm run scrape:parallel (kategori tablosunu doldurur)');
        }
        
        // Format uyumsuzluğu kontrol
        const expectedFormats = [];
        const actualFormats = [];
        
        sites.forEach(site => {
            categories.forEach(category => {
                expectedFormats.push(`${site.toLowerCase().replace('ı', 'i').replace('İ', 'i')}_${category}`);
            });
        });
        
        allCategoryKeys.forEach(key => {
            if (!expectedFormats.includes(key)) {
                actualFormats.push(key);
            }
        });
        
        if (actualFormats.length > 0) {
            console.log('\n🔄 FORMAT UYUMSUZLUKLARI:');
            actualFormats.forEach(format => {
                console.log(`  Veritabanında: ${format}`);
                
                // Hangi expected format'a benzediğini bul
                const match = expectedFormats.find(expected => 
                    format.includes(expected.split('_')[1]) || 
                    expected.includes(format.split('_')[1])
                );
                
                if (match) {
                    console.log(`    → Olması gereken: ${match}`);
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Debug hatası:', error.message);
    } finally {
        await disconnectDB();
    }
}

if (require.main === module) {
    debugCategoryMapping().catch(console.error);
}

module.exports = debugCategoryMapping;