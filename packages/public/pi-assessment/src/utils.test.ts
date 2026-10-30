import { SessionManager, type ExtensionContext } from '@earendil-works/pi-coding-agent';
import { SAMPLE_SESSION_FIXTURE } from '@tests/fixtures/index.js';
import { mkdtemp, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildTranscript,
  listAssessableSessions,
  writeTranscriptFile,
  type SessionPickerEntry,
} from './utils.js';

vi.mock('@earendil-works/pi-coding-agent', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@earendil-works/pi-coding-agent')>()),
  SessionManager: { list: vi.fn() },
}));

describe('utils', () => {
  describe('buildTranscript', () => {
    const TOOL_RESULT_SNIPPET_LIMIT = 100;

    const SESSION_HEADER = {
      type: 'session',
      version: 3,
      id: 'sess',
      timestamp: '2026-01-01T00:00:00.000Z',
      cwd: '/tmp',
    };

    let tempDir: string | undefined;

    /** Writes session entries as JSONL to a fresh temp file and returns its path. */
    const writeSession = async (entries: unknown[]): Promise<string> => {
      tempDir = tempDir ?? (await mkdtemp(join(tmpdir(), 'pi-assessment-')));
      const path = join(
        tempDir,
        `${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`,
      );
      await writeFile(
        path,
        `${entries.map((entry) => JSON.stringify(entry)).join('\n')}\n`,
        'utf8',
      );
      return path;
    };

    /** A message entry of a session. */
    const messageEntry = (id: string, parentId: string | null, message: unknown) => ({
      type: 'message',
      id,
      parentId,
      timestamp: '2026-01-01T00:00:01.000Z',
      message,
    });

    afterEach(async () => {
      if (tempDir) await rm(tempDir, { recursive: true, force: true });
      tempDir = undefined;
    });

    it('renders a linear session as chronological transcript lines', async () => {
      const path = await writeSession([
        SESSION_HEADER,
        {
          type: 'message',
          id: 'u1',
          parentId: null,
          timestamp: '2026-01-01T00:00:01.000Z',
          message: { role: 'user', content: 'Hi', timestamp: 1 },
        },
        {
          type: 'message',
          id: 'a1',
          parentId: 'u1',
          timestamp: '2026-01-01T00:00:02.000Z',
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'Hello!' }],
            api: 'x',
            provider: 'x',
            model: 'x',
            usage: {},
            stopReason: 'stop',
            timestamp: 2,
          },
        },
      ]);

      const transcript = await buildTranscript(path);

      expect(transcript).toBe('User: Hi\nAssistant: Hello!');
    });

    it('preserves a failed tool call followed by a successful retry', async () => {
      const path = await writeSession([
        SESSION_HEADER,
        {
          type: 'message',
          id: 'u1',
          parentId: null,
          timestamp: '2026-01-01T00:00:01.000Z',
          message: { role: 'user', content: 'Run ls', timestamp: 1 },
        },
        {
          type: 'message',
          id: 'a1',
          parentId: 'u1',
          timestamp: '2026-01-01T00:00:02.000Z',
          message: {
            role: 'assistant',
            content: [
              {
                type: 'toolCall',
                id: 'call1',
                name: 'bash',
                arguments: { command: 'lz' },
              },
            ],
            api: 'x',
            provider: 'x',
            model: 'x',
            usage: {},
            stopReason: 'toolUse',
            timestamp: 2,
          },
        },
        {
          type: 'message',
          id: 't1',
          parentId: 'a1',
          timestamp: '2026-01-01T00:00:03.000Z',
          message: {
            role: 'toolResult',
            toolCallId: 'call1',
            toolName: 'bash',
            content: [{ type: 'text', text: 'command not found: lz' }],
            isError: true,
            timestamp: 3,
          },
        },
        {
          type: 'message',
          id: 'a2',
          parentId: 't1',
          timestamp: '2026-01-01T00:00:04.000Z',
          message: {
            role: 'assistant',
            content: [
              {
                type: 'toolCall',
                id: 'call2',
                name: 'bash',
                arguments: { command: 'ls' },
              },
            ],
            api: 'x',
            provider: 'x',
            model: 'x',
            usage: {},
            stopReason: 'toolUse',
            timestamp: 4,
          },
        },
        {
          type: 'message',
          id: 't2',
          parentId: 'a2',
          timestamp: '2026-01-01T00:00:05.000Z',
          message: {
            role: 'toolResult',
            toolCallId: 'call2',
            toolName: 'bash',
            content: [{ type: 'text', text: 'file.txt' }],
            isError: false,
            timestamp: 5,
          },
        },
      ]);

      const transcript = await buildTranscript(path);

      expect(transcript).toBe(
        [
          'User: Run ls',
          'Tool call: bash({"command":"lz"})',
          'Tool result (error): command not found: lz',
          'Tool call: bash({"command":"ls"})',
          'Tool result (ok): file.txt',
        ].join('\n'),
      );
    });

    it('keeps a tool-result snippet exactly at the 100-character limit untouched', async () => {
      const text = 'x'.repeat(TOOL_RESULT_SNIPPET_LIMIT);
      const path = await writeSession([
        SESSION_HEADER,
        {
          type: 'message',
          id: 'u1',
          parentId: null,
          timestamp: '2026-01-01T00:00:01.000Z',
          message: { role: 'user', content: 'Run it', timestamp: 1 },
        },
        {
          type: 'message',
          id: 't1',
          parentId: 'u1',
          timestamp: '2026-01-01T00:00:02.000Z',
          message: {
            role: 'toolResult',
            toolCallId: 'call1',
            toolName: 'bash',
            content: [{ type: 'text', text }],
            isError: false,
            timestamp: 2,
          },
        },
      ]);

      const transcript = await buildTranscript(path);

      expect(transcript).toBe(`User: Run it\nTool result (ok): ${text}`);
    });

    it('truncates a tool-result snippet past the 100-character limit', async () => {
      const text = 'x'.repeat(TOOL_RESULT_SNIPPET_LIMIT + 1);
      const path = await writeSession([
        SESSION_HEADER,
        {
          type: 'message',
          id: 'u1',
          parentId: null,
          timestamp: '2026-01-01T00:00:01.000Z',
          message: { role: 'user', content: 'Run it', timestamp: 1 },
        },
        {
          type: 'message',
          id: 't1',
          parentId: 'u1',
          timestamp: '2026-01-01T00:00:02.000Z',
          message: {
            role: 'toolResult',
            toolCallId: 'call1',
            toolName: 'bash',
            content: [{ type: 'text', text }],
            isError: false,
            timestamp: 2,
          },
        },
      ]);

      const transcript = await buildTranscript(path);

      expect(transcript).toBe(
        `User: Run it\nTool result (ok): ${'x'.repeat(TOOL_RESULT_SNIPPET_LIMIT)}…`,
      );
    });

    it('builds a transcript from a real sample session, preserving tool-call arguments verbatim and truncating long tool results', async () => {
      const transcript = await buildTranscript(SAMPLE_SESSION_FIXTURE);

      expect(
        transcript.startsWith(
          'User: can you tell me the polling rate of my connected mouse?',
        ),
      ).toBe(true);
      expect(transcript).toContain(
        'Tool call: bash({"command":"system_profiler SPUSBDataType 2>/dev/null | grep -i -B5 -A10 mouse"})',
      );
      expect(transcript).toContain(
        'Tool result (error): (no output)\n\nCommand exited with code 1',
      );

      const okPrefix = 'Tool result (ok): ';
      const okStart = transcript.indexOf(okPrefix) + okPrefix.length;
      const okEnd = transcript.indexOf('\nAssistant:', okStart);
      const snippet = transcript.slice(okStart, okEnd);

      expect(snippet.endsWith('…')).toBe(true);
      expect(snippet.length).toBe(TOOL_RESULT_SNIPPET_LIMIT + 1);
    });

    it('renders thinking blocks, ignores unknown ones, and notes images', async () => {
      const path = await writeSession([
        SESSION_HEADER,
        messageEntry('u1', null, {
          role: 'user',
          content: [
            { type: 'text', text: 'Look' },
            { type: 'image', data: 'x', mimeType: 'image/png' },
          ],
          timestamp: 1,
        }),
        messageEntry('a1', 'u1', {
          role: 'assistant',
          content: [
            { type: 'thinking', thinking: 'hmm' },
            { type: 'unknown' },
            { type: 'text', text: 'ok' },
          ],
          timestamp: 2,
        }),
      ]);

      await expect(buildTranscript(path)).resolves.toBe(
        'User: Look [image]\nAssistant (thinking): hmm\n\nAssistant: ok',
      );
    });

    it('skips the entries that are not messages and the roles it does not know', async () => {
      const path = await writeSession([
        SESSION_HEADER,
        { type: 'model_change', id: 'm1', parentId: null, modelId: 'x' },
        messageEntry('u1', 'm1', { role: 'user', content: 'Hi', timestamp: 1 }),
        messageEntry('b1', 'u1', { role: 'bashExecution', command: 'ls', timestamp: 2 }),
      ]);

      await expect(buildTranscript(path)).resolves.toBe('User: Hi');
    });

    it('follows only the active branch', async () => {
      const path = await writeSession([
        SESSION_HEADER,
        messageEntry('u1', null, { role: 'user', content: 'root', timestamp: 1 }),
        messageEntry('u2', 'u1', { role: 'user', content: 'old branch', timestamp: 2 }),
        messageEntry('u3', 'u1', {
          role: 'user',
          content: 'active branch',
          timestamp: 3,
        }),
      ]);

      await expect(buildTranscript(path)).resolves.toBe(
        'User: root\nUser: active branch',
      );
    });

    it('returns an empty transcript for a session with no entries', async () => {
      const path = await writeSession([SESSION_HEADER]);

      await expect(buildTranscript(path)).resolves.toBe('');
    });
  });

  describe('listAssessableSessions', () => {
    /** A session, as `SessionManager.list` returns it. */
    const session = (path: string, name?: string) => ({
      id: path,
      path,
      name,
      cwd: '/cwd',
      messageCount: 3,
      modified: new Date('2026-01-02T03:04:05Z'),
    });

    const ctx = {
      cwd: '/cwd',
      sessionManager: { getSessionFile: () => '/current.jsonl' },
    } as unknown as ExtensionContext;

    beforeEach(() => {
      vi.mocked(SessionManager.list).mockReset();
    });

    it('lists the named sessions of the cwd, without the current one', async () => {
      vi.mocked(SessionManager.list).mockResolvedValue([
        session('/a.jsonl', 'First'),
        session('/b.jsonl'),
        session('/current.jsonl', 'Current'),
        session('/c.jsonl', 'Third'),
      ] as never);

      const entries: SessionPickerEntry[] = await listAssessableSessions(ctx);

      expect(SessionManager.list).toHaveBeenCalledWith('/cwd');
      expect(entries.map((entry) => entry.session.name)).toEqual(['First', 'Third']);
      expect(entries[0]!.display).toBe(
        `First — ${new Date('2026-01-02T03:04:05Z').toLocaleString()} — 3 msgs`,
      );
    });

    it('caps the list to 20 sessions', async () => {
      vi.mocked(SessionManager.list).mockResolvedValue(
        Array.from({ length: 25 }, (_, index) =>
          session(`/${index}.jsonl`, `S${index}`),
        ) as never,
      );

      const entries = await listAssessableSessions(ctx);

      expect(entries).toHaveLength(20);
      expect(entries.at(-1)!.session.name).toBe('S19');
    });
  });

  describe('writeTranscriptFile', () => {
    it('writes a temp file with YAML frontmatter followed by the transcript body', async () => {
      const path = await writeTranscriptFile({
        sessionId: 'abc123',
        sessionName: 'Refactor auth module',
        sessionCwd: '/Users/homer0/project',
        transcript: 'User: hi\nAssistant: hello',
      });

      try {
        expect(path.startsWith(join(tmpdir(), 'pi-assessment-abc123-'))).toBe(true);
        expect(path).toMatch(/-\d+\.md$/);

        await expect(readFile(path, 'utf8')).resolves.toBe(
          [
            '---',
            'session-name: Refactor auth module',
            'session-cwd: /Users/homer0/project',
            'session-id: abc123',
            '---',
            '',
            'User: hi',
            'Assistant: hello',
            '',
          ].join('\n'),
        );
      } finally {
        await unlink(path);
      }
    });

    it('escapes frontmatter values containing YAML special characters', async () => {
      const path = await writeTranscriptFile({
        sessionId: 'def456',
        sessionName: 'Session: with "quotes" and a colon',
        sessionCwd: '/tmp',
        transcript: 'User: hi',
      });

      try {
        await expect(readFile(path, 'utf8')).resolves.toContain(
          'session-name: \'Session: with "quotes" and a colon\'',
        );
      } finally {
        await unlink(path);
      }
    });
  });
});
