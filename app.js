/* Santa's Secret Missions. Framework-free, device-local, and readable on purpose. */
(() => {
  'use strict';
  const TEST_MODE = document.body.dataset.mode === 'test';
  const OWNER_TEST_KEY = 'paper-village-owner-test-2026';
  const LOCAL_TEST = (() => { try { return localStorage.getItem(OWNER_TEST_KEY) === 'on'; } catch (_) { return false; } })();
  const DATA = window.SantaContent;
  // Keep the earlier calendar's keys so same-origin upgrades retain names and stars.
  const STORAGE_KEY = `paper-village-missions-2026-${TEST_MODE ? 'test' : 'olivia'}`;
  const $ = id => document.getElementById(id);
  const defaults = () => ({ name: '', completed: [], opened: [], onboarded: false, onboardingStep: 'letter', setupComplete: false });
  let state = defaults();
  let storageOK = true;
  let currentMission = null;
  let hintLevel = 0;
  let hintMax = 0;
  let opening = false;
  let journey = false;
  let toastTimer;
  let animationTimer;
  let creation = null;
  let creationSequence = 0;
  let creationBusy = false;
  let uploadMission = null;
  let deleteMission = null;
  const openers = new Map();

  function readState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const saved = JSON.parse(raw);
          if (saved && typeof saved === 'object') {
            state.name = typeof saved.name === 'string' && saved.name.trim() ? saved.name.trim().slice(0, 32) : '';
            // Older visitors keep their current calendar without being forced through setup.
            state.setupComplete = saved.setupComplete !== false;
            const numbers = value => Array.isArray(value) ? [...new Set(value.filter(n => Number.isInteger(n) && n >= 1 && n <= 12))] : [];
            state.completed = numbers(saved.completed);
            state.opened = numbers(saved.opened);
            state.onboarded = saved.onboarded === true;
            state.onboardingStep = saved.onboardingStep === 'rules' ? 'rules' : 'letter';
          }
        } catch (_) { /* Damaged saved data should never prevent opening the calendar. */ }
      }
      localStorage.setItem(`${STORAGE_KEY}-probe`, 'ok');
      localStorage.removeItem(`${STORAGE_KEY}-probe`);
    } catch (_) { storageOK = false; }
  }

  function saveState() {
    if (!storageOK) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (_) {
      storageOK = false;
      $('storage-warning').hidden = false;
      toast('Your stars work for this visit, but this browser could not save them.');
    }
  }

  function toast(message) {
    clearTimeout(toastTimer);
    $('toast').textContent = message;
    $('toast').hidden = false;
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 6500);
  }

  function unlockDate(mission) { return new Date(2026, 11, mission.day, 0, 0, 0, 0); }
  function available(mission, now = new Date()) { return TEST_MODE || now.getTime() >= unlockDate(mission).getTime(); }

  function openDialog(id, focusId) {
    const dialog = $(id);
    if (dialog.open) return;
    openers.set(id, document.activeElement);
    dialog.showModal();
    dialog.scrollTop = 0;
    if (focusId) $(focusId).focus({ preventScroll: true });
  }
  function closeDialog(id) { if ($(id).open) $(id).close(); }

  function updateName() {
    $('agent-name').textContent = state.name || 'Agent';
    $('intro-story').textContent = DATA.story.replaceAll('{childName}', state.name);
    $('finale-text').textContent = `Agent ${state.name}, all 12 missions complete! Santa awards you the Golden Inventor Star. Kevin would like to be your assistant.`;
  }

  function renderCalendar() {
    const now = new Date();
    for (const mission of DATA.missions) {
      const n = mission.number;
      const done = state.completed.includes(n);
      const ready = available(mission, now);
      const fresh = ready && !done && !state.opened.includes(n);
      const house = $(`house-${n}`);
      house.className = `cottage ${ready ? (done ? 'completed' : 'available') : 'locked'}`;
      // Locked accessible names reveal only the number and date, never the mission title.
      const label = `Mission ${String(n).padStart(2, '0')}, December ${mission.day}. `;
      $(`door-${n}`).setAttribute('aria-label', label + (ready ? `${done ? 'Completed' : fresh ? 'New mission available' : 'Available'}. Open mission.` : `Locked. Opens December ${mission.day}, 2026.`));
      $(`door-state-${n}`).innerHTML = ready ? (done ? '★' : fresh ? 'NEW' : '✦') : '<svg aria-hidden="true" viewBox="0 0 40 46"><path d="M10 19V13C10 0 30 0 30 13V19" fill="none" stroke="#f8d997" stroke-width="7"/><path d="M10 18V13C10 1 30 1 30 13V18" fill="none" stroke="#fff2c4" stroke-width="3"/><rect x="3" y="17" width="34" height="27" rx="7" fill="#f0bb4d" stroke="#9b6c2a" stroke-width="2"/><path d="M8 23H32" stroke="#ffe8a9" stroke-width="3" stroke-linecap="round"/><circle cx="20" cy="30" r="4" fill="#82552d"/><path d="M18 31H22L23 38H17Z" fill="#82552d"/></svg>';
      $(`award-${n}`).hidden = !done;
    }
    const count = state.completed.length;
    $('progress-count').textContent = `${count}/12`;
    $('progress-track').setAttribute('aria-valuenow', String(count));
    $('track-fill').style.width = `${count / 12 * 100}%`;
    $('progress-message').textContent = count === 12 ? 'Christmas officially saved. Kevin is speechless.' : count === 0 ? 'Twelve tiny doors. Big inventor energy.' : count < 6 ? 'The workshop is getting its sparkle back.' : 'Santa is calling this a Christmas miracle.';
    $('finale').hidden = count !== 12;
    const fresh = DATA.missions.filter(m => available(m, now) && !state.opened.includes(m.number) && !state.completed.includes(m.number));
    $('new-mission-notice').hidden = fresh.length === 0;
    $('new-mission-text').textContent = fresh.length === 1 ? '✦ TOP SECRET! A new mission is waiting for you.' : `✦ Santa left you ${fresh.length} secret missions to discover.`;
    $('open-next-mission').dataset.mission = fresh.length ? String(fresh[0].number) : '';
    updateName();
    window.dispatchEvent(new Event('village-state'));
  }

  function buildCalendar() {
    const fragment = document.createDocumentFragment();
    for (const mission of DATA.missions) {
      const n = mission.number;
      const house = document.createElement('div');
      house.id = `house-${n}`;
      house.className = 'cottage';
      house.innerHTML = `<svg class="house-art" viewBox="0 0 190 241" aria-hidden="true"><use href="#cottage-art"/></svg><span class="door-burst" aria-hidden="true">✦<i>✧</i><b>✦</b></span><button class="house-door" id="door-${n}" type="button"><span class="door-number">${String(n).padStart(2, '0')}</span><span class="door-date">DEC ${mission.day}</span><span class="door-state" id="door-state-${n}" aria-hidden="true"></span></button><span class="award" id="award-${n}" hidden aria-hidden="true">⭐</span>`;
      house.querySelector('button').addEventListener('click', () => openMission(n));
      fragment.appendChild(house);
    }
    $('calendar').appendChild(fragment);
    renderCalendar();
  }

  function fillMission(mission) {
    currentMission = mission;
    $('mission-label').textContent = `MISSION ${String(mission.number).padStart(2, '0')} / 12 · DECEMBER ${mission.day}`;
    $('mission-title').textContent = mission.title;
    $('mission-skill').textContent = mission.skill;
    $('santa-message').textContent = mission.message;
    $('assignment').innerHTML = mission.assignment; // Trusted, repository-owned mission copy only.
    $('bonus-text').textContent = mission.bonus;
    updateCompletion();
    renderCreation(mission.number);
  }

  function openMission(number) {
    const mission = DATA.missions.find(item => item.number === number);
    if (!mission || opening) return;
    if (!available(mission)) {
      toast(`Shhh… Santa is still sealing this envelope! Mission ${String(number).padStart(2, '0')} opens December ${mission.day}, 2026 at midnight on this device.`);
      return;
    }
    opening = true;
    const house = $(`house-${number}`);
    house.classList.add('opening');
    setTimeout(() => {
      opening = false;
      house.classList.remove('opening');
      if (!available(mission)) return;
      if (!state.opened.includes(number)) { state.opened.push(number); saveState(); }
      renderCalendar();
      fillMission(mission);
      openDialog('mission-dialog', 'mission-title');
    }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 380);
  }

  function updateCompletion() {
    if (!currentMission) return;
    const done = state.completed.includes(currentMission.number);
    $('complete-row').classList.toggle('is-done', done);
    $('complete-button').textContent = done ? '★ Mission Completed!' : '☆ Mission Completed!';
    $('complete-button').setAttribute('aria-pressed', String(done));
    $('complete-button').disabled = done;
    $('undo-button').hidden = !done;
    $('completion-heading').textContent = done ? 'A golden star, earned by you.' : 'Creation tested? Improvement made?';
    $('completion-description').textContent = done ? `Santa says: “Brilliant work, Agent ${state.name}! Kevin has only exploded one biscuit today.”` : 'When you’re happy with your invention, give yourself a well-earned star. Santa trusts you. No file upload is required.';
  }

  function celebrate() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    clearTimeout(animationTimer);
    $('confetti-layer').replaceChildren();
    for (let i = 0; i < 38; i++) {
      const particle = document.createElement('span');
      particle.className = 'confetti';
      particle.textContent = ['✦', '★', '●', '▪'][i % 4];
      particle.style.color = ['#b13763', '#e9b842', '#75a68f', '#e48cae', '#9878b5'][i % 5];
      particle.style.setProperty('--x', `${(Math.random() - 0.5) * 700}px`);
      particle.style.setProperty('--y', `${-100 - Math.random() * 450}px`);
      particle.style.setProperty('--r', `${(Math.random() - 0.5) * 700}deg`);
      $('confetti-layer').appendChild(particle);
    }
    animationTimer = setTimeout(() => $('confetti-layer').replaceChildren(), 2100);
  }

  function completeMission() {
    if (!currentMission || !available(currentMission) || state.completed.includes(currentMission.number)) return;
    state.completed.push(currentMission.number);
    saveState(); renderCalendar(); updateCompletion(); celebrate();
    window.dispatchEvent(new CustomEvent('village-celebration', { detail: currentMission.number }));
    toast(state.completed.length === 12 ? 'Santa says: “ALL 12! Christmas is saved! Kevin, put down that toaster.”' : `Santa says: “Another disaster defeated, Agent ${state.name}! Cookie department: issue a victory biscuit.”`);
    $('undo-button').focus({ preventScroll: true });
  }

  function undoMission() {
    if (!currentMission) return;
    state.completed = state.completed.filter(n => n !== currentMission.number);
    saveState(); renderCalendar(); updateCompletion();
    toast('Star gently returned to Santa. Your mission is ready whenever you are.');
    $('complete-button').focus({ preventScroll: true });
  }

  function openRules(fromLetter = false) {
    journey = fromLetter;
    $('rules-next').textContent = fromLetter ? 'Take Me to the Village →' : $('mission-dialog').open ? 'Back to my mission →' : 'Back to the Village →';
    openDialog('rules-dialog', 'rules-title');
  }
  function openIntro() {
    updateName();
    $('name-input').value = state.name;
    openDialog('intro-dialog', 'intro-title');
  }
  function saveName(notify = true) {
    const value = $('name-input').value.trim();
    if (!value) { $('name-input').reportValidity(); $('name-input').focus(); return false; }
    state.name = value.slice(0, 32);
    saveState(); updateName(); updateCompletion();
    if (notify) toast(`Agent ${state.name} — your North Pole badge is ready!`);
    return true;
  }

  function renderHint() {
    const titles = ['A little nudge', 'Santa’s building plan', 'Emergency Rescue Prompt'];
    $('hint-title').textContent = titles[hintLevel];
    $('hint-text').hidden = hintLevel === 2;
    $('rescue-container').hidden = hintLevel !== 2;
    if (hintLevel === 2) $('rescue-text').value = currentMission.help[2];
    else $('hint-text').textContent = currentMission.help[hintLevel];
    document.querySelectorAll('.help-tab').forEach((tab, index) => {
      tab.disabled = index > hintMax;
      tab.setAttribute('aria-pressed', String(index === hintLevel));
    });
    $('hint-back').disabled = hintLevel === 0;
    $('hint-next').hidden = hintLevel === 2;
    $('hint-next').textContent = hintLevel === 0 ? 'A little more help →' : 'Show the rescue prompt →';
    $('copy-button').textContent = 'Copy Prompt';
    $('manual-copy').hidden = true;
  }
  function changeHint(level) {
    if (level < 0 || level > 2 || level > hintMax) return;
    hintLevel = level; renderHint();
    $('hint-title').setAttribute('tabindex', '-1');
    $('hint-title').focus();
  }
  function openHelp() {
    if (!currentMission) return;
    hintLevel = 0; hintMax = 0;
    $('help-mission').textContent = `MISSION ${String(currentMission.number).padStart(2, '0')} · DECEMBER ${currentMission.day}`;
    renderHint(); openDialog('help-dialog', 'help-title');
  }
  async function copyPrompt() {
    const field = $('rescue-text');
    field.focus(); field.select(); field.setSelectionRange(0, field.value.length);
    let copied = false;
    try { copied = document.execCommand('copy'); } catch (_) { /* Fall back to the modern clipboard API. */ }
    if (!copied && navigator.clipboard && window.isSecureContext) {
      try { copied = await Promise.race([navigator.clipboard.writeText(field.value).then(() => true), new Promise(resolve => setTimeout(() => resolve(false), 1500))]); } catch (_) { /* Manual selection remains available. */ }
    }
    if (copied) { $('copy-button').textContent = 'Copied! ✓'; toast('Rescue prompt copied. Paste it into ChatGPT Chat to start planning.'); }
    else { $('manual-copy').hidden = false; $('copy-button').textContent = 'Select & copy'; field.focus(); field.select(); }
  }

  function setCreationBusy(busy) {
    creationBusy = busy;
    for (const id of ['upload-creation', 'replace-creation', 'open-creation', 'download-creation', 'delete-creation']) $(id).disabled = busy;
    $('creation-feedback').textContent = busy ? 'A little local workshop magic…' : '';
  }
  function showCreation(record) {
    creation = record || null;
    const saved = Boolean(creation);
    $('creation-saved').hidden = !saved;
    $('upload-creation').hidden = saved;
    for (const id of ['open-creation', 'replace-creation', 'download-creation', 'delete-creation']) $(id).hidden = !saved;
    $('creation-filename').textContent = saved ? creation.filename : '';
    $('creation-details').textContent = saved ? `${Math.max(1, Math.ceil(creation.bytes / 1024))} KB · Saved on this device` : '';
  }
  async function renderCreation(number) {
    const sequence = ++creationSequence;
    showCreation(null); setCreationBusy(true);
    try {
      const record = await SantaStorage.get(number);
      if (sequence !== creationSequence || !currentMission || currentMission.number !== number) return;
      showCreation(record); setCreationBusy(false);
    } catch (error) {
      if (sequence !== creationSequence) return;
      setCreationBusy(false);
      $('creation-feedback').textContent = SantaStorage.friendlyError(error);
    }
  }
  function chooseCreation() {
    if (!currentMission || creationBusy) return;
    uploadMission = currentMission.number;
    $('creation-input').value = '';
    $('creation-input').click(); // Must stay synchronous with the user's tap for iOS Files.
  }
  async function importCreation() {
    const file = $('creation-input').files[0];
    const mission = uploadMission;
    if (!file || !mission || creationBusy) return;
    if (!/\.html$/i.test(file.name)) { $('creation-feedback').textContent = 'Choose a file ending in .html. Images, ZIP files and documents cannot run here.'; return; }
    if (file.size === 0 || file.size > 10 * 1024 * 1024) { $('creation-feedback').textContent = file.size ? 'This creation is a little too big for the workbench. Ask AI to keep the complete HTML file under 10 MB.' : 'This file is empty. Ask ChatGPT to create the complete HTML file again.'; return; }
    setCreationBusy(true);
    try {
      const html = await file.text();
      if (html.includes('\u0000') || !/<html[\s>]/i.test(html) || !/<\/html\s*>/i.test(html)) throw new Error('invalid-html');
      const record = { mission, filename: file.name.slice(0, 180), html, bytes: file.size, importedAt: new Date().toISOString() };
      await SantaStorage.put(record);
      if (currentMission && currentMission.number === mission) {
        showCreation(record); setCreationBusy(false);
        $('creation-feedback').textContent = 'Saved here on your device. Ready for a test run! Your mission star is unchanged.';
      }
      toast('Creation safely saved on this device. Time to test your invention!');
    } catch (error) {
      setCreationBusy(false);
      $('creation-feedback').textContent = error.message === 'invalid-html' ? 'This doesn’t look like a complete HTML page. Ask AI for ONE standalone .html file, then try again.' : SantaStorage.friendlyError(error);
    } finally { creationBusy = false; }
  }
  function openCreation() {
    if (!creation || creationBusy) return;
    openDialog('preview-dialog', 'preview-title');
    SantaPreview.mount(creation);
  }
  function downloadCreation() {
    if (!creation || creationBusy) return;
    const url = URL.createObjectURL(new Blob([creation.html], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = creation.filename;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    toast('Your browser is exporting the HTML file. Check Files or Downloads.');
  }
  function askDeleteCreation() {
    if (!creation || creationBusy) return;
    deleteMission = creation.mission;
    $('delete-description').textContent = `Delete “${creation.filename}” from this app on this device?`;
    openDialog('delete-dialog', 'delete-title');
  }
  async function deleteCreation() {
    if (!deleteMission) return;
    const number = deleteMission;
    $('confirm-delete').disabled = true;
    try {
      await SantaStorage.remove(number);
      closeDialog('delete-dialog');
      if (currentMission && currentMission.number === number) { showCreation(null); $('creation-feedback').textContent = 'Local copy deleted. Your original file and mission star are unchanged.'; }
      toast('Local copy removed. Your mission star is safe.');
      deleteMission = null;
    } catch (error) { $('delete-description').textContent = SantaStorage.friendlyError(error); }
    finally { $('confirm-delete').disabled = false; }
  }

  function refreshLocks() {
    renderCalendar();
    if (currentMission && $('mission-dialog').open && !available(currentMission)) {
      ['preview-dialog', 'delete-dialog', 'help-dialog', 'rules-dialog', 'mission-dialog'].forEach(closeDialog);
      toast('This mission is waiting for its December date on this device.');
    }
  }


  /* Snow drifts across actual cottages, not just the page header. */
  function makeVillageSnow() {
    const layer = $('village-snow');
    if (!layer || layer.childElementCount) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const count = window.innerWidth <= 600 ? 36 : 60;
    const height = $('main').scrollHeight + 70;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const flake = document.createElement('span');
      flake.className = 'village-snowflake';
      flake.style.setProperty('--snow-left', ((i * 61.8 + Math.random() * 23) % 100).toFixed(2) + '%');
      flake.style.setProperty('--snow-size', (2.5 + Math.random() * 4.2).toFixed(1) + 'px');
      flake.style.setProperty('--snow-opacity', (.42 + Math.random() * .53).toFixed(2));
      flake.style.setProperty('--snow-duration', (14 + Math.random() * 15).toFixed(1) + 's');
      flake.style.setProperty('--snow-delay', (-Math.random() * 29).toFixed(1) + 's');
      flake.style.setProperty('--snow-drift', (-30 + Math.random() * 60).toFixed(1) + 'px');
      flake.style.setProperty('--snow-travel', height + 'px');
      fragment.appendChild(flake);
    }
    layer.appendChild(fragment);
  }
  const setupCopy = {
    en: ['NORTH POLE · YOUR SECRET INVITATION', "Welcome to Santa's Secret Missions!", 'Before your adventure begins, choose your language and tell Santa what to call you.', 'Choose your language', 'What should Santa call you?', 'Your name', 'Start my Christmas adventure →', 'Your name, stars and creations stay on this device. You can change your name and language later.'],
    da: ['NORDPOLEN · DIN HEMMELIGE INVITATION', 'Velkommen til julemandens hemmelige missioner!', 'Før eventyret begynder, skal du vælge sprog og fortælle julemanden, hvad du hedder.', 'Vælg dit sprog', 'Hvad skal julemanden kalde dig?', 'Dit navn', 'Start mit juleeventyr →', 'Dit navn, stjerner og opfindelser gemmes på denne enhed. Du kan ændre navn og sprog senere.'],
    sv: ['NORDPOLEN · DIN HEMLIGA INBJUDAN', 'Välkommen till tomtens hemliga uppdrag!', 'Innan äventyret börjar, välj språk och berätta vad tomten ska kalla dig.', 'Välj ditt språk', 'Vad ska tomten kalla dig?', 'Ditt namn', 'Starta mitt juläventyr →', 'Ditt namn, stjärnor och skapelser sparas på den här enheten. Du kan ändra namn och språk senare.']
  };
  function setSetupLanguage(language) {
    const labels = setupCopy[language] || setupCopy.en;
    const ids = ['setup-eyebrow','welcome-setup-title','setup-description','setup-language-label','setup-name-label','setup-name','setup-begin','setup-privacy'];
    ids.forEach((id,i) => {
      const node = $(id);
      if (node) {
        if (id === 'setup-name') node.placeholder = labels[i];
        else node.textContent = labels[i];
      }
    });
  }
  function beginSetup() {
    const preferred = window.SantaI18n && window.SantaI18n.lang || 'en';
    const radio = document.querySelector('input[name="setup-language"][value="' + preferred + '"]');
    if (radio) radio.checked = true;
    setSetupLanguage(preferred);
    $('setup-name').value = '';
    openDialog('welcome-setup-dialog', 'welcome-setup-title');
  }
  function finishSetup(event) {
    event.preventDefault();
    const name = $('setup-name').value.trim();
    const selected = document.querySelector('input[name="setup-language"]:checked');
    if (!selected || !name) { $('welcome-setup-form').reportValidity(); return; }
    const code = selected.value;
    if (!['en','da','sv'].includes(code)) return;
    state.name = name.slice(0,32);
    state.setupComplete = true;
    state.onboarded = false;
    state.onboardingStep = 'letter';
    saveState();
    updateName();
    try { localStorage.setItem('paper-village-language-2026',code); }
    catch (_) { /* Names still work in this session without persistence. */ }
    if (window.SantaI18n && code !== window.SantaI18n.lang) {
      location.reload();
      return;
    }
    closeDialog('welcome-setup-dialog');
    setTimeout(() => openIntro(), 0);
  }

  readState();
  // Opening the hidden tester must never feel like losing the real calendar.
  // Borrow only the existing visitor's name and onboarding state; NEVER copy
  // completed missions, opened doors or uploaded creations into test mode.
  if (TEST_MODE) {
    try {
      const normalRaw = localStorage.getItem('paper-village-missions-2026-olivia');
      const normal = normalRaw ? JSON.parse(normalRaw) : null;
      if (normal && typeof normal.name === 'string' && normal.name.trim()
          && normal.setupComplete !== false) {
        if (!state.name) state.name = normal.name.trim().slice(0, 32);
        if (!state.setupComplete || !state.onboarded) {
          state.setupComplete = true;
          state.onboarded = true;
          state.onboardingStep = 'letter';
          saveState(); // Writes only to the isolated test key.
        }
      }
    } catch (_) { /* Normal and test progress remain safe if storage is unavailable. */ }
  }
  $('tester-banner').hidden = !LOCAL_TEST;
  let secretTaps = 0;
  let secretTapTime = 0;
  $('tester-secret').addEventListener('click', () => {
    if (LOCAL_TEST) return;
    if (Date.now() - secretTapTime > 4500) secretTaps = 0;
    secretTapTime = Date.now();
    if (++secretTaps < 7) return;
    secretTaps = 0;
    try {
      localStorage.setItem(OWNER_TEST_KEY, 'on');
      location.reload();
    } catch (_) { toast('Test mode requires browser storage. Try a normal browser window.'); }
  });
  $('exit-test-mode').addEventListener('click', () => {
    try {
      localStorage.removeItem(OWNER_TEST_KEY);
      location.reload();
    } catch (_) { toast('Could not disable test mode. Check browser storage settings.'); }
  });
  $('test-label').hidden = !TEST_MODE;
  $('storage-warning').hidden = storageOK;
  $('rules-list').innerHTML = DATA.rules.map(rule => `<section class="rule"><div><h3>${rule.title}</h3>${rule.body}</div></section>`).join('');
  buildCalendar();
  makeVillageSnow();
  for (let i = 0; i < 20; i++) {
    const snow = document.createElement('span'); snow.className = 'flake';
    snow.style.setProperty('--left', `${i * 5 + Math.random() * 4}%`);
    snow.style.setProperty('--duration', `${10 + Math.random() * 12}s`);
    snow.style.setProperty('--delay', `${-Math.random() * 20}s`);
    $('snow').appendChild(snow);
  }
  document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.action === 'rules') openRules();
    else if (button.dataset.action === 'intro') openIntro();
    else if (button.dataset.action === 'install') openDialog('install-dialog', 'install-title');
  }));
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => closeDialog(button.dataset.close)));
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      const trigger = openers.get(dialog.id);
      if (trigger && trigger.isConnected) trigger.focus({ preventScroll: true });
    });
  });
  const observer = new MutationObserver(() => { document.body.style.overflow = document.querySelector('dialog[open]') ? 'hidden' : ''; });
  document.querySelectorAll('dialog').forEach(dialog => observer.observe(dialog, { attributes: true, attributeFilter: ['open'] }));
  $('complete-button').addEventListener('click', completeMission);
  $('undo-button').addEventListener('click', undoMission);
  $('help-button').addEventListener('click', openHelp);
  $('name-form').addEventListener('submit', event => { event.preventDefault(); saveName(); });
  $('welcome-setup-form').addEventListener('submit', finishSetup);
  document.querySelectorAll('input[name="setup-language"]').forEach(radio => radio.addEventListener('change', () => setSetupLanguage(radio.value)));
  $('start-button').addEventListener('click', () => {
    if (!saveName(false)) return;
    state.onboardingStep = 'rules'; saveState();
    closeDialog('intro-dialog'); openRules(true);
  });
  $('rules-next').addEventListener('click', () => {
    if (journey) { state.onboarded = true; state.onboardingStep = 'letter'; saveState(); }
    closeDialog('rules-dialog');
    journey = false;
  });
  $('hint-next').addEventListener('click', () => { hintMax = Math.min(2, hintMax + 1); changeHint(Math.min(2, hintLevel + 1)); });
  $('hint-back').addEventListener('click', () => changeHint(hintLevel - 1));
  document.querySelectorAll('[data-level]').forEach(button => button.addEventListener('click', () => changeHint(Number(button.dataset.level))));
  $('copy-button').addEventListener('click', copyPrompt);
  $('upload-creation').addEventListener('click', chooseCreation);
  $('replace-creation').addEventListener('click', chooseCreation);
  $('creation-input').addEventListener('change', importCreation);
  $('open-creation').addEventListener('click', openCreation);
  $('download-creation').addEventListener('click', downloadCreation);
  $('delete-creation').addEventListener('click', askDeleteCreation);
  $('confirm-delete').addEventListener('click', deleteCreation);
  $('open-next-mission').addEventListener('click', () => openMission(Number($('open-next-mission').dataset.mission)));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshLocks(); });
  window.addEventListener('focus', refreshLocks);
  window.addEventListener('storage', event => { if (event.key === STORAGE_KEY) { readState(); renderCalendar(); updateCompletion(); } });
  setInterval(refreshLocks, 15000);
  function resumeWelcome() {
    if (!state.setupComplete) { beginSetup(); return true; }
    if (!state.onboarded) {
      if (state.onboardingStep === 'rules') openRules(true); else openIntro();
      return true;
    }
    return false;
  }
  // Scene and classic doors share a single calendar authority, including the date recheck on entry.
  window.VillageCalendar = Object.freeze({
    status(number) {
      const mission = DATA.missions[number - 1];
      return { ready: available(mission), done: state.completed.includes(number), date: unlockDate(mission) };
    },
    progress: () => state.completed.length,
    test: TEST_MODE, resumeWelcome, openMission, openRules, openIntro, toast,
    install: () => openDialog('install-dialog', 'install-title')
  });
  if (!document.body.classList.contains('village-pending')) setTimeout(resumeWelcome, 180);
  else if (state.setupComplete && !state.onboarded) setTimeout(resumeWelcome, 180);
})();
