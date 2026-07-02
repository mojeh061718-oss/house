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

export function isStandalone() {
  return navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches;
}

// Measure the real env() safe-area insets via a probe element — some
// iOS states report them as 0 while still drawing the status bar.
let probe = null;
function measureEnvInsets() {
  if (!probe) {
    probe = document.createElement('div');
    probe.style.cssText =
      'position:fixed;left:0;top:0;width:0;height:0;pointer-events:none;visibility:hidden;' +
      'padding-top:env(safe-area-inset-top);padding-right:env(safe-area-inset-right);' +
      'padding-bottom:env(safe-area-inset-bottom);padding-left:env(safe-area-inset-left);';
    document.documentElement.appendChild(probe);
  }
  const cs = getComputedStyle(probe);
  return {
    top: parseFloat(cs.paddingTop) || 0,
    right: parseFloat(cs.paddingRight) || 0,
    bottom: parseFloat(cs.paddingBottom) || 0,
    left: parseFloat(cs.paddingLeft) || 0
  };
}

/**
 * Apply exact pixel sizing + safe-area padding from JS. CSS viewport units
 * can disagree with the real window on iOS (browser chrome, PWA states),
 * which shows up as dead space; window.innerWidth/Height is what the
 * pointer math uses, so the layout must use the same numbers.
 */
function applyMetrics() {
  const doc = document.documentElement;
  const app = document.getElementById('app');
  const ins = measureEnvInsets();
  const landscapePhysical = window.innerWidth > window.innerHeight;
  // Safari keeps the clock/battery overlay in landscape while env() says 0
  if (!isStandalone() && landscapePhysical && isTouchDevice() && ins.top < 4) {
    ins.top = 20;
  }
  // map physical insets into app space (app is rotated 90° cw when forced)
  const m = rotated
    ? { t: ins.right, r: ins.bottom, b: ins.left, l: ins.top }
    : { t: ins.top, r: ins.right, b: ins.bottom, l: ins.left };
  doc.style.setProperty('--safe-t', m.t + 'px');
  doc.style.setProperty('--safe-r', m.r + 'px');
  doc.style.setProperty('--safe-b', m.b + 'px');
  doc.style.setProperty('--safe-l', m.l + 'px');
  if (app) {
    if (rotated) {
      app.style.width = window.innerHeight + 'px';
      app.style.height = window.innerWidth + 'px';
    } else {
      app.style.width = '';
      app.style.height = '';
    }
  }
}

function evaluate() {
  const portrait = window.innerHeight > window.innerWidth;
  // covers iPhones and all iPads (12.9" iPad Pro portrait width is 1024pt)
  const should = portrait && isTouchDevice() && Math.min(window.innerWidth, window.innerHeight) <= 1030;
  if (should !== rotated) {
    rotated = should;
    document.documentElement.classList.toggle('force-landscape', rotated);
    applyMetrics();
    for (const fn of listeners) fn(rotated);
  } else {
    applyMetrics();
  }
}

export function initOrientation() {
  evaluate();
  window.addEventListener('resize', evaluate);
  window.addEventListener('orientationchange', () => setTimeout(evaluate, 60));
  // iOS fires visualViewport resizes when browser chrome collapses/expands
  window.visualViewport?.addEventListener('resize', evaluate);
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
