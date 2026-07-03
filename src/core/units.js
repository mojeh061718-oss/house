// Display units: the app stores centimeters internally but shows US
// customary units (feet/inches) everywhere.
export const CM_PER_IN = 2.54;

export const cmToIn = cm => cm / CM_PER_IN;
export const inToCm = inches => inches * CM_PER_IN;

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

/** cm² → "312.4 sq ft" */
export function fmtArea(cm2) {
  return `${(cm2 / 929.0304).toFixed(1)} sq ft`;
}

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
