# Contributing to TechPrice Scraper API

Thank you for your interest in contributing to the TechPrice Scraper API! This document provides guidelines and information for contributors.

## 🚀 Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/JustEmoBut/scraper-api-backend.git
   cd scraper-api-backend
   ```
3. **Install dependencies**:
   ```bash
   npm install
   cd python && python setup.py
   ```
4. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```
5. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🛠️ Development Environment

### Prerequisites
- Node.js 16+
- Python 3.8+
- MongoDB Atlas account or local MongoDB
- Git

### Environment Setup
1. Copy `.env.example` to `.env`
2. Configure your MongoDB URI and other settings
3. Install dependencies for both Node.js and Python components

### Running the Application
```bash
# Start Node.js API server
npm run dev

# In another terminal, run Python scraper
cd python
python run_scraper.py scrape-all
```

## 📝 Coding Guidelines

### General Principles
- **Security First**: Never commit sensitive data (API keys, passwords, tokens)
- **Environment Variables**: Use `.env` for all configuration
- **Code Quality**: Write clean, readable, and maintainable code
- **Documentation**: Document new features and API endpoints

### Node.js Code Style
- Use modern ES6+ features
- Follow existing code patterns and conventions
- Use descriptive variable and function names
- Implement proper error handling
- Add JSDoc comments for functions and classes

### Python Code Style
- Follow PEP 8 style guidelines
- Use type hints where appropriate
- Write docstrings for functions and classes
- Use async/await for I/O operations
- Handle exceptions gracefully

### Database Schema
- Follow existing Mongoose schema patterns
- Add appropriate indexes for performance
- Use descriptive field names
- Include validation rules

## 🔒 Security Guidelines

### Sensitive Data
- **NEVER** commit `.env` files with real credentials
- **ALWAYS** use environment variables for sensitive configuration
- **NEVER** hardcode API keys, passwords, or secrets
- **USE** the provided `.env.example` as a template

### Authentication
- JWT tokens for admin operations
- bcrypt for password hashing
- Role-based access control (admin/super_admin)
- Input validation and sanitization

### API Security
- CORS protection for cross-origin requests
- Rate limiting considerations
- Input validation on all endpoints
- SQL injection and XSS prevention

## 🧪 Testing

### Before Submitting
1. **Test the API**: Verify all endpoints work correctly
2. **Test the Scraper**: Run scraping operations successfully
3. **Check Data Integrity**: Ensure database operations are correct
4. **Verify Authentication**: Test login and protected endpoints

### Manual Testing Commands
```bash
# Test API health
curl http://localhost:3000/api/test-connection

# Test scraper
cd python && python run_scraper.py test itopya

# Check data integrity
npm run check:data
```

## 📋 Pull Request Process

### Before Creating a PR
1. **Sync with upstream**: Ensure your fork is up to date
2. **Test thoroughly**: All functionality should work as expected
3. **Clean commit history**: Use meaningful commit messages
4. **Update documentation**: Add/update relevant documentation

### PR Requirements
- [ ] Clear description of changes
- [ ] No sensitive data committed
- [ ] Environment variables used appropriately
- [ ] Code follows existing patterns
- [ ] Documentation updated if needed
- [ ] Manual testing completed

### Commit Message Format
```
type(scope): brief description

Detailed explanation if needed

- Bullet points for multiple changes
- Reference issues: Fixes #123
```

Examples:
- `feat(api): add product specification management endpoints`
- `fix(scraper): resolve Cloudflare detection issues`
- `docs(readme): update installation instructions`
- `refactor(auth): improve JWT token validation`

## 🏗️ Project Structure

Understanding the codebase structure will help you contribute effectively:

```
├── api/                 # Vercel serverless functions
├── config/             # Database and site configurations
├── controllers/        # API request handlers
├── models/            # MongoDB schemas
├── routes/            # API route definitions
├── middleware/        # Authentication and validation
├── python/            # Python scraper components
│   ├── scraper/       # Main scraper package
│   ├── api.py         # FastAPI backend
│   └── run_scraper.py # CLI entry point
├── scripts/           # Maintenance and utility scripts
├── utils/             # Helper functions
└── public/            # Static files (admin panel)
```

## 🎯 Contributing Areas

### High-Priority Areas
- **New Site Support**: Add configuration for additional e-commerce sites
- **Performance Optimization**: Improve scraping speed and efficiency
- **API Enhancements**: Add new endpoints or improve existing ones
- **Admin Panel Features**: Enhance the web-based admin interface
- **Documentation**: Improve setup guides and API documentation

### Feature Requests
- Advanced search functionality
- Price history analytics
- Product comparison features
- Notification systems
- API rate limiting
- Mobile API optimizations

### Bug Reports
When reporting bugs, please include:
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node.js version, Python version, OS)
- Error messages and logs
- Screenshots if applicable

## 📚 Resources

### Documentation
- **CLAUDE.md**: Comprehensive project documentation
- **API Endpoints**: Complete list of available endpoints
- **Database Schema**: Model definitions and relationships
- **Deployment Guide**: Vercel and manual deployment instructions

### Useful Scripts
```bash
npm run health          # Quick system health check
npm run debug:all       # Debug all scraped data
npm run fix:all         # Fix duplicate products
npm run check:data      # Verify data integrity
```

## 🤝 Community

### Getting Help
- Create an issue for questions or problems
- Check existing issues before creating new ones
- Provide detailed information when asking for help

### Code of Conduct
- Be respectful and inclusive
- Provide constructive feedback
- Help newcomers get started
- Focus on what's best for the project

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in the project documentation and release notes. Thank you for helping make this project better!

---

**Need help?** Don't hesitate to create an issue or reach out to the maintainers. We're here to help you get started with contributing!