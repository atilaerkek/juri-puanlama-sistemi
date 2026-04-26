// ─── Routes ───────────────────────────────────────────────────────────────────
export const ROUTE_PATHS = {
  HOME: '/',
  JUROR: '/juror',
  ADMIN: '/admin',
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AuthState {
  type: 'juror' | 'admin' | null;
  juror: {
    id: string;
    name: string;
    max_score: number;
    group_name: string;
  } | null;
}

export interface ScoreEntry {
  id: string;
  juror_id: string;
  juror_name: string;
  artwork_number: number;
  score: number;
  max_score: number;
  normalized: number;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface ArtworkResult {
  artwork_number: number;
  scores: ScoreEntry[];
  final_score: number;
  scored_count: number;
  rank: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
export const TOTAL_ARTWORKS = 50;
export const JUROR_COUNT = 6;

export const ARTWORKS = Array.from({ length: TOTAL_ARTWORKS }, (_, i) => i + 1);

// Normalize score to 0-100 scale
export function normalizeScore(score: number, maxScore: number): number {
  if (maxScore === 0) return 0;
  return (score / maxScore) * 100;
}

// Compute final score as average of normalized scores
export function computeFinalScore(scores: { score: number; max_score: number }[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((acc, s) => acc + normalizeScore(s.score, s.max_score), 0);
  return sum / scores.length;
}

export function formatScore(val: number, decimals = 2): string {
  return val.toFixed(decimals);
}

export function getRankBadge(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `${rank}.`;
}
