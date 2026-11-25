const paths = {
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H5m6 6-6-6 6-6"/>',
  sound: '<path d="M11 4 6 8H3v8h3l5 4zM15 8q4 4 0 8m3-11q7 7 0 14"/>',
  mute: '<path d="M11 4 6 8H3v8h3l5 4zM16 9l6 6m0-6-6 6"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.7 8.3-2.2 5.2-5.2 2.2 2.2-5.2z"/>',
  map: '<path d="m2 5 6-2 8 3 6-2v15l-6 2-8-3-6 2zM8 3v15m8-12v15"/>',
  book: '<path d="M12 6C8 3 5 3 2 4v14c3-1 6-1 10 2 4-3 7-3 10-2V4c-3-1-6-1-10 2zm0 0v14"/>',
  star: '<path d="m12 2 2.9 6.3 7 .8-5.2 4.9 1.5 7-6.2-3.6L5.8 21l1.4-7L2 9l7.1-.7z"/>',
  sparkle: '<path d="m12 1 2.3 8.6L23 12l-8.7 2.3L12 23l-2.3-8.7L1 12l8.7-2.4z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4.4" ry="9"/><path d="M3 12h18"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  menu: '<path d="M3 8h18M3 15h18"/>',
  home: '<path d="m3 12 9-8 9 8m-3-1v9H6v-9m4 9v-6h4v6"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0z"/><circle cx="12" cy="10" r="2"/>',
  drag: '<path d="m2 12 3-3m-3 3 3 3m-3-3h6m14 0-3-3m3 3-3 3m3-3h-6M10 5l-1 14m5-14-1 14"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
  exit: '<path d="M6 18 18 6M7 6h11v11"/>',
  seal: '<path d="m12 2 4 6h-2l5 6h-3l4 5H4l4-5H5l5-6H8z" fill="currentColor" stroke="none"/><path d="M12 18v4"/>',
  close: '<path d="m5 5 14 14M19 5 5 19"/>',
};
export const icon = (name) =>
  '<svg class="v-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6">' +
  paths[name] +
  '</svg>';
