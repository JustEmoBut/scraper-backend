#!/usr/bin/env python3
"""
Main entry point for the Python Camoufox scraper.
Provides equivalent functionality to the Node.js scraper with enhanced stealth.
"""

import sys
import os
import asyncio

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from scraper.cli import main

if __name__ == '__main__':
    # Windows compatibility for asyncio
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    
    # Run the CLI
    asyncio.run(main())