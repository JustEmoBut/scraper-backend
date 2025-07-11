"""
Fixed Camoufox scraper implementation using proper context manager pattern.
Provides enhanced stealth capabilities with correct API usage.
"""

import asyncio
import logging
import random
import re
import json
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from urllib.parse import urljoin, urlparse

try:
    from camoufox.async_api import AsyncCamoufox
except ImportError:
    print("Camoufox not installed. Install with: pip install camoufox")
    raise

from fake_useragent import UserAgent
from bs4 import BeautifulSoup

from .config import ConfigManager, ScrapingConfig, settings
from .database import db_manager

# Setup logging
logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL))
logger = logging.getLogger(__name__)

class CloudflareBypasser:
    """
    Enhanced Cloudflare bypass capabilities using Camoufox's built-in features.
    Provides better stealth than traditional Playwright approaches.
    """
    
    def __init__(self):
        self.ua = UserAgent()
        self.languages = [
            'tr-TR,tr;q=0.9,en;q=0.8',
            'en-US,en;q=0.9,tr;q=0.8',
            'tr;q=0.9,en-US;q=0.8,en;q=0.7'
        ]
        
        # Viewport variations for realistic browsing
        self.viewports = [
            {'width': 1920, 'height': 1080},
            {'width': 1366, 'height': 768},
            {'width': 1440, 'height': 900},
            {'width': 1536, 'height': 864},
            {'width': 1680, 'height': 1050}
        ]
    
    def get_random_user_agent(self) -> str:
        """Get a random realistic user agent"""
        try:
            return self.ua.firefox  # Use Firefox UA for better compatibility with Camoufox
        except Exception:
            # Fallback to static Firefox UA
            return "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0"
    
    def get_random_language(self) -> str:
        """Get random accept-language header"""
        return random.choice(self.languages)
    
    def get_random_viewport(self) -> Dict[str, int]:
        """Get random viewport size"""
        return random.choice(self.viewports)
    
    async def random_delay(self, min_ms: int = 1000, max_ms: int = 3000):
        """Async random delay"""
        delay = random.randint(min_ms, max_ms) / 1000
        await asyncio.sleep(delay)