export function makeInterface(c, lang) {
  const shell = document.createElement('div');
  shell.id = 'paper-village';
  shell.lang = lang;
  // All markup and localized strings here are repository-owned.
  shell.innerHTML = `
    <a class="v-skip" href="#v-route">${c.route}</a>
    <div class="v-header">
      <button class="v-brand" data-do="home"><span class="v-stamp">${icon('seal')}</span><span>${c.brand}<small>${c.club}</small></span></button>
      <nav class="v-links" aria-label="${c.village}"><button class="v-active" data-do="home">${icon('compass')}${c.village}</button><button data-do="story">${c.story}</button><button data-do="rules">${c.rules}</button></nav>
      <div class="v-tools"><button class="v-speaker" data-do="sound" aria-label="${c.muted}">${icon('mute')}</button><span class="v-rule"></span><button class="v-lang" data-do="languages" aria-haspopup="dialog">${icon('globe')}${lang.toUpperCase()}${icon('down')}</button><button class="v-menu" data-do="menu" aria-label="${c.menu}" aria-haspopup="dialog">${icon('menu')}</button></div>
    </div>
    <main id="v-stage" aria-label="${c.village}">
      <canvas id="v-canvas" aria-hidden="true"></canvas><div class="v-wash"></div><div class="v-grain"></div>
      <section class="v-copy" aria-labelledby="v-title">
        <div class="v-kicker"><span></span><b id="v-edition"></b></div>
        <h1 id="v-title"></h1><p id="v-desc"></p>
        <button id="v-enter" data-do="enter"></button>
      </section>
      <button class="v-marker" id="v-marker" data-do="rules">${icon('sparkle')}${c.meet}</button>
      <div class="v-drag">${icon('drag')}${c.drag}</div>
    </main>
    <div class="v-route" id="v-route" role="navigation" aria-label="${c.route}">
      <div class="v-place"><span class="v-map">${icon('map')}</span><div><small>${c.location} <span id="v-index"></span></small><strong id="v-place-name"></strong></div></div>
      <div class="v-steps" id="v-steps"></div>
      <div class="v-arrows"><button data-do="prev" aria-label="${c.prev}">${icon('back')}</button><button data-do="next" aria-label="${c.next}">${icon('arrow')}</button></div>
    </div>
    <div class="v-foot"><span><i></i> ${c.route} <b>·</b> 2026</span><span>${icon('star')} <span id="v-progress"></span></span></div>
  `;
  const menu = document.createElement('dialog');
  menu.id = 'v-menu';
  menu.className = 'v-pop';
  menu.setAttribute('aria-labelledby', 'v-menu-heading');
  menu.innerHTML = `<div class="v-pop-top"><h2 id="v-menu-heading">${c.menu}</h2><button data-do="close" aria-label="${c.close}">${icon('close')}</button></div>
    <div class="v-languages">${[
      ['en', 'English'],
      ['da', 'Dansk'],
      ['sv', 'Svenska'],
    ]
      .map(
        ([code, label]) =>
          `<button lang="${code}" data-code="${code}" aria-pressed="${code === lang}">${label}</button>`,
      )
      .join('')}</div>
    <div class="v-menu-items">${[
      ['story', c.story],
      ['rules', c.rules],
      ['guide', c.guide],
      ['install', c.install],
      ['classic', c.classic],
    ]
      .map(([action, label]) => `<button data-do="${action}">${label}${icon('exit')}</button>`)
      .join('')}</div>`;
  const guide = document.createElement('dialog');
  guide.id = 'v-guide';
  guide.className = 'v-pop';
  guide.setAttribute('aria-labelledby', 'v-guide-heading');
  guide.innerHTML = `<div class="v-pop-top"><h2 id="v-guide-heading">${c.guide}</h2><button data-do="close" aria-label="${c.close}">${icon('close')}</button></div><p>${c.guideText}</p><p>${c.guideDate}</p>`;
  document.body.prepend(shell);
  document.body.append(menu, guide);
  const steps = shell.querySelector('#v-steps');
  c.names.forEach((name, i) => {
    const b = document.createElement('button');
    b.dataset.stop = i;
    b.setAttribute('aria-label', (i ? i + ' · ' : '') + name);
    b.title = name;
    b.innerHTML = i ? String(i).padStart(2, '0') : icon('home');
    steps.appendChild(b);
  });
  const title = shell.querySelector('#v-title'),
    date = shell.querySelector('#v-edition'),
    enter = shell.querySelector('#v-enter');
  function show(i) {
    const status = i ? window.VillageCalendar.status(i) : null;
    const heading = i ? c.names[i].split(' ') : c.heading;
    title.replaceChildren();
    if (i) {
      title.textContent = heading.slice(0, -1).join(' ');
      if (heading.length > 1) title.append(document.createElement('br'));
    } else {
      title.append(heading[0], document.createElement('br'));
    }
    const em = document.createElement('em');
    em.textContent = heading.at(-1);
    title.append(em);
    date.textContent = i
      ? c.mission +
        ' ' +
        String(i).padStart(2, '0') +
        '   /   ' +
        (status.done
          ? c.completed
          : status.ready
            ? c.ready
            : c.date +
              ' ' +
              new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' }).format(status.date))
      : c.edition;
    shell.querySelector('#v-desc').textContent = i ? c.sub[i] : c.intro;
    enter.innerHTML =
      (i ? (status.ready ? c.open : c.try) : c.explore) + icon(i && !status.ready ? 'lock' : 'arrow');
    shell.querySelector('#v-place-name').textContent = c.names[i];
    shell.querySelector('#v-index').textContent = String(i + 1).padStart(2, '0') + ' / 13';
    shell.querySelector('#v-progress').textContent =
      window.VillageCalendar.progress() + ' / 12 ' + c.progress;
    shell.dataset.stop = i;
    [...steps.children].forEach((btn, n) => {
      btn.setAttribute('aria-current', n === i ? 'step' : 'false');
      btn.classList.toggle('v-done', n > 0 && window.VillageCalendar.status(n).done);
    });
  }
  return { shell, menu, guide, show };
}
