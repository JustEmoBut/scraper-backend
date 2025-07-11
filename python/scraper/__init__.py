# Python Camoufox Scraper Package
"""
Advanced multi-site web scraper using Camoufox browser automation.
Provides enhanced stealth capabilities and better resource efficiency.
"""

__version__ = "1.0.0"
__author__ = "TechPrice Team"

from .scraper import CamoufoxScraper
from .database import DatabaseManager
from .config import ConfigManager

__all__ = ["CamoufoxScraper", "DatabaseManager", "ConfigManager"]