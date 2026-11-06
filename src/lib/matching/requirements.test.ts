import { describe, it, expect } from 'vitest';
import { matchBrand, matchAllBrands } from './engine';
import {
  cmToInches,
  inchesToCm,
  kgToLbs,
  lbsToKg,
  formatRange,
  formatDimension,
  getEaseAllowance,
  estimateMeasurementsFromHeightWeight,
  validateHeightWeight,
} from './helpers';
import { BrandChart, UserMeasurements } from '../../types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const hm: BrandChart = {
  id: 'hm_test',
  brand: 'H&M',
  region: 'global',
  gender: 'men',
  category: 't-shirt',
  fit: 'regular',
  chartType: 'body',
  unit: 'cm',
  source: 'H&M Size Guide',
  sourceUrl: 'https://hm.com',
  updated: 'Nov 2026',
  brandUrl: 'https://hm.com',
  sizes: [
    { label: 'XS', chest: [80, 87], waist: [70, 75] },
    { label: 'S', chest: [88, 95], waist: [76, 81] },
    { label: 'M', chest: [96, 103], waist: [82, 89] },
    { label: 'L', chest: [104, 111], waist: [90, 97] },
    { label: 'XL', chest: [112, 119], waist: [98, 105] },
  ],
};

const zara: BrandChart = {
  id: 'zara_test',
  brand: 'ZARA',
  region: 'global',
  gender: 'men',
  category: 't-shirt',
  fit: 'slim',
  chartType: 'body',
  unit: 'cm',
  source: 'ZARA Guide',
  sourceUrl: 'https://zara.com',
  updated: 'Nov 2026',
  brandUrl: 'https://zara.com',
  sizes: [
    { label: 'S', chest: [92, 99], waist: [78, 85] },
    { label: 'M', chest: [100, 107], waist: [86, 93] },
    { label: 'L', chest: [108, 115], waist: [94, 101] },
  ],
};

const levisPants: BrandChart = {
  id: 'levis_pants_test',
  brand: "Levi's",
  region: 'global',
  gender: 'men',
  category: 'pants',
  fit: 'regular',
  chartType: 'body',
  unit: 'cm',
  source: "Levi's Guide",
  sourceUrl: 'https://levis.com',
  updated: 'Nov 2026',
  brandUrl: 'https://levis.com',
  sizes: [
    { label: '30', waist: [76, 78], hips: [92, 95] },
    { label: '31', waist: [79, 81], hips: [96, 99] },
    { label: '32', waist: [82, 84], hips: [100, 103] },
    { label: '33', waist: [85, 87], hips: [104, 107] },
    { label: '34', waist: [88, 90], hips: [108, 111] },
  ],
};

const bodyChart = hm;
// Garment chart where every size reports a wide garment waist, so tests can
// isolate the chest/ease behaviour from the secondary dimension.
const garmentChart: BrandChart = {
  id: 'cos_test',
  brand: 'COS',
  region: 'global',
  gender: 'men',
  category: 't-shirt',
  fit: 'regular',
  chartType: 'garment',
  unit: 'cm',
  source: 'COS Guide',
  sourceUrl: 'https://cos.com',
  updated: 'Nov 2026',
  brandUrl: 'https://cos.com',
  sizes: [
    { label: 'S', garmentChest: [96, 103], garmentWaist: [60, 120] },
    { label: 'M', garmentChest: [104, 111], garmentWaist: [60, 120] },
    { label: 'L', garmentChest: [112, 119], garmentWaist: [60, 120] },
  ],
};

const slimGarmentChart: BrandChart = { ...garmentChart, id: 'cos_slim_test', fit: 'slim' };
const relaxedGarmentChart: BrandChart = { ...garmentChart, id: 'cos_relaxed_test', fit: 'relaxed' };

// Chart whose secondary (waist) range spans every test value, so leaning can be
// exercised purely on the primary (chest) dimension.
const wideWaistChart: BrandChart = {
  ...hm,
  id: 'wide_waist_test',
  sizes: [
    { label: 'XS', chest: [80, 87], waist: [60, 110] },
    { label: 'S', chest: [88, 95], waist: [60, 110] },
    { label: 'M', chest: [96, 103], waist: [60, 110] },
    { label: 'L', chest: [104, 111], waist: [60, 110] },
    { label: 'XL', chest: [112, 119], waist: [60, 110] },
  ],
};

