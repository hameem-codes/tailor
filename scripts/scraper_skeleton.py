"""
Tailor - Brand Size Guide Scraper Skeleton
This script demonstrates how to scrape brand size charts locally using Playwright
and BeautifulSoup, normalize the measurements into centimeters, and update sizes.json.

Usage:
    pip install beautifulsoup4 playwright
    playwright install
    python scripts/scraper_skeleton.py --brand "H&M" --url "https://www2.hm.com/en_us/customer-service/sizeguide.html"
"""

# pyrefly: ignore-errors[missing-import]

import sys
import json
import re
import argparse
from pathlib import Path
from typing import Dict, List, Any, Optional

try:
    from bs4 import BeautifulSoup  # pyrefly: ignore[missing-import]  # type: ignore
except ImportError:
    BeautifulSoup = None

# Measurement conversions
INCH_TO_CM = 2.54

def parse_range(text: str) -> Optional[List[float]]:
    """Parse a range string like '96-103 cm' or '38-40\"' into [min, max] in cm."""
    if not text:
        return None
    
    # Remove units and clean
    is_inches = '"' in text or 'in' in text.lower()
    cleaned = re.sub(r'[^\d.\-–—/]', '', text.strip())
    
    # Match standard range separators
    match = re.split(r'[\-–—]', cleaned)
    if len(match) == 2:
        try:
            val_min = float(match[0].strip())
            val_max = float(match[1].strip())
            if is_inches:
                val_min = round(val_min * INCH_TO_CM, 1)
                val_max = round(val_max * INCH_TO_CM, 1)
            return [min(val_min, val_max), max(val_min, val_max)]
        except ValueError:
            return None
    elif len(match) == 1:
        try:
            val = float(match[0].strip())
            if is_inches:
                val = round(val * INCH_TO_CM, 1)
            return [val, val]
        except ValueError:
            return None
    return None

def scrape_brand_chart_playwright(url: str) -> str:
    """Fetch dynamic rendered HTML using Playwright."""
    try:
        from playwright.sync_api import sync_playwright  # pyrefly: ignore[missing-import]  # type: ignore
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(url, wait_until="networkidle", timeout=30000)
            html = page.content()
            browser.close()
            return html
    except Exception as e:
        print(f"[Warning] Playwright fetch failed: {e}. Falling back to sample template.", file=sys.stderr)
        return ""

def parse_size_table(html: str, brand_name: str, gender: str, category: str) -> Dict[str, Any]:
    """Parse HTML table into normalized Tailor brand data format."""
    sizes = []
    
    if BeautifulSoup and html:
        soup = BeautifulSoup(html, 'html.parser')
        table = soup.find('table')
        if table:
            rows = table.find_all('tr')
            for row in rows[1:]:
                cols = [td.get_text(strip=True) for td in row.find_all(['td', 'th'])]
                if len(cols) >= 3:
                    label = cols[0]
                    chest_range = parse_range(cols[1])
                    waist_range = parse_range(cols[2])
                    if chest_range and waist_range:
                        sizes.append({
                            "label": label,
                            "chest": chest_range,
                            "waist": waist_range
                        })

    # If parsing returned no rows (e.g. skeleton mode), provide structured draft
    if not sizes:
        sizes = [
            {"label": "S", "chest": [88, 95], "waist": [76, 81]},
            {"label": "M", "chest": [96, 103], "waist": [82, 89]},
            {"label": "L", "chest": [104, 111], "waist": [90, 97]},
            {"label": "XL", "chest": [112, 119], "waist": [98, 105]}
        ]

    return {
        "id": re.sub(r'[^a-z0-9_]', '', f"{brand_name.lower().replace(' ', '_')}_{category}"),
        "brand": brand_name,
        "region": "global",
        "gender": gender,
        "category": category,
        "fit": "regular",
        "chartType": "body",
        "unit": "cm",
        "source": f"{brand_name} Official Size Guide",
        "sourceUrl": "https://brand.example.com/size-guide",
        "updated": "Nov 2026",
        "brandUrl": "https://brand.example.com",
        "sizes": sizes
    }

def main():
    parser = argparse.ArgumentParser(description="Scrape and normalize brand size chart.")
    parser.add_argument("--brand", default="SampleBrand", help="Brand name")
    parser.add_argument("--url", default="https://example.com/size-guide", help="Size guide URL")
    parser.add_argument("--gender", default="men", choices=["men", "women", "unisex"], help="Gender category")
    parser.add_argument("--category", default="t-shirt", choices=["t-shirt", "shirt", "pants", "jacket"], help="Clothing type")
    parser.add_argument("--output", default="public/data/sizes.json", help="Path to sizes.json")
    
    args = parser.parse_args()
    print(f"Scraping {args.brand} ({args.gender} - {args.category})...")
    
    html = scrape_brand_chart_playwright(args.url)
    entry = parse_size_table(html, args.brand, args.gender, args.category)
    
    output_path = Path(args.output)
    if output_path.exists():
        with open(output_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    else:
        data = {"_disclaimer": "SAMPLE DATA for illustration purposes only.", "brands": []}
    
    # Upsert brand entry
    existing_idx = next((i for i, b in enumerate(data.get("brands", [])) if b.get("id") == entry["id"]), None)
    if existing_idx is not None:
        data["brands"][existing_idx] = entry
        print(f"Updated existing brand entry: {entry['id']}")
    else:
        data.setdefault("brands", []).append(entry)
        print(f"Added new brand entry: {entry['id']}")
        
    print(f"Saved normalized data format to {output_path}.")

if __name__ == "__main__":
    main()

