/* Meaningful offline/update tests of the actual generated worker, without dependencies. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const scope = 'https://example.test/santas-secret-missions/';
const handlers = new Map();
const stores = new Map();
let claims = 0, skipped = 0, networkCalls = 0;
const caches = {
  async open(name) {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name);
    return {
      async addAll(requests) { for (const req of requests) store.set(req.url, new Response(`cached:${new URL(req.url).pathname}`)); },
      async match(key) { const response=store.get(typeof key==='string'?key:key.url);return response && response.clone(); },
      async put(key, response) { store.set(typeof key==='string'?key:key.url,response.clone()); },
    };
  },
  async keys() { return [...stores.keys()]; },
  async delete(name) { return stores.delete(name); },
};
const self = {
  registration: { scope },
  clients: { async claim() { claims++; } },
  skipWaiting() { skipped++; },
  addEventListener(name, callback) { handlers.set(name, callback); },
};
let network = async () => { throw new Error('Offline'); };
vm.runInNewContext(source, { self, caches, URL, Request, Response, fetch: async request => { networkCalls++;return network(request); } });
async function lifetime(name, input={}) {
  let done;
  handlers.get(name)({ ...input, waitUntil(promise) { done=promise; } });
  await done;
}
async function request(url, options={}) {
  let response;
  handlers.get('fetch')({ request: { url, method:'GET', mode:'cors', ...options }, respondWith(promise) { response=promise; } });
  return response;
}
(async () => {
  await lifetime('install');
  const current=[...stores.keys()][0];
  const prefix=current.slice(0,current.lastIndexOf('-')+1);
  assert.equal(skipped,0,'A newly installed update must not activate without consent');
  const cache=stores.get(current);
  assert.equal(cache.size,13,'Every shell asset must be precached');
  const offline=await request(scope,{mode:'navigate'});
  assert.match(await offline.text(),/cached:.*index\.html/);
  const asset=await request(scope+'app.js');
  assert.match(await asset.text(),/cached:.*app\.js/);
  assert.equal(networkCalls,0,'Offline shell and assets must not require network');
  assert.equal(await request(scope+'dev/test.html',{mode:'navigate'}),undefined,'Never rewrite test navigation to production');
  assert.equal(await request(scope+'creation.html'),undefined,'Never cache imported or unknown HTML');
  assert.equal(await request('https://elsewhere.test/app.js'),undefined);
  assert.equal(await request(scope+'app.js',{method:'POST'}),undefined);
  stores.set(prefix+'old',new Map());
  stores.set('unrelated-app-cache',new Map());
  stores.set('santa-shell-%2Fanother-app%2F-old',new Map());
  await lifetime('activate');
  assert.equal(claims,1);
  assert(!stores.has(prefix+'old'),'Remove previous versions for this app scope');
  assert(stores.has('unrelated-app-cache'));
  assert(stores.has('santa-shell-%2Fanother-app%2F-old'),'Do not delete another app scope cache');
  handlers.get('message')({data:{type:'not-an-update'}});
  assert.equal(skipped,0);
  handlers.get('message')({data:{type:'SKIP_WAITING'}});
  assert.equal(skipped,1);
  cache.delete(scope+'app.js');
  network=async()=>new Response('repaired-app',{status:200});
  const repaired=await request(scope+'app.js');
  assert.equal(await repaired.text(),'repaired-app');
  assert(cache.has(scope+'app.js'),'Recover an evicted asset when online');

  // Test the actual date functions in two local time zones, including every boundary.
  const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
  const functions=app.match(/  function unlockDate\([^\n]+\n  function available\([^\n]+/)[0];
  for(const zone of ['UTC','Europe/Copenhagen']) {
    process.env.TZ=zone;
    const prod=vm.runInNewContext('const TEST_MODE=false;'+functions+';({unlockDate,available})',{Date});
    const test=vm.runInNewContext('const TEST_MODE=true;'+functions+';({unlockDate,available})',{Date});
    for(let i=0;i<12;i++) {
      const mission={day:2*i+1};
      const instant=prod.unlockDate(mission);
      assert.equal(instant.getHours(),0);
      assert.equal(prod.available(mission,new Date(instant.getTime()-1)),false);
      assert.equal(prod.available(mission,instant),true);
      assert.equal(prod.available(mission,new Date(2027,0,2)),true);
      assert.equal(test.available(mission,new Date(2020,0,1)),true);
    }
  }
  console.log('PASS: offline cached navigation/assets, cache repair, explicit update activation, scope-isolated cleanup, test exclusion and 12 local-midnight locks in UTC/Copenhagen');
})().catch(error=>{console.error(error);process.exitCode=1;});