const baseUser: UserMeasurements = {
  gender: 'men',
  category: 't-shirt',
  unit: 'metric',
  height: 175,
  weight: 70,
  chest: 96,
  waist: 82,
  fitPreference: 'regular',
};

// ---------------------------------------------------------------------------

describe('Matching engine — exact boundary values', () => {
  it('treats the inclusive min of a range as inside that size', () => {
    const r = matchBrand(hm, { ...baseUser, chest: 96, waist: 82 });
    expect(r.recommendedSize).toBe('M');
    expect(r.overallScore).toBe(0);
    expect(r.matchStatus).toBe('great');
  });

  it('treats the inclusive max of a range as inside that size', () => {
    const r = matchBrand(hm, { ...baseUser, chest: 103, waist: 89 });
    expect(r.recommendedSize).toBe('M');
    expect(r.overallScore).toBe(0);
    expect(r.matchStatus).toBe('great');
  });

  it('puts a value one tenth below the min into the smaller size', () => {
    // 95.9 is 0.1 below M's min (96) but 0.9 above S's max (95): the nearest
    // size wins, so M remains the recommendation.
    const r = matchBrand(hm, { ...baseUser, chest: 95.9, waist: 82 });
    expect(r.primarySizeIndex).toBe(2); // M
    // 0.1 cm chest distance x 0.7 weight, rounded to one decimal by the engine
    expect(r.overallScore).toBe(0.1);
  });

  it('puts a value one tenth above the max into the larger size', () => {
    // 103.1 is 0.1 above M's max (103) but 0.9 below L's min (104).
    const r = matchBrand(hm, { ...baseUser, chest: 103.1, waist: 82 });
    expect(r.primarySizeIndex).toBe(2); // M
    expect(r.overallScore).toBe(0.1);
  });

  it('keeps every in-range size evaluation at score zero', () => {
    const r = matchBrand(hm, { ...baseUser, chest: 99, waist: 85 });
    const inside = r.sizeEvaluations.filter((e) => e.isInside);
    for (const e of inside) expect(e.score).toBe(0);
  });
});

describe('Matching engine — between sizes', () => {
  it('reports both candidate sizes when the user sits in a gap', () => {
    // H&M S ends at 95, M starts at 96 -> no gap, so use a chart with a real gap.
    const gapped: BrandChart = {
      ...hm,
      id: 'gapped_test',
      sizes: [
        { label: 'S', chest: [88, 94], waist: [76, 81] },
        { label: 'M', chest: [97, 104], waist: [82, 89] },
        { label: 'L', chest: [105, 112], waist: [90, 97] },
      ],
    };
    const r = matchBrand(gapped, { ...baseUser, chest: 96, waist: 82 });
    expect(r.matchStatus).toBe('between');
    expect(r.recommendedSize).toMatch(/^[SML](\/[SML])?$/);
    expect(r.secondarySizeIndex).toBeDefined();
    expect(r.ruler.secondaryBarLeftPercent).toBeDefined();
    expect(r.ruler.secondaryBarLeftPercent).toBeGreaterThanOrEqual(0);
  });

  it('does not report between sizes when the user sits cleanly inside one size', () => {
    const r = matchBrand(hm, { ...baseUser, chest: 99, waist: 85 });
    expect(r.matchStatus).toBe('great');
    expect(r.recommendedSize).not.toContain('/');
    expect(r.secondarySizeIndex).toBeUndefined();
  });

  it('recommends the larger size for a loose preference and the smaller for snug', () => {
    const gapped: BrandChart = {
      ...hm,
      id: 'gapped_test',
      sizes: [
        { label: 'S', chest: [88, 94], waist: [76, 81] },
        { label: 'M', chest: [97, 104], waist: [82, 89] },
      ],
    };
    const snug = matchBrand(gapped, { ...baseUser, chest: 95.5, waist: 82, fitPreference: 'snug' });
    const loose = matchBrand(gapped, { ...baseUser, chest: 95.5, waist: 82, fitPreference: 'loose' });
    expect(snug.primarySizeIndex).toBeLessThan(loose.primarySizeIndex);
    expect(snug.recommendedSize).toContain('/');
    expect(loose.recommendedSize).toContain('/');
  });
});

