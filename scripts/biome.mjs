import { existsSync } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { Biome } from '@biomejs/js-api/nodejs';

const biome = new Biome();
const { projectKey } = biome.openProject(process.cwd());

const mode = process.argv[2] ?? 'check';
const shouldWrite = process.argv.includes('--write');

const ROOT_FILES = ['biome.json', 'index.js', 'package.json', 'tsconfig.json', 'vitest.config.ts'];
const SOURCE_DIRS = ['src', 'test'];

const collectFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(entryPath)));
      continue;
    }

    if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
};

const projectFiles = async () => {
  const files = ROOT_FILES.filter((file) => existsSync(path.join(process.cwd(), file)));

  for (const sourceDir of SOURCE_DIRS) {
    const absoluteDir = path.join(process.cwd(), sourceDir);

    if (!existsSync(absoluteDir)) {
      continue;
    }

    const nestedFiles = await collectFiles(absoluteDir);
    files.push(...nestedFiles.map((file) => path.relative(process.cwd(), file)));
  }

  return files.sort();
};

const printDiagnostics = (diagnostics, filePath, fileSource) => {
  if (!diagnostics.length) {
    return;
  }

  const output = biome.printDiagnostics(diagnostics, {
    filePath,
    fileSource,
  });

  if (output) {
    process.stderr.write(`${output}\n`);
  }
};

const actionableDiagnostics = (diagnostics) => {
  return diagnostics.filter((diagnostic) => diagnostic.category !== 'assist/source/organizeImports');
};

const checkFile = async (filePath) => {
  const fileSource = await readFile(filePath, 'utf8');
  const formatted = biome.formatContent(projectKey, fileSource, { filePath });
  const lintResult = biome.lintContent(projectKey, fileSource, { filePath });
  const diagnostics = actionableDiagnostics(lintResult.diagnostics);
  let failed = false;

  if (formatted.content !== fileSource) {
    failed = true;
    process.stderr.write(`format: ${filePath}\n`);
  }

  if (diagnostics.length) {
    failed = true;
    printDiagnostics(diagnostics, filePath, fileSource);
  }

  return failed;
};

const formatFile = async (filePath) => {
  const fileSource = await readFile(filePath, 'utf8');
  const formatted = biome.formatContent(projectKey, fileSource, { filePath });

  if (formatted.content !== fileSource && shouldWrite) {
    await writeFile(filePath, formatted.content);
    process.stdout.write(`formatted: ${filePath}\n`);
  }
};

const files = await projectFiles();
let hasFailures = false;

for (const filePath of files) {
  if (mode === 'format') {
    await formatFile(filePath);
    continue;
  }

  hasFailures ||= await checkFile(filePath);
}

if (mode === 'check' && hasFailures) {
  process.exitCode = 1;
}
