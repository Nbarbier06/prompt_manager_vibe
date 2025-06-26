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

  function openModal(content) {
    const overlay = document.createElement('div');
    overlay.className = 'pm-modal-overlay';
    overlay.innerHTML = `<div class="pm-modal">${content}</div>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  function folderForm(data = {}) {
    return new Promise(resolve => {
      const overlay = openModal(`
        <h3>${data.id ? 'Edit Folder' : 'New Folder'}</h3>
        <input id="pm-f-name" placeholder="Name" value="${data.name || ''}" />
        <input id="pm-f-desc" placeholder="Description" value="${data.description || ''}" />
        <input id="pm-f-icon" placeholder="Icon" value="${data.icon || ''}" />
        <div class="pm-modal-actions">
          <button id="pm-f-cancel">Cancel</button>
          <button id="pm-f-save">Save</button>
        </div>`);
      overlay.querySelector('#pm-f-cancel').addEventListener('click', () => {
        overlay.remove();
        resolve(null);
      });
      overlay.querySelector('#pm-f-save').addEventListener('click', () => {
        const name = overlay.querySelector('#pm-f-name').value.trim();
        if (!name) return alert('Name required');
        const description = overlay.querySelector('#pm-f-desc').value.trim();
        const icon = overlay.querySelector('#pm-f-icon').value.trim();
        overlay.remove();
        resolve({ name, description, icon });
      });
    });
  }

  function promptForm(data = {}) {
    return new Promise(resolve => {
      const foldersHtml = current.folders.map(f => {
        const checked = (data.folderIds || []).includes(f.id) ? 'checked' : '';
        return `<label><input type="checkbox" value="${f.id}" ${checked}/> ${f.name}</label>`;
      }).join('');
      const overlay = openModal(`
        <h3>${data.id ? 'Edit Prompt' : 'New Prompt'}</h3>
        <input id="pm-p-name" placeholder="Name" value="${data.name || ''}" />
        <textarea id="pm-p-text" placeholder="Text">${data.text || ''}</textarea>
        <input id="pm-p-desc" placeholder="Description" value="${data.description || ''}" />
        <input id="pm-p-tags" placeholder="Tags" value="${(data.tags || []).join(', ')}" />
        <div class="pm-folder-select">${foldersHtml}</div>
        <div class="pm-modal-actions">
          <button id="pm-p-cancel">Cancel</button>
          <button id="pm-p-save">Save</button>
        </div>`);
      overlay.querySelector('#pm-p-cancel').addEventListener('click', () => {
        overlay.remove();
        resolve(null);
      });
      overlay.querySelector('#pm-p-save').addEventListener('click', () => {
        const name = overlay.querySelector('#pm-p-name').value.trim();
        const text = overlay.querySelector('#pm-p-text').value.trim();
        if (!name || !text) return alert('Name and text required');
        const description = overlay.querySelector('#pm-p-desc').value.trim();
        const tags = overlay.querySelector('#pm-p-tags').value
          .split(',')
          .map(t => t.trim())
          .filter(Boolean);
        const folderIds = Array.from(overlay.querySelectorAll('.pm-folder-select input:checked')).map(i => i.value);
        overlay.remove();
        resolve({ name, text, description, tags, folderIds });
      });
    });
  }

  // Utilities
  function loadData() {
    return new Promise(resolve => {
      chrome.storage.local.get(['folders', 'prompts'], data => {
        const folders = data.folders || [];
        const prompts = (data.prompts || []).map(p => {
          if (!p.folderIds) {
            p.folderIds = p.folderId ? [p.folderId] : [];
          }
          return p;
        });
        resolve({ folders, prompts });
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
      div.innerHTML = `<div>${f.icon || '📁'}</div><div>${f.name}</div>`;
      div.addEventListener('click', async () => {
        const res = await folderForm(f);
        if (!res) return;
        f.name = res.name;
        f.description = res.description;
        f.icon = res.icon;
        saveCurrent();
      });
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
      card.querySelector('[data-action="edit"]').addEventListener('click', async () => {
        const res = await promptForm(p);
        if (!res) return;
        p.name = res.name;
        p.description = res.description;
        p.text = res.text;
        p.tags = res.tags;
        p.folderIds = res.folderIds;
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

  document.getElementById('pm-new-folder').addEventListener('click', async () => {
    const res = await folderForm();
    if (!res) return;
    const id = Date.now().toString();
    current.folders.push({ id, name: res.name, description: res.description, icon: res.icon });
    saveCurrent();
  });

  document.getElementById('pm-new-prompt').addEventListener('click', async () => {
    const res = await promptForm();
    if (!res) return;
    const id = Date.now().toString();
    current.prompts.push({
      id,
      name: res.name,
      description: res.description,
      text: res.text,
      tags: res.tags,
      folderIds: res.folderIds,
      favorite: false
    });
    saveCurrent();
  });
})();
