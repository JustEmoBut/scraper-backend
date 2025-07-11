"""
Command-line interface for the Python Camoufox scraper.
Provides equivalent functionality to the Node.js scraper.js CLI.
"""

import asyncio
import argparse
import sys
import logging
from typing import Optional
from datetime import datetime

from .scraper import CamoufoxScraper
from .database import db_manager
from .config import ConfigManager, settings

# Setup logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ScraperCLI:
    """Command-line interface for the scraper"""
    
    def __init__(self):
        self.scraper = CamoufoxScraper()
        self.config_manager = ConfigManager()
    
    async def initialize(self) -> bool:
        """Initialize database connection"""
        try:
            success = await db_manager.connect()
            if success:
                logger.info("Database connection established")
                return True
            else:
                logger.error("Database connection failed")
                return False
        except Exception as e:
            logger.error(f"Initialization error: {e}")
            return False
    
    async def cleanup(self):
        """Cleanup resources"""
        # New scraper uses context managers, so no manual cleanup needed
        await db_manager.disconnect()
    
    async def scrape_single_category(self, category_key: str) -> bool:
        """Scrape a single category"""
        if not await self.initialize():
            return False
        
        try:
            logger.info(f"🚀 Starting scrape for category: {category_key}")
            start_time = datetime.now()
            
            result = await self.scraper.scrape_category(category_key)
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            if result['success']:
                logger.info(f"✅ Scraping completed successfully!")
                logger.info(f"📊 Site: {result['site']}")
                logger.info(f"📦 Products found: {result['productCount']}")
                logger.info(f"⏱️ Duration: {duration:.1f} seconds")
                
                if 'stats' in result:
                    stats = result['stats']
                    logger.info(f"📈 New: {stats.get('new_products', 0)}, "
                               f"Updated: {stats.get('updated_products', 0)}, "
                               f"Price changes: {stats.get('price_changes', 0)}")
                
                return True
            else:
                logger.error(f"❌ Scraping failed: {result['error']}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Scraping error: {e}")
            return False
        finally:
            await self.cleanup()
    
    async def scrape_all_categories(self) -> bool:
        """Scrape all categories"""
        if not await self.initialize():
            return False
        
        try:
            logger.info("🚀 Starting scrape for all categories")
            start_time = datetime.now()
            
            results = await self.scraper.scrape_all_categories()
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            summary = results['summary']
            
            logger.info(f"✅ All categories scraping completed!")
            logger.info(f"📊 Summary:")
            logger.info(f"   • Total categories: {summary['totalCategories']}")
            logger.info(f"   • Successful: {summary['successfulCategories']}")
            logger.info(f"   • Total products: {summary['totalProducts']}")
            logger.info(f"   • Duration: {duration:.1f} seconds")
            logger.info(f"   • Pages scraped: {summary['sessionStats']['pages_scraped']}")
            logger.info(f"   • Challenges solved: {summary['sessionStats']['challenges_solved']}")
            
            # Show category-wise results
            failed_categories = []
            for category, result in results['results'].items():
                if result['success']:
                    logger.info(f"   ✅ {category}: {result['productCount']} products")
                else:
                    logger.error(f"   ❌ {category}: {result['error']}")
                    failed_categories.append(category)
            
            if failed_categories:
                logger.warning(f"Failed categories: {', '.join(failed_categories)}")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"❌ All categories scraping error: {e}")
            return False
        finally:
            await self.cleanup()
    
    async def list_categories(self):
        """List available categories"""
        categories = self.config_manager.get_all_categories()
        
        print("📋 Available categories:")
        print("=" * 50)
        
        sites = {}
        for category_key in categories:
            config = self.config_manager.get_config(category_key)
            if config:  # Check if config exists
                site_name = config.site_info.name
                
                if site_name not in sites:
                    sites[site_name] = []
                
                sites[site_name].append({
                    'key': category_key,
                    'name': config.display_name,
                    'url': config.url
                })
        
        for site_name, site_categories in sites.items():
            print(f"\n🏢 {site_name}:")
            for cat in site_categories:
                print(f"   • {cat['key']} ({cat['name']})")
    
    async def test_single_site(self, site_name: str) -> bool:
        """Test scraping for a single site"""
        if not await self.initialize():
            return False
        
        try:
            site_categories = self.config_manager.get_site_categories(site_name)
            
            if not site_categories:
                logger.error(f"No categories found for site: {site_name}")
                return False
            
            # Test with first category
            test_category = site_categories[0]
            logger.info(f"🧪 Testing site {site_name} with category: {test_category}")
            
            result = await self.scraper.scrape_category(test_category)
            
            if result['success']:
                logger.info(f"✅ Site test successful! Found {result['productCount']} products")
                return True
            else:
                logger.error(f"❌ Site test failed: {result['error']}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Site test error: {e}")
            return False
        finally:
            await self.cleanup()
    
    async def get_database_stats(self):
        """Get database statistics"""
        if not await self.initialize():
            return
        
        try:
            stats = await db_manager.get_stats()
            
            print("📊 Database Statistics:")
            print("=" * 50)
            print(f"Total products: {stats['totalProducts']:,}")
            print(f"Total categories: {stats['totalCategories']}")
            print(f"Recent scrapes today: {stats['recentScrapes']}")
            print(f"Last updated: {stats['lastUpdated']}")
            
            print("\n🏢 Products by site:")
            for site, site_stats in stats['siteStats'].items():
                avg_price = site_stats['avgPrice']
                print(f"   • {site}: {site_stats['count']:,} products "
                      f"(avg: ₺{avg_price:,.0f})" if avg_price else "")
            
        except Exception as e:
            logger.error(f"❌ Stats error: {e}")
        finally:
            await self.cleanup()

