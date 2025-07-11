const ProductSpecification = require('../models/ProductSpecification');
const Product = require('../models/Product');

// Specification template'leri tanımla
const specificationTemplates = {
    'İşlemci': {
        cekirdekSayisi: { type: 'number', label: 'Çekirdek Sayısı', unit: 'adet' },
        threadSayisi: { type: 'number', label: 'Thread Sayısı', unit: 'adet' },
        temelFrekans: { type: 'number', label: 'Temel Frekans', unit: 'GHz' },
        maksimumFrekans: { type: 'number', label: 'Maksimum Frekans', unit: 'GHz' },
        soket: { type: 'select', label: 'Soket', options: ['AM4', 'AM5', 'LGA1700', 'LGA1200'] },
        uretimTeknolojisi: { type: 'select', label: 'Üretim Teknolojisi', options: ['7nm', '10nm', '14nm', '12nm'] }
    },
    'Ekran Kartı': {
        bellekBoyutu: { type: 'number', label: 'Bellek Boyutu', unit: 'GB' },
        bellekTipi: { type: 'select', label: 'Bellek Tipi', options: ['GDDR6', 'GDDR6X', 'GDDR7'] },
        cekirdekSayisi: { type: 'number', label: 'Çekirdek Sayısı', unit: 'adet' },
        temelFrekans: { type: 'number', label: 'Temel Frekans', unit: 'MHz' },
        overclockFrekans: { type: 'number', label: 'Overclock Frekans', unit: 'MHz' },
        gucTuketimi: { type: 'number', label: 'Güç Tüketimi', unit: 'W' }
    },
    'RAM': {
        kapasite: { type: 'number', label: 'Kapasite', unit: 'GB' },
        hiz: { type: 'number', label: 'Hız', unit: 'MHz' },
        tip: { type: 'select', label: 'Tip', options: ['DDR4', 'DDR5'] },
        clDegeri: { type: 'text', label: 'CL Değeri' },
        voltaj: { type: 'number', label: 'Voltaj', unit: 'V' }
    },
    'SSD': {
        kapasite: { type: 'number', label: 'Kapasite', unit: 'GB' },
        arayuz: { type: 'select', label: 'Arayüz', options: ['NVMe', 'SATA'] },
        okumaHizi: { type: 'number', label: 'Okuma Hızı', unit: 'MB/s' },
        yazmaHizi: { type: 'number', label: 'Yazma Hızı', unit: 'MB/s' },
        formFaktor: { type: 'select', label: 'Form Faktör', options: ['M.2', '2.5"'] }
    },
    'Anakart': {
        soket: { type: 'select', label: 'Soket', options: ['AM4', 'AM5', 'LGA1700', 'LGA1200'] },
        cipseti: { type: 'text', label: 'Çipseti' },
        formFaktor: { type: 'select', label: 'Form Faktör', options: ['ATX', 'Micro-ATX', 'Mini-ITX'] },
        ramSlotSayisi: { type: 'number', label: 'RAM Slot Sayısı', unit: 'adet' },
        maksimumRam: { type: 'number', label: 'Maksimum RAM', unit: 'GB' }
    },
    'Güç Kaynağı': {
        guc: { type: 'number', label: 'Güç', unit: 'W' },
        sertifikasyon: { type: 'select', label: 'Sertifikasyon', options: ['80+ Bronze', '80+ Silver', '80+ Gold', '80+ Platinum', '80+ Titanium'] },
        moduler: { type: 'select', label: 'Modüler', options: ['Tam Modüler', 'Yarı Modüler', 'Sabit Kablo'] },
        formFaktor: { type: 'select', label: 'Form Faktör', options: ['ATX', 'SFX'] }
    },
    'Bilgisayar Kasası': {
        tip: { type: 'select', label: 'Tip', options: ['Mid Tower', 'Full Tower', 'Mini-ITX'] },
        formFaktor: { type: 'select', label: 'Form Faktör', options: ['ATX', 'Micro-ATX', 'Mini-ITX'] },
        malzeme: { type: 'select', label: 'Malzeme', options: ['Çelik', 'Alüminyum', 'Temperli Cam'] },
        fanSlotu: { type: 'number', label: 'Fan Slotu', unit: 'adet' },
        camPanel: { type: 'boolean', label: 'Cam Panel' }
    }
};

// Yardımcı fonksiyonlar
const getCategoriesForDisplay = (displayCategory) => {
    const categoryMappings = {
        'İşlemci': ['itopya_islemci', 'incehesap_islemci', 'sinerji_islemci'],
        'Ekran Kartı': ['itopya_ekran-karti', 'incehesap_ekran-karti', 'sinerji_ekran-karti'],
        'Anakart': ['itopya_anakart', 'incehesap_anakart', 'sinerji_anakart'],
        'RAM': ['itopya_ram', 'incehesap_ram', 'sinerji_ram'],
        'SSD': ['itopya_ssd', 'incehesap_ssd', 'sinerji_ssd'],
        'Güç Kaynağı': ['itopya_guc-kaynagi', 'incehesap_guc-kaynagi', 'sinerji_guc-kaynagi'],
        'Bilgisayar Kasası': ['itopya_bilgisayar-kasasi', 'incehesap_bilgisayar-kasasi', 'sinerji_bilgisayar-kasasi']
    };
    return categoryMappings[displayCategory] || [displayCategory];
};

// HIZLI VE BASİT EŞLEŞTİRME - TOP 10-15 ADAY İÇİN
// GELIŞTIRILMIŞ AKILLI EŞLEŞTİRME v3.0 - Kategori-specific + Fuzzy + Performance
const calculateSimilarity = (specName, productName, category) => {
    if (!specName || !productName) return 0;
    
    const spec = specName.toLowerCase().trim();
    const product = productName.toLowerCase().trim();
    
    // 1. Tam eşleşme kontrolü
    if (spec === product) return 1.0;
    
    // 2. Fuzzy exact match - küçük farklılıkları tolere et
    const normalizedSpec = normalizeForComparison(spec);
    const normalizedProduct = normalizeForComparison(product);
    if (normalizedSpec === normalizedProduct) return 0.95;
    
    // 3. Anahtar özellikleri çıkar
    const specFeatures = extractKeyFeatures(spec);
    const productFeatures = extractKeyFeatures(product);
    
    // 4. Kategori-specific weighting
    const weights = getCategoryWeights(category);
    
    let score = 0;
    let maxScore = 0;
    
    // 5. Model number match - weight'e göre + fuzzy
    if (specFeatures.modelNumber && productFeatures.modelNumber) {
        maxScore += weights.model;
        if (specFeatures.modelNumber === productFeatures.modelNumber) {
            score += weights.model;
        } else {
            // Fuzzy model matching
            const modelSimilarity = fuzzyModelMatch(specFeatures.modelNumber, productFeatures.modelNumber);
            score += weights.model * modelSimilarity;
        }
    }
    
    // 6. Variant match - weight'e göre + fuzzy
    if (specFeatures.variant && productFeatures.variant) {
        maxScore += weights.variant;
        if (specFeatures.variant === productFeatures.variant) {
            score += weights.variant;
        } else {
            const variantSimilarity = fuzzyVariantMatch(specFeatures.variant, productFeatures.variant);
            score += weights.variant * variantSimilarity;
        }
    } else if (!specFeatures.variant && !productFeatures.variant) {
        maxScore += weights.variant;
        score += weights.variant;
    }
    
    // 7. Brand match - weight'e göre
    if (specFeatures.brand && productFeatures.brand) {
        maxScore += weights.brand;
        if (specFeatures.brand === productFeatures.brand) {
            score += weights.brand;
        }
    }
    
    // 8. Capacity match - weight'e göre + fuzzy
    if (specFeatures.capacity && productFeatures.capacity) {
        maxScore += weights.capacity;
        if (specFeatures.capacity === productFeatures.capacity) {
            score += weights.capacity;
        } else {
            const capacitySimilarity = fuzzyCapacityMatch(specFeatures.capacity, productFeatures.capacity);
            score += weights.capacity * capacitySimilarity;
        }
    }
    
    // 9. Smart fallback
    if (maxScore < 0.3) {
        return smartFallbackMatch(spec, product);
    }
    
    return Math.min(score / maxScore, 1.0);
};

// YARDIMCI FONKSİYONLAR

// Kategori-specific weight sistemleri
const getCategoryWeights = (category) => {
    const categoryWeights = {
        'İşlemci': { model: 0.6, variant: 0.25, brand: 0.1, capacity: 0.05 },
        'Ekran Kartı': { model: 0.55, variant: 0.3, brand: 0.1, capacity: 0.05 },
        'RAM': { model: 0.3, variant: 0.1, brand: 0.15, capacity: 0.45 },
        'SSD': { model: 0.35, variant: 0.1, brand: 0.15, capacity: 0.4 },
        'Anakart': { model: 0.5, variant: 0.2, brand: 0.2, capacity: 0.1 },
        'Güç Kaynağı': { model: 0.4, variant: 0.15, brand: 0.25, capacity: 0.2 },
        'Bilgisayar Kasası': { model: 0.45, variant: 0.2, brand: 0.25, capacity: 0.1 }
    };
    
    return categoryWeights[category] || { model: 0.5, variant: 0.2, brand: 0.15, capacity: 0.15 };
};

const normalizeForComparison = (text) => {
    return text
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\b(the|and|or|with|for)\b/g, '')
        .trim();
};

const fuzzyModelMatch = (model1, model2) => {
    if (model1 === model2) return 1.0;
    
    // Base model comparison (7600 vs 7600x)
    const base1 = model1.replace(/[a-z]+$/, '');
    const base2 = model2.replace(/[a-z]+$/, '');
    
    if (base1 === base2 && base1.length >= 4) {
        return 0.8; // High similarity for same base
    }
    
    // Levenshtein distance for typos
    const distance = levenshteinDistance(model1, model2);
    const maxLen = Math.max(model1.length, model2.length);
    const similarity = 1 - (distance / maxLen);
    
    return Math.max(0, similarity);
};

const fuzzyVariantMatch = (variant1, variant2) => {
    const variantGroups = {
        'performance': ['ti', 'super', 'xt'],
        'efficiency': ['', 'f'],
        'overclocked': ['k', 'oc']
    };
    
    // Same group gets partial credit
    for (const group of Object.values(variantGroups)) {
        if (group.includes(variant1) && group.includes(variant2)) {
            return variant1 === variant2 ? 1.0 : 0.6;
        }
    }
    
    return 0.2;
};

const fuzzyCapacityMatch = (cap1, cap2) => {
    const num1 = parseInt(cap1);
    const num2 = parseInt(cap2);
    
    if (num1 === num2) return 1.0;
    
    // Close capacities (within 10%)
    const ratio = Math.min(num1, num2) / Math.max(num1, num2);
    return ratio > 0.9 ? 0.8 : 0.0;
};

const smartFallbackMatch = (spec, product) => {
    const specWords = spec.split(/\s+/).filter(w => w.length > 2);
    const productWords = product.split(/\s+/).filter(w => w.length > 2);
    
    let matches = 0;
    for (const specWord of specWords) {
        for (const productWord of productWords) {
            if (specWord.includes(productWord) || productWord.includes(specWord)) {
                matches++;
                break;
            }
        }
    }
    
    const similarity = matches / Math.max(specWords.length, productWords.length);
    return Math.min(similarity * 0.4, 0.35);
};

// Optimized Levenshtein distance
const levenshteinDistance = (str1, str2) => {
    if (str1.length === 0) return str2.length;
    if (str2.length === 0) return str1.length;
    
    const matrix = Array(str2.length + 1).fill().map(() => Array(str1.length + 1).fill(0));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j - 1][i] + 1,
                matrix[j][i - 1] + 1,
                matrix[j - 1][i - 1] + cost
            );
        }
    }
    
    return matrix[str2.length][str1.length];
};

