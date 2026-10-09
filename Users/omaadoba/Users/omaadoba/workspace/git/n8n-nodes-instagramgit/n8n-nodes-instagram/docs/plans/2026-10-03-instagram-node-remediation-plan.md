# Instagram Node Remediation Plan

## Status

- **Plan status:** Open
- **Owner:** Unassigned
- **Last updated:** 2026-10-07
- **Tracking method:** Complete the checklist items in this document and update the status field in the relevant task heading.

## Analysis Baseline

This plan is based on the code review of the repository at the following immutable Git revision:

- **HEAD SHA:** `24c7e91fa6f587c89405d05d36097205be70be83`
- **Short SHA:** `24c7e91`
- **Branch at capture:** `main` (`main...origin/main`)
- **Baseline commit:** `chore: release v4.0.5`
- **Commit timestamp:** `2026-10-02T12:43:43+02:00`
- **Analysis target:** `nodes/Instagram/Instagram.node.ts`

> The working tree contained untracked `.slingshot/` files when the baseline was captured. Re-run or amend this plan if implementation starts from a different commit.

## Delivery Rules

- Keep each change focused and add regression coverage before or alongside the implementation.
- Preserve n8n's `continueOnFail()` behavior and `pairedItem` mappings.
- Do not log or return access tokens, app secrets, signed media URLs, or full unredacted API responses.
- Run `npm run typecheck` and `npm run lint` before marking any implementation task complete.

---

## Phase 1 — Correctness and Resource Protection

### IN-01: Enforce the pagination safety cap

**Priority:** P0 — High  
**Status:** Not started  
**Affected code:** `nodes/Instagram/Instagram.node.ts` (hashtag and IG User media pagination)

- [ ] Extract or introduce shared pagination logic that accepts a page size and a maximum result count.
- [ ] Stop paging when the accumulated result count reaches the configured cap, including when `returnAll` is `true`.
- [ ] Slice the final result set to the cap in all pagination modes.
- [ ] Prevent a repeated `after` cursor from causing an infinite loop.
- [ ] Preserve the current endpoint page sizes unless a documented API constraint requires a different value.

**Acceptance criteria**

- A `returnAll: true` request returns no more than 5,000 records unless a future explicit configuration changes that cap.
- Repeated cursors terminate with a clear `NodeOperationError` or equivalent guarded result.
- Both hashtag media and IG User media use the same tested behavior.

**Required tests**

- [ ] More than 5,000 mocked records stop at the cap.
- [ ] A repeated cursor terminates safely.
- [ ] A limited request returns exactly the requested number of records.

### IN-02: Make container status failures win over ready statuses

**Priority:** P0 — High  
**Status:** Complete (2026-10-07; `a3beb13`)  
**Affected code:** `nodes/Instagram/Instagram.node.ts` (`waitForContainerReady`)

- [x] Define one authoritative status interpretation strategy for `status_code` and `status`.
- [x] Check failure statuses before success statuses.
- [x] Include the container ID, authoritative status, and attempt count in the failure message.

**Acceptance criteria**

- A response containing a ready value and an error value never proceeds to `media_publish`.
- Valid finished containers still publish successfully.

**Required tests**

- [x] `{ status_code: 'FINISHED', status: 'ERROR' }` fails before publishing.
- [x] `{ status_code: 'FINISHED' }` succeeds.
- [x] `{ status_code: 'ERROR', error_message: '...' }` includes a safe diagnostic.

---

## Phase 2 — API Contract and Input Validation

### IN-03: Honor the configured Graph API version for `Get Me`

**Priority:** P1 — Medium  
**Status:** Not started  
**Affected code:** `nodes/Instagram/Instagram.node.ts`, `credentials/InstagramApi.credentials.ts`

- [ ] Read and validate `graphApiVersion` for the `auth/getMe` operation.
- [ ] Replace the hard-coded `v26.0` request path for the node operation with the selected version.
- [ ] Decide and document whether account search and credential tests should use a fixed supported version or the same configurable source.
- [ ] Centralize Graph version validation to prevent malformed URL paths.

**Acceptance criteria**

- `Get Me` requests the version selected in node configuration.
- Credential tests and list search behavior remain documented and intentional.

**Required tests**

- [ ] A selected `v25.0` produces a `/v25.0/me` request.
- [ ] Invalid version values are rejected before an HTTP request.

### IN-04: Validate additional fields against supported media resources

**Priority:** P1 — Medium  
**Status:** Not started  
**Affected code:** `nodes/Instagram/Instagram.node.ts`

- [ ] Define a per-resource allowlist for `alt_text`, `location_id`, `product_tags`, `user_tags`, and `trial_params`.
- [ ] Reject unsupported Story/Reel/Image combinations before the media container request.
- [ ] Enforce the documented maximum of five product tags.
- [ ] Validate tag coordinates are finite numbers in the range 0–1 at runtime.
- [ ] Ensure user-facing field descriptions match the enforced behavior.

