# Santa's Secret Missions 🎅

A shareable Christmas invention adventure for curious children aged roughly 12–15. Twelve doors open every other day, December 1–23, 2026. Each assignment helps a child plan, build, test and improve something using AI. Every **mission creation** is one standalone HTML file; the calendar itself is a small installable PWA.

The original North Pole village, Santa artwork and readable mission panels have been preserved. The app includes a first-visit name/language setup (English, Danish and Swedish), a local inventor's workbench, isolated interactive previews, installation help, offline caching, and a snowy North Pole village.

## Experimental village preview

Explore the circular paper village on this branch. The review includes setup instructions, screenshots of every stop, browser test results and measured performance. [Open the preview](https://santas-paper-village-preview.tonie81.chatgpt.site) · [Village review](docs/village-review/README.md)

## Start here

- **Publish:** follow [DEPLOYMENT.md](DEPLOYMENT.md). Intended repository: `tonielar/santas-secret-missions`, under the personal account, not ScanTherm.
- **Use on iPhone:** follow [INSTALL.md](INSTALL.md).
- **Security and privacy:** see [docs/SECURITY.md](docs/SECURITY.md).
- **Verified behaviour and remaining checks:** see [docs/TESTING.md](docs/TESTING.md).
- **Notifications:** see [docs/NOTIFICATIONS.md](docs/NOTIFICATIONS.md).

No accounts, API keys, backend, analytics, advertising, databases on a server or paid services are required. Public GitHub Pages and standard public-repository GitHub Actions runners are free within GitHub's service limits. Children need no GitHub account. ChatGPT is a separate tool; a paid ChatGPT plan is not required by this calendar.

## Run locally

Use Python 3 (no Python packages are needed):

```sh
python3 scripts/build.py
python3 scripts/check.py
node scripts/test-service-worker.cjs
python3 -m http.server 8000
```

Open `http://localhost:8000/` for production or `http://localhost:8000/dev/test.html` for the unlocked test build. A self-contained `dev/Santas_Secret_Missions_PWA_TEST.html` is also generated for convenient desktop/offline review; it does not install a service worker. Node is needed only for the service-worker tests, not for the app or build. Use HTTPS when hosting publicly. Opening `index.html` directly from Files is not a PWA installation and cannot register a service worker.

In ChatGPT's managed preview environment, the supplied preview uses the `dist` directory. It is a development preview, not the deployed GitHub Pages site.

## Using the inventor's workbench

1. Open an unlocked mission and build its creation with AI.
2. Save the finished `.html` file in Files or Downloads.
3. Choose **Upload My Creation** in the mission. Despite the familiar label, this imports the file **only into this browser on this device**.
4. Choose **Open My Creation** and interact with the isolated preview.
5. Replace the file after making improvements with AI.
6. Mark **Mission Completed!** yourself whenever satisfied.

Each mission keeps one local copy, up to 10 MB. Replace overwrites that mission's local copy only. Download exports the exact stored HTML. Delete asks first and removes only the app's local copy. Upload, replace, download and delete never change a mission's completion status. A star never requires a file.

Names and stars are saved in localStorage. HTML creations use IndexedDB. Test and production use different keys and different IndexedDB databases. Website data, cleared storage, device changes and app removal may lose local copies: **keep original files as backups**. There is no cloud sync. Old standalone-file progress cannot automatically migrate to a new HTTPS website because it has a different browser origin; same-origin upgrades retain the earlier calendar's star/name keys.

## Preview boundaries

Ordinary self-contained HTML with inline JavaScript, CSS, canvas, SVG, controls and user-triggered Web Audio can be previewed. The frame has a unique opaque origin and cannot read the calendar, localStorage or stored creations. External scripts/resources, network APIs, external frame navigation, popups, top navigation, camera, sensors, downloads and other privileged features are restricted. Forms handled locally in JavaScript are supported; sending forms is blocked.

For example, a packing tool that insists on localStorage may need AI to add an in-memory fallback to work in this preview. Phone motion is an optional snow-globe bonus and is not promised here. Preview expansion fills the app viewport and keeps the safe parent toolbar visible; it does not remove the sandbox or grant browser Fullscreen permissions.

This is a browser sandbox, not a virtual machine. A runaway script may freeze its frame or, in some browsers, the tab. The app cannot guarantee that every possible HTML project works, or automatically grade a child's work. Physical iPhone/Android testing remains an explicit release checklist, not a claimed completed test.

## Update the calendar

Edit readable source files at the project root. The approved copy is in `content.js`; the preserved illustrations are inline SVG in `index.html`; styling is in `app.css`.

Run `python3 scripts/build.py` before deploying. It creates a content-derived service-worker version and an allowlisted `dist/` folder. The workflow publishes **only `dist/`**, never `dev/`, documentation, test files or locally imported creations. The service worker caches a complete version together, offers an update, and activates the replacement when the user chooses **Update app**. The app checks for updates when it returns to the foreground. Updates do not delete local stars or creations.

The production app has a hidden, device-local owner test switch for previewing unlocked doors. Test stars and creations use separate local storage. All mission copy exists in the static source; date locking is a family calendar feature, not a security boundary.

## Source map

| File | Purpose |
| --- | --- |
| `index.html`, `app.css` | Preserved village artwork and accessible dialogs |
| `content.js`, `locale-*.js`, `i18n.js` | Original missions, translations and language selection |
| `app.js` | Calendar, onboarding, completion and local file controls |
| `storage.js` | IndexedDB operations and transaction-safe saves |
| `preview.js` | Untrusted HTML preparation, sandbox and status messages |
| `pwa.js` | Installation help, service-worker registration and update UI |
| `manifest.webmanifest`, `icons/` | Installable app identity |
| `scripts/sw.template.js`, `sw.js` | Offline worker template and generated worker |
| `scripts/build.py`, `scripts/check.py` | Dependency-free build and packaging checks |
| `scripts/test-service-worker.cjs` | Offline/update regression tests |
| `dev/test.html` | Unlocked local test build; excluded from Pages |
| `.github/workflows/deploy.yml` | Build, validate and deploy production only |

## Open source — fork and make it your own 🎄

**Santa's Secret Missions is open source under the [MIT License](LICENSE).** You are welcome to use it, fork it, translate it, customize the missions and artwork, and publish a different version of your own. Keep the copyright and license notice in copies or substantial portions of the source.

Want to improve the original calendar? We welcome **pull requests**! See [CONTRIBUTING.md](CONTRIBUTING.md) for how to fork, run the checks and submit changes.

**Live app:** https://tonielar.github.io/santas-secret-missions/

Each visitor's names, progress, language preference, saved HTML creations and offline cache are stored in that visitor's own browser/device, not shared with other visitors. A fork doesn't affect this original site.

## Reference documentation

- [GitHub Pages and free public hosting](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [GitHub Pages with Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Service-worker lifecycle and caching](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)
- [iframe sandbox permissions](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe#sandbox)
