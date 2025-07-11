# TechPrice Scraper API - Project Structure

## 📁 Optimized File Organization

```
scraper-api-backend/
├── 📁 Node.js Backend (API + Admin Panel)
│   ├── api/              # Vercel serverless API
│   ├── config/           # Database & site configurations
│   ├── controllers/      # Request handlers
│   ├── middleware/       # CORS, auth, validation
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API route definitions
│   ├── scripts/         # Database maintenance scripts
│   ├── utils/           # Helper functions
│   ├── public/          # Admin panel (index.html)
│   ├── server.js        # Local development server
│   └── package.json     # Node.js dependencies
│
├── 📁 python/           # Python Camoufox Scraper
│   ├── scraper/         # Main scraper package
│   │   ├── config.py    # Site configurations (ported from Node.js)
│   │   ├── database.py  # MongoDB operations with Motor
│   │   ├── scraper.py   # Camoufox-based scraping logic
│   │   └── cli.py       # Command-line interface
│   ├── run_scraper.py   # CLI entry point
│   ├── setup.py         # Automated setup
│   ├── install_deps.py  # Dependency installer
│   ├── test.py          # Test suite
│   └── requirements.txt # Python dependencies
│
├── CLAUDE.md            # Development instructions
└── vercel.json          # Deployment configuration
```

## 🚀 Quick Start Guide

### Node.js Backend (API + Admin Panel)
```bash
# Development server with admin panel
npm run dev           # Starts server on http://localhost:3000
                     # Admin panel: http://localhost:3000/admin

# Production server
npm start

# Database operations (scripts still available)
npm run reset:database
npm run fix:all
```

### Python Camoufox Scraper
```bash
cd python

# Setup (first time)
python setup.py          # Automated setup with dependency installation
python install_deps.py   # Alternative: Install only core dependencies

# Testing
python test.py           # Test scraper functionality

# Scraping
python run_scraper.py list                    # List all categories
python run_scraper.py test sinerji            # Test site connection
python run_scraper.py scrape sinerji_islemci  # Scrape single category
python run_scraper.py scrape-all              # Scrape all categories
```

## 🔧 Architecture Overview

### Optimized Hybrid System (v6.0.0)
- **Node.js Backend**: API + Admin Panel + JWT Authentication
- **Python Scraper**: Enhanced stealth, Camoufox-based scraping
- **Shared Database**: MongoDB Atlas with same schema
- **Separated Concerns**: Clean architecture with focused responsibilities

### Key Advantages

#### Node.js Backend (Optimized v6.0.0)
- ✅ JWT Authentication system
- ✅ Complete admin panel with product specification management
- ✅ Clean MVC architecture with proper route separation
- ✅ Vercel deployment ready
- ✅ Removed unnecessary dependencies and utilities

#### Python Scraper (Enhanced)
- ✅ Firefox-based stealth (Camoufox)
- ✅ Lower memory usage (~20-30% less)
- ✅ Built-in Cloudflare bypass capabilities
- ✅ Enhanced anti-detection features
- ✅ Optimized dependency list (no duplicate FastAPI)

## 📊 Site Coverage

Both scrapers support **21 categories** across **3 sites**:

### İnceHesap (Pagination)
- İşlemci, Ekran Kartı, Anakart, RAM, SSD, Güç Kaynağı, Bilgisayar Kasası

### İtopya (Infinite Scroll)  
- İşlemci, Ekran Kartı, Anakart, RAM, SSD, Güç Kaynağı, Bilgisayar Kasası

### Sinerji (Pagination)
- İşlemci, Ekran Kartı, Anakart, RAM, SSD, Güç Kaynağı, Bilgisayar Kasası

## 🗄️ Database Schema

### Shared Collections
- **products**: Product data with price history
- **categories**: Category metadata  
- **adminusers**: Authentication data
- **productspecifications**: Technical specifications

### Category Naming Convention
- Format: `{site}_{category}` (e.g., `sinerji_ekran-karti`)
- Uses dashes for multi-word categories
- Consistent across both scrapers

## 🔗 API Endpoints

### Common Endpoints (Both Systems)
- `GET /api/categories` - List all categories
- `GET /api/data/{category}` - Get category products
- `GET /api/search/{category}?q=term` - Search products
- `GET /api/stats` - Database statistics

### Node.js Specific
- `GET /api/specifications` - Product specifications
- `POST /api/auth/login` - Admin authentication
- Admin panel at `/admin`

### Python Specific  
- `POST /api/scrape/category/{category}` - Background scraping
- `GET /api/compare/engines` - Engine comparison
- Interactive docs at `/docs`

## 🛠️ Development Workflow

### Adding New Sites
1. **Node.js**: Add config to `config/sites/{site}.js`
2. **Python**: Update `python/scraper/config.py`
3. Test with single category first
4. Deploy and verify API endpoints

### Debugging Issues
1. **Data Issues**: Use `npm run debug:all` or `python test.py`
2. **Scraping Issues**: Check logs and run single category tests
3. **API Issues**: Test endpoints with `/docs` or admin panel

## 📝 File Cleanup Completed

### ✅ Removed
- `parallel-scraper.js` - Parallel scraping (no longer needed)
- `scripts/scrape-all-parallel.js` - Parallel script
- Old Python files from root directory
- Duplicate Python configs

### ✅ Organized
- All Python files moved to `python/` directory
- Shorter Python file names for easier use
- Updated import paths and references
- Enhanced .gitignore for Python files

### ✅ Added
- `python/README.md` - Quick reference for Python scraper
- `PROJECT_STRUCTURE.md` - This overview document
- Organized documentation

## 🎯 Next Steps

1. **Current**: Use Node.js scraper for production stability
2. **Testing**: Test Python scraper in parallel for comparison
3. **Migration**: Gradually switch to Python for better stealth if needed
4. **Monitoring**: Compare performance and detection rates

Both systems can run simultaneously, allowing for A/B testing and gradual migration based on performance requirements.