const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    currentPrice: {
        type: Number,
        required: true
    },
    oldPrice: {
        type: Number,
        default: null
    },
    discount: {
        type: String,
        default: null
    },
    brand: {
        type: String,
        trim: true
    },
    link: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        trim: true
    },
    source: {
        type: String,
        required: true,
        trim: true
    },
    isLowestPrice: {
        type: String,
        default: null
    },
    availability: {
        type: String,
        default: 'Stokta'
    },
    scrapedAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Fiyat geçmişi için
    priceHistory: [{
        price: Number,
        date: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Compound indexes for better query performance
productSchema.index({ category: 1, source: 1 });
productSchema.index({ category: 1, currentPrice: 1 });
productSchema.index({ source: 1, scrapedAt: -1 });
productSchema.index({ isActive: 1, category: 1 });
productSchema.index({ name: 'text', brand: 'text' });

// Virtual for formatted price
productSchema.virtual('formattedPrice').get(function() {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY'
    }).format(this.currentPrice);
});

// Method to add price to history
productSchema.methods.addPriceToHistory = function(price) {
    if (this.priceHistory.length === 0 || 
        this.priceHistory[this.priceHistory.length - 1].price !== price) {
        this.priceHistory.push({ price, date: new Date() });
        
        // Keep only last 30 price entries
        if (this.priceHistory.length > 30) {
            this.priceHistory = this.priceHistory.slice(-30);
        }
    }
};

module.exports = mongoose.model('Product', productSchema);