"""
Configuration management for Python Camoufox scraper.
Ports the existing Node.js scraping configurations to Python.
"""

import os
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

@dataclass
class SiteInfo:
    """Site information structure"""
    name: str
    base_url: str
    description: str
    priority: int

@dataclass
class FieldConfig:
    """Field extraction configuration"""
    name: str
    type: str
    selector: Optional[str] = None
    attribute: Optional[str] = None

@dataclass
class ScrapingConfig:
    """Complete scraping configuration for a category"""
    site_name: str
    site_info: SiteInfo
    display_name: str
    url: str
    item_selector: str
    fields: List[FieldConfig]
    wait_for: str
    pagination: bool = False
    infinite_scroll: bool = False
    max_pages: int = 10
    scroll_pause: int = 1000

class ConfigManager:
    """Manages scraping configurations for all sites"""
    
    def __init__(self):
        self.configs = self._load_configurations()
    
    def _load_configurations(self) -> Dict[str, ScrapingConfig]:
        """Load all scraping configurations"""
        
        # Site information
        sites = {
            'incehesap': SiteInfo(
                name='İnceHesap',
                base_url='https://www.incehesap.com',
                description='İnceHesap',
                priority=1
            ),
            'itopya': SiteInfo(
                name='İtopya',
                base_url='https://www.itopya.com',
                description='İtopya',
                priority=2
            ),
            'sinerji': SiteInfo(
                name='Sinerji',
                base_url='https://www.sinerji.gen.tr',
                description='Sinerji',
                priority=3
            )
        }
        
        # Field configurations based on original Node.js configs
        incehesap_fields = [
            FieldConfig('name', 'text', '[itemprop="name"]'),
            FieldConfig('currentPrice', 'price', '[itemprop="price"]'),
            FieldConfig('link', 'attribute', '', 'href'),  # Parent element has href
            FieldConfig('image', 'attribute', 'img', 'src')
        ]
        
        itopya_fields = [
            FieldConfig('name', 'text', '.title'),
            FieldConfig('currentPrice', 'price', '.product-price strong'),
            FieldConfig('link', 'attribute', '.title', 'href'),
            FieldConfig('image', 'attribute', '.product-image img', 'src')
        ]
        
        sinerji_fields = [
            FieldConfig('name', 'text', '.title a'),
            FieldConfig('currentPrice', 'price', 'span.price'),
            FieldConfig('link', 'attribute', '.title a', 'href'),
            FieldConfig('image', 'attribute', '.img img', 'src')
        ]
        
        # Category configurations
        categories = {
            # İnceHesap categories - using correct URLs from Node.js config
            'incehesap_islemci': ScrapingConfig(
                site_name='incehesap',
                site_info=sites['incehesap'],
                display_name='İşlemci',
                url='https://www.incehesap.com/islemci-fiyatlari/',
                item_selector='div.grid.grid-cols-2.md\\:grid-cols-3.gap-1[itemscope][itemtype="https://schema.org/ItemList"] a.product[data-product]',
                fields=incehesap_fields,
                wait_for='div.grid.grid-cols-2.md\\:grid-cols-3.gap-1[itemscope][itemtype="https://schema.org/ItemList"] a.product[data-product]',
                pagination=True,
                max_pages=20
            ),
            'incehesap_ekran-karti': ScrapingConfig(
                site_name='incehesap',
                site_info=sites['incehesap'],
                display_name='Ekran Kartı',
                url='https://www.incehesap.com/ekran-karti-fiyatlari/',
                item_selector='div.grid.grid-cols-2.md\\:grid-cols-3.gap-1[itemscope][itemtype="https://schema.org/ItemList"] a.product[data-product]',
                fields=incehesap_fields,
                wait_for='div.grid.grid-cols-2.md\\:grid-cols-3.gap-1[itemscope][itemtype="https://schema.org/ItemList"] a.product[data-product]',
                pagination=True,
                max_pages=20
            ),
            'incehesap_anakart': ScrapingConfig(
                site_name='incehesap',
                site_info=sites['incehesap'],
                display_name='Anakart',
                url='https://www.incehesap.com/anakart-fiyatlari/',
                item_selector='div.grid.grid-cols-2.md\\:grid-cols-3.gap-1[itemscope][itemtype="https://schema.org/ItemList"] a.product[data-product]',
                fields=incehesap_fields,
                wait_for='div.grid.grid-cols-2.md\\:grid-cols-3.gap-1[itemscope][itemtype="https://schema.org/ItemList"] a.product[data-product]',
                pagination=True,
                max_pages=20
            ),
            'incehesap_ram': ScrapingConfig(
                site_name='incehesap',
                site_info=sites['incehesap'],
                display_name='RAM',
                url='https://www.incehesap.com/ram-fiyatlari/',
                item_selector='div.grid.grid-cols-2.md\\:grid-cols-3.gap-1[itemscope][itemtype="https://schema.org/ItemList"] a.product[data-product]',
                fields=incehesap_fields,
                wait_for='div.grid.grid-cols-2.md\\:grid-cols-3.gap-1[itemscope][itemtype="https://schema.org/ItemList"] a.product[data-product]',
                pagination=True,
                max_pages=20
            ),
            'incehesap_ssd': ScrapingConfig(
                site_name='incehesap',
                site_info=sites['incehesap'],
                display_name='SSD',
                url='https://www.incehesap.com/ssd-harddisk-fiyatlari/',
                item_selector='div.grid.grid-cols-2.md\\:grid-cols-3.gap-1[itemscope][itemtype="https://schema.org/ItemList"] a.product[data-product]',
                fields=incehesap_fields,
                wait_for='div.grid.grid-cols-2.md\\:grid-cols-3.gap-1[itemscope][itemtype="https://schema.org/ItemList"] a.product[data-product]',
                pagination=True,
                max_pages=20
            ),
            'incehesap_guc-kaynagi': ScrapingConfig(
                site_name='incehesap',
                site_info=sites['incehesap'],
                display_name='Güç Kaynağı',
                url='https://www.incehesap.com/power-supply-fiyatlari/',
                item_selector='div.grid.grid-cols-2.md\\:grid-cols-3.gap-1[itemscope][itemtype="https://schema.org/ItemList"] a.product[data-product]',
                fields=incehesap_fields,
                wait_for='div.grid.grid-cols-2.md\\:grid-cols-3.gap-1[itemscope][itemtype="https://schema.org/ItemList"] a.product[data-product]',
                pagination=True,
                max_pages=20
            ),
            'incehesap_bilgisayar-kasasi': ScrapingConfig(
                site_name='incehesap',
                site_info=sites['incehesap'],
                display_name='Bilgisayar Kasası',
                url='https://www.incehesap.com/bilgisayar-kasasi-fiyatlari/',
                item_selector='div.grid.grid-cols-2.md\\:grid-cols-3.gap-1[itemscope][itemtype="https://schema.org/ItemList"] a.product[data-product]',
                fields=incehesap_fields,
                wait_for='div.grid.grid-cols-2.md\\:grid-cols-3.gap-1[itemscope][itemtype="https://schema.org/ItemList"] a.product[data-product]',
                pagination=True,
                max_pages=20
            ),
            
            # İtopya categories - using correct URLs from Node.js config
            'itopya_islemci': ScrapingConfig(
                site_name='itopya',
                site_info=sites['itopya'],
                display_name='İşlemci',
                url='https://www.itopya.com/islemci_k8',
                item_selector='.product',
                fields=itopya_fields,
                wait_for='.product',
                infinite_scroll=True,
                scroll_pause=3000
            ),
            'itopya_ekran-karti': ScrapingConfig(
                site_name='itopya',
                site_info=sites['itopya'],
                display_name='Ekran Kartı',
                url='https://www.itopya.com/ekran-karti_k11',
                item_selector='.product',
                fields=itopya_fields,
                wait_for='.product',
                infinite_scroll=True,
                scroll_pause=3000
            ),
            'itopya_anakart': ScrapingConfig(
                site_name='itopya',
                site_info=sites['itopya'],
                display_name='Anakart',
                url='https://www.itopya.com/anakart_k9',
                item_selector='.product',
                fields=itopya_fields,
                wait_for='.product',
                infinite_scroll=True,
                scroll_pause=3000
            ),
            'itopya_ram': ScrapingConfig(
                site_name='itopya',
                site_info=sites['itopya'],
                display_name='RAM',
                url='https://www.itopya.com/ram_k10',
                item_selector='.product',
                fields=itopya_fields,
                wait_for='.product',
                infinite_scroll=True,
                scroll_pause=3000
            ),
            'itopya_ssd': ScrapingConfig(
                site_name='itopya',
                site_info=sites['itopya'],
                display_name='SSD',
                url='https://www.itopya.com/ssd_k20',
                item_selector='.product',
                fields=itopya_fields,
                wait_for='.product',
                infinite_scroll=True,
                scroll_pause=3000
            ),
            'itopya_guc-kaynagi': ScrapingConfig(
                site_name='itopya',
                site_info=sites['itopya'],
                display_name='Güç Kaynağı',
                url='https://www.itopya.com/powersupply_k17',
                item_selector='.product',
                fields=itopya_fields,
                wait_for='.product',
                infinite_scroll=True,
                scroll_pause=3000
            ),
            'itopya_bilgisayar-kasasi': ScrapingConfig(
                site_name='itopya',
                site_info=sites['itopya'],
                display_name='Bilgisayar Kasası',
                url='https://www.itopya.com/bilgisayar-kasalari_k16',
                item_selector='.product',
                fields=itopya_fields,
                wait_for='.product',
                infinite_scroll=True,
                scroll_pause=3000
            ),
            
            # Sinerji categories - using correct URLs from Node.js config
            'sinerji_islemci': ScrapingConfig(
                site_name='sinerji',
                site_info=sites['sinerji'],
                display_name='İşlemci',
                url='https://www.sinerji.gen.tr/islemci-c-1',
                item_selector='article.product',
                fields=sinerji_fields,
                wait_for='.col-xl-3 article.product',
                pagination=True,
                max_pages=20
            ),
            'sinerji_ekran-karti': ScrapingConfig(
                site_name='sinerji',
                site_info=sites['sinerji'],
                display_name='Ekran Kartı',
                url='https://www.sinerji.gen.tr/ekran-karti-c-2023',
                item_selector='article.product',
                fields=sinerji_fields,
                wait_for='.col-xl-3 article.product',
                pagination=True,
                max_pages=20
            ),
            'sinerji_anakart': ScrapingConfig(
                site_name='sinerji',
                site_info=sites['sinerji'],
                display_name='Anakart',
                url='https://www.sinerji.gen.tr/anakart-c-2009',
                item_selector='article.product',
                fields=sinerji_fields,
                wait_for='.col-xl-3 article.product',
                pagination=True,
                max_pages=20
            ),
            'sinerji_ram': ScrapingConfig(
                site_name='sinerji',
                site_info=sites['sinerji'],
                display_name='RAM',
                url='https://www.sinerji.gen.tr/bellek-ram-c-2010',
                item_selector='article.product',
                fields=sinerji_fields,
                wait_for='.col-xl-3 article.product',
                pagination=True,
                max_pages=20
            ),
            'sinerji_ssd': ScrapingConfig(
                site_name='sinerji',
                site_info=sites['sinerji'],
                display_name='SSD',
                url='https://www.sinerji.gen.tr/ssd-disk-c-2147',
                item_selector='article.product',
                fields=sinerji_fields,
                wait_for='.col-xl-3 article.product',
                pagination=True,
                max_pages=20
            ),
            'sinerji_guc-kaynagi': ScrapingConfig(
                site_name='sinerji',
                site_info=sites['sinerji'],
                display_name='Güç Kaynağı',
                url='https://www.sinerji.gen.tr/guc-kaynagi-c-2030',
                item_selector='article.product',
                fields=sinerji_fields,
                wait_for='.col-xl-3 article.product',
                pagination=True,
                max_pages=20
            ),
            'sinerji_bilgisayar-kasasi': ScrapingConfig(
                site_name='sinerji',
                site_info=sites['sinerji'],
                display_name='Bilgisayar Kasası',
                url='https://www.sinerji.gen.tr/bilgisayar-kasasi-c-2027',
                item_selector='article.product',
                fields=sinerji_fields,
                wait_for='.col-xl-3 article.product',
                pagination=True,
                max_pages=20
            )
        }
        
        return categories
    
    def get_config(self, category_key: str) -> Optional[ScrapingConfig]:
        """Get configuration for a specific category"""
        return self.configs.get(category_key)
    
    def get_all_categories(self) -> List[str]:
        """Get all available category keys"""
        return list(self.configs.keys())
    
    def get_site_categories(self, site_name: str) -> List[str]:
        """Get all categories for a specific site"""
        return [key for key, config in self.configs.items() 
                if config.site_name == site_name]
    
    def get_sites(self) -> List[str]:
        """Get all available site names"""
        sites = set()
        for config in self.configs.values():
            sites.add(config.site_name)
        return list(sites)

# Environment configuration
class Settings:
    """Application settings from environment variables"""
    
    MONGODB_URI: str = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/ScraperDB')
    DATABASE_NAME: str = os.getenv('DATABASE_NAME', 'ScraperDB')
    
    # Browser settings
    HEADLESS: bool = os.getenv('HEADLESS', 'false').lower() == 'true'
    USER_DATA_DIR: str = os.getenv('USER_DATA_DIR', './python_user_data')
    
    # Rate limiting
    MIN_DELAY: int = int(os.getenv('MIN_DELAY', '1000'))
    MAX_DELAY: int = int(os.getenv('MAX_DELAY', '3000'))
    SITE_SWITCH_DELAY: int = int(os.getenv('SITE_SWITCH_DELAY', '5000'))
    
    # Performance
    MAX_CONCURRENT_BROWSERS: int = int(os.getenv('MAX_CONCURRENT_BROWSERS', '3'))
    TIMEOUT: int = int(os.getenv('TIMEOUT', '60000'))
    
    # Logging
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    
    # API settings
    ALLOWED_ORIGINS: List[str] = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
    PORT: int = int(os.getenv('PORT', '8000'))

# Global settings instance
settings = Settings()