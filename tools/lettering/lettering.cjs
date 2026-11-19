// «Булочная, 1910» lettering: Yeseva One capitals → SVG paths, customised as a pre-revolutionary shop sign:
// inline cut (clip-path stroke trick), stepped extrusion shadow, flourish rule; ornaments drawn by hand.
const fs = require('fs'), path = require('path');
const { load, textPath } = require('./ttf.cjs');
const [,, outDir, boardOut, heroCrop] = process.argv;
const Y = load(path.join(__dirname, 'fonts/yeseva.ttf')), C = load(path.join(__dirname, 'fonts/cormorant-i.ttf'));
const INK = '#1f2329', SHADOW = '#7a5a35', PAPER = '#f5f0e6';
let uid = 0;

// sign-style word: extrusion shadow + ink fill + inline cut
function signWord(str, size, { track = .06, inline = true, depth = .05, ink = INK, shadow = SHADOW, paper = PAPER, pad = 0 } = {}) {
  const t = textPath(Y, str, size, track, pad, size * .78 + pad);
  const w = t.width + pad * 2 + size * depth, h = size * .82 + pad * 2 + size * depth, id = 'c' + (++uid);
  const steps = Math.max(2, Math.round(size * depth / 1.2));
  let shade = ''; for (let i = steps; i >= 1; i--) { const o = (size * depth * i / steps).toFixed(2); shade += `<path d="${t.d}" transform="translate(${o} ${o})"/>`; }
  const a = Math.max(1.2, size * .034), b = Math.max(.7, size * .018); // paper band a, ink edge b → inline width a-b
  const inl = inline ? `<clipPath id="${id}"><path d="${t.d}"/></clipPath><g clip-path="url(#${id})" fill="none" stroke-linejoin="round"><path d="${t.d}" stroke="${paper}" stroke-width="${(a * 2).toFixed(2)}"/><path d="${t.d}" stroke="${ink}" stroke-width="${(b * 2).toFixed(2)}"/></g>` : '';
  return { w, h, g: `<g fill="${shadow}">${shade}</g><path d="${t.d}" fill="${ink}"/>${inl}` };
}
// flourish rule: tapered lens strokes + central diamond + dots
function rule(w, y, col = INK, s = 1) {
  const c = w / 2, len = c - 22 * s;
  const lens = (x0, x1) => `M${x0} ${y}Q${(x0 + x1) / 2} ${y - 1.6 * s} ${x1} ${y}Q${(x0 + x1) / 2} ${y + 1.6 * s} ${x0} ${y}Z`;
  return `<g fill="${col}"><path d="${lens(c - len, c - 12 * s)}"/><path d="${lens(c + 12 * s, c + len)}"/><path d="M${c} ${y - 6 * s}L${c + 6 * s} ${y}L${c} ${y + 6 * s}L${c - 6 * s} ${y}Z"/><circle cx="${c - 16 * s}" cy="${y}" r="${1.6 * s}"/><circle cx="${c + 16 * s}" cy="${y}" r="${1.6 * s}"/></g>`;
}
const svg = (w, h, body, label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w.toFixed(1)} ${h.toFixed(1)}" width="${Math.round(w)}" height="${Math.round(h)}" role="img" aria-label="${label}">${body}</svg>`;

// 1. wordmark (large): БУЛКА + rule + «булочная · с 6:30»
const wm = signWord('БУЛКА', 200, { pad: 4 });
const sub = textPath(C, 'булочная · с 6:30', 44, .12, 0, 0);
const W1 = wm.w, ry = wm.h + 26, sy = ry + 58;
const wordmark = svg(W1, sy + 14, `${wm.g}${rule(W1, ry)}<path d="${textPath(C, 'булочная · с 6:30', 44, .12, (W1 - sub.width) / 2, sy).d}" fill="${INK}"/>`, 'Булка — булочная, с 6:30');
// 2. wordmark (header, 32px tall): no inline, light extrusion, no subline
const sm = signWord('БУЛКА', 120, { inline: false, depth: .045, pad: 2 });
const wordmarkSmall = svg(sm.w, sm.h, sm.g, 'Булка');
// 3. section titles
const titles = { menu: 'МЕНЮ', bakery: 'ПЕКАРНЯ', reviews: 'ОТЗЫВЫ', delivery: 'ДОСТАВКА' }, labels = { menu: 'Меню', bakery: 'Пекарня', reviews: 'Отзывы', delivery: 'Доставка' };
const titleSvgs = {}; for (const [k, s] of Object.entries(titles)) { const t = signWord(s, 96, { pad: 2, depth: .05 }); titleSvgs[k] = svg(t.w, t.h + 30, `${t.g}${rule(t.w, t.h + 18, INK, .7)}`, labels[k]); }
// 4. ornaments: cartouche (concave corners, double rule, side diamonds) + divider
const cw = 640, ch = 360, r = 34, m = 10;
const notch = (x, y, w, h, rr) => `M${x + rr} ${y}H${x + w - rr}A${rr} ${rr} 0 0 0 ${x + w} ${y + rr}V${y + h - rr}A${rr} ${rr} 0 0 0 ${x + w - rr} ${y + h}H${x + rr}A${rr} ${rr} 0 0 0 ${x} ${y + h - rr}V${y + rr}A${rr} ${rr} 0 0 0 ${x + rr} ${y}Z`;
const dia = (x, y, s) => `<path d="M${x} ${y - s}L${x + s} ${y}L${x} ${y + s}L${x - s} ${y}Z"/>`;
const cartouche = svg(cw, ch, `<g fill="none" stroke="${INK}"><path d="${notch(m, m, cw - 2 * m, ch - 2 * m, r)}" stroke-width="3"/><path d="${notch(m + 9, m + 9, cw - 2 * m - 18, ch - 2 * m - 18, r - 6)}" stroke-width="1"/></g><g fill="${INK}">${dia(cw / 2, m, 7)}${dia(cw / 2, ch - m, 7)}${dia(m, ch / 2, 7)}${dia(cw - m, ch / 2, 7)}</g><g fill="${SHADOW}">${dia(m + 30, m + 30, 3)}${dia(cw - m - 30, m + 30, 3)}${dia(m + 30, ch - m - 30, 3)}${dia(cw - m - 30, ch - m - 30, 3)}</g>`, 'Рамка-картуш');
const divider = svg(520, 24, rule(520, 12, INK, 1.2), 'Разделитель');

