/* ==========================================================================
   WILD & ALIVE — gallery.html page script
   Featured Spotlight (Swiper), masonry filter chips, and a custom
   accessible lightbox shared by both the spotlight carousel and the
   masonry grid. Import this as a module from gallery.html only.
   ========================================================================== */

import Swiper from 'https://esm.sh/swiper@11';
import { Navigation, Pagination, Autoplay } from 'https://esm.sh/swiper@11/modules';
import { reducedMotion } from './main.js';

/* ---------------------------------------------------------------------- */
/* Featured Spotlight carousel                                            */
/* ---------------------------------------------------------------------- */
const spotlightEl = document.querySelector('.spotlight-swiper');
let spotlightSwiper = null;

if (spotlightEl) {
  spotlightSwiper = new Swiper(spotlightEl, {
    modules: [Navigation, Pagination, Autoplay],
    loop: true,
    speed: 700,
    spaceBetween: 24,
    slidesPerView: 1,
    breakpoints: {
      700: { slidesPerView: 1.25, centeredSlides: true },
      1100: { slidesPerView: 1.6, centeredSlides: true },
    },
    navigation: { nextEl: '.spotlight-swiper .swiper-button-next', prevEl: '.spotlight-swiper .swiper-button-prev' },
    pagination: { el: '.spotlight-swiper .swiper-pagination', clickable: true },
    autoplay: reducedMotion ? false : { delay: 4200, pauseOnMouseEnter: true, disableOnInteraction: false },
    a11y: { enabled: true },
  });
}

/* ---------------------------------------------------------------------- */
/* Masonry filter chips                                                    */
/* ---------------------------------------------------------------------- */
const masonry = document.getElementById('gallery-masonry');
const masonryImgs = masonry ? Array.from(masonry.querySelectorAll('img')) : [];
const emptyMsg = document.getElementById('gallery-empty');
const chips = Array.from(document.querySelectorAll('#full-gallery .chip'));

function applyFilter(filter) {
  let visibleCount = 0;
  masonryImgs.forEach((img) => {
    const match = filter === 'all' || img.dataset.category === filter;
    img.dataset.hidden = match ? 'false' : 'true';
    img.setAttribute('aria-hidden', match ? 'false' : 'true');
    if (match) visibleCount += 1;
  });
  if (emptyMsg) emptyMsg.hidden = visibleCount !== 0;
}

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chips.forEach((c) => {
      c.classList.toggle('active', c === chip);
      c.setAttribute('aria-pressed', String(c === chip));
    });
    applyFilter(chip.dataset.filter);
  });
});

/* ---------------------------------------------------------------------- */
/* Lightbox                                                                */
/* ---------------------------------------------------------------------- */
const lightbox = document.getElementById('lightbox');
const lightboxImg = lightbox?.querySelector('.lightbox-img');
const lightboxCaption = lightbox?.querySelector('.lightbox-caption');
const closeBtn = lightbox?.querySelector('.lightbox-close');
const prevBtn = lightbox?.querySelector('.lightbox-prev');
const nextBtn = lightbox?.querySelector('.lightbox-next');

let activeCollection = [];
let activeIndex = 0;
let lastFocusedEl = null;

function collectionFromMasonry() {
  return masonryImgs.filter((img) => img.dataset.hidden !== 'true');
}
function collectionFromSpotlight() {
  return Array.from(document.querySelectorAll('.spotlight-swiper .swiper-slide img'));
}

function itemData(el) {
  return {
    src: el.dataset.full || el.currentSrc || el.src,
    alt: el.alt || '',
    caption: el.closest('.swiper-slide')?.querySelector('.spotlight-caption')?.textContent || el.alt || '',
  };
}

function renderLightbox() {
  const el = activeCollection[activeIndex];
  if (!el || !lightboxImg) return;
  const data = itemData(el);
  lightboxImg.src = data.src;
  lightboxImg.alt = data.alt;
  if (lightboxCaption) lightboxCaption.textContent = data.caption;
}

function openLightbox(collection, index, triggerEl) {
  if (!lightbox) return;
  activeCollection = collection;
  activeIndex = index;
  lastFocusedEl = triggerEl || document.activeElement;
  renderLightbox();
  lightbox.hidden = false;
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  if (spotlightSwiper && spotlightSwiper.autoplay) spotlightSwiper.autoplay.stop();
  closeBtn?.focus();
  document.addEventListener('keydown', onKeydown);
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.hidden = true;
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  document.removeEventListener('keydown', onKeydown);
  if (spotlightSwiper && spotlightSwiper.autoplay && !reducedMotion) spotlightSwiper.autoplay.start();
  lastFocusedEl?.focus();
}

function step(delta) {
  if (!activeCollection.length) return;
  activeIndex = (activeIndex + delta + activeCollection.length) % activeCollection.length;
  renderLightbox();
}

function getFocusable() {
  return [closeBtn, prevBtn, nextBtn].filter(Boolean);
}

function onKeydown(e) {
  if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); return; }
  if (e.key === 'ArrowRight') { e.preventDefault(); step(1); return; }
  if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); return; }
  if (e.key === 'Tab') {
    const focusable = getFocusable();
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
}

lightbox?.querySelectorAll('[data-lightbox-close]').forEach((el) => el.addEventListener('click', closeLightbox));
prevBtn?.addEventListener('click', () => step(-1));
nextBtn?.addEventListener('click', () => step(1));

// Masonry images open the lightbox against the currently-visible (filtered) set
masonryImgs.forEach((img) => {
  img.addEventListener('click', () => {
    const collection = collectionFromMasonry();
    const index = collection.indexOf(img);
    openLightbox(collection, Math.max(index, 0), img);
  });
});

// Spotlight slide images open the lightbox against the spotlight set
collectionFromSpotlight().forEach((img) => {
  img.addEventListener('click', () => {
    const collection = collectionFromSpotlight();
    const index = collection.indexOf(img);
    openLightbox(collection, Math.max(index, 0), img);
  });
});
