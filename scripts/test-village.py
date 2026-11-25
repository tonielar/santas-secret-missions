#!/usr/bin/env python3
"""Exercise the built preview in Chromium. Requires the Playwright Python package."""
import argparse
import datetime
import json
import functools
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from contextlib import contextmanager

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
ORIGIN = None
parser = argparse.ArgumentParser()
parser.add_argument('--chromium', help='Use an existing Chromium executable')
parser.add_argument('--screenshots', type=Path, help='Save review images in this directory')
parser.add_argument('--software-gl', action='store_true', help='Use the bundled SwiftShader renderer')
parser.add_argument('--motion-benchmark', action='store_true', help='Measure two complete turns instead of the functional suite')
args = parser.parse_args()
if args.screenshots:
    args.screenshots.mkdir(parents=True, exist_ok=True)

@contextmanager
def http_fixture():
    # A disposable loopback origin is needed for an actual service-worker install
    # and offline reload. Only the allowlisted build is available to this test.
    class Handler(SimpleHTTPRequestHandler):
        def log_message(self, *_args):
            pass
    with ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=DIST)) as server:
        thread=threading.Thread(target=server.serve_forever,daemon=True)
        thread.start()
        try:yield f'http://127.0.0.1:{server.server_port}/'
        finally:server.shutdown();thread.join()

def setup(browser, width=1280, height=800, date='2026-11-25', **options):
    p = browser.new_page(viewport={'width':width,'height':height}, device_scale_factor=1,
                         **options)
    stamp=int(datetime.datetime.fromisoformat(date+'T14:00:00+00:00').timestamp()*1000)
    p.add_init_script(f'''if (self===top) {{ const NativeDate=Date;
      window.Date=class CalendarDate extends NativeDate {{
        constructor(...args){{super(...(args.length ? args : [{stamp}]))}}
        static now(){{return {stamp}}}
      }};
    }}''')
    return p

def shot(page, name):
    if args.screenshots:
        page.screenshot(path=args.screenshots/(name+'.jpg'), quality=88)

def stop(p, number):
    expect(p.locator('#paper-village')).to_have_attribute('data-stop', str(number), timeout=15000)

def choose(p, number):
    p.locator(f'button[data-stop="{number}"]').click()
    stop(p, number)

def timing(p):
    return p.evaluate('''() => new Promise(resolve => {
      const intervals = []; let last=0,start=0;
      function sample(t) {if(!start)start=t;if(last)intervals.push(t-last);last=t;
        if(t-start<3200){requestAnimationFrame(sample);return;}
        const sorted=intervals.slice().sort((a,b)=>a-b);
        resolve({frames: intervals.length, seconds:+((t-start)/1000).toFixed(2),
          fps:+(intervals.length*1000/(t-start)).toFixed(1),p95ms:+sorted[Math.floor(sorted.length*.95)].toFixed(1)});
      } requestAnimationFrame(sample);
    })''')

def visible(page, selector):
    expect(page.locator(selector)).to_be_visible(timeout=15000)

def onboard(p, variant):
    visible(p,'#welcome-setup-dialog')
    p.locator(f'label:has([name="setup-elf"][value="{variant}"])').click()
    p.locator('#setup-name').fill('Robin')
    p.locator('#setup-begin').click();visible(p,'#intro-dialog')
    p.locator('#start-button').click();visible(p,'#rules-dialog')
    p.locator('#rules-next').click()
    assert p.evaluate('VillageCalendar.elf()') == variant

def five_taps(p, selector):
    # Synthetic clicks avoid mistaking animation or test-driver latency for user timing.
    p.locator(selector).evaluate('(corner) => { for(let i=0;i<5;i++)corner.click() }')
    expect(p.locator('body')).to_have_attribute('data-mode','test')

