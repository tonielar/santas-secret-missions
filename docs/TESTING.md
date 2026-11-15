# Verification record

Implementation and testing date: November 14, 2026. Browser checks used the available desktop Chromium environment and narrow iframe viewports. Physical iPhones/Android devices were not available.

## Passed in the actual browser

| Area | Evidence |
| --- | --- |
| Preserved presentation | Original Santa SVG, village cottages, palette, letter/assignment layout and handbook inspected visually |
| Door states | Twelve dated doors; no titles underneath or in locked accessible names; large padlocks; gold stars after manual completion |
| Onboarding | Welcome button opened revised Golden Rules; village button completed onboarding; refresh did not repeat it |
| Copy and help | Opened all twelve missions; all 36 revised hints displayed; all twelve Copy Prompt controls reported successful copy operations; handbook opened without losing the mission |
| Local import handler | Synthetic browser `File` fixtures passed through the real file-input/change handler and were stored using the actual IndexedDB implementation |
| Interactive game | Imported counter game opened in the sandbox; clicks changed score from 0 to 20; phone-size preview also responded correctly |
| Interactive tool | Replaced the game with a simple packing tool; a form added the entered item correctly |
| Validation | Wrong extension rejected; incomplete HTML rejected; prior saved creation retained |
| Persistence | Full page reload retained imported filename and star; reopening the mission recovered the stored file |
| Independence | Import and replacement did not change the star; completion worked without a file; undo worked; deletion left the star intact |
| Export | Download Creation produced a completed browser download event and file path |
| Delete confirmation | Cancelling retained the file; confirming removed only the app's local record |
| Preview controls | Back to mission, Restart and Expand worked; expanded preview retained its parent toolbar and sandbox |
| Isolation | Synthetic attempts to read/modify parent DOM, use localStorage or open IndexedDB were blocked; parent DOM remained unchanged |
| Network/navigation | Preview fetch and top navigation were blocked; self-navigation was blocked by CSP and produced a contained frame error, leaving the calendar accessible |
| Phone layout | At 320 and 390 CSS-pixel frame widths, page scroll width equalled viewport client width; mission/workbench scrolling and interactive preview inspected |
| Production separation | Production showed 0/12 while the test build had a star; production dates stayed locked and the TEST label was absent |
| Service worker | Production showed Ready offline after registration and shell installation |
| Real update | An existing cached app displayed Update app after a content-version change; choosing it reloaded into the new app and cleared the prompt |
| Real offline reload | Stopped the development preview server, reloaded production, and still opened all twelve door controls and all seven Golden Rules from the cached shell; onboarding stayed completed |

The native browser file chooser stalled in the automation environment. Import-handler checks therefore used synthetic local File objects through a development-only fixture panel, rather than claiming that iOS Files selection was verified. No real child's creation was used in testing.

Clipboard copy operations returned success, but pasting into another application was not independently verified. Browser download completion was verified; the exported bytes were not independently compared with the original fixture.

## Automated regression checks

Run:

```sh
python3 scripts/build.py
python3 scripts/check.py
node scripts/test-service-worker.cjs
```

Passed checks include:

- Twelve approved mission records, all December dates, 36 distinct hints and seven revised rules.
- Manifest configuration, all referenced assets and PNG dimensions.
- Production-only packaging: no `dev/`, fixtures, documentation or development code in the Pages artifact.
- No public test link, no date-lock bypass UI, and no privileged same-origin iframe sandbox permission.
- Offline navigation and asset responses with network fetching deliberately unavailable in the worker test.
- Evicted-asset repair online, explicit update activation and cleanup restricted to this app's cache scope.
- Ignoring unrelated requests, imported files and development navigation.
- All twelve date boundaries: locked one millisecond before midnight, available at local midnight, still available in January 2027, and ignored in test mode. Exercised in UTC and Europe/Copenhagen using the actual app date functions.
- JavaScript syntax of app files and all five embedded scripts in the standalone test build.

## Reproduce the local file-handler tests

Serve the project root as described in README, then open `/dev/qa.html`. Open any mission and expand **Development QA fixtures (not deployed)** inside its workbench. These synthetic controls use the same input change handler as file selection. `dev/test.html` has the clean child-facing test UI. The QA panel, fixture scripts and standalone test file are excluded from deployment.

The test frame's CSP violations and storage-access exceptions are expected when running the security fixture. They are evidence of containment, not app errors to “fix” by adding permissions.

## Not verified — complete before family rollout

- Actual iPhone Safari file selection from Files, installed Home Screen operation, Share → Add to Home Screen, Open as Web App behaviour and modal scrolling with an on-screen keyboard.
- Actual iPhone/Android app termination, relaunch and airplane-mode operation. Desktop server-off reload passed, which is useful but does not establish every mobile lifecycle behaviour.
- Actual Android touch input, native install prompt and device download destinations.
- Safari/Firefox differences in sandbox/CSP support, user-triggered Web Audio, canvas downloads and advanced creation features. No claim that every HTML application works in the sandbox.
- Storage quota exhaustion, browser-enforced eviction, private browsing restrictions, multi-tab IndexedDB upgrade blocking and recovery after low-disk conditions. Friendly failure paths exist; all combinations were not physically exercised.
- Reduced-motion operation on a device with that accessibility preference enabled. CSS disables decorative motion; physical preference testing remains pending.
- A production GitHub Pages deployment, HTTPS installation on the final URL, and a real GitHub Actions run. Source checks passed, but no repository/site was created by this session.
- Closed-app notifications: intentionally not implemented, requested or claimed.

## Suggested physical-device smoke test

1. Deploy using DEPLOYMENT.md and install the production website from Safari.
2. Wait for Ready offline, close the app, enable airplane mode and reopen it.
3. Use a locally served or otherwise privately tested unlocked build to select an ordinary HTML file through Files. Never publish the unlocked build with production.
4. Open the creation, tap its controls, return, close/reopen, replace, export and delete the local copy.
5. Confirm that a mission star stays independent throughout.
6. Repeat the creation/preview test in Android Chrome and test an ordinary Web Audio creation with a user tap.
7. Deploy a small visible update and use the update button. Confirm name, stars and local creations remain.
