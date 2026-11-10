/** Parses "1-3, 5" into sorted zero-based page indexes. Returns null if it isn't valid. */
export function parseRange(text, total) {
  const out = new Set();
  for (const part of text.split(',')) {
    const m = /^\s*(\d+)\s*(?:-\s*(\d+)\s*)?$/.exec(part);
    if (!m) return null;
    const from = Number(m[1]);
    const to = m[2] ? Number(m[2]) : from;
    if (from < 1 || to > total || from > to) return null;
    for (let i = from; i <= to; i++) out.add(i - 1);
  }
  return out.size ? [...out].sort((a, b) => a - b) : null;
}