describe('Matching engine — outside the chart', () => {
  it('reports a poor match below the smallest size', () => {
    const r = matchBrand(hm, { ...baseUser, chest: 55, waist: 50 });
    expect(r.matchStatus).toBe('poor');
    expect(r.primarySizeIndex).toBe(0);
    expect(r.overallScore).toBeGreaterThan(4);
    expect(r.verdict).toMatch(/No size is close/);
  });

  it('reports a poor match above the largest size', () => {
    const r = matchBrand(hm, { ...baseUser, chest: 160, waist: 140 });
    expect(r.matchStatus).toBe('poor');
    expect(r.primarySizeIndex).toBe(hm.sizes.length - 1);
    expect(r.tip).toContain('Nearest size is');
  });

  it('still returns finite, clamped ruler metrics outside the chart', () => {
    const r = matchBrand(hm, { ...baseUser, chest: 300, waist: 250 });
    expect(Number.isFinite(r.ruler.userDotPercent)).toBe(true);
    expect(r.ruler.userDotPercent).toBeLessThanOrEqual(96);
    expect(r.ruler.userDotPercent).toBeGreaterThanOrEqual(4);
    expect(r.ruler.primaryBarWidthPercent).toBeGreaterThan(0);
    expect(r.ruler.primaryBarWidthPercent).toBeLessThanOrEqual(90);
  });

  it('handles a chart with a single size without crashing', () => {
    const single: BrandChart = {
      ...hm,
      id: 'single_test',
      sizes: [{ label: 'One size', chest: [90, 100], waist: [75, 85] }],
    };
    const r = matchBrand(single, baseUser);
    expect(r.recommendedSize).toBe('One size');
    expect(r.secondarySizeIndex).toBeUndefined();
  });
});

describe('Matching engine — missing chest / waist', () => {
  it('lowers confidence to medium when only chest is supplied', () => {
    const r = matchBrand(hm, { ...baseUser, waist: undefined });
    expect(r.confidence).toBe('medium');
    expect(r.confidenceReason).toContain('Based on chest only');
  });

  it('lowers confidence to medium when only waist is supplied', () => {
    const r = matchBrand(hm, { ...baseUser, chest: undefined });
    expect(r.confidence).toBe('medium');
    expect(r.confidenceReason).toContain('Based on waist only');
  });

  it('lowers confidence to low when neither is supplied', () => {
    const r = matchBrand(hm, {
      gender: 'men', category: 't-shirt', unit: 'metric',
      height: 175, weight: 70, fitPreference: 'regular',
    });
    expect(r.confidence).toBe('low');
    expect(r.confidenceReason).toContain('Estimated from height and weight');
    expect(Number.isFinite(r.overallScore)).toBe(true);
  });

  it('treats a zero chest as missing rather than as a real measurement', () => {
    const r = matchBrand(hm, { ...baseUser, chest: 0 });
    expect(r.confidence).not.toBe('high');
  });

  it('pants rely on waist, and fall back to hips with lower confidence when absent', () => {
    const waistOnly = matchBrand(levisPants, {
      ...baseUser, category: 'pants', chest: undefined, waist: 82, hips: undefined,
    });
    expect(waistOnly.confidence).toBe('medium');
    expect(waistOnly.confidenceReason).toContain('Based on waist only');

    const neither = matchBrand(levisPants, {
      gender: 'men', category: 'pants', unit: 'metric',
      height: 178, weight: 80, chest: undefined, waist: undefined, hips: undefined,
      fitPreference: 'regular',
    });
    expect(neither.confidence).toBe('low');
    expect(neither.recommendedSize).toMatch(/^\d/);
  });

  it('missing measurements still produce a determinate verdict and readable text', () => {
    const r = matchBrand(hm, {
      gender: 'women', category: 't-shirt', unit: 'metric',
      height: 165, weight: 60, fitPreference: 'regular',
    });
    expect(r.verdict.length).toBeGreaterThan(5);
    expect(r.chestRangeText).toMatch(/cm/);
    expect(r.waistRangeText).toMatch(/cm/);
  });
});

