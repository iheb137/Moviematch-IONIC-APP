import { Match, UserProfile } from './models';

export const MATCH_THRESHOLD = 75;

/** Indice de Jaccard : |A ∩ B| / |A ∪ B| × 100 */
export function similarity(a: string[], b: string[]): number {
  const A = new Set(a);
  const B = new Set(b);
  const union = new Set([...A, ...B]).size;
  if (union === 0) return 0;
  const inter = [...A].filter(x => B.has(x)).length;
  return (inter / union) * 100;
}

/** Utilisateurs actifs dont la correspondance dépasse strictement le seuil. */
export function computeMatches(me: UserProfile, users: UserProfile[], threshold = MATCH_THRESHOLD): Match[] {
  const mine = me.favorites ?? [];
  return users
    .filter(u => u.id !== me.id && u.active)
    .map(u => {
      const theirs = u.favorites ?? [];
      return {
        user: u,
        score: Math.round(similarity(mine, theirs) * 10) / 10,
        common: mine.filter(id => theirs.includes(id)),
      };
    })
    .filter(m => m.score > threshold)
    .sort((x, y) => y.score - x.score);
}
