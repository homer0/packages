import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from '@earendil-works/pi-coding-agent';
import { buildTranscript, listAssessableSessions, writeTranscriptFile } from './utils.js';

/** The name of the command. */
const CMD = 'session-assessment';

/** Options for {@link handleSessionAssessment}. */
export type HandleSessionAssessmentOptions = {
  /** The context of the command. */
  ctx: ExtensionCommandContext;
  /** The Pi extension API. */
  pi: ExtensionAPI;
};

/**
 * Handles `/session-assessment`: lists named sessions, lets the user pick one, extracts
 * its transcript to a temp file, and runs the `assessment` skill against that file.
 *
 * @param options The context and the Pi API.
 */
export const handleSessionAssessment = async ({
  ctx,
  pi,
}: HandleSessionAssessmentOptions): Promise<void> => {
  const entries = await listAssessableSessions(ctx);

  if (entries.length === 0) {
    ctx.ui.notify(`${CMD}: no named sessions found for this project`, 'warning');
    return;
  }

  const displayToEntry = new Map(entries.map((entry) => [entry.display, entry]));
  const choice = await ctx.ui.select(
    'Select a session to assess',
    entries.map((entry) => entry.display),
  );
  if (typeof choice === 'undefined') return;

  const entry = displayToEntry.get(choice);
  if (!entry) {
    ctx.ui.notify(`${CMD}: could not resolve the selected session`, 'error');
    return;
  }

  const transcript = await buildTranscript(entry.session.path);
  const tempFilePath = await writeTranscriptFile({
    sessionId: entry.session.id,
    sessionName: entry.session.name,
    sessionCwd: entry.session.cwd,
    transcript,
  });

  pi.sendUserMessage(`/skill:assessment ${tempFilePath}`, {
    expandPromptTemplates: true,
  });
};
