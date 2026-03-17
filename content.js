const DEFAULTS = {
  hideShorts: true,
  hideChips: true,
  hideExploreShelf: true,
  videosPerRow: 5,
  hideBell: true,
  hideMic: true,
  hideSidebarShorts: true,
  hideSubs: true,
  hideExplore: true,
  hideMoreFromYT: true,
  hideRecommended: true,
  stopPreviews: true,
  hidePromos: true,
  performanceMode: true,
};

const SHELF_TITLES_TO_REMOVE = ['explore more topics'];
const SIDEBAR_EXPLORE = ['Explore','Music','Films','Gaming','News','Sport','Learning','Fashion & Beauty','Podcasts'];
const SIDEBAR_MORE_YT = ['YouTube Premium','YouTube Studio','YouTube Music','YouTube Kids'];

// Reload the page when settings change so everything is applied fresh
chrome.storage.onChanged.addListener(() => location.reload());

chrome.storage.sync.get({ ...DEFAULTS, enabled: true }, settings => {
  if (!settings.enabled) return;

  injectStyles(settings);
  if (settings.stopPreviews) setupPreviewBlock();

  applyAll(settings);
  const observer = new MutationObserver(() => applyAll(settings));
  observer.observe(document.documentElement, { childList: true, subtree: true });
});

function buildCSS(s) {
  let css = '';

  if (s.hideChips) css += `
    #chips-wrapper, yt-chip-cloud-renderer, ytd-feed-filter-chip-bar-renderer { display: none !important; }
  `;
  if (s.hideBell) css += `
    ytd-notification-topbar-button-renderer { display: none !important; }
  `;
  if (s.hideMic) css += `
    #voice-search-button { display: none !important; }
  `;
  if (s.hideShorts) css += `
    ytd-rich-shelf-renderer[is-shorts], ytd-reel-shelf-renderer { display: none !important; }
  `;
  if (s.hideSidebarShorts) css += `
    ytd-guide-entry-renderer a[title="Shorts"],
    ytd-mini-guide-entry-renderer a[title="Shorts"] { display: none !important; }
  `;
  if (s.hideSubs) css += `
    ytd-guide-entry-renderer:has(a[title="Subscriptions"]),
    ytd-mini-guide-entry-renderer:has(a[title="Subscriptions"]) { display: none !important; }
  `;
  if (s.hideExplore) css += `
    ytd-guide-section-renderer:has(a[title="Explore"]),
    ytd-guide-section-renderer:has(a[title="Music"]),
    ytd-guide-section-renderer:has(a[title="Films"]),
    ytd-guide-section-renderer:has(a[title="Gaming"]),
    ytd-guide-section-renderer:has(a[title="News"]),
    ytd-guide-section-renderer:has(a[title="Sport"]),
    ytd-guide-section-renderer:has(a[title="Learning"]),
    ytd-guide-section-renderer:has(a[title="Fashion & Beauty"]),
    ytd-guide-section-renderer:has(a[title="Podcasts"]) { display: none !important; }
  `;
  if (s.hideMoreFromYT) css += `
    ytd-guide-section-renderer:has(a[title="YouTube Premium"]),
    ytd-guide-section-renderer:has(a[title="YouTube Studio"]),
    ytd-guide-section-renderer:has(a[title="YouTube Music"]),
    ytd-guide-section-renderer:has(a[title="YouTube Kids"]) { display: none !important; }
  `;
  if (s.hidePromos) css += `
    ytd-popup-container, tp-yt-paper-dialog, ytd-mealbar-promo-renderer,
    ytd-statement-banner-renderer, #masthead-ad, ytd-banner-promo-renderer,
    ytd-in-feed-ad-layout-renderer, ytd-promoted-sparkles-web-renderer,
    ytd-action-companion-ad-renderer,
    ytd-rich-item-renderer:has(ytd-statement-banner-renderer),
    ytd-rich-section-renderer:has(ytd-statement-banner-renderer) { display: none !important; }
  `;
  if (s.hideRecommended) css += `
    ytd-watch-next-secondary-results-renderer,
    #secondary.ytd-watch-flexy { display: none !important; }
  `;
  if (s.videosPerRow) css += `
    ytd-rich-grid-renderer {
      --ytd-rich-grid-items-per-row: ${s.videosPerRow} !important;
      --ytd-rich-grid-slim-items-per-row: ${s.videosPerRow} !important;
    }
  `;
  if (s.performanceMode) css += `
    tp-yt-paper-ripple { display: none !important; }
    ytd-guide-renderer *, ytd-masthead *, ytd-rich-grid-renderer * {
      animation-duration: 0.001ms !important;
      transition-duration: 0.001ms !important;
    }
    ytd-rich-item-renderer {
      content-visibility: auto;
      contain-intrinsic-size: 0 300px;
    }
  `;

  // Always hide survey popups
  css += `
    ytd-watch-next-survey-renderer, yt-survey-renderer, ytd-survey-renderer { display: none !important; }
  `;

  return css;
}

