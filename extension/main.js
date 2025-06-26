(function() {
  const toggleBtn = document.createElement('div');
  toggleBtn.id = 'pm-toggle-btn';
  toggleBtn.textContent = 'Prompts';
  toggleBtn.setAttribute('aria-label', 'Toggle prompt manager sidebar');
  toggleBtn.setAttribute('aria-controls', 'pm-sidebar');
  toggleBtn.setAttribute('title', 'Toggle prompt manager sidebar');
  toggleBtn.setAttribute('tabindex', '0');
  toggleBtn.setAttribute('aria-expanded', 'false');
  document.body.appendChild(toggleBtn);

  const SIDEBAR_WIDTH = 300;

  function updateTogglePosition() {
    toggleBtn.style.right = sidebar.classList.contains('open') ? `${SIDEBAR_WIDTH}px` : '0';
  }

  const sidebar = document.createElement('div');
  sidebar.id = 'pm-sidebar';
  sidebar.setAttribute('role', 'complementary');
  sidebar.innerHTML = `
    <div class="pm-header">
      <h1>Prompt Manager</h1>
      <button id="pm-settings-btn" class="pm-settings-icon" aria-label="Settings" title="Settings">⚙</button>
    </div>
    <div class="pm-section">
      <input type="text" placeholder="Search" aria-label="Search prompts" class="pm-search" id="pm-search" />
    </div>
    <div class="pm-section">
      <div class="pm-actions">
        <button id="pm-new-folder">New Folder</button>
        <button id="pm-new-prompt">New Prompt</button>
      </div>
      <div class="pm-folder-list" id="pm-folders"></div>
      <div class="pm-folder-toggle" id="pm-folder-toggle" tabindex="0" aria-label="More folders">▼</div>
    </div>
    <div class="pm-section">
      <div class="pm-prompt-list" id="pm-prompts"></div>
    </div>
  `;
  document.body.appendChild(sidebar);
  updateTogglePosition();

  const folderToggle = document.getElementById('pm-folder-toggle');

  function toggleFolderList() {
    foldersCollapsed = !foldersCollapsed;
    render();
  }

  folderToggle.addEventListener('click', toggleFolderList);
  folderToggle.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleFolderList();
    }
  });

  function toggleSidebar() {
    sidebar.classList.toggle('open');
    const expanded = sidebar.classList.contains('open');
    toggleBtn.setAttribute('aria-expanded', expanded.toString());
    updateTogglePosition();
    if (!expanded) {
      toggleBtn.focus();
    }
  }

  toggleBtn.addEventListener('click', toggleSidebar);
  toggleBtn.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSidebar();
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
      toggleSidebar();
    }
  });

  let current = { folders: [], prompts: [] };
  const selectedFolders = new Set();
  let foldersCollapsed = true;

  function toggleFolderSelection(id) {
    if (selectedFolders.has(id)) {
      selectedFolders.delete(id);
    } else {
      selectedFolders.add(id);
    }
    render();
  }

  function saveCurrent() {
    StorageService.saveData(current.folders, current.prompts);
    render();
  }

  function render() {
    FolderService.renderFolders(
      current.folders,
      current,
      saveCurrent,
      selectedFolders,
      toggleFolderSelection,
      openFolderForm,
      foldersCollapsed
    );
    const toggle = document.getElementById('pm-folder-toggle');
    if (current.folders.length > 3) {
      toggle.style.display = 'block';
      toggle.textContent = foldersCollapsed ? '▼' : '▲';
    } else {
      toggle.style.display = 'none';
    }
    const term = document.getElementById('pm-search').value.toLowerCase();
    let filtered = current.prompts.filter(
      p =>
        p.name.toLowerCase().includes(term) ||
        p.text.toLowerCase().includes(term)
    );
    if (selectedFolders.size > 0) {
      filtered = filtered.filter(p =>
        p.folderIds && p.folderIds.some(id => selectedFolders.has(id))
      );
    }
    PromptService.renderPrompts(filtered, current, saveCurrent);
  }

  function openFolderForm(folder) {
    FolderService.openFolderForm(folder, current, saveCurrent);
  }

  function openPromptForm(prompt) {
    PromptService.openPromptForm(prompt, current, saveCurrent);
  }

  StorageService.loadData().then(data => {
    current = data;
    render();
  });

  document.getElementById('pm-search').addEventListener('input', render);

  document.getElementById('pm-settings-btn').addEventListener('click', () => {
    if (confirm('Export prompts to JSON?')) {
      const blob = new Blob([JSON.stringify(current)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'prompts.json';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = () => {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const data = JSON.parse(reader.result);
            current = data;
            saveCurrent();
          } catch (err) {
            alert('Invalid file');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    }
  });

  document.getElementById('pm-new-folder').addEventListener('click', () => openFolderForm());
  document.getElementById('pm-new-prompt').addEventListener('click', () => openPromptForm());
})();
