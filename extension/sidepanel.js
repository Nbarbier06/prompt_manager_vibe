const promptListEl = document.getElementById('promptList');
const searchEl = document.getElementById('search');
const addPromptBtn = document.getElementById('addPromptBtn');
const importBtn = document.getElementById('importBtn');
const exportBtn = document.getElementById('exportBtn');
const promptFormContainer = document.getElementById('promptFormContainer');
const promptForm = document.getElementById('promptForm');
const formTitle = document.getElementById('formTitle');
const fileInput = document.getElementById('fileInput');

let prompts = [];

function savePrompts() {
  chrome.storage.local.set({prompts});
}

function loadPrompts() {
  chrome.storage.local.get('prompts', data => {
    prompts = data.prompts || [];
    renderPrompts();
  });
}

function renderPrompts(filter = '') {
  promptListEl.innerHTML = '';
  const filtered = prompts.filter(p =>
    p.title.toLowerCase().includes(filter) ||
    p.content.toLowerCase().includes(filter) ||
    (p.tags && p.tags.join(',').toLowerCase().includes(filter)) ||
    (p.folder && p.folder.toLowerCase().includes(filter))
  );
  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-title">${p.title}</div>
      <div>${p.folder ? 'Folder: ' + p.folder : ''}</div>
      <div class="card-tags">${p.tags ? p.tags.join(', ') : ''}</div>
      <div class="actions">
        <button class="paste">Paste</button>
        <button class="edit">Edit</button>
        <button class="delete">Delete</button>
        <button class="favorite">${p.favorite ? 'Unfavorite' : 'Favorite'}</button>
      </div>
    `;
    card.querySelector('.paste').addEventListener('click', () => insertPrompt(p.content));
    card.querySelector('.edit').addEventListener('click', () => openForm(p));
    card.querySelector('.delete').addEventListener('click', () => deletePrompt(p.id));
    card.querySelector('.favorite').addEventListener('click', () => toggleFavorite(p.id));
    promptListEl.appendChild(card);
  });
}

function openForm(prompt = null) {
  promptForm.reset();
  if (prompt) {
    formTitle.textContent = 'Edit Prompt';
    document.getElementById('promptId').value = prompt.id;
    document.getElementById('title').value = prompt.title;
    document.getElementById('content').value = prompt.content;
    document.getElementById('folder').value = prompt.folder || '';
    document.getElementById('tags').value = prompt.tags ? prompt.tags.join(',') : '';
    document.getElementById('favorite').checked = !!prompt.favorite;
  } else {
    formTitle.textContent = 'Add Prompt';
  }
  promptFormContainer.classList.remove('hidden');
}

function closeForm() {
  promptFormContainer.classList.add('hidden');
}

function deletePrompt(id) {
  prompts = prompts.filter(p => p.id !== id);
  savePrompts();
  renderPrompts(searchEl.value.toLowerCase());
}

function toggleFavorite(id) {
  const p = prompts.find(pr => pr.id === id);
  if (p) {
    p.favorite = !p.favorite;
    savePrompts();
    renderPrompts(searchEl.value.toLowerCase());
  }
}

function insertPrompt(text) {
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    const tab = tabs[0];
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: (txt) => {
        const textarea = document.querySelector('textarea');
        if (textarea) {
          textarea.value = txt;
          textarea.dispatchEvent(new Event('input', {bubbles: true}));
        }
      },
      args: [text]
    });
  });
}

promptForm.addEventListener('submit', e => {
  e.preventDefault();
  const id = document.getElementById('promptId').value || Date.now().toString();
  const newPrompt = {
    id,
    title: document.getElementById('title').value,
    content: document.getElementById('content').value,
    folder: document.getElementById('folder').value,
    tags: document.getElementById('tags').value.split(',').map(t => t.trim()).filter(Boolean),
    favorite: document.getElementById('favorite').checked
  };
  const existingIndex = prompts.findIndex(p => p.id === id);
  if (existingIndex >= 0) {
    prompts[existingIndex] = newPrompt;
  } else {
    prompts.push(newPrompt);
  }
  savePrompts();
  closeForm();
  renderPrompts(searchEl.value.toLowerCase());
});

addPromptBtn.addEventListener('click', () => openForm());
searchEl.addEventListener('input', () => renderPrompts(searchEl.value.toLowerCase()));

importBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const lines = reader.result.split('\n');
    lines.forEach(line => {
      const [title, content, folder, tags, favorite] = line.split(',');
      if (title && content) {
        prompts.push({
          id: Date.now().toString() + Math.random(),
          title,
          content,
          folder,
          tags: tags ? tags.split(';').map(t => t.trim()) : [],
          favorite: favorite === 'true'
        });
      }
    });
    savePrompts();
    renderPrompts(searchEl.value.toLowerCase());
  };
  reader.readAsText(file);
});

exportBtn.addEventListener('click', () => {
  const lines = prompts.map(p => [
    p.title,
    p.content,
    p.folder || '',
    (p.tags || []).join(';'),
    p.favorite
  ].join(','));
  const blob = new Blob([lines.join('\n')], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'prompts.csv';
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('cancelBtn').addEventListener('click', closeForm);

loadPrompts();
