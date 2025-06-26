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
    toggleBtn.style.right = sidebar.classList.contains('open')
      ? `${SIDEBAR_WIDTH}px`
      : '0';
  }

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
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.remove();
    });
    return overlay;
  }

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
      div.innerHTML = `
        <div>${f.icon || '📁'}</div>
        <div>${f.name}</div>`;
      div.addEventListener('click', () => openFolderForm(f));
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
        if (e.target.tagName === 'BUTTON') return;
        insertPrompt(p.text);
      });
      card.querySelector('[data-action="fav"]').addEventListener('click', () => {
        p.favorite = !p.favorite;
        saveCurrent();
      });
      card.querySelector('[data-action="edit"]').addEventListener('click', () => {
        openPromptForm(p);

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
    const filtered = current.prompts.filter(p =>
      p.name.toLowerCase().includes(term) || p.text.toLowerCase().includes(term)
    );
    renderPrompts(filtered);
  }

  function openFolderForm(folder) {
    const f = folder || { icon: '📁' };
    const overlay = openModal(`
      <form id="pm-folder-form">
        <h3>${folder ? 'Edit' : 'New'} Folder</h3>
        <input type="text" id="pm-folder-name" placeholder="Name" value="${f.name || ''}" required />
        <input type="text" id="pm-folder-desc" placeholder="Description" value="${f.description || ''}" />
        <input type="text" id="pm-folder-icon" placeholder="Icon" value="${f.icon || '📁'}" />
        <button type="submit">Save</button>
        <button type="button" id="pm-cancel-folder">Cancel</button>
      </form>
    `);
    overlay.querySelector('#pm-cancel-folder').onclick = () => overlay.remove();
    overlay.querySelector('#pm-folder-form').onsubmit = e => {
      e.preventDefault();
      const name = overlay.querySelector('#pm-folder-name').value.trim();
      if (!name) return;
      const desc = overlay.querySelector('#pm-folder-desc').value.trim();
      const icon = overlay.querySelector('#pm-folder-icon').value.trim() || '📁';
      if (folder) {
        folder.name = name;
        folder.description = desc;
        folder.icon = icon;
      } else {
        const id = Date.now().toString();
        current.folders.push({ id, name, description: desc, icon });
      }
      saveCurrent();
      overlay.remove();
    };
  }

  function openPromptForm(prompt) {
    const p = prompt || { folderIds: [] };
    const foldersHtml = current.folders
      .map(
        f => `<label><input type="checkbox" class="pm-folder-choice" value="${f.id}" ${p.folderIds && p.folderIds.includes(f.id) ? 'checked' : ''}/> ${f.name}</label>`
      )
      .join('<br/>');
    const overlay = openModal(`
      <form id="pm-prompt-form">
        <h3>${prompt ? 'Edit' : 'New'} Prompt</h3>
        <input type="text" id="pm-prompt-name" placeholder="Name" value="${p.name || ''}" required />
        <textarea id="pm-prompt-desc" placeholder="Description">${p.description || ''}</textarea>
        <textarea id="pm-prompt-text" placeholder="Text" required>${p.text || ''}</textarea>
        <input type="text" id="pm-prompt-tags" placeholder="Tags" value="${(p.tags || []).join(',')}" />
        <div style="margin-bottom:8px;">${foldersHtml}</div>
        <button type="submit">Save</button>
        <button type="button" id="pm-cancel-prompt">Cancel</button>
      </form>
    `);
    overlay.querySelector('#pm-cancel-prompt').onclick = () => overlay.remove();
    overlay.querySelector('#pm-prompt-form').onsubmit = e => {
      e.preventDefault();
      const name = overlay.querySelector('#pm-prompt-name').value.trim();
      if (!name) return;
      const desc = overlay.querySelector('#pm-prompt-desc').value.trim();
      const text = overlay.querySelector('#pm-prompt-text').value.trim();
      if (!text) return;
      const tags = overlay
        .querySelector('#pm-prompt-tags')
        .value.split(',')
        .map(t => t.trim())
        .filter(Boolean);
      const folderIds = Array.from(overlay.querySelectorAll('.pm-folder-choice:checked')).map(el => el.value);
      if (prompt) {
        prompt.name = name;
        prompt.description = desc;
        prompt.text = text;
        prompt.tags = tags;
        prompt.folderIds = folderIds;
      } else {
        const id = Date.now().toString();
        current.prompts.push({ id, name, description: desc, text, tags, folderIds, favorite: false });
      }
      saveCurrent();
      overlay.remove();
    };
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
