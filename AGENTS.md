# Panorama frontend working guidance

This repository is the standalone Panorama Open edX MFE. Preserve its standalone
routes and native frontend-base navigation integration. Backend authorization
and AWS IAM enforcement belong to the backend/deployment, not this frontend.

## Code review rules

Review the final diff and affected callers, consumers, styles and tests before
handoff. Passing lint, tests and build does not establish behavioral correctness.
Apply the checks below when the change touches the corresponding behavior;
avoid unrelated rewrites or broad test runs without a concrete reason.

- **Asynchronous state:** For requests and SDK initialization, trace success,
  failure, navigation, unmount, session changes and late completion. Identify who
  owns the loading state. Cancellation must release that operation's loader
  without allowing an old completion to clear a newer operation's loader or
  overwrite current data. Exercise relevant races with deferred promises.
- **Session-dependent content:** Effects fetching authenticated data must react
  to changes in the authenticated identity and LMS base URL. Clear stale mode,
  grants or content while replacements load, and ignore obsolete responses.
  Check revisits and logout/login while the component remains mounted.
- **Layout containment:** When changing positioning, overflow or stacking,
  inspect affected ancestors and descendants. A positioned ancestor changes
  absolute offsets. Keep the tab menu aligned with its sidebar and the loading
  overlay contained by the dashboard; verify geometry in a browser when these
  relationships change. JSDOM cannot validate layout.
- **Stable identity:** Use stable dashboard `name` values for React keys, not
  display labels. Check repeated labels, reordering and empty responses when
  changing list handling. Avoid redundant derived state that retains old entries.
- **API contracts:** Assert full request URLs, including `LMS_BASE_URL` and
  `/panorama/api/`, and relevant payloads. Default mocks should reject unknown
  URLs rather than treating any unmatched endpoint as a successful response.
  Ask whether the test would fail if the request or cleanup were wrong.
- **Test isolation:** Keep shared React act-environment configuration in
  `src/setupTest.js`. Restore temporary globals, spies and mounts in test cleanup
  rather than leaving mutations for sibling tests.
- **Documentation evidence:** Record actual command results from the final code,
  including parameterized test counts. Distinguish mocked behavior from live
  LMS, QuickSight, IAM and theme verification. External notices need project
  impact, ownership, action items, source attribution and a discoverable link;
  preserve usable URLs and distinguish deadlines from verified rollout status.

Validate reviewer claims against current code and reproducible evidence before
fixing them. For confirmed behavioral bugs, add focused regression coverage when
practical. Preserve the general lesson here without accumulating a chronology
of individual reviews or copying detailed validation reports.

## Verification and handoff

- Use the Node version in `.nvmrc`. For dependency or lockfile changes, verify
  a clean `npm ci`; do not relax strict installation to hide an inconsistent lock.
- Run `npm run lint` and `npm test -- --runInBand` for JavaScript/React changes.
  Run `npm run build` for styles, dependencies or bundle integration changes.
  Documentation-only edits need a diff/link check, not an application rebuild.
- Inspect the final diff after fixes. Report checks run, warnings and remaining
  deployment checks. Do not reuse validation claims after relevant code changes.
  The standalone build does not validate Tutor's combined plugin/site bundles.
- Follow Conventional Commits: `type: concise subject`, a header of at most
  110 characters, and explanatory detail in the body. Keep release numbering
  and tagging separate from routine fixes.

See [validation notes](docs/verawood-validation.md) for recorded results and
staging gates, and [QuickSight authorization guidance](docs/change-to-authorization-for-Amazon-Quick-embedding-API.md)
for backend/deployment follow-up.
