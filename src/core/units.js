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
