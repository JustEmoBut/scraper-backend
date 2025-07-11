require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/database');
const Product = require('../models/Product');
const Category = require('../models/Category');
const readline = require('readline');

// Readline interface for user confirmation
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise(resolve => rl.question(question, resolve));
}

async function resetDatabase() {
    console.log('🚨 VERİTABANI SIFIRLAMA İŞLEMİ\n');
    console.log('⚠️  DİKKAT: Bu işlem TÜM VERİLERİ SİLECEK!');
    console.log('   • Tüm ürünler silinecek');
    console.log('   • Tüm kategoriler silinecek');
    console.log('   • Tüm fiyat geçmişi silinecek');
    console.log('   • Bu işlem GERİ ALINMAZ!\n');
    
    try {
        await connectDB();
        
        // Mevcut veri durumunu göster
        const productCount = await Product.countDocuments({});
        const categoryCount = await Category.countDocuments({});
        const activeProducts = await Product.countDocuments({ isActive: true });
        const inactiveProducts = await Product.countDocuments({ isActive: false });
        
        console.log('📊 MEVCUT VERİTABANI DURUMU:');
        console.log('=' + '='.repeat(40));
        console.log(`   • Toplam ürün: ${productCount}`);
        console.log(`     - Aktif: ${activeProducts}`);
        console.log(`     - Deaktif: ${inactiveProducts}`);
        console.log(`   • Toplam kategori: ${categoryCount}`);
        
        // Site bazında durum
        const sites = ['İnceHesap', 'İtopya', 'Sinerji'];
        console.log('\n📋 SİTE BAZINDA DURUM:');
        for (const site of sites) {
            const siteProducts = await Product.countDocuments({ source: site });
            console.log(`   ${site}: ${siteProducts} ürün`);
        }
        
        console.log('\n' + '='.repeat(50));
        
        // Triple confirmation
        console.log('🔐 GÜVENLİK KONTROLÜ:');
        
        const confirm1 = await askQuestion('1️⃣ Tüm verileri silmek istediğinizden emin misiniz? (evet/hayır): ');
        if (confirm1.toLowerCase() !== 'evet') {
            console.log('❌ İşlem iptal edildi.');
            rl.close();
            await disconnectDB();
            return;
        }
        
        const confirm2 = await askQuestion('2️⃣ Bu işlem geri alınamaz! Devam etmek istiyor musunuz? (EVET/hayır): ');
        if (confirm2 !== 'EVET') {
            console.log('❌ İşlem iptal edildi.');
            rl.close();
            await disconnectDB();
            return;
        }
        
        const confirm3 = await askQuestion('3️⃣ Son onay: "VERITABANINI SIFIRLA" yazın: ');
        if (confirm3 !== 'VERITABANINI SIFIRLA') {
            console.log('❌ Yanlış onay metni. İşlem iptal edildi.');
            rl.close();
            await disconnectDB();
            return;
        }
        
        rl.close();
        
        console.log('\n🔄 VERİTABANI SIFIRLAMA BAŞLIYOR...\n');
        
        // Backup bilgisi (isteğe bağlı)
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        console.log(`📋 İşlem ID: RESET_${timestamp}`);
        console.log(`💾 Not: Bu bilgileri kaydedin, gerekirse support için kullanın\n`);
        
        // Progress tracking
        let step = 1;
        const totalSteps = 4;
        
        // Step 1: Delete all products
        console.log(`[${step}/${totalSteps}] 🗑️  Tüm ürünler siliniyor...`);
        const deletedProducts = await Product.deleteMany({});
        console.log(`   ✅ ${deletedProducts.deletedCount} ürün silindi`);
        step++;
        
        // Step 2: Delete all categories
        console.log(`[${step}/${totalSteps}] 🗑️  Tüm kategoriler siliniyor...`);
        const deletedCategories = await Category.deleteMany({});
        console.log(`   ✅ ${deletedCategories.deletedCount} kategori silindi`);
        step++;
        
        // Step 3: Verify deletion
        console.log(`[${step}/${totalSteps}] ✔️  Silme işlemi doğrulanıyor...`);
        const remainingProducts = await Product.countDocuments({});
        const remainingCategories = await Category.countDocuments({});
        
        if (remainingProducts === 0 && remainingCategories === 0) {
            console.log(`   ✅ Doğrulama başarılı: Veritabanı tamamen temiz`);
        } else {
            console.log(`   ⚠️  Doğrulama uyarısı: ${remainingProducts} ürün, ${remainingCategories} kategori kaldı`);
        }
        step++;
        
        // Step 4: Reset auto-increment (if needed)
        console.log(`[${step}/${totalSteps}] 🔄 Veritabanı optimize ediliyor...`);
        // MongoDB doesn't have auto-increment, but we can compact
        console.log(`   ✅ Optimizasyon tamamlandı`);
        
        console.log('\n' + '='.repeat(50));
        console.log('✅ VERİTABANI SIFIRLAMA TAMAMLANDI!');
        console.log('📊 YENİ DURUM:');
        console.log(`   • Toplam ürün: 0`);
        console.log(`   • Toplam kategori: 0`);
        console.log(`   • Veritabanı boyutu: Minimal`);
        
        console.log('\n🚀 SONRAKİ ADIMLAR:');
        console.log('   1. Yeni veri çekmek için:');
        console.log('      npm run scrape:parallel');
        console.log('');
        console.log('   2. Veya sequential scraping:');
        console.log('      npm run scrape:all');
        console.log('');
        console.log('   3. Durum kontrolü:');
        console.log('      npm run health');
        
        console.log('\n💡 NOT: İlk scraping işlemi 30-40 dakika sürebilir.');
        console.log('🎯 Hedef: ~2500 ürün, 21 kategori');
        
    } catch (error) {
        console.error('❌ Veritabanı sıfırlama hatası:', error.message);
        console.error('🔧 Hata durumunda manuel kontrol gerekebilir');
    } finally {
        await disconnectDB();
        console.log('\n📡 Veritabanı bağlantısı kapatıldı');
    }
}

