# Contributing to Santa's Secret Missions 🎄

Thank you for helping make the North Pole more imaginative!

This is a free, open-source advent calendar for young makers. You are welcome to **fork the repository**, personalize the story and missions, create new languages, fix bugs, or send improvements back through a **pull request**.

## Make your own version

1. Click **Fork** on [the original repository](https://github.com/tonielar/santas-secret-missions).
2. Edit your fork's mission text, artwork or styles.
3. Follow [DEPLOYMENT.md](DEPLOYMENT.md) to publish your own calendar on GitHub Pages.
4. Respect local browser privacy: no uploaded HTML projects, names or completion data should be sent to a server without explicit consent.

Forking does not alter the original website or anyone else's progress.

## Suggest a change to the original

1. Fork the repository and create a branch for your changes.
2. Run the checks before submitting:
   ```sh
   python3 scripts/build.py
   python3 scripts/check.py
   node scripts/test-service-worker.cjs
   ```
3. Open a pull request explaining the change and, for visual updates, include before/after screenshots.
4. Keep contributions accessible, mobile-friendly and usable without paid accounts.

## Guidelines

- Keep the missions age-appropriate, creative, welcoming and privacy-respecting.
- Preserve the standalone HTML outcome and avoid unnecessary dependencies.
- Check English, Danish and Swedish when updating shared interface text.
- Avoid spoilers in labels for unopened December doors.
- Respect reduced-motion preferences and keyboard accessibility.
- Do not commit secrets, personal data or copies of children's creations.
- Only contribute code, text or imagery you have the right to share under the MIT License.

## License

By contributing, you agree that your contributions can be distributed under the project's [MIT License](LICENSE).

The original project is maintained by Tonie Larsson. Forks and pull requests are welcome, but maintainers decide which changes enter the original.
