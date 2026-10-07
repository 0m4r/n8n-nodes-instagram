const { readFileSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');

const version = process.argv[2];
const readmePath = process.argv[3]
  ? resolve(process.cwd(), process.argv[3])
  : resolve(__dirname, '..', 'README.md');

if (!version || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  throw new Error(
    'Usage: node scripts/update-readme-version-history.js <semantic-version> [readme-path]',
  );
}

const readme = readFileSync(readmePath, 'utf8');
const row = `| ${version} | See [CHANGELOG.md](CHANGELOG.md) for complete release notes. |`;
const versionHistoryTable =
  /(## Version history\s*\n\s*\n\|\s*Version\s*\|\s*Notes[^\n]*\n\|(?:\s*:?-+:?\s*\|)+\n)/;

if (readme.includes(row)) {
  process.exit(0);
}

if (!versionHistoryTable.test(readme)) {
  throw new Error(`Could not find the Version history table in ${readmePath}`);
}

writeFileSync(readmePath, readme.replace(versionHistoryTable, `$1${row}\n`));
