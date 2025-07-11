const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminUserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    email: {
        type: String,
        required: false,
        trim: true,
        lowercase: true
    },
    role: {
        type: String,
        default: 'admin',
        enum: ['admin', 'super_admin']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Şifre hash'leme middleware
adminUserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Şifre doğrulama metodu
adminUserSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        return false;
    }
};

// Login güncellemesi
adminUserSchema.methods.updateLastLogin = async function() {
    this.lastLogin = new Date();
    this.updatedAt = new Date();
    return this.save();
};

// Şifre değiştirme
adminUserSchema.methods.changePassword = async function(newPassword) {
    this.password = newPassword;
    this.updatedAt = new Date();
    return this.save();
};

// İndeksler (username already has unique index)
adminUserSchema.index({ isActive: 1 });

const AdminUser = mongoose.model('AdminUser', adminUserSchema);

module.exports = AdminUser;