// Landscape-first orientation handling.
//
// On installed Android PWAs the manifest locks landscape. Browsers and iOS
// cannot be locked, so when a touch device is held in portrait we render the
// whole app rotated 90° into landscape — users naturally turn the phone.
// All pointer math must then go through the helpers below instead of
// getBoundingClientRect().

let rotated = false;
const listeners = new Set();

function isTouchDevice() {
  return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 1;
}

function evaluate() {
  const portrait = window.innerHeight > window.innerWidth;
  // covers iPhones and all iPads (12.9" iPad Pro portrait width is 1024pt)
  const should = portrait && isTouchDevice() && Math.min(window.innerWidth, window.innerHeight) <= 1030;
  if (should !== rotated) {
    rotated = should;
    document.documentElement.classList.toggle('force-landscape', rotated);
    for (const fn of listeners) fn(rotated);
  }
}

export function initOrientation() {
  evaluate();
  window.addEventListener('resize', evaluate);
  window.addEventListener('orientationchange', () => setTimeout(evaluate, 60));
}

export function isRotated() {
  return rotated;
}

export function onRotationChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Map viewport client coords into the app's (possibly rotated) layout space. */
export function clientToApp(clientX, clientY) {
  if (!rotated) return { x: clientX, y: clientY };
  // app is rotated 90° clockwise: local x runs down the physical screen,
  // local y runs from physical right to left.
  return { x: clientY, y: window.innerWidth - clientX };
}

/** Pointer-event position local to an element, rotation-aware. */
export function localPos(e, el) {
  const p = clientToApp(e.clientX, e.clientY);
  let ox = 0, oy = 0, n = el;
  while (n) {
    ox += n.offsetLeft;
    oy += n.offsetTop;
    n = n.offsetParent;
  }
  return { x: p.x - ox, y: p.y - oy };
}
