document.addEventListener('DOMContentLoaded', () => {
  const openBtn = document.getElementById('openPanel');
  const closeBtn = document.getElementById('closePanel');

  openBtn.addEventListener('click', () => {
    chrome.sidePanel
      .setOptions({ path: 'sidepanel.html', enabled: true })
      .then(() => {
        chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
      })
      .catch((err) => console.error('Failed to open side panel', err));
  });

  closeBtn.addEventListener('click', () => {
    chrome.sidePanel
      .close({ windowId: chrome.windows.WINDOW_ID_CURRENT })
      .catch((err) => console.error('Failed to close side panel', err));
  });
});
