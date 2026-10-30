import { fileURLToPath } from 'node:url';

/** The absolute path of a real (trimmed) Pi session, as a JSONL file. */
export const SAMPLE_SESSION_FIXTURE = fileURLToPath(
  new URL('./sample-session.jsonl', import.meta.url),
);
