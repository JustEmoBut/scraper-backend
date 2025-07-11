#!/usr/bin/env python3
"""
Quick installation script for core Python scraper dependencies.
Use this if the main setup fails.
"""

import subprocess
import sys

def install_package(package):
    """Install a single package"""
    try:
        print(f"Installing {package}...")
        subprocess.run([sys.executable, "-m", "pip", "install", package], 
                      check=True, capture_output=True, text=True)
        print(f"✅ {package} installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install {package}: {e.stderr}")
        return False

def main():
    """Install core dependencies one by one"""
    print("🔧 Installing core Python scraper dependencies...")
    print("=" * 50)
    
    # Core packages in order of importance
    packages = [
        # Essential utilities
        "python-dotenv",
        
        # HTTP and parsing (essential for scraping)
        "aiohttp",
        "beautifulsoup4",
        "fake-useragent",
        "lxml",
        
        # Database (essential for data storage)
        "pymongo",
        "motor",
        
        # Browser automation (most important for scraping)
        "camoufox",
        
        # Optional utilities
        "tenacity",
        "python-dateutil",
        "aiofiles"
    ]
    
    successful = []
    failed = []
    
    for package in packages:
        if install_package(package):
            successful.append(package)
        else:
            failed.append(package)
    
    print("\n" + "=" * 50)
    print("📊 Installation Summary:")
    print(f"✅ Successful: {len(successful)}/{len(packages)}")
    
    if successful:
        print("\n✅ Successfully installed:")
        for pkg in successful:
            print(f"   • {pkg}")
    
    if failed:
        print("\n❌ Failed to install:")
        for pkg in failed:
            print(f"   • {pkg}")
        
        print("\n🔧 Manual installation commands:")
        for pkg in failed:
            print(f"   pip install {pkg}")
    
    print(f"\n🎯 Installation Status: {len(successful)}/{len(packages)} packages")
    
    if len(successful) >= len(packages) * 0.8:  # 80% success rate
        print("🎉 Core dependencies mostly installed! You can proceed with testing.")
        print("   Run: python test.py")
    else:
        print("⚠️ Many dependencies failed. Check your Python environment:")
        print("   • Python version: python --version (need 3.8+)")
        print("   • Pip version: pip --version")
        print("   • Try using virtual environment")
        print("   • Check INSTALL_PYTHON.md for detailed troubleshooting")

if __name__ == "__main__":
    main()