def run(browser):
    errors=[]
    p=setup(browser,1440,900)
    p.on('pageerror', lambda error: errors.append(str(error)))
    print('Opening built site',flush=True);p.goto(ORIGIN)
    print('Checking canvas',flush=True);visible(p,'#v-canvas');stop(p,0)
    expect(p.locator('.v-speaker')).to_have_attribute('aria-pressed','false')
    visible(p,'#welcome-setup-dialog');shot(p,'invitation-desktop')
    p.locator('label:has([name="setup-language"][value="da"])').click()
    expect(p.locator('#elf-legend')).to_have_text('Vælg din papirnisse')
    p.locator('label:has([name="setup-language"][value="en"])').click()
    onboard(p,'male');choose(p,0);p.reload();stop(p,0)
    expect(p.locator('#welcome-setup-dialog')).to_be_hidden()
    assert p.evaluate('VillageCalendar.elf()')=='male'
    p.locator('.v-menu').click();p.locator('[name="menu-elf"][value="female"]').check()
    p.locator('#v-menu [data-do="close"]').click()
    assert p.evaluate('VillageCalendar.elf()')=='female'
    print('Capturing welcome square',flush=True);p.wait_for_timeout(650)
    shot(p,'welcome-desktop')
    print('Desktop frame timing',json.dumps(timing(p)),flush=True)
    p.locator('.v-speaker').click()
    expect(p.locator('.v-speaker')).to_have_attribute('aria-pressed','true')
    p.locator('.v-speaker').click()
    p.keyboard.press('ArrowLeft');stop(p,12)
    p.keyboard.press('ArrowRight');stop(p,0)
    for n in range(1,13):
        p.locator('[data-do="next"]').click();stop(p,n)
        if args.screenshots:
            p.wait_for_timeout(650);shot(p,'stop-'+str(n).zfill(2))
    p.locator('[data-do="next"]').click();stop(p,0)
    choose(p,1);p.wait_for_timeout(850)
    bounds=p.locator('#v-canvas').bounding_box()
    def touch_door():
        p.mouse.click(bounds['x']+bounds['width']*.645,bounds['y']+bounds['height']*.724)
    touch_door();visible(p,'#toast')
    assert 'December 1, 2026' in p.locator('#toast').inner_text()
    p.locator('#v-enter').click();expect(p.locator('#mission-dialog')).to_be_hidden()
    choose(p,0);five_taps(p,'#square-corner');visible(p,'#v-canvas')
    assert p.evaluate('Array.from({length:12},(_,i)=>VillageCalendar.status(i+1).ready).every(Boolean)')
    # Observe the actual central camera through the renderer in this test page.
    p.evaluate('''async () => {
      const T=await import('./village/vendor/three.module.min.js');
      const original=T.PerspectiveCamera.prototype.updateMatrixWorld;
      window.cameraTrace={radius:0,maximum:0};
      T.PerspectiveCamera.prototype.updateMatrixWorld=function(...args) {
        const r=Math.hypot(this.position.x,this.position.z);
        Object.assign(cameraTrace,{radius:r,fov:this.fov,maximum:Math.max(r,cameraTrace.maximum)});
        return original.apply(this,args);
      };
    }''')
    choose(p,2);p.wait_for_timeout(850)
    assert p.evaluate('cameraTrace.maximum') < .001
    # Allow lazy construction and the camera easing to finish before sampling.
    def settle_camera(fov):
        for _ in range(60):
            if abs(p.evaluate('cameraTrace.fov')-fov)<.04:return
            p.wait_for_timeout(100)
        raise AssertionError(('Camera did not settle',p.evaluate('cameraTrace'),fov))
    base=p.evaluate("Math.max(30,2*Math.atan(13.5/(29*(document.querySelector('#v-canvas').clientWidth/document.querySelector('#v-canvas').clientHeight)))*180/Math.PI)")
    settle_camera(base)
    front=p.evaluate('cameraTrace.fov');p.mouse.move(bounds['x']+bounds['width']*.78,bounds['y']+bounds['height']*.61)
    p.locator('#v-canvas').dispatch_event('wheel', {'deltaX':225,'deltaMode':0})
    p.wait_for_timeout(1800)
    assert p.evaluate('cameraTrace.fov') > front+7.5, (front,p.evaluate('cameraTrace'),p.locator('dialog[open]').count())
    p.wait_for_timeout(800);shot(p,'between-sectors')
    assert p.evaluate('cameraTrace.maximum') < .001
    choose(p,2);settle_camera(base);p.wait_for_timeout(500)
    touch_door();visible(p,'#mission-dialog')
    assert p.evaluate('cameraTrace.maximum') > 12
    assert p.locator('#assignment li').count()>=5
    assert p.locator('#bonus-text').inner_text().strip()
    visible(p,'#mission-dialog .dialog-sound')
    p.locator('#help-button').click();visible(p,'#help-dialog')
    p.locator('#hint-next').click();p.locator('#hint-next').click();visible(p,'#rescue-text')
    p.locator('[data-close="help-dialog"]').click()
    p.locator('#complete-button').click();visible(p,'#undo-button')
    html=b'<!doctype html><html><body><h1>Workshop postcard</h1><button onclick="this.textContent=42">Count</button></body></html>'
    def upload(button, name):
        with p.expect_file_chooser() as chooser:p.locator(button).click()
        chooser.value.set_files({'name':name,'mimeType':'text/html','buffer':html})
        expect(p.locator('#creation-filename')).to_have_text(name)
    upload('#upload-creation','postcard.html')
    p.locator('#open-creation').click();visible(p,'#creation-frame')
    assert p.locator('#creation-frame').get_attribute('sandbox')=='allow-scripts allow-forms'
    frame=p.frame_locator('#creation-frame')
    expect(p.locator('#preview-feedback')).to_contain_text('ready')
    p.locator('#preview-dialog').evaluate('(d) => Promise.all(d.getAnimations().map(a => a.finished))')
    frame.get_by_role('button',name='Count').click()
    expect(frame.get_by_role('button')).to_have_text('42')
    shot(p,'creation-preview')
    p.locator('[data-close="preview-dialog"]').click()
    with p.expect_download() as download:p.locator('#download-creation').click()
    assert download.value.suggested_filename=='postcard.html'
    upload('#replace-creation','revised.html')
    p.locator('[data-close="mission-dialog"]').first.click();stop(p,2)
    expect(p.locator('button[data-stop="2"]')).to_have_class('v-done')
    for _ in range(30):
        p.wait_for_timeout(120)
        if p.evaluate('cameraTrace.radius') < .02:break
    assert p.evaluate('cameraTrace.radius') < .02
    shot(p,'completed-forest')
    print('Mission panel, creation preview, download and replacement passed',flush=True)
    p.reload();choose(p,2);p.locator('#v-enter').click();visible(p,'#mission-dialog')
    visible(p,'#undo-button');shot(p,'mission-panel');expect(p.locator('#creation-filename')).to_have_text('revised.html')
    p.locator('#delete-creation').click();p.locator('#confirm-delete').click();visible(p,'#upload-creation')
    p.locator('#undo-button').click();expect(p.locator('#complete-button')).to_be_enabled()
    p.locator('[data-close="mission-dialog"]').first.click()
    p.locator('.v-menu').click();p.locator('[data-do="exit-test"]').click()
    expect(p.locator('body')).to_have_attribute('data-mode','production');visible(p,'#v-canvas')
    assert p.evaluate('VillageCalendar.progress()')==0
    assert p.evaluate('SantaStorage.get(2).then(record=>!record)')
    assert p.evaluate('Array.from({length:12},(_,i)=>!VillageCalendar.status(i+1).ready).every(Boolean)')
    for code,expected in [('da','Velkomstpladsen'),('sv','Välkomsttorget'),('en','Welcome Square')]:
        p.locator('.v-lang').click();p.locator('[data-code="'+code+'"]').click()
        expect(p.locator('#v-place-name')).to_have_text(expected,timeout=15000)
    # A drag and wheel must navigate without activating any door.
    box=p.locator('#v-canvas').bounding_box();x=box['width']*.8;y=box['y']+box['height']*.6
    p.mouse.move(x,y);p.mouse.down();p.mouse.move(x-box['width']*.46,y,steps=14);p.mouse.up()
    expect(p.locator('#paper-village')).not_to_have_attribute('data-stop','0',timeout=15000)
    expect(p.locator('#mission-dialog')).to_be_hidden()
    choose(p,0);p.mouse.move(x,y);p.mouse.wheel(450,0);stop(p,1)
    assert not errors,errors
    p.evaluate('() => navigator.serviceWorker.ready')
    expect(p.locator('#offline-status')).to_contain_text('Ready offline',timeout=15000)
    p.context.set_offline(True);p.reload();visible(p,'#v-canvas');choose(p,11)
    p.context.set_offline(False);p.close()
    print('Persistence, languages, original date mode and offline reload passed',flush=True)

    p=setup(browser,390,844,is_mobile=True,has_touch=True)
    p.goto(ORIGIN);visible(p,'#welcome-setup-dialog');shot(p,'invitation-mobile')
    five_taps(p,'#invitation-corner');onboard(p,'female');choose(p,0);p.wait_for_timeout(650);shot(p,'welcome-mobile')
    print('Mobile viewport frame timing',json.dumps(timing(p)),flush=True)
    assert p.evaluate('document.documentElement.scrollWidth <= innerWidth')
    cdp=p.context.new_cdp_session(p)
    y=480
    for event,x in [('touchStart',330),('touchMove',295),('touchMove',250),('touchMove',205),('touchMove',160),('touchMove',95),('touchEnd',0)]:
        cdp.send('Input.dispatchTouchEvent',{'type':event,'touchPoints':[] if event=='touchEnd' else [{'x':x,'y':y}]})
    expect(p.locator('#paper-village')).not_to_have_attribute('data-stop','0',timeout=15000)
    expect(p.locator('dialog[open]')).to_have_count(0);p.close()
    p=setup(browser,date='2026-12-01',reduced_motion='reduce')
    p.goto(ORIGIN);onboard(p,'male');choose(p,1);expect(p.locator('#v-enter')).to_have_text('Open the door')
    choose(p,2);expect(p.locator('#v-enter')).to_have_text('Try the door')
    p.locator('.v-menu').click();p.locator('[data-do="classic"]').click();visible(p,'#calendar')
    assert p.locator('#calendar button').count()==12;p.close()
    p=setup(browser)
    p.add_init_script("""const get=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...args){return type.includes('webgl')?null:get.call(this,type,...args)};""")
    p.goto(ORIGIN);visible(p,'#welcome-setup-dialog');visible(p,'#calendar')
    p.close()

