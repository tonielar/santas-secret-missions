#!/usr/bin/env python3
"""Validate shipping files, all approved copy, image sizes and the public artifact."""
from pathlib import Path
from html.parser import HTMLParser
import json,re,struct,subprocess
ROOT=Path(__file__).resolve().parents[1]

def check():
 content=(ROOT/'content.js').read_text()
 data=json.loads(content.split('window.SantaContent = ',1)[1].strip().removesuffix(';'))
 assert len(data['missions'])==12 and len(data['rules'])==7
 assert [m['day'] for m in data['missions']]==list(range(1,24,2))
 assert [m['number'] for m in data['missions']]==list(range(1,13))
 assert len({h for m in data['missions'] for h in m['help']})==36
 assert all(m['assignment'].count('<li>')>=5 and len(m['message'])>80 and len(m['help'][2])>200 for m in data['missions'])
 assert 'Using Free ChatGPT?' in data['rules'][2]['body']
 index=(ROOT/'index.html').read_text();app=(ROOT/'app.js').read_text()
 assert 'data-mode="production"' in index
 assert 'house-name' not in index and 'houseLabels' not in app
 assert 'dev/test' not in index and '?test' not in app
 assert 'allow-same-origin' not in re.search(r"setAttribute\('sandbox', ([^\n]+)", (ROOT/'preview.js').read_text())[1]
 assert "frame-src 'none'" in index
 assert 'Take Me to Santa\'s Golden Rules' in index
 assert 'Take Me to the Village' in index
 class Assets(HTMLParser):
  def handle_starttag(self,tag,attrs):
   d=dict(attrs)
   for key in ('src','href'):
    value=d.get(key,'')
    if not value or value.startswith('#'):continue
    assert value.startswith('./'),(tag,key,value)
    assert (ROOT/value[2:]).is_file(),value
 Assets().feed(index)
 manifest=json.loads((ROOT/'manifest.webmanifest').read_text())
 assert manifest['display']=='standalone' and manifest['start_url']=='./' and manifest['scope']=='./'
 assert manifest['name']=="Santa's Secret Missions"
 for name,size in [('icon-192.png',192),('icon-512.png',512),('icon-maskable-512.png',512),('apple-touch-icon.png',180)]:
  image=(ROOT/'icons'/name).read_bytes()
  assert image[:8]==b'\x89PNG\r\n\x1a\n'
  assert struct.unpack('>II',image[16:24])==(size,size)
 dist=ROOT/'dist'
 assert (dist/'index.html').is_file() and (dist/'sw.js').is_file()
 assert not (dist/'dev').exists(),'Development files must not be in the production artifact'
 assert not any(p.suffix in ['.md','.py','.cjs'] for p in dist.rglob('*') if p.is_file())
 assert (dist/'index.html').read_bytes()==(ROOT/'index.html').read_bytes()
 assert 'data-mode="test"' in (ROOT/'dev/test.html').read_text()
 assert 'rel="manifest"' not in (ROOT/'dev/test.html').read_text()
 assert 'path: dist' in (ROOT/'.github/workflows/deploy.yml').read_text()
 assert (ROOT/'LICENSE').is_file() and 'MIT License' in (ROOT/'LICENSE').read_text(),'Approved MIT license must ship in repository'
 about=(ROOT/'about.html').read_text()
 assert '<html lang="en">' in about and 'paper-village-language-2026' in about and 'data-lang="da"' in about and 'data-lang="sv"' in about
 assert './' in about and 'tonielar/santas-secret-missions' in about
 assert (dist/'about.html').read_bytes()==(ROOT/'about.html').read_bytes(),'The public landing page must be deployed'
 assert './icons/icon-192.png' in about and 'href="./"' in about
 print('PASS: 12 missions, 36 unique hints, 7 rules, manifest/icons, asset references and production-only packaging')
if __name__=='__main__':check()
