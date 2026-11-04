import { BrandChart } from '../types';
import rawData from '../../public/data/sizes.json';

const bundledBrands = (rawData as any).brands as BrandChart[];

export function getInitialBrands(): BrandChart[] {
  return bundledBrands || [];
}

export async function fetchBrandSizes(): Promise<BrandChart[]> {
  try {
    const res = await fetch('/data/sizes.json');
    if (res.ok) {
      const data = await res.json();
      if (data.brands && Array.isArray(data.brands)) {
        return data.brands;
      }
    }
  } catch (err) {
    // Silently fallback to bundledBrands
  }
  return bundledBrands;
}
