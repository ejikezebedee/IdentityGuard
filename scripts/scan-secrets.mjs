import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ignoredDirs = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  'data',
  'identityguard-data',
]);
const ignoredFiles = new Set(['package-lock.json']);
const textExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.mjs',
  '.md',
  '.ts',
  '.tsx',
  '.yml',
  '.yaml',
]);

const secretPatterns = [
  { name: 'private key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/i },
  { name: 'github token', pattern: /gh[pousr]_[A-Za-z0-9_]{30,}/ },
  { name: 'openai key', pattern: /sk-[A-Za-z0-9_-]{32,}/ },
  { name: 'google api key', pattern: /AIza[0-9A-Za-z_-]{35}/ },
  { name: 'aws access key', pattern: /AKIA[0-9A-Z]{16}/ },
  {
    name: 'generic secret assignment',
    pattern: /\b(?:password|passwd|secret|token|api[_-]?key)\s*=\s*['"][^'"]{12,}['"]/i,
  },
];

const findings = [];

const walk = (directory) => {
  for (const entry of readdirSync(directory)) {
    const absolutePath = path.join(directory, entry);
    const relativePath = path.relative(root, absolutePath);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      if (!ignoredDirs.has(entry)) walk(absolutePath);
      continue;
    }

    if (ignoredFiles.has(entry) || !textExtensions.has(path.extname(entry))) continue;

    const content = readFileSync(absolutePath, 'utf8');
    for (const { name, pattern } of secretPatterns) {
      if (pattern.test(content)) findings.push(`${relativePath}: possible ${name}`);
    }
  }
};

walk(root);

if (findings.length > 0) {
  console.error('Secret scan failed:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log('Secret scan passed: no high-confidence secret patterns found.');
