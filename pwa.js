/* Installation and updates. Notifications are deliberately not requested. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const TEST_MODE = document.body.dataset.mode === 'test';
  let installPrompt = null;
  let registration = null;
  let acceptingUpdate = false;
  let lastUpdateCheck = 0;

  function status(text) {
    $('offline-status').textContent = text;
    $('install-status').textContent = text;
  }
  window.addEventListener('beforeinstallprompt', event => {
    if (TEST_MODE) return;
    event.preventDefault();
    installPrompt = event;
    $('native-install').hidden = false;
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    $('native-install').hidden = true;
    status('Santa is on your Home Screen. Ready for your next invention!');
  });
  $('native-install').addEventListener('click', async () => {
    if (!installPrompt) return;
    try { await installPrompt.prompt(); await installPrompt.userChoice; }
    catch (_) { status('Use your browser’s Install app or Add to Home Screen option.'); }
    installPrompt = null;
    $('native-install').hidden = true;
  });

  function offerUpdate() {
    if (registration && registration.waiting && navigator.serviceWorker.controller) $('update-notice').hidden = false;
  }
  $('apply-update').addEventListener('click', () => {
    if (!registration || !registration.waiting) return;
    // Do not discard a running creation's unsaved interactions without an explicit choice.
    if ($('preview-dialog').open) {
      status('Return from your creation preview before updating the calendar. Your saved HTML file will stay safe.');
      $('update-notice').querySelector('span').textContent = 'Close your creation preview, then update. Saved files stay safe.';
      return;
    }
    acceptingUpdate = true;
    $('apply-update').disabled = true;
    $('apply-update').textContent = 'Updating…';
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  });

  if (TEST_MODE) {
    status('Test build · installation and offline caching use the production app.');
    return;
  }
  if (!('serviceWorker' in navigator) || !window.isSecureContext) {
    status('Open the HTTPS website to enable installation and offline access.');
    return;
  }
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (acceptingUpdate) location.reload();
  });
  async function register() {
    try {
      registration = await navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' });
      offerUpdate();
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => { if (worker.state === 'installed') offerUpdate(); });
      });
      await Promise.race([navigator.serviceWorker.ready, new Promise((_, reject) => setTimeout(() => reject(new Error('Offline setup timed out')), 12000))]);
      status('Ready offline · your workshop can travel with you.');
      registration.update().catch(() => {});
    } catch (_) {
      status('Calendar ready. Offline setup couldn’t finish — open it online again to retry.');
    }
  }
  register();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden || !registration || Date.now() - lastUpdateCheck < 300000) return;
    lastUpdateCheck = Date.now();
    registration.update().catch(() => {});
  });
})();