class CamoufoxScraper(CloudflareBypasser):
    """
    Main scraper class using Camoufox with proper context manager pattern.
    Provides better bot detection avoidance compared to Playwright.
    """
    
    def __init__(self):
        super().__init__()
        self.config_manager = ConfigManager()
        
        # Performance tracking
        self.session_stats = {
            'pages_scraped': 0,
            'products_found': 0,
            'challenges_solved': 0,
            'errors_encountered': 0
        }
    
    def get_camoufox_config(self, headless: bool = None) -> Dict[str, Any]:
        """Get Camoufox configuration parameters"""
        if headless is None:
            headless = settings.HEADLESS
        
        return {
            # Basic settings
            'headless': headless,
            'humanize': True,  # Built-in human behavior
            'locale': 'tr-TR',
            
            # Enhanced stealth (check if these are available in current version)
            # Some parameters might not be available in all Camoufox versions
            
            # Basic Firefox preferences (if supported)
            # 'user_data_dir': settings.USER_DATA_DIR,  # Check if supported
        }
    
    def create_browser_context(self, headless: bool = None):
        """Create browser context with proper configuration"""
        config = self.get_camoufox_config(headless)
        
        try:
            return AsyncCamoufox(**config)
        except TypeError as e:
            logger.warning(f"Some Camoufox parameters not supported: {e}")
            # Fallback to basic configuration
            basic_config = {
                'headless': config.get('headless', settings.HEADLESS),
                'humanize': True,
                'locale': 'tr-TR'
            }
            return AsyncCamoufox(**basic_config)
    
    async def setup_page(self, page):
        """Setup page with stealth features"""
        try:
            # Set random viewport
            viewport = self.get_random_viewport()
            await page.set_viewport_size(viewport['width'], viewport['height'])
            
            # Set additional headers for better stealth
            await page.set_extra_http_headers({
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': self.get_random_language(),
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0'
            })
            
            # Initial human-like behavior
            await self._simulate_initial_behavior(page)
            
        except Exception as e:
            logger.warning(f"Page setup warning: {e}")
    
    async def _simulate_initial_behavior(self, page):
        """Simulate initial human-like behavior"""
        try:
            # Random mouse movement
            await page.mouse.move(
                random.randint(100, 200), 
                random.randint(100, 200)
            )
            
            # Brief pause
            await self.random_delay(500, 1500)
            
        except Exception as e:
            logger.debug(f"Initial behavior simulation warning: {e}")
    
    async def navigate_with_bypass(self, page, url: str, max_retries: int = 3) -> bool:
        """Navigate to URL with enhanced Cloudflare bypass"""
        for attempt in range(1, max_retries + 1):
            try:
                logger.info(f"Navigating to {url} (Attempt {attempt}/{max_retries})")
                
                # Pre-navigation delay
                await self.random_delay(500, 1500)
                
                # Navigate with enhanced options
                response = await page.goto(
                    url,
                    wait_until='domcontentloaded',
                    timeout=settings.TIMEOUT
                )
                
                # Post-navigation delay
                await self.random_delay(1000, 2000)
                
                # Check for Cloudflare challenge
                is_challenge = await self._detect_cloudflare_challenge(page)
                
                if is_challenge:
                    logger.info("Cloudflare challenge detected, solving...")
                    await self._solve_cloudflare_challenge(page)
                    self.session_stats['challenges_solved'] += 1
                    
                    # Verify challenge is solved
                    if await self._detect_cloudflare_challenge(page):
                        raise Exception("Cloudflare challenge could not be solved")
                
                # Check for anti-bot measures
                if await self._detect_anti_bot(page):
                    logger.info("Anti-bot detection found, applying countermeasures...")
                    await self._simulate_human_behavior(page)
                
                # Successful navigation
                logger.info("Page loaded successfully")
                self.session_stats['pages_scraped'] += 1
                return True
                
            except Exception as e:
                logger.warning(f"Navigation attempt {attempt} failed: {e}")
                self.session_stats['errors_encountered'] += 1
                
                if attempt == max_retries:
                    logger.error(f"All {max_retries} navigation attempts failed")
                    return False
                
                # Wait before retry
                await self.random_delay(2000, 5000)
        
        return False
    
    async def _detect_cloudflare_challenge(self, page) -> bool:
        """Detect if page contains Cloudflare challenge"""
        try:
            title = await page.title()
            content = await page.content()
            
            challenge_indicators = [
                'Just a moment',
                'Please wait',
                'Checking your browser',
                'DDoS protection',
                'cf-challenge-form',
                'cf-error-overview',
                'cf-browser-verification'
            ]
            
            return any(indicator in title or indicator in content 
                      for indicator in challenge_indicators)
            
        except Exception as e:
            logger.debug(f"Challenge detection error: {e}")
            return False
    
    async def _solve_cloudflare_challenge(self, page):
        """Solve Cloudflare challenge using Camoufox's built-in capabilities"""
        try:
            # Camoufox has built-in challenge solving, but we can add manual steps
            await self.random_delay(5000, 8000)  # Initial wait
            
            # Look for common challenge elements
            challenge_form = await page.query_selector('#challenge-form')
            if challenge_form:
                await challenge_form.click()
                await self.random_delay(2000, 4000)
            
            # Look for verification button
            verify_button = await page.query_selector('input[type="button"][value*="Verify"], button[contains(text(), "Verify")]')
            if verify_button:
                await verify_button.click()
                await self.random_delay(3000, 5000)
            
            # Look for checkbox
            checkbox = await page.query_selector('input[type="checkbox"]')
            if checkbox:
                await checkbox.check()
                await self.random_delay(2000, 3000)
            
            # Wait for challenge to complete (up to 60 seconds)
            max_wait = 60
            wait_time = 0
            
            while wait_time < max_wait:
                if not await self._detect_cloudflare_challenge(page):
                    logger.info("Cloudflare challenge solved successfully!")
                    return
                
                await self.random_delay(1000, 2000)
                wait_time += 1.5
            
            logger.warning("Challenge solving timeout reached")
            
        except Exception as e:
            logger.error(f"Challenge solving error: {e}")
    
    async def _detect_anti_bot(self, page) -> bool:
        """Detect anti-bot measures"""
        try:
            content = await page.content()
            content_lower = content.lower()
            
            anti_bot_terms = [
                'blocked', 'forbidden', 'access denied', 'bot detected',
                'captcha', 'verification', 'security check', 'suspicious activity'
            ]
            
            return any(term in content_lower for term in anti_bot_terms)
            
        except Exception as e:
            logger.debug(f"Anti-bot detection error: {e}")
            return False
    
    async def _simulate_human_behavior(self, page):
        """Simulate realistic human behavior"""
        try:
            logger.info("Simulating human behavior...")
            
            # Random mouse movements
            for _ in range(random.randint(3, 7)):
                x = random.randint(100, 800)
                y = random.randint(100, 600)
                await page.mouse.move(x, y)
                await self.random_delay(100, 500)
            
            # Random scrolling
            scroll_amount = random.randint(100, 500)
            await page.evaluate(f'window.scrollTo(0, {scroll_amount})')
            await self.random_delay(1000, 2000)
            
            # Focus and click simulation
            await page.evaluate('''
                window.focus();
                document.body.click();
            ''')
            
            await self.random_delay(1000, 3000)
            
        except Exception as e:
            logger.debug(f"Human behavior simulation error: {e}")
    
    async def wait_for_content_load(self, page, config: ScrapingConfig, timeout: int = 30000) -> bool:
        """Wait for content to load with stability check"""
        try:
            logger.info("Waiting for content to load...")
            
            # Wait for main selector
            await page.wait_for_selector(config.wait_for, timeout=timeout)
            
            # Additional stability wait
            await self.random_delay(2000, 4000)
            
            # Check for stable content
            stable_count = 0
            last_product_count = 0
            
            for i in range(5):
                current_count = len(await page.query_selector_all(config.item_selector))
                
                if current_count == last_product_count:
                    stable_count += 1
                else:
                    stable_count = 0
                    last_product_count = current_count
                
                if stable_count >= 2:
                    logger.info("Content stabilized")
                    break
                
                await self.random_delay(1000, 2000)
            
            return True
            
        except Exception as e:
            logger.error(f"Content loading error: {e}")
            return False
    
    async def extract_products(self, page, config: ScrapingConfig) -> List[Dict[str, Any]]:
        """Extract products from current page"""
        try:
            # Get page content
            content = await page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            products = []
            product_elements = soup.select(config.item_selector)
            
            logger.info(f"Found {len(product_elements)} product elements")
            
            for element in product_elements:
                product = {}
                
                # Extract fields according to configuration
                for field in config.fields:
                    try:
                        if field.type == 'custom':
                            # Handle custom field extraction (site-specific logic)
                            product[field.name] = await self._extract_custom_field(element, field, config)
                        else:
                            # Standard field extraction
                            product[field.name] = self._extract_standard_field(element, field, config)
                    
                    except Exception as field_error:
                        logger.debug(f"Field extraction error for {field.name}: {field_error}")
                        product[field.name] = None
                
                # Post-process product data
                product = self._post_process_product(product, config)
                
                # Validate product
                if self._is_valid_product(product):
                    products.append(product)
            
            logger.info(f"Extracted {len(products)} valid products")
            self.session_stats['products_found'] += len(products)
            
            return products
            
        except Exception as e:
            logger.error(f"Product extraction error: {e}")
            return []
    
    def _extract_standard_field(self, element, field, config) -> Any:
        """Extract standard field types"""
        target_element = element.select_one(field.selector) if field.selector else element
        
        if not target_element:
            return None
        
        if field.type == 'text':
            return target_element.get_text(strip=True)
        
        elif field.type == 'attribute':
            return target_element.get(field.attribute, '')
        
        elif field.type == 'price':
            price_text = target_element.get_text(strip=True)
            return self._parse_price(price_text, config)
        
        return None
    
    async def _extract_custom_field(self, element, field, config) -> Any:
        """Extract custom fields (site-specific logic)"""
        # İnceHesap custom fields
        if config.site_name == 'incehesap':
            data_product = element.get('data-product')
            if data_product:
                try:
                    product_data = json.loads(data_product)
                    
                    if field.name == 'brand':
                        return product_data.get('brand', '')
                    elif field.name == 'rating':
                        return float(product_data.get('rating', 0))
                    elif field.name == 'reviewCount':
                        return int(product_data.get('review_count', 0))
                    elif field.name == 'tags':
                        return product_data.get('tags', '')
                        
                except json.JSONDecodeError:
                    pass
            
            # Fallback extraction
            if field.name == 'brand':
                name_element = element.select_one('[itemprop="name"]')
                if name_element:
                    words = name_element.get_text(strip=True).split()
                    return words[0] if words else ''
        
        return None
    
    def _parse_price(self, price_text: str, config: ScrapingConfig) -> Optional[float]:
        """Parse price from text"""
        if not price_text:
            return None
        
        try:
            # Remove currency symbols and clean
            if config.site_name == 'sinerji':
                # Sinerji format: "₺6.672"
                clean_text = price_text.replace('₺', '').replace('.', '').replace(',', '.')
            else:
                # İnceHesap/İtopya format: "28.999 TL"
                clean_text = re.sub(r'\s*TL\s*$', '', price_text, flags=re.IGNORECASE)
                clean_text = clean_text.replace('.', '').replace(',', '.')
            
            # Extract numeric value
            numeric_match = re.search(r'\d+(?:\.\d+)?', clean_text)
            if numeric_match:
                return float(numeric_match.group())
            
        except (ValueError, AttributeError) as e:
            logger.debug(f"Price parsing error: {e}")
        
        return None
    
    def _post_process_product(self, product: Dict[str, Any], config: ScrapingConfig) -> Dict[str, Any]:
        """Post-process product data"""
        # Fix relative URLs
        if product.get('link') and not product['link'].startswith('http'):
            product['link'] = urljoin(config.site_info.base_url, product['link'])
        
        if product.get('image') and not product['image'].startswith('http'):
            if product['image'].startswith('//'):
                product['image'] = 'https:' + product['image']
            elif product['image'].startswith('/'):
                product['image'] = urljoin(config.site_info.base_url, product['image'])
        
        # Add metadata
        product['scrapedAt'] = datetime.now().isoformat()
        product['source'] = config.site_info.name
        product['category'] = None  # Will be set by caller
        product['isActive'] = True
        
        return product
    
    def _is_valid_product(self, product: Dict[str, Any]) -> bool:
        """Validate product data"""
        return bool(
            product.get('name') and 
            product.get('currentPrice') and 
            isinstance(product.get('currentPrice'), (int, float))
        )
    
    async def scrape_category(self, category_key: str) -> Dict[str, Any]:
        """
        Scrape a single category using context manager pattern.
        
        Args:
            category_key: Category identifier (e.g., 'itopya_islemci')
            
        Returns:
            Dict with scraping results
        """
        config = self.config_manager.get_config(category_key)
        if not config:
            return {
                'success': False,
                'error': f'Category not found: {category_key}',
                'productCount': 0
            }
        
        logger.info(f"Starting scrape for {config.site_info.name} - {config.display_name}")
        
        try:
            # Use context manager for browser
            async with self.create_browser_context() as browser:
                page = await browser.new_page()
                await self.setup_page(page)
                
                all_products = []
                
                # Scrape based on configuration
                if config.pagination:
                    all_products = await self._scrape_with_pagination(page, config)
                else:
                    all_products = await self._scrape_single_page(page, config)
                
                # Save to database
                if db_manager.is_connected:
                    stats = await db_manager.save_products(category_key, all_products, config)
                    
                    return {
                        'success': True,
                        'productCount': len(all_products),
                        'site': config.site_info.name,
                        'category': config.display_name,
                        'stats': stats
                    }
                else:
                    raise Exception("Database not connected")
            
        except Exception as e:
            logger.error(f"Category scraping error ({category_key}): {e}")
            return {
                'success': False,
                'error': str(e),
                'productCount': 0,
                'site': config.site_info.name if config else 'Unknown'
            }
    
    async def _scrape_single_page(self, page, config: ScrapingConfig) -> List[Dict[str, Any]]:
        """Scrape single page (with optional infinite scroll)"""
        if not await self.navigate_with_bypass(page, config.url):
            raise Exception("Failed to navigate to page")
        
        if not await self.wait_for_content_load(page, config):
            raise Exception("Content failed to load")
        
        # Handle infinite scroll if enabled
        if config.infinite_scroll:
            await self._handle_infinite_scroll(page, config)
        else:
            await self.random_delay(2000, 4000)
        
        return await self.extract_products(page, config)
    
    async def _scrape_with_pagination(self, page, config: ScrapingConfig) -> List[Dict[str, Any]]:
        """Scrape with pagination support"""
        all_products = []
        current_page = 1
        max_pages = config.max_pages
        
        while current_page <= max_pages:
            try:
                page_url = self._build_page_url(config.url, current_page, config.site_name)
                logger.info(f"Scraping page {current_page}: {page_url}")
                
                if not await self.navigate_with_bypass(page, page_url):
                    break
                
                if not await self.wait_for_content_load(page, config):
                    break
                
                page_products = await self.extract_products(page, config)
                
                if not page_products:
                    logger.info(f"No products found on page {current_page}, stopping")
                    break
                
                all_products.extend(page_products)
                logger.info(f"Page {current_page}: {len(page_products)} products found")
                
                # Check if next page exists
                if not await self._has_next_page(page, current_page, config):
                    logger.info(f"Page {current_page} is the last page")
                    break
                
                current_page += 1
                
                # Inter-page delay
                if config.site_name == 'sinerji':
                    await self.random_delay(5000, 8000)  # Longer delay for Sinerji
                else:
                    await self.random_delay(2000, 4000)
                
            except Exception as e:
                logger.error(f"Page {current_page} scraping error: {e}")
                break
        
        return all_products
    
    def _build_page_url(self, base_url: str, page_number: int, site_name: str) -> str:
        """Build pagination URL"""
        if site_name == 'incehesap':
            return f"{base_url}sayfa-{page_number}/"
        elif site_name == 'sinerji':
            return f"{base_url}?px={page_number}"
        else:
            return f"{base_url}?page={page_number}"
    
    async def _has_next_page(self, page, current_page: int, config: ScrapingConfig) -> bool:
        """Check if next page exists"""
        try:
            if config.site_name == 'incehesap':
                # Check for next page link
                next_page = current_page + 1
                next_link = await page.query_selector(f'nav[aria-label="Pagination"] a[href*="sayfa-{next_page}"]')
                return next_link is not None
            
            elif config.site_name == 'sinerji':
                # Check for next page link
                next_link = await page.query_selector('nav[aria-label="Page navigation"] .paging a[title="Next page"]')
                return next_link is not None
            
            return False
            
        except Exception as e:
            logger.debug(f"Next page check error: {e}")
            return False
    
    async def _handle_infinite_scroll(self, page, config: ScrapingConfig):
        """Handle infinite scroll pages"""
        previous_height = 0
        scroll_attempts = 0
        stable_attempts = 0
        max_scroll_attempts = 25
        max_stable_attempts = 3
        
        logger.info("Starting infinite scroll...")
        
        while scroll_attempts < max_scroll_attempts and stable_attempts < max_stable_attempts:
            # Human-like scrolling
            scroll_step = random.randint(1200, 1800) if config.site_name == 'itopya' else random.randint(300, 800)
            
            await page.evaluate(f'window.scrollBy(0, {scroll_step})')
            
            # Wait based on config
            scroll_pause = config.scroll_pause if config.scroll_pause else 1000
            await self.random_delay(scroll_pause, scroll_pause + 300)
            
            # Check height change
            current_height = await page.evaluate('document.body.scrollHeight')
            
            if current_height == previous_height:
                stable_attempts += 1
                logger.info(f"Height stable ({stable_attempts}/{max_stable_attempts})")
            else:
                stable_attempts = 0
                previous_height = current_height
                logger.info(f"New content loaded, height: {current_height}px")
            
            scroll_attempts += 1
            
            # Periodic focus for better interaction
            if scroll_attempts % 5 == 0:
                await page.evaluate('''
                    window.focus();
                    document.body.click();
                ''')
        
        # Return to top
        await page.evaluate('window.scrollTo(0, 0)')
        await self.random_delay(2000, 3000)
        
        logger.info(f"Infinite scroll completed. Total scrolls: {scroll_attempts}")
    
    async def scrape_all_categories(self) -> Dict[str, Any]:
        """Scrape all configured categories"""
        results = {}
        categories = self.config_manager.get_all_categories()
        
        # Sort by site priority
        priority_order = ['incehesap', 'itopya', 'sinerji']
        sorted_categories = sorted(categories, key=lambda cat: (
            priority_order.index(self.config_manager.get_config(cat).site_name)
            if self.config_manager.get_config(cat).site_name in priority_order else 999,
            cat
        ))
        
        logger.info(f"Starting scrape for {len(sorted_categories)} categories")
        
        previous_site = None
        for category_key in sorted_categories:
            config = self.config_manager.get_config(category_key)
            
            # Site switching delay
            if previous_site and config.site_name != previous_site:
                logger.info(f"Site switching: {previous_site} -> {config.site_name}. Waiting 5-8 seconds...")
                await self.random_delay(5000, 8000)
            
            previous_site = config.site_name
            
            try:
                logger.info(f"Processing category: {category_key}")
                result = await self.scrape_category(category_key)
                results[category_key] = result
                
                # Inter-category delay
                await self.random_delay(3000, 5000)
                
            except Exception as e:
                logger.error(f"Category {category_key} failed: {e}")
                results[category_key] = {
                    'success': False,
                    'error': str(e),
                    'productCount': 0
                }
        
        # Print summary
        total_products = sum(r.get('productCount', 0) for r in results.values())
        successful_categories = sum(1 for r in results.values() if r.get('success', False))
        
        logger.info(f"Scraping completed: {successful_categories}/{len(categories)} categories successful, "
                   f"{total_products} total products")
        
        return {
            'summary': {
                'totalCategories': len(categories),
                'successfulCategories': successful_categories,
                'totalProducts': total_products,
                'sessionStats': self.session_stats
            },
            'results': results
        }
    
    def get_session_stats(self) -> Dict[str, Any]:
        """Get current session statistics"""
        return self.session_stats.copy()