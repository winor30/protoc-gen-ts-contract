// Ensure the CLI entry point has a Node shebang and executable permission.
import { chmod, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const cliPath = join(here, '..', 'dist', 'cli.js');
const shebang = '#!/usr/bin/env node\n';

const content = await readFile(cliPath, 'utf8');
if (!content.startsWith(shebang)) {
  await writeFile(cliPath, `${shebang}${content}`, 'utf8');
}
await chmod(cliPath, 0o755);
