import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from '@earendil-works/pi-coding-agent';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleSessionAssessment } from './handlers.js';
import { buildTranscript, listAssessableSessions, writeTranscriptFile } from './utils.js';

vi.mock('./utils.js', () => ({
  listAssessableSessions: vi.fn(),
  buildTranscript: vi.fn(),
  writeTranscriptFile: vi.fn(),
}));

describe('handlers', () => {
  const ENTRY = {
    display: 'My session',
    session: { id: 's1', name: 'My session', cwd: '/cwd', path: '/s1.jsonl' },
  };

  const setup = (selection: string | undefined) => {
    const notify = vi.fn();
    const select = vi.fn().mockResolvedValue(selection);
    const ctx = { ui: { notify, select } } as unknown as ExtensionCommandContext;
    const sendUserMessage = vi.fn();
    const pi = { sendUserMessage } as unknown as ExtensionAPI;
    return { ctx, pi, notify, select, sendUserMessage };
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(listAssessableSessions).mockResolvedValue([ENTRY] as never);
    vi.mocked(buildTranscript).mockResolvedValue('transcript');
    vi.mocked(writeTranscriptFile).mockResolvedValue('/tmp/transcript.md');
  });

  describe('handleSessionAssessment', () => {
    it('warns when there are no named sessions', async () => {
      vi.mocked(listAssessableSessions).mockResolvedValue([]);
      const { ctx, pi, notify, select } = setup('My session');

      await handleSessionAssessment({ ctx, pi });

      expect(notify).toHaveBeenCalledWith(
        'session-assessment: no named sessions found for this project',
        'warning',
      );
      expect(select).not.toHaveBeenCalled();
    });

    it('does nothing when the selection is cancelled', async () => {
      const { ctx, pi, select, sendUserMessage } = setup(undefined);

      await handleSessionAssessment({ ctx, pi });

      expect(select).toHaveBeenCalledWith('Select a session to assess', ['My session']);
      expect(buildTranscript).not.toHaveBeenCalled();
      expect(sendUserMessage).not.toHaveBeenCalled();
    });

    it('reports a selection that cannot be resolved', async () => {
      const { ctx, pi, notify, sendUserMessage } = setup('Unknown');

      await handleSessionAssessment({ ctx, pi });

      expect(notify).toHaveBeenCalledWith(
        'session-assessment: could not resolve the selected session',
        'error',
      );
      expect(sendUserMessage).not.toHaveBeenCalled();
    });

    it('writes the transcript and runs the assessment skill on it', async () => {
      const { ctx, pi, sendUserMessage } = setup('My session');

      await handleSessionAssessment({ ctx, pi });

      expect(buildTranscript).toHaveBeenCalledWith('/s1.jsonl');
      expect(writeTranscriptFile).toHaveBeenCalledWith({
        sessionId: 's1',
        sessionName: 'My session',
        sessionCwd: '/cwd',
        transcript: 'transcript',
      });
      expect(sendUserMessage).toHaveBeenCalledWith(
        '/skill:assessment /tmp/transcript.md',
        { expandPromptTemplates: true },
      );
    });
  });
});