def verify_owner_workbench(browser):
    page=setup(browser,reduced_motion='reduce')
    page.goto(ORIGIN)
    visible(page,'#welcome-setup-dialog')
    five_taps(page,'#invitation-corner')
    onboard(page,'male')
    for n in range(1,13):
        choose(page,n)
        page.locator('#v-enter').click()
        visible(page,'#mission-dialog')
        expect(page.locator('#mission-title')).not_to_be_empty()
        if n==12:
            page.locator('#complete-button').click()
            with page.expect_file_chooser() as chooser:
                page.locator('#upload-creation').click()
            chooser.value.set_files({'name':'owner.html','mimeType':'text/html','buffer':b'<html><body>Owner test</body></html>'})
            expect(page.locator('#creation-filename')).to_have_text('owner.html')
        page.locator('[data-close="mission-dialog"]').first.click()
        page.wait_for_timeout(150)
    choose(page,0);shot(page,'male-paper-elf')
    page.locator('.v-menu').click();page.locator('[data-do="exit-test"]').click()
    visible(page,'#welcome-setup-dialog')
    assert page.evaluate('VillageCalendar.progress()')==0
    assert page.evaluate('SantaStorage.get(12).then(record=>!record)')
    five_taps(page,'#invitation-corner')
    visible(page,'#v-canvas');expect(page.locator('#welcome-setup-dialog')).to_be_hidden()
    assert page.evaluate('VillageCalendar.progress()')==1
    assert page.evaluate('SantaStorage.get(12).then(record=>record.filename)')=='owner.html'
    page.close()