// GELIŞTIRILMIŞ - Anahtar özellikleri akıllıca çıkar
const extractKeyFeatures = (productName) => {
    const name = productName.toLowerCase().trim();
    const features = {};
    
    // Daha akıllı model number extraction - kategori-specific patterns
    const smartModelPatterns = [
        // GPU patterns (RTX/RX serisi)
        /(?:rtx|rx)[\s\-]*(\d{4})[\s\-]*(ti|super|xt|xe)?/i,
        // CPU patterns (AMD Ryzen)
        /ryzen[\s\-]*\d[\s\-]*(\d{4}[a-z]*)/i,
        // CPU patterns (Intel Core)
        /(?:core[\s\-]*)?i\d[\s\-]*(\d{4,5}[a-z]*)/i,
        // Memory patterns (DDR4/DDR5)
        /ddr[45][\s\-]*(\d+(?:gb)?)/i,
        // Storage patterns
        /(\d+(?:gb|tb))[\s\-]*(?:ssd|nvme|m\.2)?/i,
        // General 4-digit models
        /\b(\d{4})[\s\-]*(ti|super|xt|xe)?\b/i,
        // CPU suffixes (K, F, X, etc.)
        /(\d{4,5}[kfxtgh]+)/i
    ];
    
    for (const pattern of smartModelPatterns) {
        const match = name.match(pattern);
        if (match) {
            let modelNum = match[1];
            let variant = match[2] || '';
            
            // Normalize whitespace and combine
            features.modelNumber = (modelNum + variant).replace(/\s+/g, '').toLowerCase();
            if (variant) {
                features.variant = variant.toLowerCase();
            }
            break;
        }
    }
    
    // Fuzzy variant extraction - daha toleranslı
    const variantPatterns = [
        /\b(ti|super|xt|xe|pro|gaming|oc|boost)\b/i,
        /\b([kfx]f?)\b/i, // CPU suffixes
    ];
    
    if (!features.variant) {
        for (const pattern of variantPatterns) {
            const match = name.match(pattern);
            if (match) {
                features.variant = match[1].toLowerCase();
                break;
            }
        }
    }
    
    // Brand extraction - mevcut kodu koru (değiştirme)
    if (/nvidia|geforce|rtx|gtx/.test(name)) {
        features.brand = 'nvidia';
    } else if (/amd|radeon|rx/.test(name)) {
        features.brand = 'amd';
    } else if (/intel/.test(name)) {
        features.brand = 'intel';
    }
    
    // Geliştirilmiş capacity extraction - daha akıllı
    const capacityPatterns = [
        /(\d+)\s*tb/i,  // TB first
        /(\d+)\s*gb/i,  // Then GB
        /(\d+gb)/i,     // Attached GB
    ];
    
    for (const pattern of capacityPatterns) {
        const match = name.match(pattern);
        if (match) {
            let capacity = match[1];
            let unit = match[0].toLowerCase();
            
            // Normalize to GB for comparison
            if (unit.includes('tb')) {
                capacity = `${parseInt(capacity) * 1000}gb`;
            } else if (!unit.includes('gb')) {
                capacity = `${capacity}gb`;
            } else {
                capacity = unit;
            }
            
            features.capacity = capacity;
            break;
        }
    }
    
    return features;
};

// Model numarası ve varyantını çıkar - GELİŞTİRİLMİŞ
const extractModelWithVariant = (text) => {
    const lowerText = text.toLowerCase();
    
    // GPU patterns - daha kapsamlı
    const gpuPatterns = [
        // NVIDIA patterns
        /(?:geforce\s*)?rtx\s*(\d{4})\s*(ti|super|xt)?/i,
        /(?:geforce\s*)?gtx\s*(\d{3,4})\s*(ti|super)?/i,
        // AMD patterns  
        /(?:radeon\s*)?rx\s*(\d{4})\s*(xt|xe)?/i,
        /radeon\s*(\d{4})\s*(xt|xe)?/i,
        // Intel patterns
        /arc\s*([a-z]\d{3})/i,
        // Basit model patterns
        /\b(\d{4})\s*(ti|super|xt|xe)?\b/i
    ];
    
    for (const pattern of gpuPatterns) {
        const match = lowerText.match(pattern);
        if (match) {
            const model = match[1];
            const variant = match[2] || '';
            return `${model}${variant}`.toLowerCase();
        }
    }
    
    return null;
};

// Model uyumluluğu kontrolü - YENİ + WHITESPACE FIX
const areModelsCompatible = (specModel, productModel) => {
    // Tam eşleşme
    if (specModel === productModel) return true;
    
    // Whitespace olmadan karşılaştır (9070xt vs 9070 xt)
    const specNoSpaces = specModel.replace(/\s+/g, '').toLowerCase();
    const productNoSpaces = productModel.replace(/\s+/g, '').toLowerCase();
    
    if (specNoSpaces === productNoSpaces) return true;
    
    // Varyant farklılığı kontrolü (5070 vs 5070ti gibi) - whitespace insensitive
    const specBase = specModel.replace(/\s+/g, '').replace(/(ti|super|xt|xe)$/i, '');
    const productBase = productModel.replace(/\s+/g, '').replace(/(ti|super|xt|xe)$/i, '');
    
    // Farklı base model = uyumsuz
    if (specBase !== productBase) return false;
    
    // Aynı base model ama farklı varyant = uyumsuz
    // (5070 vs 5070ti farklı ürünlerdir)
    return specNoSpaces === productNoSpaces;
};

// Core model çıkarma - GELİŞTİRİLMİŞ
const extractCoreModel = (productName) => {
    const lowerName = productName.toLowerCase().trim();
    
    // GPU için öncelikli pattern'ler - DAHA ESNEK + BOŞLUKSUZ PATTERN
    const gpuPatterns = [
        // NVIDIA - tüm varyasyonlar
        /(?:nvidia\s*)?(?:geforce\s*)?rtx\s*(\d{4}(?:\s*ti|\s*super)?)/i,
        /(?:nvidia\s*)?(?:geforce\s*)?gtx\s*(\d{3,4}(?:\s*ti|\s*super)?)/i,
        // AMD - boşluklu varyasyonlar
        /(?:amd\s*)?(?:radeon\s*)?rx\s*(\d{4}(?:\s*xt|\s*xe)?)/i,
        // AMD - boşluksuz varyasyonlar (RX9060XT gibi)
        /(?:amd\s*)?(?:radeon\s*)?rx(\d{4}(?:xt|xe)?)/i,
        // Intel
        /(?:intel\s*)?arc\s*([a-z]\d{3})/i,
        // Sadece model numarası (5070, 5070ti gibi)
        /\b(\d{4}(?:ti|super|xt|xe)?)\b/i
    ];
    
    for (const pattern of gpuPatterns) {
        const match = lowerName.match(pattern);
        if (match) {
            // Boşlukları kaldır ve lowercase yap
            let extracted = match[1].replace(/\s+/g, '').toLowerCase();
            
            // RX9060XT -> 9060xt formatına çevir (boşluksuz AMD pattern için)
            if (pattern.source.includes('rx(\\d{4}')) {
                // Zaten doğru format
            } else {
                // Diğer pattern'ler için normal işlem
            }
            
            return extracted;
        }
    }
    
    // CPU patterns - GELİŞTİRİLMİŞ (boşluklu ve boşluksuz)
    const cpuPatterns = [
        // AMD Ryzen - boşluklu
        /ryzen\s*\d+\s*(\d{4}[a-z]*)/i,
        // AMD Ryzen - boşluksuz (ryzen57600x)
        /ryzen(\d{1})(\d{4}[a-z]*)/i,
        // Intel Core - boşluklu
        /core\s*i\d+[-\s]*(\d{4,5}[a-z]*)/i,
        // Intel Core - boşluksuz (corei513600k)
        /core\s*i(\d+)(\d{4,5}[a-z]*)/i,
        // Intel direkt model
        /(?:intel\s*)?(\d{4,5}k?f?t?)/i
    ];
    
    for (const pattern of cpuPatterns) {
        const match = lowerName.match(pattern);
        if (match) {
            // Boşluksuz pattern'ler için özel handling
            if (pattern.source.includes('ryzen(\\d{1})(\\d{4}') || pattern.source.includes('core\\s*i(\\d+)(\\d{4,5}')) {
                // İki grup yakalayan pattern'ler - birleştir
                return (match[1] + match[2]).toLowerCase();
            } else {
                // Normal tek grup yakalayan pattern'ler
                return match[1].toLowerCase();
            }
        }
    }
    
    // Fallback: sadece 4 haneli sayılar + optional varyant
    const numberMatch = lowerName.match(/\b(\d{4}(?:ti|super|xt|xe)?)\b/i);
    if (numberMatch) {
        return numberMatch[1].toLowerCase();
    }
    
    console.log('❌ No core model extracted from:', productName);
    return null;
};

// Eski normalize fonksiyonu kaldırıldı - Yeni basit versiyonu kullanıyoruz

// Key term ağırlığını belirle
const getKeyTermWeight = (term) => {
    // Model numaraları en yüksek ağırlık
    if (/^\d{4}(ti|super|xt|xe)?$/.test(term)) return 10;
    if (/^(rtx|gtx|rx)\d+/.test(term)) return 10;
    
    // Çip markaları yüksek ağırlık
    if (['rtx', 'gtx', 'rx', 'radeon', 'geforce', 'arc'].includes(term)) return 8;
    
    // Teknik özellikler
    if (/^\d+gb?$/.test(term)) return 6;
    if (/^gddr\d+x?$/.test(term)) return 6;
    if (/^\d+bit$/.test(term)) return 5;
    
    // CPU terimleri
    if (['ryzen', 'core', 'intel', 'amd'].includes(term)) return 7;
    
    // Genel teknik terimler
    if (['ddr', 'nvme', 'sata', 'pcie'].includes(term)) return 4;
    
    // Sayılar
    if (/^\d+$/.test(term)) return 3;
    
    // Kısa token'lar düşük önem
    if (term.length <= 2) return 0.5;
    
    return 1;
};

// Önemli terimlerin eşleşme oranını kontrol et - GELİŞTİRİLMİŞ + RX FIX
const checkKeyTermsMatch = (spec, product) => {
    // Model numaraları ve önemli teknik terimler - daha kapsamlı
    const keyTermPatterns = [
        // GPU Patterns - Çok daha esnek
        /\b(?:rtx|gtx)\s*\d{4}\s*(?:ti|super)?/gi,
        /\b(?:rx|radeon)\s*\d{4}\s*(?:xt|xe)?/gi,
        // RX boşluksuz pattern (RX9060XT)
        /\brx\d{4}(?:xt|xe)?/gi,
        /\barc\s*[a-z]\d{3}/gi,
        // Sadece model numaraları
        /\b\d{4}(?:ti|super|xt|xe)?\b/gi,
        // Memory patterns
        /\b\d+gb?\b/gi,
        /\bgddr\d+x?\b/gi,
        // Bus width
        /\b\d+\s*bit\b/gi,
        // Memory type
        /\b(?:gddr7|gddr6x|gddr6|gddr5)\b/gi
    ];
    
    let specTerms = [];
    let productTerms = [];
    
    // Extract terms
    keyTermPatterns.forEach(pattern => {
        const specMatches = spec.match(pattern) || [];
        const productMatches = product.match(pattern) || [];
        
        specTerms = specTerms.concat(specMatches.map(m => normalizeKeyTerm(m)));
        productTerms = productTerms.concat(productMatches.map(m => normalizeKeyTerm(m)));
    });
    
    // Remove duplicates
    specTerms = [...new Set(specTerms)];
    productTerms = [...new Set(productTerms)];
    
    if (specTerms.length === 0) return 0.5;
    
    // MODEL NUMARASI ÖNCELİKLİ KONTROL
    const specModelTerms = specTerms.filter(t => /\d{4}/.test(t));
    const productModelTerms = productTerms.filter(t => /\d{4}/.test(t));
    
    // Model numarası eşleşmesi kritik
    if (specModelTerms.length > 0 && productModelTerms.length > 0) {
        const modelMatch = specModelTerms.some(st => 
            productModelTerms.some(pt => {
                // Normalize ederek karşılaştır (5070ti vs 5070 ti)
                const normalizedSt = st.replace(/\s+/g, '').toLowerCase();
                const normalizedPt = pt.replace(/\s+/g, '').toLowerCase();
                return normalizedSt === normalizedPt;
            })
        );
        
        if (!modelMatch) {
            console.log('❌ Model number mismatch');
            return 0.0; // Model uyuşmazsa direkt 0
        }
    }
    
    // Diğer terimler için eşleşme skoru
    let matchCount = 0;
    let totalWeight = 0;
    
    specTerms.forEach(specTerm => {
        const weight = getKeyTermWeight(specTerm);
        totalWeight += weight;
        
        const normalizedSpecTerm = specTerm.replace(/\s+/g, '').toLowerCase();
        
        const exactMatch = productTerms.some(pTerm => {
            const normalizedPTerm = pTerm.replace(/\s+/g, '').toLowerCase();
            
            // Normal eşleşme
            if (normalizedSpecTerm === normalizedPTerm) return true;
            
            // RX special case: rx9060xt ile 9060xt eşleşsin
            if (normalizedSpecTerm.startsWith('rx') && normalizedPTerm === normalizedSpecTerm.substring(2)) return true;
            if (normalizedPTerm.startsWith('rx') && normalizedSpecTerm === normalizedPTerm.substring(2)) return true;
            
            return false;
        });
        
        if (exactMatch) {
            matchCount += weight;
        }
    });
    
    return totalWeight > 0 ? matchCount / totalWeight : 0.5;
};

