# Santa’s Secret Missions • Village preview

The experimental calendar opens in Welcome Square. Select **Explore the village** for the original name, language, letter and Golden Rules sequence. Click Santa to revisit his rules, the post office to read the story, or a number on the route to visit that house. The doors keep the original December 2026 schedule. [Open the independent preview](https://santas-paper-village-preview.tonie81.chatgpt.site)

![Rendered desktop view of the post office and Welcome Square](welcome-desktop.jpg)

## Review the experience

- Drag, swipe, scroll or use the arrow keys to turn the camera. The route wraps from the Christmas Palace directly to Welcome Square in either direction.
- Try a sealed door to see the padlock rattle, snow slide from the roof and the elf react. An available door opens into the existing mission panel. Close it to return to the same view.
- Complete a mission to hang a gold star and festive trim on its house. Saved creations, hints, completion and undo use the original workbench.
- The speaker starts muted. It switches the original synthesized celesta melody and short interaction sounds on or off. A speaker remains reachable inside dialogs.
- Use **Village menu → Classic calendar** for the original layout. It also opens automatically when WebGL is unavailable. Sustained slow frames expose a direct classic-calendar link in the route footer.

The preview uses a separate origin, IndexedDB database names, localStorage keys and a scope-specific cache prefix. It stores names, stars, language and creation files on the visitor’s device. Owner mode uses its own progress and creation records. [Classic preview](https://santas-paper-village-preview.tonie81.chatgpt.site/?view=classic)

## Run locally

Use Python 3 to build the self-contained static site. The build includes Three.js, fonts, licenses, village modules and the original calendar. No package installation is required to serve it.

```sh
git clone --branch experimental/3d-christmas-village --single-branch https://github.com/tonielar/santas-secret-missions.git
cd santas-secret-missions
python3 scripts/build.py
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Open `http://127.0.0.1:8000/`. The classic view is at `/?view=classic`. To review the locally unlocked development build, serve the repository root with `python3 -m http.server 8001 --bind 127.0.0.1` and open `http://127.0.0.1:8001/dev/test.html`. The generated single-file development download opens the original calendar offline. The hosted artifact contains only the allowlisted production-mode shell.

## Rendered screenshots

| Welcome and mission screens | Houses 1–6 | Houses 7–12 |
| --- | --- | --- |
| [Welcome Square on desktop](welcome-desktop.jpg) | [Gingerbread Cottage](stop-01.jpg) | [Aurora Cabin](stop-07.jpg) |
| [Mobile viewport](welcome-mobile.jpg) | [Winter Forest](stop-02.jpg) | [Snowman Cottage](stop-08.jpg) |
| [Original mission panel](mission-panel.jpg) | [Frostglass Hall](stop-03.jpg) | [Reindeer Lodge](stop-09.jpg) |
| [Interactive creation preview](creation-preview.jpg) | [Christmas Bakery](stop-04.jpg) | [Candy Shop](stop-10.jpg) |
| [Completed house](completed-forest.jpg) | [Elf Workshop](stop-05.jpg) | [Star Observatory](stop-11.jpg) |
| | [Lantern Market](stop-06.jpg) | [Christmas Palace](stop-12.jpg) |

## Browser and build checks

The automated suite runs Chromium on the built `dist/` folder through a temporary loopback HTTP server. Each browser context gets fresh device-local storage. The mobile run uses a 390 × 844 viewport, touch input emulation and a device scale factor of 1.

| Area | Verified behavior |
| --- | --- |
| Build and original content | 12 missions, 36 hints, seven rules, icons, manifest, assets and exclusion of development fixtures |
| Date boundaries | All 12 local-midnight changes in UTC and Europe/Copenhagen, plus a December 1 browser visit |
| Circular exploration | All 13 stops, wraparound, reverse navigation, keyboard, wheel, mouse drag and touch swipe |
| Camera and doors | The camera stays at the center during ordinary navigation, moves for door entry, and returns after closing the panel. Physical clicks on sealed and open doors exercise both states. |
| Mission and files | Hints, bonus text, owner mode, completion, undo, IndexedDB persistence, upload, interaction inside a sandboxed frame, download, replacement and deletion |
| Preferences and fallback | First-visit setup, English/Danish/Swedish switching, audio initially muted, a speaker in the mission panel, reduced-motion entry and fallback with WebGL disabled |
| Offline | Service-worker installation, offline reload, navigation to another 3D stop, cache repair, explicit update activation and scope-isolated cache cleanup |

Run the original checks with Python and Node. The optional browser suite requires Python Playwright and Chromium. It starts its own temporary test server.

```sh
python3 scripts/build.py
python3 scripts/check.py
node scripts/test-service-worker.cjs
python3 -m pip install playwright
python3 -m playwright install chromium
python3 scripts/test-village.py --software-gl --screenshots /tmp/village-screens
python3 scripts/test-village.py --software-gl --motion-benchmark
```

To select an installed Chromium binary, add `--chromium /path/to/chromium`.

## Measured performance and limits

Chromium 156.0.8078.79 ran with SwiftShader software rendering. The navigation benchmark advanced through 26 stops, covering two full circuits. FPS is the number of frame callbacks divided by elapsed time, including transitions and first visits to lazy-built houses.

| Viewport | Elapsed | Average FPS | 95th-percentile frame interval |
| --- | ---: | ---: | ---: |
| 1440 × 900 desktop | 14.83 s | 8.0 | 267 ms |
| 390 × 844 mobile emulation | 14.10 s | 21.3 | 100 ms |

Both software-rendered runs fell below the 30 FPS target. The renderer batches static folds, instances trees, builds nearby houses on demand, reduces the moving drawing buffer on software GPUs, caches shadow maps and offers the classic view on slow devices. Hardware-accelerated desktop performance, physical iPhone Safari and Android performance, and native home-screen installation still need device testing. The offline check covered a browser reload using the installed service worker.

## Source guide

`village/world.js` coordinates the central camera, companion, door transitions, hit testing and quality changes. `landscape.js`, `weather.js` and `street.js` build the connected scenery. The post office, house designs and articulated characters live in `welcome.js`, `houses.js` and `characters.js`. The scene reads date, progress and mission actions through the calendar interface in `app.js`. The original sandbox implementation is in `preview.js`.

The paper geometry and music were made for the village. Three.js ships under its MIT license. The bundled DM Sans and DM Serif Text fonts include their SIL Open Font Licenses under `village/fonts/`.
