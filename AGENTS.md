# Repository guide for coding agents

This repository is a single-package TypeScript n8n community node for Instagram and Facebook Graph APIs. It contains the Instagram node, an Instagram webhook trigger, and their credential definitions.

## Repository layout

- `nodes/Instagram/`: node description, operation/resource implementations, helpers, and tests.
- `nodes/InstagramTrigger/`: webhook trigger implementation and tests.
- `credentials/`: API and webhook credential definitions and tests.
- `examples/`: example workflows and walkthroughs; keep paired `.json` and `.md` examples consistent.
- `scripts/`: wrappers used by the test, lint, and typecheck commands.
- `dist/`: generated build output. Do not edit it by hand.

## Development setup

- Use the Node.js version specified in `.nvmrc` and npm (the repository uses `package-lock.json`).
- Install dependencies with `npm install`.
- `npm run dev` builds and links the node into a local n8n instance for interactive development.

## n8n documentation

- [Create nodes overview](https://docs.n8n.io/connect/create-nodes/overview/): node development tutorials, testing, deployment, and reference material.
- [Using the `n8n-node` tool](https://docs.n8n.io/connect/create-nodes/build-your-node/using-the-n8n-node-tool/): official CLI commands for building, developing, and linting community nodes.
- [Community node verification guidelines and best practices](https://docs.n8n.io/connect/create-nodes/build-your-node/reference/verification-guidelines/): n8n's quality, coding, and documentation guidance.

## Build and checks

The main project commands are:

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

CI runs these in that order. `npm test` runs Vitest once and excludes generated `dist/` files. Run the relevant checks for the files you change; run the full set when preparing a release or when a change affects multiple areas.

## Code conventions

- Use TypeScript and follow nearby implementation patterns. TypeScript is configured in strict mode; avoid `any`, unused locals, and implicit return paths.
- Keep changes focused and preserve existing node behavior and workflow compatibility.
- Keep node metadata, parameter definitions, runtime behavior, credential definitions, and tests in sync when changing an operation or field.
- Use n8n's established execution and error-handling patterns from adjacent operations. Avoid leaking access tokens, app secrets, or other credential values in errors or logs.
- Keep API host, Graph API version, token type, and permission behavior consistent with the selected credential/login flow. Do not silently change credential defaults or existing workflow parameter semantics.
- Add or update focused tests alongside implementation changes. Tests use Vitest and commonly mock n8n execution context and HTTP responses; follow nearby tests.
- Update README/examples when user-visible operations, fields, credentials, or setup behavior changes.
- Follow Conventional Commits (for example, `feat: add operation` or `fix: handle polling timeout`); Commitlint is configured in this repository.

## Change boundaries

- Edit source, tests, examples, and documentation as appropriate to the task. Do not limit changes to `nodes/` and `credentials/` when the change also requires tests or docs.
- Do not commit generated `dist/` output as a hand-edited source change. Use `npm run build` when generated output is needed.
- Avoid unrelated refactors and breaking changes to credentials or saved workflows.
