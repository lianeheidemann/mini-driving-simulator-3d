// Requests real browser fullscreen instead of A-Frame's stereo VR split view.
document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('#fullscreen-button');
  if (!button) return;

  const update = () => {
    const active = Boolean(document.fullscreenElement);
    button.textContent = active ? '⤡' : '⤢';
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', active ? 'Sair da tela cheia' : 'Tela cheia');
    document.body.classList.toggle('is-fullscreen', active);
  };

  button.addEventListener('click', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      // navigationUI: 'hide' asks the browser to also hide its own address
      // bar/toolbar, not just expand the page, where that hint is supported.
      document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => {});
    }
  });
  document.addEventListener('fullscreenchange', update);
  update();
});
