import type {
  AssistantMessage,
  ImageContent,
  TextContent,
  ToolResultMessage,
  UserMessage,
} from '@earendil-works/pi-ai';
import {
  SessionManager,
  parseSessionEntries,
  type ExtensionContext,
  type FileEntry,
  type SessionEntry,
  type SessionInfo,
  type SessionMessageEntry,
} from '@earendil-works/pi-coding-agent';
import { readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stringify } from 'yaml';

/** Maximum number of sessions the picker lists. */
const MAX_SESSIONS = 20;

/** A session guaranteed to have a user-defined display name. */
export type NamedSessionInfo = SessionInfo & { name: string };

/** A named session paired with its formatted picker display string. */
export type SessionPickerEntry = {
  display: string;
  session: NamedSessionInfo;
};

/** Formats a session as `<name> — <modified date/time> — <messageCount> msgs`. */
const formatSessionEntry = (session: SessionInfo): string =>
  `${session.name} — ${session.modified.toLocaleString()} — ${session.messageCount} msgs`;

/**
 * Lists named sessions for the current cwd, newest-first, capped to `MAX_SESSIONS`,
 * excluding the currently active session.
 *
 * @param ctx The extension context.
 * @returns The picker entries.
 */
export const listAssessableSessions = async (
  ctx: ExtensionContext,
): Promise<SessionPickerEntry[]> => {
  const currentSessionFile = ctx.sessionManager.getSessionFile();
  const sessions = await SessionManager.list(ctx.cwd);

  return sessions.reduce<SessionPickerEntry[]>((acc, session) => {
    if (acc.length >= MAX_SESSIONS) return acc;
    if (!session.name || session.path === currentSessionFile) return acc;

    // Verified truthy above; TS doesn't narrow the optional property through the push.
    acc.push({
      display: formatSessionEntry(session),
      session: session as NamedSessionInfo,
    });
    return acc;
  }, []);
};

/** Maximum characters of a tool result that go into the transcript. */
const TOOL_RESULT_SNIPPET_LIMIT = 100;

/** Narrows a parsed JSONL line to a tree entry (excludes the header line). */
const isSessionEntry = (entry: FileEntry): entry is SessionEntry =>
  entry.type !== 'session';

/** Narrows a session entry to a message entry (excludes model/thinking/compaction/etc.). */
const isMessageEntry = (entry: SessionEntry): entry is SessionMessageEntry =>
  entry.type === 'message';

/** Text or image content blocks, or a plain string — matches `UserMessage.content`. */
type RenderableContent = string | (TextContent | ImageContent)[];

/** Renders a text/image content block list as plain text, noting images inline. */
const renderContentText = (content: RenderableContent): string => {
  if (typeof content === 'string') return content;
  return content
    .map((block) => (block.type === 'text' ? block.text : '[image]'))
    .join(' ');
};

/** Formats a user message as its full text. */
const formatUserMessage = (message: UserMessage): string[] => [
  `User: ${renderContentText(message.content)}`,
];

/** Formats an assistant message's text, thinking, and tool-call blocks, one line each. */
const formatAssistantMessage = (message: AssistantMessage): string[] =>
  message.content.map((block) => {
    switch (block.type) {
      case 'text':
        return `Assistant: ${block.text}`;
      case 'thinking':
        return `Assistant (thinking): ${block.thinking}`;
      case 'toolCall':
        return `Tool call: ${block.name}(${JSON.stringify(block.arguments)})`;
      default:
        return '';
    }
  });

/** Truncates a tool-result snippet to `TOOL_RESULT_SNIPPET_LIMIT` characters. */
const truncateSnippet = (text: string): string =>
  text.length > TOOL_RESULT_SNIPPET_LIMIT
    ? `${text.slice(0, TOOL_RESULT_SNIPPET_LIMIT)}…`
    : text;

/** Formats a tool-result message as its status plus a truncated snippet. */
const formatToolResultMessage = (message: ToolResultMessage): string[] => {
  const status = message.isError ? 'error' : 'ok';
  return [
    `Tool result (${status}): ${truncateSnippet(renderContentText(message.content))}`,
  ];
};

/** Formats one session message entry's content into transcript lines. */
const formatMessage = (message: SessionMessageEntry['message']): string[] => {
  switch (message.role) {
    case 'user':
      return formatUserMessage(message);
    case 'assistant':
      return formatAssistantMessage(message);
    case 'toolResult':
      return formatToolResultMessage(message);
    default:
      return [];
  }
};

/**
 * Walks `parentId` from the last tree entry in the file (always the current leaf) back to
 * the root, returning entries in chronological order. Builds the id lookup and finds the
 * leaf in the same pass over `fileEntries`, since the backward walk itself only touches
 * entries on the active branch, not the full file.
 */
const walkActiveBranch = (fileEntries: FileEntry[]): SessionEntry[] => {
  const byId = new Map<string, SessionEntry>();
  let leaf: SessionEntry | undefined;

  for (const entry of fileEntries) {
    if (isSessionEntry(entry)) {
      byId.set(entry.id, entry);
      leaf = entry;
    }
  }

  const path: SessionEntry[] = [];
  let current = leaf;
  while (current) {
    path.push(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return path.reverse();
};

/**
 * Builds a plain-text, token-lean transcript of a session's active conversation branch:
 * full user/assistant text and thinking content, full tool-call name and arguments, and
 * tool-result entries reduced to status plus a truncated snippet.
 *
 * @param sessionFilePath The path to the session JSONL file.
 * @returns The transcript, one line per message part.
 */
export const buildTranscript = async (sessionFilePath: string): Promise<string> => {
  const raw = await readFile(sessionFilePath, 'utf8');
  const activeBranch = walkActiveBranch(parseSessionEntries(raw));

  return activeBranch
    .reduce<string[]>((acc, entry) => {
      if (!isMessageEntry(entry)) return acc;
      acc.push(...formatMessage(entry.message));
      return acc;
    }, [])
    .join('\n');
};

/** Transcript plus the session metadata to record in its frontmatter. */
export type TranscriptFileInput = {
  sessionId: string;
  sessionName: string;
  sessionCwd: string;
  transcript: string;
};

/**
 * Writes a transcript to a temp Markdown file at
 * `<tmpdir>/pi-assessment-<session-id>-<timestamp>.md`, with YAML frontmatter identifying
 * its source session, for handoff to the `assessment` skill's file-based invocation
 * mode.
 *
 * @param input The transcript and the metadata of its session.
 * @returns The path of the file.
 */
export const writeTranscriptFile = async (
  input: TranscriptFileInput,
): Promise<string> => {
  const frontmatter = stringify({
    'session-name': input.sessionName,
    'session-cwd': input.sessionCwd,
    'session-id': input.sessionId,
  });
  const path = join(tmpdir(), `pi-assessment-${input.sessionId}-${Date.now()}.md`);

  await writeFile(path, `---\n${frontmatter}---\n\n${input.transcript}\n`, 'utf8');
  return path;
};
