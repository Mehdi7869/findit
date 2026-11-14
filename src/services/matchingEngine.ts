import {
  ConfidenceTier,
  DEFAULT_MATCHING_THRESHOLDS,
  ItemReport,
  MatchBreakdown,
  MatchingThresholds,
} from '../types/findit';

export interface MatchingWeights {
  category: number;
  name: number;
  keywords: number;
  description: number;
  location: number;
  date: number;
  characteristics: number;
}

export const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
  category: 0.22,
  name: 0.20,
  keywords: 0.15,
  description: 0.15,
  location: 0.13,
  date: 0.08,
  characteristics: 0.07,
};

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'was', 'were', 'are',
  'near', 'inside', 'lost', 'found', 'item', 'missing', 'around', 'have', 'has',
  'had', 'its', 'very', 'some', 'my', 'your', 'our', 'their', 'into', 'onto',
]);

// Campus zone adjacency graph for realistic location proximity scoring
const LOCATION_ZONES: Record<string, string[]> = {
  'Main Library': ['North Quad & Benches', 'Student Commons & Cafeteria', 'Lecture Hall Complex'],
  'Engineering & Tech Block': ['Science & Research Wing', 'Lecture Hall Complex', 'Campus Bus Stop / Parking'],
  'Science & Research Wing': ['Engineering & Tech Block', 'Main Library', 'North Quad & Benches'],
  'Student Commons & Cafeteria': ['Main Library', 'North Quad & Benches', 'Hostel / Residence Hall'],
  'Sports Complex & Gym': ['Hostel / Residence Hall', 'Campus Bus Stop / Parking'],
  'North Quad & Benches': ['Main Library', 'Science & Research Wing', 'Student Commons & Cafeteria'],
  'Lecture Hall Complex': ['Main Library', 'Engineering & Tech Block', 'Administration & Security Desk'],
  'Administration & Security Desk': ['Lecture Hall Complex', 'Campus Bus Stop / Parking', 'Main Library'],
  'Hostel / Residence Hall': ['Student Commons & Cafeteria', 'Sports Complex & Gym'],
  'Campus Bus Stop / Parking': ['Administration & Security Desk', 'Engineering & Tech Block', 'Sports Complex & Gym'],
};

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
}

export function extractKeywords(...parts: string[]): string[] {
  const seen = new Set<string>();
  for (const part of parts) {
    for (const token of tokenize(part)) {
      seen.add(token.slice(0, 40));
      if (seen.size >= 12) break;
    }
    if (seen.size >= 12) break;
  }
  return Array.from(seen).slice(0, 12);
}

function jaccardSimilarity(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersection++;
    } else {
      // Partial prefix match for closely related words (e.g. "bottle" vs "bottles")
      for (const b of setB) {
        if ((item.length >= 4 && b.startsWith(item)) || (b.length >= 4 && item.startsWith(b))) {
          intersection += 0.75;
          break;
        }
      }
    }
  }
  const union = setA.size + setB.size - intersection;
  return union > 0 ? Math.min(1, intersection / union) : 0;
}

function computeNameSimilarity(nameA: string, nameB: string): number {
  const a = nameA.trim().toLowerCase();
  const b = nameB.trim().toLowerCase();
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.9;
  const tokSim = jaccardSimilarity(tokenize(a), tokenize(b));
  return tokSim;
}

function computeLocationProximity(locA: string, locB: string): number {
  const a = locA.trim();
  const b = locB.trim();
  if (!a || !b) return 0;
  if (a.toLowerCase() === b.toLowerCase()) return 1.0;

  // Check zone adjacency
  for (const [zone, neighbors] of Object.entries(LOCATION_ZONES)) {
    const aMatchesZone = a.toLowerCase().includes(zone.toLowerCase()) || zone.toLowerCase().includes(a.toLowerCase());
    const bMatchesZone = b.toLowerCase().includes(zone.toLowerCase()) || zone.toLowerCase().includes(b.toLowerCase());
    if (aMatchesZone && bMatchesZone) return 0.92;
    if (aMatchesZone && neighbors.some((n) => b.toLowerCase().includes(n.toLowerCase()))) return 0.68;
    if (bMatchesZone && neighbors.some((n) => a.toLowerCase().includes(n.toLowerCase()))) return 0.68;
  }

  return jaccardSimilarity(tokenize(a), tokenize(b)) * 0.7;
}

