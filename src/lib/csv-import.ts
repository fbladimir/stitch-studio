// ============================================================
// CSV Import — Parse PatternKeeper, R-XP, and Saga exports
// ============================================================

import Papa from "papaparse";
import type { ThreadInventoryItem, Pattern } from "@/types";

// ── Types ────────────────────────────────────────────────────

export type ImportApp = "patternkeeper" | "rxp" | "saga";

export interface ImportedThread {
  manufacturer: string;
  color_number: string;
  color_name: string;
  quantity: number;
  /** Whether this thread already exists in the user's stash */
  duplicate: boolean;
  /** Whether the user wants to import this thread */
  selected: boolean;
}

export interface ImportedPattern {
  name: string;
  designer: string;
  company: string;
  size_inches: string;
  size_stitches: string;
  rec_thread_brand: string;
  rec_fabric: string;
  chart_type: string;
  notes: string;
  /** Whether this pattern already exists */
  duplicate: boolean;
  /** Whether the user wants to import this */
  selected: boolean;
}

export interface ParseResult<T> {
  items: T[];
  errors: string[];
  app: ImportApp;
}

// ── Column name normalization ────────────────────────────────

/** Normalize column headers to handle variations across apps */
function normalize(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

// ── Manufacturer mapping ─────────────────────────────────────

const MANUFACTURER_MAP: Record<string, string> = {
  dmc: "DMC",
  anchor: "Anchor",
  "weeks_dye_works": "Weeks Dye Works",
  wdw: "Weeks Dye Works",
  "gentle_art": "Gentle Arts",
  "gentle_arts": "Gentle Arts",
  "classic_colorworks": "Classic Colorworks",
  ccw: "Classic Colorworks",
  "simply_shaker": "Simply Shaker",
  cosmos: "Cosmos",
  sulky: "Sulky",
};

function resolveManufacturer(raw: string): string {
  if (!raw) return "DMC";
  const key = normalize(raw);
  return MANUFACTURER_MAP[key] ?? raw.trim();
}

// ── Thread CSV Parsing ───────────────────────────────────────

/**
 * Column mapping strategies for different apps:
 *
 * PatternKeeper CSV columns:
 *   Manufacturer, Color #, Color Name, Quantity
 *   OR: Brand, Number, Name, Qty
 *
 * R-XP CSV columns:
 *   Thread Brand, Thread Number, Thread Name, Skeins
 *   OR: Manufacturer, Color Code, Color Name, Qty
 *
 * Saga CSV columns:
 *   brand, number, name, quantity
 *   OR similar lowercase variants
 */

interface ColumnMap {
  manufacturer: string | null;
  colorNumber: string | null;
  colorName: string | null;
  quantity: string | null;
}

const MANUFACTURER_ALIASES = [
  "manufacturer", "brand", "thread_brand", "thread_manufacturer", "make", "mfr",
];
const COLOR_NUMBER_ALIASES = [
  "color_number", "color", "number", "color_code", "thread_number", "code",
  "colour_number", "colour", "no", "num", "dmc", "dmc_number",
];
const COLOR_NAME_ALIASES = [
  "color_name", "name", "thread_name", "colour_name", "description", "desc",
];
const QUANTITY_ALIASES = [
  "quantity", "qty", "skeins", "count", "amount", "number_of_skeins", "num_skeins",
];

function detectColumns(headers: string[]): ColumnMap {
  const normalized = headers.map(normalize);

  function findMatch(aliases: string[]): string | null {
    for (const alias of aliases) {
      const idx = normalized.indexOf(alias);
      if (idx !== -1) return headers[idx];
    }
    return null;
  }

  return {
    manufacturer: findMatch(MANUFACTURER_ALIASES),
    colorNumber: findMatch(COLOR_NUMBER_ALIASES),
    colorName: findMatch(COLOR_NAME_ALIASES),
    quantity: findMatch(QUANTITY_ALIASES),
  };
}

export function parseThreadCSV(
  csvText: string,
  app: ImportApp,
  existingThreads: Pick<ThreadInventoryItem, "manufacturer" | "color_number">[]
): ParseResult<ImportedThread> {
  const errors: string[] = [];

  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (result.errors.length > 0) {
    for (const e of result.errors.slice(0, 5)) {
      errors.push(`Row ${e.row ?? "?"}: ${e.message}`);
    }
  }

  if (!result.data || result.data.length === 0) {
    return { items: [], errors: ["No data rows found in the CSV file."], app };
  }

  const headers = result.meta.fields ?? [];
  const cols = detectColumns(headers);

  // If we can't find a color number column, this CSV doesn't look like thread data
  if (!cols.colorNumber) {
    return {
      items: [],
      errors: [
        `Could not detect a color number column. Found columns: ${headers.join(", ")}. ` +
        `Expected one of: Color #, Number, Color Code, etc.`,
      ],
      app,
    };
  }

  // Build lookup set for existing threads
  const existingSet = new Set(
    existingThreads.map((t) => `${t.manufacturer}::${t.color_number}`.toLowerCase())
  );

  const items: ImportedThread[] = [];

  for (const row of result.data) {
    const colorNumber = (cols.colorNumber ? row[cols.colorNumber] : "")?.trim();
    if (!colorNumber) continue; // Skip rows without a color number

    const manufacturer = resolveManufacturer(
      cols.manufacturer ? row[cols.manufacturer] ?? "" : "DMC"
    );
    const colorName = (cols.colorName ? row[cols.colorName] : "")?.trim() ?? "";
    const qtyRaw = cols.quantity ? row[cols.quantity] : "1";
    const quantity = Math.max(1, parseInt(qtyRaw ?? "1", 10) || 1);

    const isDuplicate = existingSet.has(`${manufacturer}::${colorNumber}`.toLowerCase());

    items.push({
      manufacturer,
      color_number: colorNumber,
      color_name: colorName,
      quantity,
      duplicate: isDuplicate,
      selected: !isDuplicate, // Auto-deselect duplicates
    });
  }

  return { items, errors, app };
}

// ── Pattern CSV Parsing ──────────────────────────────────────

interface PatternColumnMap {
  name: string | null;
  designer: string | null;
  company: string | null;
  sizeInches: string | null;
  sizeStitches: string | null;
  threadBrand: string | null;
  fabric: string | null;
  chartType: string | null;
  notes: string | null;
}

const PATTERN_NAME_ALIASES = ["name", "pattern_name", "pattern", "title", "chart_name", "chart"];
const DESIGNER_ALIASES = ["designer", "designer_name", "author", "designed_by"];
const COMPANY_ALIASES = ["company", "publisher", "brand", "manufacturer"];
const SIZE_INCHES_ALIASES = ["size_inches", "size_in", "design_size", "size", "dimensions"];
const SIZE_STITCHES_ALIASES = ["size_stitches", "stitch_count", "stitches", "stitch_size"];
const THREAD_BRAND_ALIASES = ["thread_brand", "rec_thread_brand", "thread", "thread_type"];
const FABRIC_ALIASES = ["fabric", "rec_fabric", "recommended_fabric", "fabric_type"];
const CHART_TYPE_ALIASES = ["chart_type", "type", "format"];
const NOTES_ALIASES = ["notes", "note", "comments", "comment", "description"];

function detectPatternColumns(headers: string[]): PatternColumnMap {
  const normalized = headers.map(normalize);

  function findMatch(aliases: string[]): string | null {
    for (const alias of aliases) {
      const idx = normalized.indexOf(alias);
      if (idx !== -1) return headers[idx];
    }
    return null;
  }

  return {
    name: findMatch(PATTERN_NAME_ALIASES),
    designer: findMatch(DESIGNER_ALIASES),
    company: findMatch(COMPANY_ALIASES),
    sizeInches: findMatch(SIZE_INCHES_ALIASES),
    sizeStitches: findMatch(SIZE_STITCHES_ALIASES),
    threadBrand: findMatch(THREAD_BRAND_ALIASES),
    fabric: findMatch(FABRIC_ALIASES),
    chartType: findMatch(CHART_TYPE_ALIASES),
    notes: findMatch(NOTES_ALIASES),
  };
}

export function parsePatternCSV(
  csvText: string,
  app: ImportApp,
  existingPatterns: Pick<Pattern, "name" | "designer">[]
): ParseResult<ImportedPattern> {
  const errors: string[] = [];

  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (result.errors.length > 0) {
    for (const e of result.errors.slice(0, 5)) {
      errors.push(`Row ${e.row ?? "?"}: ${e.message}`);
    }
  }

  if (!result.data || result.data.length === 0) {
    return { items: [], errors: ["No data rows found in the CSV file."], app };
  }

  const headers = result.meta.fields ?? [];
  const cols = detectPatternColumns(headers);

  if (!cols.name) {
    return {
      items: [],
      errors: [
        `Could not detect a pattern name column. Found columns: ${headers.join(", ")}. ` +
        `Expected one of: Name, Pattern Name, Title, etc.`,
      ],
      app,
    };
  }

  // Build lookup for existing patterns (name + designer, case-insensitive)
  const existingSet = new Set(
    existingPatterns.map(
      (p) => `${(p.name ?? "").toLowerCase()}::${(p.designer ?? "").toLowerCase()}`
    )
  );

  const items: ImportedPattern[] = [];

  for (const row of result.data) {
    const name = (cols.name ? row[cols.name] : "")?.trim();
    if (!name) continue;

    const designer = (cols.designer ? row[cols.designer] : "")?.trim() ?? "";
    const company = (cols.company ? row[cols.company] : "")?.trim() ?? "";
    const isDuplicate = existingSet.has(`${name.toLowerCase()}::${designer.toLowerCase()}`);

    items.push({
      name,
      designer,
      company,
      size_inches: (cols.sizeInches ? row[cols.sizeInches] : "")?.trim() ?? "",
      size_stitches: (cols.sizeStitches ? row[cols.sizeStitches] : "")?.trim() ?? "",
      rec_thread_brand: (cols.threadBrand ? row[cols.threadBrand] : "")?.trim() ?? "",
      rec_fabric: (cols.fabric ? row[cols.fabric] : "")?.trim() ?? "",
      chart_type: (cols.chartType ? row[cols.chartType] : "")?.trim() ?? "",
      notes: (cols.notes ? row[cols.notes] : "")?.trim() ?? "",
      duplicate: isDuplicate,
      selected: !isDuplicate,
    });
  }

  return { items, errors, app };
}

// ── App display names ────────────────────────────────────────

export const APP_NAMES: Record<ImportApp, string> = {
  patternkeeper: "PatternKeeper",
  rxp: "R-XP",
  saga: "Saga",
};

export const APP_ICONS: Record<ImportApp, string> = {
  patternkeeper: "📱",
  rxp: "🖥️",
  saga: "🌐",
};
