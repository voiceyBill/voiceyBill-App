# Contributing to voiceyBill-App

Thanks for your interest in contributing.

## Ground rules

- Be respectful and constructive in all discussions.
- Focus pull requests on one clear change.
- Open an issue before starting major features.
- Do not start working on any issue without commenting on it first and being assigned. PRs for unassigned issues will be closed.
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
- Use the PR template at [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md). It loads automatically when you open a PR. Fill in every section before requesting review.

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

## Issues and templates

Issues of all kinds are welcome. You do not need permission to open one. Bug reports, feature ideas, questions, suggestions, discussions, and anything else you want to raise are all fair game.

When your issue matches one of the templates below, use it. GitHub shows the template picker automatically when you click New Issue:

- **Bug report** - a reproducible defect with steps, expected result, and actual result
- **Feature request** - a new feature or improvement with a clear problem statement
- **Question** - usage, setup, or clarification help

Templates are at [`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE/). If your issue does not fit any template, open a blank issue and describe it clearly. Do not leave required template fields empty.

Keep one issue focused on one topic so it can be triaged quickly. Include a screenshot or recording for anything visual or hard to explain in text.

Before picking up any open issue to work on, comment on the issue to express your interest and wait to be assigned. You can also reach out on Discord first. Do not open a pull request for an issue that has not been assigned to you.

## Security policy

- Do not open public issues for security vulnerabilities.
- Use GitHub Security Advisories for responsible disclosure.

## Helpful setup reminders

- Mobile development is done with Expo tooling on your machine, not in Docker.
- Use your local backend URL in the app environment file when testing end-to-end changes.