fs.mkdirSync(outDir, { recursive: true });
const files = { 'wordmark.svg': wordmark, 'wordmark-header.svg': wordmarkSmall, 'title-menu.svg': titleSvgs.menu, 'title-bakery.svg': titleSvgs.bakery, 'title-reviews.svg': titleSvgs.reviews, 'title-delivery.svg': titleSvgs.delivery, 'cartouche.svg': cartouche, 'divider.svg': divider };
for (const [f, c] of Object.entries(files)) fs.writeFileSync(path.join(outDir, f), c);
// dark board variant (cream letters on ink, kraft extrusion)
const dk = signWord('БУЛКА', 150, { ink: '#f1e4c8', paper: INK, shadow: '#9a7444', pad: 4 });
const dark = svg(dk.w, dk.h + 30, `${dk.g}${rule(dk.w, dk.h + 18, '#f1e4c8', .8)}`, 'Булка, тёмная вывеска');

// board
const inl = s => s.replace(/<svg /, '<svg style="width:100%;height:auto;display:block" ');
const board = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,500&family=Onest:wght@400;500&display=swap" rel="stylesheet">
<style>body{margin:0;background:#e3d1b2;font:400 15px/1.5 Onest,sans-serif;color:${INK}}.b{width:1600px;padding:56px;box-sizing:border-box;display:grid;grid-template-columns:1fr 1fr;gap:28px}
.card{background:${PAPER};padding:36px}.k{font:500 13px/1 Onest;letter-spacing:.04em;color:#5b5247;margin-bottom:22px}.span{grid-column:1/-1}
.t{display:grid;grid-template-columns:1fr 1fr;gap:28px 40px;align-items:end}.hd{display:flex;align-items:center;gap:40px;background:${PAPER};border-bottom:1px solid #d9ccb4;padding:22px 28px;margin-top:16px}
.f{font:500 30px/1.3 'Cormorant Garamond',serif}.fi{font:italic 500 30px/1.3 'Cormorant Garamond',serif}.o{font:400 22px/1.4 Onest}.dark{background:${INK}}h1{font:500 44px/1 'Cormorant Garamond';margin:0 0 6px}</style></head><body><div class="b">
<div class="card span" style="display:flex;justify-content:space-between;align-items:end"><div><h1>Булка · леттеринг «Булочная, 1910»</h1><div class="k" style="margin:0">Вывесочные капители на основе Yeseva One (OFL) · подпись и заголовки — Cormorant Garamond (OFL) · интерфейс — Onest (OFL)</div></div><div class="k" style="margin:0">Шаг 1 · на согласование</div></div>
<div class="card"><div class="k">Логотип · крупно</div><div style="max-width:620px;margin:20px auto">${inl(wordmark)}</div></div>
<div class="card dark"><div class="k" style="color:#cdbf9f">Вариант для тёмной вывески / подвала</div><div style="max-width:520px;margin:40px auto">${inl(dark)}</div></div>
<div class="card"><div class="k">Логотип в шапке · 32 и 48 px</div>
<div class="hd"><div style="height:32px">${wordmarkSmall.replace(/<svg /, '<svg style="height:32px;width:auto;display:block" ')}</div><span style="font-size:15px">Меню</span><span style="font-size:15px">Пекарня</span><span style="font-size:15px">Отзывы</span><span style="margin-left:auto;font-size:15px">Корзина 0</span></div>
<div class="hd"><div style="height:48px">${wordmarkSmall.replace(/<svg /, '<svg style="height:48px;width:auto;display:block" ')}</div></div></div>
<div class="card"><div class="k">Орнамент: картуш и разделитель</div><div style="position:relative;max-width:520px;margin:0 auto">${inl(cartouche)}<div style="position:absolute;inset:0;display:grid;place-items:center;text-align:center"><div><div class="fi" style="font-size:26px">Свежая партия</div><div class="f" style="font-size:44px;line-height:1">каждые два часа</div></div></div></div><div style="max-width:420px;margin:26px auto 0">${inl(divider)}</div></div>
<div class="card span"><div class="k">Заголовки разделов</div><div class="t">${['menu', 'bakery', 'reviews', 'delivery'].map(k => `<div style="max-width:${{ menu: 300, bakery: 470, reviews: 420, delivery: 520 }[k]}px">${inl(titleSvgs[k])}</div>`).join('')}</div></div>
<div class="card span"><div class="k">В контексте: первый экран v2 с новым логотипом</div><img src="${heroCrop}" style="width:100%;display:block"></div>
<div class="card span"><div class="k">Проверка ё и й в парных шрифтах</div><div class="f">Cormorant Garamond: Ёлка, йогурт, тёплый хлеб, слоёный круассан</div><div class="fi">Cormorant Garamond italic: Ещё тёплый, пшеничный, с изюмом</div><div class="o" style="margin-top:10px">Onest: Ёмкость, йогурт, тёплый хлеб · Корзина 0 · Оформить заказ</div></div>
</div></body></html>`;
fs.writeFileSync(boardOut, board);
console.log('ok', Object.keys(files).join(' '));