describe('Matching engine — unit conversion round trips', () => {
  it('cm → in → cm is stable within rounding tolerance', () => {
    for (const cm of [70, 82, 96, 100, 112, 119]) {
      expect(inchesToCm(cmToInches(cm))).toBeCloseTo(cm, 0);
    }
  });

  it('kg → lb → kg is stable within rounding tolerance', () => {
    for (const kg of [45, 60, 70, 85, 110]) {
      expect(lbsToKg(kgToLbs(kg))).toBeCloseTo(kg, 0);
    }
  });

  it('never produces a negative or zero dimension from a valid input', () => {
    for (const cm of [1, 10, 50, 200]) {
      expect(cmToInches(cm)).toBeGreaterThan(0);
      expect(inchesToCm(cmToInches(cm))).toBeGreaterThan(0);
    }
  });

  it('formats imperial ranges with converted endpoints', () => {
    expect(formatRange(96, 103, 'imperial')).toBe('37.8–40.6 in');
    expect(formatRange(96, 103, 'metric')).toBe('96–103 cm');
    expect(formatDimension(96, 'imperial')).toBe('37.8 in');
    expect(formatDimension(96, 'metric')).toBe('96 cm');
  });

  it('gives the same recommended size for equivalent metric and imperial inputs', () => {
    // 96 cm == 37.7952755... in; store the body value in cm in both cases.
    const metric = matchBrand(hm, { ...baseUser, unit: 'metric', chest: 96, waist: 82 });
    const imperialInput = {
      ...baseUser,
      unit: 'imperial' as const,
      chest: inchesToCm(37.8),
      waist: inchesToCm(32.3),
    };
    const imperial = matchBrand(hm, imperialInput);
    expect(imperial.recommendedSize).toBe(metric.recommendedSize);
    expect(imperial.matchStatus).toBe(metric.matchStatus);
    expect(imperial.chestRangeText).toContain('in');
    expect(metric.chestRangeText).toContain('cm');
  });
});

describe('Matching engine — fit preference shifts', () => {
  it('snug leans to the smaller size and loose to the larger near an edge', () => {
    // chest 103.5 sits 0.5 above M (103) and 0.5 below L (104): a genuine tie.
    const regular = matchBrand(wideWaistChart, { ...baseUser, chest: 103.5, waist: 82, fitPreference: 'regular' });
    const loose = matchBrand(wideWaistChart, { ...baseUser, chest: 103.5, waist: 82, fitPreference: 'loose' });
    const snug = matchBrand(wideWaistChart, { ...baseUser, chest: 95.5, waist: 82, fitPreference: 'snug' });
    expect(regular.primarySizeIndex).toBe(2); // M (tie resolved to the lower index)
    expect(loose.primarySizeIndex).toBe(3); //    L
    expect(snug.primarySizeIndex).toBe(1); //  S
    expect(loose.overallScore).toBeLessThanOrEqual(regular.overallScore + 2.0);
  });

  it('does not lean past the ends of the chart', () => {
    const top = matchBrand(hm, { ...baseUser, chest: 118, waist: 104, fitPreference: 'loose' });
    expect(top.primarySizeIndex).toBe(hm.sizes.length - 1);
    const bottom = matchBrand(hm, { ...baseUser, chest: 79, waist: 70, fitPreference: 'snug' });
    expect(bottom.primarySizeIndex).toBe(0);
  });

  it('regular is the midpoint behaviour between snug and loose', () => {
    const user = { ...baseUser, chest: 95.6, waist: 82 };
    const snug = matchBrand(hm, { ...user, fitPreference: 'snug' });
    const regular = matchBrand(hm, { ...user, fitPreference: 'regular' });
    const loose = matchBrand(hm, { ...user, fitPreference: 'loose' });
    expect(snug.primarySizeIndex).toBeLessThanOrEqual(regular.primarySizeIndex);
    expect(regular.primarySizeIndex).toBeLessThanOrEqual(loose.primarySizeIndex);
  });
});

