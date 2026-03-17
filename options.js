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

function showSaved() {
  const el = document.getElementById('saved');
  el.textContent = 'Saved. Reload YouTube to apply changes.';
  setTimeout(() => { el.textContent = ''; }, 3000);
}

chrome.storage.sync.get(DEFAULTS, settings => {
  for (const key of Object.keys(DEFAULTS)) {
    const el = document.getElementById(key);
    if (!el) continue;
    if (el.type === 'range') {
      el.value = settings[key];
      document.getElementById(key + 'Value').textContent = settings[key];
    } else {
      el.checked = settings[key];
    }
  }
});

document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
  checkbox.addEventListener('change', () => {
    chrome.storage.sync.set({ [checkbox.id]: checkbox.checked }, showSaved);
  });
});

document.querySelectorAll('input[type="range"]').forEach(slider => {
  slider.addEventListener('input', () => {
    document.getElementById(slider.id + 'Value').textContent = slider.value;
  });
  slider.addEventListener('change', () => {
    chrome.storage.sync.set({ [slider.id]: Number(slider.value) }, showSaved);
  });
});
