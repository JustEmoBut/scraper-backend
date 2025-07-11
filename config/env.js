require('dotenv').config();

// Environment configuration with validation and defaults
class Environment {
    constructor() {
        this.env = process.env.NODE_ENV || 'development';
        this.validateRequired();
    }

    // Required environment variables
    validateRequired() {
        const required = ['MONGODB_URI'];
        const missing = required.filter(key => !process.env[key]);

        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }

    // Database configuration
    get database() {
        return {
            uri: process.env.MONGODB_URI,
            options: {
                maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
                serverSelectionTimeoutMS: parseInt(process.env.DB_TIMEOUT) || 5000,
                socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT) || 45000,
            }
        };
    }

    // Server configuration
    get server() {
        return {
            port: parseInt(process.env.PORT) || 3000,
            host: process.env.HOST || 'localhost',
            cors: {
                origins: process.env.ALLOWED_ORIGINS 
                    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
                    : ['http://localhost:3000', 'https://localhost:3000']
            }
        };
    }

    // Rate limiting disabled

    // Logging configuration
    get logging() {
        return {
            level: process.env.LOG_LEVEL || 'INFO',
            format: process.env.LOG_FORMAT || 'simple',
            file: process.env.LOG_FILE || null
        };
    }

    // Cache configuration
    get cache() {
        return {
            enabled: process.env.CACHE_ENABLED === 'true',
            redis: {
                url: process.env.REDIS_URL || null,
                ttl: parseInt(process.env.CACHE_TTL) || 300 // 5 minutes
            }
        };
    }

    // Security configuration
    get security() {
        return {
            apiKey: process.env.API_KEY || null,
            jwtSecret: process.env.JWT_SECRET || null,
            bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
        };
    }

    // Scraping configuration
    get scraping() {
        return {
            enabled: process.env.SCRAPING_ENABLED !== 'false',
            interval: parseInt(process.env.SCRAPING_INTERVAL) || 60 * 60 * 1000, // 1 hour
            timeout: parseInt(process.env.SCRAPING_TIMEOUT) || 60000,
            maxRetries: parseInt(process.env.SCRAPING_MAX_RETRIES) || 3
        };
    }

    // Performance configuration
    get performance() {
        return {
            compression: process.env.COMPRESSION_ENABLED !== 'false',
            trustProxy: process.env.TRUST_PROXY === 'true',
            maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb'
        };
    }

    // Development configuration
    get isDevelopment() {
        return this.env === 'development';
    }

    get isProduction() {
        return this.env === 'production';
    }

    get isTest() {
        return this.env === 'test';
    }

    // Get all configuration
    getAll() {
        return {
            env: this.env,
            database: this.database,
            server: this.server,
            logging: this.logging,
            cache: this.cache,
            security: this.security,
            scraping: this.scraping,
            performance: this.performance
        };
    }

    // Validate configuration
    validate() {
        const errors = [];

        // Database validation
        if (!this.database.uri) {
            errors.push('Database URI is required');
        }

        // Security validation (JWT is optional for read-only API)
        // if (this.isProduction && !this.security.jwtSecret) {
        //     errors.push('JWT secret is required in production');
        // }

        if (errors.length > 0) {
            throw new Error(`Configuration errors: ${errors.join(', ')}`);
        }

        return true;
    }
}

// Singleton instance
const env = new Environment();

// Validate on load
env.validate();

module.exports = env;