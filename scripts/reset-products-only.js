require('dotenv').config();
const { resetProductsOnly } = require('./reset-database');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise(resolve => rl.question(question, resolve));
}

async function resetOnlyProducts() {
    console.log('📦 SADECE ÜRÜNLER SIFIRLAMA\n');
    console.log('ℹ️  Bu işlem:');
    console.log('   ✅ Tüm ürünleri siler');
    console.log('   ✅ Kategorileri korur (yapıları bozulmaz)');
    console.log('   ✅ Site konfigürasyonları korunur');
    console.log('   ✅ Scraper ayarları etkilenmez\n');
    
    console.log('💡 Bu seçenek şu durumlarda kullanışlıdır:');
    console.log('   • Sadece ürün verilerini temizlemek');
    console.log('   • Kategori yapısını korumak');
    console.log('   • Hızlı yeniden scraping için hazırlık\n');
    
    const confirm = await askQuestion('Devam etmek istiyor musunuz? (evet/hayır): ');
    
    if (confirm.toLowerCase() !== 'evet') {
        console.log('❌ İşlem iptal edildi.');
        rl.close();
        return;
    }
    
    const finalConfirm = await askQuestion('Son onay - "ÜRÜNLER SİL" yazın: ');
    
    if (finalConfirm !== 'ÜRÜNLER SİL') {
        console.log('❌ Yanlış onay. İşlem iptal edildi.');
        rl.close();
        return;
    }
    
    rl.close();
    
    try {
        console.log('\n🔄 Ürünler sıfırlanıyor...');
        
        const result = await resetProductsOnly();
        
        console.log('\n✅ ÜRÜN SIFIRLAMA TAMAMLANDI!');
        console.log('📊 Sonuç:');
        console.log(`   • Silinen ürün: ${result.deletedProducts}`);
        console.log('   • Kategoriler: Korundu (temizlendi)');
        
        console.log('\n🚀 SONRAKİ ADIMLAR:');
        console.log('   1. Yeni ürün verisi çek:');
        console.log('      npm run scrape:parallel');
        console.log('');
        console.log('   2. Durum kontrol:');
        console.log('      npm run health');
        
        console.log('\n💡 Avantaj: Kategori yapısı mevcut olduğu için scraping daha hızlı başlayacak!');
        
    } catch (error) {
        console.error('❌ Ürün sıfırlama hatası:', error.message);
    }
}

if (require.main === module) {
    resetOnlyProducts().catch(console.error);
}

module.exports = resetOnlyProducts;