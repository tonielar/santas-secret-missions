import { getCopy } from './language.js';
import { makeInterface, icon } from './interface.js';
import { createAudio } from './audio.js';

const classic = () => {
  const url = new URL(location.href);
  url.searchParams.set('view', 'classic');
  location.assign(url.href);
};
function fallback() {
  document.body.classList.remove('village-pending', 'village-on');
  document.getElementById('paper-village')?.remove();
  window.VillageCalendar?.resumeWelcome();
}
async function start() {
  if (!document.body.classList.contains('village-pending')) {
    if (location.protocol !== 'file:' && new URLSearchParams(location.search).get('view') === 'classic') {
      const back = document.createElement('a'),
        url = new URL(location.href);
      url.searchParams.delete('view');
      back.href = url.href;
      back.className = 'soft-btn';
      back.textContent = getCopy(window.SantaI18n.lang).village;
      document.querySelector('.top-actions').prepend(back);
    }
    return;
  }
  const api = window.VillageCalendar,
    lang = window.SantaI18n.lang,
    c = getCopy(lang);
  const { createWorld } = await import('./world.js');
  const ui = makeInterface(c, lang),
    speakers = [];
  let world;
  const audio = createAudio((enabled) => {
    for (const b of speakers) {
      b.innerHTML = icon(enabled ? 'sound' : 'mute');
      b.setAttribute('aria-label', enabled ? c.audible : c.muted);
      b.title = enabled ? c.audible : c.muted;
      b.setAttribute('aria-pressed', String(enabled));
    }
  });
  function speaker(button) {
    speakers.push(button);
    button.innerHTML = icon('mute');
    button.title = c.muted;
    button.setAttribute('aria-label', c.muted);
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', audio.toggle);
  }
  speaker(ui.shell.querySelector('.v-speaker'));
  document.querySelectorAll('dialog').forEach((d) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dialog-sound';
    speaker(b);
    d.prepend(b);
  });
  const toast = api.toast;
  function action(cmd) {
    if (cmd === 'sound') return;
    if (cmd === 'close') {
      document.querySelector('dialog.v-pop[open]')?.close();
      return;
    }
    if (cmd === 'languages' || cmd === 'menu') {
      ui.menu.showModal();
      if (cmd === 'languages') ui.menu.querySelector('[aria-pressed="true"]').focus();
      return;
    }
    if (ui.menu.open) ui.menu.close();
    switch (cmd) {
      case 'home':
        world.navigate(0, true);
        break;
      case 'prev':
        world.navigate(-1);
        break;
      case 'next':
        world.navigate(1);
        break;
      case 'story':
        if (!api.resumeWelcome()) api.openIntro();
        break;
      case 'rules':
        api.openRules();
        break;
      case 'help':
      case 'guide':
        ui.guide.showModal();
        break;
      case 'install':
        api.install();
        break;
      case 'classic':
        classic();
        break;
      case 'fresh': {
        const n = Number(document.getElementById('open-next-mission').dataset.mission);
        if (n) {
          world.navigate(n, true);
          world.activate(n);
        }
        break;
      }
      case 'enter':
        if (world.stop) world.activate(world.stop);
        else if (!api.resumeWelcome()) world.navigate(1, true);
        break;
      case 'exit-test':
        document.getElementById('exit-test-mode').click();
        break;
    }
  }
  for (const scope of [ui.shell, ui.menu, ui.guide])
    scope.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.do) action(b.dataset.do);
      if (b.dataset.stop !== undefined) world.navigate(Number(b.dataset.stop), true);
      if (b.dataset.code) {
        if (b.dataset.code === lang) {
          ui.menu.close();
          return;
        }
        document.querySelector('#classic-view [data-lang="' + b.dataset.code + '"]')?.click();
      }
    });
  if (api.test) {
    const b = document.createElement('button');
    b.dataset.do = 'exit-test';
    b.textContent = c.test + ' · ' + c.leaveTest;
    ui.menu.querySelector('.v-menu-items').appendChild(b);
  }
  // The original owner's footer gesture remains reachable from the route footer.
  const secret = ui.shell.querySelector('.v-foot>span');
  secret.addEventListener('click', () => document.getElementById('tester-secret').click());
  function noticeFallback() {
    if (document.getElementById('v-lite')) return;
    const b = document.createElement('button');
    b.id = 'v-lite';
    b.textContent = c.classic + ' ↗';
    b.addEventListener('click', classic);
    ui.shell.querySelector('.v-foot').prepend(b);
  }
  world = createWorld(document.querySelector('#v-canvas'), lang, {
    effect: audio.effect,
    stop: ui.show,
    action,
    slow: noticeFallback,
    fallback: classic,
    enter: api.openMission,
    needsWelcome: api.resumeWelcome,
    locked: (n) => {
      const s = api.status(n);
      toast(
        c.mission +
          ' ' +
          String(n).padStart(2, '0') +
          ' · ' +
          c.date +
          ' ' +
          new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric' }).format(s.date),
      );
    },
  });
  document.body.classList.replace('village-pending', 'village-on');
  ui.show(0);
  window.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || document.querySelector('dialog[open]')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      world.navigate(e.key === 'ArrowRight' ? 1 : -1);
    }
  });
  document.getElementById('mission-dialog').addEventListener('close', () => world.leave());
  window.addEventListener('village-state', () => {
    world.sync();
    ui.show(world.stop);
  });
  window.addEventListener('village-celebration', () => world.celebrate());
  // Onboarding returns to the first stop that the visitor can explore.
  let firstJourney = false;
  document.getElementById('start-button').addEventListener('click', () => (firstJourney = true));
  document.getElementById('rules-next').addEventListener('click', () => {
    if (firstJourney) {
      firstJourney = false;
      world.navigate(1, true);
    }
  });
  const notices = document.querySelector('.app-notices');
  if (notices) {
    const freshButton = document.createElement('button');
    freshButton.className = 'v-fresh';
    freshButton.dataset.do = 'fresh';
    ui.shell
      .querySelector('.v-foot')
      .insertBefore(freshButton, ui.shell.querySelector('.v-foot>span:last-child'));
    ui.menu.append(document.getElementById('finale'));
    const copyNotice = () => {
      const fresh = document.querySelector('#new-mission-notice');
      freshButton.hidden = fresh.hidden;
      freshButton.textContent = document.getElementById('new-mission-text').textContent;
    };
    new MutationObserver(copyNotice).observe(notices, { subtree: true, attributes: true, childList: true });
    copyNotice();
    // Keep the original explicit update prompt and persistent-storage warning reachable.
    for (const id of ['storage-warning', 'update-notice']) ui.shell.append(document.getElementById(id));
  }
}
if (document.readyState === 'loading')
  window.addEventListener(
    'DOMContentLoaded',
    () =>
      start().catch((e) => {
        console.error('Village:', e);
        fallback();
      }),
    { once: true },
  );
else if (!window.VillageCalendar)
  window.addEventListener('DOMContentLoaded', () => start().catch(fallback), { once: true });
else
  start().catch((e) => {
    console.error('Village:', e);
    fallback();
  });
