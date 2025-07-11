# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development & Execution
- `npm run dev` - Development server with nodemon auto-reload
- `npm start` - Production server start

### Python Scraper (Enhanced)
- `cd python && python run_scraper.py scrape {category}` - Scrape single category
- `cd python && python run_scraper.py scrape-all` - Scrape all categories
- `cd python && python run_scraper.py test {site}` - Test single site
- `cd python && python api.py` - Start Python FastAPI server

### Data Management Scripts
- `npm run check:data` - Verify data integrity and recovery
- `npm run health` - Quick system health check
- `npm run debug:all` - Debug all scraped data
- `npm run debug:mapping` - Debug category mapping issues
- `npm run fix:mapping` - Fix category mapping problems
- `npm run fix:all` - Fix duplicate products
- `npm run restore:all` - Restore data from backup

### Database Reset Operations
- `npm run reset:database` - Complete database reset (DANGEROUS)
- `npm run reset:site` - Reset specific site data
- `npm run reset:products` - Reset only products, keep categories

### Manual Operations
- Single category scraping: `cd python && python run_scraper.py scrape sitename_category`

## Architecture Overview

### Core Components
- **Express API Server**: RESTful API with MongoDB Atlas integration
- **Python Enhanced Scraper**: Camoufox-based scraping with superior anti-detection
- **MVC Architecture**: Controllers, models, routes, middleware separation
- **Site Configuration System**: Modular site definitions in `config/sites/` and `python/scraper/config.py`

### Key Technologies
- **Backend Runtime**: Node.js 16+ with Express.js framework
- **Scraper Runtime**: Python 3.8+ with Camoufox (Firefox-based)
- **Database**: MongoDB Atlas with Mongoose ODM (Node.js) and Motor (Python)
- **Scraping**: Camoufox with built-in stealth and Cloudflare bypass
- **Deployment**: Vercel serverless with automatic scaling

### Project Structure
```
├── api/index.js          # Vercel serverless entry point
├── server.js             # Local development server
├── python/              # Enhanced Python scraper
│   ├── scraper/         # Main scraper package
│   │   ├── config.py    # Site configurations
│   │   ├── database.py  # MongoDB operations
│   │   ├── scraper.py   # Camoufox scraping logic
│   │   └── cli.py       # Command-line interface
│   ├── api.py           # FastAPI backend
│   ├── run_scraper.py   # CLI entry point
│   └── requirements.txt # Python dependencies
├── config/
│   ├── scraping-configs.js   # Node.js site configurations
│   ├── database.js           # MongoDB connection logic
│   ├── site-manager.js       # Site management utilities
│   └── sites/               # Individual site configurations
├── controllers/         # API request handlers
├── models/             # MongoDB schemas (Product, Category)
├── routes/             # API route definitions
├── middleware/         # CORS, validation, error handling
├── scripts/           # Maintenance and utility scripts
└── utils/             # Helper functions and formatters
```

### Supported E-commerce Sites
- **İnceHesap.com**: Price aggregation platform (7 categories, pagination)
- **İtopya.com**: Technology retailer (7 categories, infinite scroll)
- **Sinerji.gen.tr**: Tech specialist (7 categories, pagination)

Categories: İşlemci, Ekran Kartı, Anakart, RAM, SSD, Güç Kaynağı, Bilgisayar Kasası

## Site Configuration System

Each site has a modular configuration in `config/sites/[sitename].js`:
- **info**: Site metadata (name, baseUrl, description, priority)
- **defaults**: Common scraping settings (selectors, scroll behavior, field mappings)
- **categories**: Category-specific URLs and display names

Configuration keys are generated as `sitename_categorykey` (e.g., `incehesap_anakart`).

## Database Schema

### Product Model (models/Product.js)
- Core fields: name, category, currentPrice, brand, source
- Links: product URL, image URL
- Metadata: scrapedAt, isActive, availability
- Price tracking: priceHistory array for historical data
- Indexes: name, category, currentPrice, brand, source, scrapedAt, isActive

### Category Model (models/Category.js) 
- Identification: key, name, displayName, source
- Metadata: url, lastScrapedAt, totalProducts, isActive

### AdminUser Model (models/AdminUser.js)
- Authentication: username (unique), password (bcrypt hashed)
- User management: role (admin/super_admin), isActive status
- Security: JWT token-based authentication, manual login required
- Access control: Admin panel requires authentication for all operations

### ProductSpecification Model (models/ProductSpecification.js)
- Product identification: productName, cleanProductName, category, brand
- Technical specifications: flexible Map-based storage for different product types
- Metadata: source (manual/scraped), verifiedAt, verifiedBy, isActive
- Product matching: matchedProducts array for linking with scraped products
- Statistics: totalMatches, lastMatchedAt, viewCount
- Indexes: productName, cleanProductName, category, brand, source, isActive

