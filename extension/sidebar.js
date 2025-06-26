const searchInput = document.getElementById('search');
const folderList = document.getElementById('folder-list');
const promptContainer = document.getElementById('prompts');
const importBtn = document.getElementById('import');
const exportBtn = document.getElementById('export');
let prompts = [];
let folders = [];
let currentFolder = null;

function loadData() {
  chrome.storage.local.get(['prompts', 'folders'], data => {
    prompts = data.prompts || [];
    folders = data.folders || [];
    renderFolders();
    renderPrompts();
  });
}

function saveData() {
  chrome.storage.local.set({ prompts, folders });
}

function renderFolders() {
  folderList.innerHTML = '';
  folders.slice(0, 5).forEach(f => {
    const div = document.createElement('div');
    div.className = 'folder';
    div.innerHTML = `<span>📁</span><span>${f.name}</span>`;
    div.addEventListener('click', () => {
      currentFolder = f.id;
      renderPrompts();
    });
    folderList.appendChild(div);
  });
}

function renderPrompts() {
  const term = searchInput.value.toLowerCase();
  promptContainer.innerHTML = '';
  prompts
    .filter(p => (!currentFolder || p.folderId === currentFolder))
    .filter(p => p.title.toLowerCase().includes(term) || p.description.toLowerCase().includes(term))
    .forEach(p => {
      const card = document.createElement('div');
      card.className = 'prompt-card';
      card.innerHTML = `
        <div class="card-title">${p.title}</div>
        <div class="card-desc">${p.description.split('\n')[0]}</div>
        <div class="card-actions">
          <button class="edit">Edit</button>
          <button class="fav">${p.favorite ? '★' : '☆'}</button>
          <button class="delete">Delete</button>
        </div>`;
      card.querySelector('.card-title').addEventListener('click', () => pastePrompt(p));
      card.querySelector('.edit').addEventListener('click', () => editPrompt(p));
      card.querySelector('.fav').addEventListener('click', e => toggleFavorite(p, e));
      card.querySelector('.delete').addEventListener('click', () => deletePrompt(p));
      promptContainer.appendChild(card);
    });
}

function pastePrompt(p) {
  const textarea = window.top.document.querySelector('textarea');
  if (textarea) {
    textarea.value = p.description;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function editPrompt(p) {
  const title = prompt('Title', p.title);
  if (title === null) return;
  const desc = prompt('Prompt', p.description);
  if (desc === null) return;
  p.title = title;
  p.description = desc;
  saveData();
  renderPrompts();
}

function toggleFavorite(p, e) {
  p.favorite = !p.favorite;
  e.target.textContent = p.favorite ? '★' : '☆';
  saveData();
}

function deletePrompt(p) {
  if (confirm('Delete prompt?')) {
    prompts = prompts.filter(x => x.id !== p.id);
    saveData();
    renderPrompts();
  }
}

searchInput.addEventListener('input', renderPrompts);
importBtn.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.addEventListener('change', () => {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const data = JSON.parse(reader.result);
      prompts = data.prompts || prompts;
      folders = data.folders || folders;
      saveData();
      renderFolders();
      renderPrompts();
    };
    reader.readAsText(file);
  });
  input.click();
});

exportBtn.addEventListener('click', () => {
  const data = { prompts, folders };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'prompts.json';
  a.click();
  URL.revokeObjectURL(url);
});

loadData();
