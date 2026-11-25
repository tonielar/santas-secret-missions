/* Device-local creation storage. No file bytes are sent over a network. */
(() => {
  'use strict';
  const mode = document.body.dataset.mode === 'test' ? 'test' : 'production';
  const DATABASE = `paper-village-creations-2026-${mode}`;
  const STORE = 'creations';
  let databasePromise;

  function database() {
    if (databasePromise) return databasePromise;
    databasePromise = new Promise((resolve, reject) => {
      let request;
      let settled = false;
      const timer = setTimeout(() => {
        settled = true;
        reject(new Error('Local storage did not become available. Close other copies of the app and try again.'));
      }, 5000);
      try { request = indexedDB.open(DATABASE, 1); }
      catch (error) { clearTimeout(timer); reject(error); return; }
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'mission' });
      };
      request.onsuccess = () => {
        clearTimeout(timer);
        if (settled) { request.result.close(); return; }
        settled = true;
        request.result.onversionchange = () => { request.result.close(); databasePromise = undefined; };
        resolve(request.result);
      };
      request.onerror = () => { clearTimeout(timer); settled = true; reject(request.error); };
      request.onblocked = () => { /* The timeout produces a friendly, actionable message. */ };
    });
    databasePromise.catch(() => { databasePromise = undefined; });
    return databasePromise;
  }

  async function transaction(mode, action) {
    const db = await database();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      let result;
      const request = action(tx.objectStore(STORE));
      request.onsuccess = () => { result = request.result; };
      tx.oncomplete = () => resolve(result); // A successful request alone does not mean the write committed.
      tx.onabort = () => reject(tx.error || new Error('The local save was interrupted.'));
      tx.onerror = () => reject(tx.error || request.error || new Error('Local storage is unavailable.'));
    });
  }

  function friendlyError(error) {
    if (error && error.name === 'QuotaExceededError') return 'This device has no room for another saved creation. Keep your original file and free up some website storage before trying again.';
    return 'We couldn’t save or read this local copy. Keep the original in Files or Downloads and try a regular browser window with website storage available.';
  }

  window.SantaStorage = Object.freeze({
    get: mission => transaction('readonly', store => store.get(mission)),
    put: record => transaction('readwrite', store => store.put(record)),
    remove: mission => transaction('readwrite', store => store.delete(mission)),
    friendlyError,
  });
})();
