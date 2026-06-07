// CSV separator — Ukrainian/European Excel uses ";" as the list separator
const SEP = ';'

// ── Windows-1251 (CP1251) encoder ───────────────────────────────────────────
// CP1251 is the native encoding on Ukrainian/Russian Windows.
// Excel opens .csv files using the system default encoding (no BOM detection
// for CSV), so encoding in CP1251 is the only reliable way to get correct
// Cyrillic text without the user having to change any settings.

const UNICODE_TO_CP1251: Record<number, number> = {
  // Ukrainian-specific characters
  0x0404: 0xaa, // Є
  0x0406: 0xb2, // І
  0x0407: 0xaf, // Ї
  0x0490: 0xa5, // Ґ
  0x0454: 0xba, // є
  0x0456: 0xb3, // і
  0x0457: 0xbf, // ї
  0x0491: 0xb4, // ґ
  // Russian Ё
  0x0401: 0xa8, // Ё
  0x0451: 0xb8, // ё
  // Punctuation commonly found in project/team names
  0x2014: 0x97, // — em dash
  0x2013: 0x96, // – en dash
  0x2018: 0x91, // ' left single quote
  0x2019: 0x92, // ' right single quote
  0x201c: 0x93, // " left double quote
  0x201d: 0x94, // " right double quote
  0x2026: 0x85, // … ellipsis
  0x20ac: 0x88, // € euro sign
  0x00a0: 0xa0, // NBSP
  0x00ab: 0xab, // «
  0x00bb: 0xbb, // »
}

function encodeCP1251(str: string): Uint8Array {
  const out = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    if (code < 0x80) {
      // ASCII — identical in CP1251
      out[i] = code
    } else if (code >= 0x0410 && code <= 0x042f) {
      // Cyrillic uppercase А–Я → 0xC0–0xDF
      out[i] = code - 0x0410 + 0xc0
    } else if (code >= 0x0430 && code <= 0x044f) {
      // Cyrillic lowercase а–я → 0xE0–0xFF
      out[i] = code - 0x0430 + 0xe0
    } else {
      // Lookup table for everything else; '?' for unmapped chars
      out[i] = UNICODE_TO_CP1251[code] ?? 0x3f
    }
  }
  return out
}

// ── Cell escaping ────────────────────────────────────────────────────────────

/**
 * Escape a cell value for CSV:
 * - Numbers are kept unquoted so Excel treats them as numeric values.
 * - All text is wrapped in double-quotes; internal " are doubled ("").
 */
function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '""'
  if (typeof value === 'number') return String(value)
  const str = String(value)
  return `"${str.replace(/"/g, '""')}"`
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Build and trigger a CSV download encoded in Windows-1251.
 *
 * @param filename  - output filename (e.g. "results.csv")
 * @param headers   - column header labels
 * @param rows      - 2-D array of cell values; each inner array is one row
 */
export function downloadCSV(filename: string, headers: string[], rows: unknown[][]): void {
  const lines = [
    // "sep=;" tells Excel which delimiter to use on any locale
    `sep=${SEP}`,
    headers.map(escapeCell).join(SEP),
    ...rows.map(row => row.map(escapeCell).join(SEP)),
  ]

  // Encode as CP1251 — Excel opens .csv with the system encoding (CP1251 on
  // Ukrainian Windows), so raw CP1251 bytes are displayed correctly without
  // any BOM or charset tricks.
  const bytes = encodeCP1251(lines.join('\r\n'))
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Convenience wrapper: accepts an array of plain objects and
 * uses the keys of the first object as column headers.
 */
export function exportToCSV(filename: string, rows: Record<string, unknown>[]): void {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const data = rows.map(row => headers.map(h => row[h] ?? ''))
  downloadCSV(filename, headers, data)
}
