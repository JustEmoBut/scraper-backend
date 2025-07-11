# TechPrice Scraper API

> ⚠️ **AI-Generated Project Notice**: This project was developed with AI assistance. While functional, there may be bugs, incomplete features, or areas that need improvement. Contributions and feedback are welcome to help enhance the codebase.

A powerful e-commerce product scraping and price tracking system with a RESTful API, built with Node.js and Python.

## 🚀 Features

- **Multi-platform Scraping**: Supports İnceHesap, İtopya, and Sinerji e-commerce sites
- **RESTful API**: 75+ endpoints for products, categories, search, and analytics
- **Dual Architecture**: Node.js API server + Python Camoufox scraper
- **Product Specifications**: Comprehensive technical specification management system
- **Admin Panel**: Web-based administration interface with authentication
- **Anti-Detection**: Advanced stealth capabilities with Cloudflare bypass
- **Real-time Analytics**: Price trends, product statistics, and market insights

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB Atlas** with Mongoose ODM
- **JWT** authentication
- **Vercel** serverless deployment

### Scraper
- **Python 3.8+** with asyncio
- **Camoufox** (Firefox-based browser automation)
- **Motor** (MongoDB async driver)
- **Anti-detection** and stealth features

## 📦 Installation

### Prerequisites
- Node.js 16+
- Python 3.8+
- MongoDB Atlas account
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/JustEmoBut/scraper-backend.git
cd scraper-backend
```

### 2. Install Node.js Dependencies
```bash
npm install
```

### 3. Install Python Dependencies
```bash
cd python
python setup.py
# or manually:
pip install -r requirements.txt
```

### 4. Environment Configuration
Copy the example environment file and configure your settings:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name

# Server Configuration
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Authentication
JWT_SECRET=your_jwt_secret_key_here_minimum_32_characters

# Browser Settings (for Python scraper)
HEADLESS=false
USER_DATA_DIR=./python_user_data

# Performance Settings
MAX_CONCURRENT_BROWSERS=3
TIMEOUT=60000
LOG_LEVEL=INFO
```

### 5. Database Setup
The application will automatically create the necessary collections and indexes when you first run it.

## 🎯 Quick Start

### Start the Development Server
```bash
npm run dev
```

### Run the Python Scraper
```bash
cd python
python run_scraper.py scrape-all
```

### Access the API
- API Base URL: `http://localhost:3000/api`
- Admin Panel: `http://localhost:3000`
- API Documentation: Check `/api/stats` for available endpoints

## 📚 API Usage

### Public Endpoints

#### Get All Categories
```bash
curl http://localhost:3000/api/categories
```

#### Search Products
```bash
curl "http://localhost:3000/api/search/all?q=rtx&limit=10"
```

#### Get Products by Category
```bash
curl "http://localhost:3000/api/data/ekran-karti?page=1&limit=20"
```

#### Get Statistics
```bash
curl http://localhost:3000/api/stats
```

### Protected Endpoints (Admin)

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

#### Create Product Specification
```bash
curl -X POST http://localhost:3000/api/specifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "NVIDIA RTX 4070 Ti",
    "category": "ekran-karti",
    "brand": "NVIDIA",
    "specifications": {
      "bellekBoyutu": "12GB",
      "bellekTipi": "GDDR6X"
    }
  }'
```

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Development server with auto-reload
npm start           # Production server
npm run health      # System health check
npm run debug:all   # Debug all scraped data
npm run fix:all     # Fix duplicate products
npm run reset:database  # Reset database (DANGEROUS)
```

### Python Scraper Commands
```bash
cd python
python run_scraper.py scrape itopya_islemci    # Scrape single category
python run_scraper.py scrape-all               # Scrape all categories
python run_scraper.py test itopya              # Test single site
python run_scraper.py stats                    # Database statistics
```

### Project Structure
```
├── api/                 # Vercel serverless functions
├── config/             # Database and site configurations
├── controllers/        # API request handlers
├── models/            # MongoDB schemas
├── routes/            # API route definitions
├── middleware/        # Authentication and validation
├── python/            # Python scraper
│   ├── scraper/       # Main scraper package
│   ├── api.py         # FastAPI backend
│   └── run_scraper.py # CLI entry point
├── scripts/           # Maintenance utilities
└── utils/             # Helper functions
```

## 🔐 Security

### Authentication
- JWT-based authentication for admin operations
- bcrypt password hashing
- Role-based access control (admin/super_admin)
- Manual login required (no auto-login for security)

### Environment Variables
All sensitive data is externalized to environment variables:
- Database credentials
- JWT secrets
- API configurations
- Third-party service keys

### Security Best Practices
- CORS protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Rate limiting ready

## 🌐 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
1. Build the application: `npm run build`
2. Set production environment variables
3. Start the server: `npm start`

### Environment Variables for Production
```env
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Ensure environment variables are used for sensitive data
- Test both Node.js API and Python scraper components

## 📖 Documentation

- **API Endpoints**: See `CLAUDE.md` for comprehensive API documentation
- **Specifications**: Check `models/ProductSpecification.js` for technical specs system
- **Configuration**: Review `config/` directory for site configurations
- **Deployment**: Vercel configuration in `vercel.json`

## 🐛 Troubleshooting

### Common Issues

#### MongoDB Connection Issues
- Verify `MONGODB_URI` in your `.env` file
- Check network connectivity
- Ensure database user has proper permissions

#### Scraper Issues
- Install Camoufox manually: `pip install camoufox`
- Check Python version (3.8+ required)
- Verify site configurations in `python/scraper/config.py`

#### Authentication Issues
- Ensure `JWT_SECRET` is set and secure
- Check token expiration (default 24h)
- Verify admin user exists in database

### Getting Help
- Check the API health: `GET /api/test-connection`
- Review system statistics: `GET /api/stats`
- Check application logs for detailed error messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- **Frontend**: Compatible with any frontend framework
- **Analytics**: Built-in analytics endpoints for data visualization
- **Mobile API**: RESTful design supports mobile applications

## 🙏 Acknowledgments

- Built with modern web technologies
- Uses ethical scraping practices
- Respects robots.txt and rate limiting
- Open source community contributions welcome

---

**⚠️ Legal Notice**: This tool is for educational and research purposes. Always respect website terms of service and implement appropriate rate limiting and ethical scraping practices.