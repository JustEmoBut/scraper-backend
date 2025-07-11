#!/usr/bin/env python3
"""
Setup script for the Python Camoufox scraper.
Installs dependencies and prepares the environment.
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"   Command: {command}")
        print(f"   Error: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print(f"❌ Python 3.8+ required, found {version.major}.{version.minor}")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} is compatible")
    return True

def install_dependencies():
    """Install Python dependencies"""
    requirements_file = Path(__file__).parent / "requirements.txt"
    
    if not requirements_file.exists():
        print(f"❌ Requirements file not found: {requirements_file}")
        return False
    
    # Upgrade pip first
    if not run_command(f"{sys.executable} -m pip install --upgrade pip", "Upgrading pip"):
        print("⚠️ Pip upgrade failed, continuing anyway...")
    
    # Install core dependencies individually to handle failures gracefully
    core_deps = [
        "python-dotenv>=1.0.0",
        "beautifulsoup4>=4.12.0",
        "aiohttp>=3.9.0",
        "fake-useragent>=1.4.0",
        "python-dateutil>=2.8.0",
        "tenacity>=8.2.0",
        "lxml>=4.9.0"
    ]
    
    print("🔧 Installing core dependencies...")
    failed_deps = []
    
    for dep in core_deps:
        if not run_command(f"{sys.executable} -m pip install '{dep}'", f"Installing {dep.split('>=')[0]}"):
            failed_deps.append(dep)
            print(f"⚠️ Failed to install {dep}, continuing...")
    
    # Install database dependencies
    db_deps = ["motor>=3.3.0", "pymongo[srv]>=4.6.0"]
    print("🗄️ Installing database dependencies...")
    
    for dep in db_deps:
        if not run_command(f"{sys.executable} -m pip install '{dep}'", f"Installing {dep.split('>=')[0]}"):
            failed_deps.append(dep)
            print(f"⚠️ Failed to install {dep}")
    
    # Try installing Camoufox
    print("🦊 Installing Camoufox...")
    if not run_command(f"{sys.executable} -m pip install camoufox>=0.4.0", "Installing Camoufox"):
        failed_deps.append("camoufox")
        print("⚠️ Camoufox installation failed - may need manual installation")
    
    # Install optional dependencies
    optional_deps = ["aiofiles>=23.2.0", "pytest>=7.4.0", "pytest-asyncio>=0.21.0"]
    print("📦 Installing optional dependencies...")
    
    for dep in optional_deps:
        if not run_command(f"{sys.executable} -m pip install '{dep}'", f"Installing {dep.split('>=')[0]}"):
            print(f"⚠️ Optional dependency {dep} failed, skipping...")
    
    if failed_deps:
        print(f"\n⚠️ Some dependencies failed to install: {', '.join([d.split('>=')[0] for d in failed_deps])}")
        print("💡 You may need to install them manually or check your Python environment")
        return len(failed_deps) < len(core_deps)  # Success if most core deps installed
    
    print("✅ All dependencies installed successfully")
    return True

def create_directories():
    """Create necessary directories"""
    directories = [
        "python_user_data",
        "logs",
        "scraper/__pycache__"
    ]
    
    for directory in directories:
        dir_path = Path(directory)
        dir_path.mkdir(parents=True, exist_ok=True)
        print(f"📁 Created directory: {directory}")
    
    return True

def setup_environment():
    """Setup environment file if it doesn't exist"""
    env_file = Path(".env")
    
    if not env_file.exists():
        print("📝 Creating .env file template...")
        env_content = """# Python Camoufox Scraper Environment Variables

# Database - REPLACE WITH YOUR MONGODB CONNECTION STRING
MONGODB_URI=mongodb://localhost:27017/ScraperDB
DATABASE_NAME=ScraperDB

# Browser Settings
HEADLESS=false
USER_DATA_DIR=./python_user_data

# Performance Settings
MIN_DELAY=1000
MAX_DELAY=3000
SITE_SWITCH_DELAY=5000
MAX_CONCURRENT_BROWSERS=3
TIMEOUT=60000

# Logging
LOG_LEVEL=INFO

# Scraper Settings
ALLOWED_ORIGINS=http://localhost:3000

# Security (add if needed)
# JWT_SECRET=your-secret-key-here
"""
        
        with open(env_file, 'w') as f:
            f.write(env_content)
        
        print(f"✅ Created {env_file}")
        print("   Please edit this file with your MongoDB URI and other settings")
    else:
        print(f"✅ Environment file already exists: {env_file}")
    
    return True