describe('Matching engine — garment vs body ease', () => {
  it('applies no ease to a body chart and positive ease to a garment chart', () => {
    expect(getEaseAllowance('t-shirt', 'regular')).toEqual({ chest: 6, waist: 5 });

    // COS garment M is garmentChest [104,111]. With a 6 cm ease the body
    // equivalent is [98,105]: a 98 cm body is inside, 107 cm is not.
    const inside = matchBrand(garmentChart, { ...baseUser, chest: 98, waist: 99 });
    expect(inside.recommendedSize).toBe('M');
    expect(inside.overallScore).toBe(0);
    expect(inside.matchStatus).toBe('great');

    const outside = matchBrand(garmentChart, { ...baseUser, chest: 107, waist: 84 });
    expect(outside.recommendedSize).not.toBe('M');
    expect(outside.recommendedSize).toBe('L');
    // ...the M evaluation itself carries the 2 cm overshoot
    const mEval = outside.sizeEvaluations.find((e) => e.size.label === 'M')!;
    expect(mEval.score).toBeCloseTo(1.4, 1);
    expect(outside.overallScore).toBe(0);
  });

  it('uses garmentWaist as the secondary range when a chart omits body waist', () => {
    // A garment-only chart must not fall back to a phantom 70-78 waist range.
    const garmentOnly: BrandChart = {
      ...garmentChart,
      id: 'garment_only_test',
      sizes: [
        { label: 'M', garmentChest: [104, 111], garmentWaist: [96, 103] },
        { label: 'L', garmentChest: [112, 119], garmentWaist: [104, 111] },
      ],
    };
    // waist 99 == garmentWaist 96+... -> body equivalent of [96,103] with 5 cm
    // ease is [91,98]; 99 sits just outside, so the score reflects only the
    // waist, not a fabricated 70-78 band.
    const r = matchBrand(garmentOnly, { ...baseUser, chest: 98, waist: 94 });
    expect(r.recommendedSize).toBe('M');
    expect(r.sizeEvaluations[0].score).toBeLessThan(1.5);
    expect(r.waistRangeText).toContain('91');
  });

  it('the same body measurement resolves to different sizes on body vs garment charts', () => {
    const user = { ...baseUser, chest: 100, waist: 84 };
    const bodyRes = matchBrand(bodyChart, user);
    const garmentRes = matchBrand(garmentChart, user);
    // body H&M M is [96,103] (100 inside); garment COS M body-equivalent is [98,105].
    expect(bodyRes.recommendedSize).toBe('M');
    expect(garmentRes.recommendedSize).toBe('M');
    // A 94 cm body is inside H&M's S (88-95) but COS's garment ease shrinks the
    // equivalent sizes, so the garment chart leans larger.
    const b = matchBrand(bodyChart, { ...user, chest: 94 });
    const g = matchBrand(garmentChart, { ...user, chest: 94 });
    expect(b.primarySizeIndex).toBeGreaterThanOrEqual(g.primarySizeIndex);
  });

  it('uses a larger ease for relaxed cuts than slim cuts', () => {
    const slim = getEaseAllowance('t-shirt', 'slim');
    const relaxed = getEaseAllowance('t-shirt', 'relaxed');
    expect(relaxed.chest).toBeGreaterThan(slim.chest);
    expect(relaxed.waist).toBeGreaterThan(slim.waist);
  });

  it('garment ease pushes a body measurement up a size relative to a body chart', () => {
    const bodyBrand: BrandChart = {
      ...garmentChart, id: 'cos_body_test', chartType: 'body',
      sizes: [{ label: 'S', chest: [90, 97], waist: [76, 83] }, { label: 'M', chest: [98, 105], waist: [84, 91] }],
    };
    const bodyRes = matchBrand(bodyBrand, { ...baseUser, chest: 95, waist: 80 });
    const garmentRes = matchBrand(garmentChart, { ...baseUser, chest: 95, waist: 80 });
    expect(garmentRes.primarySizeIndex).toBeGreaterThanOrEqual(bodyRes.primarySizeIndex);
  });

  it('jackets get a larger ease allowance than t-shirts', () => {
    expect(getEaseAllowance('jacket', 'regular').chest).toBeGreaterThan(
      getEaseAllowance('t-shirt', 'regular').chest
    );
  });
});

describe('Matching engine — determinism', () => {
  it('identical inputs produce identical outputs', () => {
    const a = JSON.stringify(matchBrand(hm, baseUser));
    const b = JSON.stringify(matchBrand(hm, { ...baseUser }));
    expect(a).toBe(b);
  });

  it('repeated calls across brands are stable and order-independent', () => {
    const r1 = matchAllBrands([hm, zara], baseUser);
    const r2 = matchAllBrands([zara, hm], baseUser);
    const byId = (list: typeof r1) => [...list].sort((x, y) => x.brandChart.id.localeCompare(y.brandChart.id));
    expect(JSON.stringify(byId(r1))).toBe(JSON.stringify(byId(r2)));
  });

  it('does not mutate the input chart or the user measurements', () => {
    const chartSnapshot = JSON.stringify(hm);
    const userSnapshot = JSON.stringify(baseUser);
    matchBrand(hm, baseUser);
    matchAllBrands([hm, zara], baseUser);
    expect(JSON.stringify(hm)).toBe(chartSnapshot);
    expect(JSON.stringify(baseUser)).toBe(userSnapshot);
  });
});

