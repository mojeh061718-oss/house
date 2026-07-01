// Splash screen and project home screen ("Honeycutt Home Studio").
import { ICONS } from './icons.js';
import { listProjects, deleteProject, newProjectId, migrateLegacy } from '../core/projects.js';
import { emptyProject } from '../core/state.js';
import { detectRooms } from '../core/geometry.js';
import { demoProject } from '../demo.js';

const $ = s => document.querySelector(s);

/** Draw a small clean plan preview of a stored project onto a canvas. */
function drawPreview(canvas, data, w, h) {
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
    migrateLegacy();
  }

  showSplash() {
    const el = $('#splash');
    el.classList.remove('hidden', 'fade-out');
    setTimeout(() => {
      el.classList.add('fade-out');
      setTimeout(() => el.classList.add('hidden'), 450);
      this.show();
    }, 1300);
  }

  show() {
    const home = $('#home');
    home.classList.remove('hidden');
    $('#studio').classList.add('hidden');
    this.render();
  }

  hide() {
    $('#home').classList.add('hidden');
    $('#studio').classList.remove('hidden');
  }

  render() {
    const home = $('#home');
    const projects = listProjects();
    home.innerHTML = `
      <div class="home-scroll">
        <header class="home-head">
          <span class="home-logo">${ICONS.logo}</span>
          <div>
            <h1>Honeycutt <b>Home Studio</b></h1>
            <p>Design your space in 2D &amp; 3D</p>
          </div>
        </header>
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
          ${projects.map(p => `
          <div class="proj-card saved" data-id="${p.id}" role="button" tabindex="0">
            <span class="proj-thumb"><canvas></canvas></span>
            <span class="proj-name">${escapeHtml(p.name)}</span>
            <span class="proj-meta">Edited ${timeAgo(p.updatedAt)}</span>
            <button class="proj-del" data-del="${p.id}" title="Delete project">${ICONS.trash}</button>
          </div>`).join('')}
        </div>
      </div>`;

    $('#homeNew').onclick = () => {
      this.hide();
      this.openFn(emptyProject('My home'), newProjectId());
    };
    const sample = $('#homeSample');
    const sampleData = demoProject();
    drawPreview(sample.querySelector('canvas'), sampleData, 320, 190);
    sample.onclick = () => {
      this.hide();
      this.openFn(demoProject(), newProjectId());
    };

    for (const card of home.querySelectorAll('.proj-card.saved')) {
      const id = card.dataset.id;
      const p = projects.find(x => x.id === id);
      drawPreview(card.querySelector('canvas'), p.data, 320, 190);
      card.addEventListener('click', (e) => {
        if (e.target.closest('.proj-del')) return;
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
