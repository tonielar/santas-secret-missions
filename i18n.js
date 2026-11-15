/* Santa multilingual runtime: languages are device-local, offline, and independent of test mode. */
(() => {
  'use strict';
  const choices = new Set(['en','da','sv']);
  let lang = 'en';
  try { const stored = localStorage.getItem('santa-language-2026'); if (choices.has(stored)) lang = stored; }
  catch (_) {}
  const source = window.SantaContent;
  const pack = lang === 'da' ? window.SantaLocaleDA : lang === 'sv' ? window.SantaLocaleSV : null;
  const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ui = new Map((window.SantaUIText || []).map(([en,da,sv]) => [en,lang === 'da' ? da : lang === 'sv' ? sv : en]));
  const tr = text => ui.get(String(text)) || String(text);
  const month = lang === 'da' ? 'DEC' : lang === 'sv' ? 'DEC' : 'DEC';
  const phrase = (en,da,sv) => lang === 'da' ? da : lang === 'sv' ? sv : en;
  if (pack && Array.isArray(pack.missions) && pack.missions.length === 12 && Array.isArray(pack.rules) && pack.rules.length === 7) {
    source.story = pack.story;
    for (let i = 0; i < 12; i++) {
      const entry = pack.missions[i], mission = source.missions[i];
      mission.title = entry.title;
      mission.skill = entry.skill;
      mission.message = entry.message;
      mission.bonus = entry.bonus;
      mission.help = entry.help;
      mission.assignment = '<p>' + escape(entry.intro) + '</p><p>' + phrase('Requirements:','Krav:','Krav:') + '</p><ol>' + entry.requirements.map(item => '<li>' + escape(item) + '</li>').join('') + '</ol>' + (entry.extra ? '<p>' + escape(entry.extra) + '</p>' : '');
    }
    source.rules = pack.rules.map(([title, paragraphs]) => ({
      title,body:paragraphs.map(p => '<p>' + escape(p).replace(/\\.html/g,'.html') + '</p>').join('')
    }));
  }
  document.documentElement.lang = lang;
  document.documentElement.dataset.language = lang;
  const dynamicTranslate = text => {
    const direct = tr(text);
    if (direct !== text) return direct;
    let match;
    if ((match = /^MISSION (\\d+) \\/ 12 · DECEMBER (\\d+)$/.exec(text))) return phrase(text, 'MISSION '+match[1]+' / 12 · '+match[2]+'. DECEMBER', 'UPPDRAG '+match[1]+' / 12 · '+match[2]+' DECEMBER');
    if ((match = /^MISSION (\\d+) · DECEMBER (\\d+)$/.exec(text))) return phrase(text, 'MISSION '+match[1]+' · '+match[2]+'. DECEMBER', 'UPPDRAG '+match[1]+' · '+match[2]+' DECEMBER');
    if ((match = /^DEC (\\d+)$/.exec(text))) return text; // Date labels intentionally concise in all languages
    if ((match = /^(\\d+) KB · Saved on this device$/.exec(text))) return match[1]+' KB · '+phrase('Saved on this device','Gemt på denne enhed','Sparat på den här enheten');
    return text;
  };
  function translateNode(node) {
    if (lang === 'en') return;
    if (node.nodeType === Node.TEXT_NODE) {
      const parent = node.parentElement;
      if (!parent || parent.closest('script,style,svg,textarea,pre,code,#agent-name,#intro-story,#santa-message,#hint-text,#rescue-text,#creation-filename,#name-input')) return;
      const raw = node.nodeValue || '', trimmed = raw.trim();
      if (!trimmed) return;
      const next = dynamicTranslate(trimmed);
      if (trimmed !== next) node.nodeValue = raw.replace(trimmed,next);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_NODE) return;
    if (node.nodeType === Node.ELEMENT_NODE && node.matches('script,style,svg,textarea,pre,code')) return;
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(translateNode);
  }
  translateNode(document);
  const observer = new MutationObserver(changes => {
    if (lang === 'en') return;
    for (const change of changes) {
      if (change.type === 'characterData') translateNode(change.target);
      else change.addedNodes.forEach(translateNode);
    }
  });
  observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  document.querySelectorAll('[data-lang]').forEach(button => {
    const code = button.dataset.lang;
    button.setAttribute('aria-pressed',String(code === lang));
    button.addEventListener('click', () => {
      if (!choices.has(code) || code === lang) return;
      try { localStorage.setItem('santa-language-2026',code); }
      catch (_) { /* This browser cannot remember the preference. */ }
      location.reload();
    });
  });
  window.SantaI18n = Object.freeze({lang,tr,phrase,translateNode});
})();
