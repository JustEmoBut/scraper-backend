const AdminUser = require('../models/AdminUser');
const { generateToken } = require('../middleware/auth');

// Admin login
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username and password are required',
                code: 'MISSING_CREDENTIALS'
            });
        }

        // Kullanıcıyı bul
        const user = await AdminUser.findOne({ 
            username: username.toLowerCase().trim(),
            isActive: true 
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Şifre kontrolü
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Last login güncelle
        await user.updateLastLogin();

        // JWT token oluştur
        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    role: user.role,
                    lastLogin: user.lastLogin
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            code: 'SERVER_ERROR'
        });
    }
};

// Helper function to check if request is from localhost
const isLocalhost = (req) => {
    const host = req.headers.host || req.headers['x-forwarded-host'] || '';
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || '';
    
    return host.includes('localhost') || 
           host.includes('127.0.0.1') || 
           ip.includes('127.0.0.1') || 
           ip.includes('::1') ||
           process.env.NODE_ENV === 'development';
};

// Admin kullanıcı oluşturma (sadece super admin, ilk kullanıcı veya localhost için)
const createAdmin = async (req, res) => {
    try {
        const { username, password, email, role = 'admin' } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username and password are required',
                code: 'MISSING_FIELDS'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 8 characters',
                code: 'WEAK_PASSWORD'
            });
        }

        // İlk kullanıcı mı kontrol et
        const userCount = await AdminUser.countDocuments();
        const isFirstUser = userCount === 0;
        const isFromLocalhost = isLocalhost(req);

        // Allow registration if:
        // 1. This is the first user, OR
        // 2. Request is from localhost, OR
        // 3. User is authenticated and is super admin
        if (!isFirstUser && !isFromLocalhost && (!req.user || req.user.role !== 'super_admin')) {
            return res.status(403).json({
                success: false,
                error: 'Registration only allowed from localhost or for first user',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        // Kullanıcı adı kontrol et
        const existingUser = await AdminUser.findOne({ 
            username: username.toLowerCase().trim() 
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'Username already exists',
                code: 'USERNAME_EXISTS'
            });
        }

        // Yeni kullanıcı oluştur
        const newUser = new AdminUser({
            username: username.toLowerCase().trim(),
            password,
            email: email ? email.toLowerCase().trim() : undefined,
            role: isFirstUser ? 'super_admin' : role
        });

        await newUser.save();

        res.status(201).json({
            success: true,
            message: 'Admin user created successfully',
            data: {
                user: {
                    id: newUser._id,
                    username: newUser.username,
                    email: newUser.email,
                    role: newUser.role,
                    createdAt: newUser.createdAt
                }
            }
        });

    } catch (error) {
        console.error('Create admin error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Username already exists',
                code: 'USERNAME_EXISTS'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Internal server error',
            code: 'SERVER_ERROR'
        });
    }
};

// Profil bilgileri getir
const getProfile = async (req, res) => {
    try {
        const user = await AdminUser.findById(req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    lastLogin: user.lastLogin,
                    createdAt: user.createdAt
                }
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            code: 'SERVER_ERROR'
        });
    }
};

// Şifre değiştir
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Current and new password are required',
                code: 'MISSING_FIELDS'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 8 characters',
                code: 'WEAK_PASSWORD'
            });
        }

        const user = await AdminUser.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        // Mevcut şifre kontrolü
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                error: 'Current password is incorrect',
                code: 'INVALID_CURRENT_PASSWORD'
            });
        }

        // Yeni şifre kaydet
        await user.changePassword(newPassword);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            code: 'SERVER_ERROR'
        });
    }
};

// Tüm admin kullanıcıları listele (sadece super admin)
const listAdmins = async (req, res) => {
    try {
        const users = await AdminUser.find()
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: {
                users: users.map(user => ({
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive,
                    lastLogin: user.lastLogin,
                    createdAt: user.createdAt
                })),
                count: users.length
            }
        });

    } catch (error) {
        console.error('List admins error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            code: 'SERVER_ERROR'
        });
    }
};

// Token doğrulama
const verifyToken = async (req, res) => {
    try {
        // Middleware tarafından zaten doğrulandı
        res.json({
            success: true,
            message: 'Token is valid',
            data: {
                user: req.user
            }
        });
    } catch (error) {
        console.error('Verify token error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            code: 'SERVER_ERROR'
        });
    }
};

// Test endpoint
const test = async (req, res) => {
    res.json({
        success: true,
        message: 'Auth controller is working',
        timestamp: new Date().toISOString()
    });
};

module.exports = {
    login,
    register: createAdmin,  // Alias for register endpoint
    verify: verifyToken,    // Alias for verify endpoint
    createAdmin,
    getProfile,
    changePassword,
    listAdmins,
    verifyToken,
    test
};