## API Architecture

### Endpoint Categories (75 Total - Optimized)
- **Core Data**: `/api/categories`, `/api/data/:category`, `/api/stats`
- **Product Access**: `/api/products` (with pagination, filtering, sorting)
- **Search**: `/api/search/:category`, `/api/search/all`
- **Analytics**: `/api/analytics/price-trends` (active endpoints only)
- **Batch Operations**: `/api/batch/products` (working endpoints only)
- **Site Management**: `/api/sites`, `/api/sites/:siteName`
- **Product Specifications**: `/api/specifications` (CRUD operations, templates, search)
- **Authentication**: `/api/auth/login`, `/api/auth/verify`, `/api/auth/profile`, `/api/auth/register`, `/api/auth/change-password`
- **Debug**: `/api/debug`, `/api/test-connection`

### Removed Endpoints (No Longer Available)
- ❌ `/admin` - Use static file serving instead
- ❌ `/health` - Superseded by `/api/test-connection`
- ❌ `/api/categories/:category` - Use `/api/data/:category`
- ❌ `/api/products/:id/price-history` - Not implemented
- ❌ `/api/analytics/test-price-history` - Development endpoint removed
- ❌ `/api/analytics/price-movers` - Not implemented
- ❌ `/api/batch/category-stats` - Not implemented
- ❌ `/api/batch/price-comparison` - Not implemented

### Product Specifications API Endpoints

#### Public Endpoints (No Authentication Required)
- `GET /api/specifications` - List all active specifications with pagination
  - Query params: `page`, `limit`, `category`, `brand`, `search`
  - Returns: Paginated list of specifications with metadata
- `GET /api/specifications/search` - Search specifications by name/category
  - Query params: `q` (search term), `category`, `limit`
- `GET /api/specifications/templates` - Get all specification templates
  - Returns: Complete template definitions for all categories
- `GET /api/specifications/templates/:category` - Get templates for specific category
  - Returns: Category-specific specification template
- `GET /api/specifications/product/:productId` - Find specifications for a product
  - Returns: Matching specifications for scraped product
- `GET /api/specifications/:id` - Get specific specification by ID

#### Protected Endpoints (Authentication Required)
- `POST /api/specifications` - Create new specification
  - Body: `{productName, category, brand?, specifications}`
  - Returns: Created specification object
- `PUT /api/specifications/:id` - Update existing specification
  - Body: Partial specification data to update
- `DELETE /api/specifications/:id` - Delete specification (hard delete)
- `POST /api/specifications/match/:productId` - Match specification with product

#### Authentication Endpoints
- `POST /api/auth/login` - Admin login
  - Body: `{username, password}`
  - Returns: JWT token and user info
- `POST /api/auth/register` - Create admin user (first user only or super_admin)
  - Body: `{username, password, email?, role?}`
- `GET /api/auth/verify` - Verify JWT token validity
- `GET /api/auth/profile` - Get authenticated user profile
- `POST /api/auth/change-password` - Change user password
  - Body: `{currentPassword, newPassword}`

### Response Format Standards
All endpoints return consistent JSON with `success` boolean and appropriate data structures. Pagination uses `currentPage`, `totalPages`, `hasNextPage`, `hasPrevPage` format.

### Product Specification Templates

The system includes comprehensive technical specification templates for all 7 product categories:

#### İşlemci (CPU) - 25 Fields
Core specs: cekirdekSayisi, threadSayisi, temelFrekans, maksimumFrekans, soket, uretimTeknolojisi
Advanced: l1Cache, l2Cache, l3Cache, pcieLanes, entegreCPU, overclockDestegi
Memory: desteklenenRam, maksimumRam, ramKanalSayisi, ecc

#### Ekran Kartı (GPU) - 27 Fields  
Core specs: bellekBoyutu, bellekTipi, cekirdekSayisi, temelFrekans, overclockFrekans
Advanced: rtCore, tensorCore, cudaCore, bellekBusGenisligi, bellekBantGenisligi
Features: dlssDestegi, rayTracingDestegi, sogutmaTipi, gucTuketimi

#### Anakart (Motherboard) - 23 Fields
Core specs: soket, cipseti, formFaktor, ramSlotSayisi, maksimumRam
Connectivity: pciSlotSayisi, m2SlotSayisi, sataPortSayisi, usbPortSayisi
Advanced: vrm, isikKalkanlari, rgbKonnektorleri, fanKonnektorleri, overclockDestegi

