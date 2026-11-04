import {
  BrandChart,
  UserMeasurements,
  BrandMatchResult,
  SizeEvaluation,
  MatchStatus,
  ConfidenceLevel
} from '../../types';
import {
  estimateMeasurementsFromHeightWeight,
  getEaseAllowance,
  formatRange
} from './helpers';

export function matchBrand(brandChart: BrandChart, user: UserMeasurements): BrandMatchResult {
  const isPants = user.category === 'pants';
  
  // 1. Determine effective measurements & confidence
  let chestVal = user.chest;
  let waistVal = user.waist;
  let hipsVal = user.hips;
  let confidence: ConfidenceLevel = 'high';
  let confidenceReason = 'Based on chest and waist.';

  const hasChest = chestVal !== undefined && chestVal > 0;
  const hasWaist = waistVal !== undefined && waistVal > 0;
  const hasHips = hipsVal !== undefined && hipsVal > 0;

  if (isPants) {
    if (hasWaist && hasHips) {
      confidence = 'high';
      confidenceReason = 'Based on waist and hips.';
    } else if (hasWaist) {
      confidence = 'medium';
      confidenceReason = 'Based on waist only.';
      const est = estimateMeasurementsFromHeightWeight(user.height, user.weight, user.gender);
      hipsVal = est.hips;
    } else {
      confidence = 'low';
      confidenceReason = 'Estimated from height and weight.';
      const est = estimateMeasurementsFromHeightWeight(user.height, user.weight, user.gender);
      waistVal = est.waist;
      hipsVal = est.hips;
    }
  } else {
    // Tops & Jackets
    if (hasChest && hasWaist) {
      confidence = 'high';
      confidenceReason = 'Based on chest and waist.';
    } else if (hasChest) {
      confidence = 'medium';
      confidenceReason = 'Based on chest only.';
      const est = estimateMeasurementsFromHeightWeight(user.height, user.weight, user.gender);
      waistVal = est.waist;
    } else if (hasWaist) {
      confidence = 'medium';
      confidenceReason = 'Based on waist only.';
      const est = estimateMeasurementsFromHeightWeight(user.height, user.weight, user.gender);
      chestVal = est.chest;
    } else {
      confidence = 'low';
      confidenceReason = 'Estimated from height and weight.';
      const est = estimateMeasurementsFromHeightWeight(user.height, user.weight, user.gender);
      chestVal = est.chest;
      waistVal = est.waist;
    }
  }

  // Primary measurement for ruler & display (Chest for tops/jackets, Waist for pants)
  const primaryUserVal = isPants ? (waistVal ?? 80) : (chestVal ?? 96);
  const secondaryUserVal = isPants ? (hipsVal ?? 95) : (waistVal ?? 80);

  // 2. Garment ease adjustment if chart is garment measurements
  const ease = brandChart.chartType === 'garment'
    ? getEaseAllowance(brandChart.category, brandChart.fit)
    : { chest: 0, waist: 0 };

  // 3. Weights for multi-dimensional scoring
  let w1 = isPants ? 0.6 : 0.7; // primary (waist for pants, chest for tops)
  let w2 = isPants ? 0.4 : 0.3; // secondary (hips for pants, waist for tops)

  if (!isPants && hasChest && !hasWaist) {
    w1 = 1.0;
    w2 = 0.0;
  } else if (isPants && hasWaist && !hasHips) {
    w1 = 1.0;
    w2 = 0.0;
  }

  // 4. Evaluate each size
  const evaluations: SizeEvaluation[] = brandChart.sizes.map((size, index) => {
    // Normalized ranges accounting for garment ease
    let chestMin = (size.chest ? size.chest[0] : (size.garmentChest ? size.garmentChest[0] - ease.chest : 80));
    let chestMax = (size.chest ? size.chest[1] : (size.garmentChest ? size.garmentChest[1] - ease.chest : 88));
    let waistMin = size.waist ? size.waist[0] : 70;
    let waistMax = size.waist ? size.waist[1] : 78;
    let hipsMin = size.hips ? size.hips[0] : 85;
    let hipsMax = size.hips ? size.hips[1] : 95;

    let dPrimary = 0;
    let dSecondary = 0;
    let relativePosition: 'tight' | 'ideal' | 'roomy' = 'ideal';

    if (isPants) {
      if (primaryUserVal < waistMin) {
        dPrimary = waistMin - primaryUserVal;
        relativePosition = 'roomy';
      } else if (primaryUserVal > waistMax) {
        dPrimary = primaryUserVal - waistMax;
        relativePosition = 'tight';
      }

      if (secondaryUserVal < hipsMin) {
        dSecondary = hipsMin - secondaryUserVal;
      } else if (secondaryUserVal > hipsMax) {
        dSecondary = secondaryUserVal - hipsMax;
      }
    } else {
      if (primaryUserVal < chestMin) {
        dPrimary = chestMin - primaryUserVal;
        relativePosition = 'roomy';
      } else if (primaryUserVal > chestMax) {
        dPrimary = primaryUserVal - chestMax;
        relativePosition = 'tight';
      }

      if (secondaryUserVal < waistMin) {
        dSecondary = waistMin - secondaryUserVal;
      } else if (secondaryUserVal > waistMax) {
        dSecondary = secondaryUserVal - waistMax;
      }
    }

    const score = Math.round((dPrimary * w1 + dSecondary * w2) * 10) / 10;
    const isInside = dPrimary === 0 && dSecondary === 0;

    return {
      size,
      sizeIndex: index,
      score,
      chestDist: isPants ? 0 : dPrimary,
      waistDist: isPants ? dPrimary : dSecondary,
      hipsDist: isPants ? dSecondary : 0,
      isInside,
      relativePosition,
    };
  });

  // 5. Find candidate best size indices
  let sortedByScore = [...evaluations].sort((a, b) => a.score - b.score);
  let bestEval = sortedByScore[0];
  let primaryIndex = bestEval.sizeIndex;
  let secondaryIndex: number | undefined = undefined;
  let isBetweenSizes = false;

  // Check adjacent size for "Between sizes"
  // "Between sizes" occurs when user falls between two adjacent sizes (neither is a solid inside match,
  // or user is in a gap where both adjacent sizes are within ~2 cm)
  if (brandChart.sizes.length > 1 && !bestEval.isInside) {
    const smallerIdx = primaryIndex > 0 ? primaryIndex - 1 : undefined;
    const largerIdx = primaryIndex < brandChart.sizes.length - 1 ? primaryIndex + 1 : undefined;

    const currentSize = brandChart.sizes[primaryIndex];
    const currentPrimaryRange = isPants ? currentSize.waist! : (currentSize.chest ?? [80, 88]);

    // Check gap / boundary with smaller size
    if (smallerIdx !== undefined) {
      const smallerSize = brandChart.sizes[smallerIdx];
      const smallerRange = isPants ? smallerSize.waist! : (smallerSize.chest ?? [70, 78]);

      // If user is between smallerMax and currentMin, and both are within 2.5cm
      if (primaryUserVal >= smallerRange[1] - 0.5 && primaryUserVal <= currentPrimaryRange[0] + 0.5) {
        if (evaluations[smallerIdx].score <= 2.5 && evaluations[primaryIndex].score <= 2.5) {
          isBetweenSizes = true;
          secondaryIndex = smallerIdx;
        }
      }
    }

    // Check gap / boundary with larger size
    if (!isBetweenSizes && largerIdx !== undefined) {
      const largerSize = brandChart.sizes[largerIdx];
      const largerRange = isPants ? largerSize.waist! : (largerSize.chest ?? [90, 98]);

      if (primaryUserVal >= currentPrimaryRange[1] - 0.5 && primaryUserVal <= largerRange[0] + 0.5) {
        if (evaluations[largerIdx].score <= 2.5 && evaluations[primaryIndex].score <= 2.5) {
          isBetweenSizes = true;
          secondaryIndex = largerIdx;
        }
      }
    }
  }

  // 6. Apply Fit Preference Leaning
  if (isBetweenSizes && secondaryIndex !== undefined) {
    const idxA = Math.min(primaryIndex, secondaryIndex);
    const idxB = Math.max(primaryIndex, secondaryIndex);
    
    if (user.fitPreference === 'snug') {
      primaryIndex = idxA;
      secondaryIndex = idxB;
    } else if (user.fitPreference === 'loose') {
      primaryIndex = idxB;
      secondaryIndex = idxA;
    }
  } else if (!bestEval.isInside && user.fitPreference !== 'regular') {
    // Single size leaning if within 2cm of edge
    if (user.fitPreference === 'snug' && bestEval.relativePosition === 'roomy' && primaryIndex > 0) {
      if (evaluations[primaryIndex - 1].score <= bestEval.score + 2.0) {
        primaryIndex = primaryIndex - 1;
      }
    } else if (user.fitPreference === 'loose' && bestEval.relativePosition === 'tight' && primaryIndex < brandChart.sizes.length - 1) {
      if (evaluations[primaryIndex + 1].score <= bestEval.score + 2.0) {
        primaryIndex = primaryIndex + 1;
      }
    }
  }

  // 7. Match Status Classification
  let matchStatus: MatchStatus = 'great';
  const effectiveScore = evaluations[primaryIndex].score;

  if (effectiveScore > 4.0) {
    matchStatus = 'poor';
  } else if (isBetweenSizes) {
    matchStatus = 'between';
  } else if (effectiveScore <= 1.0 || evaluations[primaryIndex].isInside) {
    matchStatus = 'great';
  } else if (effectiveScore <= 2.5) {
    matchStatus = 'great'; // close enough
  } else {
    matchStatus = 'poor';
  }

  // 8. Construct Labels, Verdicts, & Tips
  const primarySize = brandChart.sizes[primaryIndex];
  let recommendedSize = primarySize.label;

  if (matchStatus === 'between' && secondaryIndex !== undefined) {
    const s1 = brandChart.sizes[Math.min(primaryIndex, secondaryIndex)].label;
    const s2 = brandChart.sizes[Math.max(primaryIndex, secondaryIndex)].label;
    recommendedSize = `${s1}/${s2}`;
  }

  let tip = '';
  let verdict = '';
  const smallerLabel = primaryIndex > 0 ? brandChart.sizes[primaryIndex - 1].label : null;
  const largerLabel = primaryIndex < brandChart.sizes.length - 1 ? brandChart.sizes[primaryIndex + 1].label : null;

  if (matchStatus === 'great') {
    if (brandChart.fit === 'slim') {
      tip = 'Runs slim. Size up if between sizes.';
    } else if (brandChart.fit === 'relaxed') {
      tip = 'Runs relaxed. True to size with a looser drape.';
    } else {
      tip = `True to size. Take ${primarySize.label} for a regular fit.`;
    }
    verdict = smallerLabel
      ? `Take ${primarySize.label}. ${smallerLabel} fits tighter.`
      : largerLabel
      ? `Take ${primarySize.label}. ${largerLabel} fits looser.`
      : `Take ${primarySize.label}. Ideal fit for your body.`;
  } else if (matchStatus === 'between') {
    const sMin = brandChart.sizes[Math.min(primaryIndex, secondaryIndex ?? primaryIndex)].label;
    const sMax = brandChart.sizes[Math.max(primaryIndex, secondaryIndex ?? primaryIndex)].label;
    tip = `Take ${sMax} for regular, ${sMin} for snug.`;
    verdict = `Between ${sMin} and ${sMax}. Choose based on drape.`;
  } else {
    const diff = Math.round(effectiveScore);
    const direction = evaluations[primaryIndex].relativePosition === 'roomy' ? 'roomier' : 'tighter';
    tip = `Nearest size is ${diff} cm ${direction} than you.`;
    verdict = `No size is close. Try another brand or fit.`;
  }

  // Primary and secondary ranges for text
  const primaryRange = isPants ? (primarySize.waist ?? [70, 78]) : (primarySize.chest ?? [88, 95]);
  const waistRange = primarySize.waist ?? [70, 78];

  let chestRangeText = '';
  if (isPants) {
    chestRangeText = `Waist ${formatRange(primaryRange[0], primaryRange[1], user.unit)}`;
  } else if (matchStatus === 'between' && secondaryIndex !== undefined) {
    const sA = brandChart.sizes[Math.min(primaryIndex, secondaryIndex)];
    const sB = brandChart.sizes[Math.max(primaryIndex, secondaryIndex)];
    const rA = sA.chest ?? [80, 88];
    const rB = sB.chest ?? [89, 96];
    chestRangeText = `Chest ${sA.label} ${formatRange(rA[0], rA[1], user.unit)} · ${sB.label} ${formatRange(rB[0], rB[1], user.unit)}`;
  } else {
    chestRangeText = `Chest ${formatRange(primaryRange[0], primaryRange[1], user.unit)}`;
  }

  const waistRangeText = `Waist ${formatRange(waistRange[0], waistRange[1], user.unit)}`;

  // 9. Ruler Visualization Math
  // Domain scale covers all sizes with padding
  const allRanges = brandChart.sizes.map(s => isPants ? (s.waist ?? [70, 80]) : (s.chest ?? [80, 90]));
  const globalMin = Math.min(...allRanges.map(r => r[0]), primaryUserVal) - 6;
  const globalMax = Math.max(...allRanges.map(r => r[1]), primaryUserVal) + 6;
  const scaleSpan = Math.max(globalMax - globalMin, 1);

  const userDotPercent = Math.min(Math.max(((primaryUserVal - globalMin) / scaleSpan) * 100, 4), 96);
  const primaryBarLeftPercent = Math.min(Math.max(((primaryRange[0] - globalMin) / scaleSpan) * 100, 2), 94);
  const primaryBarWidthPercent = Math.min(Math.max(((primaryRange[1] - primaryRange[0]) / scaleSpan) * 100, 5), 90);

  let barColor = '#34C759'; // green
  if (matchStatus === 'between') {
    barColor = '#FBBF24'; // amber
  } else if (matchStatus === 'poor') {
    barColor = '#F87171'; // red
  }

  let secondaryBarLeftPercent: number | undefined = undefined;
  let secondaryBarWidthPercent: number | undefined = undefined;
  let secondaryBarColor: string | undefined = undefined;

  if (matchStatus === 'between' && secondaryIndex !== undefined) {
    const secSize = brandChart.sizes[secondaryIndex];
    const secRange = isPants ? (secSize.waist ?? [70, 78]) : (secSize.chest ?? [80, 88]);
    secondaryBarLeftPercent = Math.min(Math.max(((secRange[0] - globalMin) / scaleSpan) * 100, 2), 94);
    secondaryBarWidthPercent = Math.min(Math.max(((secRange[1] - secRange[0]) / scaleSpan) * 100, 5), 90);
    secondaryBarColor = '#FBBF24';
  }

  return {
    brandChart,
    recommendedSize,
    primarySizeIndex: primaryIndex,
    secondarySizeIndex: secondaryIndex,
    matchStatus,
    confidence,
    confidenceReason,
    verdict,
    tip,
    chestRangeText,
    waistRangeText,
    overallScore: effectiveScore,
    sizeEvaluations: evaluations,
    ruler: {
      minScale: globalMin,
      maxScale: globalMax,
      userDotPercent: Math.round(userDotPercent * 10) / 10,
      primaryBarLeftPercent: Math.round(primaryBarLeftPercent * 10) / 10,
      primaryBarWidthPercent: Math.round(primaryBarWidthPercent * 10) / 10,
      primaryBarColor: barColor,
      secondaryBarLeftPercent: secondaryBarLeftPercent !== undefined ? Math.round(secondaryBarLeftPercent * 10) / 10 : undefined,
      secondaryBarWidthPercent: secondaryBarWidthPercent !== undefined ? Math.round(secondaryBarWidthPercent * 10) / 10 : undefined,
      secondaryBarColor,
    },
  };
}

