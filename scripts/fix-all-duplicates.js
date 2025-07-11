require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/database');
const Product = require('../models/Product');
const Category = require('../models/Category');

async function fixAllDuplicates() {
    console.log('🔧 TÜM SİTELER DUPLICATE ÜRÜN SORUNU DÜZELTİLİYOR\n');
    
    try {
        await connectDB();
        
        const sites = ['İnceHesap', 'İtopya', 'Sinerji'];
        let grandTotalDuplicates = 0;
        let grandTotalFixed = 0;
        let siteResults = {};
        
        console.log('🔍 TÜM SİTELERDE DUPLICATE KONTROLÜ:');
        console.log('=' + '='.repeat(60));
        
        for (const site of sites) {
            console.log(`\n[${site.toUpperCase()}] kontrol ediliyor...`);
            
            // Bu site için tüm kategorileri al
            const siteCategories = await Category.find({ 
                source: site,
                key: { $regex: new RegExp(`^${site.toLowerCase().replace('ı', 'i').replace('İ', 'i')}_`) }
            });
            
            let siteDuplicates = 0;
            let siteFixed = 0;
            let categoryResults = [];
            
            for (const category of siteCategories) {
                console.log(`  [${category.displayName}] kontrol ediliyor...`);
                
                // Bu kategorideki tüm ürünleri al
                const products = await Product.find({
                    category: category.key,
                    source: site
                }).sort({ scrapedAt: 1 }); // En eski önce
                
                if (products.length === 0) {
                    console.log(`    📊 Ürün yok, atlanıyor`);
                    continue;
                }
                
                console.log(`    📊 Toplam ürün: ${products.length}`);
                
                // Aynı isme sahip ürünleri grupla
                const nameGroups = {};
                products.forEach(product => {
                    const key = product.name.trim().toLowerCase();
                    if (!nameGroups[key]) {
                        nameGroups[key] = [];
                    }
                    nameGroups[key].push(product);
                });
                
                // Duplicate ürünleri bul
                const duplicateNames = Object.keys(nameGroups).filter(name => nameGroups[name].length > 1);
                
                if (duplicateNames.length === 0) {
                    console.log(`    ✅ Duplicate ürün yok`);
                    categoryResults.push({
                        category: category.displayName,
                        total: products.length,
                        duplicates: 0,
                        fixed: 0
                    });
                    continue;
                }
                
                console.log(`    ⚠️  ${duplicateNames.length} farklı ürün adında duplicate var`);
                
                let categoryDuplicates = 0;
                let categoryFixed = 0;
                
                for (const duplicateName of duplicateNames) {
                    const duplicates = nameGroups[duplicateName];
                    
                    // En güncel olanı koru, diğerlerini sil
                    const toKeep = duplicates[duplicates.length - 1]; // En son eklenen
                    const toDelete = duplicates.slice(0, -1); // Diğerleri
                    
                    console.log(`      "${duplicates[0].name.substring(0, 40)}...": ${duplicates.length} adet → 1 adet`);
                    
                    // Silme işlemi
                    for (const productToDelete of toDelete) {
                        await Product.findByIdAndDelete(productToDelete._id);
                        categoryFixed++;
                        siteFixed++;
                        grandTotalFixed++;
                    }
                    
                    categoryDuplicates += duplicates.length - 1;
                }
                
                siteDuplicates += categoryDuplicates;
                
                // Bu kategori için yeni aktif ürün sayısını hesapla
                const newActiveCount = await Product.countDocuments({
                    category: category.key,
                    source: site,
                    isActive: true
                });
                
                // Kategori totalProducts'ını güncelle
                await Category.findByIdAndUpdate(category._id, {
                    totalProducts: newActiveCount
                });
                
                console.log(`    ✅ Temizlik sonrası: ${newActiveCount} ürün (${categoryFixed} duplicate silindi)`);
                
                categoryResults.push({
                    category: category.displayName,
                    total: products.length,
                    duplicates: categoryDuplicates,
                    fixed: categoryFixed,
                    remaining: newActiveCount
                });
            }
            
            grandTotalDuplicates += siteDuplicates;
            
            // Site özeti
            const finalSiteCount = await Product.countDocuments({
                source: site,
                isActive: true
            });
            
            console.log(`  📊 ${site} özeti: ${siteDuplicates} duplicate bulundu, ${siteFixed} ürün silindi`);
            console.log(`  ✅ Kalan toplam ürün: ${finalSiteCount}`);
            
            siteResults[site] = {
                duplicatesFound: siteDuplicates,
                productsFixed: siteFixed,
                finalCount: finalSiteCount,
                categories: categoryResults
            };
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('🎯 GENEL DUPLICATE TEMİZLİK SONUCU:');
        
        // Site bazında özet
        sites.forEach(site => {
            const result = siteResults[site];
            console.log(`\n[${site}]:`);
            console.log(`  Bulunan duplicate: ${result.duplicatesFound}`);
            console.log(`  Silinen ürün: ${result.productsFixed}`);
            console.log(`  Kalan ürün: ${result.finalCount}`);
        });
        
        console.log(`\n📊 TOPLAM ÖZET:`);
        console.log(`   • Toplam duplicate: ${grandTotalDuplicates}`);
        console.log(`   • Toplam silinen: ${grandTotalFixed}`);
        
        // Final durum kontrol
        const finalGrandTotal = await Product.countDocuments({
            isActive: true
        });
        
        console.log(`   • Kalan toplam ürün: ${finalGrandTotal}`);
        
        // Detaylı kategori raporu
        if (grandTotalFixed > 0) {
            console.log('\n📋 DETAYLI KATEGORİ RAPORU:');
            console.log('-'.repeat(60));
            
            sites.forEach(site => {
                const result = siteResults[site];
                if (result.productsFixed > 0) {
                    console.log(`\n${site}:`);
                    result.categories.forEach(cat => {
                        if (cat.fixed > 0) {
                            console.log(`  ${cat.category}: ${cat.duplicates} duplicate → ${cat.fixed} silindi → ${cat.remaining} kaldı`);
                        }
                    });
                }
            });
        }
        
        // Başarı değerlendirmesi
        console.log('\n🎉 DUPLICATE TEMİZLİK SONUCU:');
        
        if (grandTotalFixed === 0) {
            console.log('✨ Hiçbir sitede duplicate ürün bulunamadı!');
            console.log('💡 Tüm veriler temiz durumda');
        } else {
            console.log('🎉 TÜM SİTELER TEMİZLENDİ!');
            console.log(`💡 ${grandTotalFixed} duplicate ürün kaldırıldı`);
            
            if (finalGrandTotal > 2000) {
                console.log('✅ Artık frontend\'de temiz ve doğru sayıda ürün görünecek');
            } else {
                console.log('⚠️  Toplam ürün sayısı hala düşük, yeniden scraping öneriliyor');
            }
        }
        
        // Site bazında öneriler
        const lowCountSites = [];
        Object.entries(siteResults).forEach(([site, result]) => {
            if (result.finalCount < 500) {
                lowCountSites.push(`${site}: ${result.finalCount} ürün`);
            }
        });
        
        if (lowCountSites.length > 0) {
            console.log('\n💡 DÜŞÜK ÜRÜN SAYILI SİTELER:');
            lowCountSites.forEach(site => console.log(`   • ${site}`));
            console.log('   → Önerilen çözüm: npm run scrape:parallel');
        }
        
        // Data integrity kontrol önerisi
        console.log('\n🔍 SON KONTROL ÖNERİSİ:');
        console.log('   npm run debug:all    # Genel durumu kontrol et');
        console.log('   npm run check:data   # Veri bütünlüğünü kontrol et');
        
    } catch (error) {
        console.error('❌ Genel duplicate temizlik hatası:', error.message);
    } finally {
        await disconnectDB();
    }
}

// Eğer direkt çalıştırılırsa
if (require.main === module) {
    fixAllDuplicates().catch(console.error);
}

module.exports = fixAllDuplicates;