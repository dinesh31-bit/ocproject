/* ==========================================================================
   WILD & ALIVE — shared page behaviour
   Import this module on every page: <script type="module" src="/js/main.js">
   Exposes helpers used by page-specific scripts (blog.js, gallery.js, inline
   index script) via named exports, and auto-initializes the common chrome
   (nav, cursor, loader, reveals, magnetic buttons, ripple, ambient layers,
   ambient audio) on DOMContentLoaded.
   ========================================================================== */

import gsap from 'https://esm.sh/gsap@3.12.5';
import { ScrollTrigger } from 'https://esm.sh/gsap@3.12.5/ScrollTrigger';
import Lenis from 'https://esm.sh/lenis@1.1.18';

gsap.registerPlugin(ScrollTrigger);

export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------------- */
/* Smooth scroll (Lenis) — skipped entirely under reduced-motion          */
/* ---------------------------------------------------------------------- */
export let lenis = null;
function initLenis() {
  if (reducedMotion) return;
  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------------------------------------------------------------------- */
/* Loader                                                                  */
/* ---------------------------------------------------------------------- */
function initLoader() {
  const loader = document.querySelector('.loader');
  if (!loader) return;
  const percentEl = loader.querySelector('.loader-percent');
  document.body.style.overflow = 'hidden';

  let pct = 0;
  const tick = () => {
    pct = Math.min(100, pct + Math.random() * 18);
    if (percentEl) percentEl.textContent = `${Math.floor(pct)}%`;
    if (pct < 100) {
      setTimeout(tick, 120);
    } else {
      finish();
    }
  };
  const finish = () => {
    document.body.style.overflow = '';
    loader.setAttribute('data-done', 'true');
    document.dispatchEvent(new CustomEvent('site:loaded'));
    setTimeout(() => loader.remove(), 900);
  };

  if (reducedMotion) {
    finish();
  } else {
    setTimeout(tick, 200);
    window.addEventListener('load', () => { pct = Math.max(pct, 92); }, { once: true });
  }
}

/* ---------------------------------------------------------------------- */
/* Custom cursor                                                          */
/* ---------------------------------------------------------------------- */
function initCursor() {
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
  document.body.classList.add('has-custom-cursor');

  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  document.body.append(dot, ring);

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;
  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
    maybeSpawnLeaf(mx, my);
  });
  const loop = () => {
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  };
  loop();

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('a, button, [data-cursor-hover]')) document.body.classList.add('cursor-hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('a, button, [data-cursor-hover]')) document.body.classList.remove('cursor-hover');
  });

  let lastLeaf = 0;
  function maybeSpawnLeaf(x, y) {
    if (reducedMotion) return;
    const now = performance.now();
    if (now - lastLeaf < 220) return;
    lastLeaf = now;
    const leaf = document.createElement('span');
    leaf.className = 'cursor-leaf';
    leaf.textContent = Math.random() > 0.5 ? '🍃' : '🌿';
    leaf.style.transform = `translate(${x}px, ${y}px)`;
    document.body.appendChild(leaf);
    gsap.fromTo(leaf, { opacity: 0.9, y: 0, rotate: 0 }, {
      opacity: 0, y: 40 + Math.random() * 30, rotate: 90 * (Math.random() > 0.5 ? 1 : -1),
      duration: 1.1, ease: 'power1.out', onComplete: () => leaf.remove(),
    });
  }
}

/* ---------------------------------------------------------------------- */
/* Nav                                                                     */
/* ---------------------------------------------------------------------- */
function initNav() {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;
  const toggle = nav.querySelector('.nav-toggle');
  const links = nav.querySelector('.nav-links');

  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.innerHTML = open ? '&#10005;' : '&#9776;';
    });
    links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = '&#9776;';
    }));
  }
}

/* ---------------------------------------------------------------------- */
/* Magnetic buttons + ripple                                               */
/* ---------------------------------------------------------------------- */
function initMagneticAndRipple() {
  document.querySelectorAll('.btn.magnetic').forEach((btn) => {
    if (!reducedMotion) {
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.35);
        yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      btn.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
    }
  });

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2;
    const span = document.createElement('span');
    span.className = 'ripple';
    span.style.width = span.style.height = `${size}px`;
    span.style.left = `${e.clientX - r.left - size / 2}px`;
    span.style.top = `${e.clientY - r.top - size / 2}px`;
    btn.appendChild(span);
    span.addEventListener('animationend', () => span.remove());
  });
}

/* ---------------------------------------------------------------------- */
/* Scroll reveals                                                          */
/* ---------------------------------------------------------------------- */
const REVEAL_VARIANTS = {
  up: { from: { opacity: 0, y: 70 }, to: { opacity: 1, y: 0 } },
  scale: { from: { opacity: 0, scale: 0.9 }, to: { opacity: 1, scale: 1 } },
  left: { from: { opacity: 0, x: -70 }, to: { opacity: 1, x: 0 } },
  right: { from: { opacity: 0, x: 70 }, to: { opacity: 1, x: 0 } },
  blur: { from: { opacity: 0, filter: 'blur(14px)' }, to: { opacity: 1, filter: 'blur(0px)' } },
  rotate: { from: { opacity: 0, rotate: -6, y: 40 }, to: { opacity: 1, rotate: 0, y: 0 } },
  mask: { from: { clipPath: 'inset(0 0 100% 0)' }, to: { clipPath: 'inset(0 0 0% 0)' } },
};

