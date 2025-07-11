const mongoose = require('mongoose');

const productSpecificationSchema = new mongoose.Schema({
    // Eşleştirme için temel bilgiler
    productName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    cleanProductName: {
        type: String,
        required: false,  // Pre-save middleware'de otomatik oluşturulacak
        trim: true,
        index: true  // Temizlenmiş isim ile arama için
    },
    category: {
        type: String,
        required: true,
        enum: ['İşlemci', 'Ekran Kartı', 'Anakart', 'RAM', 'SSD', 'Güç Kaynağı', 'Bilgisayar Kasası'],
        index: true
    },
    brand: {
        type: String,
        trim: true,
        index: true
    },
    
    // Teknik özellikler - Esnek yapı
    specifications: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: new Map()
    },
    
    // Meta bilgiler
    source: {
        type: String,
        trim: true,
        default: 'manual'  // 'manual', 'itopya', 'incehesap', 'sinerji'
    },
    verifiedAt: {
        type: Date,
        default: Date.now
    },
    verifiedBy: {
        type: String,
        default: 'admin'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Eşleştirme bilgileri
    matchedProducts: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        source: String,
        confidence: {
            type: Number,
            min: 0,
            max: 1,
            default: 1
        },
        similarity: {
            type: Number,
            min: 0,
            max: 1
        },
        matchedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // İstatistikler
    stats: {
        totalMatches: {
            type: Number,
            default: 0
        },
        lastMatchedAt: Date,
        viewCount: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Compound indexes for better query performance
productSpecificationSchema.index({ cleanProductName: 1, category: 1, brand: 1 });
productSpecificationSchema.index({ category: 1, brand: 1 });
productSpecificationSchema.index({ source: 1, category: 1 });
productSpecificationSchema.index({ isActive: 1, category: 1 });
productSpecificationSchema.index({ verifiedAt: -1 });

// Text search index
productSpecificationSchema.index({ 
    productName: 'text', 
    cleanProductName: 'text',
    brand: 'text' 
});

// Pre-save middleware - Clean product name oluştur
productSpecificationSchema.pre('save', function(next) {
    if (this.isModified('productName') || !this.cleanProductName) {
        // Temizleme işlemleri
        this.cleanProductName = this.productName
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')  // Özel karakterleri kaldır
            .replace(/\s+/g, ' ')      // Çoklu boşlukları tek boşluk yap
            .trim();
    }
    next();
});

// Virtual for formatted specifications
productSpecificationSchema.virtual('formattedSpecs').get(function() {
    const specs = {};
    for (let [key, value] of this.specifications) {
        specs[key] = value;
    }
    return specs;
});

// Method to add/update specification
productSpecificationSchema.methods.updateSpecification = function(key, value) {
    this.specifications.set(key, value);
    this.verifiedAt = new Date();
    return this.save();
};

// Method to add matched product
productSpecificationSchema.methods.addMatchedProduct = function(productId, source, confidence = 1) {
    // Eğer zaten eşleştirilmişse güncelle
    const existingMatch = this.matchedProducts.find(
        match => match.productId.toString() === productId.toString()
    );
    
    if (existingMatch) {
        existingMatch.confidence = confidence;
        existingMatch.matchedAt = new Date();
    } else {
        this.matchedProducts.push({
            productId,
            source,
            confidence,
            matchedAt: new Date()
        });
    }
    
    this.stats.totalMatches = this.matchedProducts.length;
    this.stats.lastMatchedAt = new Date();
    
    return this.save();
};

// Method to remove matched product
productSpecificationSchema.methods.removeMatchedProduct = function(productId) {
    this.matchedProducts = this.matchedProducts.filter(
        match => match.productId.toString() !== productId.toString()
    );
    this.stats.totalMatches = this.matchedProducts.length;
    
    return this.save();
};

// Static method to find by product name and category
productSpecificationSchema.statics.findByProductNameAndCategory = function(productName, category, brand = null) {
    const cleanName = productName
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    const query = {
        cleanProductName: { $regex: cleanName, $options: 'i' },
        category: category,
        isActive: true
    };
    
    if (brand) {
        query.brand = { $regex: brand, $options: 'i' };
    }
    
    return this.find(query).sort({ verifiedAt: -1 });
};

// Static method for fuzzy search
productSpecificationSchema.statics.fuzzySearch = function(searchTerm, category = null) {
    const query = {
        $text: { $search: searchTerm },
        isActive: true
    };
    
    if (category) {
        query.category = category;
    }
    
    return this.find(query, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } });
};

// Static method: Cleanup dead product references
productSpecificationSchema.statics.cleanupDeadReferences = async function() {
    const Product = require('./Product');
    
    console.log('🧹 Starting cleanup of dead product references...');
    
    let totalCleaned = 0;
    let specificationsProcessed = 0;
    
    try {
        // Get all specifications with matched products
        const specifications = await this.find({
            'matchedProducts.0': { $exists: true }
        });
        
        console.log(`Found ${specifications.length} specifications with matches to check`);
        
        for (const spec of specifications) {
            specificationsProcessed++;
            let cleanedFromThisSpec = 0;
            
            // Check each matched product
            const validMatches = [];
            
            for (const match of spec.matchedProducts) {
                // Check if product still exists and is active
                const product = await Product.findOne({
                    _id: match.productId,
                    isActive: true
                });
                
                if (product) {
                    validMatches.push(match);
                } else {
                    cleanedFromThisSpec++;
                    totalCleaned++;
                    console.log(`🗑️  Removing dead reference: ${match.productId} from "${spec.productName}"`);
                }
            }
            
            // Update specification if we removed any matches
            if (cleanedFromThisSpec > 0) {
                spec.matchedProducts = validMatches;
                spec.stats.totalMatches = validMatches.length;
                await spec.save();
                
                console.log(`✅ Cleaned ${cleanedFromThisSpec} dead references from "${spec.productName}"`);
            }
        }
        
        console.log(`🎉 Cleanup completed: ${totalCleaned} dead references removed from ${specificationsProcessed} specifications`);
        
        return {
            success: true,
            totalCleaned,
            specificationsProcessed,
            message: `Successfully cleaned ${totalCleaned} dead product references from ${specificationsProcessed} specifications`
        };
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        return {
            success: false,
            error: error.message,
            totalCleaned,
            specificationsProcessed
        };
    }
};

module.exports = mongoose.model('ProductSpecification', productSpecificationSchema);