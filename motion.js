// Булка · шаг 3 — движение «поднимается тесто». Грузится только без prefers-reduced-motion.
// GSAP 3.12.5 + ScrollTrigger (cdnjs), Lenis 1.1.13 (jsdelivr) — точные версии.
(() => {
  const LIBS = ['https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js', 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js'];
  const load = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.append(s); });
  const root = document.documentElement, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const giveUp = () => root.classList.add('motion-off');
  const fallback = setTimeout(giveUp, 3000); // библиотеки не пришли — показываем всё статично

  // заголовок по словам; задержка зависит от строки, слова «поднимаются» из-под своей строки
  const split = el => {
    const words = [];
    [...el.childNodes].forEach(n => {
      if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return; if (/^\s+$/.test(part)) { el.insertBefore(document.createTextNode(part), n); return; }
        const w = document.createElement('span'); w.className = 'mw'; w.innerHTML = '<span></span>'; w.firstChild.textContent = part; el.insertBefore(w, n); words.push(w.firstChild);
      }), n.remove();
      else if (n.nodeType === 1 && !n.classList.contains('sr')) { const w = document.createElement('span'); w.className = 'mw'; n.replaceWith(w); w.append(n); words.push(n); }
    });
    const tops = [...new Set(words.map(w => Math.round(w.parentElement.offsetTop)))];
    return words.map(w => ({ w, line: tops.indexOf(Math.round(w.parentElement.offsetTop)) }));
  };
  const rise = (el, opts = {}) => { const parts = split(el);
    return gsap.from(parts.map(p => p.w), { yPercent: 105, duration: .9, ease: 'power3.out', delay: i => (opts.delay || 0) + parts[i].line * .06, ...opts.tween }); };

  // гравюрные иконки: анимированная версия играет один круг (~4 с), затем снова статика
  const playIcon = img => { if (!img.dataset.anim) return; const still = img.src; img.src = img.dataset.anim; setTimeout(() => { img.src = still; }, 4200); };

  // логотип рисует себя: обводка, затем заливка; тень проявляется последней
  const drawWordmark = async () => {
    const a = $('.brand'), img = a && a.querySelector('img'); if (!img) return;
    const svgText = await (await fetch(img.getAttribute('src'))).text();
    const box = document.createElement('span'); box.innerHTML = svgText; const svg = box.querySelector('svg');
    svg.setAttribute('aria-hidden', 'true'); svg.style.height = getComputedStyle(img).height; svg.style.width = 'auto'; svg.style.display = 'block'; svg.style.overflow = 'visible';
    const shade = svg.querySelector('g'), main = [...svg.children].filter(n => n.tagName === 'path');
    main.forEach(p => { const L = p.getTotalLength(); Object.assign(p.style, { strokeDasharray: L, strokeDashoffset: L, stroke: '#1f2329', strokeWidth: 2.4, fillOpacity: 0 }); });
    gsap.set(shade, { opacity: 0 }); img.replaceWith(svg);
    gsap.timeline({ defaults: { ease: 'power2.inOut' } })
      .to(main.map(p => p.style), { strokeDashoffset: 0, duration: .8 })
      .to(main.map(p => p.style), { fillOpacity: 1, duration: .4 }, '-=.15')
      .to(shade, { opacity: 1, duration: .35 }, '-=.25')
      .set(main.map(p => p.style), { strokeWidth: 0 });
  };

  Promise.all([load(LIBS[0]).then(() => load(LIBS[1])), load(LIBS[2])]).then(() => {
    clearTimeout(fallback);
    const { gsap: G, ScrollTrigger: ST, Lenis } = window; G.registerPlugin(ST);

    // плавный скролл (только мышь/тачпад; на таче — нативный)
    const lenis = new Lenis({ lerp: .1, anchors: { offset: -88 } });
    lenis.on('scroll', ST.update); G.ticker.add(t => lenis.raf(t * 1000)); G.ticker.lagSmoothing(0);
    window.__lenis = lenis;

    // загрузка: фото «оседает» 1.06 → 1, заголовок поднимается, логотип рисуется
    G.to('.hero-img', { scale: 1, duration: 1.6, ease: 'power2.out' });
    rise($('#h1'), { delay: .15 }); root.classList.add('motion-ready');
    G.from('.hero-note .lede, .countdown, .hero-note .link', { y: 18, opacity: 0, duration: .8, ease: 'power2.out', stagger: .08, delay: .5 });
    drawWordmark().catch(() => {});
    playIcon($('.countdown img'));

    // всё ниже первого экрана — ленивая инициализация
    const below = () => {
      // медленный параллакс фото в hero
      G.to('.hero-img', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      // заголовки разделов поднимаются
      $$('.st h2').forEach(h => { h.style.overflow = 'hidden'; G.from(h.querySelector('img'), { yPercent: 105, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 88%', once: true } }); });
      $$('.deliv h3').forEach(h => { const parts = split(h); G.from(parts.map(p => p.w), { yPercent: 105, duration: .9, ease: 'power3.out', delay: i => parts[i].line * .06, scrollTrigger: { trigger: h, start: 'top 88%', once: true } }); });
      // гравюрные метки играют один раз при входе
      $$('.st .mark').forEach(m => ST.create({ trigger: m, start: 'top 85%', once: true, onEnter: () => playIcon(m) }));
      // полка: изделия поднимаются на свои места
      ST.batch('.prod', { start: 'top 90%', once: true, onEnter: els => G.from(els, { y: 48, opacity: 0, duration: .9, ease: 'power3.out', stagger: .08 }) });
      // пар над горячим: хлеб, круассан, пирожок
      const steamSVG = '<svg class="steam" viewBox="0 0 60 60" aria-hidden="true"><path d="M18 56c-6-8 6-12 0-22s4-14 2-22"/><path d="M30 58c-6-9 7-13 0-24s4-15 2-24"/><path d="M42 56c-6-8 6-12 0-22s4-14 2-22"/></svg>';
      ['croissant', 'bread', 'pirozhok'].forEach(id => { const plate = $(`.add[data-id="${id}"]`)?.closest('.prod')?.querySelector('.plate'); if (!plate) return;
        plate.insertAdjacentHTML('beforeend', steamSVG); const paths = plate.querySelectorAll('.steam path');
        const tl = G.timeline({ repeat: -1, paused: true });
        paths.forEach((p, i) => tl.fromTo(p, { y: 10, opacity: 0 }, { y: -14, opacity: .55, duration: 1.4, ease: 'sine.out' }, i * .5).to(p, { y: -26, opacity: 0, duration: 1, ease: 'sine.in' }, i * .5 + 1.4));
        ST.create({ trigger: plate, start: 'top bottom', end: 'bottom top', onToggle: s => s.isActive ? tl.play() : tl.pause() }); });
      // крафтовые «шторки» между ключевыми разделами (3, не везде)
      const board = $('.board'); if (board) G.fromTo(board, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', ease: 'none', scrollTrigger: { trigger: board, start: 'top 85%', end: 'top 35%', scrub: .6 } });
      ['.pack', '.deliv .scene'].forEach(sel => { const el = $(sel); if (!el) return; el.classList.add('kw-host'); const kw = document.createElement('div'); kw.className = 'kw'; el.append(kw);
        G.to(kw, { scaleX: 0, ease: 'power2.inOut', duration: 1.1, scrollTrigger: { trigger: el, start: 'top 80%', once: true } }); });
      ST.refresh();
    };
    (window.requestIdleCallback || setTimeout)(below, { timeout: 1200 });

    // перелёт в пакет — с easing GSAP (FLIP по дуге)
    window.__flyGsap = (f, dx, dy, sc, done) => G.timeline({ onComplete: done })
      .to(f, { x: dx * .45, y: dy * .45 - 90, scale: (1 + sc) / 2, rotation: -8, duration: .36, ease: 'power2.out' })
      .to(f, { x: dx, y: dy, scale: sc, rotation: -14, opacity: .25, duration: .34, ease: 'power2.in' });

    // чек «печатается» при открытии корзины
    window.__printReceipt = d => (d.style.animation = 'none', G.fromTo(d, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: .75, ease: 'power2.out', clearProps: 'clipPath' }));
  }).catch(giveUp);
})();