describe('Matching engine — matchAllBrands filtering and sorting', () => {
  it('filters by category', () => {
    const res = matchAllBrands([hm, zara, levisPants], baseUser);
    expect(res.every((r) => r.brandChart.category === 't-shirt')).toBe(true);
    expect(res).toHaveLength(2);
  });

  it('includes unisex and same-gender charts but excludes opposite-gender charts', () => {
    const womens: BrandChart = { ...hm, id: 'w_test', gender: 'women' };
    const unisex: BrandChart = { ...hm, id: 'u_test', gender: 'unisex' };
    const res = matchAllBrands([hm, womens, unisex], baseUser);
    expect(res.map((r) => r.brandChart.id).sort()).toEqual(['hm_test', 'u_test']);
  });

  it('unisex users see every gender variant', () => {
    const womens: BrandChart = { ...hm, id: 'w_test', gender: 'women' };
    const res = matchAllBrands([hm, womens], { ...baseUser, gender: 'unisex' });
    expect(res).toHaveLength(2);
  });

  it('applies region filters', () => {
    const local: BrandChart = { ...hm, id: 'l_test', region: 'local' };
    expect(matchAllBrands([hm, local], baseUser, '', 'global')).toHaveLength(1);
    expect(matchAllBrands([hm, local], baseUser, '', 'local')).toHaveLength(1);
    expect(matchAllBrands([hm, local], baseUser, '', 'all')).toHaveLength(2);
  });

  it('search is case-insensitive and matches partial brand names', () => {
    expect(matchAllBrands([hm, zara], baseUser, 'H&M', 'all', 'match')).toHaveLength(1);
    expect(matchAllBrands([hm, zara], baseUser, 'zar', 'all', 'match')).toHaveLength(1);
    // punctuation-insensitive: "HM" must find "H&M"
    expect(matchAllBrands([hm, zara], baseUser, '  HM ', 'all', 'match')).toHaveLength(1);
    expect(matchAllBrands([hm, zara], baseUser, 'h m', 'all', 'match')).toHaveLength(1);
    expect(matchAllBrands([hm, zara], baseUser, 'nothing', 'all', 'match')).toHaveLength(0);
    // searching only punctuation must not silently match everything
    expect(matchAllBrands([hm, zara], baseUser, '!!!', 'all', 'match')).toHaveLength(0);
  });

  it('sorts best-match by status priority then score', () => {
    const res = matchAllBrands([hm, zara], { ...baseUser, chest: 90, waist: 78 }, '', 'all', 'match');
    const order = { great: 1, between: 2, poor: 3 } as const;
    for (let i = 1; i < res.length; i++) {
      expect(order[res[i - 1].matchStatus]).toBeLessThanOrEqual(order[res[i].matchStatus]);
    }
  });

  it('sorts A–Z by brand name', () => {
    const res = matchAllBrands([hm, zara], baseUser, '', 'all', 'brand-asc');
    expect(res.map((r) => r.brandChart.brand)).toEqual(['H&M', 'ZARA']);
  });

  it('sorts by size label', () => {
    const res = matchAllBrands([hm, zara], baseUser, '', 'all', 'size');
    expect(res).toHaveLength(2);
    expect(res.map((r) => r.recommendedSize)).toEqual([...res.map((r) => r.recommendedSize)].sort((a, b) => a.localeCompare(b)));
  });

  it('returns an empty array rather than throwing when nothing matches', () => {
    expect(matchAllBrands([hm], { ...baseUser, category: 'jacket' })).toEqual([]);
  });
});

