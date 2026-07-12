/* ==========================================================================
   WILD & ALIVE — blog.js
   Page-specific behaviour for blogs.html (listing: search + category filter)
   and blog.html (article: reading progress, sticky TOC, share buttons).
   Each block feature-detects its DOM so this single module can be imported
   on both pages without side effects.

   Cards are static in the DOM (per the brief's simpler recommendation) and
   are purely shown/hidden via CSS classes, so there is no need to re-run
   main.js's initReveals() here — every card already received its one-time
   scroll-reveal treatment on page load.
   ========================================================================== */

/* ---------------------------------------------------------------------- */
/* blogs.html — instant search + category filter chips                    */
/* ---------------------------------------------------------------------- */
function initBlogListing() {
  const grid = document.getElementById('blog-grid');
  if (!grid) return;

  const searchForm = document.getElementById('blog-search-form');
  const searchInput = document.getElementById('blog-search');
  const chips = Array.from(document.querySelectorAll('.filter-chips .chip'));
  const cards = Array.from(grid.querySelectorAll('.blog-card'));
  const noResults = document.getElementById('blog-no-results');
  const resultsCount = document.getElementById('blog-results-count');
  const clearBtn = document.getElementById('blog-clear-filters');

  let activeCategory = 'all';
  let query = '';

  function applyFilters() {
    let visibleCount = 0;
    cards.forEach((card) => {
      const category = card.dataset.category || '';
      const title = card.dataset.title || '';
      const matchesCategory = activeCategory === 'all' || category === activeCategory;
      const matchesQuery = query === '' || title.includes(query) || category.includes(query);
      const shouldShow = matchesCategory && matchesQuery;

      if (shouldShow) {
        visibleCount += 1;
        card.classList.remove('is-filtering-out', 'is-hidden');
      } else {
        card.classList.add('is-filtering-out');
      }
    });

    // Defer hard hide until the fade-out transition finishes, so re-filtering
    // mid-transition (fast typing) still looks smooth rather than snapping.
    window.setTimeout(() => {
      cards.forEach((card) => {
        if (card.classList.contains('is-filtering-out')) card.classList.add('is-hidden');
      });
    }, 260);

    if (noResults) noResults.hidden = visibleCount !== 0;
    if (resultsCount) {
      resultsCount.textContent = visibleCount === 0
        ? 'No stories match your search.'
        : `Showing ${visibleCount} of ${cards.length} stories.`;
    }
  }

  searchInput?.addEventListener('input', () => {
    query = searchInput.value.trim().toLowerCase();
    applyFilters();
  });
  searchForm?.addEventListener('submit', (e) => e.preventDefault());

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
      chip.classList.add('active');
      chip.setAttribute('aria-pressed', 'true');
      activeCategory = chip.dataset.filter;
      applyFilters();
    });
  });

  clearBtn?.addEventListener('click', () => {
    query = '';
    activeCategory = 'all';
    if (searchInput) searchInput.value = '';
    chips.forEach((c) => {
      const isAll = c.dataset.filter === 'all';
      c.classList.toggle('active', isAll);
      c.setAttribute('aria-pressed', String(isAll));
    });
    applyFilters();
  });

  // Initial count announcement
  if (resultsCount) resultsCount.textContent = `Showing ${cards.length} of ${cards.length} stories.`;
}

/* ---------------------------------------------------------------------- */
/* blog.html — reading progress bar                                       */
/* ---------------------------------------------------------------------- */
function initReadingProgress() {
  const track = document.querySelector('.reading-progress');
  const fill = track?.querySelector('.progress-fill');
  if (!track || !fill) return;

  let ticking = false;
  function update() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
    fill.style.width = `${pct}%`;
    track.setAttribute('aria-valuenow', String(Math.round(pct)));
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
  update();
}

/* ---------------------------------------------------------------------- */
/* blog.html — sticky table of contents with scroll-spy                   */
/* ---------------------------------------------------------------------- */
function initTableOfContents() {
  const tocLists = document.querySelectorAll('.toc-list');
  if (!tocLists.length) return;

  const links = Array.from(document.querySelectorAll('.toc-list a'));
  const sections = links
    .map((a) => document.getElementById(a.getAttribute('href').slice(1)))
    .filter(Boolean);
  if (!sections.length) return;

  function setActive(id) {
    document.querySelectorAll('.toc-list a').forEach((a) => {
      a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`);
    });
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-30% 0px -55% 0px', threshold: 0 });
    sections.forEach((section) => observer.observe(section));
  }

  // Collapse the mobile <details> TOC after choosing a section
  document.querySelectorAll('.toc-mobile').forEach((details) => {
    details.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => { details.open = false; });
    });
  });
}

/* ---------------------------------------------------------------------- */
/* blog.html — floating share buttons                                     */
/* ---------------------------------------------------------------------- */
function initShareButtons() {
  const rail = document.querySelector('.share-rail');
  if (!rail) return;

  const pageUrl = () => window.location.href;
  const pageTitle = () => document.title;

  rail.querySelectorAll('[data-share]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const network = btn.dataset.share;
      if (network === 'twitter') {
        const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl())}&text=${encodeURIComponent(pageTitle())}`;
        window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
      } else if (network === 'facebook') {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl())}`;
        window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
      } else if (network === 'copy') {
        navigator.clipboard?.writeText(pageUrl()).then(() => {
          const original = btn.textContent;
          btn.textContent = '✓';
          btn.classList.add('is-copied');
          btn.setAttribute('aria-label', 'Link copied');
          window.setTimeout(() => {
            btn.textContent = original;
            btn.classList.remove('is-copied');
            btn.setAttribute('aria-label', 'Copy link');
          }, 1800);
        }).catch(() => { /* clipboard unavailable — silently ignore */ });
      }
    });
  });
}

/* ---------------------------------------------------------------------- */
/* Boot                                                                    */
/* ---------------------------------------------------------------------- */
function boot() {
  initBlogListing();
  initReadingProgress();
  initTableOfContents();
  initShareButtons();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