**Acceptance criteria**

- Unsupported fields do not reach the Graph API.
- Valid image and Reel payloads continue to serialize correctly.
- More than five product tags fail with an item-specific validation error.

**Required tests**

- [ ] Story with alt text, location, or product tags is rejected.
- [ ] Six product tags are rejected.
- [ ] Valid image user/product tags serialize as JSON strings.

### IN-05: Apply one URL validator to all media inputs

**Priority:** P1 — Medium  
**Status:** Not started  
**Affected code:** `nodes/Instagram/Instagram.node.ts`

- [ ] Extract the existing HTTP(S) URL validation into a reusable helper.
- [ ] Apply it to image, Reel, Story, manual carousel, and field-driven carousel inputs.
- [ ] Resolve carousel media type from the URL pathname so signed URLs such as `video.mp4?signature=...` are recognized as videos.
- [ ] Preserve explicit `mediaType` values as the highest-priority type source.

**Acceptance criteria**

- All media paths reject blank, malformed, and non-HTTP(S) URLs before API calls.
- Signed video URLs are detected as video in auto-detect mode.

**Required tests**

- [ ] A manual carousel with `ftp://` media fails locally.
- [ ] `https://example.test/video.mp4?token=x` is recognized as a video.
- [ ] Explicit `mediaType: 'image'` overrides URL inference.

---

## Phase 3 — Error Handling and Secret Safety

### IN-06: Normalize `continueOnFail` error output

**Priority:** P1 — Medium  
**Status:** Not started  
**Affected code:** `nodes/Instagram/Instagram.node.ts`

- [ ] Create one error-normalization helper used by all resource branches.
- [ ] Always return a non-empty `message` field for local and HTTP errors.
- [ ] Preserve safe Graph error metadata (`code`, `error_subcode`, `statusCode`) where available.
- [ ] Do not spread native `Error` instances directly into output JSON.

**Acceptance criteria**

- Local validation errors produce a readable `message` when Continue On Fail is enabled.
- HTTP errors retain safe Graph metadata without exposing credentials.

**Required tests**

- [ ] A local parameter error emits `{ message: '...' }`.
- [ ] A Graph API error emits safe status/code metadata.

### IN-07: Reduce secret and response-data exposure

**Priority:** P1 — Medium  
**Status:** Not started  
**Affected code:** `nodes/Instagram/Instagram.node.ts`, `credentials/InstagramApi.credentials.ts`

- [ ] Move long-lived app configuration, including the app secret where feasible, into credentials rather than node parameters.
- [ ] Verify that request logging redacts all query-string access tokens and client secrets required by Meta endpoints.
- [ ] Replace full `JSON.stringify(response)` diagnostics with bounded and redacted summaries.
- [ ] Ensure signed media URLs are not emitted in node errors or Continue On Fail output.

**Acceptance criteria**

- No failure path returns token, client secret, or complete signed URL values.
- Diagnostics still identify the operation, item index, status code, and safe Graph message.

**Required tests**

- [ ] Error output redacts known token and secret fixture values.
- [ ] Oversized response payloads are truncated or summarized.

---

## Phase 4 — Testability and Maintainability

### IN-08: Add focused automated coverage before refactoring

**Priority:** P1 — Medium  
**Status:** Not started  
**Affected code:** Add tests using the repository's selected TypeScript test framework.

- [ ] Select and document the project test runner compatible with the n8n node package.
- [ ] Add isolated mocks for `IExecuteFunctions`, credential access, and authenticated HTTP requests.
- [ ] Cover IN-01 through IN-07 before restructuring production logic.
- [ ] Add a regression test for every fixed defect.

**Acceptance criteria**

- Tests run through a documented package script.
- High-priority paths are covered without network access.

### IN-09: Decompose duplicated node execution logic

**Priority:** P2 — Low  
**Status:** Not started  
**Affected code:** `nodes/Instagram/Instagram.node.ts`, new focused helper modules as needed

- [ ] Extract parameter resolution helpers for account IDs, Graph versions, and common request options.
- [ ] Extract pagination, polling, URL validation, and error normalization into single-purpose modules.
- [ ] Keep resource-specific handlers limited to their payload and operation concerns.
- [ ] Avoid behavior changes not covered by regression tests.

**Acceptance criteria**

- No repeated Graph error-to-output conversion remains across resource branches.
- Shared helpers are independently unit-tested.
- Existing type-check and lint commands remain clean.

---

## Validation Checklist for Each Pull Request

- [ ] Relevant regression tests pass.
- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.
- [ ] HTTP mocks confirm no unsupported payload field or secret reaches output.
- [ ] Review confirms all completed checkboxes have matching implementation and tests.
- [ ] Update this plan's task status and checklist entries in the same pull request.
