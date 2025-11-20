import fs from 'node:fs';
import path from 'node:path';
import { convertIgnorePatternToMinimatch } from '@eslint/compat';
import type { Config } from 'eslint/config';

const PATTERNS = {
  gitignore: '.gitignore',
  eslintignore: '.eslintignore',
} as const;

type Patterns = typeof PATTERNS;

export type IgnoreFileSearchLimit = Patterns['gitignore'] | number | false;

type LookInDirectoryOptions = {
  dir: string;
  limit: IgnoreFileSearchLimit;
  targetFileName: string;
  currentFoundPaths?: string[];
  currentGitignorePath?: string;
};

type LookInDirectoryResult = {
  foundPaths: string[];
  gitignorePath?: string;
};

const lookInDirectory = (options: LookInDirectoryOptions): LookInDirectoryResult => {
  const { dir, limit, targetFileName, currentFoundPaths = [] } = options;
  let gitignorePath = options.currentGitignorePath;
  const foundPaths: string[] = currentFoundPaths.slice();

  const targetFilePath = path.join(dir, targetFileName);
  if (fs.existsSync(targetFilePath)) {
    foundPaths.push(targetFilePath);
  }

  if (!gitignorePath) {
    const gitignoreFilePath = path.join(dir, PATTERNS.gitignore);
    if (fs.existsSync(gitignoreFilePath)) {
      gitignorePath = gitignoreFilePath;
      if (limit === PATTERNS.gitignore) {
        return { foundPaths, gitignorePath };
      }
    }
  }

  if (!limit) {
    return { foundPaths, gitignorePath };
  }

  const parentDir = path.dirname(dir);
  if (parentDir === dir) {
    return { foundPaths, gitignorePath };
  }

  let newLimit: LookInDirectoryOptions['limit'];
  if (limit === PATTERNS.gitignore) {
    newLimit = PATTERNS.gitignore;
  } else if (typeof limit === 'number') {
    newLimit = limit - 1;
  } else {
    newLimit = false;
  }

  return lookInDirectory({
    dir: parentDir,
    limit: newLimit,
    targetFileName,
    currentFoundPaths: foundPaths,
    currentGitignorePath: gitignorePath,
  });
};

const getLinesFromFile = (filePath: string): string[] =>
  fs
    .readFileSync(filePath, 'utf-8')
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

export type LoadIgnoreFileOptions = {
  rootDir: string;
  limit: IgnoreFileSearchLimit;
  includeGitignore: boolean;
};

export const loadIgnoreFile = (options: LoadIgnoreFileOptions): Config[] => {
  const { rootDir, limit, includeGitignore } = options;

  const { foundPaths, gitignorePath } = lookInDirectory({
    dir: rootDir,
    limit,
    targetFileName: PATTERNS.eslintignore,
  });

  const allLines: string[] = [];

  const ignoreFilePaths = foundPaths.slice().reverse();
  for (const ignoreFilePath of ignoreFilePaths) {
    allLines.push(...getLinesFromFile(ignoreFilePath));
  }

  if (includeGitignore && gitignorePath) {
    allLines.unshift(...getLinesFromFile(gitignorePath));
  }

  if (allLines.length === 0) {
    return [];
  }

  const ignorePatterns = allLines.map((line) => convertIgnorePatternToMinimatch(line));

  return [
    {
      name: '@homer0/eslint-plugin: ignore file config',
      ignores: ignorePatterns,
    },
  ];
};
