import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ConfidenceTier, DEFAULT_MATCHING_THRESHOLDS } from '../types/findit';

interface MatchScoreBadgeProps {
  score: number;
  tier?: ConfidenceTier;
}

export function MatchScoreDisplay({ score, tier }: MatchScoreBadgeProps) {
  const resolvedTier: ConfidenceTier =
    tier ||
    (score >= DEFAULT_MATCHING_THRESHOLDS.highMin
      ? 'high'
      : score >= DEFAULT_MATCHING_THRESHOLDS.potentialMin
      ? 'potential'
      : 'low');

  const label =
    resolvedTier === 'high'
      ? 'High-confidence match'
      : resolvedTier === 'potential'
      ? 'Potential match'
      : 'Lower-confidence suggestion';

  const toneClass =
    resolvedTier === 'high'
      ? 'text-emerald-700 border-emerald-200 bg-emerald-50/70'
      : resolvedTier === 'potential'
      ? 'text-sky-700 border-sky-200 bg-sky-50/70'
      : 'text-amber-700 border-amber-200 bg-amber-50/70';

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-medium ${toneClass}`}>
      {resolvedTier === 'high' ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      )}
      <span className="font-mono-tech font-semibold">{score}%</span>
      <span aria-hidden="true">·</span>
      <span className="whitespace-nowrap">{label}</span>
    </div>
  );
}
