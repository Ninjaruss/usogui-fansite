/**
 * Returns the keys from `update` where the value differs from `before`.
 * - Primitives compared with `===`
 * - Arrays and objects compared with `JSON.stringify`
 * - Keys with `undefined` value in `update` are skipped
 */
export function diffFields<T extends object>(
  before: T,
  update: Partial<T>,
): string[] {
  const changed: string[] = [];
  for (const key of Object.keys(update)) {
    const val = (update as any)[key];
    if (val === undefined) continue;
    const oldVal = (before as any)[key];
    if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
      if (JSON.stringify(oldVal) !== JSON.stringify(val)) changed.push(key);
    } else if (oldVal !== val) {
      changed.push(key);
    }
  }
  return changed;
}
