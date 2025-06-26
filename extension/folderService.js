(function() {
  function renderFolders(folders, current, saveCurrent) {
    const container = document.getElementById('pm-folders');
    container.innerHTML = '';
    folders.slice(0,4).forEach(f => {
      const div = document.createElement('div');
      div.className = 'pm-folder';
      div.innerHTML = `
        <div>${f.icon || '📁'}</div>
        <div>${f.name}</div>`;
      div.addEventListener('click', () => openFolderForm(f, current, saveCurrent));
      container.appendChild(div);
    });
    if (folders.length > 4) {
      const more = document.createElement('div');
      more.className = 'pm-folder';
      more.textContent = '...';
      container.appendChild(more);
    }
  }

  function openFolderForm(folder, current, saveCurrent) {
    const f = folder || { icon: '📁' };
    const overlay = UiService.openModal(`
      <form id="pm-folder-form">
        <h3>${folder ? 'Edit' : 'New'} Folder</h3>
        <div class="pm-form-group">
          <label for="pm-folder-name">Name</label>
          <input type="text" id="pm-folder-name" value="${f.name || ''}" required />
        </div>
        <div class="pm-form-group">
          <label for="pm-folder-desc">Description</label>
          <input type="text" id="pm-folder-desc" value="${f.description || ''}" />
        </div>
        <div class="pm-form-group">
          <label for="pm-folder-icon">Icon</label>
          <input type="text" id="pm-folder-icon" value="${f.icon || '📁'}" />
        </div>
        <div class="pm-form-actions">
          <button type="submit">Save</button>
          <button type="button" id="pm-cancel-folder">Cancel</button>
        </div>
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

  window.FolderService = { renderFolders, openFolderForm };
})();
