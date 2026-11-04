"""
Tailor - Brand Size Data Validator
Validates public/data/sizes.json against the Tailor schema and anthropometric reality checks.

Usage:
    py scripts/validate_sizes.py [path_to_sizes_json]
"""

import sys
import json
from pathlib import Path
from typing import List, Dict, Any

VALID_REGIONS = {"global", "local"}
VALID_GENDERS = {"men", "women", "unisex"}
VALID_CATEGORIES = {"t-shirt", "shirt", "pants", "jacket"}
VALID_FITS = {"regular", "slim", "relaxed"}
VALID_CHART_TYPES = {"body", "garment"}
VALID_UNITS = {"cm", "in"}

# Realistic measurement boundaries in cm
LIMITS = {
    "chest": (50.0, 200.0),
    "waist": (40.0, 180.0),
    "hips": (50.0, 200.0),
    "length": (40.0, 150.0),
}

def validate_brand(brand: Dict[str, Any], index: int) -> List[str]:
    errors = []
    brand_name = brand.get("brand", f"Brand #{index}")

    # Check required fields
    required_fields = ["id", "brand", "region", "gender", "category", "fit", "chartType", "unit", "source", "updated", "sizes"]
    for field in required_fields:
        if field not in brand:
            errors.append(f"[{brand_name}] Missing required field '{field}'")

    # Check enums
    if brand.get("region") not in VALID_REGIONS:
        errors.append(f"[{brand_name}] Invalid region '{brand.get('region')}'. Expected one of: {VALID_REGIONS}")
    if brand.get("gender") not in VALID_GENDERS:
        errors.append(f"[{brand_name}] Invalid gender '{brand.get('gender')}'. Expected one of: {VALID_GENDERS}")
    if brand.get("category") not in VALID_CATEGORIES:
        errors.append(f"[{brand_name}] Invalid category '{brand.get('category')}'. Expected one of: {VALID_CATEGORIES}")
    if brand.get("chartType") not in VALID_CHART_TYPES:
        errors.append(f"[{brand_name}] Invalid chartType '{brand.get('chartType')}'. Expected one of: {VALID_CHART_TYPES}")
    if brand.get("unit") not in VALID_UNITS:
        errors.append(f"[{brand_name}] Invalid unit '{brand.get('unit')}'. Expected one of: {VALID_UNITS}")

    sizes = brand.get("sizes", [])
    if not isinstance(sizes, list) or len(sizes) == 0:
        errors.append(f"[{brand_name}] 'sizes' must be a non-empty array.")
        return errors

    prev_chest_max = None
    prev_waist_max = None

    for s_idx, size in enumerate(sizes):
        label = size.get("label", f"Size #{s_idx}")
        if not label:
            errors.append(f"[{brand_name}] Size item #{s_idx} missing label.")

        # Validate range fields
        for dim in ["chest", "waist", "hips"]:
            if dim in size:
                rng = size[dim]
                if not isinstance(rng, list) or len(rng) != 2:
                    errors.append(f"[{brand_name} / {label}] '{dim}' must be a 2-element array [min, max]. Got {rng}")
                    continue
                min_val, max_val = rng[0], rng[1]
                if not (isinstance(min_val, (int, float)) and isinstance(max_val, (int, float))):
                    errors.append(f"[{brand_name} / {label}] '{dim}' values must be numeric. Got {rng}")
                    continue
                if min_val > max_val:
                    errors.append(f"[{brand_name} / {label}] Inverted range in '{dim}': min ({min_val}) > max ({max_val})")

                # Realistic limit checks
                low_limit, high_limit = LIMITS[dim]
                if min_val < low_limit or max_val > high_limit:
                    errors.append(f"[{brand_name} / {label}] Unrealistic {dim} range: {rng} (expected between {low_limit} and {high_limit} cm)")

    return errors

def main():
    json_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("public/data/sizes.json")
    print(f"Validating size charts in: {json_path}")

    if not json_path.exists():
        print(f"Error: File {json_path} does not exist.", file=sys.stderr)
        sys.exit(1)

    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"JSON Parse Error: {e}", file=sys.stderr)
        sys.exit(1)

    brands = data.get("brands", [])
    print(f"Found {len(brands)} brand charts to validate...")

    all_errors = []
    for i, brand in enumerate(brands):
        errs = validate_brand(brand, i)
        if errs:
            all_errors.extend(errs)

    if all_errors:
        print("\n[FAILED] Validation Failed with errors:")
        for err in all_errors:
            print(f"  - {err}")
        sys.exit(1)
    else:
        print(f"\n[PASSED] All {len(brands)} brand size charts validated successfully! No inverted ranges or schema errors found.")
        sys.exit(0)

if __name__ == "__main__":
    main()