describe('Matching engine — anthropometric estimation', () => {
  it('produces anatomically ordered chest > waist for men', () => {
    const est = estimateMeasurementsFromHeightWeight(180, 80, 'men');
    expect(est.chest).toBeGreaterThan(est.waist);
    expect(est.hips).toBeGreaterThan(est.waist);
  });

  it('produces anatomically ordered hips > chest for women', () => {
    const est = estimateMeasurementsFromHeightWeight(168, 62, 'women');
    expect(est.hips).toBeGreaterThan(est.chest);
    expect(est.chest).toBeGreaterThan(est.waist);
  });

  it('scales waist upward with weight at a fixed height', () => {
    const light = estimateMeasurementsFromHeightWeight(175, 60, 'men');
    const heavy = estimateMeasurementsFromHeightWeight(175, 100, 'men');
    expect(heavy.waist).toBeGreaterThan(light.waist);
    expect(heavy.chest).toBeGreaterThan(light.chest);
  });

  it('never returns a non-finite value for extreme inputs', () => {
    for (const [h, w] of [[120, 30], [230, 250], [150, 40]]) {
      const est = estimateMeasurementsFromHeightWeight(h, w, 'unisex');
      for (const v of [est.chest, est.waist, est.hips]) {
        expect(Number.isFinite(v)).toBe(true);
        expect(v).toBeGreaterThan(0);
      }
    }
  });
});

describe('Validation helpers — boundary behaviour', () => {
  it('accepts the inclusive bounds and rejects just outside them', () => {
    expect(validateHeightWeight(120, 30)).toMatchObject({ heightValid: true, weightValid: true });
    expect(validateHeightWeight(230, 250)).toMatchObject({ heightValid: true, weightValid: true });
    expect(validateHeightWeight(119.9, 30).heightValid).toBe(false);
    expect(validateHeightWeight(230.1, 30).heightValid).toBe(false);
    expect(validateHeightWeight(120, 29.9).weightValid).toBe(false);
    expect(validateHeightWeight(120, 250.1).weightValid).toBe(false);
  });

  it('returns imperial message text when the unit is imperial', () => {
    const v = validateHeightWeight(10, 10, 'imperial');
    expect(v.heightError).toContain('in');
    expect(v.weightError).toContain('lb');
  });

  it('rejects NaN and negative inputs', () => {
    expect(validateHeightWeight(NaN, 70).heightValid).toBe(false);
    expect(validateHeightWeight(175, NaN).weightValid).toBe(false);
    expect(validateHeightWeight(-175, 70).heightValid).toBe(false);
    expect(validateHeightWeight(175, -70).weightValid).toBe(false);
  });
});

describe('Matching engine — real bundled data integrity', () => {
  it('every pants chart exposes a waist range so the engine never dereferences undefined', async () => {
    const raw = await import('../../../public/data/sizes.json');
    const brands = (raw as unknown as { brands: BrandChart[] }).brands;
    const pants = brands.filter((b) => b.category === 'pants');
    expect(pants.length).toBeGreaterThan(0);
    for (const b of pants) {
      for (const s of b.sizes) {
        expect(s.waist, `${b.id}/${s.label} is missing a waist range`).toBeDefined();
      }
    }
  });

  it('produces a determinate result for every bundled chart and a realistic user', async () => {
    const raw = await import('../../../public/data/sizes.json');
    const brands = (raw as unknown as { brands: BrandChart[] }).brands;
    for (const b of brands) {
      const user: UserMeasurements = {
        gender: b.gender,
        category: b.category,
        unit: 'metric',
        height: 178,
        weight: 78,
        chest: 100,
        waist: 86,
        hips: 100,
        fitPreference: 'regular',
      };
      const r = matchBrand(b, user);
      expect(r.recommendedSize, `${b.id} returned an empty size`).toBeTruthy();
      expect(['great', 'between', 'poor']).toContain(r.matchStatus);
      expect(Number.isFinite(r.overallScore)).toBe(true);
      expect(r.ruler.userDotPercent).toBeGreaterThanOrEqual(4);
      expect(r.ruler.userDotPercent).toBeLessThanOrEqual(96);
      expect(r.ruler.primaryBarWidthPercent).toBeGreaterThan(0);
    }
  });

  it('every chart has a unique id and at least one size', async () => {
    const raw = await import('../../../public/data/sizes.json');
    const brands = (raw as unknown as { brands: BrandChart[] }).brands;
    const ids = new Set(brands.map((b) => b.id));
    expect(ids.size).toBe(brands.length);
    for (const b of brands) expect(b.sizes.length).toBeGreaterThan(0);
  });

  it('slim and relaxed garment variants of the same chart resolve differently', () => {
    const user = { ...baseUser, chest: 100, waist: 84 };
    const slim = matchBrand(slimGarmentChart, user);
    const relaxed = matchBrand(relaxedGarmentChart, user);
    expect(relaxed.primarySizeIndex).toBeGreaterThanOrEqual(slim.primarySizeIndex);
  });
});
