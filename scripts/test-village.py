#!/usr/bin/env python3
"""Exercise the built preview in Chromium. Requires the Playwright Python package."""
import argparse
import datetime
import json
import mimetypes
from pathlib import Path
from urllib.parse import unquote, urlsplit

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
ORIGIN = 'https://village.test/'
parser = argparse.ArgumentParser()
parser.add_argument('--chromium', help='Use an existing Chromium executable')
parser.add_argument('--screenshots', type=Path, help='Save review images in this directory')
parser.add_argument('--software-gl', action='store_true', help='Use the bundled SwiftShader renderer')
args = parser.parse_args()
if args.screenshots:
    args.screenshots.mkdir(parents=True, exist_ok=True)

def assets(route):
    name = unquote(urlsplit(route.request.url).path).lstrip('/') or 'index.html'
    file = (DIST / name).resolve()
    if file.is_relative_to(DIST) and file.is_file():
        route.fulfill(path=file, content_type=mimetypes.guess_type(str(file))[0] or 'application/octet-stream')
    else:
        route.abort()

def setup(browser, width=1280, height=800, date='2026-11-25', **options):
    p = browser.new_page(viewport={'width':width,'height':height}, device_scale_factor=1,
                         service_workers='block', **options)
    p.route(ORIGIN+'**', assets)
    stamp=int(datetime.datetime.fromisoformat(date+'T14:00:00+00:00').timestamp()*1000)
    p.add_init_script(f'''{{ const NativeDate=Date;
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

def run(browser):
    errors=[]
    p=setup(browser,1440,900)
    p.on('pageerror', lambda error: errors.append(str(error)))
    print('Opening built site',flush=True);p.goto(ORIGIN)
    print('Checking canvas',flush=True);visible(p,'#v-canvas');stop(p,0)
    expect(p.locator('.v-speaker')).to_have_attribute('aria-pressed','false')
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
        if n in (1,2,3,6,7,10,11,12):
            p.wait_for_timeout(650);shot(p,'stop-'+str(n).zfill(2))
    p.locator('[data-do="next"]').click();stop(p,0)
    choose(p,1);p.locator('#v-enter').click();visible(p,'#toast')
    assert 'December 1, 2026' in p.locator('#toast').inner_text()
    p.locator('#v-enter').click();expect(p.locator('#mission-dialog')).to_be_hidden()
    choose(p,0);p.locator('#v-enter').click();visible(p,'#welcome-setup-dialog')
    p.locator('#setup-name').fill('Robin');p.locator('#setup-begin').click();visible(p,'#intro-dialog')
    p.locator('#start-button').click();visible(p,'#rules-dialog');p.locator('#rules-next').click();stop(p,1)
    print('Circle, locked doors and first-visit setup passed',flush=True)
    # Existing owner gesture opens and isolates the real unlocked application.
    for _ in range(7):p.locator('.v-foot>span').first.dispatch_event('click')
    expect(p.locator('body')).to_have_attribute('data-mode','test');visible(p,'#v-canvas')
    choose(p,2);p.locator('#v-enter').click();visible(p,'#mission-dialog')
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
    frame.get_by_role('button',name='Count').click();expect(frame.get_by_role('button')).to_have_text('42')
    p.locator('[data-close="preview-dialog"]').click()
    with p.expect_download() as download:p.locator('#download-creation').click()
    assert download.value.suggested_filename=='postcard.html'
    upload('#replace-creation','revised.html')
    p.locator('[data-close="mission-dialog"]').first.click();stop(p,2)
    p.wait_for_timeout(1400);shot(p,'completed-forest')
    print('Mission panel, creation preview, download and replacement passed',flush=True)
    p.reload();choose(p,2);p.locator('#v-enter').click();visible(p,'#mission-dialog')
    visible(p,'#undo-button');expect(p.locator('#creation-filename')).to_have_text('revised.html')
    p.locator('#delete-creation').click();p.locator('#confirm-delete').click();visible(p,'#upload-creation')
    p.locator('#undo-button').click();expect(p.locator('#complete-button')).to_be_enabled()
    p.locator('[data-close="mission-dialog"]').first.click()
    p.locator('.v-menu').click();p.locator('[data-do="exit-test"]').click()
    expect(p.locator('body')).to_have_attribute('data-mode','production');visible(p,'#v-canvas')
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
    p.close()

    p=setup(browser,390,844,is_mobile=True,has_touch=True)
    p.goto(ORIGIN);stop(p,0);p.wait_for_timeout(650);shot(p,'welcome-mobile')
    print('Mobile viewport frame timing',json.dumps(timing(p)),flush=True)
    assert p.evaluate('document.documentElement.scrollWidth <= innerWidth')
    cdp=p.context.new_cdp_session(p)
    y=480
    for event,x in [('touchStart',330),('touchMove',295),('touchMove',250),('touchMove',205),('touchMove',160),('touchMove',95),('touchEnd',0)]:
        cdp.send('Input.dispatchTouchEvent',{'type':event,'touchPoints':[] if event=='touchEnd' else [{'x':x,'y':y}]})
    expect(p.locator('#paper-village')).not_to_have_attribute('data-stop','0',timeout=15000)
    expect(p.locator('dialog[open]')).to_have_count(0);p.close()
    p=setup(browser,date='2026-12-01',reduced_motion='reduce')
    p.goto(ORIGIN);choose(p,1);expect(p.locator('#v-enter')).to_have_text('Open the door')
    choose(p,2);expect(p.locator('#v-enter')).to_have_text('Try the door')
    p.locator('.v-menu').click();p.locator('[data-do="classic"]').click();visible(p,'#welcome-setup-dialog')
    assert p.locator('#calendar button').count()==12;p.close()
    p=setup(browser)
    p.add_init_script("""const get=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...args){return type.includes('webgl')?null:get.call(this,type,...args)};""")
    p.goto(ORIGIN);visible(p,'#welcome-setup-dialog');visible(p,'#calendar')
    p.close()

with sync_playwright() as playwright:
    browser=playwright.chromium.launch(executable_path=args.chromium,
        args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'] if args.software_gl else [])
    print('Chromium',browser.version,flush=True)
    try:run(browser)
    finally:browser.close()
    print('PASS: circle, inputs, locks, onboarding, owner mode, languages, audio, mission lifecycle, local files, sandbox, reduced motion and fallback')