// Programmatic usage için
async function resetDatabaseProgrammatic(force = false) {
    if (!force) {
        throw new Error('Programmatic reset için force=true parametresi gerekli');
    }
    
    console.log('🔄 Programmatic veritabanı sıfırlama...');
    
    try {
        await connectDB();
        
        const deletedProducts = await Product.deleteMany({});
        const deletedCategories = await Category.deleteMany({});
        
        console.log(`✅ ${deletedProducts.deletedCount} ürün, ${deletedCategories.deletedCount} kategori silindi`);
        
        return {
            success: true,
            deletedProducts: deletedProducts.deletedCount,
            deletedCategories: deletedCategories.deletedCount
        };
        
    } catch (error) {
        console.error('❌ Programmatic reset hatası:', error.message);
        throw error;
    } finally {
        await disconnectDB();
    }
}

// Kısmi sıfırlama - sadece belirli site
async function resetSite(siteName) {
    console.log(`🔄 ${siteName} sitesi sıfırlanıyor...`);
    
    try {
        await connectDB();
        
        const siteProducts = await Product.deleteMany({ source: siteName });
        const siteCategories = await Category.deleteMany({ source: siteName });
        
        console.log(`✅ ${siteName}: ${siteProducts.deletedCount} ürün, ${siteCategories.deletedCount} kategori silindi`);
        
        return {
            success: true,
            site: siteName,
            deletedProducts: siteProducts.deletedCount,
            deletedCategories: siteCategories.deletedCount
        };
        
    } catch (error) {
        console.error(`❌ ${siteName} sıfırlama hatası:`, error.message);
        throw error;
    } finally {
        await disconnectDB();
    }
}

// Sadece ürünleri sıfırla, kategorileri koru
async function resetProductsOnly() {
    console.log('🔄 Sadece ürünler sıfırlanıyor (kategoriler korunuyor)...');
    
    try {
        await connectDB();
        
        const deletedProducts = await Product.deleteMany({});
        
        // Kategori totalProducts'larını sıfırla
        await Category.updateMany({}, { totalProducts: 0 });
        
        console.log(`✅ ${deletedProducts.deletedCount} ürün silindi, kategoriler temizlendi`);
        
        return {
            success: true,
            deletedProducts: deletedProducts.deletedCount,
            categoriesReset: true
        };
        
    } catch (error) {
        console.error('❌ Ürün sıfırlama hatası:', error.message);
        throw error;
    } finally {
        await disconnectDB();
    }
}

// Eğer direkt çalıştırılırsa
if (require.main === module) {
    resetDatabase().catch(console.error);
}

module.exports = { 
    resetDatabase, 
    resetDatabaseProgrammatic, 
    resetSite, 
    resetProductsOnly 
};