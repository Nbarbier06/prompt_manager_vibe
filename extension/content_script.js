(function() {
  if (window.hasPromptManager) return;
  window.hasPromptManager = true;

  const sidebarUrl = chrome.runtime.getURL('sidebar.html');

  const sidebar = document.createElement('iframe');
  sidebar.src = sidebarUrl;
  sidebar.style.position = 'fixed';
  sidebar.style.top = '0';
  sidebar.style.right = '0';
  sidebar.style.width = '350px';
  sidebar.style.height = '100%';
  sidebar.style.border = 'none';
  sidebar.style.zIndex = '100000';
  sidebar.style.display = 'none';
  document.body.appendChild(sidebar);

  const toggleButton = document.createElement('button');
  toggleButton.textContent = 'Prompts';
  toggleButton.id = 'prompt-manager-toggle';
  Object.assign(toggleButton.style, {
    position: 'fixed',
    top: '50%',
    right: '10px',
    zIndex: 100001,
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #888',
    background: '#fff',
    cursor: 'pointer'
  });
  toggleButton.addEventListener('click', () => {
    sidebar.style.display = sidebar.style.display === 'none' ? 'block' : 'none';
  });
  document.body.appendChild(toggleButton);
})();
