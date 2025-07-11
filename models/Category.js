const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    displayName: {
        type: String,
        required: true,
        trim: true
    },
    source: {
        type: String,
        required: true,
        trim: true
    },
    url: {
        type: String,
        required: true,
        trim: true
    },
    lastScrapedAt: {
        type: Date
    },
    totalProducts: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for better query performance
// Note: key field already has unique: true which creates an index
categorySchema.index({ source: 1 });

module.exports = mongoose.model('Category', categorySchema);