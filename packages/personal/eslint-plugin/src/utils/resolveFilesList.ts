const ALL_INSIDE_PREFIX = 'all-inside:';

// We don't use the const in the type so it's easier to read for the implementation.

export type FilesListEntry = 'all' | 'all-inside:' | ({} & string);
export type FilesList = FilesListEntry | FilesListEntry[];

const ALL_EXTENSIONS = ['js', 'cjs', 'mjs', 'ts', 'cts', 'mts', 'tsx', 'd.ts'];

export type ResolveFilesListOptions = {
  files: FilesList;
  extensions?: string[];
};

export const resolveFilesList = (options: ResolveFilesListOptions): string[] => {
  const { files, extensions = ALL_EXTENSIONS } = options;

  const list = Array.isArray(files) ? files : [files];
  const extensionsPattern = `{${extensions.join(',')}}`;
  return list.map((entry) => {
    if (entry === 'all') {
      return `**/*.${extensionsPattern}`;
    }

    if (entry.startsWith(ALL_INSIDE_PREFIX)) {
      const entryPath = entry.slice(ALL_INSIDE_PREFIX.length).replace(/\/+$/, '') || '.';
      return `${entryPath}/**/*.${extensionsPattern}`;
    }

    return entry;
  });
};