function computeDateProximity(lostDate: string, foundDate: string): number {
  const t1 = Date.parse(lostDate);
  const t2 = Date.parse(foundDate);
  if (Number.isNaN(t1) || Number.isNaN(t2)) return 0.4;

  const diffDays = (t2 - t1) / (1000 * 60 * 60 * 24);
  // If found date is significantly before lost date (>2 days), unlikely match
  if (diffDays < -2) return 0.08;
  const absDays = Math.abs(diffDays);
  if (absDays <= 0.5) return 1.0;
  if (absDays <= 1.5) return 0.88;
  if (absDays <= 3.5) return 0.72;
  if (absDays <= 7.5) return 0.52;
  if (absDays <= 14) return 0.3;
  return 0.1;
}

export function classifyConfidenceTier(
  score: number,
  thresholds: MatchingThresholds = DEFAULT_MATCHING_THRESHOLDS
): ConfidenceTier {
  if (score >= thresholds.highMin) return 'high';
  if (score >= thresholds.potentialMin) return 'potential';
  return 'low';
}

export interface EvaluatedMatch {
  lostReport: ItemReport;
  foundReport: ItemReport;
  confidenceScore: number;
  confidenceTier: ConfidenceTier;
  breakdown: MatchBreakdown;
}

/**
 * Evaluates a Lost report against a Found report and produces a 0-100% confidence score
 * with detailed breakdown across all 7 weighted matching signals.
 */
export function evaluateReportPair(
  lostReport: ItemReport,
  foundReport: ItemReport,
  weights: MatchingWeights = DEFAULT_MATCHING_WEIGHTS,
  thresholds: MatchingThresholds = DEFAULT_MATCHING_THRESHOLDS
): EvaluatedMatch {
  const categoryScore = lostReport.category === foundReport.category ? 1 : 0;
  const nameScore = computeNameSimilarity(lostReport.itemName, foundReport.itemName);
  const keywordScore = jaccardSimilarity(lostReport.keywords, foundReport.keywords);
  const descriptionScore = jaccardSimilarity(
    tokenize(lostReport.description),
    tokenize(foundReport.description)
  );
  const locationScore = computeLocationProximity(lostReport.location, foundReport.location);
  const dateScore = computeDateProximity(lostReport.eventDate, foundReport.eventDate);

  const colorMatch =
    lostReport.color.trim().toLowerCase() === foundReport.color.trim().toLowerCase()
      ? 1
      : jaccardSimilarity(tokenize(lostReport.color), tokenize(foundReport.color));
  const charMatch = jaccardSimilarity(
    tokenize(lostReport.characteristics),
    tokenize(foundReport.characteristics)
  );
  const characteristicsScore = Math.min(1, colorMatch * 0.55 + charMatch * 0.45);

  const breakdown: MatchBreakdown = {
    category: Math.round(categoryScore * 100),
    name: Math.round(nameScore * 100),
    keywords: Math.round(keywordScore * 100),
    description: Math.round(descriptionScore * 100),
    location: Math.round(locationScore * 100),
    date: Math.round(dateScore * 100),
    characteristics: Math.round(characteristicsScore * 100),
  };

  const totalWeight =
    weights.category +
    weights.name +
    weights.keywords +
    weights.description +
    weights.location +
    weights.date +
    weights.characteristics;

  const weightedSum =
    categoryScore * weights.category +
    nameScore * weights.name +
    keywordScore * weights.keywords +
    descriptionScore * weights.description +
    locationScore * weights.location +
    dateScore * weights.date +
    characteristicsScore * weights.characteristics;

  const confidenceScore = Math.round((weightedSum / (totalWeight || 1)) * 100);
  const confidenceTier = classifyConfidenceTier(confidenceScore, thresholds);

  return {
    lostReport,
    foundReport,
    confidenceScore,
    confidenceTier,
    breakdown,
  };
}
