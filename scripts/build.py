#!/usr/bin/env python3
"""Build the versioned offline shell and allowlisted Pages artifact. No dependencies."""
from pathlib import Path
import hashlib,json,re,shutil,base64
ROOT=Path(__file__).resolve().parents[1]
ASSETS=['index.html','app.css','content.js','locale-da.js','locale-sv.js','locale-ui.js','i18n.js','storage.js','preview.js','app.js','pwa.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png','icons/apple-touch-icon.png','icons/icon.svg']

def build():
 digest=hashlib.sha256()
 for path in ASSETS:
  digest.update(path.encode());digest.update((ROOT/path).read_bytes())
 version=digest.hexdigest()[:16]
 template=(ROOT/'scripts/sw.template.js').read_text()
 (ROOT/'sw.js').write_text(template.replace('__VERSION__',version).replace('__ASSETS__',json.dumps(ASSETS)))
 # The unlocked test build is a local artifact and is NEVER in the Pages artifact.
 production=(ROOT/'index.html').read_text()
 test=production.replace('data-mode="production"','data-mode="test"')
 test=re.sub(r'<link rel="manifest"[^>]*>','',test)
 test=test.replace('href="./','href="../').replace('src="./','src="../')
 (ROOT/'dev/test.html').write_text(test)
 (ROOT/'dev/qa.html').write_text(test.replace('</body>','<script defer src="./qa-fixtures.js"></script></body>'))
 # A convenient offline test download, still excluded from the public artifact.
 standalone=test.replace('<link rel="stylesheet" href="../app.css">','<style>'+ (ROOT/'app.css').read_text() +'</style>')
 for filename in ['content.js','locale-da.js','locale-sv.js','locale-ui.js','i18n.js','storage.js','preview.js','app.js','pwa.js']:
  standalone=standalone.replace('<script defer src="../'+filename+'"></script>','<script>'+ (ROOT/filename).read_text().replace('</script','<\\/script') +'</script>')
 icon='data:image/png;base64,'+base64.b64encode((ROOT/'icons/icon-192.png').read_bytes()).decode()
 apple='data:image/png;base64,'+base64.b64encode((ROOT/'icons/apple-touch-icon.png').read_bytes()).decode()
 standalone=standalone.replace('../icons/icon-192.png',icon).replace('../icons/apple-touch-icon.png',apple)
 (ROOT/'dev/Santas_Secret_Missions_PWA_TEST.html').write_text(standalone)
 dist=ROOT/'dist'
 if dist.exists():shutil.rmtree(dist)
 dist.mkdir()
 for path in ASSETS+['sw.js']:
  target=dist/path;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/path,target)
 (dist/'.nojekyll').touch()
 print(json.dumps({'version':version,'public_files':len(ASSETS)+2,'dist':str(dist),'test':'dev/test.html'}))
if __name__=='__main__':build()