#### RAM - 21 Fields
Core specs: kapasite, hiz, tip, clDegeri, voltaj, modulSayisi
Advanced: tamTiming, cipseti, rank, sogutucuMalzemesi, xmpSurum
Physical: formFaktor, eccDestegi, yukseklik, garanti, testEdilmisAnakartlar

#### SSD - 23 Fields
Core specs: kapasite, arayuz, pcieSurum, okumaHizi, yazmaHizi, rastgeleOkuma
Advanced: nandTipi, nandKatmani, kontrolcu, cache, slcCache, hostMemoryBuffer
Durability: tbw, dwpd, mtbf, formFaktor, sicaklikSensoru, sifrelemeTipi

#### Güç Kaynağı (PSU) - 29 Fields
Core specs: guc, sertifikasyon, verimlilik, moduler, formFaktor
Technical: fanBoyutu, fanTipi, activePfc, rail12vSayisi, rail12vAkim
Connectors: pciKonnektoru, eps12vKonnektoru, sataKonnektoru, anakartKonnektoru
Safety: korumalar, mtbf, sicaklikAraligi, sertifikasyonlar

#### Bilgisayar Kasası (Case) - 37 Fields
Core specs: tip, formFaktor, malzeme, fanSlotu, radiatorDestegi
Storage: hddSlotu, ssdSlotu, cokamacliSlot, pciSlotu
Connectivity: onPanelKonnektorleri, usbTipleri, audioKonnektoru
Features: camPanel, mesh, rgbTipi, kabloyonetimi, montajTipi

## Scraping System

### Anti-Detection Features
- Playwright stealth plugin with dynamic user agents
- Viewport randomization and rate limiting (2s between sites)
- Cloudflare bypass capabilities via `config/cloudflare-bypass.js`
- Browser profile isolation with user-data directories

### Scraping Methods
- **Pagination**: İnceHesap and Sinerji (page-based navigation)
- **Infinite Scroll**: İtopya (automatic scroll detection)
- **Field Mapping**: Flexible selector-based data extraction
- **Error Recovery**: Robust failure handling with detailed logging

### Data Processing
- Price normalization and brand extraction
- Duplicate prevention via name+category+source matching
- Automatic image URL processing and validation
- Category mapping with display name support

## Environment Configuration

Required environment variables:
- `MONGODB_URI`: MongoDB Atlas connection string
- `NODE_ENV`: development/production
- `ALLOWED_ORIGINS`: CORS-allowed domains (comma-separated)
- `PORT`: Server port (default: 3000)
- `JWT_SECRET`: Secret key for JWT token signing (authentication)

## Development Workflow

1. **Local Development**: Use `npm run dev` for auto-reload
2. **Scraping**: Use Python scraper commands for data updates  
3. **Testing**: Use `/api/debug` and `/api/test-connection` endpoints (no `/health`)
4. **Deployment**: Push to GitHub triggers automatic Vercel deployment
5. **Monitoring**: Check `/api/stats` for system health

## Common Operations

### Adding New Site
1. Create configuration file in `config/sites/newsite.js`
2. Add to `config/scraping-configs.js` sites object
3. Test with single category scraping
4. Deploy and verify API endpoints

### Debugging Scraping Issues
1. Use `npm run debug:mapping` for category problems
2. Check `/api/test-connection` endpoint for system status
3. Use `scripts/data-recovery-check.js` for data integrity
4. Review browser console output during scraping

### Database Maintenance
- Use reset scripts carefully - they perform destructive operations
- `npm run fix:all` resolves duplicate products safely
- Monitor product counts via `/api/stats` endpoint
- Price history is automatically maintained (last 30 entries per product)

## Performance Considerations

- MongoDB indexes optimize common queries (price range, category, brand)
- Lean queries reduce memory usage for large datasets
- Pagination prevents large response payloads
- Batch endpoints provide parallel processing for multiple operations
- Response caching improves API performance

## Security Notes

- **Admin Panel**: JWT-based authentication required for admin operations
- **Public API**: Read-only interface for categories, products, search, and stats
- **Password Security**: bcrypt hashing with salt rounds, manual login required each session
- **Token Management**: No automatic login, tokens cleared on page refresh for security
- **Access Control**: Admin operations require authentication headers
- **Environment Protection**: Sensitive configuration stored in environment variables
- **CORS Security**: Cross-origin access restricted to specified domains
- **Input Validation**: SQL injection and XSS prevention on search endpoints

## Admin Panel Access

### Authentication Flow
1. Admin panel served via static files at `/index.html`
2. Manual login required each session (no auto-login for security)
3. JWT token stored temporarily, cleared on page refresh
4. Username/password authentication with bcrypt verification