// Gelişmiş benzerlik hesaplama - YENİDEN YAPILANDIRILDI
const calculateAdvancedSimilarity = (spec, product) => {
    if (!spec || !product) return 0;
    
    // Token-based similarity
    const specTokens = tokenizeProductName(spec);
    const productTokens = tokenizeProductName(product);
    
    if (specTokens.length === 0 || productTokens.length === 0) return 0;
    
    // ÖNEMLİ: Model numarası token'larını özel olarak kontrol et
    const specModelTokens = specTokens.filter(t => /\d{4}/.test(t));
    const productModelTokens = productTokens.filter(t => /\d{4}/.test(t));
    
    // Model numarası varsa ve eşleşmiyorsa düşük skor
    if (specModelTokens.length > 0 && productModelTokens.length > 0) {
        const hasModelMatch = specModelTokens.some(st => 
            productModelTokens.some(pt => st === pt)
        );
        if (!hasModelMatch) {
            return 0.1; // Çok düşük skor
        }
    }
    
    // Jaccard similarity - sadece önemli token'lar için + RX special matching
    const importantSpecTokens = specTokens.filter(t => getTokenWeight(t) >= 2);
    const importantProductTokens = productTokens.filter(t => getTokenWeight(t) >= 2);
    
    // Normal intersection
    let intersection = importantSpecTokens.filter(token => 
        importantProductTokens.includes(token)
    );
    
    // RX special matching için additional intersection
    const rxSpecialMatches = importantSpecTokens.filter(token => {
        if (importantProductTokens.includes(token)) return false; // Zaten eşleşmiş
        
        return importantProductTokens.some(pToken => {
            // rx9060xt ile 9060xt eşleşsin
            if (token.startsWith('rx') && pToken === token.substring(2)) return true;
            if (pToken.startsWith('rx') && token === pToken.substring(2)) return true;
            
            // radeon ile rx eşleşsin
            if ((token === 'radeon' && pToken === 'rx') || (token === 'rx' && pToken === 'radeon')) return true;
            
            return false;
        });
    });
    
    // RX special matches'i intersection'a ekle
    intersection = [...intersection, ...rxSpecialMatches];
    
    const union = [...new Set([...importantSpecTokens, ...importantProductTokens])];
    
    const jaccardSimilarity = union.length > 0 ? intersection.length / union.length : 0;
    
    // Weighted token similarity + RX special matching
    let weightedScore = 0;
    let totalWeight = 0;
    
    specTokens.forEach(token => {
        const weight = getTokenWeight(token);
        totalWeight += weight;
        
        // Normal eşleşme
        if (productTokens.includes(token)) {
            weightedScore += weight;
        } else {
            // RX special case: rx9060xt ile 9060xt, rx ile radeon eşleşsin
            const rxMatch = productTokens.some(pToken => {
                // rx9060xt ile 9060xt eşleşsin
                if (token.startsWith('rx') && pToken === token.substring(2)) return true;
                if (pToken.startsWith('rx') && token === pToken.substring(2)) return true;
                
                // radeon ile rx eşleşsin
                if ((token === 'radeon' && pToken === 'rx') || (token === 'rx' && pToken === 'radeon')) return true;
                
                return false;
            });
            
            if (rxMatch) {
                weightedScore += weight * 0.9; // %90 match bonus
            }
        }
    });
    
    const weightedSimilarity = totalWeight > 0 ? weightedScore / totalWeight : 0;
    
    // RX pattern bonus - eğer her iki stringde de RX pattern varsa bonus ver
    let rxBonus = 0;
    const hasSpecRxPattern = /\brx\s*\d{4}/i.test(spec) || /\bradeon\s*rx/i.test(spec);
    const hasProductRxPattern = /\brx\s*\d{4}/i.test(product) || /\bradeon\s*rx/i.test(product);
    
    if (hasSpecRxPattern && hasProductRxPattern) {
        rxBonus = 0.2; // %20 bonus
    }
    
    // Combined score - Jaccard'a daha fazla ağırlık + RX bonus
    const baseScore = (jaccardSimilarity * 0.6) + (weightedSimilarity * 0.4);
    return Math.min(baseScore + rxBonus, 1.0);
};

// Token önemini belirle - GÜNCELLENDİ + RX BOOST
const getTokenWeight = (token) => {
    // Model numaraları en yüksek ağırlık
    if (/^\d{4}(ti|super|xt|xe)?$/.test(token)) return 15; // BOOST: 5070, 5070ti
    if (/^(rtx|gtx|rx)\d+/.test(token)) return 15; // BOOST: rtx5070, rx9060xt
    
    // Çip markaları yüksek ağırlık
    if (['rtx', 'gtx', 'rx', 'radeon', 'geforce', 'arc'].includes(token)) return 12; // BOOST
    
    // Teknik özellikler
    if (/^\d+gb?$/.test(token)) return 8; // BOOST: 12gb, 12g
    if (/^gddr\d+x?$/.test(token)) return 8; // BOOST: gddr7, gddr6x
    if (/^\d+bit$/.test(token)) return 6; // 192bit
    
    // CPU terimleri
    if (['ryzen', 'core', 'intel', 'amd'].includes(token)) return 10; // BOOST
    
    // Genel teknik terimler
    if (['ddr', 'nvme', 'sata', 'pcie'].includes(token)) return 5;
    
    // Sayılar
    if (/^\d+$/.test(token)) return 4;
    
    // Kısa token'lar düşük önem
    if (token.length <= 2) return 0.5;
    
    return 1; // Default weight
};

// Marka tutarlılığını kontrol et - GELİŞTİRİLMİŞ
const checkBrandConsistency = (spec, product) => {
    console.log(`🏷️ Brand check: "${spec}" vs "${product}"`);
    
    // GPU için çip markası kontrolü
    const specGpuChip = getGpuChipBrand(spec);
    const productGpuChip = getGpuChipBrand(product);
    
    if (specGpuChip && productGpuChip) {
        const isCompatible = specGpuChip === productGpuChip;
        console.log(`🎮 GPU Chip brands: ${specGpuChip} vs ${productGpuChip} = ${isCompatible}`);
        return isCompatible;
    }
    
    // CPU için marka kontrolü
    const specCpuBrand = getCpuBrand(spec);
    const productCpuBrand = getCpuBrand(product);
    
    if (specCpuBrand && productCpuBrand) {
        const isCompatible = specCpuBrand === productCpuBrand;
        console.log(`💻 CPU brands: ${specCpuBrand} vs ${productCpuBrand} = ${isCompatible}`);
        return isCompatible;
    }
    
    // Marka bulunamazsa uyumlu kabul et
    console.log(`🤷 No specific brands found, allowing match`);
    return true;
};

// GPU çip markasını tespit et - GELİŞTİRİLMİŞ
const getGpuChipBrand = (text) => {
    const lowerText = text.toLowerCase();
    
    // NVIDIA çip markaları - daha kapsamlı
    if (/\b(geforce|rtx|gtx|nvidia|gf|nv)\b/.test(lowerText)) {
        return 'nvidia';
    }
    
    // AMD çip markaları - daha kapsamlı
    if (/\b(radeon|rx\s*\d|amd)\b/.test(lowerText)) {
        return 'amd';
    }
    
    // Intel çip markaları
    if (/\b(arc|intel)\b/.test(lowerText)) {
        return 'intel';
    }
    
    return null;
};

// CPU markalarını tespit et
const getCpuBrand = (text) => {
    const lowerText = text.toLowerCase();
    
    if (/\b(ryzen|athlon|epyc|amd)\b/.test(lowerText)) {
        return 'amd';
    }
    
    if (/\b(core|xeon|pentium|celeron|intel)\b/.test(lowerText)) {
        return 'intel';
    }
    
    return null;
};

// Kapasite uyumluluğu skoru
const calculateCapacityScore = (spec, product) => {
    const specCapacities = extractSimpleCapacities(spec);
    const productCapacities = extractSimpleCapacities(product);
    
    // Kapasite bilgisi yoksa neutral
    if (specCapacities.length === 0 || productCapacities.length === 0) {
        return 0.5; // Neutral score
    }
    
    let matchCount = 0;
    let totalCount = specCapacities.length;
    
    specCapacities.forEach(specCap => {
        const hasMatch = productCapacities.some(prodCap => 
            specCap.type === prodCap.type && 
            Math.abs(specCap.value - prodCap.value) <= specCap.value * 0.15 // %15 tolerance
        );
        if (hasMatch) matchCount++;
    });
    
    return matchCount / totalCount;
};

// Kapasiteleri basit şekilde çıkar
const extractSimpleCapacities = (text) => {
    const capacities = [];
    
    // GB/TB kapasiteleri
    const storageMatches = text.match(/(\d+)\s*(gb|g|tb|t)\b/gi) || [];
    storageMatches.forEach(match => {
        const numMatch = match.match(/(\d+)/);
        const unitMatch = match.match(/(gb|g|tb|t)/i);
        if (numMatch && unitMatch) {
            const value = parseInt(numMatch[1]);
            const unit = unitMatch[1].toLowerCase();
            // TB'yi GB'ye çevir
            const gbValue = (unit === 'tb' || unit === 't') ? value * 1000 : value;
            capacities.push({ type: 'storage', value: gbValue, unit: 'gb' });
        }
    });
    
    // MHz hızları
    const speedMatches = text.match(/(\d+)\s*(mhz|m)\b/gi) || [];
    speedMatches.forEach(match => {
        const numMatch = match.match(/(\d+)/);
        if (numMatch) {
            capacities.push({ type: 'speed', value: parseInt(numMatch[1]), unit: 'mhz' });
        }
    });
    
    return capacities;
};

// Fuzzy name matching
const calculateFuzzyNameMatch = (spec, product) => {
    // Basit string similarity kullan
    const similarity = calculateSimpleStringSimilarity(spec, product);
    
    // Brand tutarlılığı kontrol et
    if (!checkBrandConsistency(spec, product)) {
        return 0.0;
    }
    
    // Önemli terimler kontrolü
    const keyTermsScore = checkKeyTermsMatch(spec, product);
    
    // Combine scores
    const finalScore = (similarity * 0.6) + (keyTermsScore * 0.4);
    
    return finalScore > 0.3 ? finalScore : 0.0;
};

// Basit string benzerliği
const calculateSimpleStringSimilarity = (str1, str2) => {
    // Normalize strings
    const normalize = (str) => str.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const norm1 = normalize(str1);
    const norm2 = normalize(str2);
    
    // Token-based similarity
    const tokens1 = norm1.split(' ');
    const tokens2 = norm2.split(' ');
    
    const commonTokens = tokens1.filter(token => 
        tokens2.some(t2 => t2.includes(token) || token.includes(t2))
    );
    
    const totalTokens = Math.max(tokens1.length, tokens2.length);
    
    return commonTokens.length / totalTokens;
};

// Token'ları çıkar ve normalize et - RX FULL MERGE FIX
const tokenizeProductName = (name) => {
    let tokens = name.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(token => token.length > 1)
        .map(token => token.trim());
    
    // RX tam birleşik pattern'leri ayır (rx9070xt -> rx, 9070xt, 9070, xt)
    const additionalTokens = [];
    tokens.forEach(token => {
        // rx9070xt pattern'i tespit et
        const rxMatch = token.match(/^rx(\d{4})(xt|xe|ti|super)?$/);
        if (rxMatch) {
            additionalTokens.push('rx');
            additionalTokens.push(rxMatch[1] + (rxMatch[2] || '')); // 9070xt
            additionalTokens.push(rxMatch[1]); // 9070
            if (rxMatch[2]) {
                additionalTokens.push(rxMatch[2]); // xt
            }
        }
        
        // rtx5070ti pattern'i de kontrol et
        const rtxMatch = token.match(/^(rtx|gtx)(\d{4})(xt|xe|ti|super)?$/);
        if (rtxMatch) {
            additionalTokens.push(rtxMatch[1]); // rtx
            additionalTokens.push(rtxMatch[2] + (rtxMatch[3] || '')); // 5070ti
            additionalTokens.push(rtxMatch[2]); // 5070
            if (rtxMatch[3]) {
                additionalTokens.push(rtxMatch[3]); // ti
            }
        }
        
        // CPU patterns - ryzen57600x, corei513600k gibi
        const ryzenMatch = token.match(/^ryzen(\d{1})(\d{4}[a-z]*)$/);
        if (ryzenMatch) {
            additionalTokens.push('ryzen'); // ryzen
            additionalTokens.push(ryzenMatch[1]); // 5
            additionalTokens.push(ryzenMatch[2]); // 7600x
            additionalTokens.push(ryzenMatch[2].replace(/[a-z]+$/, '')); // 7600
        }
        
        const intelMatch = token.match(/^corei(\d+)(\d{4,5}[a-z]*)$/);
        if (intelMatch) {
            additionalTokens.push('core'); // core
            additionalTokens.push('i' + intelMatch[1]); // i5
            additionalTokens.push(intelMatch[2]); // 13600k
            additionalTokens.push(intelMatch[2].replace(/[a-z]+$/, '')); // 13600
        }
    });
    
    // Orijinal token'lar + ayrıştırılmış token'lar
    return [...tokens, ...additionalTokens].filter((token, index, arr) => 
        token.length > 0 && arr.indexOf(token) === index // Duplicates'i kaldır
    );
};

// Anahtar terimi normalize et - RX FIX
const normalizeKeyTerm = (term) => {
    let normalized = term.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^\w]/g, '');
    
    // RX9060XT gibi pattern'leri ayır (rx9060xt -> 9060xt)
    if (normalized.match(/^rx\d{4}(xt|xe)$/)) {
        normalized = normalized.replace(/^rx/, '');
    }
    
    return normalized;
};

