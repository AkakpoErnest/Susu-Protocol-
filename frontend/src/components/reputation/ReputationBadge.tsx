'use client';

import { cn, getReputationTier, TIER_COLORS, TIER_BG } from '@/lib/utils';
import { Shield, Star, Award, Trophy } from 'lucide-react';

interface ReputationBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

const TIER_ICONS = {
  NEWCOMER: Shield,
  TRUSTED: Star,
  VETERAN: Award,
  CHAMPION: Trophy,
};

export function ReputationBadge({ score, size = 'md', showScore = true }: ReputationBadgeProps) {
  const tier = getReputationTier(score);
  const Icon = TIER_ICONS[tier];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  };

  const iconSize = { sm: 12, md: 14, lg: 16 }[size];

  return (
    <span
      className={cn(
        'badge font-semibold',
        TIER_COLORS[tier],
        TIER_BG[tier],
        sizeClasses[size]
      )}
    >
      <Icon size={iconSize} />
      {tier}
      {showScore && <span className="opacity-70">· {score}</span>}
    </span>
  );
}
