(function () {
  const viewButtons = document.querySelectorAll('[data-view-target]');
  const views = document.querySelectorAll('[data-view]');

  function setView(name) {
    viewButtons.forEach((button) => {
      const active = button.dataset.viewTarget === name;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    views.forEach((view) => view.classList.toggle('active', view.dataset.view === name));
    const url = new URL(window.location.href);
    url.searchParams.set('view', name);
    window.history.replaceState({}, '', url);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  viewButtons.forEach((button) => button.addEventListener('click', () => setView(button.dataset.viewTarget)));

  document.querySelectorAll('.segmented').forEach((group) => {
    group.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      group.querySelectorAll('button').forEach((item) => item.classList.toggle('active', item === button));
    });
  });

  document.querySelectorAll('.a-choice-grid, .b-choice-row, .c-choice-list').forEach((group) => {
    group.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      group.querySelectorAll('button').forEach((item) => item.classList.toggle('active', item === button));
    });
  });

  const requestedView = new URLSearchParams(window.location.search).get('view');
  if (requestedView && document.querySelector(`[data-view="${requestedView}"]`)) setView(requestedView);
})();
