// Units. The app stores centimeters internally and can DISPLAY either US
// customary (feet/inches) or metric (m/cm). The active system is a module-level
// preference so every formatter/parser switches together via one toggle.
export const CM_PER_IN = 2.54;

export const cmToIn = cm => cm / CM_PER_IN;
export const inToCm = inches => inches * CM_PER_IN;

// ---- active unit system --------------------------------------------------
let SYSTEM = 'imperial';           // 'imperial' | 'metric'
const listeners = new Set();
export function unitSystem() { return SYSTEM; }
export function setUnitSystem(s) {
  const next = s === 'metric' ? 'metric' : 'imperial';
  if (next === SYSTEM) return;
  SYSTEM = next;
  for (const fn of listeners) fn(SYSTEM);
}
export function onUnitChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

// ---- imperial helpers ----------------------------------------------------
/** 285cm → 9'4"  ·  76cm → 30"  ·  183cm → 6' */
export function fmtFtIn(cm) {
  const totalIn = Math.round(cmToIn(cm));
  const ft = Math.floor(totalIn / 12);
  const inch = totalIn % 12;
  if (ft === 0) return `${inch}"`;
  if (inch === 0) return `${ft}'`;
  return `${ft}'${inch}"`;
}

/** Inches with half-inch precision, for numeric input display. */
export function inValue(cm) {
  return Math.round(cmToIn(cm) * 2) / 2;
}

// ---- metric helpers ------------------------------------------------------
/** 285cm → "2.85 m" · 76cm → "76 cm" · 8cm → "8 cm" */
export function fmtMetric(cm) {
  const v = Math.round(cm);
  if (Math.abs(v) >= 100) return `${(v / 100).toFixed(2).replace(/\.?0+$/, '')} m`;
  return `${v} cm`;
}

// ---- system-aware public API (use these for anything user-facing) --------
/** Format a length in the active unit system. */
export function fmtLen(cm) {
  return SYSTEM === 'metric' ? fmtMetric(cm) : fmtFtIn(cm);
}

/** cm² → "312.4 sq ft" or "29.0 m²" */
export function fmtArea(cm2) {
  if (SYSTEM === 'metric') return `${(cm2 / 10000).toFixed(1)} m²`;
  return `${(cm2 / 929.0304).toFixed(1)} sq ft`;
}

/** A short unit hint for input fields, e.g. `9'4"` vs `2.85 m`. */
export function unitPlaceholder() {
  return SYSTEM === 'metric' ? 'e.g. 2.85 m or 76 cm' : `e.g. 9'4" or 30"`;
}

/** Radians → "0°"..."359°" (whole degrees, normalised to [0,360)). */
export function fmtAngle(rad) {
  let deg = Math.round(rad * 180 / Math.PI) % 360;
  if (deg < 0) deg += 360;
  return `${deg}°`;
}

// ---- parsing -------------------------------------------------------------
/**
 * Parse a typed length into cm. Accepts what fmtFtIn prints and what people
 * naturally type:  9'4"  ·  9' 4  ·  9.5'  ·  30"  ·  30in  ·  9.5 (feet).
 * A bare number means feet; a trailing " or "in" means inches.
 */
export function parseFtIn(input) {
  const s = String(input).trim()
    .replace(/[“”″]/g, '"')
    .replace(/[‘’′]/g, "'")
    .replace(/\s*(ft|feet)\s*$/i, "'")
    .toLowerCase();
  if (!s) return NaN;
  const m = s.match(/^(?:(\d+(?:\.\d+)?)\s*')?\s*(?:(\d+(?:\.\d+)?)\s*(?:"|in)?)?$/);
  if (!m || (m[1] === undefined && m[2] === undefined)) return NaN;
  if (m[1] === undefined && !/["]|in/.test(s)) {
    return parseFloat(m[2]) * 12 * CM_PER_IN; // bare number = feet
  }
  const ft = parseFloat(m[1] || '0');
  const inch = parseFloat(m[2] || '0');
  return (ft * 12 + inch) * CM_PER_IN;
}

/** Parse a metric length into cm:  2.85m · 76cm · 2850mm · 2.85 (bare = m). */
export function parseMetric(input) {
  const s = String(input).trim().toLowerCase().replace(/\s+/g, '');
  if (!s) return NaN;
  let m;
  if ((m = s.match(/^(-?\d+(?:\.\d+)?)mm$/))) return parseFloat(m[1]) / 10;
  if ((m = s.match(/^(-?\d+(?:\.\d+)?)cm$/))) return parseFloat(m[1]);
  if ((m = s.match(/^(-?\d+(?:\.\d+)?)m$/))) return parseFloat(m[1]) * 100;
  if ((m = s.match(/^(-?\d+(?:\.\d+)?)$/))) return parseFloat(m[1]) * 100; // bare = metres
  return NaN;
}

/** Parse a length in the active unit system (falls back to the other system so
 *  a user who types 30" while in metric still gets what they meant). */
export function parseLen(input) {
  const primary = SYSTEM === 'metric' ? parseMetric(input) : parseFtIn(input);
  if (Number.isFinite(primary)) return primary;
  const other = SYSTEM === 'metric' ? parseFtIn(input) : parseMetric(input);
  return Number.isFinite(other) ? other : NaN;
}

/** Parse an angle in degrees → radians (bare number = degrees). */
export function parseAngle(input) {
  const s = String(input).trim().replace(/[°\s]/g, '');
  const v = parseFloat(s);
  return Number.isFinite(v) ? v * Math.PI / 180 : NaN;
}
