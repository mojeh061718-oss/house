// Architectural top-view symbols for catalog items, drawn on the 2D plan.
// Draw functions operate in item-local centimeters: origin at footprint
// center, +x right, +y = the item's front. The editor applies the transform.

function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawPlanSymbol(ctx, def, w, d, px) {
  // px = world units per screen pixel (for constant-width strokes)
  const plan = def.plan || { type: 'box' };
  const lw = 1.1 * px;
  ctx.lineWidth = lw;
  ctx.strokeStyle = '#3d4148';
  ctx.fillStyle = 'rgba(252,252,250,0.92)';
  const hw = w / 2, hd = d / 2;

  const outline = (r = 3) => {
    rr(ctx, -hw, -hd, w, d, r);
    ctx.fill();
    ctx.stroke();
  };
  const line = (x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };
  const circle = (x, y, r, fill = false) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill) ctx.fill();
    ctx.stroke();
  };

  switch (plan.type) {
    case 'sofa': {
      outline(8);
      const arm = Math.min(16, w * 0.12);
      line(-hw + arm, -hd + 14, -hw + arm, hd);
      line(hw - arm, -hd + 14, hw - arm, hd);
      line(-hw, -hd + 14, hw, -hd + 14); // back line
      const seats = plan.seats || 2;
      const innerW = w - arm * 2;
      for (let i = 1; i < seats; i++) {
        const x = -innerW / 2 + (innerW / seats) * i;
        line(x, -hd + 14, x, hd - 6);
      }
      break;
    }
    case 'bed': {
      outline(2);
      line(-hw, -hd + 16, hw, -hd + 16); // headboard
      const pl = plan.pillows || 2;
      for (let i = 0; i < pl; i++) {
        const pw = Math.min(56, w / pl - 16);
        const x = -w / 2 + (w / pl) * (i + 0.5);
        rr(ctx, x - pw / 2, -hd + 22, pw, 30, 8);
        ctx.stroke();
      }
      // blanket fold
      line(-hw, hd - d * 0.45, hw, hd - d * 0.45);
      ctx.save();
      ctx.setLineDash([6 * px, 4 * px]);
      line(-hw, hd - d * 0.45 + 8, hw, hd - d * 0.45 + 8);
      ctx.restore();
      break;
    }
    case 'table': outline(2); rr(ctx, -hw + 5, -hd + 5, w - 10, d - 10, 2); ctx.stroke(); break;
    case 'tableRound': {
      ctx.beginPath();
      ctx.arc(0, 0, hw, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      circle(0, 0, hw - 5);
      break;
    }
    case 'chair': {
      rr(ctx, -hw + 3, -hd + 8, w - 6, d - 11, 6);
      ctx.fill(); ctx.stroke();
      rr(ctx, -hw + 1, -hd, w - 2, 8, 3);
      ctx.fill(); ctx.stroke();
      break;
    }
    case 'stool': ctx.beginPath(); ctx.arc(0, 0, hw, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); circle(0, 0, hw * 0.55); break;
    case 'officeChair': {
      ctx.beginPath(); ctx.arc(0, 2, hw - 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -hd + 10, hw - 8, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + Math.PI / 2;
        line(0, 2, Math.cos(a) * hw, 2 + Math.sin(a) * hw);
      }
      break;
    }
    case 'storage': case 'counter': {
      outline(1);
      line(-hw, hd - 6, hw, hd - 6); // front face line
      break;
    }
    case 'wardrobe': {
      outline(1);
      line(-hw, 0, hw, 0);
      for (let x = -hw + 8; x < hw - 4; x += 12) line(x, -6, x, 6);
      break;
    }
    case 'wallCabinet': {
      ctx.save();
      ctx.setLineDash([5 * px, 4 * px]);
      outline(1);
      ctx.restore();
      break;
    }
    case 'appliance': {
      outline(1);
      rr(ctx, -hw + 4, -hd + 4, w - 8, d - 8, 1);
      ctx.stroke();
      ctx.save();
      ctx.font = `${Math.min(18, d * 0.4)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#3d4148';
      ctx.fillText(plan.label || '', 0, 0);
      ctx.restore();
      break;
    }
    case 'stove': {
      outline(1);
      circle(-w * 0.22, -d * 0.2, 9);
      circle(w * 0.22, -d * 0.2, 7.5);
      circle(-w * 0.22, d * 0.22, 7.5);
      circle(w * 0.22, d * 0.22, 9);
      break;
    }
    case 'washer': {
      outline(1);
      circle(0, 0, Math.min(hw, hd) * 0.62);
      circle(0, 0, Math.min(hw, hd) * 0.4);
      break;
    }
    case 'sink': {
      outline(1);
      ctx.beginPath();
      ctx.ellipse(0, 2, w * 0.3, d * 0.26, 0, 0, Math.PI * 2);
      ctx.stroke();
      circle(0, -hd + 7, 2.5, true);
      break;
    }
    case 'toilet': {
      // tank
      rr(ctx, -hw + 2, -hd, w - 4, 18, 2);
      ctx.fill(); ctx.stroke();
      // bowl
      ctx.beginPath();
      ctx.ellipse(0, 10, w * 0.42, d * 0.34, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 12, w * 0.3, d * 0.24, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'bathtub': {
      outline(10);
      rr(ctx, -hw + 10, -hd + 10, w - 20, d - 20, 14);
      ctx.stroke();
      circle(-hw + 24, 0, 3.5);
      break;
    }
    case 'shower': {
      outline(1);
      line(-hw, -hd, hw, hd);
      line(hw, -hd, -hw, hd);
      circle(hw * 0.45, -hd * 0.45, 6);
      break;
    }
    case 'rug': {
      ctx.save();
      ctx.globalAlpha = 0.55;
      outline(3);
      rr(ctx, -hw + 8, -hd + 8, w - 16, d - 16, 2);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'rugRound': {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.beginPath(); ctx.arc(0, 0, hw, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      circle(0, 0, hw - 8);
      ctx.restore();
      break;
    }
    case 'plant': {
      ctx.beginPath(); ctx.arc(0, 0, hw, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.quadraticCurveTo(Math.cos(a + 0.5) * hw * 0.5, Math.sin(a + 0.5) * hw * 0.5,
          Math.cos(a) * (hw - 3), Math.sin(a) * (hw - 3));
        ctx.stroke();
      }
      break;
    }
    case 'lampRound': {
      ctx.beginPath(); ctx.arc(0, 0, hw, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        line(Math.cos(a) * hw * 0.4, Math.sin(a) * hw * 0.4, Math.cos(a) * hw, Math.sin(a) * hw);
      }
      circle(0, 0, hw * 0.28);
      break;
    }
    case 'flag': {
      // pole base dot with a little flag streaming off to one side
      const r = Math.min(hw, hd) * 0.5;
      ctx.beginPath(); ctx.arc(0, 0, Math.max(2, r * 0.5), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.save();
      ctx.fillStyle = 'rgba(180,60,70,0.55)';
      ctx.beginPath();
      ctx.moveTo(0, -1.5);
      ctx.lineTo(hw, -hd * 0.5);
      ctx.lineTo(hw, hd * 0.5);
      ctx.lineTo(0, 1.5);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.restore();
      break;
    }
    case 'rock': {
      // a few overlapping lumps read as a rock/boulder from above
      ctx.save();
      ctx.fillStyle = 'rgba(140,138,130,0.6)';
      const lumps = [[0, 0, 0.9], [-hw * 0.35, hd * 0.2, 0.5], [hw * 0.4, -hd * 0.15, 0.55], [hw * 0.1, hd * 0.35, 0.4]];
      for (const [lx, ly, s] of lumps) {
        ctx.beginPath();
        ctx.ellipse(lx, ly, hw * s, hd * s, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case 'tv': {
      // TVs are only a few cm deep — draw at a readable minimum depth
      const td = Math.max(d, 16), thd = td / 2;
      ctx.fillStyle = '#2c3038';
      rr(ctx, -hw, -thd, w, td, 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#8a929e';
      line(-hw + 5, thd - 4, hw - 5, thd - 4);
      ctx.save();
      ctx.font = `${Math.min(13, w * 0.14)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#c8cdd5';
      ctx.fillText('TV', 0, -1);
      ctx.restore();
      break;
    }
    case 'fireplace': {
      outline(1);
      rr(ctx, -hw + 16, -hd + 4, w - 32, d - 14, 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, hd - 8, 10, Math.PI, 0);
      ctx.stroke();
      break;
    }
    case 'wallDecor': {
      ctx.save();
      ctx.globalAlpha = 0.8;
      outline(1);
      ctx.restore();
      break;
    }
    case 'slab': {
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#d3d2cd';
      rr(ctx, -hw, -hd, w, d, 2);
      ctx.fill();
      ctx.stroke();
      // expansion joints
      const step = Math.max(60, w / 5);
      for (let x = -hw + step; x < hw - 4; x += step) line(x, -hd, x, hd);
      ctx.restore();
      break;
    }
    case 'grass': {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#8fb26a';
      rr(ctx, -hw, -hd, w, d, 4);
      ctx.fill();
      ctx.stroke();
      // scattered blades so it never looks like a concrete slab
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = '#54763a';
      ctx.lineWidth = 1.4;
      let sd = 7;
      const rnd = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; };
      const n = Math.max(10, Math.round((w * d) / 3000));
      for (let i = 0; i < n; i++) {
        const x = -hw + 8 + rnd() * (w - 16), y = -hd + 8 + rnd() * (d - 16);
        ctx.beginPath();
        ctx.moveTo(x, y + 7); ctx.lineTo(x - 4, y - 6);
        ctx.moveTo(x, y + 7); ctx.lineTo(x + 4, y - 6);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case 'hedge': {
      ctx.fillStyle = '#b9d3a8';
      rr(ctx, -hw, -hd, w, d, Math.min(14, d / 2));
      ctx.fill();
      ctx.stroke();
      ctx.save();
      ctx.globalAlpha = 0.5;
      for (let x = -hw + 14; x < hw - 8; x += 20) circle(x, 0, Math.min(8, hd - 3));
      ctx.restore();
      break;
    }
    case 'car': {
      outline(Math.min(18, w * 0.2));
      rr(ctx, -hw + 8, -hd * 0.42, w - 16, d * 0.46, 10); // cabin/glass
      ctx.stroke();
      line(-hw + 8, -hd * 0.42 + d * 0.16, hw - 8, -hd * 0.42 + d * 0.16);
      break;
    }
    case 'fence': {
      outline(1);
      for (let x = -hw + 10; x < hw - 5; x += 18) line(x, -hd, x, hd);
      break;
    }
    case 'box': {
      outline(2);
      break;
    }
    case 'pond': {
      ctx.fillStyle = '#a8cede';
      ctx.beginPath();
      ctx.ellipse(0, 0, hw - 4, hd - 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#6d98ac';
      ctx.beginPath();
      ctx.ellipse(0, 0, hw * 0.55, hd * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'pool': {
      outline(4);
      ctx.fillStyle = '#a8cede';
      rr(ctx, -hw + 12, -hd + 12, w - 24, d - 24, 4);
      ctx.fill();
      ctx.stroke();
      // lane ripples
      ctx.strokeStyle = '#7fa9bd';
      for (let i = 1; i < 4; i++) {
        line(-hw + 20, -hd + (d / 4) * i, hw - 20, -hd + (d / 4) * i);
      }
      break;
    }
    case 'stairs': {
      outline(1);
      // treads + an up arrow along the run
      const treads = Math.max(6, Math.round(d / 22));
      for (let i = 1; i < treads; i++) {
        const y = -hd + (d / treads) * i;
        line(-hw, y, hw, y);
      }
      line(0, hd - 8, 0, -hd + 10);
      line(0, -hd + 10, -6, -hd + 20);
      line(0, -hd + 10, 6, -hd + 20);
      break;
    }
    case 'elevator': {
      outline(2);
      line(-hw, -hd, hw, hd);
      line(hw, -hd, -hw, hd);
      break;
    }
    case 'rings': {
      circle(0, 0, Math.min(hw, hd) - 2);
      circle(0, 0, Math.min(hw, hd) * 0.62);
      break;
    }
    case 'hottub': {
      outline(4);
      circle(0, 0, Math.min(hw, hd) - 12);
      break;
    }
    case 'swingset': {
      outline(1);
      line(-hw + 8, 0, hw - 8, 0);
      rr(ctx, -hw * 0.5 - 9, -6, 18, 12, 2); ctx.stroke();
      rr(ctx, hw * 0.5 - 9, -6, 18, 12, 2); ctx.stroke();
      break;
    }
    case 'grill': {
      outline(4);
      circle(-w * 0.12, 0, Math.min(hd, hw) - 7);
      break;
    }
    case 'patioset': {
      circle(0, 0, Math.min(hw, hd) * 0.42);
      for (const a of [0.6, 2.2, 3.8, 5.4]) {
        rr(ctx, Math.cos(a) * hw * 0.72 - 8, Math.sin(a) * hd * 0.72 - 8, 16, 16, 3);
        ctx.stroke();
      }
      break;
    }
    case 'hoop': {
      line(-hw, hd * 0.2, hw, hd * 0.2);        // backboard
      circle(0, -hd * 0.15, Math.min(hw, hd) * 0.3);
      break;
    }
    case 'pergola': {
      outline(1);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        rr(ctx, sx * hw - (sx > 0 ? 10 : 0), sy * hd - (sy > 0 ? 10 : 0), 10, 10, 1);
        ctx.stroke();
      }
      const step = Math.max(24, w / 9);
      ctx.save();
      ctx.globalAlpha = 0.4;
      for (let x = -hw + step; x < hw - 4; x += step) line(x, -hd, x, hd);
      ctx.restore();
      break;
    }
    case 'roof': {
      // dashed footprint + ridge line + slope hatching
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.setLineDash([8, 5]);
      rr(ctx, -hw, -hd, w, d, 2);
      ctx.fillStyle = 'rgba(190,186,178,0.35)';
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      line(-hw, 0, hw, 0);
      ctx.globalAlpha = 0.35;
      const step = Math.max(28, w / 10);
      for (let x = -hw + step; x < hw - 4; x += step) {
        line(x, -hd + 4, x, -4);
        line(x, 4, x, hd - 4);
      }
      ctx.restore();
      break;
    }
    case 'pond': {
      // organic wobbled outline with water fill + shore stones
      ctx.save();
      const rx = hw - 6, ry2 = hd - 6;
      ctx.beginPath();
      for (let i = 0; i <= 30; i++) {
        const a = (i / 30) * Math.PI * 2;
        const wob = 1 + 0.09 * Math.sin(a * 3 + 1.7) + 0.05 * Math.sin(a * 5 + 0.4);
        const x = Math.cos(a) * rx * wob, y = Math.sin(a) * ry2 * wob;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(126,182,208,0.85)';
      ctx.fill();
      ctx.strokeStyle = '#6d8577';
      ctx.stroke();
      ctx.fillStyle = 'rgba(120,114,102,0.9)';
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + 0.2;
        const wob = 1 + 0.09 * Math.sin(a * 3 + 1.7) + 0.05 * Math.sin(a * 5 + 0.4);
        ctx.beginPath();
        ctx.arc(Math.cos(a) * rx * wob * 1.04, Math.sin(a) * ry2 * wob * 1.04, 3 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      break;
    }
    case 'path': {
      // gentle S-curve stroke — placed paths are drawn from their real points
      ctx.save();
      ctx.lineWidth = Math.min(d * 0.62, w * 0.5);
      ctx.strokeStyle = 'rgba(190,188,180,0.9)';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-hw + ctx.lineWidth / 2, hd * 0.35);
      ctx.bezierCurveTo(-hw * 0.2, hd * 0.5, hw * 0.2, -hd * 0.5, hw - ctx.lineWidth / 2, -hd * 0.35);
      ctx.stroke();
      ctx.restore();
      break;
    }
    default:
      outline(2);
  }
}