export function initReveals(root = document) {
  root.querySelectorAll('[data-reveal]').forEach((el) => {
    if (el.dataset.revealDone) return;
    el.dataset.revealDone = '1';
    const variant = REVEAL_VARIANTS[el.dataset.reveal] || REVEAL_VARIANTS.up;
    if (reducedMotion) { gsap.set(el, variant.to); return; }
    const delay = Number(el.dataset.revealDelay || 0);
    gsap.fromTo(el, variant.from, {
      ...variant.to,
      duration: 1.1,
      ease: 'power3.out',
      delay,
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });
}

/* ---------------------------------------------------------------------- */
/* Ambient background layers: fog / fireflies / leaves / birds / stars     */
/* usage: <div class="ambient-layer" data-ambient="fireflies:14,leaves:8"> */
/* ---------------------------------------------------------------------- */
export function initAmbient(root = document) {
  if (reducedMotion) return;
  root.querySelectorAll('[data-ambient]').forEach((layer) => {
    if (layer.dataset.ambientDone) return;
    layer.dataset.ambientDone = '1';
    const spec = Object.fromEntries(layer.dataset.ambient.split(',').map((p) => {
      const [k, v] = p.split(':'); return [k.trim(), Number(v)];
    }));
    for (let i = 0; i < (spec.firefly || 0); i++) layer.appendChild(makeFirefly());
    for (let i = 0; i < (spec.leaf || 0); i++) layer.appendChild(makeLeaf());
    for (let i = 0; i < (spec.bird || 0); i++) layer.appendChild(makeBird());
    for (let i = 0; i < (spec.star || 0); i++) layer.appendChild(makeStar());
  });
}
function rand(min, max) { return min + Math.random() * (max - min); }
function makeFirefly() {
  const el = document.createElement('span');
  el.className = 'firefly';
  el.style.left = `${rand(0, 100)}%`;
  el.style.top = `${rand(20, 90)}%`;
  el.style.animationDelay = `${rand(0, 6)}s, ${rand(0, 3)}s`;
  return el;
}
function makeLeaf() {
  const el = document.createElement('span');
  el.className = 'leaf';
  el.textContent = ['🍃', '🍂', '🌿'][Math.floor(rand(0, 3))];
  el.style.left = `${rand(0, 100)}%`;
  el.style.setProperty('--drift', `${rand(-80, 80)}px`);
  el.style.animationDuration = `${rand(9, 18)}s`;
  el.style.animationDelay = `${rand(0, 10)}s`;
  return el;
}
function makeBird() {
  const el = document.createElement('span');
  el.className = 'bird';
  el.textContent = '𓅃';
  el.style.top = `${rand(5, 40)}%`;
  el.style.animationDuration = `${rand(16, 26)}s`;
  el.style.animationDelay = `${rand(0, 14)}s`;
  return el;
}
function makeStar() {
  const el = document.createElement('span');
  el.className = 'star';
  el.style.left = `${rand(0, 100)}%`;
  el.style.top = `${rand(0, 100)}%`;
  el.style.animationDelay = `${rand(0, 4)}s`;
  return el;
}

/* ---------------------------------------------------------------------- */
/* Ambient sound toggle — synthesized forest hum (no external audio files) */
/* ---------------------------------------------------------------------- */
function initAmbientAudio() {
  const btn = document.querySelector('[data-sound-toggle]');
  if (!btn) return;
  let ctx, playing = false;
  let nodes = [];

  function buildGraph() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // filtered noise = wind/leaves bed
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer; noise.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass'; noiseFilter.frequency.value = 500; noiseFilter.Q.value = 0.6;
    const noiseGain = ctx.createGain(); noiseGain.gain.value = 0.5;
    noise.connect(noiseFilter).connect(noiseGain).connect(master);

    // slow low drone
    const osc = ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = 90;
    const oscGain = ctx.createGain(); oscGain.gain.value = 0.06;
    osc.connect(oscGain).connect(master);

    // gentle LFO on filter freq for organic movement
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 220;
    lfo.connect(lfoGain).connect(noiseFilter.frequency);

    [noise, osc, lfo].forEach((n) => n.start());
    master.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 1.5);
    nodes = [master];
  }

  btn.addEventListener('click', () => {
    playing = !playing;
    btn.setAttribute('aria-pressed', String(playing));
    btn.classList.toggle('is-active', playing);
    if (playing) {
      if (!ctx) buildGraph(); else ctx.resume();
      nodes[0].gain.linearRampToValueAtTime(0.35, ctx.currentTime + 1);
    } else if (ctx) {
      nodes[0].gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    }
  });
}

/* ---------------------------------------------------------------------- */
/* Boot                                                                    */
/* ---------------------------------------------------------------------- */
document.documentElement.classList.toggle('reduced-motion', reducedMotion);

function boot() {
  initLoader();
  initLenis();
  initCursor();
  initNav();
  initMagneticAndRipple();
  initAmbient();
  initAmbientAudio();
  initReveals();
  document.addEventListener('site:loaded', () => ScrollTrigger.refresh());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

export { gsap, ScrollTrigger };
