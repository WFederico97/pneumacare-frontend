/** Trims and collapses internal whitespace (mirrors the backend normalization). */
export function normalizeBedNumber(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

/** Case-insensitive duplicate check against existing bed numbers. */
export function isDuplicateBedNumber(candidate: string, existing: readonly string[]): boolean {
  const norm = normalizeBedNumber(candidate).toLowerCase();
  return existing.some((b) => normalizeBedNumber(b).toLowerCase() === norm);
}

/**
 * Suggests the next bed number from the existing ones by detecting a common
 * "prefix + trailing number" pattern (e.g. BED-004 → BED-005), preserving the
 * zero-padding width. Falls back to {@code BED-001} when nothing matches.
 */
export function suggestNextBedNumber(existing: readonly string[]): string {
  const pattern = /^(.*?)(\d+)\s*$/;
  const groups = new Map<string, { max: number; width: number; count: number }>();

  for (const name of existing) {
    const match = pattern.exec(normalizeBedNumber(name));
    if (!match) {
      continue;
    }
    const prefix = match[1];
    const num = parseInt(match[2], 10);
    const width = match[2].length;
    const group = groups.get(prefix);
    if (!group) {
      groups.set(prefix, { max: num, width, count: 1 });
    } else {
      group.count += 1;
      if (num >= group.max) {
        group.max = num;
        group.width = width;
      }
    }
  }

  if (groups.size === 0) {
    return 'BED-001';
  }

  // Prefer the most-used prefix; tie-break on the higher current max.
  let chosenPrefix = '';
  let chosen = { max: 0, width: 3, count: -1 };
  for (const [prefix, group] of groups) {
    if (group.count > chosen.count || (group.count === chosen.count && group.max > chosen.max)) {
      chosenPrefix = prefix;
      chosen = group;
    }
  }

  return chosenPrefix + String(chosen.max + 1).padStart(chosen.width, '0');
}
