// ============================================================
// Bitfield utilities for marked cells
// Each cell is 1 bit. For a 200x200 grid (40,000 cells)
// this uses ~5KB instead of ~400KB for a JSON array.
// ============================================================

/** Create an empty bitfield string for rows * cols cells */
export function createBitfield(rows: number, cols: number): string {
  const totalBits = rows * cols;
  const totalChars = Math.ceil(totalBits / 4);
  return "0".repeat(totalChars);
}

/** Check if a cell is marked */
export function isMarked(bitfield: string, row: number, col: number, cols: number): boolean {
  const idx = row * cols + col;
  const charIdx = Math.floor(idx / 4);
  const bitIdx = idx % 4;
  if (charIdx >= bitfield.length) return false;
  const nibble = parseInt(bitfield[charIdx], 16);
  return ((nibble >> (3 - bitIdx)) & 1) === 1;
}

/** Toggle a cell and return the new bitfield */
export function toggleCell(bitfield: string, row: number, col: number, cols: number, force?: boolean): string {
  const idx = row * cols + col;
  const charIdx = Math.floor(idx / 4);
  const bitIdx = idx % 4;

  // Ensure bitfield is long enough
  let bf = bitfield;
  while (charIdx >= bf.length) bf += "0";

  const nibble = parseInt(bf[charIdx], 16);
  const mask = 1 << (3 - bitIdx);
  const currentlySet = (nibble & mask) !== 0;
  const shouldSet = force !== undefined ? force : !currentlySet;

  let newNibble: number;
  if (shouldSet) {
    newNibble = nibble | mask;
  } else {
    newNibble = nibble & ~mask;
  }

  return bf.substring(0, charIdx) + newNibble.toString(16) + bf.substring(charIdx + 1);
}

/** Count the number of marked cells */
export function countMarked(bitfield: string): number {
  let count = 0;
  for (let i = 0; i < bitfield.length; i++) {
    const nibble = parseInt(bitfield[i], 16);
    // Count bits in nibble
    count += ((nibble >> 3) & 1) + ((nibble >> 2) & 1) + ((nibble >> 1) & 1) + (nibble & 1);
  }
  return count;
}

/** Mark a rectangular area */
export function markArea(
  bitfield: string,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  cols: number,
  mark: boolean
): string {
  let bf = bitfield;
  const r1 = Math.min(startRow, endRow);
  const r2 = Math.max(startRow, endRow);
  const c1 = Math.min(startCol, endCol);
  const c2 = Math.max(startCol, endCol);
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      bf = toggleCell(bf, r, c, cols, mark);
    }
  }
  return bf;
}
