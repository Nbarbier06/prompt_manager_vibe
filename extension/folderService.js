(function() {
<<<<<<< dmwoab-codex/séparer-la-sidebar-et-ajouter-filtres
  function renderFolders(
    folders,
    current,
    saveCurrent,
    selectedIds,
    onToggle,
    onEdit,
    collapsed
  ) {
    const container = document.getElementById('pm-folders');
    container.innerHTML = '';
    const toRender = collapsed ? folders.slice(0, 3) : folders;
    toRender.forEach(f => {
      const div = document.createElement('div');
      div.className = 'pm-folder';
      if (selectedIds.has(f.id)) div.classList.add('selected');
=======
  function renderFolders(folders, current, saveCurrent, selectedIds, toggle) {
    const container = document.getElementById('pm-folders');
    container.innerHTML = '';
    folders.forEach(f => {
      const div = document.createElement('div');
      div.className = 'pm-folder';
      if (selectedIds && selectedIds.includes(f.id)) div.classList.add('selected');
>>>>>>> main
      div.innerHTML = `
        <div>${f.icon || '📁'}</div>
        <div>${f.name}</div>
        <button class="pm-folder-edit" title="Edit">✎</button>`;
<<<<<<< dmwoab-codex/séparer-la-sidebar-et-ajouter-filtres
      div.querySelector('.pm-folder-edit').addEventListener('click', e => {
        e.stopPropagation();
        onEdit(f);
      });
      div.addEventListener('click', () => onToggle(f.id));
=======
      div.addEventListener('click', e => {
        if (e.target.classList.contains('pm-folder-edit')) return;
        toggle && toggle(f.id);
      });
      div.querySelector('.pm-folder-edit').addEventListener('click', e => {
        e.stopPropagation();
        openFolderForm(f, current, saveCurrent);
      });
>>>>>>> main
      container.appendChild(div);
    });
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
          ${folder ? '<button type="button" id="pm-delete-folder">Delete</button>' : ''}
          <button type="submit">Save</button>
          <button type="button" id="pm-cancel-folder">Cancel</button>
        </div>
      </form>
    `);
  overlay.querySelector('#pm-cancel-folder').onclick = () => overlay.remove();
  const deleteBtn = overlay.querySelector('#pm-delete-folder');
  if (deleteBtn) {
    deleteBtn.onclick = () => {
      if (confirm('Delete this folder?')) {
        current.folders = current.folders.filter(f => f !== folder);
        current.prompts.forEach(p => {
          if (p.folderIds) {
            p.folderIds = p.folderIds.filter(id => id !== folder.id);
          }
        });
        saveCurrent();
        overlay.remove();
      }
    };
  }
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
