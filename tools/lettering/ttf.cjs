// Minimal dependency-free TrueType reader: cmap 4/12, glyf (incl. composites), hmtx, name. → SVG path data.
const fs = require('fs');
function load(file) {
  const b = fs.readFileSync(file), n = b.readUInt16BE(4), T = {};
  for (let i = 0; i < n; i++) { const o = 12 + i * 16; T[b.toString('latin1', o, o + 4)] = { off: b.readUInt32BE(o + 8), len: b.readUInt32BE(o + 12) }; }
  const head = T.head.off, upm = b.readUInt16BE(head + 18), locFmt = b.readInt16BE(head + 50);
  const numG = b.readUInt16BE(T.maxp.off + 4), nHM = b.readUInt16BE(T.hhea.off + 34);
  const loca = i => locFmt ? b.readUInt32BE(T.loca.off + i * 4) : b.readUInt16BE(T.loca.off + i * 2) * 2;
  const adv = g => b.readUInt16BE(T.hmtx.off + Math.min(g, nHM - 1) * 4);
  // cmap
  let sub = null; const c = T.cmap.off, nt = b.readUInt16BE(c + 2);
  for (let i = 0; i < nt; i++) { const p = b.readUInt16BE(c + 4 + i * 8), e = b.readUInt16BE(c + 6 + i * 8), o = c + b.readUInt32BE(c + 8 + i * 8), f = b.readUInt16BE(o);
    if ((p === 3 && (e === 1 || e === 10)) || p === 0) { if (!sub || f === 12) sub = { o, f }; } }
  const gid = cp => { const o = sub.o;
    if (sub.f === 12) { const ng = b.readUInt32BE(o + 12); for (let i = 0; i < ng; i++) { const s = b.readUInt32BE(o + 16 + i * 12), e = b.readUInt32BE(o + 20 + i * 12); if (cp >= s && cp <= e) return b.readUInt32BE(o + 24 + i * 12) + cp - s; } return 0; }
    const sc = b.readUInt16BE(o + 6) / 2, ends = o + 14, starts = ends + sc * 2 + 2, deltas = starts + sc * 2, ros = deltas + sc * 2;
    for (let i = 0; i < sc; i++) { const end = b.readUInt16BE(ends + i * 2); if (cp > end) continue; const st = b.readUInt16BE(starts + i * 2); if (cp < st) return 0;
      const d = b.readInt16BE(deltas + i * 2), ro = b.readUInt16BE(ros + i * 2); if (!ro) return (cp + d) & 0xffff;
      const g = b.readUInt16BE(ros + i * 2 + ro + (cp - st) * 2); return g ? (g + d) & 0xffff : 0; } return 0; };
  // glyph → contours [[{x,y,on}]]
  const glyph = (g, depth = 0) => { const s = loca(g), e = loca(g + 1); if (s === e || depth > 5) return [];
    const o = T.glyf.off + s, nc = b.readInt16BE(o);
    if (nc >= 0) { const endPts = []; for (let i = 0; i < nc; i++) endPts.push(b.readUInt16BE(o + 10 + i * 2));
      const np = endPts[nc - 1] + 1, il = b.readUInt16BE(o + 10 + nc * 2); let p = o + 12 + nc * 2 + il; const fl = [];
      while (fl.length < np) { const f = b[p++]; fl.push(f); if (f & 8) { let r = b[p++]; while (r--) fl.push(f); } }
      const xs = [], ys = []; let v = 0;
      for (const f of fl) { if (f & 2) { const d = b[p++]; v += f & 16 ? d : -d; } else if (!(f & 16)) { v += b.readInt16BE(p); p += 2; } xs.push(v); } v = 0;
      for (const f of fl) { if (f & 4) { const d = b[p++]; v += f & 32 ? d : -d; } else if (!(f & 32)) { v += b.readInt16BE(p); p += 2; } ys.push(v); }
      const out = []; let st = 0; for (const en of endPts) { const ct = []; for (let i = st; i <= en; i++) ct.push({ x: xs[i], y: ys[i], on: !!(fl[i] & 1) }); out.push(ct); st = en + 1; } return out; }
    let p = o + 10, out = [], more = true;
    while (more) { const f = b.readUInt16BE(p), cg = b.readUInt16BE(p + 2); p += 4; let dx, dy;
      if (f & 1) { dx = b.readInt16BE(p); dy = b.readInt16BE(p + 2); p += 4; } else { dx = b.readInt8(p); dy = b.readInt8(p + 1); p += 2; }
      let a = 1, bb = 0, cc = 0, d = 1; const f2 = x => x / 16384;
      if (f & 8) { a = d = f2(b.readInt16BE(p)); p += 2; } else if (f & 64) { a = f2(b.readInt16BE(p)); d = f2(b.readInt16BE(p + 2)); p += 4; } else if (f & 128) { a = f2(b.readInt16BE(p)); bb = f2(b.readInt16BE(p + 2)); cc = f2(b.readInt16BE(p + 4)); d = f2(b.readInt16BE(p + 6)); p += 8; }
      for (const ct of glyph(cg, depth + 1)) out.push(ct.map(q => ({ x: a * q.x + cc * q.y + dx, y: bb * q.x + d * q.y + dy, on: q.on })));
      more = !!(f & 32); } return out; };
  const name = id => { const o = T.name.off, cnt = b.readUInt16BE(o + 2), so = o + b.readUInt16BE(o + 4);
    for (let i = 0; i < cnt; i++) { const r = o + 6 + i * 12; if (b.readUInt16BE(r + 6) === id && b.readUInt16BE(r) === 3) { const l = b.readUInt16BE(r + 8), off = b.readUInt16BE(r + 10); return b.slice(so + off, so + off + l).swap16().toString('utf16le'); } } return ''; };
  return { upm, gid, glyph, adv, name };
}
// contours → path (font units, y flipped, scaled, translated)
function contoursToPath(cts, sx, ox, oy) {
  const P = (x, y) => `${(ox + x * sx).toFixed(2)} ${(oy - y * sx).toFixed(2)}`; let d = '';
  for (const ct of cts) { if (!ct.length) continue; let pts = ct.slice(); let si = pts.findIndex(p => p.on);
    if (si < 0) { const a = pts[0], b = pts[1]; pts.unshift({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, on: true }); si = 0; }
    pts = pts.slice(si).concat(pts.slice(0, si)); d += 'M' + P(pts[0].x, pts[0].y);
    for (let i = 1; i <= pts.length; i++) { const cur = pts[i % pts.length], prev = pts[i - 1];
      if (cur.on && prev.on) d += 'L' + P(cur.x, cur.y);
      else if (!cur.on) { const nx = pts[(i + 1) % pts.length]; const end = nx.on ? nx : { x: (cur.x + nx.x) / 2, y: (cur.y + nx.y) / 2 }; d += 'Q' + P(cur.x, cur.y) + ' ' + P(end.x, end.y); if (nx.on) i++; } }
    d += 'Z'; } return d;
}
// text → {d, width} at given cap size (px per em = size), tracking in em
function textPath(font, str, size, track = 0, ox = 0, oy = 0) {
  const sx = size / font.upm; let x = ox, d = '';
  for (const ch of str) { const g = font.gid(ch.codePointAt(0)); d += contoursToPath(font.glyph(g), sx, x, oy); x += font.adv(g) * sx + track * size; }
  return { d, width: x - ox - track * size };
}
module.exports = { load, textPath };
