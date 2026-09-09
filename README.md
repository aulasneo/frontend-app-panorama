# Panorama for Open edX

Panorama is a standalone Open edX micro-frontend for QuickSight dashboards and
author console access. Tutor installs it at `/panorama/`; `/panorama/panels` is
the dashboard deep link. The LMS `panorama-openedx-backend` supplies dashboard
URLs and Panorama roles using the platform's authenticated HTTP client.

## Development and verification

Use Node 24 (see `.nvmrc`) and the committed npm lockfile:

```sh
npm ci
npm run lint
npm test -- --runInBand
npm run build
```

Run `npm start` with an LMS development environment and the public configuration
in `.env.development`. Tutor's Panorama development port is 2100. Never put AWS
credentials or QuickSight private keys in MFE configuration.

## Verawood compatibility

The compatibility reference is Tutor/tutor-mfe 22.0.0 and the learning MFE's
[`release/verawood.1` manifest](https://github.com/openedx/frontend-app-learning/blob/release/verawood.1/package.json).
Shared minimums are frontend-platform 8.7.0, header 8.2.1,
frontend-build 14.6.6, and browserslist-config 1.5.1. React stays on 18,
Router on 6 (the existing 6.30.4 security floor is newer than the reference's
6.15.0), and Paragon on 23. The lockfile contains the tested resolutions;
newer security fixes are separate from these compatibility minimums.

Panorama continues to own its router, header, footer, and React root. Native
frontend-base desktop/mobile navigation contributions are maintained in
`tutor-contrib-panorama`; converting this application into a frontend-base
package is deferred. A local build here does **not** validate Tutor-generated
`env.config.jsx` or the assembled frontend-base site. Those must also be built
with the installation's other enabled plugins.

## Access and embedding

`get-user-role` and `get-embed-url` must both succeed before mounting a dashboard.
READER and STUDENT can view their granted dashboards; AUTHOR also sees Studio.
The backend must enforce every permission regardless of button visibility.
401 responses explain that sign-in is required again; 403 responses explain
access denial. Role or dashboard failures stop the loader and display an error.
An authentication change reloads grants and clears the previous role/content.

QuickSight initialization owns a disposable container for each active mount.
Switching dashboards, changing URLs/roles, or unmounting detaches that container,
so an older asynchronous SDK operation cannot inject a frame into a newer view.
Switching back creates a fresh embed. Student URL fragment parameters are passed
through for compatibility; they are **not** an authorization boundary. Staging
must verify dataset-side isolation with tampered `userId` and `lms` parameters.

Regression tests cover role failures, expired sessions, access denial, invalid
roles, user changes, deep links, student parameters, author-only console access,
and late SDK/request completion across switches and remounts.

Before release, test real LMS session/JWT authentication, browser refresh at
both routes, role changes/logout, dashboard and author-console embedding,
locales/themes, and desktop/mobile navigation in standalone MFEs and the
frontend-base site. See [upgrade validation](docs/verawood-validation.md) for
dependency and build findings. Project release numbering is managed manually.
