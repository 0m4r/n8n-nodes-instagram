const { spawn } = require('node:child_process');
const { resolve } = require('node:path');

const missingN8nWorkflowSourceMap =
  /^Sourcemap for ".*[\\/]node_modules[\\/]n8n-workflow[\\/].*" points to missing source files\r?$/;

const filterOutput = (destination) => {
  let buffer = '';

  return {
    flush() {
      if (buffer && !missingN8nWorkflowSourceMap.test(buffer)) destination.write(buffer);
    },
    write(chunk) {
      buffer += chunk.toString();
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!missingN8nWorkflowSourceMap.test(line)) destination.write(`${line}\n`);
      }
    },
  };
};

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const vitest = spawn(command, ['vitest', 'run', '--exclude', 'dist/**', ...process.argv.slice(2)], {
  cwd: resolve(__dirname, '..'),
  env: process.env,
  stdio: ['inherit', 'pipe', 'pipe'],
});

const stdout = filterOutput(process.stdout);
const stderr = filterOutput(process.stderr);

vitest.stdout.on('data', (chunk) => stdout.write(chunk));
vitest.stderr.on('data', (chunk) => stderr.write(chunk));

vitest.on('error', (error) => {
  console.error(error);
  process.exitCode = 1;
});

vitest.on('close', (code, signal) => {
  stdout.flush();
  stderr.flush();
  process.exitCode = code ?? (signal ? 1 : 0);
});