/**
 * Matches all available brands against user measurements and applies filters/sorting.
 */
export function matchAllBrands(
  brands: BrandChart[],
  user: UserMeasurements,
  searchQuery: string = '',
  regionFilter: 'all' | 'global' | 'local' = 'all',
  sortBy: 'match' | 'brand-asc' | 'size' = 'match'
): BrandMatchResult[] {
  // 1. Filter by category and gender
  const categoryFiltered = brands.filter(b => {
    if (b.category !== user.category) return false;
    if (b.gender === user.gender) return true;
    if (b.gender === 'unisex' || user.gender === 'unisex') return true;
    return false;
  });

  // 2. Compute matches
  let results = categoryFiltered.map(chart => matchBrand(chart, user));

  // 3. Search query filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    results = results.filter(r => r.brandChart.brand.toLowerCase().includes(q));
  }

  // 4. Region filter
  if (regionFilter !== 'all') {
    results = results.filter(r => r.brandChart.region === regionFilter);
  }

  // 5. Sorting
  results.sort((a, b) => {
    if (sortBy === 'brand-asc') {
      return a.brandChart.brand.localeCompare(b.brandChart.brand);
    }
    if (sortBy === 'size') {
      return a.recommendedSize.localeCompare(b.recommendedSize);
    }
    // Best match: matchStatus priority (great < between < poor), then overallScore asc
    const statusPriority = { great: 1, between: 2, poor: 3 };
    if (statusPriority[a.matchStatus] !== statusPriority[b.matchStatus]) {
      return statusPriority[a.matchStatus] - statusPriority[b.matchStatus];
    }
    return a.overallScore - b.overallScore;
  });

  return results;
}