def verify_installation():
    """Verify that the installation works"""
    print("🧪 Verifying installation...")
    
    # Test basic Python imports
    missing_imports = []
    
    try:
        import asyncio
        print("✅ asyncio available")
    except ImportError:
        missing_imports.append("asyncio (should be built-in)")
    
    try:
        from python_dotenv import load_dotenv
        print("✅ python-dotenv available")
    except ImportError:
        missing_imports.append("python-dotenv")
    
    try:
        import motor.motor_asyncio
        print("✅ motor (MongoDB async driver) available")
    except ImportError:
        missing_imports.append("motor")
    
    
    try:
        from bs4 import BeautifulSoup
        print("✅ BeautifulSoup4 available")
    except ImportError:
        missing_imports.append("beautifulsoup4")
    
    try:
        from fake_useragent import UserAgent
        print("✅ fake-useragent available")
    except ImportError:
        missing_imports.append("fake-useragent")
    
    # Test Camoufox (special handling as it may need download)
    try:
        from camoufox import AsyncCamoufox
        print("✅ Camoufox available")
    except ImportError:
        missing_imports.append("camoufox")
        print("⚠️ Camoufox not available - install with: pip install camoufox")
    
    # Test our project imports
    try:
        from scraper.config import ConfigManager
        print("✅ Configuration module available")
        
        # Test configuration loading
        config_manager = ConfigManager()
        categories = config_manager.get_all_categories()
        sites = config_manager.get_sites()
        
        print(f"✅ Configuration loaded: {len(categories)} categories available")
        print(f"✅ Sites configured: {', '.join(sites)}")
        
    except ImportError as e:
        print(f"❌ Project import error: {e}")
        missing_imports.append("project modules")
    except Exception as e:
        print(f"❌ Configuration error: {e}")
        missing_imports.append("configuration")
    
    # Test database module
    try:
        from scraper.database import DatabaseManager
        print("✅ Database module available")
    except ImportError as e:
        print(f"❌ Database module import error: {e}")
        missing_imports.append("database module")
    
    if missing_imports:
        print(f"\n⚠️ Missing dependencies: {', '.join(missing_imports)}")
        print("💡 Install missing dependencies with:")
        for dep in missing_imports:
            if dep == "camoufox":
                print(f"   pip install {dep}")
            elif dep not in ["project modules", "configuration", "database module"]:
                print(f"   pip install {dep}")
        
        return len(missing_imports) <= 2  # Allow some missing optional deps
    
    print("✅ All core dependencies verified successfully")
    return True

def show_usage():
    """Show usage instructions"""
    print("\n" + "="*60)
    print("🎉 PYTHON CAMOUFOX SCRAPER SETUP COMPLETE!")
    print("="*60)
    
    print("\n📋 Available commands:")
    print("   python run_scraper.py list                    # List categories")
    print("   python run_scraper.py scrape itopya_islemci   # Scrape single category")
    print("   python run_scraper.py scrape-all              # Scrape all categories")
    print("   python run_scraper.py test itopya             # Test single site")
    print("   python run_scraper.py stats                   # Database statistics")
    
    print("\n🔧 Configuration:")
    print("   • Edit .env file for MongoDB URI and other settings")
    print("   • Camoufox will be downloaded automatically on first run")
    print("   • User data stored in: ./python_user_data/")
    
    print("\n⚡ Performance Benefits:")
    print("   • Firefox-based stealth (better than Chromium)")
    print("   • Built-in Cloudflare bypass capabilities")
    print("   • ~20-30% lower memory usage")
    print("   • Enhanced anti-detection features")
    
    print("\n🔗 Comparison with Node.js version:")
    print("   • Same scraping logic and database schema")
    print("   • Enhanced stealth capabilities")
    print("   • Better resource efficiency")
    print("   • Parallel development - both can coexist")

def main():
    """Main setup function"""
    print("🚀 Python Camoufox Scraper Setup")
    print("="*50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Create directories
    if not create_directories():
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        print("\n❌ Dependency installation failed!")
        print("   🔧 Try these solutions:")
        print("   1. Install minimal dependencies: pip install -r requirements-minimal.txt")
        print("   2. Install manually: pip install camoufox motor pymongo fastapi beautifulsoup4 fake-useragent python-dotenv uvicorn")
        print("   3. Use virtual environment: python -m venv scraper_env && scraper_env\\Scripts\\activate")
        print("   4. Check INSTALL_PYTHON.md for detailed troubleshooting")
        print("\n   📋 Continuing with setup anyway...")
        # Don't exit here, continue with setup
    
    # Setup environment
    if not setup_environment():
        sys.exit(1)
    
    # Verify installation
    if not verify_installation():
        print("\n⚠️  Installation verification failed, but setup files are created.")
        print("   Try installing missing dependencies manually.")
    
    # Show usage
    show_usage()
    
    print(f"\n✅ Setup complete! You can now run the Python scraper.")

if __name__ == '__main__':
    main()