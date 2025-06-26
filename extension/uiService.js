(function() {
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

  window.UiService = { openModal };
})();