function injectStyles(settings) {
  const style = document.createElement('style');
  style.id = 'baretube-styles';
  style.textContent = buildCSS(settings);
  (document.head || document.documentElement).appendChild(style);
}

function applyAll(s) {
  if (s.hideExploreShelf) {
    document.querySelectorAll('ytd-rich-shelf-renderer, ytd-shelf-renderer, ytd-rich-section-renderer').forEach(el => {
      const title = el.querySelector('#title, #channel-title, yt-formatted-string, span');
      if (title && SHELF_TITLES_TO_REMOVE.includes(title.textContent.trim().toLowerCase())) {
        const wrapper = el.closest('ytd-rich-section-renderer') || el.closest('ytd-rich-item-renderer') || el;
        wrapper.style.display = 'none';
      }
    });
  }

  // Hide subscriptions nav link and the subscribed channels list
  if (s.hideSubs) {
    document.querySelectorAll('ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer').forEach(entry => {
      const a = entry.querySelector('a');
      if (a && (a.title === 'Subscriptions' || (a.href && a.href.includes('/feed/subscriptions')))) {
        entry.style.display = 'none';
      }
    });
    document.querySelectorAll('ytd-guide-section-renderer').forEach(section => {
      const header = section.querySelector('#guide-section-title, yt-formatted-string');
      if (header && header.textContent.trim().toLowerCase() === 'subscriptions') {
        section.style.display = 'none';
      }
      // Also hide sections that only contain channel subscription entries (no nav links)
      const entries = section.querySelectorAll('ytd-guide-entry-renderer');
      const hasNavLink = [...entries].some(e => {
        const a = e.querySelector('a');
        return a && ['Home','Shorts','Subscriptions','Explore'].includes(a.title);
      });
      if (!hasNavLink && entries.length > 0) section.style.display = 'none';
    });
  }

  if (s.hideRecommended) {
    const primary = document.querySelector('#primary.ytd-watch-flexy');
    if (primary && window.location.pathname === '/watch') primary.style.maxWidth = '100%';
  }

  if (s.videosPerRow) {
    const grid = document.querySelector('ytd-rich-grid-renderer');
    if (grid) {
      grid.style.setProperty('--ytd-rich-grid-items-per-row', s.videosPerRow, 'important');
      grid.style.setProperty('--ytd-rich-grid-slim-items-per-row', s.videosPerRow, 'important');
    }
  }
}

function setupPreviewBlock() {
  for (const evt of ['mouseover', 'mouseenter', 'mousemove']) {
    document.addEventListener(evt, e => {
      if (e.target.closest('ytd-thumbnail')) e.stopImmediatePropagation();
    }, true);
  }
  const previewObserver = new MutationObserver(mutations => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeName === 'VIDEO' && node.closest('ytd-thumbnail')) {
          node.pause();
          node.remove();
        }
      }
    }
  });
  previewObserver.observe(document.documentElement, { childList: true, subtree: true });
}
