/* Synthetic local fixtures. Never deployed. Exercises the real input/change handlers. */
(() => {
  const fixtures = {
    game: { name: 'gift-game.html', html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>body{font:20px system-ui;text-align:center;background:#ffe8ef;padding:25px;color:#793650}button{font:inherit;padding:20px;border-radius:18px}#score{margin:20px}</style></head><body><h1>Gift counter test</h1><button id="catch">Catch a gift</button><p id="score">Score: 0</p><script>let n=0;document.getElementById('catch').onclick=()=>document.getElementById('score').textContent='Score: '+(n+=10);<\/script></body></html>` },
    tool: { name: 'packing-tool.html', html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>body{font:18px system-ui;padding:20px;background:#e8f1e2}input,button{font:inherit;padding:12px}</style></head><body><h1>Packing tool test</h1><form id="add"><label for="item">Pack something</label><input id="item" required><button>Add item</button></form><ul id="list"></ul><script>document.getElementById('add').onsubmit=e=>{e.preventDefault();const li=document.createElement('li');li.textContent=document.getElementById('item').value;document.getElementById('list').appendChild(li);document.getElementById('item').value='';};<\/script></body></html>` },
    security: { name: 'sandbox-check.html', html: `<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body><h1>Sandbox isolation checks</h1><ul id="results"></ul><button id="navigate">Try frame navigation</button><button id="topnav">Try parent navigation</button><button id="network">Try network request</button><script>function result(name,value){const li=document.createElement('li');li.textContent=name+': '+value;document.getElementById('results').appendChild(li)}try{parent.document.body.dataset.qaEscape='bad';result('Parent document','UNSAFE')}catch(e){result('Parent document','blocked')}try{localStorage.setItem('qa-only','bad');result('Browser storage','UNSAFE')}catch(e){result('Browser storage','blocked')}try{indexedDB.open('qa-only');result('Creation storage','UNSAFE')}catch(e){result('Creation storage','blocked')}document.getElementById('navigate').onclick=()=>{location.href=new URL('escaped.html',document.baseURI).href};document.getElementById('topnav').onclick=()=>{try{top.location.href=new URL('escaped.html',document.baseURI).href}catch(e){result('Parent navigation','blocked')}};document.getElementById('network').onclick=()=>{fetch(new URL('network-probe',document.baseURI).href).then(()=>result('Network','UNSAFE')).catch(()=>result('Network','blocked'))};<\/script></body></html>` },
    extension: { name: 'not-html.txt', html: 'Not an HTML file.' },
    invalid: { name: 'incomplete.html', html: 'Not a complete HTML document.' },
  };
  const panel=document.createElement('details');
  panel.id='qa-fixtures';panel.style.cssText='margin:20px 0;padding:15px;background:white;border:2px dashed #a25b77';
  panel.innerHTML='<summary>Development QA fixtures (not deployed)</summary>';
  for (const [id,fixture] of Object.entries(fixtures)) {
    const button=document.createElement('button');button.id='qa-'+id;button.type='button';button.className='soft-btn';button.textContent='Import '+id+' fixture';
    button.onclick=()=>{
      const input=document.getElementById('creation-input');
      const transfer=new DataTransfer();transfer.items.add(new File([fixture.html],fixture.name,{type:fixture.name.endsWith('.html')?'text/html':'text/plain'}));
      // Set the mission using the same visible picker button, but intercept its default file chooser.
      // A real picker test is a separate manual/mobile release check.
      const stop=event=>event.preventDefault();input.addEventListener('click',stop,{once:true});
      const upload=document.getElementById('upload-creation'),replace=document.getElementById('replace-creation');
      (upload.hidden?replace:upload).click();
      input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));
    };
    panel.appendChild(button);
  }
  document.querySelector('.creation-card').appendChild(panel);
})();
