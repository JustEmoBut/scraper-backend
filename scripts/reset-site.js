require('dotenv').config();
const { resetSite } = require('./reset-database');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise(resolve => rl.question(question, resolve));
}

async function resetSpecificSite() {
    console.log('🎯 BELİRLİ SİTE SIFIRLAMA\n');
    
    const sites = ['İnceHesap', 'İtopya', 'Sinerji'];
    
    console.log('📋 MEVCUT SİTELER:');
    sites.forEach((site, index) => {
        console.log(`   ${index + 1}. ${site}`);
    });
    
    const choice = await askQuestion('\nHangi siteyi sıfırlamak istiyorsunuz? (1-3): ');
    const siteIndex = parseInt(choice) - 1;
    
    if (siteIndex < 0 || siteIndex >= sites.length) {
        console.log('❌ Geçersiz seçim!');
        rl.close();
        return;
    }
    
    const selectedSite = sites[siteIndex];
    
    console.log(`\n⚠️  DİKKAT: ${selectedSite} sitesinin TÜM VERİLERİ silinecek!`);
    console.log('   • Tüm ürünleri silinecek');
    console.log('   • Tüm kategorileri silinecek');
    console.log('   • Diğer siteler etkilenmeyecek\n');
    
    const confirm = await askQuestion(`"${selectedSite} SİL" yazarak onaylayın: `);
    
    if (confirm !== `${selectedSite} SİL`) {
        console.log('❌ Yanlış onay. İşlem iptal edildi.');
        rl.close();
        return;
    }
    
    rl.close();
    
    try {
        console.log(`\n🔄 ${selectedSite} sitesi sıfırlanıyor...`);
        
        const result = await resetSite(selectedSite);
        
        console.log('\n✅ SİTE SIFIRLAMA TAMAMLANDI!');
        console.log(`📊 ${selectedSite} Sonuç:`);
        console.log(`   • Silinen ürün: ${result.deletedProducts}`);
        console.log(`   • Silinen kategori: ${result.deletedCategories}`);
        
        console.log('\n🚀 SONRAKİ ADIM:');
        console.log(`   ${selectedSite} için yeni veri çekmek:`);
        console.log('   npm run scrape:parallel');
        
    } catch (error) {
        console.error('❌ Site sıfırlama hatası:', error.message);
    }
}

if (require.main === module) {
    resetSpecificSite().catch(console.error);
}

module.exports = resetSpecificSite;