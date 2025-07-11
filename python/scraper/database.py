"""
Async MongoDB database manager using Motor driver.
Provides compatibility with existing MongoDB schema and operations.
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError, ConnectionFailure
from .config import settings

# Setup logging
logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL))
logger = logging.getLogger(__name__)

class DatabaseManager:
    """Async MongoDB operations manager"""
    
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db: Optional[AsyncIOMotorDatabase] = None
        self._connected = False
    
    async def connect(self) -> bool:
        """Connect to MongoDB"""
        try:
            self.client = AsyncIOMotorClient(settings.MONGODB_URI)
            self.db = self.client[settings.DATABASE_NAME]
            
            # Test connection
            await self.client.admin.command('ping')
            self._connected = True
            
            logger.info(f"Connected to MongoDB: {settings.DATABASE_NAME}")
            
            # Ensure indexes exist
            await self._create_indexes()
            
            return True
            
        except ConnectionFailure as e:
            logger.error(f"MongoDB connection failed: {e}")
            self._connected = False
            return False
        except Exception as e:
            logger.error(f"Unexpected database error: {e}")
            self._connected = False
            return False
    
    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            self._connected = False
            logger.info("Disconnected from MongoDB")
    
    async def _create_indexes(self):
        """Create necessary indexes for optimal performance"""
        try:
            # Product collection indexes
            products = self.db.products
            await products.create_index([("name", 1), ("category", 1), ("source", 1)])
            await products.create_index([("category", 1)])
            await products.create_index([("source", 1)])
            await products.create_index([("currentPrice", 1)])
            await products.create_index([("scrapedAt", -1)])
            await products.create_index([("isActive", 1)])
            await products.create_index([("link", 1)])
            
            # Category collection indexes
            categories = self.db.categories
            await categories.create_index([("key", 1)], unique=True)
            await categories.create_index([("source", 1)])
            await categories.create_index([("isActive", 1)])
            
            logger.info("Database indexes created successfully")
            
        except Exception as e:
            logger.warning(f"Index creation warning: {e}")
    
    @property
    def is_connected(self) -> bool:
        """Check if database is connected"""
        return self._connected
    
    async def save_products(self, category_key: str, products: List[Dict[str, Any]], 
                           config: Any) -> Dict[str, int]:
        """
        Save scraped products to database with data protection logic.
        Ports the existing Node.js save logic.
        """
        if not self.is_connected:
            raise ConnectionError("Database not connected")
        
        stats = {
            'new_products': 0,
            'updated_products': 0,
            'price_changes': 0,
            'deactivated_products': 0
        }
        
        try:
            # SECURITY: Empty data check - protect existing data
            if not products or len(products) == 0:
                logger.warning(f"⚠️ {category_key} için BOŞ VERİ - mevcut veriler korunuyor!")
                
                # Only update category info, don't touch products
                await self._update_category_only(category_key, config)
                return stats
            
            # SECURITY: Minimum product threshold check
            existing_count = await self.db.products.count_documents({
                'category': category_key,
                'source': config.site_info.name,
                'isActive': True
            })
            
            # If new data is less than 20% of existing data, trigger protection
            if existing_count > 0 and len(products) < existing_count * 0.2:
                logger.warning(f"⚠️ {category_key}: Yeni veri çok az ({len(products)} vs mevcut {existing_count})")
                logger.warning(f"🛡️ VERİ KORUMA AKTİF - mevcut {existing_count} ürün korunuyor")
                
                # Update category timestamp but don't delete products
                await self._update_category_timestamp(category_key)
                return stats
            
            logger.info(f"{category_key}: {len(products)} ürün işleniyor (güvenlik kontrolleri geçildi)")
            
            # Process each product individually for price tracking
            for product in products:
                product_data = {
                    **product,
                    'category': category_key,
                    'source': config.site_info.name,
                    'scrapedAt': datetime.now(),
                    'isActive': True
                }
                
                # Find existing product (priority: link, then name)
                existing_product = await self.db.products.find_one({
                    '$or': [
                        # First check by link (most reliable)
                        {
                            'link': product.get('link'),
                            'source': config.site_info.name,
                            'category': category_key
                        },
                        # Then check by name (backward compatibility)
                        {
                            'name': product.get('name'),
                            'source': config.site_info.name,
                            'category': category_key,
                            'link': {'$ne': product.get('link')}  # Must not have same link
                        }
                    ]
                })
                
                if existing_product:
                    # Existing product - check for price changes
                    current_price = product.get('currentPrice')
                    old_price = existing_product.get('currentPrice')
                    
                    if current_price and old_price and current_price != old_price:
                        # Price changed - add to history
                        price_history = existing_product.get('priceHistory', [])
                        price_history.append({
                            'price': current_price,
                            'date': datetime.now()
                        })
                        
                        # Keep only last 30 price entries
                        if len(price_history) > 30:
                            price_history = price_history[-30:]
                        
                        product_data['priceHistory'] = price_history
                        stats['price_changes'] += 1
                    else:
                        # Keep existing price history
                        product_data['priceHistory'] = existing_product.get('priceHistory', [])
                    
                    # Update existing product
                    await self.db.products.update_one(
                        {'_id': existing_product['_id']},
                        {'$set': product_data}
                    )
                    stats['updated_products'] += 1
                    
                else:
                    # New product - initialize with first price
                    product_data['priceHistory'] = [{
                        'price': product.get('currentPrice'),
                        'date': datetime.now()
                    }] if product.get('currentPrice') else []
                    
                    await self.db.products.insert_one(product_data)
                    stats['new_products'] += 1
            
            # SECURITY: Only deactivate if we have sufficient data
            if len(products) >= max(5, existing_count * 0.3):
                current_product_names = [p.get('name') for p in products if p.get('name')]
                
                deactivated_result = await self.db.products.update_many(
                    {
                        'category': category_key,
                        'source': config.site_info.name,
                        'name': {'$nin': current_product_names},
                        'isActive': True
                    },
                    {'$set': {'isActive': False}}
                )
                
                stats['deactivated_products'] = deactivated_result.modified_count
                
                if stats['deactivated_products'] > 0:
                    logger.info(f"{category_key}: {stats['deactivated_products']} ürün deaktive edildi")
            else:
                logger.info(f"{category_key}: Yeterli veri yok, mevcut ürünler korunuyor")
            
            # Update category record
            await self._update_category(category_key, config, len(products))
            
            logger.info(f"{category_key} kategorisi: {stats['new_products']} yeni, "
                       f"{stats['updated_products']} güncellenen, {stats['price_changes']} fiyat değişimi")
            
            return stats
            
        except Exception as e:
            logger.error(f"MongoDB save error for {category_key}: {e}")
            raise
    
    async def _update_category_only(self, category_key: str, config: Any):
        """Update only category info without touching products"""
        await self.db.categories.update_one(
            {'key': category_key},
            {
                '$set': {
                    'key': category_key,
                    'name': category_key,
                    'displayName': config.display_name,
                    'source': config.site_info.name,
                    'url': config.url,
                    'lastScrapedAt': datetime.now()
                },
                '$setOnInsert': {
                    'totalProducts': 0,
                    'isActive': True
                }
            },
            upsert=True
        )
    
    async def _update_category_timestamp(self, category_key: str):
        """Update only category timestamp"""
        await self.db.categories.update_one(
            {'key': category_key},
            {'$set': {'lastScrapedAt': datetime.now()}}
        )
    
    async def _update_category(self, category_key: str, config: Any, product_count: int):
        """Update or create category record"""
        await self.db.categories.update_one(
            {'key': category_key},
            {
                '$set': {
                    'key': category_key,
                    'name': category_key,
                    'displayName': config.display_name,
                    'source': config.site_info.name,
                    'url': config.url,
                    'lastScrapedAt': datetime.now(),
                    'totalProducts': product_count,
                    'isActive': True
                }
            },
            upsert=True
        )
    
    async def get_category_data(self, category_key: str) -> Optional[Dict[str, Any]]:
        """Get products for a specific category"""
        try:
            # Get products
            products_cursor = self.db.products.find({
                'category': category_key,
                'isActive': True
            }).sort('scrapedAt', -1)
            
            products = await products_cursor.to_list(length=None)
            
            # Get category info
            category = await self.db.categories.find_one({'key': category_key})
            
            return {
                'category': category_key,
                'displayName': category.get('displayName', category_key) if category else category_key,
                'source': category.get('source', 'Unknown') if category else 'Unknown',
                'lastUpdated': category.get('lastScrapedAt').isoformat() if category and category.get('lastScrapedAt') else datetime.now().isoformat(),
                'totalProducts': len(products),
                'products': products
            }
            
        except Exception as e:
            logger.error(f"MongoDB category data fetch error ({category_key}): {e}")
            raise
    
    async def search_products(self, category_key: str, search_term: str) -> Dict[str, Any]:
        """Search products in a specific category"""
        try:
            products_cursor = self.db.products.find({
                'category': category_key,
                'isActive': True,
                '$or': [
                    {'name': {'$regex': search_term, '$options': 'i'}},
                    {'brand': {'$regex': search_term, '$options': 'i'}}
                ]
            }).sort('scrapedAt', -1)
            
            products = await products_cursor.to_list(length=None)
            
            return {
                'category': category_key,
                'searchTerm': search_term,
                'totalResults': len(products),
                'products': products
            }
            
        except Exception as e:
            logger.error(f"MongoDB search error ({category_key}): {e}")
            raise
    
    async def get_all_categories(self) -> List[Dict[str, Any]]:
        """Get all active categories"""
        try:
            categories_cursor = self.db.categories.find({
                'isActive': True
            }).sort([('source', 1), ('name', 1)])
            
            categories = await categories_cursor.to_list(length=None)
            
            return [
                {
                    'key': cat['key'],
                    'name': cat.get('displayName', cat['key']),
                    'site': cat.get('source', 'Unknown'),
                    'url': cat.get('url', ''),
                    'lastScrapedAt': cat.get('lastScrapedAt'),
                    'totalProducts': cat.get('totalProducts', 0)
                }
                for cat in categories
            ]
            
        except Exception as e:
            logger.error(f"MongoDB categories fetch error: {e}")
            raise
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get database statistics"""
        try:
            # Count products by site
            pipeline = [
                {'$match': {'isActive': True}},
                {'$group': {
                    '_id': '$source',
                    'count': {'$sum': 1},
                    'avgPrice': {'$avg': '$currentPrice'}
                }}
            ]
            
            site_stats_cursor = self.db.products.aggregate(pipeline)
            site_stats = await site_stats_cursor.to_list(length=None)
            
            # Total counts
            total_products = await self.db.products.count_documents({'isActive': True})
            total_categories = await self.db.categories.count_documents({'isActive': True})
            
            # Recent activity
            recent_scrapes = await self.db.categories.count_documents({
                'lastScrapedAt': {'$gte': datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)}
            })
            
            return {
                'totalProducts': total_products,
                'totalCategories': total_categories,
                'recentScrapes': recent_scrapes,
                'siteStats': {stat['_id']: {'count': stat['count'], 'avgPrice': stat['avgPrice']} 
                             for stat in site_stats},
                'lastUpdated': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"MongoDB stats error: {e}")
            raise
    
    async def cleanup_inactive_products(self, days: int = 7) -> int:
        """Remove products that have been inactive for specified days"""
        try:
            cutoff_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            cutoff_date = cutoff_date.replace(day=cutoff_date.day - days)
            
            result = await self.db.products.delete_many({
                'isActive': False,
                'scrapedAt': {'$lt': cutoff_date}
            })
            
            logger.info(f"Cleaned up {result.deleted_count} inactive products")
            return result.deleted_count
            
        except Exception as e:
            logger.error(f"Cleanup error: {e}")
            raise

# Global database manager instance
db_manager = DatabaseManager()