def create_parser() -> argparse.ArgumentParser:
    """Create command-line argument parser"""
    parser = argparse.ArgumentParser(
        description='Python Camoufox Scraper - Enhanced stealth web scraping',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  %(prog)s scrape itopya_islemci           # Scrape single category
  %(prog)s scrape-all                      # Scrape all categories
  %(prog)s test itopya                     # Test single site
  %(prog)s list                           # List available categories
  %(prog)s stats                          # Show database statistics
        '''
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Scrape single category
    scrape_parser = subparsers.add_parser('scrape', help='Scrape single category')
    scrape_parser.add_argument('category', help='Category key (e.g., itopya_islemci)')
    
    # Scrape all categories
    subparsers.add_parser('scrape-all', help='Scrape all categories')
    
    # Test single site
    test_parser = subparsers.add_parser('test', help='Test single site')
    test_parser.add_argument('site', help='Site name (incehesap, itopya, sinerji)')
    
    # List categories
    subparsers.add_parser('list', help='List available categories')
    
    # Database stats
    subparsers.add_parser('stats', help='Show database statistics')
    
    # Global options
    parser.add_argument('--headless', action='store_true', 
                       help='Run browser in headless mode')
    parser.add_argument('--log-level', choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
                       default='INFO', help='Set logging level')
    
    return parser

async def main():
    """Main CLI entry point"""
    parser = create_parser()
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Set log level
    logging.getLogger().setLevel(getattr(logging, args.log_level))
    
    # Override headless setting if specified
    if args.headless:
        import os
        os.environ['HEADLESS'] = 'true'
    
    cli = ScraperCLI()
    
    try:
        if args.command == 'scrape':
            success = await cli.scrape_single_category(args.category)
            sys.exit(0 if success else 1)
        
        elif args.command == 'scrape-all':
            success = await cli.scrape_all_categories()
            sys.exit(0 if success else 1)
        
        elif args.command == 'test':
            success = await cli.test_single_site(args.site)
            sys.exit(0 if success else 1)
        
        elif args.command == 'list':
            await cli.list_categories()
        
        elif args.command == 'stats':
            await cli.get_database_stats()
    
    except KeyboardInterrupt:
        logger.info("Operation cancelled by user")
        await cli.cleanup()
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        await cli.cleanup()
        sys.exit(1)

if __name__ == '__main__':
    # Windows compatibility for asyncio
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    
    asyncio.run(main())