def benchmark(browser):
    for width,height in [(1440,900),(390,844)]:
        page=setup(browser,width,height,is_mobile=width<700,has_touch=width<700)
        page.add_init_script("if(self===top)localStorage.setItem('paper-village-missions-2026-olivia',JSON.stringify({name:'Robin',onboarded:true,setupComplete:true}))")
        page.goto(ORIGIN);stop(page,0);page.wait_for_timeout(900)
        result=page.evaluate("""() => new Promise(resolve => {
          const delta=[];const next=document.querySelector('[data-do="next"]');
          let start=0,last=0,steps=0,nextAt=0;
          function measure(t) {
            if(!start)start=t;
            if(last)delta.push(t-last);last=t;
            if(steps<26 && t>=nextAt) {next.click();steps++;nextAt=t+500;}
            if(steps===26 && t>nextAt+450) {
              const seconds=(t-start)/1000;
              delta.sort((a,b)=>a-b);
              resolve({width:innerWidth,height:innerHeight,frames:delta.length,seconds:+seconds.toFixed(2),
                fps:+(delta.length/seconds).toFixed(1),p95ms:+delta[Math.floor(delta.length*.95)].toFixed(1)});
              return;
            }
            requestAnimationFrame(measure);
          }
          requestAnimationFrame(measure);
        })""")
        print('Continuous navigation',json.dumps(result),flush=True)
        page.close()

with http_fixture() as ORIGIN, sync_playwright() as playwright:
    browser=playwright.chromium.launch(executable_path=args.chromium,
        args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'] if args.software_gl else [])
    print('Chromium',browser.version,flush=True)
    try:
        if args.motion_benchmark:benchmark(browser)
        else:
            run(browser)
            verify_owner_workbench(browser)
    finally:browser.close()
    if not args.motion_benchmark:print('PASS: circle, inputs, locks, onboarding, owner mode, languages, audio, mission lifecycle, local files, sandbox, reduced motion and fallback')
