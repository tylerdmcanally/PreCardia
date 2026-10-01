# CardioTools deployment

GitHub Pages is the primary publishing target. The app source lives in `cv-risk-calculator/`.

- Site: https://tylerdmcanally.github.io/PreCardia/
- PreCardia: https://tylerdmcanally.github.io/PreCardia/#/precardia
- CV Optimization: https://tylerdmcanally.github.io/PreCardia/#/prevent-calculator
- Workflow: [`.github/workflows/pages.yml`](.github/workflows/pages.yml)

## Routine releases

Push or merge reviewed changes to `main`. GitHub Actions installs locked dependencies with Node 24, runs `npm test`, builds the Pages site and deploys the build artifact. A failed test or build prevents deployment. Pull requests run the build and tests without publishing. A manual run is also available from the repository’s Actions tab; deployment is restricted to `main`.

Update the version and release notes for user-facing releases as described in the [app README](cv-risk-calculator/README.md#version-history).

## Repository setup

Under **Settings → Pages → Build and deployment**, set the source to **GitHub Actions**. The `github-pages` environment is used by the deployment job. No deployment token or third-party hosting account is needed: the workflow uses GitHub’s temporary token with Pages and OIDC permissions only in the deploy job. Official actions are pinned to commit SHAs.

## Local verification

From `cv-risk-calculator/`:

```sh
npm ci
npm test
npm run build:pages
npm run preview:pages
```

Open `http://localhost:4173/PreCardia/`. The Pages build uses `/PreCardia/` as its asset base and hash routing. Verify both tools, a direct `#/precardia` link, refresh, report generation and version notes. A custom domain or repository rename requires revisiting the configured asset base.

`npm run build` and `npm run dev` retain browser routing at `/` for local development and hosts with SPA rewrites. The existing `vercel.json` is retained as an alternate-host configuration. Changing the primary hosting target does not delete the old Vercel project or its deployment history.

## Confirming a deployment

1. Check that **Deploy CardioTools to GitHub Pages** succeeded for the intended `main` commit.
2. Open the site and both tool links above, then refresh a tool page.
3. Check for missing assets or browser errors and generate a synthetic assessment report.
4. Verify the displayed version under **What’s new**.

## Troubleshooting and rollback

- **Missing assets:** verify that `build:pages` was used and that the site URL includes `/PreCardia/`.
- **404 on a calculator link:** use the published hash URLs above. Pages does not provide the previous host’s SPA rewrite behavior.
- **Pages deployment denied:** check Settings → Pages and the `github-pages` environment’s deployment rules; keep the publishing branch set to `main`.
- **Build failure:** inspect the failed Actions job. Use `npm ci` with the committed lockfile rather than regenerating dependencies to work around an error.
- **Rollback:** revert the problematic commit on `main` and push the revert. The same checks and deployment workflow publish the restored version.

References: [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [Vite static deployment](https://vite.dev/guide/static-deploy.html#github-pages), [React Router HashRouter](https://reactrouter.com/api/declarative-routers/HashRouter).
