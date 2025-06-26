(function() {
  // Create toggle button
  const toggleBtn = document.createElement('button');
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
    toggleBtn.style.right = sidebar.classList.contains('open')
      ? `${SIDEBAR_WIDTH}px`
      : '0';
  }

  // Create sidebar
  const sidebar = document.createElement('div');
  sidebar.id = 'pm-sidebar';
  sidebar.setAttribute('role', 'complementary');
  sidebar.innerHTML = `
    <div class="pm-header"><h1>Prompt Manager</h1></div>
    <input type="text" placeholder="Search" aria-label="Search prompts" class="pm-search" id="pm-search" />
    <div class="pm-actions">
      <button id="pm-new-folder">New Folder</button>
      <button id="pm-new-prompt">New Prompt</button>
    </div>
    <div class="pm-folder-list" id="pm-folders"></div>
    <div class="pm-prompt-list" id="pm-prompts"></div>
    <div id="pm-settings-btn">Settings</div>
  `;
  document.body.appendChild(sidebar);
  updateTogglePosition();

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

  // Utilities
  function loadData() {
    return new Promise(resolve => {
      chrome.storage.local.get(['folders', 'prompts'], data => {
        resolve({
          folders: data.folders || [],
          prompts: data.prompts || []
        });
      });
    });
  }

  function saveData(folders, prompts) {
    chrome.storage.local.set({ folders, prompts });
  }

  function renderFolders(folders) {
    const container = document.getElementById('pm-folders');
    container.innerHTML = '';
    folders.slice(0,4).forEach(f => {
      const div = document.createElement('div');
      div.className = 'pm-folder';
      div.textContent = f.name;
      container.appendChild(div);
    });
    if (folders.length > 4) {
      const more = document.createElement('div');
      more.className = 'pm-folder';
      more.textContent = '...';
      container.appendChild(more);
    }
  }

  function renderPrompts(prompts) {
    const container = document.getElementById('pm-prompts');
    container.innerHTML = '';
    prompts.forEach(p => {
      const card = document.createElement('div');
      card.className = 'pm-card';
      card.innerHTML = `
        <div class="pm-card-header">
          <strong>${p.name}</strong>
          <span class="pm-card-actions">
            <button data-action="fav">${p.favorite ? '★' : '☆'}</button>
            <button data-action="edit">✎</button>
            <button data-action="del">🗑</button>
          </span>
        </div>
        <div class="pm-card-body">${(p.description || p.text).substring(0, 60)}...</div>
      `;
      card.addEventListener('click', e => {
        if (e.target.tagName === 'BUTTON') return; // ignore button clicks
        insertPrompt(p.text);
      });
      card.querySelector('[data-action="fav"]').addEventListener('click', () => {
        p.favorite = !p.favorite;
        saveCurrent();
      });
      card.querySelector('[data-action="edit"]').addEventListener('click', () => {
        const newName = prompt('Prompt name', p.name);
        if (!newName) return;
        const newDesc = prompt('Prompt description', p.description || '');
        const newText = prompt('Prompt text', p.text);
        if (!newText) return;
        const newTags = prompt('Tags (comma separated)', (p.tags || []).join(', ')) || '';
        const newFolder = prompt('Folder id (leave empty for none)', p.folderId || '') || '';
        p.name = newName;
        p.description = newDesc || '';
        p.text = newText;
        p.tags = newTags.split(',').map(t => t.trim()).filter(Boolean);
        p.folderId = newFolder;
        saveCurrent();
      });
      card.querySelector('[data-action="del"]').addEventListener('click', () => {
        current.prompts = current.prompts.filter(x => x.id !== p.id);
        saveCurrent();
      });
      container.appendChild(card);
    });
  }

  function insertPrompt(text) {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;
    textarea.value = text;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.focus();
  }

  let current = { folders: [], prompts: [] };

  function saveCurrent() {
    saveData(current.folders, current.prompts);
    render();
  }

  function render() {
    renderFolders(current.folders);
    const term = document.getElementById('pm-search').value.toLowerCase();
    const filtered = current.prompts.filter(p => p.name.toLowerCase().includes(term) || p.text.toLowerCase().includes(term));
    renderPrompts(filtered);
  }

  loadData().then(data => {
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
          } catch(err) {
            alert('Invalid file');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    }
  });

  document.getElementById('pm-new-folder').addEventListener('click', () => {
    const name = prompt('Folder name');
    if (!name) return;
    const description = prompt('Folder description') || '';
    const id = Date.now().toString();
    current.folders.push({ id, name, description });
    saveCurrent();
  });

  document.getElementById('pm-new-prompt').addEventListener('click', () => {
    const name = prompt('Prompt name');
    if (!name) return;
    const description = prompt('Prompt description') || '';
    const text = prompt('Prompt text');
    if (!text) return;
    const tagsInput = prompt('Tags (comma separated)') || '';
    const folderId = prompt('Folder id (leave empty for none)') || '';
    const id = Date.now().toString();
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    current.prompts.push({
      id,
      name,
      description,
      text,
      tags,
      folderId,
      favorite: false
    });
    saveCurrent();
  });
})();
