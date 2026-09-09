# Verawood validation notes

Compatibility targets were checked against the exact
[learning MFE release/verawood.1 manifest](https://github.com/openedx/frontend-app-learning/blob/release/verawood.1/package.json),
not its moving main branch. Tutor 22.0.0 selects that release. Shared package
minimums intentionally do not claim to be the latest security fixes.

## Dependency review

The lockfile was refreshed within the existing supported major families using
Node 24. No Panorama project version or release tag was changed. Audit findings
are package entries, including upstream metavulnerabilities, not a count of
confirmed exploitable production bugs. Do not apply `npm audit fix --force`:
its suggested downgrades to old Open edX components conflict with Verawood.

The explicit axios and serialize-javascript overrides remain. shell-quote moves
from 1.8.4 to 1.10.0 because the former now has a parsing complexity advisory.
qs 6.16.0 overrides Express's narrow older range to pick up denial-of-service
fixes. eslint-plugin-formatjs stays at 4.13.0: its later deprecated 4.14.0 release
unexpectedly requires ESLint 9, conflicting with frontend-build's ESLint 8.
These are security/compatibility choices beyond the Verawood release minimums.
The minimatch 9 override applies only within that major, replacing the vulnerable
9.0.3 pinned by the formatjs lint dependency with 9.0.9.

Removed the unused direct i18next, react-i18next, and i18next-http-backend
dependencies. A source search found no imports/configuration; `npm explain`
showed only these root dependencies and react-i18next's peer on i18next.
Panorama already uses frontend-platform's message pipeline in `src/i18n`.
This removes the advisory-bearing HTTP backend without adding an unnecessary
major migration. MUI's Emotion peers and the Open edX component peers remain.

Final lock resolutions include frontend-platform 8.7.1, header 8.2.2, footer
14.9.5, frontend-build 14.6.17, Paragon 23.23.0, Router/DOM 6.30.6, React/DOM
18.3.1, QuickSight SDK 2.11.3, and axios 1.20.0. These are tested refreshes in
the compatibility families, not the release's original exact pins.

The 2026-09-08 audit reports **23 affected entries: 0 critical, 5 high,
16 moderate, 2 low**, down from 38 in the reviewed lock. Residual root causes:

| Dependency path | Exposure and remaining work |
| --- | --- |
| Paragon → token/style tooling → expr-eval-fork, style-dictionary, postcss-map → PostCSS 7 | Build-time theme inputs; all remaining high entries originate here. Theme files are trusted repository/package inputs. Upstream fixes or a tested theme-tool migration are still required; replacing PostCSS 7 with 8 globally is not a compatible patch. |
| frontend-platform → universal-cookie → cookie | Browser cookie serialization advisory. Keep cookie names/options trusted; an upstream supported universal-cookie update remains necessary. |
| Paragon → mailto-link → query-string → decode-uri-component | Malformed percent-encoded input can cause excessive decoding. Panorama has no direct query-string decoding call, but shared component use remains an upstream review item. |
| Router 6 | Open-redirect and SSR hydration advisories. Panorama has no SSR/hydration and its own tab links are fixed hash links; audit shared header/configured URLs in staging. The audit proposes an incompatible Router major; retained supported Router 6. |
| QuickSight SDK / Paragon / SockJS → uuid 8/9 | Advisory affects v3/v5/v6 with supplied output buffers. Panorama does not call these functions directly; the SDK's distributed bundle also includes UUID code, so a dependency override alone is not evidence of a fixed SDK. Await upstream refresh and verify SDK usage. |
| frontend-build → webpack-dev-server 4 | Development-only server origin/WebSocket issues, absent from the static production deployment. Bind local development to trusted interfaces; upgrading to the fixed major requires frontend-build support. |

`npm audit --omit=dev` is not a reliable browser exposure classifier here:
frontend-platform's optional frontend-build peer and Paragon's theme dependencies
cause tooling to be included in the production dependency graph. The table
classifies actual use, without claiming the remaining advisories are fixed.

QuickSight remains on SDK 2.x. Tests exercise the public `createEmbeddingContext`,
`embedDashboard`, `embedConsole`, event callbacks, and student parameter shape.
They do not establish real AWS iframe behavior, session renewal, or data isolation.

## Theme and bundle ownership

The standalone entry point imports component/application SCSS, while
frontend-platform's AppProvider manages Paragon/brand CSS theme loading.
Removed obsolete brand Sass fonts/variables/overrides and Paragon core imports:
brand-openedx 1.3.0 publishes CSS themes and the old imports broke clean builds.
This matches the Verawood learning MFE pattern. Verify browser stylesheet requests,
computed styles and theme switching with the deployed brand. Full shell theme
ownership moves with the separately planned frontend-base application migration.

Final local validation: Node 24.17.0 clean install, lint, 22 tests and production
build passed. Generated cross-plugin bundle results are recorded in the Tutor
plugin's `docs/verawood-validation.md`.

## Staging gates

- Run Tutor's generated bundle checks with all locally enabled plugin patches,
  including affected standalone MFEs and the assembled frontend-base site.
- Exercise session/JWT login, logout and role changes, 401/403 responses, dashboard
  switching during slow initialization, and console embedding as an AUTHOR.
- Verify `/panorama/` and `/panorama/panels` refresh/deep links, theme selection,
  desktop/mobile navigation, and actual QuickSight content error callbacks.
- Confirm dataset-side student isolation after tampering with fragment parameters.

These browser/service checks require a running Verawood LMS and QuickSight;
mocked unit tests and a standalone production build cannot replace them.
