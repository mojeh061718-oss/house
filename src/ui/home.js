// Splash screen and project home screen ("Honeycutt Home Studio").
import { ICONS } from './icons.js';
import { isStandalone } from '../core/orientation.js';
import {
  listProjects, deleteProject, newProjectId, migrateLegacy,
  backupToFile, importBackup, isBackup, daysSinceBackup,
  getDraft, clearDraft
} from '../core/projects.js';
import { emptyProject } from '../core/state.js';
import { detectRooms } from '../core/geometry.js';
import { demoProject, mansionProject } from '../demo.js';

const $ = s => document.querySelector(s);

/** Styled yes/no confirm matching the studio's Save dialog. Resolves true/false. */
function confirmModal({ title, message, okLabel = 'OK', danger = false }) {
  return new Promise(resolve => {
    const scrim = document.createElement('div');
    scrim.className = 'modal-scrim';
    scrim.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(message)}</p>
        <div class="modal-row">
          <button class="modal-btn" data-r="0">Cancel</button>
          <button class="modal-btn ${danger ? 'danger' : 'primary'}" data-r="1">${escapeHtml(okLabel)}</button>
        </div>
      </div>`;
    scrim.addEventListener('click', e => {
      const r = e.target.closest('[data-r]')?.dataset.r;
      if (r != null) { scrim.remove(); resolve(r === '1'); }
    });
    document.body.appendChild(scrim);
  });
}

/** Draw a small clean plan preview of a stored project onto a canvas. */
function drawPreview(canvas, project, w, h) {
  const data = project.levels ? project.levels[0] : project;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.fillStyle = '#f2f3f5';
  ctx.fillRect(0, 0, w, h);
  const walls = data.walls || [];
  if (!walls.length) {
    ctx.strokeStyle = '#c8ccd4';
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(w * 0.28, h * 0.24, w * 0.44, h * 0.52);
    return;
  }
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  for (const wl of walls) {
    minX = Math.min(minX, wl.ax, wl.bx); maxX = Math.max(maxX, wl.ax, wl.bx);
    minY = Math.min(minY, wl.ay, wl.by); maxY = Math.max(maxY, wl.ay, wl.by);
  }
  const pad = 14;
  const s = Math.min((w - pad * 2) / Math.max(maxX - minX, 100), (h - pad * 2) / Math.max(maxY - minY, 100));
  const ox = (w - (maxX - minX) * s) / 2 - minX * s;
  const oy = (h - (maxY - minY) * s) / 2 - minY * s;
  // room fills
  const rooms = detectRooms(walls);
  const fills = ['#e5d9c3', '#dbe3d6', '#d6dde3', '#e3d6d6', '#e0dcd0'];
  rooms.forEach((r, i) => {
    ctx.beginPath();
    r.polygon.forEach((p, j) => {
      j ? ctx.lineTo(p.x * s + ox, p.y * s + oy) : ctx.moveTo(p.x * s + ox, p.y * s + oy);
    });
    ctx.closePath();
    ctx.fillStyle = fills[i % fills.length];
    ctx.fill();
  });
  // furniture footprints
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.strokeStyle = 'rgba(70,76,88,0.5)';
  ctx.lineWidth = 0.8;
  for (const it of data.items || []) {
    ctx.save();
    ctx.translate(it.x * s + ox, it.y * s + oy);
    ctx.rotate(it.rotation || 0);
    const iw = (it.w || 60) * s, id = (it.d || 60) * s;
    ctx.fillRect(-iw / 2, -id / 2, iw, id);
    ctx.strokeRect(-iw / 2, -id / 2, iw, id);
    ctx.restore();
  }
  // walls
  ctx.strokeStyle = '#3d4148';
  ctx.lineCap = 'square';
  for (const wl of walls) {
    ctx.lineWidth = Math.max(2, (wl.thickness || 12) * s);
    ctx.beginPath();
    ctx.moveTo(wl.ax * s + ox, wl.ay * s + oy);
    ctx.lineTo(wl.bx * s + ox, wl.by * s + oy);
    ctx.stroke();
  }
}

export class Home {
  /** openFn(data, projectId) puts the studio on screen with that project. */
  constructor(openFn) {
    this.openFn = openFn;
    this.selectMode = false;      // project-list multi-delete mode
    this.selected = new Set();
    migrateLegacy();
  }

  /** Start the splash animation NOW. Called at boot, independent of storage,
   *  so the build-the-house sequence begins the instant the web view is on
   *  screen (an installed iOS PWA shows a native launch image first; the CSS
   *  animations are held at frame 0 via `#splash:not(.play)` until this fires,
   *  so none of the sequence is consumed behind that launch image). */
  beginSplash() {
    const el = $('#splash');
    if (!el) return;
    el.classList.remove('hidden', 'fade-out');
    this._splashT0 = window.__splashT0 ?? Date.now();
  }

  /** Fade the logo screen out and reveal the home screen. Called once loading is
   *  done; a small minimum keeps the logo from flashing by on a fast boot. */
  endSplash() {
    const el = $('#splash');
    if (!el) { this.show(); return; }
    const MIN_SHOWN = 1100;   // logo shows at least this long, then fades
    const t0 = this._splashT0 ?? window.__splashT0 ?? Date.now();
    const wait = Math.max(0, MIN_SHOWN - (Date.now() - t0));
    setTimeout(() => {
      el.classList.add('fade-out');
      setTimeout(() => el.classList.add('hidden'), 460);
      this.show();
    }, wait);
  }

  show() {
    const home = $('#home');
    home.classList.remove('hidden');
    $('#studio').classList.add('hidden');
    this.selectMode = false;
    this.selected.clear();
    this.render();
  }

  hide() {
    $('#home').classList.add('hidden');
    $('#studio').classList.remove('hidden');
  }

  render() {
    const home = $('#home');
    const projects = listProjects();
    const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const showInstallTip = isIOS && !isStandalone() &&
      !localStorage.getItem('hs.installTipDismissed');
    const draft = getDraft();
    const draftName = draft?.data?.name ? `“${escapeHtml(draft.data.name)}”` : 'your last design';
    home.innerHTML = `
      <div class="home-scroll">
        ${draft ? `
        <div class="install-tip draft-tip" id="draftTip">
          <span>${ICONS.undo}</span>
          <p><b>Unsaved changes found.</b> ${draftName} has edits that weren't saved yet — pick up where you left off?</p>
          <span class="draft-actions">
            <button class="home-action primary" id="draftResume">Resume</button>
            <button class="home-action" id="draftDiscard">Discard</button>
          </span>
        </div>` : ''}
        ${showInstallTip ? `
        <div class="install-tip" id="installTip">
          <span>${ICONS.expand}</span>
          <p>For true full screen — no clock or signal bar — add this app to your
          Home Screen: tap <b>Share</b>, then <b>Add to Home Screen</b>.</p>
          <button id="tipClose" aria-label="Dismiss">${ICONS.close}</button>
        </div>` : ''}
        <header class="home-head">
          <span class="home-logo">${ICONS.logo}</span>
          <div>
            <h1>Honeycutt <b>Home Studio</b></h1>
            <p>Design · Measure · Walk through — in 2D &amp; 3D</p>
          </div>
          <span class="home-head-actions">
            ${this.selectMode ? `
            <button class="home-action danger" id="homeDelSel">${ICONS.trash}<span>Delete (${this.selected.size})</span></button>
            <button class="home-action" id="homeSelCancel">${ICONS.close}<span>Cancel</span></button>
            ` : `
            <button class="home-action" id="homeBackup" title="Save all projects to a file">${ICONS.download}<span>Back up</span></button>
            <button class="home-action" id="homeRestore" title="Restore projects from a backup file">${ICONS.open}<span>Restore</span></button>
            ${projects.length ? `<button class="home-action" id="homeSelect" title="Select projects to delete">${ICONS.multi}<span>Select</span></button>` : ''}
            `}
          </span>
        </header>
        ${projects.length && daysSinceBackup() > 14 ? `
        <div class="install-tip" id="backupTip">
          <span>${ICONS.download}</span>
          <p>Your designs live only on this device. Tap <b>Back up</b> to save
          them all to a file in case the app is ever removed.</p>
        </div>` : ''}
        <div class="home-grid">
          <button class="proj-card new" id="homeNew">
            <span class="new-plus">${ICONS.plus}</span>
            <span class="proj-name">New project</span>
            <span class="proj-meta">Start with an empty plan</span>
          </button>
          <button class="proj-card template" id="homeSample">
            <span class="proj-thumb"><canvas></canvas></span>
            <span class="proj-name">Sample apartment</span>
            <span class="proj-meta">Furnished one-bedroom template</span>
          </button>
          <button class="proj-card template" id="homeMansion">
            <span class="proj-thumb"><canvas></canvas></span>
            <span class="proj-name">Luxury estate</span>
            <span class="proj-meta">Furnished mansion with pool &amp; landscaped yard</span>
          </button>
          ${projects.map(p => `
          <div class="proj-card saved ${this.selected.has(p.id) ? 'sel' : ''}" data-id="${p.id}" role="button" tabindex="0">
            <span class="proj-thumb"><canvas></canvas></span>
            <span class="proj-name">${escapeHtml(p.name)}</span>
            <span class="proj-meta">Edited ${timeAgo(p.updatedAt)}</span>
            ${this.selectMode
              ? `<span class="proj-check">${ICONS.check}</span>`
              : `<button class="proj-del" data-del="${p.id}" title="Delete project">${ICONS.trash}</button>`}
          </div>`).join('')}
        </div>
      </div>`;

    const tipClose = $('#tipClose');
    if (tipClose) {
      tipClose.onclick = () => {
        localStorage.setItem('hs.installTipDismissed', '1');
        $('#installTip').remove();
      };
    }
    // ---- unsaved-work recovery ----
    $('#draftResume')?.addEventListener('click', () => {
      const d = getDraft();
      if (!d) { this.render(); return; }
      this.hide();
      // keep the draft until they Save or Don't-save from the studio; mark
      // the project dirty so leaving always prompts
      this.openFn(d.data, d.projectId, { dirty: true });
    });
    $('#draftDiscard')?.addEventListener('click', async () => {
      if (await confirmModal({
        title: 'Discard unsaved changes?',
        message: 'The unsaved work will be permanently discarded.',
        okLabel: 'Discard', danger: true
      })) {
        clearDraft(draft?.projectId);
        this.render();
      }
    });

    // ---- project-list multi-select delete ----
    $('#homeSelect')?.addEventListener('click', () => {
      this.selectMode = true; this.selected.clear(); this.render();
    });
    $('#homeSelCancel')?.addEventListener('click', () => {
      this.selectMode = false; this.selected.clear(); this.render();
    });
    $('#homeDelSel')?.addEventListener('click', async () => {
      const ids = [...this.selected];
      if (!ids.length) { this.selectMode = false; this.render(); return; }
      if (await confirmModal({
        title: `Delete ${ids.length} project${ids.length === 1 ? '' : 's'}?`,
        message: 'This cannot be undone.',
        okLabel: 'Delete', danger: true
      })) {
        ids.forEach(id => deleteProject(id));
        this.selectMode = false; this.selected.clear();
        this.render();
      }
    });

    const backupBtn = $('#homeBackup');
    if (backupBtn) backupBtn.onclick = async () => {
      try {
        if (await backupToFile()) this.render();
      } catch {
        alert('Backup failed — please try again.');
      }
    };
    const restoreBtn = $('#homeRestore');
    if (restoreBtn) restoreBtn.onclick = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = () => {
        const f = input.files[0];
        if (!f) return;
        f.text().then(txt => {
          try {
            const data = JSON.parse(txt);
            if (!isBackup(data)) throw new Error('not a backup');
            const n = importBackup(data);
            alert(n > 0 ? `${n} project${n === 1 ? '' : 's'} restored.`
              : 'Nothing to restore — everything in that backup is already here.');
            this.render();
          } catch {
            alert('That file is not a Home Studio backup.');
          }
        });
      };
      input.click();
    };
    $('#homeNew').onclick = () => {
      this.hide();
      this.openFn(emptyProject('My home'), newProjectId());
    };
    const sample = $('#homeSample');
    drawPreview(sample.querySelector('canvas'), demoProject(), 320, 190);
    sample.onclick = () => {
      this.hide();
      this.openFn(demoProject(), newProjectId());
    };
    const mansion = $('#homeMansion');
    drawPreview(mansion.querySelector('canvas'), mansionProject(), 320, 190);
    mansion.onclick = () => {
      this.hide();
      this.openFn(mansionProject(), newProjectId());
    };

    for (const card of home.querySelectorAll('.proj-card.saved')) {
      const id = card.dataset.id;
      const p = projects.find(x => x.id === id);
      drawPreview(card.querySelector('canvas'), p.data, 320, 190);
      card.addEventListener('click', (e) => {
        if (e.target.closest('.proj-del')) return;
        if (this.selectMode) {
          if (this.selected.has(id)) this.selected.delete(id); else this.selected.add(id);
          card.classList.toggle('sel', this.selected.has(id));
          const lbl = $('#homeDelSel')?.querySelector('span');
          if (lbl) lbl.textContent = `Delete (${this.selected.size})`;
          return;
        }
        this.hide();
        this.openFn(p.data, id);
      });
    }
    for (const del of home.querySelectorAll('.proj-del')) {
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        const p = projects.find(x => x.id === del.dataset.del);
        if (confirm(`Delete “${p?.name ?? 'project'}”? This cannot be undone.`)) {
          deleteProject(del.dataset.del);
          this.render();
        }
      });
    }
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

function timeAgo(ts) {
  const d = Date.now() - ts;
  const min = Math.floor(d / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} d ago`;
  return new Date(ts).toLocaleDateString();
}
