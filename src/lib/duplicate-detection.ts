// Levenshtein distance for fuzzy pattern name matching

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

export interface DuplicateCandidate {
  id: string;
  name: string;
  designer: string | null;
  cover_photo_url: string | null;
  similarity: number;
}

export function findDuplicates(
  newName: string,
  newDesigner: string | null,
  existingPatterns: Array<{ id: string; name: string; designer: string | null; cover_photo_url: string | null }>
): DuplicateCandidate[] {
  const normalizedNew = newName.toLowerCase().trim();

  return existingPatterns
    .map((p) => {
      const normalizedExisting = p.name.toLowerCase().trim();
      const nameSim = similarity(normalizedNew, normalizedExisting);

      // Boost score if designer also matches
      let score = nameSim;
      if (newDesigner && p.designer) {
        const designerSim = similarity(
          newDesigner.toLowerCase().trim(),
          p.designer.toLowerCase().trim()
        );
        score = nameSim * 0.7 + designerSim * 0.3;
      }

      return { ...p, similarity: score };
    })
    .filter((p) => p.similarity >= 0.8)
    .sort((a, b) => b.similarity - a.similarity);
}
