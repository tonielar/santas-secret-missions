# Publish under Tonie's personal GitHub account

**Deployment status:** the project has been built locally. It has not been published. The connected GitHub account was verified as `tonielar`; its accessible personal repositories did not include `santas-secret-missions`. The available connector can edit existing repositories, but exposes neither new repository creation nor Pages administration. Nothing was written to ScanTherm.

## Create and upload with GitHub in your browser

1. Sign in as **tonielar** and create a repository named **santas-secret-missions**.
2. Confirm that **Owner is tonielar**, not ScanTherm.
3. Select **Public** for GitHub Free Pages hosting.
4. Do not add a licence yet. MIT is proposed, awaiting your decision.
5. Extract the delivered project ZIP. Upload the contents of the `santas-secret-missions` folder to the repository root. `index.html` and `README.md` must be directly at the root, not inside an extra nested folder.
6. Include the `.github/workflows/deploy.yml` file. Some file pickers hide dot-folders. If it was omitted, use **Add file → Create new file**, enter `.github/workflows/deploy.yml`, and paste the supplied workflow exactly.
7. Open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
8. Open **Actions → Deploy Santa to GitHub Pages → Run workflow** on `main`. If a push already started a run, allow it to finish; run again after enabling Pages if the initial run failed because Pages was not configured.
9. After a successful deployment, open **Settings → Pages → Visit site**. With the specified account and repository, the expected address is `https://tonielar.github.io/santas-secret-missions/`.
10. Open that HTTPS address in Safari on Olivia's phone, wait for **Ready offline** in the footer, and follow [INSTALL.md](INSTALL.md).

The address above is the expected GitHub convention; it is not a claim that a live deployment has been created or verified.

## Alternative: use Git locally

After creating an **empty** public repository in step 1 (no README, licence or gitignore generated on GitHub), run these commands inside the extracted project folder:

```sh
python3 scripts/build.py
python3 scripts/check.py
node scripts/test-service-worker.cjs

git init -b main
git add .
git commit -m "Build Santa's Secret Missions PWA"
git remote add origin https://github.com/tonielar/santas-secret-missions.git
git push -u origin main
```

Then complete steps 7–10 above. Authenticate using your normal GitHub sign-in; no credentials belong in these files.

## What the workflow publishes

The workflow runs a small Python build, structural checks and offline-worker tests, then uploads **only the generated `dist/`** to Pages. `dev/test.html`, test fixtures, documentation, source-only tools and imported creations are not deployed.

Do not choose branch/root publishing for this repository: doing so would also expose development files as web pages. Use the supplied GitHub Actions workflow. The test build remains accessible as source in a public repository, which is different from deploying an unlocked calendar on Pages.

GitHub Pages supports this static application without a server. Standard public-repository Actions runners are free within GitHub's applicable terms and service limits. No credit card, paid host or notification provider is required by this implementation.

## Subsequent changes

Push updated source to `main`. The workflow rebuilds the offline cache version automatically. Existing installations show an update message when the new worker is ready; choose **Update app**. Keep `manifest.webmanifest`'s ID and start URL stable to retain the installed app identity. Keep the website URL stable to retain device-local storage.

Before sharing with other families, complete the physical-device checklist in `docs/TESTING.md` and settle the licence decision.