### Admin Operations
- **System Monitoring**: Health checks, database statistics, analytics dashboard
- **Scraping Management**: All sites, missing categories, parallel operations
- **Data Maintenance**: Fix duplicates, mapping issues, data recovery
- **Database Operations**: Reset operations with confirmation requirements
- **Product Specifications**: Complete technical specification management system
  - Manual specification entry with category-specific templates
  - Search mode for linking with existing scraped products
  - Comprehensive field templates for all 7 product categories
  - Real-time validation and duplicate prevention
  - Bulk operations and data export capabilities

### Product Specification Management
The admin panel includes a dedicated specification management interface:

#### Manual Entry Mode
- Generic product specification entry (e.g., "NVIDIA RTX 4070 Ti")
- Category-specific field templates with help text
- Dynamic form generation based on selected category
- Field validation and type checking (number, text, select, boolean)
- Real-time duplicate detection

#### Search Mode  
- Link specifications with existing scraped products
- Product search and selection interface
- Automatic population of basic product information
- Maintains connection between specs and market data

#### Template System
- Comprehensive technical specifications for each category
- 25+ fields for CPUs, 27+ for GPUs, 37+ for Cases
- Field types: number (with units), text, select (predefined options), boolean
- Contextual help text for each field explaining usage and examples
- Extensible template system for adding new categories

### Creating Admin Users
- First user registration creates super_admin automatically
- Subsequent users require super_admin approval via `/api/auth/register`
- Manual MongoDB user creation also supported for initial setup

## Code Style Guidelines

### Best Practices
- Always use descriptive variable names
- Follow RESTful API conventions for new endpoints
- Implement proper error handling and validation
- Use JWT authentication for protected operations
- Maintain backward compatibility when adding features

## Additional Documentation

### Detailed API Documentation
- **SPECIFICATIONS.md**: Complete guide to the product specification management system
- **API_CHANGELOG.md**: Version history and migration guides
- **Package.json**: Updated to version 5.0.0 with new dependencies and keywords

### Quick Reference
- **Current Version**: 6.0.0
- **Architecture**: Hybrid System - Node.js API + Python Camoufox Scraper
- **API Endpoints**: 75 optimized endpoints (9 unused endpoints removed)
- **Database Models**: 4 collections (Product, Category, ProductSpecification, AdminUser)
- **Template System**: 138+ specification fields across 7 categories
- **Security**: bcrypt password hashing, JWT tokens, role-based access control

### System Architecture Updates
```
├── models/
│   ├── ProductSpecification.js    # Technical specifications model
│   └── AdminUser.js              # Authentication model
├── controllers/
│   ├── specificationController.js # Specification CRUD operations
│   └── authController.js         # Authentication logic
├── middleware/
│   └── auth.js                   # JWT authentication middleware
├── api/
│   ├── index.js                  # Main API routes (updated)
│   └── auth.js                   # Authentication endpoints
└── public/
    └── index.html                # Enhanced admin panel
```

### Deployment Notes
- **Vercel Compatible**: All new features work with serverless deployment
- **Environment Variables**: Add JWT_SECRET for production
- **MongoDB Atlas**: Automatic collection and index creation
- **CORS Configuration**: Updated for authentication endpoints
- **Backward Compatibility**: All existing endpoints remain functional

## Dual Server Architecture

This project supports both local development and Vercel serverless deployment:

### Local Development (server.js)
- Full MVC pattern with separate routes, controllers, and middleware
- Uses traditional Express router structure
- Supports all development scripts and debugging tools
- Run with `npm run dev` for auto-reload during development

### Serverless Deployment (api/index.js)
- Consolidated API handlers for Vercel Functions
- All endpoints integrated into single file for serverless compatibility
- Authentication handled via separate `/api/auth.js` function
- Admin panel served via static files and Vercel rewrites

### Key Differences
- **server.js**: Modular structure, separate route files, full middleware stack
- **api/index.js**: Consolidated endpoints, minimal middleware, optimized for serverless
- Both share the same models, controllers, and configuration files
- Authentication middleware works in both environments

## Important Security Notes

### Admin Panel Security
- **Authentication Required**: All admin operations require JWT authentication
- **Manual Login Only**: No auto-login for security, tokens cleared on page refresh
- **Role-Based Access**: Only admin and super_admin roles can access admin features
- **Protected Functions**: All admin operations (save, edit, delete, view specifications) check authentication before execution
- **Modal Security**: Admin modals only appear after successful authentication

### API Security
- **Public Endpoints**: Read-only access to products, categories, search, and stats
- **Protected Endpoints**: Specification management and admin operations require authentication
- **JWT Tokens**: Secure token-based authentication with expiration checking
- **Password Security**: bcrypt hashing with salt rounds for admin accounts