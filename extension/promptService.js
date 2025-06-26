(function() {
  function insertPrompt(text) {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;
    textarea.value = text;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.focus();
  }

  function renderPrompts(prompts, current, saveCurrent) {
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
        openPromptForm(p, current, saveCurrent);
      });
      card.querySelector('[data-action="del"]').addEventListener('click', () => {
        current.prompts = current.prompts.filter(x => x.id !== p.id);
        saveCurrent();
      });
      container.appendChild(card);
    });
  }

  function openPromptForm(prompt, current, saveCurrent) {
    const p = prompt || { folderIds: [] };
    const foldersHtml = current.folders
      .map(f => `<label><input type="checkbox" class="pm-folder-choice" value="${f.id}" ${p.folderIds && p.folderIds.includes(f.id) ? 'checked' : ''}/> ${f.name}</label>`)
      .join('<br/>');
    const overlay = UiService.openModal(`
      <form id="pm-prompt-form">
        <h3>${prompt ? 'Edit' : 'New'} Prompt</h3>
        <label for="pm-prompt-name">Name</label>
        <input type="text" id="pm-prompt-name" value="${p.name || ''}" required />
        <label for="pm-prompt-desc">Description</label>
        <textarea id="pm-prompt-desc">${p.description || ''}</textarea>
        <label for="pm-prompt-text">Text</label>
        <textarea id="pm-prompt-text" required>${p.text || ''}</textarea>
        <label for="pm-prompt-tags">Tags</label>
        <input type="text" id="pm-prompt-tags" value="${(p.tags || []).join(',')}" />
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

  window.PromptService = { renderPrompts, openPromptForm, insertPrompt };
})();
