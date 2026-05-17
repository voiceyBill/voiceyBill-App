# Contributing to voiceyBill-App

Thanks for your interest in contributing.

## Ground rules

- Be respectful and constructive in all discussions.
- Focus pull requests on one clear change.
- Open an issue before starting major features.
- Do not include secrets or production credentials in any commit.
- Use the issue templates for every new issue. Blank issues are disabled.
- Use the PR template for every pull request. PRs without the template completed are not considered ready for review.
- Include screenshots, screen recordings, or GIFs for any UI, navigation, or animation changes.

## Development setup

1. Fork and clone the repository.
2. Use Node.js 20 or later.
3. Install dependencies:

```bash
npm ci
```

4. Start the app with Expo:

```bash
npm run start
```

5. Run on device/simulator:

```bash
npm run android
npm run ios
```

## Branch and commit conventions

- Branch names should be descriptive, for example:
  - `feat/add-voice-note-validation`
  - `fix/transaction-list-pagination`
- Use clear commits that explain why the change is needed.

## Pull request requirements

- PR titles are validated in CI and should follow Conventional Commits style:
  - `feat(mobile): Add transaction voice input`
  - `fix(transactions): Correct pagination handling`
- Keep PRs small and easy to review.
- Link related issues, for example `Closes #123`.
- Include screenshots or recordings for UI changes.

## Quality checks

Before opening a PR, run:

```bash
npx tsc --noEmit
npm test --if-present
```

If lint scripts are available in future:

```bash
npm run lint --if-present
```

## Issue reporting

- Use the bug template for defects. Attach screenshots, console logs, and screen recordings when relevant.
- Use the feature template for enhancements. Include mockups, references, or videos when the request is visual.
- Use the question template for usage help.
- If you paste links to images or videos, make sure they are accessible to maintainers.

## Security policy

- Do not open public issues for security vulnerabilities.
- Use GitHub Security Advisories for responsible disclosure.

## Helpful setup reminders

- Mobile development is done with Expo tooling on your machine, not in Docker.
- Use your local backend URL in the app environment file when testing end-to-end changes.
