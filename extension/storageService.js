(function() {
  function loadData() {
    return new Promise(resolve => {
      chrome.storage.local.get(['folders', 'prompts'], data => {
        const folders = data.folders || [];
        const prompts = (data.prompts || []).map(p => {
          if (!p.folderIds) p.folderIds = p.folderId ? [p.folderId] : [];
          return p;
        });
        resolve({ folders, prompts });
      });
    });
  }

  function saveData(folders, prompts) {
    chrome.storage.local.set({ folders, prompts });
  }

  window.StorageService = { loadData, saveData };
})();
