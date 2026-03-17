const toggle = document.getElementById('masterToggle');
const status = document.getElementById('status');

chrome.storage.sync.get({ enabled: true }, data => {
  toggle.checked = data.enabled;
  updateStatus(data.enabled);
});

toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  updateStatus(enabled);
  chrome.storage.sync.set({ enabled }, () => {
    // Reload any open YouTube tabs so the change takes effect immediately
    chrome.tabs.query({ url: '*://www.youtube.com/*' }, tabs => {
      tabs.forEach(tab => chrome.tabs.reload(tab.id));
    });
  });
});

document.getElementById('settingsLink').addEventListener('click', e => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

function updateStatus(enabled) {
  status.textContent = enabled ? 'Active' : 'Paused';
  status.style.color = enabled ? '#4caf50' : '#888';
}