// Tüm specification'ları getir
const getAllSpecifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, category, brand, search } = req.query;
        
        const query = { isActive: true };
        
        if (category) {
            query.category = category;
        }
        
        if (brand) {
            query.brand = { $regex: brand, $options: 'i' };
        }
        
        if (search) {
            query.$or = [
                { productName: { $regex: search, $options: 'i' } },
                { cleanProductName: { $regex: search, $options: 'i' } }
            ];
        }
        
        const specifications = await ProductSpecification.find(query)
            .populate('matchedProducts.productId', 'name currentPrice source')
            .sort({ verifiedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
        const total = await ProductSpecification.countDocuments(query);
        
        res.json({
            success: true,
            data: specifications,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Tek specification getir
const getSpecificationById = async (req, res) => {
    try {
        const specification = await ProductSpecification.findById(req.params.id)
            .populate('matchedProducts.productId');
            
        if (!specification) {
            return res.status(404).json({
                success: false,
                error: 'Specification not found'
            });
        }
        
        // Existing matches'lerin similarity değerlerini güncelle (migration)
        let needsSave = false;
        for (let match of specification.matchedProducts) {
            if (!match.similarity && match.confidence) {
                // Eski confidence değerini similarity olarak kullan
                match.similarity = match.confidence;
                needsSave = true;
            } else if (!match.similarity) {
                // Hiç similarity/confidence yoksa yeniden hesapla
                try {
                    const product = await Product.findById(match.productId);
                    if (product) {
                        match.similarity = calculateSimilarity(specification.productName, product.name, specification.category);
                        needsSave = true;
                    }
                } catch (error) {
                    console.log(`Could not recalculate similarity for match ${match.productId}:`, error.message);
                    match.similarity = 0.5; // Default değer
                    needsSave = true;
                }
            }
        }
        
        // View count artır
        specification.stats.viewCount += 1;
        needsSave = true;
        
        if (needsSave) {
            await specification.save();
        }
        
        res.json({
            success: true,
            data: specification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Yeni specification oluştur
const createSpecification = async (req, res) => {
    try {
        const { productName, category, brand, specifications, source, productId } = req.body;
        
        if (!productName || !category) {
            return res.status(400).json({
                success: false,
                error: 'Product name and category are required'
            });
        }
        
        // Check for similar specifications (less strict for manual entries)
        const cleanName = productName.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
        
        const existingSpec = await ProductSpecification.findOne({
            cleanProductName: cleanName,
            category,
            ...(brand && { brand: brand })
        });
        
        if (existingSpec) {
            return res.status(409).json({
                success: false,
                error: `Specification already exists for "${productName}" in ${category} category`
            });
        }
        
        const cleanProductName = productName.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
        
        const newSpecification = new ProductSpecification({
            productName,
            cleanProductName, // Manually set to avoid validation issues
            category,
            brand: brand || undefined, // Brand is optional for manual entries
            specifications: new Map(Object.entries(specifications || {})),
            source: source || 'manual',
            verifiedBy: 'admin_manual' // Indicate this was manually added
        });
        
        await newSpecification.save();
        
        // Eğer productId verilmişse, o ürünü direkt eşleştir
        if (productId) {
            try {
                const product = await Product.findById(productId);
                if (product) {
                    newSpecification.matchedProducts.push({
                        productId: productId,
                        productName: product.name,
                        confidence: 1.0,
                        source: product.source,
                        matchedAt: new Date()
                    });
                    newSpecification.stats.totalMatches = (newSpecification.stats.totalMatches || 0) + 1;
                    newSpecification.stats.lastMatchedAt = new Date();
                    console.log(`Product ${productId} automatically matched to specification ${newSpecification._id}`);
                }
            } catch (matchError) {
                console.error('Error matching product to specification:', matchError);
                // Eşleştirme hatası specification oluşturmayı engellemez
            }
        } else {
            // ProductId yoksa, akıllı otomatik eşleştirme yap
            try {
                await performSmartMatching(newSpecification, productName, category);
            } catch (autoMatchError) {
                console.error('Error in auto-matching:', autoMatchError);
                // Otomatik eşleştirme hatası specification oluşturmayı engellemez
            }
        }
        
        res.status(201).json({
            success: true,
            data: newSpecification
        });
    } catch (error) {
        console.error('Create specification error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Specification güncelle
const updateSpecification = async (req, res) => {
    try {
        const { specifications, productName, category, brand } = req.body;
        
        const specification = await ProductSpecification.findById(req.params.id);
        
        if (!specification) {
            return res.status(404).json({
                success: false,
                error: 'Specification not found'
            });
        }
        
        // Güncelleme işlemleri
        if (productName) specification.productName = productName;
        if (category) specification.category = category;
        if (brand !== undefined) specification.brand = brand;
        
        if (specifications) {
            specification.specifications = new Map(Object.entries(specifications));
        }
        
        specification.verifiedAt = new Date();
        await specification.save();
        
        res.json({
            success: true,
            data: specification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Specification sil
const deleteSpecification = async (req, res) => {
    try {
        const specification = await ProductSpecification.findById(req.params.id);
        
        if (!specification) {
            return res.status(404).json({
                success: false,
                error: 'Specification not found'
            });
        }
        
        // Gerçekten sil (hard delete)
        await ProductSpecification.findByIdAndDelete(req.params.id);
        
        res.json({
            success: true,
            message: 'Specification deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Kategori şablonlarını getir
const getSpecificationTemplates = async (req, res) => {
    try {
        const { category } = req.params;
        
        if (category && specificationTemplates[category]) {
            res.json({
                success: true,
                data: {
                    category,
                    fields: specificationTemplates[category]
                }
            });
        } else {
            res.json({
                success: true,
                data: specificationTemplates
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Ürün eşleştirme
const matchProductWithSpecification = async (req, res) => {
    try {
        const { productId } = req.params;
        const { specificationId, confidence } = req.body;
        
        const product = await Product.findById(productId);
        const specification = await ProductSpecification.findById(specificationId);
        
        if (!product || !specification) {
            return res.status(404).json({
                success: false,
                error: 'Product or specification not found'
            });
        }
        
        specification.matchedProducts.push({
            productId: productId,
            productName: product.name,
            confidence: confidence,
            source: product.source,
            matchedAt: new Date()
        });
        specification.stats.totalMatches = (specification.stats.totalMatches || 0) + 1;
        specification.stats.lastMatchedAt = new Date();
        await specification.save();
        
        res.json({
            success: true,
            message: 'Product matched successfully',
            data: specification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Ürün ile eşleşen specification'ları bul
const findSpecificationsByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        
        const specifications = await ProductSpecification.findByProductNameAndCategory(
            product.name,
            product.category,
            product.brand
        );
        
        res.json({
            success: true,
            data: specifications,
            product: {
                id: product._id,
                name: product.name,
                category: product.category,
                brand: product.brand
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Fuzzy search
const searchSpecifications = async (req, res) => {
    try {
        const { q, category } = req.query;
        
        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Search query is required'
            });
        }
        
        const specifications = await ProductSpecification.fuzzySearch(q, category);
        
        res.json({
            success: true,
            data: specifications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Mevcut specification'lara akıllı eşleştirme yap
const rematchSpecifications = async (req, res) => {
    try {
        const { specificationId } = req.params;
        const { threshold = 0.6 } = req.query;
        
        const specification = await ProductSpecification.findById(specificationId);
        if (!specification) {
            return res.status(404).json({
                success: false,
                error: 'Specification not found'
            });
        }
        
        // Mevcut eşleştirmeleri temizle (isteğe bağlı)
        const { clearExisting = false } = req.query;
        if (clearExisting === 'true') {
            specification.matchedProducts = [];
            specification.stats.totalMatches = 0;
            await specification.save();
        }
        
        // Akıllı eşleştirme yap
        const matchCount = await performSmartMatching(specification, specification.productName, specification.category);
        
        res.json({
            success: true,
            message: `${matchCount} yeni eşleştirme bulundu`,
            matchCount,
            specificationId: specification._id
        });
    } catch (error) {
        console.error('Rematch specifications error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Tüm specification'ları yeniden eşleştir (toplu işlem)
const rematchAllSpecifications = async (req, res) => {
    try {
        const { category, limit = 10 } = req.query;
        
        const query = { isActive: true };
        if (category) {
            query.category = category;
        }
        
        const specifications = await ProductSpecification.find(query).limit(parseInt(limit));
        
        let totalMatches = 0;
        let processedCount = 0;
        
        for (const spec of specifications) {
            try {
                const matchCount = await performSmartMatching(spec, spec.productName, spec.category);
                totalMatches += matchCount;
                processedCount++;
                console.log(`Processed ${spec.productName}: ${matchCount} matches`);
            } catch (error) {
                console.error(`Error processing ${spec.productName}:`, error);
            }
        }
        
        res.json({
            success: true,
            message: `${processedCount} specification işlendi, toplamda ${totalMatches} eşleştirme bulundu`,
            processedCount,
            totalMatches
        });
    } catch (error) {
        console.error('Rematch all specifications error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Eşleşmemiş ürünleri getir
const getUnmatchedProducts = async (req, res) => {
    try {
        const { page = 1, limit = 20, category, brand, source, search, sortBy = 'currentPrice', sortOrder = 'desc' } = req.query;
        
        // Kategori mapping'i - API'den gelen display kategorilerini site kategorilerine çevir
        const categoryMappings = {
            'İşlemci': ['itopya_islemci', 'incehesap_islemci', 'sinerji_islemci'],
            'Ekran Kartı': ['itopya_ekran-karti', 'incehesap_ekran-karti', 'sinerji_ekran-karti'],
            'Anakart': ['itopya_anakart', 'incehesap_anakart', 'sinerji_anakart'],
            'RAM': ['itopya_ram', 'incehesap_ram', 'sinerji_ram'],
            'SSD': ['itopya_ssd', 'incehesap_ssd', 'sinerji_ssd'],
            'Güç Kaynağı': ['itopya_guc-kaynagi', 'incehesap_guc-kaynagi', 'sinerji_guc-kaynagi'],
            'Bilgisayar Kasası': ['itopya_bilgisayar-kasasi', 'incehesap_bilgisayar-kasası', 'sinerji_bilgisayar-kasası']
        };
        
        const matchStage = { isActive: true };
        
        // Kategoriye göre filtrele
        if (category && categoryMappings[category]) {
            matchStage.category = { $in: categoryMappings[category] };
        }
        
        // Markaya göre filtrele
        if (brand) {
            matchStage.brand = { $regex: brand, $options: 'i' };
        }
        
        // Kaynağa göre filtrele
        if (source) {
            matchStage.source = source;
        }
        
        // Ürün adına göre arama
        if (search) {
            matchStage.name = { $regex: search, $options: 'i' };
        }
        
        // Sıralama ayarları
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
        
        const pipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: 'productspecifications',
                    let: { productId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ['$$productId', '$matchedProducts.productId']
                                },
                                isActive: true
                            }
                        }
                    ],
                    as: 'specifications'
                }
            },
            {
                $match: {
                    'specifications': { $size: 0 }
                }
            },
            {
                $addFields: {
                    displayCategory: {
                        $switch: {
                            branches: [
                                { case: { $in: ['$category', ['itopya_islemci', 'incehesap_islemci', 'sinerji_islemci']] }, then: 'İşlemci' },
                                { case: { $in: ['$category', ['itopya_ekran-karti', 'incehesap_ekran-karti', 'sinerji_ekran-karti']] }, then: 'Ekran Kartı' },
                                { case: { $in: ['$category', ['itopya_anakart', 'incehesap_anakart', 'sinerji_anakart']] }, then: 'Anakart' },
                                { case: { $in: ['$category', ['itopya_ram', 'incehesap_ram', 'sinerji_ram']] }, then: 'RAM' },
                                { case: { $in: ['$category', ['itopya_ssd', 'incehesap_ssd', 'sinerji_ssd']] }, then: 'SSD' },
                                { case: { $in: ['$category', ['itopya_guc-kaynagi', 'incehesap_guc-kaynagi', 'sinerji_guc-kaynagi']] }, then: 'Güç Kaynağı' },
                                { case: { $in: ['$category', ['itopya_bilgisayar-kasasi', 'incehesap_bilgisayar-kasası', 'sinerji_bilgisayar-kasası']] }, then: 'Bilgisayar Kasası' }
                            ],
                            default: '$category'
                        }
                    },
                    priorityScore: {
                        $add: [
                            { $cond: [{ $gte: ['$currentPrice', 5000] }, 50, 0] }, // Yüksek fiyat
                            { $cond: [{ $gte: ['$currentPrice', 2000] }, 30, 0] }, // Orta fiyat
                            { $cond: [{ $gte: ['$currentPrice', 500] }, 10, 0] },  // Düşük fiyat
                            { $cond: [{ $eq: ['$source', 'itopya'] }, 20, 0] },    // Popüler site
                            { $cond: [{ $ne: ['$imageUrl', null] }, 5, 0] }        // Resmi var
                        ]
                    }
                }
            },
            { $sort: sortOptions },
            {
                $facet: {
                    data: [
                        { $skip: (page - 1) * limit },
                        { $limit: parseInt(limit) },
                        {
                            $project: {
                                name: 1,
                                brand: 1,
                                currentPrice: 1,
                                source: 1,
                                imageUrl: 1,
                                productUrl: 1,
                                displayCategory: 1,
                                priorityScore: 1,
                                scrapedAt: 1
                            }
                        }
                    ],
                    totalCount: [{ $count: 'count' }]
                }
            }
        ];
        
        const result = await Product.aggregate(pipeline);
        const products = result[0].data || [];
        const totalCount = result[0].totalCount[0]?.count || 0;
        
        res.json({
            success: true,
            data: products,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / limit),
                totalItems: totalCount,
                hasNextPage: page < Math.ceil(totalCount / limit),
                hasPrevPage: page > 1,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get unmatched products error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Specification coverage analytics
const getSpecificationCoverage = async (req, res) => {
    try {
        // Kategori mapping'i
        const categoryMappings = {
            'İşlemci': ['itopya_islemci', 'incehesap_islemci', 'sinerji_islemci'],
            'Ekran Kartı': ['itopya_ekran-karti', 'incehesap_ekran-karti', 'sinerji_ekran-karti'],
            'Anakart': ['itopya_anakart', 'incehesap_anakart', 'sinerji_anakart'],
            'RAM': ['itopya_ram', 'incehesap_ram', 'sinerji_ram'],
            'SSD': ['itopya_ssd', 'incehesap_ssd', 'sinerji_ssd'],
            'Güç Kaynağı': ['itopya_guc-kaynagi', 'incehesap_guc-kaynagi', 'sinerji_guc-kaynagi'],
            'Bilgisayar Kasası': ['itopya_bilgisayar-kasasi', 'incehesap_bilgisayar-kasası', 'sinerji_bilgisayar-kasası']
        };
        
        const coverageStats = [];
        
        for (const [displayCategory, siteCategories] of Object.entries(categoryMappings)) {
            // Toplam ürün sayısı
            const totalProducts = await Product.countDocuments({
                category: { $in: siteCategories },
                isActive: true
            });
            
            // Specification'ı olan ürün sayısı
            const productsWithSpecs = await Product.aggregate([
                { $match: { category: { $in: siteCategories }, isActive: true } },
                {
                    $lookup: {
                        from: 'productspecifications',
                        let: { productId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $in: ['$$productId', '$matchedProducts.productId']
                                    },
                                    isActive: true
                                }
                            }
                        ],
                        as: 'specifications'
                    }
                },
                {
                    $match: {
                        'specifications': { $not: { $size: 0 } }
                    }
                },
                { $count: 'count' }
            ]);
            
            const specifiedCount = productsWithSpecs[0]?.count || 0;
            const coveragePercentage = totalProducts > 0 ? ((specifiedCount / totalProducts) * 100).toFixed(1) : 0;
            
            // Toplam specification sayısı bu kategoride
            const totalSpecs = await ProductSpecification.countDocuments({
                category: displayCategory,
                isActive: true
            });
            
            coverageStats.push({
                category: displayCategory,
                totalProducts,
                specifiedProducts: specifiedCount,
                unspecifiedProducts: totalProducts - specifiedCount,
                coveragePercentage: parseFloat(coveragePercentage),
                totalSpecifications: totalSpecs
            });
        }
        
        // Genel istatistikler
        const totalProducts = coverageStats.reduce((sum, stat) => sum + stat.totalProducts, 0);
        const totalSpecified = coverageStats.reduce((sum, stat) => sum + stat.specifiedProducts, 0);
        const overallCoverage = totalProducts > 0 ? ((totalSpecified / totalProducts) * 100).toFixed(1) : 0;
        const totalSpecs = await ProductSpecification.countDocuments({ isActive: true });
        
        res.json({
            success: true,
            data: {
                overall: {
                    totalProducts,
                    specifiedProducts: totalSpecified,
                    unspecifiedProducts: totalProducts - totalSpecified,
                    coveragePercentage: parseFloat(overallCoverage),
                    totalSpecifications: totalSpecs
                },
                byCategory: coverageStats
            }
        });
    } catch (error) {
        console.error('Get specification coverage error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Specific specification'ı tüm ürünlerle yeniden eşleştir
const rematchSingleSpecification = async (req, res) => {
    try {
        const { specificationId } = req.params;
        
        // Specification'ı bul
        const specification = await ProductSpecification.findById(specificationId);
        if (!specification) {
            return res.status(404).json({
                success: false,
                error: 'Specification not found'
            });
        }
        
        console.log(`Re-matching specification: ${specification.productName} (${specification.category})`);
        
        // Existing matches'lerin similarity değerlerini güncelle (migration)
        let updatedExisting = false;
        for (let match of specification.matchedProducts) {
            if (!match.similarity && match.confidence) {
                // Eski confidence değerini similarity olarak kullan
                match.similarity = match.confidence;
                updatedExisting = true;
            } else if (!match.similarity) {
                // Hiç similarity/confidence yoksa yeniden hesapla
                try {
                    const product = await Product.findById(match.productId);
                    if (product) {
                        match.similarity = calculateSimilarity(specification.productName, product.name, specification.category);
                        updatedExisting = true;
                    }
                } catch (error) {
                    console.log(`Could not recalculate similarity for match ${match.productId}:`, error.message);
                    match.similarity = 0.5; // Default değer
                    updatedExisting = true;
                }
            }
        }
        
        if (updatedExisting) {
            console.log(`Updated similarity values for existing matches`);
        }
        
        // İlgili kategorideki tüm ürünleri bul
        const categoryMappings = {
            'İşlemci': ['itopya_islemci', 'incehesap_islemci', 'sinerji_islemci'],
            'Ekran Kartı': ['itopya_ekran-karti', 'incehesap_ekran-karti', 'sinerji_ekran-karti'],
            'Anakart': ['itopya_anakart', 'incehesap_anakart', 'sinerji_anakart'],
            'RAM': ['itopya_ram', 'incehesap_ram', 'sinerji_ram'],
            'SSD': ['itopya_ssd', 'incehesap_ssd', 'sinerji_ssd'],
            'Güç Kaynağı': ['itopya_guc-kaynagi', 'incehesap_guc-kaynagi', 'sinerji_guc-kaynagi'],
            'Bilgisayar Kasası': ['itopya_bilgisayar-kasasi', 'incehesap_bilgisayar-kasası', 'sinerji_bilgisayar-kasası']
        };
        
        const relevantCategories = categoryMappings[specification.category];
        if (!relevantCategories) {
            return res.status(400).json({
                success: false,
                error: 'Invalid category'
            });
        }
        
        // İlgili kategorideki tüm ürünleri getir
        const products = await Product.find({
            category: { $in: relevantCategories },
            isActive: true
        }).lean();
        
        console.log(`Found ${products.length} products in category ${specification.category}`);
        
        let matchedProducts = [];
        let matchCount = 0;
        
        // Her ürün için similarity hesapla
        for (const product of products) {
            const similarity = calculateSimilarity(specification.productName, product.name, specification.category);
            
            if (similarity >= 0.7) { // Balanced threshold for automatic matching
                console.log(`Match found: ${product.name} (similarity: ${similarity})`);
                matchedProducts.push({
                    productId: product._id,
                    productName: product.name,
                    confidence: similarity,
                    source: product.source,
                    matchedAt: new Date()
                });
                matchCount++;
            }
        }
        
        // Specification'ı güncelle
        await ProductSpecification.findByIdAndUpdate(specificationId, {
            matchedProducts: matchedProducts,
            totalMatches: matchCount,
            lastMatchedAt: new Date()
        });
        
        console.log(`Re-matching completed. Found ${matchCount} matches for ${specification.productName}`);
        
        res.json({
            success: true,
            message: `Re-matching completed for ${specification.productName}`,
            data: {
                specificationId,
                productName: specification.productName,
                category: specification.category,
                newMatches: matchCount,
                matchedProducts: matchedProducts
            }
        });
        
    } catch (error) {
        console.error('Rematch single specification error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Specification'dan product match'ini kaldır
const removeProductMatch = async (req, res) => {
    try {
        const { specificationId, productId } = req.params;
        
        const specification = await ProductSpecification.findById(specificationId);
        if (!specification) {
            return res.status(404).json({
                success: false,
                error: 'Specification not found'
            });
        }
        
        // Eşleşmeyi kaldır
        specification.matchedProducts = specification.matchedProducts.filter(
            match => match.productId.toString() !== productId
        );
        specification.totalMatches = specification.matchedProducts.length;
        
        await specification.save();
        
        res.json({
            success: true,
            message: 'Product match removed successfully',
            data: {
                specificationId,
                productId,
                remainingMatches: specification.totalMatches
            }
        });
        
    } catch (error) {
        console.error('Remove product match error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Manuel olarak product match'i ekle
const addProductMatch = async (req, res) => {
    try {
        const { specificationId, productId } = req.params;
        const { confidence = 1.0 } = req.body || {};
        
        const specification = await ProductSpecification.findById(specificationId);
        if (!specification) {
            return res.status(404).json({
                success: false,
                error: 'Specification not found'
            });
        }
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        
        // Zaten eşleşme var mı kontrol et
        const existingMatch = specification.matchedProducts.find(
            match => match.productId.toString() === productId
        );
        
        if (existingMatch) {
            return res.status(400).json({
                success: false,
                error: 'Product already matched'
            });
        }
        
        // Benzerlik hesapla ve manuel eşleşme ekle
        const similarity = calculateSimilarity(specification.productName, product.name, specification.category);
        
        // Yeni eşleşme ekle
        specification.matchedProducts.push({
            productId: product._id,
            productName: product.name,
            confidence: similarity, // calculateSimilarity sonucunu confidence olarak kullan
            similarity: similarity, // Hem similarity hem confidence set et
            source: product.source,
            matchedAt: new Date(),
            manualMatch: true // Manuel eşleştirme işareti
        });
        
        specification.totalMatches = specification.matchedProducts.length;
        specification.lastMatchedAt = new Date();
        
        await specification.save();
        
        res.json({
            success: true,
            message: 'Product match added successfully',
            data: {
                specificationId,
                productId,
                productName: product.name,
                confidence,
                totalMatches: specification.totalMatches
            }
        });
        
    } catch (error) {
        console.error('Add product match error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Specification için potansiyel eşleşmeleri bul (manuel seçim için)
const findPotentialMatches = async (req, res) => {
    try {
        const { specificationId } = req.params;
        const { search, limit = 50 } = req.query;
        
        const specification = await ProductSpecification.findById(specificationId);
        if (!specification) {
            return res.status(404).json({
                success: false,
                error: 'Specification not found'
            });
        }
        
        // Kategori mapping
        const categoryMappings = {
            'İşlemci': ['itopya_islemci', 'incehesap_islemci', 'sinerji_islemci'],
            'Ekran Kartı': ['itopya_ekran-karti', 'incehesap_ekran-karti', 'sinerji_ekran-karti'],
            'Anakart': ['itopya_anakart', 'incehesap_anakart', 'sinerji_anakart'],
            'RAM': ['itopya_ram', 'incehesap_ram', 'sinerji_ram'],
            'SSD': ['itopya_ssd', 'incehesap_ssd', 'sinerji_ssd'],
            'Güç Kaynağı': ['itopya_guc-kaynagi', 'incehesap_guc-kaynagi', 'sinerji_guc-kaynagi'],
            'Bilgisayar Kasası': ['itopya_bilgisayar-kasasi', 'incehesap_bilgisayar-kasası', 'sinerji_bilgisayar-kasası']
        };
        
        const relevantCategories = categoryMappings[specification.category];
        
        // Arama query'si oluştur
        let productQuery = {
            category: { $in: relevantCategories },
            isActive: true
        };
        
        if (search) {
            productQuery.name = { $regex: search, $options: 'i' };
        }
        
        // Zaten eşleşen ürünleri hariç tut
        const matchedProductIds = specification.matchedProducts.map(match => match.productId);
        if (matchedProductIds.length > 0) {
            productQuery._id = { $nin: matchedProductIds };
        }
        
        const products = await Product.find(productQuery)
            .limit(parseInt(limit))
            .lean();
        
        // HIZLI VE OPTİMİZE EDİLMİŞ SIMILARITY HESAPLAMA
        const startTime = Date.now();
        const potentialMatches = [];
        const debugStats = { processed: 0, filtered: 0, highMatches: 0 };
        
        for (const product of products) {
            debugStats.processed++;
            const similarity = calculateSimilarity(specification.productName, product.name, specification.category);
            
            // Erken filtreleme - çok düşük skorları atla
            if (similarity >= 0.1) {  // Minimum threshold
                debugStats.filtered++;
                
                const match = {
                    productId: product._id,
                    productName: product.name,
                    currentPrice: product.currentPrice,
                    source: product.source,
                    imageUrl: product.imageUrl,
                    similarity: parseFloat(similarity.toFixed(3)),
                    category: product.category,
                    brand: product.brand,
                    isHighMatch: similarity >= 0.7,
                    // Debug bilgileri ekle
                    specFeatures: extractKeyFeatures(specification.productName),
                    productFeatures: extractKeyFeatures(product.name)
                };
                
                if (match.isHighMatch) debugStats.highMatches++;
                potentialMatches.push(match);
            }
        }
        
        // Similarity'e göre sırala ve en iyi 20'yi al
        potentialMatches.sort((a, b) => b.similarity - a.similarity);
        const topMatches = potentialMatches.slice(0, 20);  // Sadece top 20
        
        const processingTime = Date.now() - startTime;
        console.log(`🚀 Fast matching: ${debugStats.processed} processed, ${debugStats.filtered} candidates, ${debugStats.highMatches} high matches in ${processingTime}ms`);
        
        res.json({
            success: true,
            data: {
                specification: {
                    id: specification._id,
                    productName: specification.productName,
                    category: specification.category,
                    currentMatches: specification.totalMatches,
                    features: extractKeyFeatures(specification.productName)  // Debug için
                },
                potentialMatches: topMatches,
                searchQuery: search,
                totalFound: topMatches.length,
                totalProcessed: debugStats.processed,
                stats: {
                    ...debugStats,
                    processingTimeMs: processingTime,
                    averageScoreTop10: topMatches.slice(0, 10).reduce((sum, m) => sum + m.similarity, 0) / Math.min(10, topMatches.length)
                }
            }
        });
        
    } catch (error) {
        console.error('Find potential matches error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Model varyantlarını kontrol et (Ti, Super, XT vs normal model)
const checkModelVariants = (spec, product) => {
    // Model varyant suffixleri
    const variants = ['ti', 'super', 'xt', 'xe', 'pro', 'max', 'ultra', 'boost', 'oc'];
    
    // Her iki stringi de temizle
    const cleanSpec = spec.toLowerCase().replace(/\s+/g, '');
    const cleanProduct = product.toLowerCase().replace(/\s+/g, '');
    
    // Ana model numarasını çıkar (örn: rtx4070, rx6700)
    const specBase = cleanSpec.replace(new RegExp(`(${variants.join('|')})$`, 'i'), '');
    const productBase = cleanProduct.replace(new RegExp(`(${variants.join('|')})$`, 'i'), '');
    
    // Ana model aynı mı?
    if (specBase === productBase) {
        // Aynı ana model, varyant farkını kontrol et
        const specVariant = cleanSpec.replace(specBase, '').toLowerCase();
        const productVariant = cleanProduct.replace(productBase, '').toLowerCase();
        
        if (specVariant === productVariant) {
            return 0.95; // Tam eşleşme (RTX 5060 Ti = RTX 5060 Ti)
        } else if (specVariant === '' || productVariant === '') {
            // Biri normal, diğeri varyant (RTX 5060 vs RTX 5060 Ti)
            return 0.0; // Eşleştirme! Farklı modeller
        } else {
            // İkisi de varyant ama farklı (RTX 5060 Ti vs RTX 5060 Super)
            return 0.0; // Eşleştirme! Farklı varyantlar
        }
    }
    
    // Yakın eşleşme kontrolü - sadece varyant yoksa
    const hasSpecVariant = variants.some(v => cleanSpec.endsWith(v));
    const hasProductVariant = variants.some(v => cleanProduct.endsWith(v));
    
    if (!hasSpecVariant && !hasProductVariant) {
        // İkisi de normal model, includes kontrolü yapabilir
        if (cleanSpec.includes(cleanProduct) || cleanProduct.includes(cleanSpec)) {
            return 0.85;
        }
    }
    
    return -1; // Kontrol geçersiz, diğer kontrollere geç
};

// Tüm eşleştirmeleri temizle
const clearAllMatches = async (req, res) => {
    try {
        console.log('🧹 Starting to clear all product matches...');
        
        // Tüm specification'ları güncelle
        const result = await ProductSpecification.updateMany(
            { 'matchedProducts.0': { $exists: true } }, // Eşleştirmesi olan specification'lar
            { 
                $set: { 
                    matchedProducts: [],
                    'stats.totalMatches': 0,
                    'stats.lastMatchedAt': null
                }
            }
        );
        
        console.log(`✅ Cleared matches from ${result.modifiedCount} specifications`);
        
        res.json({
            success: true,
            message: `Successfully cleared all matches from ${result.modifiedCount} specifications`,
            clearedCount: result.modifiedCount
        });
        
    } catch (error) {
        console.error('Clear all matches error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Düşük kaliteli eşleşmeleri temizle
const cleanupLowQualityMatches = async (req, res) => {
    try {
        console.log('Starting cleanup of low quality matches...');
        
        const specifications = await ProductSpecification.find({ isActive: true });
        let totalCleaned = 0;
        
        for (const spec of specifications) {
            let cleanedCount = 0;
            const originalMatchCount = spec.matchedProducts.length;
            
            // Her eşleşmeyi yeniden değerlendir
            const validMatches = [];
            
            for (const match of spec.matchedProducts) {
                try {
                    // Product bilgisini al
                    const product = await Product.findById(match.productId);
                    if (!product || !product.isActive) {
                        cleanedCount++;
                        continue; // Geçersiz ürün, ekle
                    }
                    
                    // Similarity'yi yeniden hesapla
                    const recalculatedSimilarity = calculateSimilarity(spec.productName, product.name, spec.category);
                    
                    // Dengeli threshold'a göre filtrele
                    if (recalculatedSimilarity >= 0.65) {
                        validMatches.push({
                            ...match,
                            similarity: recalculatedSimilarity // Updated similarity
                        });
                    } else {
                        cleanedCount++;
                        console.log(`Removing low quality match: "${product.name}" (similarity: ${recalculatedSimilarity.toFixed(3)})`);
                    }
                } catch (error) {
                    console.error(`Error processing match ${match.productId}:`, error);
                    cleanedCount++;
                }
            }
            
            // Güncelle
            if (cleanedCount > 0) {
                spec.matchedProducts = validMatches;
                spec.stats.totalMatches = validMatches.length;
                await spec.save();
                
                console.log(`Cleaned ${cleanedCount} matches from "${spec.productName}" (${originalMatchCount} -> ${validMatches.length})`);
                totalCleaned += cleanedCount;
            }
        }
        
        res.json({
            success: true,
            message: `Cleanup completed. Removed ${totalCleaned} low quality matches from ${specifications.length} specifications.`,
            stats: {
                totalSpecifications: specifications.length,
                totalMatchesRemoved: totalCleaned
            }
        });
    } catch (error) {
        console.error('Cleanup error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Akıllı eşleştirme fonksiyonu - asıl implementasyon
const performSmartMatching = async (specificationId, productName, category) => {
    try {
        console.log(`🎯 Starting smart matching for: "${productName}" in category: ${category}`);
        
        // Specification'ı bul
        const specification = await ProductSpecification.findById(specificationId);
        if (!specification) {
            throw new Error('Specification not found');
        }
        
        // Kategori mapping - display kategorilerini site kategorilerine çevir
        const categoryMapping = getCategoriesForDisplay(category);
        
        // İlgili kategorideki tüm ürünleri bul
        const products = await Product.find({
            category: { $in: categoryMapping },
            isActive: true
        }).lean();
        
        console.log(`Found ${products.length} products in categories: ${categoryMapping.join(', ')}`);
        
        let matchCount = 0;
        const matches = [];
        
        // Her ürün için similarity hesapla
        for (const product of products) {
            const similarity = calculateSimilarity(productName, product.name, category);
            
            // Dengeli threshold - otomatik eşleştirme için
            if (similarity >= 0.7) {
                console.log(`✅ Match found: "${product.name}" (similarity: ${similarity.toFixed(3)})`);
                
                matches.push({
                    productId: product._id,
                    productName: product.name,
                    confidence: similarity,
                    source: product.source,
                    matchedAt: new Date()
                });
                matchCount++;
            } else if (similarity >= 0.5) {
                console.log(`⚠️ Potential match (below threshold): "${product.name}" (similarity: ${similarity.toFixed(3)})`);
            }
        }
        
        // Eşleştirmeleri specification'a ekle
        if (matches.length > 0) {
            specification.matchedProducts = matches;
            specification.stats.totalMatches = matchCount;
            specification.stats.lastMatchedAt = new Date();
            await specification.save();
            
            console.log(`🎉 Smart matching completed: ${matchCount} matches found for "${productName}"`);
        } else {
            console.log(`😞 No matches found for "${productName}"`);
        }
        
        return matchCount;
        
    } catch (error) {
        console.error('Smart matching error:', error);
        throw error;
    }
};

// ===== PRODUCT COMPARISON FUNCTIONS =====

// Compare multiple products by their IDs
const compareProducts = async (req, res) => {
    try {
        const { productIds } = req.body;
        
        if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'En az 2 ürün ID\'si gerekli (productIds array)'
            });
        }
        
        if (productIds.length > 10) {
            return res.status(400).json({
                success: false,
                error: 'Maksimum 10 ürün karşılaştırılabilir'
            });
        }
        
        // Ürünleri getir
        const products = await Product.find({
            _id: { $in: productIds },
            isActive: true
        }).lean();
        
        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Hiçbir ürün bulunamadı'
            });
        }
        
        // Her ürün için teknik özellik bulunca
        const comparisonData = [];
        for (const product of products) {
            // Ürünün teknik özelliklerini bul
            const specifications = await ProductSpecification.find({
                'matchedProducts.productId': product._id,
                isActive: true
            }).lean();
            
            const productData = {
                id: product._id,
                name: product.name,
                brand: product.brand,
                category: product.category,
                currentPrice: product.currentPrice,
                source: product.source,
                productUrl: product.productUrl,
                imageUrl: product.imageUrl,
                specifications: specifications.map(spec => ({
                    id: spec._id,
                    productName: spec.productName,
                    specifications: spec.specifications,
                    formattedSpecs: spec.formattedSpecs
                }))
            };
            
            comparisonData.push(productData);
        }
        
        // Kategori kontrolü - farklı kategorileri uyar
        const categories = [...new Set(products.map(p => p.category))];
        const hasMultipleCategories = categories.length > 1;
        
        res.json({
            success: true,
            comparison: {
                products: comparisonData,
                totalProducts: comparisonData.length,
                categories: categories,
                hasMultipleCategories: hasMultipleCategories,
                warning: hasMultipleCategories ? 'Farklı kategorilerden ürünler karşılaştırılıyor' : null,
                generatedAt: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Product comparison error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get comparison data with detailed specification matching
const getComparisonData = async (req, res) => {
    try {
        const { productIds, includeSpecs = true } = req.query;
        
        if (!productIds) {
            return res.status(400).json({
                success: false,
                error: 'productIds parametresi gerekli (virgülle ayrılmış)'
            });
        }
        
        const idsArray = productIds.split(',').map(id => id.trim());
        
        if (idsArray.length < 2 || idsArray.length > 10) {
            return res.status(400).json({
                success: false,
                error: 'En az 2, en fazla 10 ürün karşılaştırılabilir'
            });
        }
        
        // Ürünleri getir ve teknik özelliklerini match et
        const products = await Product.find({
            _id: { $in: idsArray },
            isActive: true
        }).lean();
        
        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Hiçbir ürün bulunamadı'
            });
        }
        
        const enrichedProducts = [];
        
        for (const product of products) {
            let productSpecs = null;
            
            if (includeSpecs === 'true') {
                // Bu ürün için teknik özellik var mı?
                const specification = await ProductSpecification.findOne({
                    'matchedProducts.productId': product._id,
                    isActive: true
                }).lean();
                
                if (specification) {
                    productSpecs = {
                        id: specification._id,
                        productName: specification.productName,
                        specifications: specification.specifications,
                        formattedSpecs: specification.formattedSpecs,
                        category: specification.category,
                        brand: specification.brand
                    };
                }
            }
            
            enrichedProducts.push({
                ...product,
                hasSpecifications: !!productSpecs,
                specifications: productSpecs
            });
        }
        
        // Fiyat karşılaştırması
        const prices = enrichedProducts.map(p => p.currentPrice).filter(p => p != null);
        const priceAnalysis = prices.length > 0 ? {
            min: Math.min(...prices),
            max: Math.max(...prices),
            avg: prices.reduce((a, b) => a + b, 0) / prices.length,
            difference: Math.max(...prices) - Math.min(...prices)
        } : null;
        
        res.json({
            success: true,
            comparison: {
                products: enrichedProducts,
                totalProducts: enrichedProducts.length,
                priceAnalysis: priceAnalysis,
                specsAvailable: enrichedProducts.filter(p => p.hasSpecifications).length,
                categories: [...new Set(products.map(p => p.category))],
                sources: [...new Set(products.map(p => p.source))],
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Get comparison data error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Generate structured comparison table
const generateComparisonTable = async (req, res) => {
    try {
        const { productIds, category } = req.body;
        
        if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'En az 2 ürün ID\'si gerekli'
            });
        }
        
        // Ürünleri getir
        const products = await Product.find({
            _id: { $in: productIds },
            isActive: true
        }).lean();
        
        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Hiçbir ürün bulunamadı'
            });
        }
        
        // Her ürün için teknik özellik getir
        const productSpecs = {};
        const allSpecKeys = new Set();
        
        for (const product of products) {
            const specification = await ProductSpecification.findOne({
                'matchedProducts.productId': product._id,
                isActive: true
            }).lean();
            
            if (specification && specification.specifications) {
                productSpecs[product._id] = specification.specifications;
                Object.keys(specification.specifications).forEach(key => allSpecKeys.add(key));
            } else {
                productSpecs[product._id] = {};
            }
        }
        
        // Karşılaştırma tablosu oluştur
        const comparisonTable = [];
        const specTemplate = category && specificationTemplates[category] 
            ? specificationTemplates[category] 
            : {};
        
        // Her spec field için satır oluştur
        allSpecKeys.forEach(specKey => {
            const row = {
                specKey: specKey,
                specLabel: specTemplate[specKey]?.label || specKey,
                specType: specTemplate[specKey]?.type || 'text',
                specUnit: specTemplate[specKey]?.unit || '',
                values: {}
            };
            
            // Her ürün için bu spec'in değerini ekle
            products.forEach(product => {
                const value = productSpecs[product._id][specKey];
                row.values[product._id] = {
                    value: value || null,
                    displayValue: formatSpecValue(value, specTemplate[specKey])
                };
            });
            
            comparisonTable.push(row);
        });
        
        // Temel ürün bilgileri satırları
        const basicInfo = [
            {
                specKey: 'name',
                specLabel: 'Ürün Adı',
                specType: 'text',
                values: Object.fromEntries(products.map(p => [p._id, { value: p.name, displayValue: p.name }]))
            },
            {
                specKey: 'brand',
                specLabel: 'Marka',
                specType: 'text',
                values: Object.fromEntries(products.map(p => [p._id, { value: p.brand, displayValue: p.brand || 'Belirtilmemiş' }]))
            },
            {
                specKey: 'currentPrice',
                specLabel: 'Güncel Fiyat',
                specType: 'price',
                specUnit: '₺',
                values: Object.fromEntries(products.map(p => [p._id, { 
                    value: p.currentPrice, 
                    displayValue: p.currentPrice ? `₺${p.currentPrice.toLocaleString()}` : 'Fiyat yok'
                }]))
            },
            {
                specKey: 'source',
                specLabel: 'Kaynak',
                specType: 'text',
                values: Object.fromEntries(products.map(p => [p._id, { value: p.source, displayValue: p.source }]))
            }
        ];
        
        res.json({
            success: true,
            comparisonTable: {
                products: products.map(p => ({
                    id: p._id,
                    name: p.name,
                    brand: p.brand,
                    currentPrice: p.currentPrice,
                    source: p.source,
                    imageUrl: p.imageUrl,
                    productUrl: p.productUrl,
                    hasSpecifications: Object.keys(productSpecs[p._id]).length > 0
                })),
                basicInfo: basicInfo,
                specifications: comparisonTable,
                categories: [...new Set(products.map(p => p.category))],
                totalSpecs: allSpecKeys.size,
                generatedAt: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Generate comparison table error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Helper function to format specification values
const formatSpecValue = (value, template) => {
    if (value === null || value === undefined || value === '') {
        return 'Belirtilmemiş';
    }
    
    if (template) {
        if (template.type === 'number' && template.unit) {
            return `${value} ${template.unit}`;
        }
        if (template.type === 'boolean') {
            return value ? 'Evet' : 'Hayır';
        }
    }
    
    return value.toString();
};

// ===== FRONTEND-SPECIFIC ENDPOINTS =====

// Get all products that have specifications (for frontend listing)
const getProductsWithSpecifications = async (req, res) => {
    try {
        const { 
            category, 
            page = 1, 
            limit = 20, 
            search,
            minPrice,
            maxPrice,
            source,
            sortBy = 'currentPrice',
            sortOrder = 'asc'
        } = req.query;
        
        // Get all specification IDs with matched products
        const specificationsWithProducts = await ProductSpecification.find({
            isActive: true,
            'matchedProducts.0': { $exists: true } // Has at least one matched product
        }).select('matchedProducts.productId').lean();
        
        // Extract all product IDs that have specifications
        const productIdsWithSpecs = specificationsWithProducts
            .flatMap(spec => spec.matchedProducts.map(match => match.productId))
            .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates
        
        // Build product filter
        const productFilter = {
            _id: { $in: productIdsWithSpecs },
            isActive: true
        };
        
        // Add category filter (map display category to site categories)
        if (category) {
            const siteCategories = getCategoriesForDisplay(category);
            productFilter.category = { $in: siteCategories };
        }
        
        // Add price filter
        if (minPrice || maxPrice) {
            productFilter.currentPrice = {};
            if (minPrice) productFilter.currentPrice.$gte = parseFloat(minPrice);
            if (maxPrice) productFilter.currentPrice.$lte = parseFloat(maxPrice);
        }
        
        // Add source filter
        if (source) {
            productFilter.source = source;
        }
        
        // Add search filter
        if (search) {
            productFilter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Get products with pagination
        const sortDirection = sortOrder === 'desc' ? -1 : 1;
        const [products, total] = await Promise.all([
            Product.find(productFilter)
                .sort({ [sortBy]: sortDirection })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .lean(),
            Product.countDocuments(productFilter)
        ]);
        
        // Enrich products with their specifications
        const enrichedProducts = [];
        for (const product of products) {
            const specification = await ProductSpecification.findOne({
                'matchedProducts.productId': product._id,
                isActive: true
            }).lean();
            
            enrichedProducts.push({
                ...product,
                hasSpecifications: true,
                specificationId: specification?._id,
                specificationName: specification?.productName,
                specificationCategory: specification?.category
            });
        }
        
        res.json({
            success: true,
            products: enrichedProducts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalProducts: total,
                productsPerPage: parseInt(limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1
            },
            filters: {
                category,
                search,
                minPrice,
                maxPrice,
                source,
                sortBy,
                sortOrder
            }
        });
        
    } catch (error) {
        console.error('Get products with specifications error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get specifications by category (for frontend category browsing)
const getSpecificationsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const { page = 1, limit = 50, search, hasProducts = true } = req.query;
        
        if (!category) {
            return res.status(400).json({
                success: false,
                error: 'Category parameter is required'
            });
        }
        
        const filter = {
            category: category,
            isActive: true
        };
        
        // Filter only specifications that have matched products
        if (hasProducts === 'true') {
            filter['matchedProducts.0'] = { $exists: true };
        }
        
        // Add search filter
        if (search) {
            filter.$or = [
                { productName: { $regex: search, $options: 'i' } },
                { cleanProductName: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ];
        }
        
        const [specifications, total] = await Promise.all([
            ProductSpecification.find(filter)
                .populate('matchedProducts.productId', 'name currentPrice source brand imageUrl productUrl')
                .sort({ verifiedAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .lean(),
            ProductSpecification.countDocuments(filter)
        ]);
        
        // Format specifications for frontend
        const formattedSpecs = specifications.map(spec => ({
            id: spec._id,
            productName: spec.productName,
            cleanProductName: spec.cleanProductName,
            category: spec.category,
            brand: spec.brand,
            specifications: spec.specifications,
            formattedSpecs: spec.formattedSpecs,
            matchedProductsCount: spec.matchedProducts?.length || 0,
            matchedProducts: spec.matchedProducts?.map(match => ({
                id: match.productId._id,
                name: match.productId.name,
                currentPrice: match.productId.currentPrice,
                source: match.productId.source,
                brand: match.productId.brand,
                imageUrl: match.productId.imageUrl,
                productUrl: match.productId.productUrl,
                confidence: match.confidence
            })) || [],
            verifiedAt: spec.verifiedAt,
            isActive: spec.isActive
        }));
        
        res.json({
            success: true,
            category: category,
            specifications: formattedSpecs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalSpecifications: total,
                specificationsPerPage: parseInt(limit)
            },
            filters: {
                search,
                hasProducts
            }
        });
        
    } catch (error) {
        console.error('Get specifications by category error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get detailed specification for a specific product (for frontend product pages)
const getProductSpecificationDetails = async (req, res) => {
    try {
        const { productId } = req.params;
        
        if (!productId) {
            return res.status(400).json({
                success: false,
                error: 'Product ID is required'
            });
        }
        
        // Get the product
        const product = await Product.findById(productId).lean();
        
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        
        // Find specification for this product
        const specification = await ProductSpecification.findOne({
            'matchedProducts.productId': productId,
            isActive: true
        }).lean();
        
        if (!specification) {
            return res.json({
                success: true,
                product: product,
                hasSpecifications: false,
                message: 'No technical specifications found for this product'
            });
        }
        
        // Get category template for proper field formatting
        const categoryTemplate = specificationTemplates[specification.category] || {};
        
        // Format specifications with proper labels and units
        const formattedSpecifications = {};
        if (specification.specifications) {
            Object.entries(specification.specifications).forEach(([key, value]) => {
                const template = categoryTemplate[key];
                formattedSpecifications[key] = {
                    key: key,
                    label: template?.label || key,
                    value: value,
                    displayValue: formatSpecValue(value, template),
                    type: template?.type || 'text',
                    unit: template?.unit || ''
                };
            });
        }
        
        // Find confidence score for this specific product match
        const matchInfo = specification.matchedProducts?.find(
            match => match.productId.toString() === productId
        );
        
        res.json({
            success: true,
            product: product,
            hasSpecifications: true,
            specification: {
                id: specification._id,
                productName: specification.productName,
                cleanProductName: specification.cleanProductName,
                category: specification.category,
                brand: specification.brand,
                specifications: formattedSpecifications,
                rawSpecifications: specification.specifications,
                matchConfidence: matchInfo?.confidence || null,
                totalMatchedProducts: specification.matchedProducts?.length || 0,
                verifiedAt: specification.verifiedAt
            }
        });
        
    } catch (error) {
        console.error('Get product specification details error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ===== DIRECT MATCHING DATA ENDPOINTS =====

// Get all product-specification matching data
const getAllMatchingData = async (req, res) => {
    try {
        const { 
            format = 'detailed',
            category,
            includeUnmatched = false,
            page = 1,
            limit = 100
        } = req.query;
        
        const filter = { isActive: true };
        if (category) filter.category = category;
        
        // If includeUnmatched is false, only get specs with matches
        if (includeUnmatched !== 'true') {
            filter['matchedProducts.0'] = { $exists: true };
        }
        
        const [specifications, total] = await Promise.all([
            ProductSpecification.find(filter)
                .populate('matchedProducts.productId', 'name currentPrice source brand imageUrl productUrl category')
                .sort({ category: 1, productName: 1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .lean(),
            ProductSpecification.countDocuments(filter)
        ]);
        
        if (format === 'simple') {
            // Simple format: flat array of product-spec relationships
            const simpleMatches = [];
            specifications.forEach(spec => {
                spec.matchedProducts?.forEach(match => {
                    if (match.productId) {
                        simpleMatches.push({
                            productId: match.productId._id,
                            productName: match.productId.name,
                            productPrice: match.productId.currentPrice,
                            productSource: match.productId.source,
                            productCategory: match.productId.category,
                            specificationId: spec._id,
                            specificationName: spec.productName,
                            specificationCategory: spec.category,
                            specificationBrand: spec.brand,
                            confidence: match.confidence,
                            matchedAt: match.matchedAt
                        });
                    }
                });
            });
            
            return res.json({
                success: true,
                format: 'simple',
                matches: simpleMatches,
                totalMatches: simpleMatches.length,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalSpecifications: total
                }
            });
        }
        
        // Detailed format: full specification objects with matched products
        const detailedData = specifications.map(spec => ({
            specificationId: spec._id,
            specificationName: spec.productName,
            cleanProductName: spec.cleanProductName,
            category: spec.category,
            brand: spec.brand,
            specifications: spec.specifications,
            formattedSpecs: spec.formattedSpecs,
            totalMatches: spec.matchedProducts?.length || 0,
            matchedProducts: spec.matchedProducts?.map(match => ({
                productId: match.productId._id,
                productName: match.productId.name,
                currentPrice: match.productId.currentPrice,
                source: match.productId.source,
                brand: match.productId.brand,
                category: match.productId.category,
                imageUrl: match.productId.imageUrl,
                productUrl: match.productId.productUrl,
                confidence: match.confidence,
                matchedAt: match.matchedAt
            })) || [],
            verifiedAt: spec.verifiedAt,
            createdAt: spec.createdAt
        }));
        
        res.json({
            success: true,
            format: 'detailed',
            matchingData: detailedData,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalSpecifications: total,
                specificationsPerPage: parseInt(limit)
            },
            summary: {
                totalSpecifications: total,
                totalMatches: detailedData.reduce((sum, spec) => sum + spec.totalMatches, 0),
                categories: [...new Set(detailedData.map(spec => spec.category))]
            }
        });
        
    } catch (error) {
        console.error('Get all matching data error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get matching data by specific category  
const getMatchingDataByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const { format = 'detailed', includeStats = true } = req.query;
        
        if (!category) {
            return res.status(400).json({
                success: false,
                error: 'Category parameter is required'
            });
        }
        
        const specifications = await ProductSpecification.find({
            category: category,
            isActive: true,
            'matchedProducts.0': { $exists: true }
        })
        .populate('matchedProducts.productId', 'name currentPrice source brand imageUrl productUrl category')
        .sort({ productName: 1 })
        .lean();
        
        if (format === 'export') {
            // Export format: ready for CSV/Excel
            const exportData = [];
            specifications.forEach(spec => {
                spec.matchedProducts?.forEach(match => {
                    if (match.productId) {
                        const row = {
                            'Specification ID': spec._id,
                            'Specification Name': spec.productName,
                            'Category': spec.category,
                            'Brand': spec.brand,
                            'Product ID': match.productId._id,
                            'Product Name': match.productId.name,
                            'Product Price': match.productId.currentPrice,
                            'Product Source': match.productId.source,
                            'Product Brand': match.productId.brand,
                            'Confidence Score': match.confidence,
                            'Matched Date': match.matchedAt
                        };
                        
                        // Add technical specifications as columns
                        if (spec.specifications) {
                            Object.entries(spec.specifications).forEach(([key, value]) => {
                                row[`Spec_${key}`] = value;
                            });
                        }
                        
                        exportData.push(row);
                    }
                });
            });
            
            return res.json({
                success: true,
                format: 'export',
                category: category,
                exportData: exportData,
                totalRows: exportData.length
            });
        }
        
        // Standard detailed format
        const matchingData = specifications.map(spec => ({
            specificationId: spec._id,
            specificationName: spec.productName,
            category: spec.category,
            brand: spec.brand,
            specifications: spec.specifications,
            matchedProducts: spec.matchedProducts?.map(match => ({
                productId: match.productId._id,
                productName: match.productId.name,
                currentPrice: match.productId.currentPrice,
                source: match.productId.source,
                confidence: match.confidence,
                matchedAt: match.matchedAt
            })) || []
        }));
        
        const response = {
            success: true,
            category: category,
            matchingData: matchingData,
            totalSpecifications: matchingData.length,
            totalMatches: matchingData.reduce((sum, spec) => sum + spec.matchedProducts.length, 0)
        };
        
        // Add statistics if requested
        if (includeStats === 'true') {
            const stats = {
                avgMatchesPerSpec: matchingData.length > 0 
                    ? (response.totalMatches / matchingData.length).toFixed(2) 
                    : 0,
                confidenceDistribution: {
                    high: 0, // >= 0.9
                    medium: 0, // 0.7-0.89
                    low: 0 // < 0.7
                },
                sourceDistribution: {},
                priceRange: {
                    min: null,
                    max: null,
                    avg: null
                }
            };
            
            const allMatches = matchingData.flatMap(spec => spec.matchedProducts);
            const prices = allMatches.map(m => m.currentPrice).filter(p => p != null);
            
            // Calculate confidence distribution
            allMatches.forEach(match => {
                if (match.confidence >= 0.9) stats.confidenceDistribution.high++;
                else if (match.confidence >= 0.7) stats.confidenceDistribution.medium++;
                else stats.confidenceDistribution.low++;
                
                // Source distribution
                const source = match.source;
                stats.sourceDistribution[source] = (stats.sourceDistribution[source] || 0) + 1;
            });
            
            // Price statistics
            if (prices.length > 0) {
                stats.priceRange.min = Math.min(...prices);
                stats.priceRange.max = Math.max(...prices);
                stats.priceRange.avg = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
            }
            
            response.statistics = stats;
        }
        
        res.json(response);
        
    } catch (error) {
        console.error('Get matching data by category error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Bulk create matches from external data
const bulkCreateMatches = async (req, res) => {
    try {
        const { matches } = req.body;
        
        if (!matches || !Array.isArray(matches)) {
            return res.status(400).json({
                success: false,
                error: 'matches array is required'
            });
        }
        
        const results = {
            successful: 0,
            failed: 0,
            errors: []
        };
        
        for (const match of matches) {
            try {
                const { specificationId, productId, confidence = 1.0 } = match;
                
                if (!specificationId || !productId) {
                    results.failed++;
                    results.errors.push({
                        match,
                        error: 'specificationId and productId are required'
                    });
                    continue;
                }
                
                // Check if specification exists
                const specification = await ProductSpecification.findById(specificationId);
                if (!specification) {
                    results.failed++;
                    results.errors.push({
                        match,
                        error: 'Specification not found'
                    });
                    continue;
                }
                
                // Check if product exists
                const product = await Product.findById(productId);
                if (!product) {
                    results.failed++;
                    results.errors.push({
                        match,
                        error: 'Product not found'
                    });
                    continue;
                }
                
                // Check if match already exists
                const existingMatch = specification.matchedProducts?.find(
                    m => m.productId.toString() === productId
                );
                
                if (existingMatch) {
                    results.failed++;
                    results.errors.push({
                        match,
                        error: 'Match already exists'
                    });
                    continue;
                }
                
                // Add the match
                specification.matchedProducts = specification.matchedProducts || [];
                specification.matchedProducts.push({
                    productId: productId,
                    confidence: confidence,
                    matchedAt: new Date()
                });
                
                specification.stats.totalMatches = specification.matchedProducts.length;
                specification.stats.lastMatchedAt = new Date();
                
                await specification.save();
                results.successful++;
                
            } catch (error) {
                results.failed++;
                results.errors.push({
                    match,
                    error: error.message
                });
            }
        }
        
        res.json({
            success: true,
            results: results,
            message: `Processed ${matches.length} matches: ${results.successful} successful, ${results.failed} failed`
        });
        
    } catch (error) {
        console.error('Bulk create matches error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Export all matching data in various formats
const exportMatchingData = async (req, res) => {
    try {
        const { format = 'json', category } = req.query;
        
        const filter = { isActive: true };
        if (category) filter.category = category;
        
        const specifications = await ProductSpecification.find(filter)
            .populate('matchedProducts.productId', 'name currentPrice source brand category')
            .sort({ category: 1, productName: 1 })
            .lean();
        
        if (format === 'csv') {
            // CSV format for Excel/Sheets
            const csvRows = [];
            const headers = [
                'Specification ID', 'Specification Name', 'Category', 'Brand',
                'Product ID', 'Product Name', 'Product Price', 'Product Source', 
                'Product Brand', 'Confidence', 'Matched Date'
            ];
            
            // Add dynamic specification field headers
            const allSpecFields = new Set();
            specifications.forEach(spec => {
                if (spec.specifications) {
                    Object.keys(spec.specifications).forEach(key => allSpecFields.add(key));
                }
            });
            
            headers.push(...Array.from(allSpecFields).map(field => `Spec_${field}`));
            csvRows.push(headers.join(','));
            
            specifications.forEach(spec => {
                spec.matchedProducts?.forEach(match => {
                    if (match.productId) {
                        const row = [
                            spec._id,
                            `"${spec.productName}"`,
                            spec.category,
                            spec.brand || '',
                            match.productId._id,
                            `"${match.productId.name}"`,
                            match.productId.currentPrice || '',
                            match.productId.source,
                            match.productId.brand || '',
                            match.confidence,
                            match.matchedAt ? new Date(match.matchedAt).toISOString() : ''
                        ];
                        
                        // Add specification values
                        Array.from(allSpecFields).forEach(field => {
                            const value = spec.specifications?.[field] || '';
                            row.push(typeof value === 'string' ? `"${value}"` : value);
                        });
                        
                        csvRows.push(row.join(','));
                    }
                });
            });
            
            res.setHeader('Content-Type', 'text/csv');
            const safeCategory = (category || 'all').replace(/[^a-zA-Z0-9]/g, '_');
            res.setHeader('Content-Disposition', `attachment; filename="matching-data-${safeCategory}-${Date.now()}.csv"`);
            return res.send(csvRows.join('\n'));
        }
        
        // JSON format (default)
        const exportData = {
            exportedAt: new Date().toISOString(),
            category: category || 'all',
            totalSpecifications: specifications.length,
            totalMatches: specifications.reduce((sum, spec) => sum + (spec.matchedProducts?.length || 0), 0),
            data: specifications.map(spec => ({
                specificationId: spec._id,
                specificationName: spec.productName,
                category: spec.category,
                brand: spec.brand,
                specifications: spec.specifications,
                matchedProducts: spec.matchedProducts?.map(match => ({
                    productId: match.productId._id,
                    productName: match.productId.name,
                    currentPrice: match.productId.currentPrice,
                    source: match.productId.source,
                    brand: match.productId.brand,
                    confidence: match.confidence,
                    matchedAt: match.matchedAt
                })) || []
            }))
        };
        
        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            const safeCategory = (category || 'all').replace(/[^a-zA-Z0-9]/g, '_');
            res.setHeader('Content-Disposition', `attachment; filename="matching-data-${safeCategory}-${Date.now()}.json"`);
        }
        
        res.json(exportData);
        
    } catch (error) {
        console.error('Export matching data error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Find specifications by product name (fuzzy search)
const findSpecificationsByProductName = async (req, res) => {
    try {
        const { productName } = req.body;
        const { includeProducts = true, includeFullSpecs = true } = req.query;
        
        if (!productName || typeof productName !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Product name is required in request body'
            });
        }
        
        // Önce direkt ürün araması yap
        const products = await Product.find({
            name: { $regex: productName.trim(), $options: 'i' },
            isActive: true
        }).limit(50).lean();
        
        if (products.length === 0) {
            return res.json({
                success: true,
                found: false,
                searchTerm: productName,
                message: 'No products found matching the given name',
                suggestions: []
            });
        }
        
        // Bulunan ürünlerin ID'lerini al
        const productIds = products.map(p => p._id);
        
        // Bu ürünlerle eşleşen teknik özellikleri bul
        const specifications = await ProductSpecification.find({
            'matchedProducts.productId': { $in: productIds },
            isActive: true
        })
        .populate('matchedProducts.productId', 'name currentPrice source brand category')
        .lean();
        
        // Sonuçları düzenle
        const results = [];
        
        specifications.forEach(spec => {
            const matchingProducts = spec.matchedProducts?.filter(match => 
                productIds.some(id => id.toString() === match.productId._id.toString())
            ) || [];
            
            if (matchingProducts.length > 0) {
                const result = {
                    specificationId: spec._id,
                    specificationName: spec.productName,
                    category: spec.category,
                    brand: spec.brand,
                    confidence: Math.max(...matchingProducts.map(m => m.confidence || 1)),
                    matchCount: matchingProducts.length
                };
                
                if (includeFullSpecs === 'true') {
                    result.specifications = spec.specifications;
                }
                
                if (includeProducts === 'true') {
                    result.matchedProducts = matchingProducts.map(match => ({
                        productId: match.productId._id,
                        productName: match.productId.name,
                        currentPrice: match.productId.currentPrice,
                        source: match.productId.source,
                        brand: match.productId.brand,
                        category: match.productId.category,
                        confidence: match.confidence,
                        matchedAt: match.matchedAt
                    }));
                }
                
                results.push(result);
            }
        });
        
        // Güven skoruna göre sırala
        results.sort((a, b) => b.confidence - a.confidence);
        
        // En iyi eşleşmeyi belirle
        const bestMatch = results.length > 0 ? results[0] : null;
        
        res.json({
            success: true,
            found: results.length > 0,
            searchTerm: productName,
            totalMatches: results.length,
            bestMatch: bestMatch,
            allMatches: results,
            searchedProducts: includeProducts === 'true' ? products.map(p => ({
                id: p._id,
                name: p.name,
                price: p.currentPrice,
                source: p.source,
                brand: p.brand,
                category: p.category
            })) : products.length,
            summary: {
                productsFound: products.length,
                specificationsMatched: results.length,
                categories: [...new Set(results.map(r => r.category))],
                averageConfidence: results.length > 0 ? 
                    (results.reduce((sum, r) => sum + r.confidence, 0) / results.length).toFixed(2) : 0
            }
        });
        
    } catch (error) {
        console.error('Find specifications by product name error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    getAllSpecifications,
    getSpecificationById,
    createSpecification,
    updateSpecification,
    deleteSpecification,
    getSpecificationTemplates,
    matchProductWithSpecification,
    findSpecificationsByProduct,
    searchSpecifications,
    getUnmatchedProducts,
    getSpecificationCoverage,
    rematchSpecifications,
    rematchAllSpecifications,
    rematchSingleSpecification,
    removeProductMatch,
    addProductMatch,
    findPotentialMatches,
    cleanupLowQualityMatches,
    clearAllMatches,
    // Product comparison functions
    compareProducts,
    getComparisonData,
    generateComparisonTable,
    
    // Frontend-specific endpoints
    getProductsWithSpecifications,
    getSpecificationsByCategory,
    getProductSpecificationDetails,
    
    // Direct matching data endpoints
    getAllMatchingData,
    getMatchingDataByCategory,
    bulkCreateMatches,
    exportMatchingData,
    
    // Product name search
    findSpecificationsByProductName
};