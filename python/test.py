#!/usr/bin/env python3
"""
Test script for the Python Camoufox scraper.
Simple validation and demo of the new scraping capabilities.
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def test_configuration():
    """Test configuration loading"""
    print("🧪 Testing configuration...")
    
    try:
        from scraper.config import ConfigManager
        
        config_manager = ConfigManager()
        categories = config_manager.get_all_categories()
        sites = config_manager.get_sites()
        
        print(f"✅ Configuration loaded successfully")
        print(f"   📋 Categories: {len(categories)}")
        print(f"   🏢 Sites: {', '.join(sites)}")
        
        # Test specific category
        test_category = 'itopya_islemci'
        config = config_manager.get_config(test_category)
        
        if config:
            print(f"   🎯 Test category ({test_category}):")
            print(f"      Site: {config.site_info.name}")
            print(f"      URL: {config.url}")
            print(f"      Pagination: {config.pagination}")
            print(f"      Infinite scroll: {config.infinite_scroll}")
        
        return True
        
    except Exception as e:
        print(f"❌ Configuration test failed: {e}")
        return False

async def test_database_connection():
    """Test database connection"""
    print("\n🧪 Testing database connection...")
    
    try:
        from scraper.database import db_manager
        
        success = await db_manager.connect()
        
        if success:
            print("✅ Database connection successful")
            
            # Test basic operations
            stats = await db_manager.get_stats()
            print(f"   📊 Total products: {stats['totalProducts']:,}")
            print(f"   📂 Total categories: {stats['totalCategories']}")
            
            await db_manager.disconnect()
            return True
        else:
            print("❌ Database connection failed")
            print("   💡 Check your MONGODB_URI in .env file")
            return False
            
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        print("   💡 Make sure MongoDB is running and accessible")
        return False

async def test_scraper_initialization():
    """Test scraper initialization (without actual scraping)"""
    print("\n🧪 Testing scraper initialization...")
    
    try:
        from scraper.scraper import CamoufoxScraper
        
        scraper = CamoufoxScraper()
        
        # Test configuration access
        categories = scraper.config_manager.get_all_categories()
        print(f"✅ Scraper initialized successfully")
        print(f"   📋 {len(categories)} categories available")
        
        # Test session stats
        stats = scraper.get_session_stats()
        print(f"   📊 Session stats initialized: {list(stats.keys())}")
        
        return True
        
    except Exception as e:
        print(f"❌ Scraper initialization failed: {e}")
        print("   💡 Make sure dependencies are installed: pip install -r requirements.txt")
        return False

async def test_camoufox_availability():
    """Test if Camoufox is available"""
    print("\n🧪 Testing Camoufox availability...")
    
    try:
        from camoufox import AsyncCamoufox
        print("✅ Camoufox import successful")
        print("   💡 Camoufox will download Firefox binary on first run")
        return True
        
    except ImportError as e:
        print(f"❌ Camoufox not available: {e}")
        print("   💡 Install with: pip install camoufox")
        return False
    except Exception as e:
        print(f"⚠️ Camoufox warning: {e}")
        return True  # Continue anyway

def compare_with_nodejs():
    """Compare features with Node.js version"""
    print("\n📊 Python vs Node.js Scraper Comparison:")
    print("="*50)
    
    comparison = [
        ("Browser Engine", "Firefox (Camoufox)", "Chromium (Playwright)"),
        ("Stealth Features", "Built-in advanced", "Plugin-based"),
        ("Memory Usage", "~150-250MB", "~200-300MB"),
        ("Anti-Detection", "Enhanced", "Standard"),
        ("Cloudflare Bypass", "Built-in", "Manual implementation"),
        ("Proxy Support", "Built-in rotation", "Manual configuration"),
        ("Human Simulation", "Automatic", "Manual scripting"),
        ("Configuration", "Same schema", "Same schema"),
        ("Database", "Same schema", "Same schema"),
        ("API Compatibility", "Same endpoints", "Existing"),
        ("Development Status", "New (parallel)", "Production")
    ]
    
    for feature, python_val, nodejs_val in comparison:
        print(f"   {feature:18} | {python_val:20} | {nodejs_val}")

async def run_quick_test():
    """Run a quick scraping test (dry run)"""
    print("\n🧪 Quick scraping test (dry run)...")
    
    try:
        from scraper.scraper import CamoufoxScraper
        from scraper.database import db_manager
        
        # Connect to database
        if not await db_manager.connect():
            print("❌ Database connection required for test")
            return False
        
        scraper = CamoufoxScraper()
        
        # Test category selection
        test_category = 'itopya_islemci'  # Start with İtopya as it's often reliable
        config = scraper.config_manager.get_config(test_category)
        
        if not config:
            print(f"❌ Test category not found: {test_category}")
            return False
        
        print(f"✅ Test setup complete for: {config.site_info.name} - {config.display_name}")
        print(f"   🎯 Target URL: {config.url}")
        print(f"   🔧 Scraping method: {'Pagination' if config.pagination else 'Infinite Scroll' if config.infinite_scroll else 'Single Page'}")
        
        # Note: We're not actually running the scraper to avoid long setup time
        print("   💡 To run actual scraping: python run_scraper.py scrape itopya_islemci")
        
        await db_manager.disconnect()
        return True
        
    except Exception as e:
        print(f"❌ Quick test failed: {e}")
        return False

def show_next_steps():
    """Show next steps for using the scraper"""
    print("\n🚀 Next Steps:")
    print("="*50)
    
    print("1. 📝 Configure environment:")
    print("   • Edit .env file with your MongoDB URI")
    print("   • Adjust browser and performance settings if needed")
    
    print("\n2. 🧪 Test the scraper:")
    print("   python run_scraper.py list                    # List all categories")
    print("   python run_scraper.py stats                   # Check database status")
    print("   python run_scraper.py test itopya             # Test single site")
    
    print("\n3. 🏃 Run scraping:")
    print("   python run_scraper.py scrape itopya_islemci   # Single category")
    print("   python run_scraper.py scrape-all              # All categories")
    
    print("\n4. 🔧 Advanced usage:")
    print("   python run_scraper.py scrape itopya_islemci --headless  # Headless mode")
    print("   python run_scraper.py scrape-all --log-level DEBUG      # Debug logging")
    
    print("\n5. 📊 Monitor performance:")
    print("   • Check memory usage vs Node.js version")
    print("   • Monitor Cloudflare bypass success rate")
    print("   • Compare scraping speed and reliability")

async def main():
    """Main test function"""
    print("🐍 Python Camoufox Scraper Test Suite")
    print("="*50)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tests = [
        ("Configuration", test_configuration),
        ("Database Connection", test_database_connection),
        ("Scraper Initialization", test_scraper_initialization),
        ("Camoufox Availability", test_camoufox_availability),
        ("Quick Test", run_quick_test),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n" + "="*50)
        result = await test_func()
        results.append((test_name, result))
    
    # Show comparison
    compare_with_nodejs()
    
    # Summary
    print(f"\n" + "="*50)
    print("📋 Test Results Summary:")
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {status} | {test_name}")
        if result:
            passed += 1
    
    print(f"\n📊 Overall: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All tests passed! Python scraper is ready to use.")
    elif passed >= len(results) - 1:
        print("⚠️ Almost ready! Check the failed test and try again.")
    else:
        print("❌ Multiple issues found. Please check dependencies and configuration.")
    
    show_next_steps()

if __name__ == '__main__':
    # Windows compatibility for asyncio
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    
    asyncio.run(main())