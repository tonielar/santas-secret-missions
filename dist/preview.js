/* Imported HTML is untrusted. It never gets the app's origin or storage permissions. */
(() => {
  'use strict';
  let frame = null;
  let session = '';
  let creation = null;
  const feedback = () => document.getElementById('preview-feedback');
  const policy = [
    "default-src 'none'",
    "script-src 'unsafe-inline'", // Ordinary inline JavaScript; no external scripts or eval.
    "style-src 'unsafe-inline'",
    'img-src data: blob:',
    'font-src data:',
    'media-src data: blob:',
    "connect-src 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "worker-src 'none'",
    "manifest-src 'none'",
  ].join('; ');

  function prepare(html, token) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    // Do not permit automatic refresh navigations or external prefetch hints.
    doc.querySelectorAll('meta[http-equiv], base, link[rel="prefetch"], link[rel="preconnect"], link[rel="dns-prefetch"], link[rel="prerender"]').forEach(el => {
      if (el.tagName === 'META' && el.httpEquiv.toLowerCase() !== 'refresh') return;
      el.remove();
    });
    const csp = doc.createElement('meta');
    csp.httpEquiv = 'Content-Security-Policy';
    csp.content = policy;
    const charset = doc.createElement('meta');
    charset.setAttribute('charset', 'utf-8');
    // The policy is installed before ANY imported element or script is parsed in the frame.
    doc.head.prepend(csp);
    doc.head.prepend(charset);
    const monitor = doc.createElement('script');
    monitor.textContent = `(() => {
      const token = ${JSON.stringify(token)};
      const report = kind => parent.postMessage({ type: 'santa-preview-status', token, kind }, '*');
      addEventListener('error', () => report('limited'));
      addEventListener('unhandledrejection', () => report('limited'));
      addEventListener('securitypolicyviolation', () => report('limited'));
      addEventListener('DOMContentLoaded', () => report('ready'), { once: true });
      document.addEventListener('click', event => {
        const link = event.target.closest && event.target.closest('a[href]');
        if (link && !link.getAttribute('href').startsWith('#')) { event.preventDefault(); report('limited'); }
      }, true);
    })();`;
    csp.after(monitor);
    return '<!doctype html>\n' + doc.documentElement.outerHTML;
  }

  function cleanup() {
    if (frame) { frame.remove(); frame = null; }
    document.getElementById('preview-mount').replaceChildren();
    session = '';
    creation = null;
    document.getElementById('preview-dialog').classList.remove('expanded');
    document.getElementById('expand-preview').setAttribute('aria-pressed', 'false');
    document.getElementById('expand-preview').textContent = 'Expand';
  }

  function mount(record) {
    cleanup();
    creation = record;
    session = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    document.getElementById('preview-title').textContent = record.filename;
    feedback().textContent = 'Opening your creation…';
    frame = document.createElement('iframe');
    frame.title = `Interactive preview of ${record.filename}`;
    frame.id = 'creation-frame';
    // Never add allow-same-origin, top-navigation, popups or downloads here.
    frame.setAttribute('sandbox', 'allow-scripts allow-forms');
    frame.setAttribute('referrerpolicy', 'no-referrer');
    frame.setAttribute('allow', "camera 'none'; microphone 'none'; geolocation 'none'; accelerometer 'none'; gyroscope 'none'; magnetometer 'none'; clipboard-read 'none'; clipboard-write 'none'; payment 'none'; fullscreen 'none'; web-share 'none'");
    frame.srcdoc = prepare(record.html, session);
    document.getElementById('preview-mount').appendChild(frame);
  }

  window.addEventListener('message', event => {
    if (!frame || event.source !== frame.contentWindow || event.origin !== 'null') return;
    const data = event.data;
    if (!data || data.type !== 'santa-preview-status' || data.token !== session) return;
    // Messages can ONLY change explanatory text. Imported code never controls app data.
    if (data.kind === 'limited') {
      feedback().textContent = 'Part of this creation could not run here. This preview restricts internet, browser storage and device features. Try its ordinary buttons, or test the original file in a computer browser.';
      feedback().dataset.limited = 'true';
    } else if (data.kind === 'ready' && feedback().dataset.limited !== 'true') {
      feedback().textContent = 'Your creation is ready. Try it out!';
    }
  });
  document.getElementById('restart-preview').addEventListener('click', () => {
    if (!creation) return;
    const saved = creation;
    delete feedback().dataset.limited;
    mount(saved);
  });
  document.getElementById('expand-preview').addEventListener('click', () => {
    const expanded = document.getElementById('preview-dialog').classList.toggle('expanded');
    document.getElementById('expand-preview').setAttribute('aria-pressed', String(expanded));
    document.getElementById('expand-preview').textContent = expanded ? 'Restore size' : 'Expand';
  });
  document.getElementById('preview-dialog').addEventListener('close', cleanup);
  window.SantaPreview = Object.freeze({
    mount: record => { delete feedback().dataset.limited; mount(record); },
    cleanup,
  });
})();
